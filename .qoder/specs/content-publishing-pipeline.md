# Content Publishing Pipeline: Vertax -> 客户独立站

## 目标

将 Vertax 中台审批通过的营销内容推送到客户独立站（首个客户：tdpaintcell.com / Supabase），并实现 24 小时未审核内容自动升级机制。

## 架构概览

```
Vertax 中台                              客户独立站 (paintcell)
┌──────────────────┐                    ┌──────────────────────┐
│ ContentAsset     │   审批通过后推送    │ Supabase Edge Func   │
│ status=published ├───────────────────>│ receive-content-push │
│                  │   HTTPS POST       │       ↓              │
│ PushRecord       │<── 推送结果 ──────│ resources_posts      │
│ status=pending   │                    │ status='review'      │
└──────┬───────────┘                    └──────────────────────┘
       │
       │ 24h 超时
       ▼
┌──────────────────┐
│ PushRecord       │
│ status=timeout   │  → 前端告警 (当前阶段)
│                  │  → Tower 工单 (未来阶段)
└──────────────────┘
```

## Phase 1: 单客户 MVP（本次实施范围）

### Step 1: Paintcell Supabase 新增 Edge Function

**新建文件**: `paintcell/supabase/functions/receive-content-push/index.ts`

参照 `send-quote-notification/index.ts` 的模式：
- CORS headers
- `SUPABASE_SERVICE_ROLE_KEY` 创建 admin client
- `VERTAX_PUSH_SECRET` 环境变量验证请求来源

逻辑：
1. 验证 `Authorization: Bearer {secret}` header
2. 验证 payload 必填字段 (title, slug, body)
3. 通过 `vertax_asset_id` 做 UPSERT（防重复推送）
4. 写入 `resources_posts` 表，status 固定为 `review`（不直接发布）
5. 返回 `{ success: true, id, slug }`

### Step 2: Paintcell Supabase 数据库迁移

**新建文件**: `paintcell/supabase/migrations/20260301_add_vertax_push_fields.sql`

给 `resources_posts` 表新增：
- `vertax_asset_id TEXT UNIQUE` — 溯源和幂等去重
- `featured_image_url TEXT` — 配图（如果不存在）

> 注：`body_zh`, `summary_zh`, `meta_title_zh`, `meta_description_zh` 等中文字段已存在，无需新增。

### Step 3: Vertax 新建 ClientSiteConfig 模型

**新建文件**: `ryan823-project/models/ClientSiteConfig.ts`

```
ClientSiteConfig {
  productSlug: string        // 关联 Product.slug，如 "tdpaintcell"
  clientName: string         // "涂豆科技"
  siteType: 'supabase'      // 未来扩展 'wordpress' | 'custom'

  supabaseConfig: {
    projectUrl: string       // "https://xxx.supabase.co"
    functionName: string     // "receive-content-push"
    pushSecret: string       // 加密存储的 shared secret
  }

  fieldMapping: {
    titleField: string       // "title"
    titleZhField: string     // "title_zh"
    bodyField: string        // "body"
    bodyZhField: string      // "body_zh"
    slugField: string        // "slug"
    statusField: string      // "status"
    pushStatus: string       // "review"
    sourceIdField: string    // "vertax_asset_id"
  }

  approvalTimeoutHours: number  // 24
  isActive: boolean
}
```

### Step 4: Vertax 新建 PushRecord 模型

**新建文件**: `ryan823-project/models/PushRecord.ts`

```
PushRecord {
  assetId: ObjectId          // 关联 ContentAsset
  productSlug: string
  status: 'pending' | 'confirmed' | 'timeout' | 'failed' | 'escalated'
  targetUrl: string          // 独立站上的 URL
  remoteId: string           // 独立站返回的记录 ID
  pushedAt: Date
  timeoutAt: Date            // pushedAt + approvalTimeoutHours
  confirmedAt: Date
  escalatedAt: Date
  retryCount: number
  lastError: string
}
```

### Step 5: 完善 SupabasePublisherAdapter

**修改文件**: `ryan823-project/lib/publisher.ts`

- `SupabasePublisherAdapter` 构造函数接收 `ClientSiteConfig`
- 实现 `publishContent(asset)`:
  1. 从 config 读取 Supabase Function URL 和 secret
  2. 映射 ContentAsset 字段到目标表字段
  3. POST 到 Edge Function
  4. 返回 PublisherResult

- 新增 `PublisherAdapterFactory`:
  ```
  static async create(productSlug: string): Promise<PublisherAdapter>
  ```
  从 MongoDB 查 ClientSiteConfig，返回对应 Adapter

### Step 6: 字段映射逻辑

**新建文件**: `ryan823-project/lib/push-pipeline/field-mapper.ts`

ContentAsset → resources_posts 映射：

