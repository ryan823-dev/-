# EPXFresh Deployment Guide

## Quick Deploy to Vercel

The site is already deployed at: **https://epxfresh.vercel.app**

## Environment Variables Setup

### 1. Vercel Dashboard Setup

1. Go to https://vercel.com/ryan-moores-projects-37ce5eff/epxfresh
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SITE_URL=https://epxfresh.vercel.app
```

4. Click **Save**
5. Redeploy the project to apply changes

### 2. Get Sanity Credentials

**Option A: Create via Sanity Dashboard**

1. Visit https://sanity.io
2. Sign up/Login
3. Click **Create new project**
4. Name: `epxfresh-cms`
5. Dataset: `production`
6. Copy the **Project ID** from dashboard

**Option B: Create via CLI**

```bash
cd /Users/oceanlink/Documents/Qoder-1/epxfresh
npm install -g @sanity/cli
sanity login
sanity init
```

Follow prompts to create project and copy the Project ID.

### 3. Get OpenAI API Key

1. Visit https://platform.openai.com/api-keys
2. Sign up/Login
3. Click **Create new secret key**
4. Copy the key (starts with `sk-`)
5. Store securely in Vercel environment variables

### 4. Deploy Sanity Studio (Optional)

To manage content via Sanity Studio:

```bash
cd /Users/oceanlink/Documents/Qoder-1/epxfresh
mkdir -p sanity-studio
cd sanity-studio

# Initialize embedded studio
npx create-sanity@latest --template clean --output-path .
```

Then deploy:
```bash
npx sanity deploy
```

This gives you a CMS URL like: `https://epxfresh-cms.sanity.studio`

## Content Management Workflow

### Adding Products

1. **Via Sanity Studio** (recommended):
   - Login to your Sanity Studio
   - Navigate to **Products**
   - Click **Create new**
   - Fill in product details
   - Upload product images
   - Publish

2. **Via Code** (for developers):
   - Use `sanity.seed.ts` as template
   - Import via CLI: `sanity dataset import seed.json production`

### Content Types Available

- ✅ Products (with images, prices, specs)
- ✅ Categories
- ✅ FAQs
- ✅ Testimonials
- ✅ Certifications
- ✅ Site Settings

## Local Development

```bash
cd /Users/oceanlink/Documents/Qoder-1/epxfresh

# Install dependencies
npm install

# Create .env.local
cp .env.local.example .env.local

# Edit .env.local with your keys
nano .env.local

# Run dev server
npm run dev
```

Visit: http://localhost:3000

## Build & Deploy Commands

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or use Vercel CLI
vercel
```

## Post-Deployment Checklist

- [ ] Configure environment variables in Vercel
- [ ] Test AI assistant functionality
- [ ] Verify Sanity CMS connection
- [ ] Add real product images
- [ ] Update site settings with actual contact info
- [ ] Test all pages load correctly
- [ ] Check mobile responsiveness
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (optional)

## Troubleshooting

### AI Assistant Not Working

1. Check OPENAI_API_KEY is set in Vercel
2. Verify key is valid (test on openai.com)
3. Check API usage limits

### Sanity Data Not Loading

1. Verify NEXT_PUBLIC_SANITY_PROJECT_ID is correct
2. Check CORS settings in Sanity dashboard
3. Add your domain to allowed origins:
   - Settings → API → CORS Origins
   - Add: `https://epxfresh.vercel.app`

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Monitoring

Check deployment status:
- Vercel Dashboard: https://vercel.com/dashboard
- Build Logs: Click on deployment → View Build Logs

## Support

- Sanity Docs: https://www.sanity.io/docs
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
