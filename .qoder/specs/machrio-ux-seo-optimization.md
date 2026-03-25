# Machrio UX & SEO 优化方案 (v2)

## 项目概述

为 Machrio B2B MRO 电商平台制定全面的 UX 和 SEO 优化方案。

**核心原则**：
- **不做虚假评价/评分** - 避免 Google 信任风险，等真实评论系统上线后再开放 aggregateRating
- **内容质量 > 数量** - 防薄内容/重复内容，AI 生成内容需三层结构（事实/场景/决策）
- **可访问性 = 键盘全流程可用** - 不只是加 ARIA，要焦点管理 + 键盘导航
- **性能监控从 P0 开始** - 否则优化效果无法量化

---

## 分阶段实施计划

## Phase P0: 快速胜利 (1-2周)

### 1. Product Schema 增强（不含虚假评分）
**文件**: `src/app/(frontend)/product/[category]/[slug]/page.tsx`

**改动**（先做完整 offers，不做假 review/rating）:
```typescript
const productSchema = {
  "@type": "Product",
  "name": product.name,
  "sku": product.sku,
  "gtin13": product.gtin13 || undefined, // 有就填
  "brand": {
    "@type": "Brand",
    "name": brand.name,
    "url": `https://machrio.com/brand/${brand.slug}`,
    "logo": brand.logo?.url
  },
  "offers": {
    "@type": "Offer",
    "url": canonicalUrl,
    "priceCurrency": "USD",
    "price": product.pricing?.basePrice,
    "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90天
    "availability": mapAvailability(product.availability), // InStock/OutOfStock/BackOrder
    "itemCondition": "https://schema.org/NewCondition",
    "seller": { "@type": "Organization", "name": "Machrio" },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": { "@type": "MonetaryAmount", "currency": "USD" },
      "deliveryTime": { "@type": "ShippingDeliveryTime", "handlingTime": { ... } }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 30,
      "returnMethod": "https://schema.org/ReturnByMail"
    }
  }
  // ❌ 暂不添加 aggregateRating 和 review
}
```

**关键点**：
- `offers` 内容必须与页面可见内容一致（价格、库存、运费）
- 延长 `priceValidUntil` 至 90 天
- 添加 `hasMerchantReturnPolicy`（退换政策对电商加分）
- 等 P3 真实评论系统上线后再添加 rating

---

### 2. 可访问性修复（键盘全流程 + 焦点管理）

#### 2.1 Header / Mega-menu
**文件**: `src/components/layout/Header.tsx`

```tsx
// 搜索框 - label 不能只靠 placeholder
<label htmlFor="search-input" className="sr-only">Search products, brands, and categories</label>
<input id="search-input" aria-label="Search products, brands, and categories" />

// 购物车 - 图标按钮 + 数量更新通知
<button aria-label={`Cart, ${itemCount} items`}>
  <CartIcon />
  <span className="sr-only">{itemCount} items in cart</span>
</button>
<div aria-live="polite" className="sr-only">{/* 购物车更新时播报 */}</div>

// Mega-menu - 完整键盘支持
<button 
  aria-expanded={showMenu} 
  aria-controls="mega-menu-panel"
  aria-haspopup="true"
  onKeyDown={handleMegaMenuKeyboard} // 方向键导航 + ESC 关闭
>
// 打开后焦点进入菜单，关闭后焦点回到触发按钮
```

**键盘导航要求**：
- ESC 关闭菜单
- 方向键在菜单项间导航
- Tab 按正常顺序
- 焦点陷阱（打开时焦点在菜单内循环）

#### 2.2 FilterBar
**文件**: `src/components/category/FilterBar.tsx`

```tsx
// 折叠面板 - 用 button 不是 div
<button
  type="button"
  aria-expanded={isOpen}
  aria-controls="filter-panel-brand"
  onClick={togglePanel}
>
  Brand
</button>
<div id="filter-panel-brand" hidden={!isOpen}>
  {/* 复选/多选筛选 - 每个 input 都要有 label */}
  <input type="checkbox" id="brand-3m" />
  <label htmlFor="brand-3m">3M</label>
</div>

// Applied Filters - 可键盘操作的 chip list
<div role="list" aria-label="Applied filters">
  <div role="listitem">
    <span>3M</span>
    <button aria-label="Remove filter: 3M">×</button>
  </div>
</div>
```

#### 2.3 RFQForm
**文件**: `src/components/forms/RFQForm.tsx`

```tsx
// 错误信息 - 确保可被读屏读到
<input 
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && (
  <span id="email-error" role="alert">{errors.email}</span>
)}

// 提交失败 - 聚焦到第一个错误字段
const onSubmitError = () => {
  const firstErrorField = document.querySelector('[aria-invalid="true"]');
  firstErrorField?.focus();
}

