---
name: supabase-admin-console
description: Build production-grade admin consoles using Supabase backend with React. Use when creating CMS dashboards, content management UIs, CRUD editors, bilingual form systems, or admin panels backed by Supabase (database, auth, storage, edge functions). Covers reusable component patterns, RLS policies, image upload, bilingual fields, and deployment.
tags: [supabase, admin, cms, react, crud, bilingual]
---

# Supabase Admin Console Builder

## Core Philosophy

Admin consoles for B2B websites must be **non-technical user friendly**. The target user is a marketing manager or business owner, not a developer. Every editor should feel like filling out a form, not editing code. Complex data structures (arrays, nested objects, bilingual fields) must be abstracted into intuitive UI patterns.

> "If the admin needs to understand JSON to update the website, the admin console has failed."

## When to Use This Skill

- Building content management dashboards with Supabase
- Creating CRUD editors for website pages (industry, solution, product pages)
- Implementing bilingual (EN/ZH or any dual-language) form systems
- Managing image uploads to Supabase Storage
- Building list + dialog editor patterns for variable-length content
- Setting up simple auth for admin panels
- Deploying Supabase Edge Functions with AI provider fallback chains

---

## Architecture Pattern

```
┌──────────────────────────────────────────────┐
│                ADMIN CONSOLE                  │
├──────────────────────────────────────────────┤
│  ConsoleLayout (sidebar nav + outlet)        │
│  ├── ConsoleLogin (auth gate)                │
│  ├── Dashboard (overview)                    │
│  ├── ContentEditor (single-record editor)    │
│  ├── ListEditor (list + dialog CRUD)         │
│  └── SettingsPage                            │
├──────────────────────────────────────────────┤
│            REUSABLE COMPONENTS               │
│  ├── BilingualField (EN/ZH input pair)       │
│  ├── ArrayEditor (dynamic array of objects)  │
│  ├── ContentCard (form section wrapper)      │
│  ├── SaveButton (loading state + toast)      │
│  └── ImageUpload (Supabase Storage)          │
├──────────────────────────────────────────────┤
│              SUPABASE BACKEND                │
│  ├── Database (PostgreSQL + RLS)             │
│  ├── Storage (images/files)                  │
│  ├── Edge Functions (AI, webhooks)           │
│  └── Auth (simple or OAuth)                  │
└──────────────────────────────────────────────┘
```

---

## Component Patterns

### 1. BilingualField

Dual-language input for any text field:

```tsx
interface BilingualFieldProps {
  label: string;
  valueEn: string;
  valueZh: string;
  onChangeEn: (val: string) => void;
  onChangeZh: (val: string) => void;
  type?: "input" | "textarea" | "richtext";
  required?: boolean;
}
```

**Rules:**
- EN field always appears first (primary language)
- ZH field has a subtle "中文" badge
- Both fields share the same label
- Textarea variant for long content
- Rich text variant for formatted content

### 2. ArrayEditor

Manages dynamic arrays of objects with optional bilingual support:

```tsx
interface ArrayEditorField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  options?: { label: string; value: string }[];
  required?: boolean;
}

interface ArrayEditorProps {
  items: Record<string, any>[];
  fields: ArrayEditorField[];
  onChange: (items: Record<string, any>[]) => void;
  bilingual?: boolean;        // Enable EN/ZH parallel arrays
  itemsZh?: Record<string, any>[];
  onChangeZh?: (items: Record<string, any>[]) => void;
  maxItems?: number;
  minItems?: number;
}
```

**Features:**
- Add / Remove items with button
- Reorder with Up / Down arrows
- Per-field validation
- Bilingual mode: side-by-side EN/ZH arrays
- Textarea fields for array-as-text (newline separated)

### 3. ContentCard

Form section wrapper for visual grouping:

```tsx
<ContentCard title="Basic Information" description="Edit page title and description">
  <BilingualField label="Title" ... />
  <BilingualField label="Description" ... />
</ContentCard>
```

### 4. SaveButton

Unified save button with loading state:

```tsx
<SaveButton
  loading={saving}
  onClick={handleSave}
  disabled={!hasChanges}
/>
```

**Behavior:**
- Shows spinner during save
- Disabled when no changes detected
- Triggers toast notification on success/failure

### 5. ImageUpload

Upload to Supabase Storage with preview:

```tsx
<ImageUpload
  bucket="page-images"
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  accept="image/*"
  maxSize={5 * 1024 * 1024} // 5MB
/>
```

---

## Editor Page Patterns

### Pattern A: Fixed-Record Editor (e.g., WhyCards, HomePage)

For pages with a **fixed number of records** (e.g., always 4 "Why Choose Us" cards):

```
1. Load all records on mount
2. Display each record in a ContentCard
3. Edit fields inline (no add/delete)
4. Single "Save All" button at bottom
5. Upsert all records in one transaction
```

**Best for:** Homepage sections, About page, fixed feature cards

### Pattern B: List + Dialog Editor (e.g., Banners, Blog Posts)

For **variable-length collections** with CRUD:

