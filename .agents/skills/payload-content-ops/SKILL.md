---
name: payload-content-ops
description: "[project] Payload CMS content operations for Next.js sites. Covers Lexical richText format, MongoDB direct insertion (bypassing drafts), seed script patterns, article CRUD, and ISR revalidation. Use when seeding articles, debugging Payload draft issues, writing Lexical richText programmatically, or managing content in Payload CMS with MongoDB."
tags: [payload, cms, mongodb, lexical, richtext, seed, content-ops, next.js]
---

# Payload CMS Content Operations

## Core Problem This Skill Solves

Payload CMS with `versions: { drafts: true }` has a critical gotcha: `payload.create()` and `payload.update()` silently store documents as drafts in the `_articles_versions` collection instead of the main `articles` collection. This means seed scripts and programmatic content insertion appear to succeed but the content is invisible to the frontend.

This skill documents the **proven patterns** for reliable content operations with Payload CMS + MongoDB + Next.js.

---

## When to Use This Skill

- Seeding articles or content programmatically
- Debugging "article exists in DB but shows 404"
- Writing Lexical richText content in code
- Building content migration scripts
- Troubleshooting Payload draft/publish behavior
- Setting up ISR (Incremental Static Regeneration) for content pages

---

## Critical: The Drafts Trap

### The Problem

When a Payload collection has `versions: { drafts: true }`:

```typescript
// THIS DOES NOT WORK AS EXPECTED
await payload.create({
  collection: 'articles',
  data: {
    title: 'My Article',
    slug: 'my-article',
    status: 'published',
    _status: 'published',
  },
  draft: false, // Even this doesn't help reliably
})
```

**What happens:** The document goes into `_articles_versions` collection, NOT the main `articles` collection. The frontend queries the main collection and gets nothing. Result: 404.

### The Solution: Direct MongoDB Insertion

```typescript
import { MongoClient, ObjectId } from 'mongodb'

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)
await client.connect()
const db = client.db('your-database')
const col = db.collection('articles')

// Delete if exists (idempotent)
await col.deleteOne({ slug: 'my-article' })

const now = new Date().toISOString()
const doc = {
  _id: new ObjectId(),
  title: 'My Article',
  slug: 'my-article',
  status: 'published',      // This is what matters
  // Do NOT include _status — existing docs don't have it
  publishedAt: now,
  createdAt: now,
  updatedAt: now,
  // ... all other fields
}

await col.insertOne(doc)
await client.close()
```

### Key Rules

1. **Use `status: 'published'`** — NOT `_status`
2. **Always include `_id: new ObjectId()`** — Let MongoDB generate it
3. **Always include timestamps** — `createdAt`, `updatedAt`, `publishedAt`
4. **Make scripts idempotent** — Delete before insert, check existence before create
5. **Match existing document schema** — Inspect a working document first:
   ```bash
   # Check what fields existing articles have
   db.articles.findOne({ slug: 'existing-article' })
   ```

---

## Lexical RichText Format

Payload CMS uses Lexical editor. All richText content is stored as a JSON tree.

### Document Structure

```typescript
{
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: LexicalNode[],
    direction: 'ltr'
  }
}
```

### Node Types

#### Text Node

```typescript
{
  mode: 'normal',
  text: 'Your content here',
  type: 'text',
  format: 0,      // 0=normal, 1=bold, 2=italic, 3=bold+italic
  style: '',
  detail: 0,
  version: 1,
}
```

#### Paragraph Node

```typescript
{
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  children: [/* text nodes */],
  direction: 'ltr',
  textFormat: 0,
  textStyle: '',
}
```

#### Heading Node

```typescript
{
  type: 'heading',
  format: '',
  indent: 0,
  version: 1,
  children: [/* text nodes */],
  direction: 'ltr',
  tag: 'h2',   // 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}
```

#### List Node

```typescript
{
  type: 'list',
  format: '',
  indent: 0,
  version: 1,
  listType: 'bullet',  // 'bullet' | 'number'
  start: 1,
  tag: 'ul',           // 'ul' | 'ol'
  direction: 'ltr',
  children: [/* listitem nodes */],
}
```

#### List Item Node

```typescript
{
  type: 'listitem',
  format: '',
  indent: 0,
  version: 1,
  value: 1,
  children: [/* text nodes */],
  direction: 'ltr',
}
```

### Helper Functions (Copy-Paste Ready)

