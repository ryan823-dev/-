# Machrio Admin Panel Customization

## Goal
1. Replace the default Payload CMS logo on the admin login page with Machrio branding (icon + text)
2. Set admin panel default language to Chinese, with English as fallback

## Implementation

### 1. Create Custom Logo Component

**New file:** `src/components/admin/Logo.tsx`

A React component that renders the Machrio logo for the admin login page:
- Use the existing "M" icon (`/src/app/icon.png`) as the icon
- Render "Mach" in white + "rio" in amber (#F59E0B) as text, matching the site's branding
- Component must be a client component (`'use client'`)
- Style: centered layout, icon + text side by side, professional appearance

### 2. Create Custom Icon Component

**New file:** `src/components/admin/Icon.tsx`

A smaller version for the admin sidebar/nav:
- Use the existing "M" icon or render an inline SVG/image version
- Appropriate size for navigation bar (~25px)

### 3. Update Payload Config

**Modify:** `src/payload/payload.config.ts`

Add to the `admin` section:
```typescript
admin: {
  components: {
    graphics: {
      Logo: '/src/components/admin/Logo',    // Login page logo
      Icon: '/src/components/admin/Icon',     // Nav bar icon
    },
  },
},
```

Add i18n config at root level:
```typescript
i18n: {
  supportedLanguages: { zh, en },
  fallbackLanguage: 'en',
},
```

Import `zh` and `en` from `@payloadcms/translations`.

### 4. Copy Icon to Public Directory

Copy `/src/app/icon.png` to `/public/machrio-icon.png` so it's accessible as a static asset in admin components.

### 5. Regenerate Import Map

Run `npx payload generate:importmap` to update the auto-generated import map.

## Files Modified
- `src/payload/payload.config.ts` - Add logo components + i18n
- `src/components/admin/Logo.tsx` - NEW: Login page logo
- `src/components/admin/Icon.tsx` - NEW: Nav icon
- `public/machrio-icon.png` - NEW: Static icon asset

## Verification
1. Run `npm run dev` locally
2. Visit `http://localhost:3000/admin/login` - confirm custom Machrio logo appears
3. Confirm admin interface is in Chinese by default
4. Confirm language can be switched to English
5. Deploy to Vercel and verify on production
