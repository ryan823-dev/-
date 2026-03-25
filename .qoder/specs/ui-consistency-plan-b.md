# Plan B: Dark-Light-Dark Visual Rhythm Refactor

## Goal
Establish a consistent **Dark → Light → Dark** visual rhythm across the entire site, replacing the current inconsistent mix of section-gradient, bg-background, bg-muted, and section-dark.

## Design Rules

```
All pages:
  Hero (dark) → Content sections (unified light) → CTA (dark) → Footer (dark)

Content areas:
  - Remove ALL section-gradient usage
  - All content sections use bg-background (inherited)
  - Sections separated by border-t border-border only
  
Dark sections:
  - Use existing .section-dark class (hsl 215 24% 16%)
  - Hero uses hero-gradient (existing) or section-dark
  - CTA + ExploreLinks + Footer all dark
```

## Implementation Steps

### Step 1: CSS — Add Section variant + footer dark link styles
**File:** `paintcell/src/index.css`
- Add `.section-dark a` link styles for footer/ExploreLinks
- Verify existing `.section-dark` rules are sufficient for all use cases

**File:** `paintcell/src/components/ui/section.tsx`
- Change `muted` variant from `section-gradient` to just `bg-background` (effectively same as default)
- Or: remove `section-gradient` from variant mapping entirely

### Step 2: Footer → Dark
**File:** `paintcell/src/components/layout/Footer.tsx`
- Change `bg-muted/40` → `section-dark`
- Change "PaintCell" text → "Painting Systems"
- Adjust text colors: heading text → `text-white`, links → keep `text-accent` hover
- Copyright line: adjust opacity for dark bg

### Step 3: Header — Brand name fix
**File:** `paintcell/src/components/layout/Header.tsx`
- Change "Painting System" → "Painting Systems" (line 39)

### Step 4: ExploreLinks → Dark
**File:** `paintcell/src/components/seo/ExploreLinks.tsx`
- Change `bg-muted/30` → `section-dark`
- Heading "Explore" → add `text-white`
- Category headers: will inherit from `.section-dark .text-muted-foreground` rule
- Links: keep `text-accent` (works well on dark bg)

### Step 5: Homepage — Remove section-gradient
**File:** `paintcell/src/pages/Index.tsx`
Remove `section-gradient` class from these sections (keep `border-t border-border`):
- `#definition` (line 268)
- `#industry-entry` (line 311)
- `#core-capabilities` (line 345)
- `#deployment-process` (line 421)
- `#project-references` (line 564)
- `#faq` (line 639)

Keep unchanged:
- ProjectInterfacePanel hero (already hero-gradient dark) ✓
- `#project-initiation` CTA (already section-dark) ✓

### Step 6: Secondary page Heroes → Dark
For pages that currently have light/white heroes, change to dark hero:

**A. Solutions.tsx** — white `border-b` → `hero-gradient` + white text
**B. Industries.tsx** — white `border-b` → `hero-gradient` + white text  
**C. About.tsx** — `bg-muted` → `section-dark` + white text
**D. CaseStudies.tsx** — `bg-muted` → `section-dark` + white text
**E. Quote.tsx** — check and convert hero to dark

Pages already correct:
- Applications.tsx — photo + dark overlay ✓
- PaintCells.tsx — photo + dark overlay ✓

Pages excluded (special layout):
- IndustryPage.tsx — unique split AI consultation layout, don't change

### Step 7: Secondary page CTAs → Dark
**A. PaintCells.tsx** — `bg-muted` CTA → `section-dark` + white text + button adjustments
**B. Applications.tsx** — `Section variant="muted"` CTA → `section-dark`
**C. About.tsx** — `bg-muted` CTA → `section-dark`
**D. IndustryPageTemplate.tsx** (line ~340) — white CTA → `section-dark` (propagates to 8 industry pages)
**E. SolutionPageTemplate.tsx** — check for CTA section, convert to dark

### Step 8: Template pages — Remove section-gradient
**A. IndustryPageTemplate.tsx** — remove `section-gradient` from ~4 content sections
**B. SolutionPageTemplate.tsx** — remove `section-gradient` from ~5 content sections

### Step 9: Build + Visual Verification
- `npm run build`
- Verify Dark-Light-Dark rhythm on: /, /applications, /paint-cells, /solutions, /industries, /about, /case-studies, /industries/automotive-painting, /solutions/robotic-painting-system

## Critical Files (ordered by impact)

1. `paintcell/src/index.css` — CSS system
2. `paintcell/src/components/layout/Footer.tsx` — dark footer (all pages)
3. `paintcell/src/components/layout/Header.tsx` — brand name
4. `paintcell/src/components/seo/ExploreLinks.tsx` — dark explore section
5. `paintcell/src/components/ui/section.tsx` — Section component variant
6. `paintcell/src/pages/Index.tsx` — homepage sections
7. `paintcell/src/pages/Solutions.tsx` — hero conversion
8. `paintcell/src/pages/Industries.tsx` — hero conversion
9. `paintcell/src/pages/About.tsx` — hero + CTA conversion
10. `paintcell/src/pages/CaseStudies.tsx` — hero + CTA conversion
11. `paintcell/src/pages/PaintCells.tsx` — CTA conversion
12. `paintcell/src/pages/Applications.tsx` — CTA conversion
13. `paintcell/src/pages/Quote.tsx` — hero conversion
14. `paintcell/src/components/industry/IndustryPageTemplate.tsx` — remove gradient + CTA dark (8 pages)
15. `paintcell/src/components/solutions/SolutionPageTemplate.tsx` — remove gradient + CTA dark (3 pages)

## Verification
1. `npm run build` — no errors
2. Visual check key pages for Dark-Light-Dark rhythm
3. Verify button/link contrast on dark sections (WCAG)
4. Check mobile responsiveness of dark hero sections
