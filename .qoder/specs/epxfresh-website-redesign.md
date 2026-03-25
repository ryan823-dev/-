# EPXFresh 海外独立站重构计划

## Context（背景）

**项目现状问题：**
- 现有原型使用 React + Vite SPA 架构，存在严重安全漏洞（API密钥硬编码在前端）
- SEO严重缺失：无meta标签、sitemap、结构化数据，搜索引擎无法有效索引
- 内容硬编码在组件中，难以维护更新
- 无后端集成，表单无法提交，AI助手API暴露

**重构目标：**
- 使用 Next.js 14 App Router 完全重构
- 实现完整的 SEO + GEO（AI搜索引擎优化）
- 集成 CMS 内容管理
- B2B + B2C 双模式电商网站
- Vercel 全球部署

**目标市场：** 北美、欧洲、东南亚、拉丁美洲

---

## 技术架构

### 核心技术栈
```
Frontend:     Next.js 14 (App Router) + TypeScript + Tailwind CSS
UI Library:   shadcn/ui + Radix UI
CMS:          Sanity CMS (云端托管，免费额度)
Database:     无需数据库（Sanity托管）
E-commerce:   自建购物车 + Stripe支付
AI Assistant: Vercel AI SDK + OpenAI/Claude API
Deployment:   Vercel (全球CDN)
Language:     英文（后续可扩展）
```

### 项目结构
```
epxfresh/
├── app/
│   ├── (marketing)/           # 营销页面
│   │   ├── page.tsx           # 首页
│   │   ├── about/             # 关于我们
│   │   ├── technology/        # 技术说明
│   │   ├── certifications/    # 认证展示
│   │   └── contact/           # 联系我们
│   ├── (shop)/                # B2C电商
│   │   ├── shop/              # 商店首页
│   │   ├── products/[slug]/   # 产品详情
│   │   ├── cart/              # 购物车
│   │   └── checkout/          # 结账
│   ├── (b2b)/                 # B2B专区
│   │   ├── wholesale/         # 批发询价
│   │   ├── oem/               # OEM服务
│   │   └── solutions/         # 解决方案
│   ├── (blog)/                # 内容营销
│   │   └── blog/[slug]/       # 博客文章
│   ├── api/                   # API路由
│   │   ├── ai/chat/           # AI助手API
│   │   ├── contact/           # 表单提交
│   │   └── checkout/          # 支付处理
│   ├── layout.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/                    # shadcn/ui组件
│   ├── marketing/             # 营销组件
│   ├── shop/                  # 电商组件
│   └── ai/                    # AI助手组件
├── lib/
│   ├── seo/                   # SEO工具
│   ├── cms/                   # CMS客户端
│   └── utils/
├── content/                   # MDX内容
└── public/
    └── images/                # 产品图片
```

---

## 实施阶段

### Phase 1: 项目基础搭建（第1-2周）

#### 1.1 项目初始化
- [ ] 创建 Next.js 14 项目 (App Router)
- [ ] 配置 TypeScript + Tailwind CSS
- [ ] 安装 shadcn/ui 组件库
- [ ] 配置 ESLint + Prettier
- [ ] 设置环境变量管理

