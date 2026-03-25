# Machrio Search Upgrade - Grainger-Style

## Overview
Upgrade the search system from basic product name/SKU search to a full-featured Grainger-level search experience with multi-entity autocomplete, faceted filtering, sorting, view toggles, product comparison, and search history.

## Implementation Steps (Ordered by Dependency)

---

### Step 1: Enhanced Suggest API
**File:** `src/app/api/search/suggest/route.ts`

- Return 3 entity types: `products` (top 4), `categories` (top 3 with productCount), `brands` (top 2)
- Search categories by name, brands by name (in addition to product name/SKU)
- Response: `{ products: [...], categories: [...], brands: [...] }`

### Step 2: Enhanced Search API with Facets
**File:** `src/app/api/search/route.ts`

- Accept filter params: `brand`, `minPrice`, `maxPrice`, `category`, `availability`, `sort`
- Expand search to include: shortDescription, brand name (via depth: 1 populate)
- Build dynamic where clause based on active filters
- Return facet aggregation data alongside results:
  - `facets.brands`: `[{ name, slug, count }]`
  - `facets.categories`: `[{ name, slug, count }]`
  - `facets.priceRange`: `{ min, max }`
  - `facets.availability`: `[{ value, count }]`
- Sort options: relevance (-createdAt), price-asc, price-desc, name, newest
- Pattern: reuse `getCategoryBrands()` / `getCategoryPriceRange()` aggregation logic from category page

### Step 3: Enhanced Header Autocomplete
**File:** `src/components/layout/Header.tsx`

- Parse new suggest API response (products, categories, brands)
- Render 3 grouped sections in dropdown with section headers
- Implement keyword highlighting: bold matched text in suggestion names
- Add search history: store recent 5 searches in localStorage (`machrio_search_history`), show on focus with empty input

### Step 4: SearchFilters Component (New)
**File:** `src/components/search/SearchFilters.tsx`

- Adapted from existing `FilterBar` component patterns
- Filter sections: Category (new), Brand, Price Range, Availability
- URL-based state via `useSearchParams` + `router.push()`
- Mobile: collapsible panel with toggle; Desktop: sticky sidebar
- Clear all filters button

### Step 5: SearchSortBar Component (New)
**File:** `src/components/search/SearchSortBar.tsx`

- Adapted from existing `DesktopSortBar` component patterns
- Left: result count + active filter chips (removable)
- Right: view toggle (list/grid) + sort dropdown (Relevance, Price ASC/DESC, Name A-Z, Newest)
- Mobile: filter toggle button inline

### Step 6: ProductCompare Component (New)
**File:** `src/components/search/ProductCompare.tsx`
**File:** `src/contexts/CompareContext.tsx`

- CompareContext: global state for selected products (max 4), persisted to localStorage
- Checkbox overlay on ProductGrid cards (top-right corner)
- Floating comparison bar (fixed bottom): shows count + "Compare" button + "Clear"
- Comparison modal: side-by-side table of name, image, SKU, brand, price, specs
- ProductGrid integration: pass `onCompareToggle` callback, render checkbox when in compare mode

### Step 7: Rebuild Search Results Page
**File:** `src/app/(frontend)/search/page.tsx`

- Server component, fetches search data with all filter params
- Layout matching category page: `lg:grid-cols-[220px_1fr]`
- Integrate: SearchFilters (sidebar), SearchSortBar (top), ProductGrid (reused), Pagination, ProductCompare (floating)
- All state via URL searchParams (bookmarkable)
- Empty states: no query, no results, no results with filters

---

## Files Summary

**Modified:**
- `src/app/api/search/suggest/route.ts`
- `src/app/api/search/route.ts`
- `src/components/layout/Header.tsx`
- `src/app/(frontend)/search/page.tsx`

**New:**
- `src/components/search/SearchFilters.tsx`
- `src/components/search/SearchSortBar.tsx`
- `src/components/search/ProductCompare.tsx`
- `src/contexts/CompareContext.tsx`

**Reference (patterns to follow):**
- `src/components/category/FilterBar.tsx`
- `src/components/category/ProductGrid.tsx`
- `src/app/(frontend)/category/[slug]/page.tsx`

---

## Verification
1. Run `npm run build` to verify no TypeScript errors
2. Run `npm run lint` to check linting
3. Manual test: type in search bar -> see products, categories, brands grouped
4. Manual test: search results page shows sidebar filters, sort, view toggle
5. Manual test: apply brand filter -> results update, URL updates, chip appears
6. Manual test: product comparison -> select 2-4 products, click compare, see table
7. Manual test: mobile responsive -> filter toggle, stacked layout