```typescript
type LexicalNode = {
  type: string
  version: number
  [key: string]: unknown
}

function text(content: string, format: number = 0): LexicalNode {
  return {
    mode: 'normal',
    text: content,
    type: 'text',
    format, // 0=normal, 1=bold, 2=italic, 3=bold+italic
    style: '',
    detail: 0,
    version: 1,
  }
}

function paragraph(children: LexicalNode[]): LexicalNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children,
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
  }
}

function heading(tag: 'h2' | 'h3', content: string): LexicalNode {
  return {
    type: 'heading',
    format: '',
    indent: 0,
    version: 1,
    children: [text(content)],
    direction: 'ltr',
    tag,
  }
}

function listItem(content: string): LexicalNode {
  return {
    type: 'listitem',
    format: '',
    indent: 0,
    version: 1,
    value: 1,
    children: [text(content)],
    direction: 'ltr',
  }
}

function bulletList(items: string[]): LexicalNode {
  return {
    type: 'list',
    format: '',
    indent: 0,
    version: 1,
    listType: 'bullet',
    start: 1,
    tag: 'ul',
    direction: 'ltr',
    children: items.map(listItem),
  }
}

function numberedList(items: string[]): LexicalNode {
  return {
    type: 'list',
    format: '',
    indent: 0,
    version: 1,
    listType: 'number',
    start: 1,
    tag: 'ol',
    direction: 'ltr',
    children: items.map(listItem),
  }
}

function richTextDoc(children: LexicalNode[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  }
}
```

### Usage Example

```typescript
const content = richTextDoc([
  paragraph([text('Choosing the wrong respirator can be dangerous.')]),
  paragraph([text('This guide walks you through the selection process.')]),
  
  heading('h2', 'Types of Respirators'),
  paragraph([text('There are two main classes:')]),
  bulletList([
    'Air-Purifying Respirators (APRs)',
    'Atmosphere-Supplying Respirators',
  ]),
  
  heading('h3', 'Air-Purifying Respirators'),
  paragraph([text('APRs filter contaminants from ambient air.')]),
  paragraph([text('They require at least 19.5% oxygen to function safely.')]),
  
  // Bold text example
  paragraph([
    text('Important: ', 1),
    text('Always check the filter rating before use.'),
  ]),
])
```

---

## Seed Script Pattern

### Complete Seed Script Template

```typescript
// scripts/seed-articles.ts
// Run with: npx tsx scripts/seed-articles.ts

import { MongoClient, ObjectId } from 'mongodb'

// Import Lexical helpers (defined above)
// ... text, paragraph, heading, bulletList, richTextDoc ...

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://...'
const DB_NAME = 'your-database'

interface ArticleSeed {
  title: string
  slug: string
  excerpt: string
  category: string
  tags: string[]
  author: string
  quickAnswer?: string
  faq?: Array<{ question: string; answer: string }>
  content: ReturnType<typeof richTextDoc>
  seo: { metaTitle: string; metaDescription: string }
  readingTime?: number
}

const articles: ArticleSeed[] = [
  {
    title: 'Your Article Title',
    slug: 'your-article-slug',
    excerpt: 'Brief summary for listing pages.',
    category: 'buying-guide',
    tags: ['tag1', 'tag2'],
    author: 'Team Name',
    quickAnswer: 'Direct answer in ≤50 words.',
    faq: [
      { question: 'First question?', answer: 'Direct answer.' },
      { question: 'Second question?', answer: 'Direct answer.' },
    ],
    content: richTextDoc([
      paragraph([text('First paragraph.')]),
      heading('h2', 'Section Title'),
      paragraph([text('Section content.')]),
    ]),
    seo: {
      metaTitle: 'Title ≤60 chars',
      metaDescription: 'Description ≤160 chars.',
    },
    readingTime: 8,
  },
]

async function seed() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)
  const col = db.collection('articles')

  for (const article of articles) {
    const existing = await col.findOne({ slug: article.slug })
    const now = new Date().toISOString()

    if (existing) {
      console.log(`Updating: ${article.slug}`)
      await col.updateOne(
        { slug: article.slug },
        {
          $set: {
            ...article,
            status: 'published',
            updatedAt: now,
          },
        }
      )
    } else {
      console.log(`Creating: ${article.slug}`)
      await col.insertOne({
        _id: new ObjectId(),
        ...article,
        status: 'published',
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // Verify
  const count = await col.countDocuments({ status: 'published' })
  console.log(`Total published articles: ${count}`)

  await client.close()
  process.exit(0)
}

seed().catch(console.error)
```

### Running the Script

