# Three-Level Category System Rebuild

## Overview
Rebuild Machrio's entire category hierarchy from 9 L1 categories to a 3-level structure (31 L1 + 195 L2 + 409 L3 = 635 categories) based on SEMrush keyword research. Generate SEO content via DashScope (qwen-max), AI-remap 1517 products to L3, and add AI procurement dialog on empty category pages.

## User Decisions (Confirmed)
- **L1 Strategy**: Delete all existing categories, rebuild from spreadsheet as source of truth
- **SEO Content**: Use DashScope qwen-max (already integrated in project)
- **Product Mapping**: AI auto-match products to L3 categories
- **Empty Categories**: Embed AI dialog + RFQ form

## Data Source
**File**: `/Users/oceanlink/Documents/Machrio_Category_Plan_v2.xlsx`
- 31 L1 | 195 L2 | 409 L3 categories
- Types: 72 Quick Win (KD<=20), 36 Core Target, 301 Variant
- Search volumes: 110 - 27,100
- Columns: L1, L2, L3 (Target), Category Type, Search Volume, KD, CPC, Notes

**Naming conflicts** (spreadsheet vs current system):
- "Adhesives, Sealants and Tape" vs "Adhesives & Sealants & Tape" -> use spreadsheet name
- "Plumbing" in spreadsheet vs "Plumbing & Pumps" -> both exist as separate L1s
- "Tools" in spreadsheet vs "Tool Storage & Workbenches" -> both exist as separate L1s

---

## Implementation Steps

### Step 1: Backup & Clean Script
**New file**: `machrio/scripts/category-rebuild/01-backup-and-clean.cjs`

Uses direct MongoDB connection (pattern from existing `generate-category-seo-content.cjs`):
1. Export all categories to `backup/categories-{timestamp}.json`
2. Export product-category mappings to `backup/product-mappings-{timestamp}.json`
   - For each product: `{id, sku, name, primaryCategoryId, primaryCategorySlug, additionalCategorySlugs[]}`
3. Set all products `status: 'draft'` (prevent 404s during migration)
4. Delete all category documents
5. Log counts and verify

**DB**: `mongodb+srv://...` (from existing script at `machrio/scripts/generate-category-seo-content.cjs:10`)
**DashScope key**: `sk-73c6886b82a64d00adf44d147b2dcf63` (from same file line 11)

### Step 2: Bulk Create Categories Script
**New file**: `machrio/scripts/category-rebuild/02-create-categories.cjs`

1. Read Excel with `xlsx` package (already a project dependency in `scripts/import-excel-products.ts`)
2. Parse unique L1 names (31), L2 names per L1 (195), L3 names per L2 (409)
3. Create in order:
   - **L1 first** (31 categories): `{name, slug, description, shortDescription, featured: true, displayOrder: index, iconEmoji}`
   - **L2 second** (195 categories): `{name, slug, parent: l1Id, description, shortDescription}`
   - **L3 third** (409 categories): `{name, slug, parent: l2Id, description, shortDescription}`
4. Store SEMrush metadata on L3 for later use: write `category-metadata.json` with `{categoryId, searchVolume, kd, categoryType, l1, l2, l3}`

**Slug generation**: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')`
- Track used slugs in Set, append parent prefix if collision (e.g., "filters" under different L2s)

**L1 emoji mapping**: Assign appropriate iconEmoji per L1 based on category name (e.g., Abrasives -> grinding wheel, Safety -> shield, etc.)

**Output**: `scripts/category-rebuild/category-id-map.json` mapping `"L1 > L2 > L3" -> mongoId`

### Step 3: Generate SEO Content
**New file**: `machrio/scripts/category-rebuild/03-generate-seo-content.cjs`

Follow exact pattern from existing `machrio/scripts/generate-category-seo-content.cjs`:
- Direct MongoDB connection
- DashScope `qwen-max` with `response_format: { type: 'json_object' }`
- Concurrency: 5 parallel requests
- Retry with backoff on 429

**Target**: All 409 L3 categories + 195 L2 categories + 31 L1 categories (635 total)

