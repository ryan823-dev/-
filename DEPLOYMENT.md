# 项目部署指南

## 项目结构

本仓库包含多个独立项目，每个项目有自己的部署配置：

| 目录 | 项目名称 | Vercel 项目 | 部署命令 |
|------|----------|-------------|----------|
| `/` | Outbound Admin | (未配置) | 不部署 |
| `machrio/` | Machrio (Payload CMS) | machrio | `cd machrio && vercel --prod` |

## 重要提示

### ⚠️ 避免错误的部署

**问题**: 根目录和 machrio 子目录可能被误部署到同一个 Vercel 项目，导致后台 404。

**解决方案**:
1. 根目录的 `.vercel` 已被删除，不要在根目录运行 `vercel` 命令
2. 部署 machrio 时，必须在 `machrio/` 目录中运行 `vercel --prod`

### 正确的部署步骤

#### Machrio (Payload CMS)

```bash
# 进入 machrio 目录
cd machrio

# 部署到生产环境
vercel --prod

# 或者使用 --yes 跳过确认
vercel --prod --yes
```

#### 检查当前部署状态

```bash
# 测试后台是否正常
curl -I https://machrio.com/admin

# 应该返回 200，而不是 307 重定向到其他页面
```

## Vercel 项目配置

### Machrio

- **Project ID**: `prj_IRCEVjGeibKESzcfuwwWHudfRShi`
- **配置文件**: `machrio/.vercel/project.json`
- **域名**: https://machrio.com
- **后台**: https://machrio.com/admin

## 故障排除

### 后台 404 错误

如果访问 `/admin` 出现 404 或重定向到错误页面：

1. 检查部署的是哪个项目：
   ```bash
   curl -I https://machrio.com/admin
   ```
   - 如果返回 `x-powered-by: Next.js, Payload`，则是正确的
   - 如果返回其他内容，说明部署了错误的项目

2. 重新部署 machrio：
   ```bash
   cd machrio && vercel --prod --yes
   ```

3. 确保根目录没有 `.vercel` 目录：
   ```bash
   rm -rf .vercel
   ```

## 防止问题的最佳实践

1. **永远不要在根目录运行 `vercel` 命令**
2. 部署前检查当前目录：`pwd` 应该显示 `.../machrio`
3. 如果创建新的 `.vercel` 配置，确保在正确的目录中
4. 团队成员应该使用 `machrio/.vercel/project.json` 中的项目 ID

## 联系

如有问题，请检查此文档或联系开发团队。