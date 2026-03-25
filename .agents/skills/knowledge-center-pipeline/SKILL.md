---
name: knowledge-center-pipeline
description: "[project] End-to-end B2B knowledge center content pipeline: from keyword intent to published article. Covers article structure templates, typography rules, Schema.org structured data, SEO/AEO metadata, FAQ design, and CMS landing. Use when creating knowledge center articles, buying guides, how-to guides, FAQ pages, or any long-form SEO/AEO content for B2B industrial sites."
tags: [seo, aeo, content, knowledge-center, b2b, article, faq, schema, buying-guide]
---

# Knowledge Center Content Pipeline

## Core Philosophy

> Knowledge center content is not blogging. It is **structured information engineering** designed to serve three audiences simultaneously: human readers scanning for answers, search engine crawlers extracting structured data, and AI engines compiling citations.

Every article must pass a triple test:
1. **Scannable** — A human gets the answer in <10 seconds
2. **Crawlable** — Google extracts Featured Snippet + FAQ Rich Results
3. **Citable** — AI engines (ChatGPT, Perplexity, Claude) quote your content as a source

---

## When to Use This Skill

- Writing knowledge center / resource hub articles
- Creating buying guides for product categories
- Building FAQ pages optimized for AI citation
- Producing how-to guides with step-by-step structure
- Generating comparison articles (Product A vs B)
- Any long-form content targeting informational or commercial-intent keywords
- Optimizing existing articles for readability and AEO

---

## Step 1: Keyword Intent Classification

Before writing anything, classify the target keyword:

| Intent Type | Signal Words | Best Article Format |
|---|---|---|
| **Informational** | what is, how does, why, types of | Explainer / How-to Guide |
| **Commercial** | best, vs, review, how to choose, which | Buying Guide / Comparison |
| **Navigational** | [brand] + [product], specs, datasheet | Product-focused Guide |
| **Transactional** | buy, price, order, quote | Product page (not article) |

### Decision Rules

```
IF intent = transactional → Don't write an article. Optimize product page.
IF intent = informational → Write Explainer or How-to Guide
IF intent = commercial   → Write Buying Guide or Comparison
IF intent = navigational  → Write Product-focused Guide with specs
```

### Deriving Article Format from Intent

```
"what is [X]"                    → Explainer (define, explain, educate)
"types of [X]"                   → Category Explainer (classify, compare)
"how to choose [X]"             → Buying Guide (decision framework)
"[X] vs [Y]"                    → Comparison (side-by-side analysis)
"how to [verb] with [X]"        → How-to Guide (step-by-step)
"are all [X] the same"          → Myth-buster / Explainer (clarify differences)
"when choosing [X] for your job" → Buying Guide (selection criteria)
```

---

## Step 2: Article Structure Templates

### Template A: Buying Guide (Commercial Intent)

```
H1: How to Choose [Product] for [Application/Job]
│
├── Quick Answer (50 words max — the snippet Google/AI will grab)
├── H2: Quick Decision Flowchart (text-based, AI-parseable)
│     Step 1 → Step 2 → Step 3 (if/then logic)
├── H2: [Product] Types at a Glance
│     ├── H3: Type A (APF/specs, best for, limitations)
│     ├── H3: Type B
│     └── H3: Type C
├── H2: Step 1: Identify Your [Variable] (e.g., Hazard)
├── H2: Step 2: Calculate Required [Metric]
├── H2: Step 3: Choose [Component] (filters, sizes, etc.)
├── H2: Step 4: Consider Practical Factors
│     ├── H3: Comfort / Duration
│     ├── H3: Cost
│     └── H3: Special Requirements
├── H2: Common Selection Mistakes
├── H2: Industry-Specific Recommendations
│     ├── H3: Industry A
│     ├── H3: Industry B
│     └── H3: Industry C
├── H2: Compliance / Regulatory Checklist
├── H2: Key Takeaways (bullet list)
├── H2: Next Steps (CTAs with internal links)
└── FAQ Section (5-8 questions, Schema.org markup)
```

### Template B: Explainer / How-to Guide (Informational Intent)

```
H1: [Topic] Explained: [Benefit/Outcome]
│
├── Quick Answer (50 words max)
├── H2: What Is [Topic]
├── H2: Why It Matters
├── H2: Key Concepts / Categories
│     ├── H3: Concept A
│     ├── H3: Concept B
│     └── H3: Concept C
├── H2: How to [Apply/Use/Implement]
│     Step-by-step with short paragraphs
├── H2: Common Mistakes / Misconceptions
├── H2: Key Takeaways
├── H2: Next Steps
└── FAQ Section (3-5 questions)
```

### Template C: Comparison (Commercial Intent)

