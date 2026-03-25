# Tiered Pricing Auto-Generation

## Goal
1. One-time script to backfill tiered pricing for all existing products with basePrice
2. `beforeChange` hook on Products to auto-generate tiered pricing for new/updated products
3. Staff can manually edit any auto-generated values in the admin panel

## Strategy: Fixed Percentage Tiers
Default tiers (applied when product has basePrice but no tieredPricing):

| Tier | Qty Range | Discount | Example ($99.99 base) |
|------|-----------|----------|----------------------|
| 1 | 1 - 9 | 0% (base) | $99.99 |
| 2 | 10 - 49 | 5% | $94.99 |
| 3 | 50+ | 10% | $89.99 |

Unit prices are rounded to 2 decimal places.

## Files to Modify

1. **`src/payload/collections/Products.ts`** - Add `beforeChange` hook
2. **`scripts/backfill-tiered-pricing.cjs`** - One-time migration script

## Implementation

### Step 1: Add beforeChange Hook (`Products.ts`)

Add a `beforeChange` hook that auto-generates tiered pricing when:
- `pricing.basePrice` exists and is > 0
- `pricing.tieredPricing` is empty/undefined/has length 0

```typescript
hooks: {
  beforeChange: [
    ({ data }) => {
      const basePrice = data?.pricing?.basePrice
      if (basePrice && basePrice > 0) {
        const existing = data.pricing?.tieredPricing
        if (!existing || !Array.isArray(existing) || existing.length === 0) {
          data.pricing.tieredPricing = [
            { minQty: 1, maxQty: 9, unitPrice: Math.round(basePrice * 100) / 100 },
            { minQty: 10, maxQty: 49, unitPrice: Math.round(basePrice * 0.95 * 100) / 100 },
            { minQty: 50, unitPrice: Math.round(basePrice * 0.90 * 100) / 100 },
          ]
        }
      }
      return data
    },
  ],
}
```

Key behavior:
- **Only triggers when tieredPricing is empty** - won't overwrite manual edits
- If staff clears tieredPricing and saves, it will regenerate from basePrice
- If staff edits individual tier values, those are preserved on subsequent saves

### Step 2: Backfill Script (`scripts/backfill-tiered-pricing.cjs`)

Node.js script using MongoDB driver directly:
- Query all products with `pricing.basePrice > 0` AND (`pricing.tieredPricing` is null/empty)
- Apply same 3-tier logic as the hook
- Use `bulkWrite` for performance
- Log progress and summary

### Step 3: Update Bulk Import (`route.ts`)

In the existing bulk import API, after setting `pricing.basePrice`, also auto-generate tieredPricing if not provided (same logic as the hook, keeping it DRY by extracting to a shared util if needed - but since it's 5 lines, inline is fine).

## Verification

1. Run backfill script - verify products now have tieredPricing in DB
2. Visit a product page - verify TieredPricingTable renders with "Volume Pricing - Buy More, Save More"
3. Create a new product via admin with basePrice - verify tieredPricing auto-populates
4. Edit a product's tieredPricing values manually - verify they persist on save
5. Upload product via bulk import with basePrice - verify tieredPricing auto-generates
