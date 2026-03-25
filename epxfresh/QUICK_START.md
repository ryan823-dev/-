# EPXFresh 快速部署指南

## 🎯 已完成

✅ **网站已部署**: https://epxfresh.vercel.app

✅ **AI 助理预览**: 首页右侧已集成 AI 助理演示窗口

✅ **构建成功**: 所有页面编译通过

## 🔑 配置环境变量（必须）

当前部署**缺少环境变量**，需要配置以下服务：

### 1. Sanity CMS（内容管理）

**获取 Project ID**:

方法 A - 在线创建（推荐）:
1. 访问 https://sanity.io
2. 注册/登录
3. 点击 "Create new project"
4. 项目名称：`epxfresh-cms`
5. Dataset: `production`
6. 复制 Project ID（类似：`abc123xyz`）

方法 B - 使用脚本:
```bash
cd /Users/oceanlink/Documents/Qoder-1/epxfresh
./setup-sanity.sh
```

### 2. OpenAI API Key（AI 助理）

**获取 API Key**:
1. 访问 https://platform.openai.com/api-keys
2. 注册/登录
3. 点击 "Create new secret key"
4. 复制 Key（以 `sk-` 开头）

⚠️ **重要**: AI 助理需要有效的 OpenAI API Key 才能工作

### 3. 配置到 Vercel

**方法 A - 使用脚本（推荐）**:
```bash
cd /Users/oceanlink/Documents/Qoder-1/epxfresh
./vercel-env-setup.sh
```

脚本会自动：
- 检查 Vercel 登录状态
- 提示输入所有环境变量
- 配置到 Vercel 项目
- 询问是否立即部署

**方法 B - 手动配置**:

1. 访问 Vercel Dashboard: https://vercel.com/ryan-moores-projects-37ce5eff/epxfresh
2. 进入 **Settings** → **Environment Variables**
3. 添加以下变量：

```
NEXT_PUBLIC_SANITY_PROJECT_ID=你的 Sanity Project ID
NEXT_PUBLIC_SANITY_DATASET=production
OPENAI_API_KEY=sk-你的 OpenAI API Key
NEXT_PUBLIC_SITE_URL=https://epxfresh.vercel.app
```

4. 点击 **Save**
5. 点击 **Deploy** → **Redeploy** 使变量生效

## 📝 本地开发

```bash
cd /Users/oceanlink/Documents/Qoder-1/epxfresh

# 安装依赖
npm install

# 创建本地环境文件
cp .env.local.example .env.local

# 编辑 .env.local 填入你的密钥
nano .env.local

# 启动开发服务器
npm run dev
```

访问：http://localhost:3000

## 🚀 部署更新

```bash
# 快速部署
cd /Users/oceanlink/Documents/Qoder-1/epxfresh
vercel --prod
```

## 📦 Sanity CMS 内容管理

### 首次设置

```bash
# 运行设置脚本
./setup-sanity.sh
```

这会：
1. 安装 Sanity CLI
2. 登录 Sanity
3. 创建项目
4. 部署 Sanity Studio
5. 生成 .env.local 文件

### 添加产品内容

**方式 1 - Sanity Studio（推荐）**:
1. 访问你的 Sanity Studio URL（部署时生成）
2. 导航到 Products
3. 点击 "Create new"
4. 填写产品信息
5. 上传图片
6. 点击 "Publish"

**方式 2 - 导入种子数据**:
```bash
# 查看种子数据示例
cat sanity.seed.ts

# 手动创建 JSON 文件并导入
npx sanity dataset import seed-data.json production
```

## ✅ 部署后检查清单

访问 https://epxfresh.vercel.app 并检查：

- [ ] 首页加载正常
- [ ] AI 助理预览窗口显示
- [ ] 导航菜单正常
- [ ] 产品页面显示
- [ ] 移动端响应式布局
- [ ] 所有链接可点击

配置环境变量后检查：

- [ ] AI 助理可以对话（点击首页右下角聊天按钮）
- [ ] 产品数据从 Sanity 加载
- [ ] 图片正常显示

## 🛠️ 故障排除

### AI 助理不工作

1. 检查 OPENAI_API_KEY 是否正确
2. 验证 API Key 有效（在 openai.com 测试）
3. 检查 API 使用限额

### Sanity 数据不加载

1. 验证 Project ID 正确
2. 检查 Sanity Dashboard 的 CORS 设置
3. 添加域名到允许来源：
   - Settings → API → CORS Origins
   - 添加：`https://epxfresh.vercel.app`

### 构建失败

```bash
# 清除缓存重新构建
rm -rf .next node_modules
npm install
npm run build
```

## 📚 详细文档

- `DEPLOYMENT.md` - 完整部署指南
- `SANITY_SETUP.md` - Sanity CMS 详细设置
- `sanity.seed.ts` - 示例数据结构

## 🆘 获取帮助

- Sanity 文档：https://www.sanity.io/docs
- Vercel 文档：https://vercel.com/docs
- Next.js 文档：https://nextjs.org/docs

## 🎉 下一步

配置完环境变量后：

1. ✅ 添加真实产品图片
2. ✅ 完善产品描述
3. ✅ 添加客户评价
4. ✅ 配置自定义域名（可选）
5. ✅ 设置分析工具（可选）

---

**当前状态**: 网站已部署，等待环境变量配置 ✨
