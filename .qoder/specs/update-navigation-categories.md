# Update Navigation & Categories Plan

## Problem
New product data (1,517 products, 162 categories) has been imported, but the homepage, navigation, and Browse Categories sections still reference old hardcoded category data. Slugs may not match between the code and database.

## Files to Modify

1. **`src/app/(frontend)/page.tsx`** - Homepage: Update `categoryIcons` mapping and `fallbackCategories` to match actual DB slugs
2. **`src/components/layout/Header.tsx`** - Navigation: Add categories mega-menu dropdown under "All Categories"
3. **`scripts/fix-category-metadata.ts`** - New script: Fix `displayOrder` and `featured` flags for level-1 categories in Atlas

## Steps

### Step 1: Fix category metadata in database
Create a small script to:
- Set `featured: true` on all 9 level-1 categories
- Set proper `displayOrder` (1-9) on level-1 categories
- Verify slug values match what code expects

### Step 2: Update homepage (`page.tsx`)
- Update `categoryIcons` mapping to use actual DB slugs (e.g., `cleaning-and-janitorial` not `cleaning-janitorial`)
- Update `fallbackCategories` to match actual DB slugs and names
- Ensure `getCategoriesWithCounts()` query works with new data

### Step 3: Update Header navigation (`Header.tsx`)
- Add a categories dropdown/mega-menu that shows 9 level-1 categories with their subcategories
- Fetch categories dynamically from database
- Show category names with product counts

### Step 4: Build, deploy, and verify
- Run `npm run build`
- Deploy to Vercel
- Verify machrio.com shows correct categories

## Verification
- Visit machrio.com homepage → Browse Categories shows 9 correct categories with product counts
- Click "All Categories" in header → shows dropdown with categories and subcategories
- Visit /category page → shows all 9 level-1 categories