#### 1.2 设计系统迁移
从现有原型迁移设计系统：
- 色彩系统：Fresh Green (#16a34a) + Eco Teal + Warm Earth
- 组件：Button、Card、Header、Footer
- 动画系统：float、pulse-glow、fade-up
- 响应式断点配置

**关键文件：**
- `tailwind.config.ts` - 设计token配置
- `app/globals.css` - 全局样式和CSS变量
- `components/ui/` - 基础UI组件

#### 1.3 SEO基础架构
- [ ] 配置全局 metadata (app/layout.tsx)
- [ ] 实现 sitemap.ts 动态生成
- [ ] 实现 robots.ts
- [ ] 配置 Open Graph + Twitter Cards
- [ ] 实现 JSON-LD Schema (Organization, Product, FAQ)

### Phase 2: 核心页面开发（第3-4周）

#### 2.1 首页 (app/(marketing)/page.tsx)
模块结构（参考SPEC文档）：
1. Hero Section - 双CTA分流（B2B/B2C）
2. Trust Strip - 信任背书条
3. Dual Entry - B2B/B2C双入口
4. Product Paths - 产品路径展示
5. Why Choose EPXFresh - 核心优势
6. Certifications Preview - 认证预览
7. Best Sellers - 畅销产品
8. Wholesale CTA - 批发询盘
9. FAQ Preview - 常见问题预览
10. Final CTA - 最终行动召唤

#### 2.2 B2B页面
- `/wholesale` - 批发询价首页
- `/wholesale/oem` - OEM/Private Label服务
- `/solutions` - 应用解决方案
- `/technology` - 技术说明页
- `/certifications` - 认证展示页

#### 2.3 B2C电商页面
- `/shop` - 商店首页
- `/products/[slug]` - 产品详情页
- `/cart` - 购物车
- `/checkout` - 结账流程

### Phase 3: CMS与内容管理（第5周）

#### 3.1 Sanity CMS 配置
```typescript
// sanity.config.ts - Sanity Schema设计
const schemas = [
  // 产品相关
  { name: 'product', type: 'document', title: 'Product' },
  { name: 'category', type: 'document', title: 'Category' },
  
  // 内容相关
  { name: 'blog', type: 'document', title: 'Blog Post' },
  { name: 'faq', type: 'document', title: 'FAQ' },
  
  // 信任背书
  { name: 'testimonial', type: 'document', title: 'Testimonial' },
  { name: 'certification', type: 'document', title: 'Certification' },
  
  // 全局设置
  { name: 'siteSettings', type: 'document', title: 'Site Settings' },
]
```

**Sanity优势：**
- 免费额度充足（适合初期）
- 云端托管，无需维护数据库
- 实时预览编辑
- 图片CDN自动优化

#### 3.2 内容导入
- 产品信息（6个B2B产品线 + 5个B2C产品线）
- FAQ内容（16个B2B + 16个B2C）
- 认证信息（FDA、EU报告）
- 公司信息

### Phase 4: AI助手集成（第6周）

#### 4.1 安全的AI API
```typescript
// app/api/ai/chat/route.ts
// 使用 Vercel AI SDK，API密钥存储在环境变量
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const result = streamText({
    model: openai('gpt-4-turbo'),
    system: EPXFRESH_SYSTEM_PROMPT,
    messages,
  })
  
  return result.toAIStreamResponse()
}
```

#### 4.2 AI助手组件
- 浮动聊天窗口
- 快捷问题按钮
- 产品推荐集成
- 多语言支持

### Phase 5: 电商功能（第7周）

#### 5.1 购物车系统
- 本地状态管理 (Zustand)
- 购物车持久化 (localStorage)
- 数量控制、删除、小计

#### 5.2 支付集成
- Stripe Checkout 集成
- 订单确认邮件
- 订单状态追踪

### Phase 6: 部署与优化（第8周）

#### 6.1 Vercel部署
- 配置 vercel.json
- 环境变量设置
- 域名绑定
- SSL证书

#### 6.2 性能优化
- 图片优化 (Next.js Image)
- 字体优化 (next/font)
- 代码分割
- Core Web Vitals优化

#### 6.3 SEO优化
- Google Search Console 提交
- 结构化数据验证
- Open Graph 测试
- 移动端友好测试

---

## 关键文件清单

### 需要创建的核心文件
```
app/
├── layout.tsx                 # 全局布局 + SEO metadata
├── page.tsx                   # 首页
├── sitemap.ts                 # 动态站点地图
├── robots.ts                  # Robots.txt
├── (marketing)/
│   ├── about/page.tsx
│   ├── technology/page.tsx
│   ├── certifications/page.tsx
│   └── contact/page.tsx
├── (shop)/
│   ├── shop/page.tsx
│   ├── products/[slug]/page.tsx
│   ├── cart/page.tsx
│   └── checkout/page.tsx
├── (b2b)/
│   ├── wholesale/page.tsx
│   ├── oem/page.tsx
│   └── solutions/page.tsx
└── api/
    ├── ai/chat/route.ts       # AI助手API
    └── contact/route.ts       # 表单提交API

lib/
├── seo/
│   ├── metadata.ts            # SEO元数据生成
│   └── schema.ts              # JSON-LD Schema生成
└── sanity/
    ├── client.ts              # Sanity客户端
    └── queries.ts             # GROQ查询

components/
├── ai/
│   └── chat-widget.tsx        # AI聊天组件
└── shop/
    └── product-card.tsx       # 产品卡片
```

### 需要迁移的设计文件
```
从现有原型迁移：
- tailwind.config.ts (设计token)
- components/ui/button.tsx (按钮组件)
- components/ui/card.tsx (卡片组件)
- app/globals.css (全局样式)
```

---

## 资源文件处理

### 产品图片
从资料包导入：
```
/tmp/epxfresh-materials/保鲜膜/
├── 微信图片_20260318105938_131_907.jpg  # 产品宣传图
├── 微信图片_20260318105940_132_907.jpg  # 功能展示
├── 微信图片_20260318105941_133_907.jpg  # 使用场景
├── 微信图片_20260318105944_134_907.jpg  # 公司介绍
├── 公司宣传折页英文版.pdf
├── TST20250304303E...FDA.pdf            # FDA认证
└── TST20240305021-6EN...EU.pdf          # EU认证
```

### 品牌信息
```typescript
const BRAND_CONFIG = {
  brandName: 'EPXFresh',
  brandTagline: 'Advanced Fresh-Keeping Packaging Solutions',
  legalCompanyName: 'Guangzhou EPXFresh Technology Co., LTD',
  chineseCompanyName: '广州亿品鲜技术有限公司',
  contact: {
    email: 'info@epxfresh.com',
    address: '1604, Building F, No. 98, Xiangxue Eight Road, Huangpu District, Guangzhou City, China'
  }
}
```

---

## 验证方案

### 开发阶段验证
1. **本地开发服务器**
   ```bash
   npm run dev
   # 访问 http://localhost:3000
   ```

2. **SEO验证**
   - 查看页面源代码确认 meta 标签
   - 访问 /sitemap.xml 确认站点地图
   - 访问 /robots.txt 确认爬虫规则
   - 使用 Google Rich Results Test 验证结构化数据

3. **功能测试**
   - AI助手对话测试
   - 购物车添加/删除/修改
   - 表单提交测试
   - 响应式设计测试

### 部署后验证
1. **性能测试**
   - PageSpeed Insights 评分 > 90
   - Core Web Vitals 全部通过

2. **SEO测试**
   - Google Search Console 索引状态
   - 移动端友好测试通过

3. **功能测试**
   - Stripe 支付测试
   - AI助手响应测试
   - 表单邮件通知测试

---

## 预期成果

### 技术成果
- ✅ Next.js 14 生产级网站
- ✅ 完整的 SEO + GEO 优化
- ✅ 安全的 AI 助手集成
- ✅ B2B + B2C 双模式电商
- ✅ CMS 内容管理系统
- ✅ Vercel 全球部署

### 业务成果
- 🎯 搜索引擎可索引的页面结构
- 🎯 AI 搜索引擎优化（GEO）布局
- 🎯 B2B 询盘转化路径
- 🎯 B2C 在线购买流程
- 🎯 7×24 AI 售前助手
