# Machrio UI/UX 重新设计实施计划

## 概述
三项核心改进：飞出式级联导航菜单、分类页面分层设计、后台Admin UI优化

---

## 一、飞出式级联导航菜单

### 目标效果
- 鼠标悬停"Categories"按钮 → 显示L1分类垂直列表
- 悬停L1 → 右侧展开L2子分类面板
- 悬停L2 → 右侧展开L3子分类面板
- 点击任意分类 → 跳转对应页面

### 技术方案

#### 1. API重构
**文件**: `src/app/api/categories/nav/route.ts`

```typescript
// 当前: 扁平两层 {L1, L2[]}
// 改为: 三层嵌套结构
interface NavCategory {
  id: string
  name: string
  slug: string
  children?: NavCategory[]  // L2包含L3
}
```

#### 2. 新增组件

| 组件 | 用途 |
|------|------|
| `CategoryFlyoutMenu.tsx` | 桌面端三级飞出菜单 |
| `CategoryDrawerMenu.tsx` | 移动端全屏抽屉+手风琴 |

#### 3. 状态管理
```typescript
const [activeL1, setActiveL1] = useState<string | null>(null)
const [activeL2, setActiveL2] = useState<string | null>(null)
// 200ms防抖处理鼠标离开
```

#### 4. CSS布局
- L1列表: 固定宽度240px，垂直排列
- L2/L3面板: 绝对定位，紧贴左侧面板右边缘
- 过渡动画: 150ms ease-out
- 最大高度: 70vh with overflow-y: auto

#### 5. 无障碍
- ARIA: role="menu", aria-haspopup, aria-expanded
- 键盘: 方向键导航，Enter确认，Escape关闭
- 焦点: 自动聚焦首项，焦点陷阱

#### 6. 移动端
- 触发: 汉堡菜单图标
- 布局: 全屏抽屉覆盖
- 交互: 点击L1展开L2列表（手风琴），点击L2展开L3

### 修改文件清单
- `src/app/api/categories/nav/route.ts` - 重构API返回结构
- `src/components/layout/Header.tsx` - 集成新菜单组件
- **新增** `src/components/layout/CategoryFlyoutMenu.tsx`
- **新增** `src/components/layout/CategoryDrawerMenu.tsx`

---

## 二、分类页面分层设计

### 层级检测逻辑
```typescript
// 在 page.tsx 中判断
const isL1 = !category.parent && !category.grandparent
const isL2 = category.parent && !category.grandparent  
const isL3 = category.parent && category.grandparent
```

### L1分类页设计

**布局结构**:
```
[面包屑: 首页 > L1名称]
[页面标题 + 描述]
[L2子分类网格 - 6列]
  └─ 每个L2卡片显示:
     - L2名称
     - 产品数量
     - 前8个L3作为标签
[最新上架产品 - 4x2网格 = 8个]
[SEO/AEO内容区]
```

**新增组件**: `src/components/category/L1SubcategoryCard.tsx`

### L2分类页设计

**布局结构**:
```
[面包屑: 首页 > L1 > L2名称]
[页面标题 + 描述]
[L3子分类网格 - 6列，卡片突出显示]
[最新上架产品 - 4x2网格 = 8个]
[SEO/AEO内容区]
```

**增强**: `src/components/category/SubcategoryGrid.tsx` 添加 variant="prominent" 样式

### L3分类页设计

**保持现有结构**:
```
[面包屑: 首页 > L1 > L2 > L3名称]
[页面标题 + 描述]
[筛选栏 - 品牌/价格/属性]
[产品列表 - 支持网格/列表切换]
[SEO/AEO内容区]
```

### 数据获取

**新增函数**:
```typescript
// 获取L2及其L3子分类
async function getL2WithL3Children(parentId: string): Promise<L2Category[]>

// 获取最新上架产品（按createdAt排序）
async function getFeaturedProducts(categoryId: string, limit: number): Promise<Product[]>
```

### 修改文件清单
- `src/app/(frontend)/category/[slug]/page.tsx` - 添加层级判断和条件渲染
- `src/components/category/SubcategoryGrid.tsx` - 添加prominent变体
- **新增** `src/components/category/L1SubcategoryCard.tsx`
- **新增** `src/components/category/FeaturedProductsSection.tsx`

---

## 三、Admin后台UI优化

### 配色系统
| 用途 | 颜色 |
|------|------|
| 侧边栏背景 | #1e293b (深蓝) |
| 主强调色 | #f59e0b (琥珀) |
| 成功状态 | #22c55e |
| 错误状态 | #ef4444 |
| 警告状态 | #eab308 |

