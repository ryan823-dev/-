# PaintCell Mobile UX Fix Spec

## Overview
Fix 11 mobile UX issues found via code audit of the PaintCell website. All changes are Tailwind-only, mobile-first overrides that don't affect desktop layout.

---

## P0 - Breaks Core Usability (3 fixes)

### 1. Floating CTA button text overflow
**File:** `src/components/ai-assistant/FloatingAssistantButton.tsx`
- **Problem:** "Start a project consultation" button at `fixed bottom-6 right-6` overflows on <400px screens
- **Fix:**
  - Line 94: `fixed bottom-6 right-6 z-50` -> `fixed bottom-6 right-4 sm:right-6 z-50 max-w-[calc(100vw-2rem)]`
  - Line 122: Split text into `<span className="sm:hidden">Consult</span><span className="hidden sm:inline">Start a project consultation</span>`

### 2. Chat panel input hardcoded height + no touch resize
**File:** `src/components/ai-assistant/AIChatPanel.tsx`
- **Problem:** `style={{ height: 80 }}` (line 324) is fixed; drag handle (lines 298-316) only supports mouse, not touch
- **Fix:**
  - Line 324: Replace `style={{ height: 80 }}` with `className="min-h-[80px]"`
  - Lines 298-316: Add `touch-none` class to handle; add `onTouchStart`/`onTouchMove`/`onTouchEnd` mirroring mouse logic using shared `startResize()` local function

### 3. Quote wizard buttons squeezed + over-padded container
**File:** `src/components/quote/QuoteWizard.tsx`
- **Problem:** Previous/Next side-by-side on 320px (line 94); `p-6` leaves only 272px content width (line 86)
- **Fix:**
  - Line 86: `p-6 md:p-8` -> `p-4 sm:p-6 md:p-8`
  - Line 94: `flex justify-between` -> `flex flex-col-reverse gap-2 sm:flex-row sm:justify-between`
  - Each Button: add `w-full sm:w-auto`

---

## P1 - Suboptimal Experience (4 fixes)

### 4. ROI metrics font overflow
**File:** `src/components/industry/IndustryPageTemplate.tsx` (line 300-309)
- **Problem:** `grid-cols-2` + `text-2xl` values overflow in 140px-wide cards on small screens
- **Fix:**
  - Line 304: `text-2xl md:text-3xl` -> `text-xl sm:text-2xl md:text-3xl`
  - Card `p-6` -> `p-4 sm:p-6`

### 5. Production Config table horizontal scroll
**File:** `src/components/industry/IndustryPageTemplate.tsx` (lines 261-287)
- **Problem:** Simple 2-column table forces horizontal scroll on mobile
- **Fix:** Add a `md:hidden` stacked card-list above the table; wrap table with `hidden md:block`
  - Mobile: renders as `<dl>` with parameter name above value, full width
  - Desktop: keeps existing table unchanged

### 6. Case Reference card key-value overflow
**File:** `src/components/industry/IndustryPageTemplate.tsx` (lines 329-331)
- **Problem:** `flex justify-between` with long values like "2x robot cell, rotary bell" wraps poorly
- **Fix:** `flex justify-between` -> `flex flex-col sm:flex-row sm:justify-between gap-0.5`

### 7. Delivery steps connector line too tall
**File:** `src/components/industry/IndustryPageTemplate.tsx` (line 398)
- **Problem:** `w-px flex-1` connector extends too far in mobile single-column
- **Fix:** Add `max-h-[60px]` to limit connector line height

---

## P2 - Visual Polish (4 fixes)

### 8. Footer legal links messy wrap
**File:** `src/components/layout/Footer.tsx` (lines 98-106)
- **Problem:** 3 links + 2 dot separators wrap mid-line on <400px
- **Fix:**
  - Outer div: `flex flex-wrap gap-x-3 gap-y-1 justify-center sm:justify-end`
  - Dot separators: add `hidden sm:inline`

### 9. Hero H1 text size jump
**File:** `src/components/industry/IndustryPageTemplate.tsx` (line 135)
- **Problem:** `text-3xl` (30px) too large on 320px for long titles
- **Fix:** `text-3xl md:text-4xl` -> `text-2xl sm:text-3xl md:text-4xl`

### 10. CTA section 3-button layout
**File:** `src/components/industry/IndustryPageTemplate.tsx` (lines 349-376)
- **Problem:** Three buttons wrap 2+1 on mobile, lonely third button looks unbalanced
- **Fix:**
  - Wrapper: `flex flex-wrap gap-3` -> `flex flex-col sm:flex-row flex-wrap gap-3`
  - Each Button: add `w-full sm:w-auto`

### 11. SolutionPageTemplate similar issues
**File:** `src/components/solutions/SolutionPageTemplate.tsx`
- Apply same H1 sizing fix: `text-2xl sm:text-3xl md:text-4xl`
- Apply same ROI grid fix if present: `text-xl sm:text-2xl md:text-3xl`, Card `p-4 sm:p-6`

---

## Files Modified (5 files)

| File | Changes | Priority |
|------|---------|----------|
| `src/components/quote/QuoteWizard.tsx` | Padding + button layout | P0 |
| `src/components/ai-assistant/FloatingAssistantButton.tsx` | CTA text responsive | P0 |
| `src/components/ai-assistant/AIChatPanel.tsx` | Input height + touch resize | P0 |
| `src/components/industry/IndustryPageTemplate.tsx` | 6 fixes (ROI, table, cards, hero, CTA, steps) | P1/P2 |
| `src/components/layout/Footer.tsx` | Legal links wrap | P2 |
| `src/components/solutions/SolutionPageTemplate.tsx` | H1 + ROI sizing parity | P2 |

---

## Verification

1. `npm run build` - ensure no compilation errors
2. Open dev server with Chrome DevTools mobile emulation:
   - iPhone SE (375px) - test all modified components
   - iPhone 14 Pro (393px) - primary test device
   - iPad Mini (768px) - tablet breakpoint
3. Specific checks:
   - Floating CTA button fully visible on 375px screen
   - Quote wizard Previous/Next stacked on mobile, side-by-side on sm+
   - AI chat drawer: drag resize works with finger on touch device
   - Production Config table: stacked on mobile, table on md+
   - Footer legal links: no orphan dot separators on mobile
   - ROI metrics: no text overflow in grid cards on 320px
4. Desktop regression check at 1440px - no visual changes
