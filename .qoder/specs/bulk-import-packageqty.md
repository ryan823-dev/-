# Bulk Import: packageQty Auto-Parsing & Template Enhancement

## Goal
Extend the product bulk import module so that `packageQty` and `packageUnit` are supported both explicitly (via Excel columns) and automatically (parsed from product name when not provided).

## Files to Modify

1. **`src/app/api/products/bulk-import/template/route.ts`** - Add columns to Excel template
2. **`src/app/api/products/bulk-import/route.ts`** - Process new fields + auto-parse logic

## Implementation

### Step 1: Update Excel Template (`template/route.ts`)

Add two new columns to `templateData` (after `externalImageUrl`):
- `packageQty` - Number of units per package (e.g., 100)
- `packageUnit` - Package unit label (e.g., box, case, pack)

Add corresponding instruction rows in `instructionsData` explaining:
- packageQty: "Number of items per package. If left blank, will auto-detect from product name (e.g., 'Pkg Qty 100')."
- packageUnit: "Package unit label (box, case, pack, roll). Optional."

### Step 2: Update Import API (`route.ts`)

**a) Add fields to ProductRow interface:**
```typescript
packageQty?: string
packageUnit?: string
```

**b) Add auto-parse helper function:**
```typescript
function parsePackageQty(name: string): { qty: number; unit?: string } | null {
  // Match patterns: "Pkg Qty 100", "Pack of 12", "12-Pack", "Box of 50"
  const patterns = [
    /Pkg\s+Qty\s+(\d+)/i,
    /Pack\s+of\s+(\d+)/i,
    /(\d+)[\s-]*Pack\b/i,
    /Box\s+of\s+(\d+)/i,
    /(\d+)[\s-]*(?:pcs?|pieces?)\b/i,
    /Case\s+of\s+(\d+)/i,
    /(\d+)[\s-]*(?:Roll|Count)\b/i,
  ]
  for (const pattern of patterns) {
    const match = name.match(pattern)
    if (match) {
      return { qty: parseInt(match[1], 10) }
    }
  }
  return null
}
```

**c) Integrate into productData construction (after line ~157):**
- If Excel provides `packageQty`, use it directly
- Otherwise, auto-parse from product `name`
- Set `packageUnit` from Excel or leave as-is

```typescript
// Explicit from Excel takes priority
let packageQty = row.packageQty ? parseInt(row.packageQty) : undefined
let packageUnit = row.packageUnit || undefined

// Auto-detect from name if not provided
if (!packageQty) {
  const parsed = parsePackageQty(row.name)
  if (parsed) {
    packageQty = parsed.qty
  }
}

// Add to productData
if (packageQty) productData.packageQty = packageQty
if (packageUnit) productData.packageUnit = packageUnit
```

## Verification

1. Download the new template - verify `packageQty` and `packageUnit` columns exist
2. Test import with explicit values: upload a product with `packageQty=50` in Excel - verify it saves
3. Test auto-parse: upload a product named "Safety Gloves, Pkg Qty 100" without packageQty column value - verify it auto-populates `packageQty=100`
4. Test override: upload with both name containing "Pkg Qty 100" and explicit packageQty=50 - verify explicit value (50) wins
