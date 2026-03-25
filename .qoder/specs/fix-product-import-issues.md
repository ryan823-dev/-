# Fix Product Import Issues

## Problem Summary

160 products imported via Excel, but multiple field mapping bugs and admin UX issues found.

## Root Cause Analysis

### Bug 1: SEO fields not imported (Meta Title, Meta Description, Focus Keyword)
**File:** `src/app/api/products/bulk-import/route.ts` lines 385-390
**Root cause:** Import writes to `productData.meta.title` / `productData.meta.description` but schema field path is `seo.metaTitle` / `seo.metaDescription`. Focus Keyword is never read from Excel at all.

### Bug 2: Cost Price not imported
**File:** `src/app/api/products/bulk-import/route.ts` line 19, 330-331
**Root cause:** Code looks for column `Cost Price (USD)` but Excel uses `Cost Price (CNY)`.

### Bug 3: Weight not in import template
**Root cause:** Excel template and import code have no Weight column. Schema has `shippingInfo.weight`.

### Bug 4: Categories field empty
**Root cause:** Import only sets `primaryCategory` (line 350). The `categories` (hasMany) field is never populated.

### Bug 5: Product list not sorted by newest first
**File:** `src/payload/collections/Products.ts`
**Root cause:** No `defaultSort` configured. Need to add `defaultSort: '-createdAt'`.

### Bug 6: Date filter not working
**Root cause:** Payload CMS admin list filters need explicit configuration. `createdAt` and `updatedAt` need to be surfaced in `listSearchableFields` or added to filterable fields.

### Bug 7: Facets section should be removed
**Root cause:** User confirmed specs cover attribute data, Facets is redundant.

---

## Files to Modify

1. **`machrio/src/app/api/products/bulk-import/route.ts`** — Fix field mapping
2. **`machrio/src/payload/collections/Products.ts`** — Sort, filters, remove facets
3. **`machrio/src/app/api/products/bulk-import/template/route.ts`** — Add Weight + Focus Keyword columns to template

---

## Implementation Plan

### Task 1: Fix bulk import field mapping (`route.ts`)

**a) Fix SEO fields (lines 385-390):**
```typescript
// BEFORE (wrong field path):
productData.meta = {
  title: row['Meta Title'] || `${name} | Machrio`,
  description: row['Meta Description'] || shortDescription.substring(0, 160),
}

// AFTER (correct field path):
productData.seo = {
  metaTitle: row['Meta Title'] || undefined,
  metaDescription: row['Meta Description'] || undefined,
  focusKeyword: row['Focus Keyword'] || undefined,
}
```

**b) Fix Cost Price column name (line 19, 330-331):**
- Add `'Cost Price (CNY)'` to the interface
- Change parsing to read `Cost Price (CNY)` first, fall back to `Cost Price (USD)`

**c) Add Weight import:**
- Add `'Weight (kg)'` to interface
- Parse and write to `shippingInfo.weight`

**d) Populate categories array:**
- After finding L3 category as primaryCategory, also collect L1 and L2 category IDs
- Set `categories: [l1Id, l2Id]` (parent categories)

**e) Add Focus Keyword to interface (line 68-69 area):**
- Already mapped in SEO fix above, just need interface definition

### Task 2: Fix Products collection (`Products.ts`)

**a) Add default sort:**
```typescript
admin: {
  useAsTitle: 'name',
  group: '产品目录',
  defaultColumns: ['name', 'sku', 'primaryCategory', 'status'],
  defaultSort: '-createdAt',  // ADD THIS
```

**b) Remove facets field group (lines 439-482):**
Delete the entire `facets` group from the specifications tab.

**c) Enable date filters:**
Add `createdAt` and `updatedAt` timestamp fields explicitly to make them filterable in admin list view. Payload auto-manages these but they need to be exposed for filtering.

### Task 3: Update import template

**File:** `src/app/api/products/bulk-import/template/route.ts`

Add two new columns to the v4 template:
- `Weight (kg)` — after Package Unit
- `Focus Keyword` — after Meta Description

### Task 4: Fix existing 160 products (one-time script)

Run a MongoDB update script to:
- Migrate `meta.title` → `seo.metaTitle`, `meta.description` → `seo.metaDescription` for all 160 products
- Re-import cost prices from original Excel (since they were lost due to column name mismatch)
- This ensures existing data is corrected without re-importing

---

## Verification

1. **Sort order:** Open admin product list → confirm newest products appear first
2. **Date filter:** Use filter controls → filter by date range → confirm results returned
3. **Re-import a test product:** Upload Excel with 1 product → check all fields populated:
   - Categories field has parent categories
   - Cost Price field has value
   - Weight field has value (if in Excel)
   - Meta Title, Meta Description, Focus Keyword all populated
   - Facets section no longer visible
4. **Frontend check:** Manually set 1 product to Published → visit category page → confirm product appears
5. **Regenerate Payload types:** Run `npx payload generate:types` after schema changes
