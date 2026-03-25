# 修复：SEO 内容生成管线

> Spec 工件目录：`.qoder/spec/fix-seo-content-generation/`

## 问题

`POST /api/seo/content/generate` 端点报错 "next is not a function"，整个 SEO 内容生成工作流不可用。

## 根因分析（已核实 ryan823-project/ 目录）

**注意**：项目有两个目录 — `ryan823-project/`（正式工作目录，3486行）和 `-/`（旧备份，4021行）。以下分析基于正确的 `ryan823-project/`。

### F1：Mongoose 9 Pre-save Hook — 已修复，仅需验证
- **文件**：`ryan823-project/models/ContentAsset.ts` 第179行
- 当前代码：`function(this: IContentAsset)` — 无 `next` 参数 ✅
- 旧备份 `-/models/ContentAsset.ts` 仍为 `function(this: IContentAsset, next: Function)` — 未修复
- **结论**：正式代码已修复，这很可能已解决 "next is not a function" 根因
- **操作**：无需代码修改，运行时验证即可

### F2：Express 全局 Error Handler 位置错误 — 需修复
- **文件**：`ryan823-project/server.ts` 第3342-3346行
- Error handler 注册在第3343行
- Push Pipeline 路由（`/api/push-records/*`、`/api/client-sites/*`）定义在第3348-3459行（在 error handler **之后**）
- Express 中间件按注册顺序执行 → 这些路由的 unhandled error 无法被全局错误处理器捕获
- **操作**：将 error handler 移至所有 API 路由之后（第3459行之后）

### C1：Vercel 环境变量 — 运维确认
- `DASHSCOPE_API_KEY` 须在 Vercel Dashboard 配置
- 本地 `.env` 已配置，生产环境需人工确认

## 复杂度：Low
单文件改动（移动5行代码的位置），根因已明确。

## 实施步骤

### Step 1：移动 server.ts 中的 error handler

**删除**第3342-3346行（当前位置）：
```typescript
  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Express error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });
```

**插入**到第3460行（`app.put('/api/client-sites/:id')` 结束之后、Vite 中间件之前）：
```typescript
  // Global error handler - must be after all API routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Express error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });
```

修改后结构：
```
line 3459  →  }); // end of app.put('/api/client-sites/:id')
line 3460  →  (blank)
line 3461  →  // Global error handler - must be after all API routes
line 3462  →  app.use((err, req, res, next) => { ... });
line 3466  →  (blank)
line 3467  →  // --- Local Dev: Vite Middleware + Listen ---
```

### Step 2：确认 Vercel 环境变量

在 Vercel Dashboard → vertax.top → Settings → Environment Variables 确认：
- `DASHSCOPE_API_KEY` — AI 内容生成必需
- `MONGODB_URI` — 数据库连接必需

### Step 3：本地验证 + 构建部署

```bash
cd ryan823-project
tsx server.ts                     # 本地启动
curl -X POST http://localhost:3000/api/seo/content/generate \
  -H "Content-Type: application/json" \
  -d '{"targetKeywords":["industrial coating"],"focusKeyword":"industrial coating","contentType":"blog-article","language":"en"}'
node build-api.mjs                # 编译 API bundle
git add -A && git commit && git push  # 部署
```

## 修改文件清单

| 文件 | 变更 |
|------|------|
| `ryan823-project/server.ts` | 移动 error handler 从 line 3342 → line 3460 |

## 验证标准

1. `GET /api/health` 显示 `DASHSCOPE_API_KEY: configured`
2. `POST /api/seo/content/generate` 返回 200 + 完整内容 JSON（含 title, body, metaTitle, metaDescription）
3. MongoDB `ContentAsset` 集合新增记录，`status: "draft"`
4. 无 `TypeError: next is not a function` 报错
5. 生产环境 vertax.top 同样测试通过