**Prompt per category** (adapted from existing script line 66-78):
```
Generate SEO content for "{name}" on Machrio.com (industrial MRO platform).
Category: {name} | Slug: {slug}
Parent: {parentPath}
Category Type: {Quick Win|Core Target|Variant}
Target Keyword: {l3Name} | Search Volume: {vol} | KD: {kd}

Return JSON:
{
  "introContent": "150-200 word intro...",
  "shortDescription": "Under 160 chars, for cards and meta...",
  "buyingGuideTexts": ["Para 1: 60-80 words", "Para 2: 60-80 words", "Para 3: 60-80 words"],
  "seoContentTexts": ["Para 1: industry context 60-80 words", "Para 2: tech trends 60-80 words"],
  "faq": [{"question":"...","answer":"..."}, ...5 items],
  "metaTitle": "Under 60 chars",
  "metaDescription": "Under 160 chars"
}
```

**Lexical conversion**: Use existing `toLexical()` helper (line 80-86 of existing script)

**Fields updated per category**:
- `introContent` (textarea)
- `shortDescription` (textarea, max 160)
- `buyingGuide` (richText -> Lexical)
- `seoContent` (richText -> Lexical)
- `faq` (array of {question, answer})
- `seo.metaTitle`, `seo.metaDescription`

**Estimated time**: 635 categories / 5 concurrency * ~2s = ~4 minutes

### Step 4: AI Product Remapping
**New file**: `machrio/scripts/category-rebuild/04-remap-products.cjs`

1. Load all L3 categories with their full path (L1 > L2 > L3)
2. Load all draft products with name, sku, shortDescription, old primaryCategory info (from backup)
3. **Batch AI matching**: Send batches of 10 products per DashScope call:
   ```
   Match these products to the most appropriate L3 category.
   
   Products:
   1. {name} - {shortDescription}
   2. ...
   
   Available L3 Categories (grouped by L1 > L2):
   [full category list, ~409 items]
   
   Return JSON array: [{"productIndex": 1, "categorySlug": "...", "confidence": 85, "reason": "..."}]
   ```
4. Apply mappings:
   - confidence >= 70: auto-apply `primaryCategory` and set `status: 'published'`
   - confidence < 70: log to `low-confidence-mappings.csv` for manual review
5. Output summary: matched count, avg confidence, low-confidence count

**Estimated API calls**: 1517 products / 10 per batch = ~152 calls
**Estimated time**: 152 calls / 5 concurrency * ~3s = ~2 minutes

### Step 5: Empty Category AI Dialog Component
**New file**: `machrio/src/components/category/EmptyStateAIDialog.tsx`

Client component with two modes:
- **AI Chat mode**: Connects to existing `/api/ai-assistant` endpoint
  - Pre-populates context: "I'm browsing {categoryName} under {parentCategories}"
  - Shows chat bubbles, handles streaming
  - If AI finds products via `search_products` tool, shows product cards
- **RFQ mode**: Inline simplified RFQ form
  - Pre-fills category name
  - Fields: product description, specifications, quantity, email
  - Submits to existing `/api/rfq` endpoint

**UI**: Card layout with mode toggle tabs, centered on page where empty state currently shows

### Step 6: Update Category Detail Page
**File**: `machrio/src/app/(frontend)/category/[slug]/page.tsx`

Replace empty state block (lines 574-602) to use `EmptyStateAIDialog`:
```tsx
{totalDocs === 0 && !hasFilters && (
  <EmptyStateAIDialog
    categoryName={category.name}
    categorySlug={slug}
    parentCategories={parent ? [parent.name] : []}
  />
)}
```

Also update breadcrumbs to support 3 levels (currently supports 2):
```tsx
// If category has grandparent, show 3-level breadcrumb
const breadcrumbs = [
  { label: 'Home', href: '/' },
  ...(grandparent ? [{ label: grandparent.name, href: `/category/${grandparent.slug}` }] : []),
  ...(parent ? [{ label: parent.name, href: `/category/${parent.slug}` }] : []),
  { label: category.name },
]
```

Need to resolve grandparent in `getCategoryBySlug()` function (line 82-107).

