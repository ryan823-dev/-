# PaintCell Admin Console Upgrade Plan

## Overview

升级后台管理系统，使非技术用户能够完全通过 UI 管理网站内容，无需编辑代码文件。

## Current State Analysis

| 内容类型 | DB表 | Admin UI | 前端Hook | 硬编码回退 |
|---------|------|----------|---------|-----------|
| Industry Pages | `industry_pages` | IndustryPageEditor (JSON textarea) | useIndustryPage | industryData.ts |
| Solution Pages | `solution_pages` | SolutionPageEditor (JSON textarea) | useSolutionPage | solutionData.ts |
| Why Cards | `why_cards` (4行数据) | **无** | **无** | Index.tsx hardcoded |
| Home Banners | `home_banners` (空) | **无** | **无** | **无** |

**核心问题**:
1. Why Cards 和 Home Banners 有 DB 表但无管理 UI
2. Industry/Solution Editor 使用 JSON 文本框，非技术用户无法使用
3. 硬编码数据未迁移到数据库

---

## Implementation Plan

### Phase 1: Why Cards 管理 UI (P1)

**目标**: 创建 `/console/why-cards` 页面管理 4 张卡片

**文件变更**:
- 新建 `src/components/console/ArrayEditor.tsx` - 可复用的数组编辑器组件
- 新建 `src/pages/console/WhyCardsEditor.tsx` - Why Cards 管理页面
- 修改 `src/pages/console/ConsoleLayout.tsx` - 添加导航入口
- 修改 `src/App.tsx` - 添加路由

**ArrayEditor 组件设计**:
```typescript
interface ArrayEditorProps {
  items: Record<string, string>[];
  onChange: (items: Record<string, string>[]) => void;
  fields: { key: string; label: string; multiline?: boolean }[];
  addLabel?: string;
  bilingual?: boolean; // 如果 true，每个字段显示 EN/ZH 并排
}
```

**WhyCardsEditor 布局**:
- 单页面显示全部 4 张卡片（固定数量，不可增删）
- 每张卡片使用 Card 组件包裹
- BilingualField 用于双语字段
- ArrayEditor 用于 `key_constraints` 和 `what_we_need_to_assess` 数组
- 底部单个保存按钮，一次性保存所有卡片

---

### Phase 2: Home Banners 管理 UI (P2)

**目标**: 创建 `/console/home-banners` 页面管理轮播图

**文件变更**:
- 新建 `src/pages/console/HomeBannersEditor.tsx`
- 修改 `src/pages/console/ConsoleLayout.tsx`
- 修改 `src/App.tsx`

**页面设计**: 列表 + Dialog 模式
- 列表显示所有 banner（缩略图 + 标题 + 状态）
- 点击编辑打开 Dialog
- 支持拖拽排序（或上下箭头）
- 支持添加/删除

**Dialog 字段**:
- ImageUpload (必填)
- BilingualField: title
- BilingualField: subtitle
- Input: link_url
- BilingualField: link_text
- Input: sort_order
- Switch: is_visible

---

### Phase 3: 数据迁移脚本 (P3)

**目标**: 将 `industryData.ts` 和 `solutionData.ts` 中的数据迁移到数据库

**文件变更**:
- 新建 `scripts/migrate-to-db.ts`
- 修改 `package.json` 添加 `"migrate-to-db": "npx tsx scripts/migrate-to-db.ts"`

**迁移策略**:
```typescript
// 使用 upsert 确保幂等性
await supabase
  .from("industry_pages")
  .upsert(payload, { onConflict: "slug" });
```

**字段映射** (TS → DB):
- `industryLabel` → `industry_label`
- `painPoints` → `pain_points` (JSONB)
- `faqs` → `faqs` (JSONB)
- 中文字段 (`_zh`) 初始为 null，后续在管理界面填写

---

### Phase 4: Editor UX 改进 (P4)