```bash
npx tsx scripts/seed-articles.ts
```

---

## ISR Configuration for Knowledge Center

### Page Route Setup

```typescript
// src/app/(frontend)/knowledge-center/[slug]/page.tsx

export const dynamicParams = true    // Allow non-pre-rendered slugs
export const revalidate = 3600       // Re-generate every hour

export async function generateStaticParams() {
  const articles = await getPublishedArticles()
  return articles.map((a) => ({ slug: a.slug }))
}
```

### How ISR Works with New Content

1. **Build time**: All existing articles are pre-rendered as static HTML
2. **New article inserted to MongoDB**: Not yet pre-rendered
3. **First visitor hits the URL**: Next.js renders on-demand, caches the result
4. **Subsequent visitors**: Get the cached static HTML
5. **After `revalidate` seconds**: Next.js regenerates in background

### Force Revalidation (On-Demand)

```typescript
// src/app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const { slug, secret } = await request.json()
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  revalidatePath(`/knowledge-center/${slug}`)
  return Response.json({ revalidated: true })
}
```

---

## Debugging Checklist

### Article Returns 404

1. **Check MongoDB directly:**
   ```bash
   npx tsx -e "
   import { MongoClient } from 'mongodb';
   const client = new MongoClient(process.env.MONGODB_URI);
   await client.connect();
   const doc = await client.db('dbname').collection('articles')
     .findOne({ slug: 'your-slug' }, { projection: { slug: 1, status: 1 } });
   console.log(doc);
   await client.close();
   "
   ```

2. **Check if it's stuck in versions collection:**
   ```bash
   # If doc is in _articles_versions but NOT in articles → drafts trap
   db._articles_versions.find({ 'version.slug': 'your-slug' })
   ```

3. **Check status field:**
   - Must be `status: 'published'` (NOT `_status`)
   - Compare with a working article's fields

4. **Check ISR cache:**
   - New articles need first visit to trigger on-demand rendering
   - Or call revalidation API endpoint

### Article Shows But Content Is Wrong

1. **Check richText structure:**
   - Root must have `type: 'root'`
   - Every node must have `version: 1`
   - Text nodes must have `mode: 'normal'`

2. **Check Lexical renderer:**
   - Ensure your `RichText` component handles all node types
   - Missing node type handlers = silent rendering failures

### Payload Admin Shows Draft But Frontend Shows Published

This is the inverse problem — Payload UI reads from `_articles_versions`, frontend reads from `articles` collection. They can be out of sync when using direct MongoDB insertion.

**Solution:** If you need Payload admin compatibility, also create a version record. But for most seed/migration scripts, frontend-only visibility is sufficient.

---

## Collection Schema Reference

### Articles Collection Fields

```typescript
{
  _id: ObjectId,
  title: string,
  slug: string,          // Unique, URL-safe
  excerpt: string,
  category: string,      // 'buying-guide' | 'how-to' | 'explainer' | 'comparison'
  tags: string[],
  author: string,
  quickAnswer?: string,  // ≤50 words, AEO target
  faq?: Array<{
    question: string,
    answer: string,
  }>,
  content: {             // Lexical richText
    root: {
      type: 'root',
      children: LexicalNode[],
      // ...
    }
  },
  seo?: {
    metaTitle?: string,
    metaDescription?: string,
  },
  readingTime?: number,
  status: 'published' | 'draft',
  publishedAt: string,   // ISO date
  createdAt: string,
  updatedAt: string,
}
```

### Indexes to Ensure

```javascript
db.articles.createIndex({ slug: 1 }, { unique: true })
db.articles.createIndex({ status: 1 })
db.articles.createIndex({ category: 1 })
db.articles.createIndex({ tags: 1 })
db.articles.createIndex({ publishedAt: -1 })
```

---

## Anti-Patterns

1. **Using `payload.create()` for seed scripts** when `drafts: true` is enabled → Use MongoDB direct insertion
2. **Including `_status` field** in direct inserts → Only use `status` (check existing docs)
3. **Forgetting `_id: new ObjectId()`** → MongoDB needs explicit ObjectId for Payload compatibility
4. **Non-idempotent scripts** → Always check existence before create, delete before re-insert
5. **Hardcoding MongoDB URI** → Use environment variables
6. **Skipping `publishedAt`** → Frontend queries often sort by this field
7. **Missing `createdAt`/`updatedAt`** → Payload expects these timestamps
8. **Not closing MongoDB client** → Always `await client.close()` and `process.exit(0)`
