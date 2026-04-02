# Railway 环境变量配置清单

## 必需变量 (Required)

| 变量名 | 描述 | 示例值 | 来源 |
|--------|------|--------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:password@host:5432/database?schema=public` | 主应用 Vercel 环境变量 |
| `DIRECT_URL` | PostgreSQL 直接连接 | `postgresql://user:password@host:5432/database?schema=public` | 同 DATABASE_URL |
| `OSS_REGION` | 阿里云 OSS 区域 | `oss-cn-hangzhou` | 主应用 Vercel 环境变量 |
| `OSS_ACCESS_KEY_ID` | OSS 访问密钥 ID | `LTAI5t...` | 阿里云控制台 |
| `OSS_ACCESS_KEY_SECRET` | OSS 访问密钥密码 | `abc123...` | 阿里云控制台 |
| `OSS_BUCKET` | OSS 存储桶名称 | `vertax-assets` | 主应用 Vercel 环境变量 |
| `PROCESSOR_API_KEY` | API 认证密钥 | `(生成见下方)` | 新生成 |

## 可选变量 (Optional)

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `PORT` | 服务端口 | Railway 自动设置 |
| `HOST` | 监听地址 | `0.0.0.0` |

## 生成 PROCESSOR_API_KEY

在终端执行：
```bash
openssl rand -base64 32
```

输出示例：`kYp3sX9vN2mQ7wR4tY6uI8oP0aS1dF2gH3jK5lZ8x`

## 从主应用获取变量值

### 方法 1: Vercel Dashboard
1. 打开 https://vercel.com/dashboard
2. 选择 vertax 项目
3. Settings → Environment Variables
4. 复制以下变量的值：
   - `DATABASE_URL`
   - `OSS_REGION`
   - `OSS_ACCESS_KEY_ID`
   - `OSS_ACCESS_KEY_SECRET`
   - `OSS_BUCKET`

### 方法 2: 本地 .env 文件
```bash
# 从主应用 .env 文件查看
cat /Users/oceanlink/Documents/Qoder-1/.env | grep -E "DATABASE_URL|OSS_"
```

## Railway 设置步骤

1. 打开 Railway 项目
2. 点击服务 → Variables 标签
3. 点击 "Add Variable" 或 "Bulk Import"
4. 粘贴以下格式（替换占位符）：

```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
DIRECT_URL=postgresql://user:password@host:5432/database?schema=public
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=你的OSSKeyId
OSS_ACCESS_KEY_SECRET=你的OSSSecret
OSS_BUCKET=你的Bucket名
PROCESSOR_API_KEY=生成的密钥
NODE_ENV=production
LOG_LEVEL=info
```

## 部署后验证

```bash
# 健康检查
curl https://你的服务.up.railway.app/health

# 预期响应
{"status":"ok","timestamp":"2024-..."}
```

## Vercel 配置（部署成功后）

在 Vercel 环境变量中添加：

| 变量名 | 值 |
|--------|-----|
| `PROCESSOR_SERVICE_URL` | Railway 提供的域名 |
| `PROCESSOR_API_KEY` | 与 Railway 相同的密钥 |