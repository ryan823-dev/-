# 社交媒体 OAuth 集成

## 现状

**已有基础设施（完成度高）：**
- `auth/linkedin.ts` — 完整 OAuth 2.0 实现（auth URL、code exchange、token refresh）
- `auth/x.ts` — 完整 OAuth 2.0 PKCE 实现（auth URL、code exchange、token refresh）
- `auth/facebook.ts` — 完整 OAuth 2.0 实现（auth URL、code exchange、长期 token、页面管理）
- `models/SocialAccount.ts` — 存储 platform、accessToken、refreshToken、tokenExpiresAt、status
- `components/SocialPresence.tsx` — 完整 UI，含设置页连接按钮

**缺失部分：**
- X 和 Facebook 的 server.ts 路由是**纯占位符**（返回 "not yet configured"）
- 前端 X/Facebook 连接按钮只弹 Toast "功能开发中"
- LinkedIn 已有 mock/real 双模式，但 X/Facebook 没有
- 无 OAuth state/PKCE codeVerifier 的服务端临时存储
- 无 UI 让客户配置自己的 OAuth 应用凭据（API Key/Secret）

## 用户意图

开发完整的 OAuth 连接流程，同时**预留配置入口**给客户（如涂豆）填入自己的社交媒体 API Key、App ID 等凭据。

## 实施方案

### Step 1：添加 OAuth State 内存存储（server.ts）

OAuth 流程需要在 authorize 和 callback 之间暂存 state（CSRF 防护）和 codeVerifier（X PKCE）。

在 server.ts 中添加一个简单的内存 Map，带 TTL 自动过期：
```typescript
// OAuth flow state storage (10-minute TTL)
const oauthStateStore = new Map<string, { codeVerifier?: string; platform: string; createdAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of oauthStateStore) {
    if (now - val.createdAt > 10 * 60 * 1000) oauthStateStore.delete(key);
  }
}, 60_000);
```

### Step 2：实现 X OAuth 路由（server.ts）

替换第 2442-2448 行的占位符，使用 `auth/x.ts` 的现有函数：

**`GET /api/auth/x/authorize`**：
- 调用 `getXOAuthConfig()` 获取配置
- 若 `clientId` 为空 → mock 模式（同 LinkedIn 的模式）
- 否则调用 `getXAuthorizationUrl(config)` → 存储 state + codeVerifier 到 oauthStateStore → 返回 authUrl

**`GET /api/auth/x/callback`**：
- 验证 state、取出 codeVerifier
- 若 mock → 创建 mock SocialAccount
- 否则 `exchangeXCode(code, codeVerifier, config)` → 获取 user profile → 创建/更新 SocialAccount
- 重定向回前端 `/#social-presence`（而非返回 JSON）

### Step 3：实现 Facebook OAuth 路由（server.ts）

替换第 2451-2457 行的占位符，使用 `auth/facebook.ts` 的现有函数：

**`GET /api/auth/facebook/authorize`**：
- 调用 `getFacebookOAuthConfig()` 获取配置
- 若 `appId` 为空 → mock 模式
- 否则 `getFacebookAuthorizationUrl(config)` → 存储 state → 返回 authUrl

**`GET /api/auth/facebook/callback`**：
- 验证 state
- 若 mock → 创建 mock SocialAccount
- 否则 `exchangeFacebookCode(code, config)` → `getLongLivedToken()` → `getUserPages()` → 创建 SocialAccount（含 Page token）
- 重定向回前端 `/#social-presence`

### Step 4：更新前端 handleConnectAccount（SocialPresence.tsx）

修改 `handleConnectAccount` 函数（第 195-218 行），让 X 和 Facebook 也调用对应的 authorize API（而非只弹 Toast）：

```typescript
const handleConnectAccount = async (platform: PlatformType) => {
  toast.info('正在连接', `正在尝试连接 ${getPlatformLabel(platform)} 账号...`);
  try {
    const res = await fetch(`/api/auth/${platform}/authorize`);
    const data = await res.json();
    if (data.mock) {
      toast.warning('Mock 模式', `${getPlatformLabel(platform)} OAuth 当前为模拟模式`);
      setAccounts(prev => prev.map(a => a.platform === platform ? { ...a, connected: true, lastSync: '...' } : a));
    } else if (data.authUrl) {
      window.location.href = data.authUrl;
    }
  } catch {
    toast.error('连接失败', `${getPlatformLabel(platform)} 授权服务不可用`);
  }
};
```

### Step 5：添加 OAuth 凭据管理 API + UI

为客户预留填入 OAuth 凭据的入口。在 Settings Tab 中增加"平台凭据配置"区域：

**后端**：新增 `GET/PUT /api/social/platform-config` 端点
- 读写一个新的 `SocialPlatformConfig` 模型（或复用 ApiIntegration）
- 存储每个平台的 clientId/appId、clientSecret/appSecret
- 若 DB 中有配置，优先使用 DB 中的值；否则 fallback 到环境变量
- API 返回时 mask secret（只显示 `***`）

**前端**：在 SocialPresence Settings Tab 中添加配置表单
- 每个平台一组输入框（Client ID / App ID + Client Secret / App Secret）
- 保存按钮调用 `PUT /api/social/platform-config`
- 显示当前配置状态（已配置/未配置/使用环境变量）

### Step 6：更新 .env.example

添加缺失的 LinkedIn 环境变量：
```
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
```

## 修改文件清单

| 文件 | 变更 |
|------|------|
| `server.ts` | 添加 oauthStateStore；实现 X/Facebook OAuth 路由；添加 platform-config API |
| `components/SocialPresence.tsx` | 统一 handleConnectAccount；Settings 增加凭据配置表单 |
| `models/SocialPlatformConfig.ts` | **新建** — 存储每平台 OAuth 凭据 |
| `auth/x.ts` | 新增 `getXOAuthConfig()` 支持 DB config fallback |
| `auth/facebook.ts` | 新增 `getFacebookOAuthConfig()` 支持 DB config fallback |
| `auth/linkedin.ts` | 新增 `getLinkedInOAuthConfig()` 支持 DB config fallback |
| `.env.example` | 添加 LinkedIn 环境变量 |

## 验证

1. 本地启动 `tsx server.ts`
2. 无凭据时：点击连接按钮 → 进入 mock 模式 → 创建 mock SocialAccount → 显示"已连接"
3. 有凭据时：点击连接按钮 → 跳转到平台 OAuth 页 → 授权 → 回调 → 创建真实 SocialAccount
4. Settings 中填入 OAuth 凭据 → 保存成功 → 再次连接使用新凭据
5. `GET /api/social/accounts` 返回已连接账号列表