```
H1: [Product A] vs [Product B]: Which Is Right for [Use Case]
│
├── Quick Answer (one-sentence verdict)
├── H2: At a Glance (comparison table)
├── H2: [Product A] — Overview
├── H2: [Product B] — Overview
├── H2: Key Differences
│     ├── H3: [Dimension 1] (performance, cost, etc.)
│     ├── H3: [Dimension 2]
│     └── H3: [Dimension 3]
├── H2: When to Choose [A] vs [B]
├── H2: Key Takeaways
├── H2: Next Steps
└── FAQ Section (3-5 questions)
```

---

## Step 3: Writing Rules (The "8 Laws of Readable Content")

### Law 1: One Idea Per Paragraph, Max 2 Sentences

```
BAD:
"Respirators are critical PPE but they are definitely not all the same.
Selecting the wrong type can leave workers unprotected against serious
respiratory hazards, and understanding the differences between air-purifying
and atmosphere-supplying respirators is essential for making the right choice
for your specific workplace conditions and exposure levels."

GOOD:
"Respirators are not all the same."
"Choosing the wrong type can leave workers exposed to serious hazards."
```

**Why:** Human scan patterns skip paragraphs >3 lines. AI engines extract cleaner quotes from short paragraphs.

### Law 2: Lists Over Prose

When presenting 3+ items, ALWAYS use a bullet list instead of inline text.

```
BAD:
"Key factors include hazard type, concentration, oxygen levels, duration
of wear, facial hair, and OSHA requirements."

GOOD:
Key factors:
- Hazard type and concentration
- Oxygen levels
- Duration of wear
- Facial hair
- OSHA requirements
```

**Why:** Lists are 3-5x faster to scan. AI engines extract list items as structured answers.

### Law 3: Tables Are AI Gold

Tables have the highest AI citation rate of any content format. Use them for:
- Comparison data (Type A vs Type B)
- Specification references (levels, ratings, codes)
- Decision matrices (if X then Y)

### Law 4: Decision Flowcharts in Text, Not Images

AI engines cannot parse images. Write decision logic as text:

```
GOOD:
"1. Is oxygen below 19.5%?"
"-> Yes: You need supplied-air (SAR or SCBA). Stop here."
"-> No: Continue to step 2."

BAD:
[flowchart.png]
```

### Law 5: Quick Answer Is Non-Negotiable

Every article MUST have a Quick Answer field (50 words max). This is:
- The Featured Snippet candidate for Google
- The AI engine's first-choice quote
- The speakable content for voice assistants

Format: Direct answer to the H1 question. No preamble, no "In this article we'll discuss..."

### Law 6: FAQ Questions Come from Real Search Queries

Don't invent FAQ questions. Source them from:
1. Google "People Also Ask" for the target keyword
2. Google Autocomplete suggestions
3. Answer the Public / AlsoAsked
4. Customer support tickets / sales team input

Each FAQ answer: 2-4 sentences. Direct. No fluff.

### Law 7: Never Quote Prices in Content

```
BAD: "An N95 costs $1-3 per mask"
GOOD: "Disposable N95: lowest upfront cost, no maintenance. Reusable half-face: higher initial cost but pays back within weeks of daily use."
```

Exception: Relative cost comparisons (low/medium/high) are acceptable.

### Law 8: Internal Links Are CTAs

End every article with 2-3 internal links disguised as next steps:

```
"Browse our [Respiratory Protection] catalog for NIOSH-certified options."
"Use our [AI Sourcing Assistant] to get a recommendation."
"[Request a quote] with your exposure data."
```

---

## Step 4: Typography & CSS Specification

All article content must render with these exact specifications:

```css
.article-content {
  font-size: 1.125rem;     /* 18px — optimal for long-form reading */
  line-height: 1.8;         /* generous breathing room */
  max-width: 70ch;          /* optimal reading line width */
}

.article-content p {
  margin-top: 1.5em;        /* clear paragraph separation */
  margin-bottom: 1.5em;
}

.article-content h2 {
  font-size: 1.5rem;        /* 24px */
  font-weight: 700;
  margin-top: 2.5em;        /* strong section break */
  margin-bottom: 1em;
  line-height: 1.3;
}

.article-content h3 {
  font-size: 1.25rem;       /* 20px */
  font-weight: 600;
  margin-top: 2em;
  margin-bottom: 0.75em;
  line-height: 1.4;
}

.article-content li {
  margin-top: 0.75em;
  margin-bottom: 0.75em;
  line-height: 1.7;
}
```

### Why These Numbers

| Property | Value | Rationale |
|---|---|---|
| Font size | 18px | Research shows 16-20px optimal for body text on screens |
| Line height | 1.8 | 1.5 is minimum; 1.8 gives breathing room for dense technical content |
| Max width | 70ch | 60-75 characters per line is optimal; >80ch causes eye strain |
| H2 margin-top | 2.5em | Creates clear visual section breaks during scanning |
| Paragraph margin | 1.5em | Prevents "wall of text" perception |
| List item spacing | 0.75em | Enough to distinguish items without wasting space |

---

## Step 5: Schema.org Structured Data

