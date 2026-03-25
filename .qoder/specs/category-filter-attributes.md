# L3分类自定义筛选属性实现计划

## 概述
为Machrio的409个L3分类页面添加自定义筛选属性功能。属性名称来自Excel表格，筛选值从产品的`specifications`字段动态聚合。

## 数据源
- **Excel文件**: `/Users/oceanlink/Documents/Machrio_Category_Attributes.xlsx`
- **结构**: 440行 x 13列 (No., L1, L2, L3, Attribute 1-9)
- **有效L3分类**: 409个

## 实现步骤

### Step 1: 修改Categories Schema
**文件**: `machrio/src/payload/collections/Categories.ts`

在`facetGroups`字段后添加新字段：

```typescript
{
  name: 'customFilterAttributes',
  type: 'array',
  maxRows: 9,
  admin: {
    description: 'Custom filter attributes for L3 categories (from Excel)',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Attribute name (e.g., Abrasive Grade)' },
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      admin: { description: 'URL-safe key (e.g., abrasive-grade)' },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
    },
  ],
},
```

### Step 2: 创建导入脚本
**文件**: `machrio/scripts/import-category-attributes.cjs`

```javascript
// 读取Excel，匹配L3分类slug，更新customFilterAttributes字段
// 属性名转key: "Abrasive Grade" -> "abrasive-grade"
```

**执行方式**:
```bash
cd machrio && node scripts/import-category-attributes.cjs
```

### Step 3: 添加筛选值聚合函数
**文件**: `machrio/src/app/(frontend)/category/[slug]/page.tsx`

在现有的`getCategoryBrands`函数后添加：

```typescript
interface CustomFilterValue {
  key: string
  name: string
  values: { value: string; count: number }[]
}

async function getCustomFilterValues(
  categoryId: string,
  childIds: string[],
  attributes: { name: string; key: string }[]
): Promise<CustomFilterValue[]> {
  // 1. 获取该分类下所有产品
  // 2. 遍历products.specifications数组
  // 3. 按attribute.name匹配label（忽略大小写）
  // 4. 聚合唯一值并计数
  // 5. 返回每个属性的可选值列表
}
```

### Step 4: 扩展FilterBar组件
**文件**: `machrio/src/components/category/FilterBar.tsx`

1. **新增Props**:
```typescript
interface FilterBarProps {
  // ...existing props
  customFilters?: CustomFilterValue[]
}
```

2. **新增状态管理**:
```typescript
// 从URL读取自定义筛选参数: ?abrasive-grade=coarse,medium
const [customSelections, setCustomSelections] = useState<Record<string, string[]>>({})
```

3. **渲染动态筛选组**:
```tsx
{customFilters?.map((filter) => (
  <fieldset key={filter.key}>
    <legend>{filter.name}</legend>
    {filter.values.map((v) => (
      <button onClick={() => toggleCustomFilter(filter.key, v.value)}>
        {v.value} ({v.count})
      </button>
    ))}
  </fieldset>
))}
```

### Step 5: 实现客户端过滤逻辑
**文件**: `machrio/src/app/(frontend)/category/[slug]/page.tsx`

修改`getFilteredProducts`函数，在服务端筛选brand/price后，对结果进行客户端筛选：

```typescript
// 解析自定义筛选URL参数
const customFilterParams = parseCustomFilters(searchParams)

// 客户端过滤
let filteredProducts = productsResult.docs
if (Object.keys(customFilterParams).length > 0) {
  filteredProducts = filteredProducts.filter(product => {
    return Object.entries(customFilterParams).every(([key, values]) => {
      const attrName = findAttributeNameByKey(key, category.customFilterAttributes)
      const spec = product.specifications?.find(s => 
        s.label.toLowerCase() === attrName.toLowerCase()
      )
      return spec && values.includes(spec.value)
    })
  })
}
```

### Step 6: URL参数处理
**文件**: `machrio/src/components/category/FilterBar.tsx`

更新`applyFilters`函数支持自定义参数：

```typescript
function applyFilters(overrides?: FilterOverrides) {
  const params = new URLSearchParams()
  // ...existing brand/price params
  
  // 添加自定义筛选参数
  Object.entries(customSelections).forEach(([key, values]) => {
    if (values.length > 0) {
      params.set(key, values.join(','))
    }
  })
  
  router.push(`/category/${categorySlug}?${params.toString()}`)
}
```

## 关键文件清单

| 文件 | 操作 |
|------|------|
| `machrio/src/payload/collections/Categories.ts` | 修改 - 添加customFilterAttributes字段 |
| `machrio/scripts/import-category-attributes.cjs` | 新建 - Excel导入脚本 |
| `machrio/src/app/(frontend)/category/[slug]/page.tsx` | 修改 - 添加聚合和过滤逻辑 |
| `machrio/src/components/category/FilterBar.tsx` | 修改 - 动态渲染自定义筛选组 |

## 数据流

```
Excel → import脚本 → Categories.customFilterAttributes (属性名)
                              ↓
L3页面加载 → getCustomFilterValues() → 从Products.specifications聚合值
                              ↓
FilterBar组件 → 显示动态筛选组 → 用户选择 → URL参数更新
                              ↓
getFilteredProducts() → 服务端(brand/price) + 客户端(custom)过滤
```

## 验证步骤

1. **Schema验证**: 
   - 启动dev server，访问admin面板
   - 检查Categories编辑页面是否显示新字段

2. **导入验证**:
   ```bash
   cd machrio && node scripts/import-category-attributes.cjs
   ```
   - 检查MongoDB中categories文档的customFilterAttributes字段

3. **前端验证**:
   - 访问L3分类页面如 `/category/sanding-blocks`
   - 检查左侧筛选栏是否显示Abrasive Grade等自定义筛选组
   - 测试筛选功能和URL参数

4. **边界情况**:
   - 空分类（无产品）→ 筛选组不显示
   - 无匹配specifications的属性 → 该筛选组隐藏
   - 多选筛选 → URL参数用逗号分隔

## 注意事项

- **大小写匹配**: specifications.label与attribute.name匹配时忽略大小写
- **性能**: 聚合函数使用现有的products查询，避免额外数据库调用
- **SEO**: 带自定义筛选参数的URL设置`noindex`（已有逻辑支持）
