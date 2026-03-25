# Mobile Responsive Fixes

## Summary
Fix mobile (390px viewport) layout issues across the site. Based on code analysis against `container-main` (px-4 = 358px usable width at mobile).

> Note: Browser audit was performed at desktop viewport — many reported "critical" issues (product grid 4-col, knowledge center 3-col, related products 6-col) are **false positives**. The code already has correct responsive breakpoints for these components. This plan focuses on **real** mobile issues identified from code analysis.

---

## P0 — Broken at mobile viewport

### Fix 1: Announcement bar overflow
**File:** `src/components/layout/Header.tsx` (lines 265-301)

**Problem:** Top bar uses `flex justify-between` with left side ("Same-Day Shipping" + "Quality Guaranteed" ~294px) and right side ("sales@machrio.com" + "Get a Quote" ~260px). Total ~554px > 358px usable. Will cause horizontal scroll on mobile.

**Fix:**
- Hide "Quality Guaranteed" on mobile: add `hidden sm:flex` to that span
- Hide email text on mobile, keep "Get a Quote" button: add `hidden sm:flex` to email link
- Result: mobile shows only "Same-Day Shipping" (left) + "Get a Quote" button (right) — clean single-row layout

```
Before: [Same-Day Shipping] [Quality Guaranteed] ... [sales@machrio.com] [Get a Quote]
After:  [Same-Day Shipping]                      ... [Get a Quote]
         (sm+: all items visible)
```

### Fix 2: EmptyStateAIDialog hero padding
**File:** `src/components/category/EmptyStateAIDialog.tsx` (line 207)

**Problem:** Hero section uses `px-8` (32px each side). On 390px screen inside container-main, content area is only 294px — wastes 18% of width.

**Fix:** Change `px-8` to `px-4 sm:px-8` on the hero div. Similarly change `pt-8` to `pt-6 sm:pt-8`.

---

## P1 — Poor UX at mobile viewport

### Fix 3: Breadcrumbs truncation
**File:** `src/components/shared/Breadcrumbs.tsx` (lines 30-49)

**Problem:** `flex flex-wrap` with no truncation. Product breadcrumbs like "Home > Tape > Surface Protection Tape > EVA Foam Tape, White Single Sided, 0.197 in Thickness, 0.394 in Width, 6.56 ft Length" wraps 3-4 lines on mobile, eating significant vertical space.

**Fix:**
- On the last item (current page), add `max-w-[200px] truncate` on mobile: `className="max-w-[200px] truncate sm:max-w-none text-secondary-800"`
- This caps the last breadcrumb label to ~200px with ellipsis on mobile, full text on sm+

### Fix 4: Header touch targets
**File:** `src/components/layout/Header.tsx` (lines 497-528)

**Problem:** Account and Cart icon areas are `h-5 w-5` (20px), below 44px minimum touch target.

**Fix:** Add `min-w-[44px] min-h-[44px] justify-center` to the Account and Cart Link wrappers. Visual size unchanged, touch area expanded via padding.

### Fix 5: Footer mobile layout improvement
**File:** `src/components/layout/Footer.tsx` (line 39)

**Problem:** `grid-cols-2 gap-8 md:grid-cols-6` puts 5 link sections into 2 columns after the brand row. Each column is ~163px. Section titles like "CUSTOMER SUPPORT" and "BUSINESS SERVICES" are cramped, and `gap-8` (32px) wastes space.

**Fix:** 
- Change to `grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-6`
- Brand section: change `col-span-2 md:col-span-1` to `sm:col-span-2 md:col-span-1`
- Mobile: single column (full-width, easy to scan), sm: 2 columns, md+: 6 columns

---

## Files to modify

| File | Changes |
|------|---------|
| `src/components/layout/Header.tsx` | Fix 1 (announcement bar hide items) + Fix 4 (touch targets) |
| `src/components/category/EmptyStateAIDialog.tsx` | Fix 2 (hero padding) |
| `src/components/shared/Breadcrumbs.tsx` | Fix 3 (last item truncation) |
| `src/components/layout/Footer.tsx` | Fix 5 (single-col mobile) |

## Verification
1. `npm run build` — ensure no type/build errors
2. Open browser DevTools, toggle mobile viewport (390px width)
3. Check pages:
   - Homepage: announcement bar single row, footer single column
   - `/category/ventilation-fans`: EmptyStateAIDialog hero not cramped
   - Product detail page: breadcrumbs last item truncated, Account/Cart tappable
4. Deploy to Vercel, verify on actual phone
