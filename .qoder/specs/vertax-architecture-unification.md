# Vertax + Tower 统一架构方案

> **一句话总结**: 采用 Gateway 架构，Tower 和 Vertax 保持两个独立 Vercel 项目，通过共享 JWT 认证和子域名路由实现统一系统。零功能丢失，渐进式集成。

## 推荐方案: Gateway Architecture (网关架构)

**核心思路**: 保持 vertax (Express+MongoDB) 和 Tower (Next.js+PostgreSQL) 为两个独立服务，通过共享 JWT 认证和 API 通信形成统一系统。Tower 作为管理入口，Vertax 作为客户工作台。

**选择理由**:
- **零功能丢失** - vertax 101+ API 端点和 19 个组件全部保留
- **最低风险** - 两个已运行系统各自独立，增量集成
- **快速上线** - 无需重写任何现有代码

**否决的方案**:
- 单体合并 (Option A): 需重写 101+ Express 端点到 Next.js，工作量巨大，高风险
- 微前端 (Option C): iframe 限制多，Module Federation 不稳定
- Next.js 代理 (Option D): 增加复杂度，仍需双数据库

---

## 部署环境

- **Tower**: Vercel (Next.js) - 已部署
- **Vertax**: Vercel (Express via Serverless Functions) - 已部署
- **路由方案**: 子域名路由

---

## 统一架构设计

### 路由策略: 子域名路由 (Vercel 双项目)

```
tower.vertax.top       -> Tower Vercel 项目 (outbound-admin)
*.vertax.top           -> Vertax Vercel 项目 (/-/ 目录)
  tdpaintcell.vertax.top -> 涂豆科技实例
  acme.vertax.top        -> ACME 公司实例
  app.vertax.top         -> 默认入口 (可选)
```

### Vercel 域名配置

**Tower 项目 (outbound-admin)**:
- 在 Vercel Dashboard -> Settings -> Domains 添加 `tower.vertax.top`

**Vertax 项目**:
- 添加通配符域名 `*.vertax.top` (需要 Vercel Pro 计划)
- 或者逐个添加: `tdpaintcell.vertax.top`, `acme.vertax.top` 等

**DNS 配置** (在域名注册商处):
```
tower.vertax.top    CNAME  cname.vercel-dns.com
*.vertax.top        CNAME  cname.vercel-dns.com
```

**SSL**: Vercel 自动为所有域名配置 Let's Encrypt 证书

### 认证统一: 共享 JWT

```
JWT_SECRET = 两个项目共享同一密钥
JWT Payload = { userId, tenantId, role, iss: "vertax.top" }
登录流: 访问子域名 -> 重定向 tower.vertax.top/login -> 认证 -> 跨域 Cookie (.vertax.top) -> 回到子域名
```

### 数据库策略: 双数据库 + Webhook 同步

```
Tower (PostgreSQL):  Tenant/User/Role 为权威源, 社媒 OAuth, SEO 审计
Vertax (MongoDB):    所有业务数据 (Product/Lead/Content/Knowledge 等)
同步: Tower 创建/更新 Tenant -> Webhook 通知 Vertax -> MongoDB 镜像更新
```

---

## 分阶段实施计划

### Phase 1: JWT 认证互通 + 子域名路由

**目标**: 两个系统共享认证，子域名可以访问对应租户

**Step 1.1 - Vercel 域名配置**:
- Tower 项目添加域名 `tower.vertax.top`
- Vertax 项目添加通配符 `*.vertax.top` (Pro 计划) 或逐个添加子域名
- DNS 配置 CNAME 记录指向 `cname.vercel-dns.com`
- 等待 SSL 证书自动生效

**Step 1.2 - 共享 JWT 密钥**:
- 在两个 Vercel 项目的环境变量中设置相同的 JWT_SECRET
- Tower: Vercel Dashboard -> Settings -> Environment Variables
- Vertax: 同样方式设置

**Step 1.3 - 修改文件**:

1. `/-/middleware/auth.ts` - 更新 JWT 验证逻辑，支持 Tower 签发的 JWT
   - 改共享 JWT_SECRET 环境变量
   - 增加子域名 -> tenantSlug 解析
   - 验证 JWT 后从 subdomain 确定 tenantId

2. `/src/lib/auth.config.ts` - NextAuth JWT callback 中生成兼容格式的 token
   - JWT payload 增加统一字段 (iss, aud)

3. 新建 `/src/lib/jwt-bridge.ts` - 跨平台 JWT 工具
   - `generateCrossPlatformJWT(user, tenant)` 
   - `verifyCrossPlatformJWT(token)`

4. `/src/app/[locale]/(auth)/login/page.tsx` - 支持 `?redirect=` 参数
   - 登录成功后设置跨域 Cookie (domain=.vertax.top)
   - 重定向回来源子域名

**Vercel 注意事项**:
- Vercel Serverless Functions 中 Cookie 的 `domain` 设置需要在 Response headers 中手动指定
- 跨子域名 Cookie 需要 `SameSite=None; Secure` 属性