| Vertax 字段 | Paintcell 字段 | 规则 |
|---|---|---|
| title | title | 直接映射 |
| title (如有中文版) | title_zh | 语言判断 |
| slug | slug | 直接映射，冲突追加 -v{version} |
| body (en) | body | 直接映射 |
| body (zh) | body_zh | 语言判断 |
| metaTitle | meta_title | 直接映射 |
| metaDescription | meta_description | 直接映射 |
| body 前200字 | summary | 截取或 AI 生成 |
| contentType | category | blog-article→learning-center, technical-doc→tools-templates |
| _id | vertax_asset_id | 溯源 |
| 固定 'review' | status | 推送时不直接发布 |

### Step 7: 修改发布端点

**修改文件**: `ryan823-project/server.ts` (第 3232 行附近)

在 `POST /api/seo/content/:id/publish` 中：
1. 现有逻辑保持不变（更新 ContentAsset 状态、publishedChannels）
2. 新增：当 channel 为 'website' 时：
   - 查找关联产品的 ClientSiteConfig
   - 调用 PublisherAdapter.publishContent()
   - 创建 PushRecord（status=pending, timeoutAt=now+24h）
3. 返回 pushResult 信息

### Step 8: 新增推送管道 API

**修改文件**: `ryan823-project/server.ts`

新增端点：
- `GET /api/push-records` — 查询推送记录（支持 status 筛选）
- `POST /api/push-records/:id/confirm` — 手动确认已发布
- `GET /api/push-records/timeout` — 获取超时记录

### Step 9: 24 小时超时定时任务

**新建文件**: `ryan823-project/services/push-timeout-checker.ts`

- 使用 `node-cron`（已在 dependencies 中）
- 每 30 分钟执行一次
- 查询 `PushRecord.status=pending AND timeoutAt < now`
- 将超时记录更新为 `status=timeout`
- 在 server.ts 启动时初始化定时任务

### Step 10: 前端推送状态展示

**修改文件**: `ryan823-project/components/PromotionHub.tsx`

在推进中台增加"推送状态"视图：
- 展示所有 PushRecord
- pending：绿色，显示剩余时间
- timeout：红色告警，提供"手动确认"和"重新推送"按钮
- confirmed：灰色，已完成

## 关键文件清单

### 新建文件
| 文件 | 项目 | 说明 |
|------|------|------|
| `models/ClientSiteConfig.ts` | ryan823-project | 客户站点配置模型 |
| `models/PushRecord.ts` | ryan823-project | 推送记录模型 |
| `lib/push-pipeline/field-mapper.ts` | ryan823-project | 字段映射 |
| `services/push-timeout-checker.ts` | ryan823-project | 超时定时任务 |
| `supabase/functions/receive-content-push/index.ts` | paintcell | 接收推送的 Edge Function |
| `supabase/migrations/20260301_add_vertax_push_fields.sql` | paintcell | 数据库迁移 |

### 修改文件
| 文件 | 说明 |
|------|------|
| `ryan823-project/lib/publisher.ts` | 完善 SupabasePublisherAdapter + 工厂类 |
| `ryan823-project/server.ts` | 发布端点接入推送 + 新增推送管道 API |
| `ryan823-project/components/PromotionHub.tsx` | 增加推送状态视图 |
| `ryan823-project/models/index.ts` | 导出新模型 |

### 新增环境变量
| 变量 | 项目 | 说明 |
|------|------|------|
| `ENCRYPTION_KEY` | ryan823-project (.env) | AES 加密客户 secret |
| `VERTAX_PUSH_SECRET` | paintcell (Supabase Secrets) | Edge Function 验证密钥 |

## 验证方案

### 端到端测试流程
1. 启动 Vertax 服务器 `npm run dev`
2. 在 MongoDB 手动插入一条 ClientSiteConfig（productSlug=tdpaintcell, 指向 paintcell Supabase）
3. 通过 API 创建一篇 ContentAsset 并发布：
   ```
   POST /api/seo/content/{id}/publish
   Body: { "channel": "website" }
   ```
4. 验证：
   - Vertax: PushRecord 创建成功，status=pending
   - Paintcell Supabase: resources_posts 表新增一行，status=review
   - Paintcell /console: 管理后台可见新内容
5. 等待或手动触发超时检查：
   - PushRecord.status 变为 timeout
   - PromotionHub 显示超时告警

### 单元验证
- field-mapper: 测试各种 contentType 到 category 的映射
- publisher: 模拟 Supabase 响应，验证重试逻辑
- timeout-checker: 验证超时状态转换

## 未来扩展（不在本次范围）
- **Tower 运营后台**: vertax.top 管理界面，接收超时工单
- **多客户**: 第二个客户接入时验证 ClientSiteConfig 抽象
- **Webhook 回写**: paintcell 发布后自动回调 Vertax 确认
- **WordPress 适配器**: 支持 WordPress REST API 的客户站点
