# FA Dreamworks - Multi-Brand Factory Automation Platform

## Context

fadreamworks.com 定位为 FA（工厂自动化）多品牌聚合平台，整合 4 家制造商的产品线，面向海外 B2B 买家。核心价值是让全球买家在一个平台上浏览、对比、询价来自不同中国 FA 制造商的产品，降低信息不对称。

## Tech Stack

- **Framework**: Next.js 15 (App Router) + Payload CMS 3.x (embedded)
- **Database**: Supabase Postgres (via Payload's `@payloadcms/db-postgres` adapter + Drizzle ORM)
- **Storage**: Supabase Storage (产品图片、品牌 Logo、文档)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **AI**: OpenRouter (Claude) 为主 + DashScope (Qwen) 为备
- **Deploy**: Vercel
- **Language**: English 为主 + es/fr/ru/pl/th/vi

### Why Supabase Postgres over MongoDB
- 用户已有 Supabase 付费会员，无需额外 DB 开销
- 关系型数据更适合 Brands → Products → Categories 的多级关联查询
- Supabase Storage 统一管理媒体资源，无需单独配置 Vercel Blob
- Payload 3.x 原生支持 Postgres adapter，Admin 后台体验不变
- 后续可利用 Supabase Auth（买家账户）、Edge Functions、Realtime 等能力

## 4 Manufacturers

| Brand | Products | Focus |
|-------|----------|-------|
| Hanwei CNC (汉隈) | CNC 龙门机床 (HWM22/24, QLM, TK68) + 精密铣头 (HW-Z/W/B/Y) | 风电/船舶/航空 |
| Yitelish (意特利) | 五轴加工中心 13+ 系列 (TITAN, GM, GRANDE, SKY, SAKER...) | 轨交/汽车/模具 |
| Sodron (索迪龙) | 工业传感器 11+ 系列 (接近/压力/流量/温度/电流) | 通用 FA |
| 358sensor (机本工) | 力/扭矩传感器 7 系列 (DE/DH/DED/DEH/DEDH) | 机器人/医疗/航空 |

---

## Information Architecture

```
/                                → 首页 (AI Command Center Hero)
/brands                          → 品牌总览
/brands/[brandSlug]              → 品牌详情页
/products                        → 全站产品目录 (跨品牌)
/products/[brandSlug]/[slug]     → 产品详情
/categories                      → 分类总览
/categories/[slug]               → 分类产品列表
/industries                      → 行业应用
/industries/[slug]               → 行业详情
/compare                         → 跨品牌产品对比
/rfq                             → 多步询价向导
/knowledge-center                → 知识中心
/about                           → 关于平台
/contact                         → 联系
```

---

## Payload CMS Collections

### Brands (核心新增)
- `name`, `slug`, `nameZh`, `logo`, `heroImage`, `tagline`, `description`
- `companyInfo`: founded, headquarters, employeeCount, factoryArea, certifications, website
- `capabilities`: array of {title, description, icon}
- `targetIndustries`: relationship -> Industries
- `rfqRouting`: {notificationEmails, responseTimeGuarantee}
- `seo`: {metaTitle, metaDescription}

### Products
- `brand` (relationship -> Brands, **required**)
- `productSeries` (relationship -> ProductSeries)
- `modelNumber`, `name`, `slug`, `shortDescription`, `description`
- `category` (relationship -> Categories)
- `industries` (relationship -> Industries, hasMany)
- `specifications`: array of {label, value, unit}
- `features`, `images`, `documents`
- `seo`

### ProductSeries
- `name`, `slug`, `brand`, `category`, `description`, `keyFeatures`

### Categories (树形)
- `name`, `slug`, `parent`, `description`, `comparisonAttributes`

### Industries
- `name`, `slug`, `description`, `painPoints`, `statistics`, `applicableBrands`, `caseStudies`

### RFQSubmissions
- `companyName`, `contactName`, `email`, `phone`, `country`
- `targetBrand` (optional), `targetProducts`
- `requirements`, `quantity`, `timeline`
- `routingStatus`: pending-routing | routed | multi-brand
- afterChange hook: auto-route to brand's notification emails

### Articles, Media, Users, ContactSubmissions

---

## AI Architecture (3-Layer)

1. **Hero AI (Command Center)**: 首页全宽命令输入框，快捷操作按钮
2. **Contextual AI**: 品牌页/产品页/行业页的上下文感知对话
3. **Floating Widget**: 全站右下角悬浮按钮

AI API route (`/api/chat`):
- Server-side streaming (Edge Runtime)
- OpenRouter 为主，失败自动切 DashScope
- 多品牌知识库动态注入 system prompt
- Tool functions: search_products, compare_products, get_brand_info, create_rfq

---

## i18n Strategy

- **next-intl** library
- English 无前缀 (`/products/...`)
- 其他语言有前缀 (`/es/products/...`, `/fr/products/...`)
- Supported: en, es, fr, ru, pl, th, vi
- UI strings: JSON per locale
- CMS content: English core, AI-assisted translation for others

---

## Project Structure

```
fadreamworks/
├── src/
│   ├── app/
│   │   ├── (frontend)/           # Public pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── brands/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── industries/
│   │   │   ├── compare/
│   │   │   ├── rfq/
│   │   │   ├── knowledge-center/
│   │   │   ├── about/
│   │   │   └── contact/
│   │   ├── (payload)/admin/      # Payload Admin
│   │   └── api/
│   │       ├── chat/route.ts     # AI streaming
│   │       ├── rfq/route.ts
│   │       └── [...payload]/
│   ├── payload/
│   │   ├── payload.config.ts
│   │   └── collections/          # All collections
│   ├── components/
│   │   ├── layout/               # Header, Footer, BrandNav
│   │   ├── ai/                   # AICommandCenter, ChatWidget, ContextualAI
│   │   ├── product/              # ProductCard, SpecTable, CompareTable, Filter
│   │   ├── brand/                # BrandCard, BrandHero
│   │   ├── rfq/                  # RFQWizard
│   │   └── ui/                   # shadcn/ui
│   ├── lib/
│   │   ├── ai/                   # config, knowledge, chat, streaming
│   │   ├── i18n/                 # config, locales/
│   │   └── utils/                # seo, structured-data
│   └── scripts/
│       ├── seed-brands.ts
│       ├── seed-hanwei-products.ts
│       ├── seed-yitelish-products.ts
│       ├── seed-sodron-products.ts
│       ├── seed-358sensor-products.ts
│       ├── seed-categories.ts
│       ├── seed-industries.ts
│       └── seed-all.ts
├── public/brands/                # Brand logos
├── next.config.ts
├── package.json
└── tailwind.config.ts
```

---

## Implementation Phases

### Phase 1: Project Skeleton + Data Model
- Next.js + Payload CMS init with `@payloadcms/db-postgres` adapter
- Supabase project setup: connect Postgres, configure Storage bucket for media
- Define all Payload collections (Brands, Products, ProductSeries, Categories, Industries, RFQ)
- Seed scripts: categories -> brands -> products (all 4 manufacturers)
- Basic routing: homepage, brand list, brand detail, product list, product detail
- Header/Footer with mega menu

### Phase 2: AI + RFQ + Core Features
- AI chat API route with dual provider + streaming
- Multi-brand knowledge base
- AI Command Center Hero component
- Floating AI Widget
- Contextual AI per page type
- RFQ multi-step wizard with brand routing
- Product comparison page (cross-brand)

### Phase 3: SEO/AEO + Content
- metadata functions for all page types
- Schema.org JSON-LD (Product, Organization, FAQPage, BreadcrumbList)
- robots.ts + sitemap.ts (dynamic)
- Knowledge center with initial articles
- i18n setup (next-intl) + EN/ES/FR translations

### Phase 4: Polish + Deploy
- Industry detail pages (10-block structure per industrial-content-engine skill)
- Mobile responsive audit
- Performance optimization (ISR, image optimization)
- Vercel deployment + fadreamworks.com domain binding
- GA4 + conversion tracking

---

## Critical Files

| File | Purpose |
|------|---------|
| `src/payload/collections/Brands.ts` | Core: multi-brand entity with RFQ routing |
| `src/payload/collections/Products.ts` | Products with required brand relation + FA specs |
| `src/payload/payload.config.ts` | Payload config: collections, globals, Postgres adapter (Supabase) |
| `src/lib/ai/knowledge.ts` | Multi-brand knowledge base for AI |
| `src/app/(frontend)/page.tsx` | Homepage: AI Command Center Hero |
| `src/app/api/chat/route.ts` | AI streaming endpoint (dual provider) |
| `src/scripts/seed-all.ts` | Content seeding entry point |

## Verification

1. `npm run build` passes without errors
2. Payload admin accessible at `/admin`, all collections visible
3. Seed scripts populate 4 brands + 39+ products
4. Homepage renders AI Command Center with working chat
5. Product pages show correct brand attribution and specs
6. RFQ submission routes notification to correct brand email
7. `sitemap.xml` lists all brand/product/category/industry URLs
8. Lighthouse SEO score >= 90
