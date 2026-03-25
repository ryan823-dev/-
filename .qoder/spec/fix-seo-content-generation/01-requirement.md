# 需求文档：修复 SEO 内容生成管线

## 1. 需求概述

修复 `POST /api/seo/content/generate` 端点因 Mongoose 9 pre-save hook 兼容性问题导致的 "next is not a function" 错误，恢复 SEO 内容生成工作流的正常使用。

---

## 2. 问题描述

### 2.1 当前表现

- 调用 `POST /api/seo/content/generate` 返回 500 错误
- 错误信息：`"next is not a function"`
- 整个 SEO 内容生成工作流不可用，无法创建任何 ContentAsset 记录

### 2.2 期望行为

- 接口正常接受 `targetKeywords` 等参数
- 调用 DashScope AI API 生成结构化内容
- 成功将 ContentAsset 持久化到 MongoDB
- 更新关联 ContentPlan 状态为 `draft`
- 返回生成内容的完整 JSON 响应

### 2.3 根因分析（代码已核查）

**根因：Mongoose 9 pre-save hook 不兼容写法**

文件：`/Users/oceanlink/Documents/Qoder-1/-/models/ContentAsset.ts`，第 179 行：

```typescript
// 当前代码（错误）
ContentAssetSchema.pre('save', function(this: IContentAsset, next: Function) {
  // ... 同步逻辑 ...
  next();  // Mongoose 9 中同步 hook 不再接受 next 参数，调用时 next 为 undefined
});
```

Mongoose 9 对 pre-save hook 的调用约定发生变化：
- **同步 hook**（无异步操作）：函数签名不应包含 `next` 参数，Mongoose 9 不再传入该回调
- **异步 hook**：应改用 `async function()` 并通过 `return` 或 `throw` 控制流程
- 当前 hook 内部全为同步操作（slug 生成、字段同步），不需要 `next` 回调

**执行链路**：
```
POST /api/seo/content/generate
  → generateAIContent() (DashScope API)
  → ContentAsset.create({...})
    → pre('save') hook 触发
      → next() 被调用，但 next 为 undefined
      → TypeError: next is not a function
  → 500 错误返回
```

---

## 3. 修复范围

### 3.1 修复项 F1（必须修复）— Mongoose 9 Pre-save Hook

| 属性 | 详情 |
|------|------|
| **文件** | `/Users/oceanlink/Documents/Qoder-1/-/models/ContentAsset.ts` |
| **位置** | 第 179-196 行 |
| **变更类型** | 修改函数签名，移除 `next` 参数和 `next()` 调用 |

**修复方案**：将带 `next` 回调的同步 hook 改为无参数的同步 hook（Mongoose 9 推荐写法）：

```typescript
// 修复后
ContentAssetSchema.pre('save', function(this: IContentAsset) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  }
  if (this.isModified('body') && this.body) {
    this.draftBody = this.body;
  }
  if (this.isModified('secondaryKeywords') && this.secondaryKeywords?.length) {
    this.keywords = [this.focusKeyword, ...this.secondaryKeywords].filter(Boolean) as string[];
  }
});
```

### 3.2 修复项 F2（已排除）— Express 错误处理器位置

**核查结论：问题不存在**

经代码核查，`/Users/oceanlink/Documents/Qoder-1/-/server.ts` 中：
- 全局 error handler 位于第 3992 行（`app.use((err: any, req: any, res: any, next: any) => {...})`）
- 文件总行数 4021 行，error handler 之后仅有本地开发 Vite 中间件配置（非 API 路由）
- 背景信息中提到的 `/api/push-records`、`/api/client-sites` 路由在当前文件中不存在
- **错误处理器位置正确，无需修改**

### 3.3 配置项 C1（运维确认）— Vercel 环境变量

| 属性 | 详情 |
|------|------|
| **变量名** | `DASHSCOPE_API_KEY` |
| **配置位置** | Vercel Dashboard → Project Settings → Environment Variables |
| **当前状态** | 本地 `.env` 已配置，Vercel 生产环境需人工确认 |
| **影响** | 若未配置，AI 内容生成步骤将抛出 "API key not configured" 错误 |

---

## 4. 技术约束

- 技术栈：Express 5.2.1 + Mongoose 9.2.2 + TypeScript
- 编译链：esbuild 将 `server.ts` 编译为 `api/index.mjs` 部署到 Vercel
- 修改后需重新编译并部署才能生效
- 不得引入新依赖

---

## 5. 测试计划

### 5.1 测试策略

该修复属于单点 API 修复，核心验证通过集成测试完成（直接调用端点验证完整执行链路）。

### 5.2 自动化测试范围

**是否需要自动化测试**：否（此为 bug 修复，通过手动端点调用验证更直接高效）

| 测试级别 | 是否需要 | 说明 |
|----------|----------|------|
| 单元测试 (UT) | 否 | Hook 行为通过集成调用隐式覆盖 |
| 集成测试 (IT) | 否 | 手动 curl/Postman 验证更快 |
| E2E 测试 (E2E) | 否 | 已有前端 UI 可直接验证 |

### 5.3 关键验证场景

| 场景 | 输入 | 期望结果 |
|------|------|----------|
| 正常生成 | `{ targetKeywords: ["SEO automation"], focusKeyword: "SEO automation", contentType: "blog-article", language: "en" }` | HTTP 200，返回含 `title`、`body`、`metaTitle`、`metaDescription` 的 JSON |
| 缺少必填参数 | `{}` 或 `{ targetKeywords: [] }` | HTTP 400，`{ error: "targetKeywords are required" }` |
| API Key 未配置 | 删除 `DASHSCOPE_API_KEY` | HTTP 500，`{ error: "API key not configured..." }` |
| ContentAsset 持久化 | 正常请求 | MongoDB 中可查到新记录，`status: "draft"` |
| ContentPlan 联动 | 请求含有效 `contentPlanId` | 对应 ContentPlan 的 `status` 更新为 `"draft"` |

### 5.4 验收标准

- [ ] `POST /api/seo/content/generate` 返回 HTTP 200 及完整内容 JSON
- [ ] 返回 JSON 中包含 `title`、`body`、`metaTitle`、`metaDescription` 字段
- [ ] MongoDB `ContentAsset` 集合中新增对应记录
- [ ] 无 `TypeError: next is not a function` 报错
- [ ] 其他使用 `ContentAsset.save()` 的端点（如 `PUT /api/seo/content/:id`）同样正常工作
- [ ] Vercel 生产环境测试通过（依赖 C1 环境变量配置）

---

## 复杂度评估

**复杂度：Low**

**评估依据**：

- 修复点数量：1 个（仅 `ContentAsset.ts` 第179行）
- 涉及范围：局部修改，单文件单处改动
- 技术难度：有明确的 Mongoose 9 迁移规范可参考，改动为去除 `next` 参数和调用
- 一次完成信心：**高** — 根因明确，修复方案清晰，无需新设计，且 hook 内部全为同步逻辑

**建议**：复杂度低，根因和修复方案均已明确，可直接进入编码阶段。
