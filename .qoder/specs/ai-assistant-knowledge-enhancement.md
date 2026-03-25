# AI Assistant Knowledge Enhancement Plan

## Goal
Make the AI chatbot context-aware and knowledgeable by: (1) transmitting page context from frontend to backend, and (2) injecting a structured knowledge base into the system prompt so the AI can provide genuinely helpful, accurate responses about PaintCell's products, industries, and solutions.

## Problem Summary
- `industry-context` is set in sessionStorage by 11 pages but **never read or transmitted** to the backend
- The system prompt (~340 tokens) contains only generic role instructions with **zero site-specific knowledge**
- The backend has no idea which page the user is currently viewing

## Architecture

```
Current:  Page → sessionStorage("industry-context") [DEAD END]
                 sessionStorage("project-init-message") → FloatingAssistantButton → AIChatDrawer → AIChatPanel → POST {messages} → Edge Function → generic SYSTEM_PROMPT → Gemini

Enhanced: Page → sessionStorage("industry-context") + location.pathname
                 → FloatingAssistantButton (reads both + path)
                 → AIChatDrawer (passes pageContext)
                 → AIChatPanel → POST {messages, pageContext} 
                 → Edge Function → dynamic SYSTEM_PROMPT + knowledge base → Gemini
```

## Implementation Steps

### Step 1: Frontend - FloatingAssistantButton.tsx
**File**: `paintcell/src/components/ai-assistant/FloatingAssistantButton.tsx`

- Read `industry-context` from sessionStorage alongside `project-init-message` in the trigger handler
- Use `useLocation()` (already imported) to capture `location.pathname`
- Build a `pageContext` object: `{ currentPath: string, industryContext?: { industry, finish, throughput } }`
- Pass `pageContext` as a new prop to `AIChatDrawer`
- Do NOT remove `industry-context` from sessionStorage (keep it for potential re-use)

### Step 2: Frontend - AIChatDrawer.tsx
**File**: `paintcell/src/components/ai-assistant/AIChatDrawer.tsx`

- Add `pageContext` to the props interface
- Pass it through to `AIChatPanel`

### Step 3: Frontend - AIChatPanel.tsx
**File**: `paintcell/src/components/ai-assistant/AIChatPanel.tsx`

- Add `pageContext` to the props interface
- In `streamChat()` (line 76-78), add `pageContext` to the POST request body:
  ```typescript
  body: JSON.stringify({
    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
    pageContext,
  })
  ```
- Also pass pageContext in `handleGenerateSummary()` for both summary and extract requests

### Step 4: Backend - Extend Zod Schema
**File**: `paintcell/supabase/functions/ai-presales-chat/index.ts` (lines 14-31)

- Add optional `PageContextSchema`:
  ```typescript
  const PageContextSchema = z.object({
    currentPath: z.string().max(200),
    industryContext: z.object({
      industry: z.string().max(100),
      finish: z.string().max(100),
      throughput: z.string().max(50),
    }).optional(),
  }).optional();
  ```
- Extend `RequestSchema` with `pageContext: PageContextSchema`

### Step 5: Backend - Embedded Knowledge Base
**File**: `paintcell/supabase/functions/ai-presales-chat/index.ts`

Embed the knowledge base directly as a constant string in the Edge Function (avoids Deno import issues with frontend TS files). Structure:

```
KNOWLEDGE_BASE = {
  industries: {
    "automotive-painting": { label, painPoints(titles only), systemModules(names), productionConfig, roiMetrics, caseReferences, faqs },
    "metal-parts-finishing": { ... },
    ... (all 10 industries)
  },
  solutions: {
    "robotic-painting-system": { definition, processSteps, configOptions, technicalParameters, faqs },
    "paint-booth-automation": { ... },
    "spray-robot-integration": { ... }
  },
  companyOverview: "TD provides end-to-end robotic painting system integration..."
}
```

Estimated size: ~15-20K tokens total (well within Gemini Flash 1M limit).

### Step 6: Backend - Dynamic System Prompt Builder
**File**: `paintcell/supabase/functions/ai-presales-chat/index.ts`

Add a function `buildSystemPrompt(pageContext?)` that:

1. Starts with original SYSTEM_PROMPT (role, constraints, conversation style)
2. Adds company overview section
3. **If on industry page** (`/industries/{slug}`): inject full knowledge for that industry + brief summaries of others
4. **If on solution page** (`/solutions/{slug}`): inject full knowledge for that solution + brief summaries of others
5. **If on other page or no context**: inject all industries and solutions as brief summaries
6. Adds instruction: "Use the knowledge base to provide specific, accurate answers. Reference actual data when relevant."

Path parsing logic:
```typescript
function getPageType(path: string): { type: 'industry' | 'solution' | 'other'; slug?: string } {
  // Strip locale prefix (e.g., /en/, /zh/, /ja/)
  const cleanPath = path.replace(/^\/(en|zh|ja|ko|de|fr|es|pt|ar)\//, '/');
  const industryMatch = cleanPath.match(/^\/industries\/([a-z-]+)/);
  if (industryMatch) return { type: 'industry', slug: industryMatch[1] };
  const solutionMatch = cleanPath.match(/^\/solutions\/([a-z-]+)/);
  if (solutionMatch) return { type: 'solution', slug: solutionMatch[1] };
  return { type: 'other' };
}
```

### Step 7: Backend - Wire Up Dynamic Prompt
**File**: `paintcell/supabase/functions/ai-presales-chat/index.ts` (lines 469-484)

Replace hardcoded `SYSTEM_PROMPT` in the streaming chat section:
```typescript
const systemPrompt = buildSystemPrompt(validationResult.data.pageContext);
// ... use systemPrompt instead of SYSTEM_PROMPT
```

## Files Modified

| File | Change |
|------|--------|
| `paintcell/src/components/ai-assistant/FloatingAssistantButton.tsx` | Read industry-context + path, pass pageContext to drawer |
| `paintcell/src/components/ai-assistant/AIChatDrawer.tsx` | Pass pageContext prop through to AIChatPanel |
| `paintcell/src/components/ai-assistant/AIChatPanel.tsx` | Include pageContext in POST body |
| `paintcell/supabase/functions/ai-presales-chat/index.ts` | Extend schema, embed knowledge base, build dynamic prompt |

## Verification

1. **Build check**: `npm run build` passes with no errors
2. **Manual test - industry page**: Open `/industries/automotive-painting`, click assistant button, ask "What paint robots do you use for automotive?" → AI should reference specific automotive data (Class A finish, 200-400 parts/hr, rotary bell atomizers)
3. **Manual test - homepage**: Open `/`, click assistant → AI should provide general overview of all 10 industries
4. **Manual test - no context**: Direct API call without pageContext → should still work with general knowledge
5. **Console check**: Inspect network request body to verify `pageContext` is present
6. **Edge Function deploy**: `supabase functions deploy ai-presales-chat` and verify no errors