// 顶部错误总结
<div role="alert" aria-live="assertive">
  {hasErrors && "Please fix the errors below"}
</div>
```

---

### 3. 加载状态骨架屏
**新建文件**:
- `src/components/shared/SkeletonProductCard.tsx`
- `src/components/shared/SkeletonProductGrid.tsx`
- `src/components/shared/EmptyState.tsx`

**要求**：
- 骨架屏必须匹配真实布局（避免 CLS）
- 空状态组件包含：无结果建议 + 热门类目入口

---

### 4. 内容增强（防薄内容三层结构）

**文件**: 数据层面（通过 Admin 或批量脚本）

**内容生成三层结构**：
```
【必填事实层】规格、标准、材质、尺寸、适配型号、证书（结构化）
【场景层】行业/工况/痛点（每类必须不同）
【决策层】怎么选、避免踩坑、替代方案、维护/存储建议
```

**质量护栏**：
- 同一模板句式在全站出现频次超过阈值就报警
- 每个分类的 buyingGuide 结构必须不同
- 产品 fullDescription 必须有差异化卖点/应用场景/合规标准

**优先级**：先做 Top SKU（80/20 原则）

---

### 5. 模块化内链组件（P0 提前）
**新建文件**: `src/components/shared/RelatedLinks.tsx`

```tsx
// 产品页和分类页通用内链模块
<RelatedLinks 
  guides={relatedGuides}        // Related Guides
  standards={relatedStandards}  // Common Standards (ANSI/EN/ISO)
  industries={relatedIndustries} // Industry Use Cases
/>
```

**内链规则**：
- 不是"随机相关推荐"，是**稳定可预测的主题路径**
- 让 Google 容易理解站点结构

---

### 6. Web Vitals 监控（P0 提前）
**文件**: `src/app/layout.tsx` 或 `src/lib/analytics/webVitals.ts`

```typescript
import { onCLS, onFID, onLCP, onINP } from 'web-vitals';

export function reportWebVitals() {
  onCLS(console.log);  // 先 console，后续接 Analytics
  onFID(console.log);
  onLCP(console.log);
  onINP(console.log);
}
```

**目的**：P0 做了骨架屏后，能量化效果

---

## Phase P1: SEO 内容规模化 (2-4周)

### 7. 词汇表系统 (Glossary Hub)
**新建文件**:
- `src/payload/collections/Glossary.ts`
- `src/app/(frontend)/glossary/page.tsx`
- `src/app/(frontend)/glossary/[slug]/page.tsx`

**页面骨架规格**（避免薄内容）:
```
/glossary/[slug] 页面结构：
├── H1: 术语 + 简短定义
├── 标准/等级解释（含示例）
├── 应用场景（与同类区分）
├── 常见误区
├── 相关标准链接（ANSI/EN/ISO）
├── FAQ (2-3个)
├── 相关产品 (3-5)
└── 相关指南/对比页内链
Schema: DefinedTerm + FAQPage
```

### 8. 产品对比页面（参数页 noindex）
**新建文件**:
- `src/app/(frontend)/compare/page.tsx` (工具页，noindex)
- `src/app/(frontend)/compare/[slug]/page.tsx` (预生成页，可索引)

**URL 与索引策略**:
```
/compare?products=sku1,sku2  → noindex (参数组合页只做 UX)
/compare/nitrile-vs-latex-gloves → 可索引 (预生成静态对比页)
```

**预生成对比页骨架**:
```
├── 先给结论（谁适合谁）
├── 规格表格
├── 场景对比（成本/舒适/耐用/合规）
├── FAQ
├── 推荐产品列表
└── canonical 到自身
```

**Canonical 规则**:
- 参数页 canonical 到对应预生成页（如能映射）
- 否则 canonical 到 /compare (hub 页)

### 9. 主题集群架构
**Pillar Page 骨架** (3000+ words):
```
├── 目录（可跳转）
├── 选择指南（what/how/avoid）
├── 标准与合规（ANSI/EN/ISO）
├── 场景（行业/工况）
├── 相关术语/对比/分类页模块
└── Schema: Article
```

### 10. 站内搜索/筛选 URL 索引规则
**明确定义**:
```
可索引：
- /category/[slug]
- /category/[slug]?page=2 (分页)

