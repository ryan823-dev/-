# Vertax 多租户 SaaS 升级计划

## 背景

Vertax 出海拓客智能体当前是**单租户原型**，仅服务涂豆一家客户。要支撑多企业客户（每家上传 GB 级资料），需要从架构层面系统性升级。

### 当前问题
- MongoDB 14 个模型无 `tenantId`，数据不隔离
- Express API 80+ 端点无认证，任何人可访问任何数据
- 文件上传用 `multer.memoryStorage()`，50MB 上限，不持久化
- 文档解析 100KB 截断，大型技术手册信息丢失
- AI 调用同步无队列，大文件处理超时
- Gemini 限流存进程内存，重启丢失

### 用户技术选型
| 组件 | 选型 | 理由 |
|------|------|------|
| 文件存储 | **阿里云 OSS** | 国内访问快，适合客户场景 |
| 向量检索 | **Supabase pgvector** | 已有 Supabase 基础设施，无需新服务 |
| 任务队列 | **Vercel Serverless + DB 队列** | 无需额外基础设施，Cron 触发 |

---

## Phase 1: 多租户基础架构

**目标**: 所有数据租户隔离，API 认证保护

### 1.1 新建 Tenant 和 User 模型

**新建文件**: `-/models/Tenant.ts`
```
Tenant {
  name, slug (unique), plan ('free'|'pro'|'enterprise'),
  status ('active'|'suspended'),
  quotas: { storageGB, documents, apiCallsPerMin, aiTokensPerMonth },
  createdAt, updatedAt
}
```

**新建文件**: `-/models/User.ts`（MongoDB 版，用于 Express 后端）
```
User {
  email (unique per tenant), passwordHash,
  tenantId (ref Tenant, required, indexed),
  role ('owner'|'admin'|'member'),
  lastLoginAt, createdAt, updatedAt
}
```

### 1.2 JWT 认证中间件

**新建文件**: `-/middleware/auth.ts`
- 验证 `Authorization: Bearer <jwt>` 头
- 解码 JWT payload: `{ userId, tenantId, role }`
- 注入 `req.tenant` 和 `req.user` 到请求对象
- 白名单路由: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/health`

**新建文件**: `-/middleware/tenant-context.ts`
- 从 `req.tenant._id` 自动附加 `tenantId` 到查询条件
- 提供 helper: `withTenant(req, query)` → `{ ...query, tenantId: req.tenant._id }`

### 1.3 所有 14 个 MongoDB 模型添加 tenantId

**修改文件** (每个模型统一改造):
- `models/Product.ts` - 添加 `tenantId: ObjectId, required, indexed`
- `models/LeadRun.ts` - 同上
- `models/Company.ts` - 同上 + 复合索引 `{ tenantId: 1, leadRunId: 1 }`
- `models/KeywordCluster.ts` - 同上
- `models/ContentPlan.ts` - 同上
- `models/ContentAsset.ts` - 同上 + 复合索引 `{ tenantId: 1, slug: 1 }`
- `models/DerivedContent.ts` - 同上
- `models/SocialPost.ts` - 同上
- `models/SocialAccount.ts` - 同上
- `models/SocialMetric.ts` - 同上
- `models/ApiIntegration.ts` - 同上 (去掉 provider 全局唯一约束，改为 `{ tenantId, provider }` 复合唯一)
- `models/PRArticle.ts` - 同上
- `models/ClientSiteConfig.ts` - 同上 + `{ tenantId, productSlug }` 复合唯一
- `models/PushRecord.ts` - 同上

### 1.4 API 端点改造

**修改文件**: `-/server.ts`（80+ 个端点）

统一模式：
```typescript
// 之前
const products = await ProductModel.find();

