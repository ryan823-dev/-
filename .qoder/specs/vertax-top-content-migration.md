# Vertax.top 内容迁移 & 平台官网方案

## 目标

1. **数据隔离**：vertax.top 根域名不再暴露涂豆(TDPaintcell)的业务数据，API 层面拦截
2. **平台官网**：vertax.top 展示 Vertax 平台品牌 Landing Page，引导用户到 tower.vertax.top 登录
3. **租户不受影响**：tdpaintcell.vertax.top 保持现有 SPA + API 完全正常

## 架构变化

```
变更前:
  vertax.top              → Vertax SPA (App.tsx，含涂豆数据)
  tdpaintcell.vertax.top  → Vertax SPA (App.tsx，同上)

变更后:
  vertax.top              → LandingPage (平台官网，无业务数据)
  tdpaintcell.vertax.top  → Vertax SPA (App.tsx，不变)
  tower.vertax.top        → Tower 管理面板 (不变)
```

## 实现步骤

### Step 1: 后端 API 数据隔离

**文件**: `/-/middleware/auth.ts`

在 `authMiddleware` 中，public route 检查之后、token 解析之前，插入根域名拦截逻辑：

- 当 hostname 为 `vertax.top` 或 `www.vertax.top`（即无租户子域名）
- 且请求路径是需要认证的 API（非 public route）
- 返回 403 `{ error: 'No tenant context' }`

效果：
| 请求 | 结果 |
|------|------|
| `vertax.top/api/health` | 放行 (public route) |
| `vertax.top/api/products` | 403 拦截 |
| `tdpaintcell.vertax.top/api/products` + JWT | 正常返回 |

### Step 2: 新建 Landing Page 组件

**新建文件**: `/-/components/LandingPage.tsx`

纯展示组件，不调用任何 API，内容包括：

1. **Hero 区域** - Vertax 品牌标语 + "工业出海智理平台" 定位 + CTA 按钮 → tower.vertax.top
2. **功能模块展示** - 知识引擎、智能获客、营销中台、社媒矩阵等核心能力
3. **客户案例** - 静态展示已服务企业（如涂豆科技）
4. **Footer** - 联系方式 + 注册入口链接

风格沿用现有设计系统：ivory/navy/gold 配色、Noto Sans SC 字体。

### Step 3: 修改前端入口路由

**文件**: `/-/index.tsx`

将入口从直接渲染 `<App />` 改为渲染一个 `<PlatformRouter />`：
- 读取 `window.location.hostname`
- 根域名 (`vertax.top` / `www.vertax.top`) → 渲染 `<LandingPage />`
- 租户子域名 (`*.vertax.top`) 或 localhost → 渲染 `<App />`

选择在 `index.tsx` 而非 `App.tsx` 中做判断，避免触发 App 内部的 React Hooks 和 useEffect API 调用。

### Step 4: 部署验证

部署 Vertax 到 Vercel 生产环境，验证：
- `https://vertax.top` → 显示平台 Landing Page
- `https://vertax.top/api/products` → 403 拦截
- `https://tdpaintcell.vertax.top` → 正常 SPA 渲染
- `https://tdpaintcell.vertax.top/api/products` → 正常返回数据

## 关键文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `/-/middleware/auth.ts` | 修改 | 根域名 API 拦截 |
| `/-/components/LandingPage.tsx` | 新建 | 平台官网页面 |
| `/-/index.tsx` | 修改 | 入口路由判断 |

## 不需要改动

- `/-/App.tsx` - 不动
- `/-/server.ts` - 不动
- `/-/vercel.json` - 不动
- Tower 项目 - 不动