```
1. List view: table/grid with thumbnails, titles, status
2. Actions: Add new, Edit (opens dialog), Delete (with confirm)
3. Dialog editor: form fields in a modal
4. Reorder: Up/Down buttons or drag-and-drop
5. Visibility toggle: eye icon to show/hide items
```

**Best for:** Banners, blog posts, team members, testimonials

### Pattern C: Nested Page Editor (e.g., IndustryPage, SolutionPage)

For **complex pages with nested data structures**:

```
1. List view: all pages with status
2. Click to open full-page editor
3. Sections as ContentCard components
4. Array fields use ArrayEditor
5. Image fields use ImageUpload
6. Preview button (optional)
```

**Best for:** Industry pages, solution pages, product pages

---

## Database Design Rules

### Table Naming
```sql
-- Use snake_case, plural nouns
home_banners, why_cards, industry_pages, solution_pages

-- Bilingual columns: suffix with _en, _zh (or no suffix for EN primary)
title         -- EN (primary, always present)
title_zh      -- ZH (optional)

-- Array columns: use JSONB or text[]
modal_key_constraints    text[]    -- EN array
modal_key_constraints_zh text[]    -- ZH array
```

### Standard Columns
```sql
id            uuid DEFAULT gen_random_uuid() PRIMARY KEY
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
sort_order    integer DEFAULT 0
is_visible    boolean DEFAULT true
```

### RLS (Row Level Security)
```sql
-- Public read (for frontend)
CREATE POLICY "Public read" ON table_name
  FOR SELECT USING (true);

-- Authenticated write (for admin console)
CREATE POLICY "Admin write" ON table_name
  FOR ALL USING (auth.role() = 'authenticated');
```

---

## Auth Patterns

### Simple Auth (Recommended for small teams)

For teams of 1-3 admins, use localStorage-based auth:

```tsx
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "secure-password-here";

// Login: validate credentials → localStorage.setItem("console_auth", "true")
// Layout: check localStorage → redirect to login if not authenticated
// Logout: localStorage.removeItem("console_auth") → redirect to login
```

**Pros:** Zero Supabase Auth config, no OAuth complexity
**Cons:** Single shared credential, no audit trail

### Supabase Auth (For larger teams)

Use Supabase Auth with `user_roles` table:

```sql
CREATE TABLE user_roles (
  user_id uuid REFERENCES auth.users PRIMARY KEY,
  role text CHECK (role IN ('admin', 'editor', 'viewer'))
);

CREATE FUNCTION is_admin_or_editor(_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'editor')
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## Edge Function Patterns

### AI Provider Fallback Chain

```typescript
interface AIProvider {
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

// Priority order: primary → fallback
const providers: AIProvider[] = [
  { name: "openrouter", endpoint: "...", model: "anthropic/claude-3.5-haiku", timeoutMs: 15000 },
  { name: "dashscope", endpoint: "...", model: "qwen3-coder-plus", timeoutMs: 30000 },
];

// Loop through providers, fallback on ANY non-200 response or timeout
for (const provider of providers) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), provider.timeoutMs);
    const response = await fetch(provider.endpoint, { signal: controller.signal, ... });
    clearTimeout(timeout);
    if (response.ok) return response;  // Success!
    console.warn(`${provider.name} failed (${response.status}), trying next...`);
  } catch (e) {
    console.warn(`${provider.name} error: ${e.message}, trying next...`);
  }
}
```

### Secrets Management
```
IMPORTANT: Never hardcode API keys in source code.
Store ALL secrets in Supabase Edge Function Secrets.
Access via: Deno.env.get("SECRET_NAME")
Update via: Supabase Dashboard → Settings → Edge Functions → Secrets
```

---

## Frontend Data Hook Pattern

```typescript
// DB-first with graceful fallback to hardcoded data
export function usePageData(slug: string) {
  const { locale } = useI18n();

  return useQuery({
    queryKey: ["page-data", slug, locale],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_visible", true)
        .single();

      if (error || !data) return null; // Frontend falls back to hardcoded
      return mapDbToFrontend(data, locale);
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
```

---

## Deployment Checklist

- [ ] All Supabase tables created with correct columns
- [ ] RLS policies enabled (public read, authenticated write)
- [ ] Supabase Storage bucket created for images
- [ ] Edge Function secrets configured (API keys)
- [ ] Edge Functions deployed via `supabase functions deploy`
- [ ] Admin routes added to App.tsx (lazy loaded)
- [ ] Navigation items added to ConsoleLayout
- [ ] Build passes (`npm run build`)
- [ ] GitHub repo set to **private** (prevent API key leaks)
- [ ] Login credentials documented securely

---

## Anti-Patterns

1. **JSON textarea for arrays** → Use ArrayEditor component instead
2. **Single monolithic editor page** → Break into ContentCard sections
3. **No loading states** → Always show spinner during save/fetch
4. **No error feedback** → Toast on every save success/failure
5. **Hardcoding API keys** → Use Supabase Secrets exclusively
6. **Public GitHub repo with secrets** → Set to private
7. **Complex OAuth for small teams** → Use simple auth pattern
8. **No bilingual support from day 1** → Add \_zh columns upfront, even if empty
9. **No sort_order column** → Always include for reorderable content
10. **No is_visible column** → Always include for draft/publish control