// 之后
const products = await ProductModel.find({ tenantId: req.tenant._id });
```

所有 CRUD 操作统一改造：
- `find()` → `find({ tenantId })`
- `findById(id)` → `findOne({ _id: id, tenantId })` （防止越权访问）
- `create({...})` → `create({ ...data, tenantId })`
- `findByIdAndUpdate(id)` → `findOneAndUpdate({ _id: id, tenantId })`
- `findByIdAndDelete(id)` → `findOneAndDelete({ _id: id, tenantId })`

### 1.5 数据迁移脚本

**新建文件**: `-/scripts/migrate-add-tenant-ids.ts`
1. 创建默认租户 "涂豆" (Legacy Tenant)
2. 批量更新所有现有记录添加 `defaultTenantId`
3. 创建索引
4. 验证数据完整性

### 1.6 登录/注册端点

**修改文件**: `-/server.ts`（添加认证端点）
- `POST /api/auth/register` - 创建租户 + 管理员用户
- `POST /api/auth/login` - 验证凭据，返回 JWT
- `POST /api/auth/refresh` - 刷新 JWT
- `GET /api/auth/me` - 获取当前用户信息

### 验证方法
- 无 JWT 访问 → 401
- Tenant A 的 JWT 访问 → 只看到 Tenant A 的数据
- Tenant B 的 JWT 访问 → 完全隔离

---

## Phase 2: 阿里云 OSS 文件持久化

**目标**: 文件上传持久化到 OSS，按租户目录隔离

### 2.1 OSS 客户端

**新建文件**: `-/lib/storage/oss-client.ts`
- 封装 `ali-oss` SDK: upload, download, delete, getSignedUrl
- 路径模板: `{tenantId}/documents/{year}/{month}/{fileId}.{ext}`

**安装依赖**: `npm install ali-oss`

### 2.2 文件元数据模型

**新建文件**: `-/models/FileMetadata.ts`
```
FileMetadata {
  tenantId, filename, originalName, mimeType, size,
  ossPath, category ('document'|'image'|'derived'),
  status ('uploading'|'ready'|'processing'|'failed'|'deleted'),
  metadata: { pageCount?, format?, parsedAt?, chunkCount? },
  uploadedBy, createdAt, updatedAt
}
```

### 2.3 端点改造

**修改文件**: `-/server.ts`

新端点：
- `POST /api/files/upload` - 上传到 OSS，创建 FileMetadata
- `GET /api/files` - 列表（按租户隔离）
- `GET /api/files/:id` - 获取元数据 + 签名下载 URL
- `DELETE /api/files/:id` - 软删除

改造旧端点：
- `POST /api/knowledge/parse-document` - 先存 OSS，再异步解析（Phase 3 对接）

### 2.4 配额检查

**新建文件**: `-/middleware/quota-check.ts`
- 上传前检查租户存储配额
- 超限返回 402

### 2.5 环境变量

```env
OSS_REGION=oss-cn-shanghai
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET_NAME=vertax-files
OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com
```

### 验证方法
- 上传 PDF → OSS 路径 `{tenantId}/documents/2026/03/{fileId}.pdf`
- 获取签名 URL → 可直接下载
- 不同租户文件隔离在不同 OSS 目录

---

## Phase 3: 异步文档处理管线

**目标**: 大文件分块解析，后台队列处理，突破 100KB 和 60 秒限制

### 3.1 任务队列模型

**新建文件**: `-/models/TaskQueue.ts`
```
TaskQueue {
  tenantId, type ('parse_document'|'generate_embeddings'|'ai_generation'),
  status ('pending'|'processing'|'completed'|'failed'),
  priority (0-100), payload (Mixed),
  result (Mixed), error (String),
  retryCount, maxRetries (default 3),
  scheduledAt, startedAt, completedAt,
  createdAt, updatedAt
}
索引: { status: 1, priority: -1, scheduledAt: 1 }
```

### 3.2 文档分块器

**新建文件**: `-/lib/document-processing/chunker.ts`
- PDF: 按页分块（每块 20 页）
- DOCX: 按段落分块（每块 ~8000 字符，保留语义完整性）
- XLSX: 按 sheet 分块
- 每块记录 chunkIndex, pageRange, wordCount

**新建文件**: `-/models/DocumentChunk.ts`
```
DocumentChunk {
  tenantId, fileId, chunkIndex,
  text (String, 无长度限制),
  metadata: { pageRange?, wordCount?, sheetName? },
  embeddingStatus ('pending'|'completed'),
  createdAt
}
```

### 3.3 任务处理器

**新建文件**: `-/lib/queue/task-processor.ts`
- `parse_document`: 从 OSS 下载 → 分块 → 存入 DocumentChunk → 创建 embedding 任务
- `generate_embeddings`: 读取 DocumentChunk → 调用 DashScope Embedding API → 存入 pgvector
- `ai_generation`: 处理长时间 AI 生成任务

### 3.4 Vercel Cron 触发

**修改文件**: `-/vercel.json` - 添加 cron 配置
```json
{
  "crons": [{
    "path": "/api/cron/process-tasks",
    "schedule": "*/2 * * * *"
  }]
}
```

**新建文件**: `-/api/cron/process-tasks.ts`
- 验证 CRON_SECRET
- 查询 pending 任务 (limit 5, 按 priority 排序)
- 并发处理 (Promise.allSettled)
- 失败自动重试（指数退避）

### 3.5 前端轮询端点

**修改文件**: `-/server.ts`
- `GET /api/tasks/:id` - 查询任务状态/进度
- `GET /api/files/:id/chunks` - 获取已解析的文档块

### 验证方法
- 上传 50MB PDF → 任务入队 → 2 分钟内 Cron 触发处理
- 轮询任务状态 → processing → completed
- 获取文档块 → 完整文本（无 100KB 截断）
- 任务失败 → 自动重试 3 次

---

## Phase 4: 语义检索 (RAG)

**目标**: 文档向量化 + 语义搜索 + RAG 增强内容生成

### 4.1 Supabase pgvector 表

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1024),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_tenant_file ON document_embeddings(tenant_id, file_id);
```