### 排版规范
- 页面标题: 32px, font-weight: 600
- 区块标题: 24px, font-weight: 600
- 字段标题: 18px, font-weight: 500
- 正文: 14px, line-height: 1.6
- 标签: 13px, color: #64748b

### 间距规范
- 区块间距: 32px
- 字段间距: 24px
- 卡片内边距: 20px
- 列表行高: 56px

### Products Collection 表单重组

**5个Tab页**:
1. **基本信息** - name, brand, sku, description, status
2. **定价库存** - price, originalPrice, stockStatus, stock
3. **媒体资源** - images, documents
4. **规格筛选** - specifications, attributes
5. **SEO设置** - meta, slug, seoContent

### Categories Collection 表单重组

**5个Tab页**:
1. **基础设置** - name, slug, parent, status
2. **页面内容** - description, pageContent, faq
3. **视觉资源** - icon, banner, thumbnail
4. **筛选配置** - availableFilters, filterBrands
5. **SEO设置** - meta, seoContent

### 新增自定义组件
| 组件 | 用途 |
|------|------|
| `DashboardView.tsx` | 自定义仪表盘首页 |
| `ProductEditTabs.tsx` | Products Tab式编辑 |
| `CategoryEditTabs.tsx` | Categories Tab式编辑 |
| `OrderStatusBadge.tsx` | 订单状态彩色标签 |
| `TreeSelectCategory.tsx` | 树形分类选择器 |

### 修改文件清单
- `src/payload/payload.config.ts` - 注入自定义CSS和组件
- `src/payload/collections/Products.ts` - 配置Tab式编辑
- `src/payload/collections/Categories.ts` - 配置Tab式编辑
- **新增** `src/styles/payload-admin.css`
- **新增** `src/components/admin/*.tsx` (多个组件)

---

## 实施阶段

### Phase 1: 导航菜单 (核心功能)
1. 重构 `/api/categories/nav` API
2. 实现 `CategoryFlyoutMenu.tsx` 桌面组件
3. 实现 `CategoryDrawerMenu.tsx` 移动组件
4. 集成到 `Header.tsx`

### Phase 2: 分类页面 (用户体验)
1. 修改 `page.tsx` 添加层级检测
2. 创建 `L1SubcategoryCard.tsx`
3. 创建 `FeaturedProductsSection.tsx`
4. 增强 `SubcategoryGrid.tsx`

### Phase 3: Admin UI (后台优化)
1. 创建 `payload-admin.css` 样式文件
2. 重组 Products 表单为Tab结构
3. 重组 Categories 表单为Tab结构
4. 添加自定义仪表盘和组件

---

## 验证方案

### 导航菜单测试
- [ ] 桌面端悬停L1→L2→L3级联显示正常
- [ ] 点击各级分类正确跳转
- [ ] 移动端抽屉菜单展开收起正常
- [ ] 键盘导航（方向键、Enter、Escape）

### 分类页面测试
- [ ] L1页面显示所有L2卡片及其L3标签
- [ ] L2页面显示所有L3子分类
- [ ] L3页面筛选功能正常
- [ ] 最新上架产品区显示正确

### Admin后台测试
- [ ] 新配色方案正确应用
- [ ] Products Tab切换流畅
- [ ] Categories Tab切换流畅
- [ ] 表单验证错误显示在对应Tab

---

## 关键文件路径

```
src/
├── app/
│   ├── api/categories/nav/route.ts      # API重构
│   └── (frontend)/category/[slug]/page.tsx  # 分类页面
├── components/
│   ├── layout/
│   │   ├── Header.tsx                   # 集成菜单
│   │   ├── CategoryFlyoutMenu.tsx       # 新增
│   │   └── CategoryDrawerMenu.tsx       # 新增
│   ├── category/
│   │   ├── SubcategoryGrid.tsx          # 增强
│   │   ├── L1SubcategoryCard.tsx        # 新增
│   │   └── FeaturedProductsSection.tsx  # 新增
│   └── admin/
│       ├── ProductEditTabs.tsx          # 新增
│       └── CategoryEditTabs.tsx         # 新增
├── payload/
│   ├── payload.config.ts                # 配置修改
│   └── collections/
│       ├── Products.ts                  # Tab配置
│       └── Categories.ts                # Tab配置
└── styles/
    └── payload-admin.css                # 新增
```
