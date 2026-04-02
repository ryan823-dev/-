# Vertax Processor Service

独立文档处理微服务，用于处理大型文档和图片 OCR。

## 功能

- **PDF 处理**: 使用 pdf-parse 提取文本
- **Word 处理**: 使用 mammoth 提取文本
- **图片 OCR**: 使用 Tesseract.js 进行中英文 OCR
- **视频帧 OCR**: 处理预提取的视频帧（需主应用提取）

## API 接口

### 健康检查
```
GET /health
Response: { status: "ok", timestamp: "..." }
```

### 单文件处理
```
POST /process
Body: {
  assetId: string,
  storageKey: string,
  mimeType: string,
  tenantId: string,
  apiKey: string
}
Response: {
  success: boolean,
  assetId: string,
  textLength: number,
  chunkCount: number
}
```

### 批量处理
```
POST /process/batch
Body: {
  assets: [...],
  apiKey: string
}
```

## Railway 部署

### 1. 安装 Railway CLI
```bash
npm install -g @railway/cli
```

### 2. 登录并创建项目
```bash
railway login
railway init  # 选择 Empty Project，命名为 vertax-processor
```

### 3. 设置环境变量
在 Railway Dashboard 或使用 CLI：
```bash
railway variables set DATABASE_URL=<你的数据库URL>
railway variables set OSS_REGION=oss-cn-hangzhou
railway variables set OSS_ACCESS_KEY_ID=<OSS Key ID>
railway variables set OSS_ACCESS_KEY_SECRET=<OSS Secret>
railway variables set OSS_BUCKET=<Bucket名>
railway variables set PROCESSOR_API_KEY=<安全密钥>
railway variables set DIRECT_URL=<数据库URL>
```

### 4. 部署
```bash
railway up
```

### 5. 获取 URL
```bash
railway domain
```

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| DATABASE_URL | PostgreSQL 连接字符串 | ✓ |
| DIRECT_URL | Prisma 直接连接 URL | ✓ |
| OSS_REGION | 阿里云 OSS 区域 | ✓ |
| OSS_ACCESS_KEY_ID | OSS Access Key | ✓ |
| OSS_ACCESS_KEY_SECRET | OSS Secret | ✓ |
| OSS_BUCKET | OSS Bucket 名称 | ✓ |
| PROCESSOR_API_KEY | API 认证密钥 | ✓ |
| PORT | 服务端口（默认 3001） | |
| LOG_LEVEL | 日志级别（默认 info） | |

## 本地开发

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 启动服务
npm run dev
```

## 主应用集成

在主应用 `.env` 中添加：
```
PROCESSOR_SERVICE_URL=https://your-service.railway.app
PROCESSOR_API_KEY=<相同的密钥>
```

处理逻辑会自动选择：
- 小文件 (<8MB): 浏览器端处理
- 大文件/图片: 微服务处理
- 其他: 服务端本地处理