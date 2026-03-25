# VetSphere 宠医界 Next.js 重构方案

## 项目概述

将现有 Vite + React SPA 重构为 Next.js App Router 架构，解决 SEO 问题，支持双域名双语言。

**核心目标**：
- SEO 友好（SSG/SSR/ISR）
- 双站点单部署（vetsphere.net + vetsphere.cn）
- MVP 功能：培训课程 + 医疗设备销售
- 供应商入驻模式

---

## 一、技术架构

```
┌─────────────────────────────────────────────────────┐
│              Next.js 15+ (Single Deploy)            │
├─────────────────────────────────────────────────────┤
│  Middleware: 域名识别 → 语言设置 → 认证检查         │
│  vetsphere.net → en | vetsphere.cn → zh-CN          │
├─────────────────────────────────────────────────────┤
│  App Router                                          │
│  ├── [locale]/(public)  → SSG/ISR (SEO页面)        │
│  ├── [locale]/(dashboard) → SSR (用户中心)         │
│  └── /suppliers/        → CSR (供应商后台)         │
├─────────────────────────────────────────────────────┤
│  Supabase (新建项目)                                │
│  Auth + Database + Storage + RLS                    │
└─────────────────────────────────────────────────────┘
```

---

## 二、目录结构

```
vetsphere/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (public)/           # 公开页面 (SSG)
│   │   │   │   ├── page.tsx        # 首页
│   │   │   │   ├── courses/
│   │   │   │   │   ├── page.tsx    # 课程列表
│   │   │   │   │   └── [slug]/page.tsx
│   │   │   │   ├── equipment/
│   │   │   │   │   ├── page.tsx    # 设备列表
│   │   │   │   │   └── [slug]/page.tsx
│   │   │   │   ├── about/
│   │   │   │   └── contact/
│   │   │   ├── (auth)/             # 认证页面
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── (dashboard)/        # 用户中心 (SSR)
│   │   │       ├── my-courses/
│   │   │       ├── orders/
│   │   │       └── profile/
│   │   ├── suppliers/              # 供应商后台 (CSR)
│   │   │   ├── (auth)/login/
│   │   │   └── (dashboard)/
│   │   │       ├── courses/
│   │   │       ├── equipment/
│   │   │       └── orders/
│   │   ├── api/                    # API Routes
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                     # shadcn/ui (复用)
│   │   ├── layout/
│   │   ├── courses/
│   │   ├── equipment/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── domain.ts
│   │   └── seo.ts
│   ├── hooks/
│   ├── i18n/
│   │   └── locales/
│   │       ├── en.json
│   │       └── zh-CN.json
│   └── middleware.ts
├── supabase/
│   └── migrations/
├── public/
│   └── images/placeholder/
└── package.json
```

---

## 三、核心数据库表

```sql
-- 用户资料
profiles (id, role, full_name, locale)

-- 供应商
suppliers (id, profile_id, company_name_en, company_name_zh, status)

-- 课程
courses (
  id, supplier_id,
  title_en, title_zh,
  slug_en, slug_zh,
  price_usd, price_cny,
  status, seo_metadata
)

-- 设备
equipment (
  id, supplier_id,
  name_en, name_zh,
  slug_en, slug_zh,
  price_usd, price_cny,
  country_of_origin,  -- 区分中国制造/进口
  specifications,
  status
)

-- 订单
orders (id, user_id, order_type, total_amount, currency, status)
order_items (id, order_id, item_type, item_id, quantity, unit_price)
enrollments (id, user_id, course_id, progress_percent)
```

---

## 四、SEO 渲染策略

| 页面 | 渲染 | Revalidate | 备注 |
|-----|------|------------|------|
| 首页 | SSG | - | 静态生成 |
| 课程列表 | SSG+ISR | 1小时 | generateStaticParams |
| 课程详情 | SSG+ISR | 1小时 | 结构化数据(Course) |
| 设备列表 | SSG+ISR | 30分钟 | 库存变化 |
| 设备详情 | SSG+ISR | 30分钟 | 结构化数据(Product) |
| 用户中心 | SSR | - | 需认证 |
| 供应商后台 | CSR | - | 无需SEO |

---

## 五、分阶段实施

### Phase 1: 基础架构 (本次)
- [x] 初始化 Next.js 项目
- [ ] 配置 Tailwind + shadcn/ui
- [ ] Middleware 域名识别
- [ ] next-intl 国际化配置
- [ ] 基础布局 (Header/Footer)
- [ ] 首页 (双语)

### Phase 2: 课程模块
- [ ] 课程列表页
- [ ] 课程详情页 + SEO
- [ ] Supabase Auth 集成
- [ ] 课程报名流程
- [ ] 我的课程页面

### Phase 3: 设备模块
- [ ] 设备列表页
- [ ] 设备详情页 + 规格表
- [ ] 询价表单
- [ ] 购物车

### Phase 4: 供应商后台
- [ ] 供应商注册/审核
- [ ] 课程管理 (CRUD)
- [ ] 设备管理 (CRUD)
- [ ] 订单管理

### Phase 5: 订单与支付
- [ ] Stripe (国际版)
- [ ] 支付宝/微信 (中国版)
- [ ] 订单流程

### Phase 6: SEO 与上线
- [ ] Sitemap 生成
- [ ] 结构化数据完善
- [ ] 性能优化
- [ ] 生产部署

---

## 六、关键文件

| 文件 | 作用 |
|-----|------|
| `src/middleware.ts` | 域名识别、语言重定向、认证检查 |
| `src/lib/supabase/server.ts` | Server Components 数据获取 |
| `src/lib/domain.ts` | 域名工具函数 |
| `src/app/[locale]/(public)/layout.tsx` | 公开站布局 |
| `supabase/migrations/001_initial.sql` | 数据库 Schema |

---

## 七、技术栈

| 类型 | 选型 |
|-----|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |
| UI | shadcn/ui + Tailwind |
| 国际化 | next-intl |
| 部署 | Vercel |

---

## 八、验证方式

1. **SEO 验证**
   - 查看页面源码确认 SSR/SSG 输出完整 HTML
   - Google Search Console 提交 sitemap
   - Lighthouse SEO 评分 > 90

2. **双站点验证**
   - 开发环境：`localhost:3000` + `?domain=cn` 或 `?domain=net` 模拟
   - 生产环境：分别访问两个域名确认内容正确

3. **功能验证**
   - 课程浏览 → 注册 → 报名流程
   - 设备浏览 → 询价表单提交
   - 供应商登录 → 发布课程/设备