不索引 (noindex 或 canonical 到主页)：
- /category/[slug]?sort=price-asc
- /category/[slug]?brand=3m&color=blue (筛选组合)
- /search?q=xxx
```

---

## Phase P2: UX 精细化 (3-4周)

### 11. 高级筛选器 UX
### 12. 产品卡片增强（Quick View, Compare 复选框）
### 13. 结账流程优化

---

## Phase P3: 高级功能 (4-6周)

### 14. 真实评论评分系统
**上线后才开放 Product Schema 的 aggregateRating/review**

**审计链路要求**:
- 只允许来自真实订单的评价
- 必须有：订单号/用户/时间

### 15. AI 内容生成工具（含重复度检测）
### 16. 性能监控深化

---

## P0 交付清单（验收标准）

- [ ] **Product Schema**: offers/availability/price/currency/url/return policy/shipping 完整且与页面可见内容一致
- [ ] **不上虚假 review/aggregateRating**（或仅真实订单评价）
- [ ] **Header/Mega-menu/FilterBar/RFQForm**: 键盘全流程可用 + 读屏可理解
- [ ] **Skeleton**: 分类页/搜索页/产品页关键区域有 fallback，CLS 受控
- [ ] **分类 buyingGuide/FAQ**: 每个类目至少有独特结构与差异化段落（避免模板化）
- [ ] **Compare 参数页 noindex** + 预生成对比页可索引 + canonical 正确
- [ ] **Web Vitals 开始采集**（至少能看到每版本变化）
- [ ] **内链模块**: RelatedLinks 组件上线

---

## 关键文件清单

### Phase P0
| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/app/(frontend)/product/[category]/[slug]/page.tsx` | 修改 | Product Schema (不含假 rating) |
| `src/components/layout/Header.tsx` | 修改 | ARIA + 键盘导航 + 焦点管理 |
| `src/components/category/FilterBar.tsx` | 修改 | ARIA + button 语义 |
| `src/components/forms/RFQForm.tsx` | 修改 | 表单验证 ARIA + 错误聚焦 |
| `src/components/shared/SkeletonProductCard.tsx` | 新建 | 骨架屏（匹配真实布局）|
| `src/components/shared/SkeletonProductGrid.tsx` | 新建 | 骨架屏网格 |
| `src/components/shared/EmptyState.tsx` | 新建 | 空状态组件 |
| `src/components/shared/RelatedLinks.tsx` | 新建 | 模块化内链组件 |
| `src/lib/analytics/webVitals.ts` | 新建 | Web Vitals 采集 |

### Phase P1
| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/payload/collections/Glossary.ts` | 新建 | 词汇表 Collection |
| `src/app/(frontend)/glossary/page.tsx` | 新建 | 词汇表索引页 |
| `src/app/(frontend)/glossary/[slug]/page.tsx` | 新建 | 术语详情页 |
| `src/app/(frontend)/compare/page.tsx` | 新建 | 对比工具页 (noindex) |
| `src/app/(frontend)/compare/[slug]/page.tsx` | 新建 | 预生成对比页 (可索引) |

---

## 成功指标 (KPIs)

### SEO 工程指标
| 指标 | 口径 | 目标 |
|------|------|------|
| Rich Results 合格率 | GSC 增强报告 Valid/Total | 8周内 >70% |
| 索引效率 | 新增页面 14 天内被索引比例 | >60% |
| 内链密度 | 平均每页内部链接数 | 5+ |

### UX 工程指标
| 指标 | 口径 | 目标 |
|------|------|------|
| LCP (p75) | Field data (真实用户) | < 2.5s |
| INP (p75) | Field data | < 200ms |
| CLS (p75) | Field data | < 0.1 |
| WCAG AA 合规率 | axe-core 检测 | 90%+ |

### 业务指标
| 指标 | 目标 |
|------|------|
| 有机流量 | +50% (6个月) |
| RFQ 提交量 | +40% |
| 购物车完成率 | +25% |

---

## 验证方法

### SEO 验证
1. **Schema 验证**: https://search.google.com/test/rich-results
2. **GSC 增强报告**: 检查 Valid/Error 比例
3. **索引检查**: `site:machrio.com/glossary` 确认收录

### UX 验证
1. **axe DevTools**: 每个页面无 Critical/Serious 问题
2. **键盘测试**: Tab 遍历所有交互元素，ESC 关闭所有弹窗
3. **屏幕阅读器**: VoiceOver 完整流程测试

### 回归测试
1. `npm run build` 无编译错误
2. 核心流程手动测试（搜索 → 分类 → 产品 → 购物车 → RFQ）
3. 移动端响应式检查

---

## 风险与缓解

| 风险 | 缓解策略 |
|------|----------|
| AI 生成内容质量参差/模板化 | 三层内容结构 + 重复度检测报警 |
| Compare 参数页被索引导致重复内容 | 参数页 noindex + canonical 到预生成页 |
| Rich Results 不给 | Schema 内容与页面可见内容一致性检查 |
| 可访问性表面合规实际不可用 | 键盘全流程测试 + 焦点管理验证 |
| 性能优化无法量化 | P0 即埋 Web Vitals 采集 |