**目标**: 将 IndustryPageEditor 和 SolutionPageEditor 的 JSON 文本框替换为结构化表单

**文件变更**:
- 修改 `src/pages/console/IndustryPageEditor.tsx`
- 修改 `src/pages/console/SolutionPageEditor.tsx`

**字段改进方案**:

| 字段 | 当前 | 改进后 |
|------|------|-------|
| pain_points | JSON textarea | ArrayEditor: [{title, description}] |
| system_modules | JSON textarea | ArrayEditor: [{name, description}] |
| roi_metrics | JSON textarea | ArrayEditor: [{value, label}] |
| faqs | JSON textarea | ArrayEditor: [{question, answer}] |
| case_references | JSON textarea | ArrayEditor: [{title, config, metric, result}] |
| production_config | JSON textarea | 5 个固定 Input 字段 |
| ai_context | JSON textarea | 3 个固定 Input 字段 |

---

### Phase 5: 前端 DB 连接 (P5)

**目标**: 让前端从数据库读取 Why Cards 和 Home Banners

**文件变更**:
- 新建 `src/hooks/useWhyCards.ts`
- 新建 `src/hooks/useHomeBanners.ts`
- 修改 `src/pages/Index.tsx` - 使用 hooks 替代硬编码

**Hook 设计**:
```typescript
// useWhyCards.ts
export function useWhyCards() {
  return useQuery({
    queryKey: ["why-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("why_cards")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order");
      
      if (error || !data?.length) {
        return fallbackBenefits; // 硬编码回退
      }
      return data;
    },
  });
}
```

---

## File Changes Summary

### New Files (7)
```
src/components/console/ArrayEditor.tsx      # 可复用数组编辑器
src/pages/console/WhyCardsEditor.tsx        # Why Cards 管理页
src/pages/console/HomeBannersEditor.tsx     # Home Banners 管理页
src/hooks/useWhyCards.ts                    # 前端 hook
src/hooks/useHomeBanners.ts                 # 前端 hook
scripts/migrate-to-db.ts                    # 数据迁移脚本
```

### Modified Files (5)
```
src/pages/console/ConsoleLayout.tsx         # 添加 2 个导航项
src/App.tsx                                 # 添加 2 个路由
src/pages/console/IndustryPageEditor.tsx    # JSON → ArrayEditor
src/pages/console/SolutionPageEditor.tsx    # JSON → ArrayEditor
src/pages/Index.tsx                         # 使用 DB hooks
```

---

## Implementation Order

```
Step 1: ArrayEditor 组件
Step 2: WhyCardsEditor 页面
Step 3: HomeBannersEditor 页面
Step 4: 路由 + 导航更新
Step 5: migrate-to-db.ts 脚本 + 执行
Step 6: IndustryPageEditor UX 改进
Step 7: SolutionPageEditor UX 改进
Step 8: useWhyCards + useHomeBanners hooks
Step 9: Index.tsx 前端连接
```

---

## Verification Steps

| Phase | 验证方法 |
|-------|---------|
| P1 | 访问 `/console/why-cards`，编辑卡片内容，保存后在 Supabase 确认数据更新 |
| P2 | 访问 `/console/home-banners`，添加/编辑/删除/排序 banner，确认 DB 同步 |
| P3 | 运行 `npm run migrate-to-db`，在 Supabase 确认 industry_pages 和 solution_pages 有数据 |
| P4 | 在 IndustryPageEditor 中无需写 JSON 即可添加 pain point、FAQ 等 |
| P5 | 在 Supabase 修改 why_cards 数据，刷新首页确认显示更新 |

---

## Design Principles

1. **保持回退机制** - 所有 hooks 在 DB 失败时回退到硬编码数据
2. **复用现有组件** - BilingualField, ContentCard, ImageUpload, SaveButton
3. **非技术用户友好** - 彻底消除 JSON 文本框
4. **幂等迁移** - 使用 upsert，脚本可安全重复执行