### 4.2 Embedding 生成器

**新建文件**: `-/lib/embeddings/qwen-embedder.ts`
- 调用 DashScope `text-embedding-v3` API
- 批量处理（每批 10 条，减少 API 调用）
- 输出: 1024 维向量

**安装依赖**: `npm install @supabase/supabase-js`

### 4.3 语义搜索服务

**新建文件**: `-/lib/rag/semantic-search.ts`

```
输入: query (文本), tenantId, topK (默认 5)
流程:
1. 向量化 query → embedding_query
2. 查询 pgvector: ORDER BY embedding <=> $query LIMIT topK
3. 返回最相似的文档块 + 相似度分数
```

**修改文件**: `-/server.ts` - 新端点
- `POST /api/knowledge/semantic-search` - 语义搜索 API

### 4.4 RAG 增强内容生成

**修改文件**: `-/server.ts`（内容生成端点）

改造模式：
```
旧: prompt = "生成关于X的文章"
新: relevantChunks = semanticSearch(topic, tenantId)
    prompt = "参考知识库:\n{chunks}\n\n生成关于X的文章"
```

影响端点：
- `POST /api/seo/content/generate` - 注入 RAG 上下文
- `POST /api/knowledge/extract` - 可选搜索已有知识避免重复
- `POST /api/seo/keywords/extract-icp` - 用知识库数据增强 ICP 理解

### 验证方法
- 上传技术文档 → 后台自动向量化
- 搜索 "ISO 认证" → 返回相关段落（相似度 > 0.7）
- RAG 生成内容 → 引用了知识库中的具体数据
- 租户隔离 → Tenant A 搜不到 Tenant B 的文档

---

## Phase 5: 生产加固

**目标**: 限流、日志、监控、错误处理

### 5.1 API 限流

**新建文件**: `-/middleware/rate-limiter.ts`
- `express-rate-limit` + MongoDB 存储
- 按租户计划动态限流（enterprise: 100/min, pro: 50/min, free: 20/min）