Every knowledge center article outputs THREE layers of structured data:

### Layer 1: BlogPosting (JSON-LD in `<head>`)

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "How to Choose the Right Respirator for Your Job",
  "description": "Step-by-step respirator selection guide...",
  "author": { "@type": "Organization", "name": "Machrio" },
  "publisher": { "@type": "Organization", "name": "Machrio" },
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-15",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://..." },
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["[data-speakable=\"quick-answer\"]"]
  }
}
```

### Layer 2: FAQPage (JSON-LD, separate script tag)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I choose the right respirator?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start by identifying..."
      }
    }
  ]
}
```

### Layer 3: Microdata on Visible HTML

The FAQ section uses `itemScope`, `itemType`, `itemProp` attributes directly on the visible HTML elements. This provides redundant signals — search engines see structured data in both JSON-LD and microdata.

```html
<section itemScope itemType="https://schema.org/FAQPage">
  <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
    <summary><span itemProp="name">{question}</span></summary>
    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
      <span itemProp="text">{answer}</span>
    </div>
  </details>
</section>
```

---

## Step 6: SEO Metadata Checklist

| Field | Rule | Example |
|---|---|---|
| `metaTitle` | ≤60 chars, include primary keyword | "How to Choose the Right Respirator for Your Job" |
| `metaDescription` | ≤160 chars, action-oriented, include keyword | "Step-by-step respirator selection guide. Match N95, half-face, full-face, PAPR..." |
| `H1` | Match page intent, include keyword, single H1 only | Same as metaTitle or slight variation |
| `slug` | Kebab-case, keyword-rich, no stop words | `how-to-choose-respirator-for-your-job` |
| `quickAnswer` | ≤50 words, direct answer, no preamble | "Identify hazard type, measure exposure..." |
| `excerpt` | 1-2 sentences for listing pages and social sharing | Slightly longer than metaDescription |

---

## Step 7: Article Data Structure

Every article in the CMS contains these fields:

```typescript
interface Article {
  title: string           // H1 / page title
  slug: string            // URL path segment
  excerpt: string         // Summary for listing pages
  category: string        // 'buying-guide' | 'how-to' | 'explainer' | 'comparison'
  tags: string[]          // Taxonomy tags for filtering
  author: string          // Author name
  quickAnswer: string     // ≤50 words, Featured Snippet target
  faq: FAQ[]              // 3-8 items for FAQPage schema
  content: RichText       // Lexical richText document
  seo: {
    metaTitle: string     // ≤60 chars
    metaDescription: string // ≤160 chars
  }
  readingTime: number     // Minutes (calculated from word count)
  status: 'published' | 'draft'
  publishedAt: string     // ISO date
}

interface FAQ {
  question: string        // Sourced from PAA / real queries
  answer: string          // 2-4 sentences, direct
}
```

---

## Step 8: Content Quality Checklist

Before publishing, verify every item:

### Readability
- [ ] All paragraphs are 1-2 sentences max
- [ ] 3+ related items use bullet lists, not prose
- [ ] Comparison data uses tables
- [ ] Decision logic is text-based (not image flowcharts)
- [ ] No paragraph exceeds 3 lines on desktop

### SEO/AEO
- [ ] Quick Answer field filled (≤50 words)
- [ ] H1 contains primary keyword
- [ ] metaTitle ≤60 characters
- [ ] metaDescription ≤160 characters
- [ ] FAQ section has 3-8 questions from real search queries
- [ ] BlogPosting JSON-LD with speakable specification
- [ ] FAQPage JSON-LD + microdata on visible HTML
- [ ] Internal links to 2-3 related pages

### Structure
- [ ] Clear H2 → H3 hierarchy (no skipped levels)
- [ ] Each H2 section is self-contained (can be read independently)
- [ ] Key Takeaways section with bullet list summary
- [ ] Next Steps section with internal link CTAs

### Technical
- [ ] Article renders with `.article-content` CSS class
- [ ] Max width is 70ch
- [ ] Font size is 18px with 1.8 line-height
- [ ] Responsive on mobile (tested)

---

## Anti-Patterns (What NOT to Do)

1. **Wall of text** — Any paragraph >3 lines = rewrite
2. **"In this article, we'll discuss..."** — Delete. Start with the answer.
3. **Generic FAQ questions** — "What is [topic]?" is only acceptable if it IS the target keyword
4. **Image-only flowcharts** — AI engines can't read them
5. **Missing Quick Answer** — This is the #1 AEO signal. Never skip it.
6. **Keyword stuffing** — Natural density 1-2%. Over-optimization triggers penalties.
7. **No internal links** — Every article must link to 2-3 other pages
8. **Prose where lists belong** — If you wrote "X, Y, and Z", make it a bullet list
9. **Long FAQ answers** — Max 4 sentences. If longer, it should be its own article section.
10. **Skipping H3 under H2** — Every H2 section with >3 paragraphs needs H3 sub-sections