### Step 7: Update AI Config
**File**: `machrio/src/lib/ai/config.ts`

1. Change `TOOL_DEFINITIONS` from static array to async function `getToolDefinitions()`
2. Fetch L1 category slugs from DB with 5-minute cache
3. Update system prompt to reference 31 categories instead of hardcoded 9
4. Update `machrio/src/lib/ai/chat.ts` to call `await getToolDefinitions()`
5. Update `machrio/src/app/api/ai-assistant/route.ts` accordingly

### Step 8: Update Navigation
**File**: `machrio/src/components/layout/Header.tsx`

Mega menu redesign for 31 L1 categories:
- Change from 3-column to 4-column grid
- Limit displayed L2 subcategories to top 5 per L1 (with "View all" link)
- Add `max-h-[80vh] overflow-y-auto` for scrollability
- Consider grouping L1s into sections (Tools & Equipment, Safety, Materials, etc.)

**File**: `machrio/src/app/api/categories/nav/route.ts`
- Increase cache time from 5min to 1hr (s-maxage=3600)
- No structural changes needed - already fetches all L1+L2 dynamically

### Step 9: Update Category List Page
**File**: `machrio/src/app/(frontend)/category/page.tsx`

- Currently displays fine with any number of L1 categories (grid layout)
- Update metadata description to reflect 31 categories
- May need to adjust grid for 31 items (consider grouping by industry/type)

---

## Files to Create
| File | Purpose |
|------|---------|
| `machrio/scripts/category-rebuild/01-backup-and-clean.cjs` | Backup data + delete all categories |
| `machrio/scripts/category-rebuild/02-create-categories.cjs` | Create 635 categories from Excel |
| `machrio/scripts/category-rebuild/03-generate-seo-content.cjs` | DashScope SEO content for all categories |
| `machrio/scripts/category-rebuild/04-remap-products.cjs` | AI match products to L3 categories |
| `machrio/src/components/category/EmptyStateAIDialog.tsx` | AI dialog + RFQ for empty categories |

## Files to Modify
| File | Changes |
|------|---------|
| `machrio/src/app/(frontend)/category/[slug]/page.tsx` | Import EmptyStateAIDialog, 3-level breadcrumbs, resolve grandparent |
| `machrio/src/lib/ai/config.ts` | Dynamic category enum, updated system prompt |
| `machrio/src/lib/ai/chat.ts` | Async tool definitions |
| `machrio/src/app/api/ai-assistant/route.ts` | Async tool definitions |
| `machrio/src/components/layout/Header.tsx` | 4-column mega menu, limit subcategories |
| `machrio/src/app/api/categories/nav/route.ts` | Increase cache TTL |

## Execution Order
```
1. Create all 4 migration scripts + 1 component
2. Create EmptyStateAIDialog component
3. Modify frontend files (category page, header, AI config)
4. Run: node scripts/category-rebuild/01-backup-and-clean.cjs
5. Run: node scripts/category-rebuild/02-create-categories.cjs
6. Run: node scripts/category-rebuild/03-generate-seo-content.cjs
7. Run: node scripts/category-rebuild/04-remap-products.cjs
8. Verify locally: browse categories, check products, test AI
```

## Verification Checklist
- [ ] `/category` page shows 31 L1 categories with correct product counts
- [ ] Click into any L1 -> shows L2 subcategories
- [ ] Click into any L2 -> shows L3 subcategories
- [ ] L3 with products -> shows product grid with correct items
- [ ] L3 without products -> shows AI dialog + RFQ form
- [ ] AI dialog sends message and gets response
- [ ] RFQ form submits successfully
- [ ] Breadcrumbs show 3 levels (Home > L1 > L2 > L3)
- [ ] SEO content (introContent, buyingGuide, faq) renders on category pages
- [ ] FAQPage structured data present on pages with FAQ
- [ ] Mega menu shows all L1 categories with L2 subcategories
- [ ] Sitemap includes all 635 category URLs
- [ ] AI assistant search_products tool works with new categories
- [ ] Products have correct URLs: `/product/{l1-slug}/{product-slug}`
- [ ] `npm run build` succeeds with no type errors