### 5.2 全局错误处理

**新建文件**: `-/middleware/error-handler.ts`
- 统一错误响应格式: `{ error, code, requestId, timestamp }`
- 生产环境不返回堆栈信息

### 5.3 请求日志

**新建文件**: `-/middleware/request-logger.ts`
- 记录: tenantId, method, path, duration, status
- 结构化 JSON 日志

### 5.4 健康检查增强

**修改文件**: `-/server.ts`
- `GET /api/health` 返回: MongoDB / Supabase / OSS 连接状态 + 队列积压数

### 5.5 Gemini 限流持久化

**修改文件**: `-/server.ts`
- 将内存中的 `geminiUsage` 改为 MongoDB 存储（按租户按日计数）

### 验证方法
- 超过限流 → 429 Too Many Requests
- 触发错误 → 统一格式响应 + 日志记录
- 健康检查 → 各组件状态可见

---

## 实施顺序与依赖关系

```
Phase 1 (多租户) ──→ Phase 2 (OSS存储) ──→ Phase 3 (异步处理) ──→ Phase 4 (RAG) ──→ Phase 5 (加固)
   基础                  文件持久化              分块+队列               语义检索           生产就绪
```

每个 Phase 可独立部署和测试，Phase 1 完成后系统即可安全服务多客户。

---

## 关键文件清单

### 新建文件 (16个)
| 文件 | Phase | 用途 |
|------|-------|------|
| `middleware/auth.ts` | 1 | JWT 认证中间件 |
| `middleware/tenant-context.ts` | 1 | 租户上下文注入 |
| `models/Tenant.ts` | 1 | 租户模型 |
| `models/User.ts` | 1 | 用户模型 |
| `scripts/migrate-add-tenant-ids.ts` | 1 | 数据迁移脚本 |
| `lib/storage/oss-client.ts` | 2 | 阿里云 OSS 封装 |
| `models/FileMetadata.ts` | 2 | 文件元数据模型 |
| `middleware/quota-check.ts` | 2 | 配额检查 |
| `models/TaskQueue.ts` | 3 | 任务队列模型 |
| `models/DocumentChunk.ts` | 3 | 文档分块模型 |
| `lib/document-processing/chunker.ts` | 3 | 分块处理器 |
| `lib/queue/task-processor.ts` | 3 | 任务处理器 |
| `api/cron/process-tasks.ts` | 3 | Cron 触发器 |
| `lib/embeddings/qwen-embedder.ts` | 4 | 向量生成 |
| `lib/rag/semantic-search.ts` | 4 | 语义搜索 |
| `middleware/rate-limiter.ts` | 5 | API 限流 |

### 修改文件 (17个)
| 文件 | Phase | 改动 |
|------|-------|------|
| `models/Product.ts` | 1 | +tenantId |
| `models/LeadRun.ts` | 1 | +tenantId |
| `models/Company.ts` | 1 | +tenantId |
| `models/KeywordCluster.ts` | 1 | +tenantId |
| `models/ContentPlan.ts` | 1 | +tenantId |
| `models/ContentAsset.ts` | 1 | +tenantId |
| `models/DerivedContent.ts` | 1 | +tenantId |
| `models/SocialPost.ts` | 1 | +tenantId |
| `models/SocialAccount.ts` | 1 | +tenantId |
| `models/SocialMetric.ts` | 1 | +tenantId |
| `models/ApiIntegration.ts` | 1 | +tenantId |
| `models/PRArticle.ts` | 1 | +tenantId |
| `models/ClientSiteConfig.ts` | 1 | +tenantId |
| `models/PushRecord.ts` | 1 | +tenantId |
| `server.ts` | 1-5 | 认证中间件 + 端点改造 + 新端点 |
| `vercel.json` | 3 | +cron 配置 |
| `package.json` | 2 | +ali-oss, @supabase/supabase-js |