### Phase 2: Tower 管理 Vertax 租户

**目标**: 在 Tower 创建租户时自动在 Vertax 侧创建对应实例

**修改文件**:

1. `/src/actions/admin.ts` - 增加 `provisionVertaxInstance()`
   - 创建 PostgreSQL Tenant 记录
   - 调用 Vertax API 同步到 MongoDB
   - 返回客户访问链接 `https://{slug}.vertax.top`

2. `/src/app/[locale]/(dashboard)/admin/tenants/[id]/page.tsx` - 增强详情页
   - 显示 Vertax 实例链接
   - 实时拉取 Vertax 业务数据统计 (产品数/Lead 数/内容数)

3. 新建 `/-/api/admin/sync-tenant` (Vertax 侧) - 接收 Tower 推送
   - 验证 Admin API Key
   - 在 MongoDB 创建/更新 Tenant + 默认 User

4. `/src/components/admin/create-tenant-dialog.tsx` - UI 增强
   - 创建成功后显示访问链接和初始凭证

### Phase 3: Vertax 多租户 UI 适配

**目标**: Vertax 前端根据子域名加载对应租户数据

**修改文件**:

1. `/-/App.tsx` - 移除硬编码的涂豆科技数据
   - 启动时从 `/api/tenant/current` 加载当前租户信息
   - 动态显示租户名称/Logo

2. `/-/components/Sidebar.tsx` - 动态显示当前租户信息
   - 从 API 加载租户名称替代硬编码

3. `/-/server.ts` - 增加子域名识别
   - 请求进入时解析 Host header -> 提取 subdomain -> 查找 Tenant
   - 所有 API 自动注入 tenantId

### Phase 4: 数据同步机制

**目标**: 确保 Tower 和 Vertax 之间的 Tenant/User 数据一致

**新增文件**:

1. 新建 `/-/services/tenant-sync.ts` - 定期校验同步
   - Cron: 每小时从 Tower API 拉取租户列表
   - 对比 MongoDB 中的 Tenant，修复差异

2. `/src/actions/admin.ts` - 在更新 Tenant 状态时触发 Webhook
   - 暂停/激活租户 -> 通知 Vertax 更新状态
   - 删除租户 -> 通知 Vertax 软删除

3. 新建 `/-/api/webhooks/tenant-update` - 接收状态变更

### Phase 5: 功能打通

**目标**: Vertax 的社媒发布、SEO 审计等功能通过 Tower API 执行

**修改文件**:

1. `/-/components/SocialPresence.tsx` - 社媒发布调用 Tower API
   - 发布请求路由到 Tower (拥有 Facebook/X OAuth tokens)
   - Vertax 保留社媒 UI 和编辑功能

2. 新建 `/src/app/api/social/external-publish/route.ts` (Tower 侧)
   - 接受 Vertax 的发布请求 (验证 JWT + tenantId)
   - 使用 Tower 的 SocialAccount OAuth tokens 发布

---

## 关键架构决策

### 为什么不合并数据库?
- MongoDB 的文档型结构适合 vertax 的复杂嵌套数据 (Company 的 4D 评分、知识卡片嵌套)
- 强制迁移到 PostgreSQL 需要重写所有 Mongoose 查询，风险大
- 双数据库短期内完全可行，长期可选择性迁移

### 为什么选子域名而非路径?
- 子域名隔离更彻底 (Cookie scope, CORS 配置)
- 符合 SaaS 行业标准 (Shopify, Notion, Linear 都用子域名)
- 允许每个租户独立的 SSL/CDN 配置

### Vertax 已有多租户支持
- 所有 18 个 MongoDB 模型都有 tenantId 字段
- auth middleware 已实现 tenantId 注入和验证
- 只需补充"从子域名获取 tenantId"的逻辑

---

## 验证方案

### Phase 1 验证
1. 在 Tower 登录 -> 访问 tdpaintcell.vertax.top -> 自动认证成功
2. 在 Vertax 调用 API -> JWT 中 tenantId 正确 -> 数据隔离正常
3. 未登录访问子域名 -> 重定向到 Tower 登录页

### Phase 2 验证
1. 在 Tower 创建新租户 "acme" -> Vertax 侧自动创建 MongoDB Tenant
2. 访问 acme.vertax.top -> 空白实例可用
3. Tower 详情页显示 Vertax 实例的实时统计数据

### Phase 3 验证
1. 涂豆实例 (tdpaintcell.vertax.top) 显示涂豆名称和数据
2. ACME 实例 (acme.vertax.top) 显示 ACME 名称和空数据
3. 所有 6 个模块正常工作，API 数据正确隔离

### Phase 4 验证
1. Tower 暂停租户 -> Vertax 侧 5 秒内生效 -> 该子域名返回 403
2. Tower 激活租户 -> Vertax 恢复正常
3. Cron 校验无数据差异

### Phase 5 验证
1. 在 Vertax 发布社媒内容 -> 调用 Tower API -> Facebook/X 实际发布成功
2. Tower SEO 审计报告可在 Vertax 中查看
