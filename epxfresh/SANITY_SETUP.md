# Sanity CMS Setup Guide for EPXFresh

This guide walks you through setting up Sanity CMS for the EPXFresh website.

## Step 1: Create Sanity Project

Run the following command to create a new Sanity project:

```bash
cd /Users/oceanlink/Documents/Qoder-1/epxfresh
npx sanity init
```

When prompted:
- **Login**: Use your GitHub or Google account
- **Create new project**: Select "Create new project"
- **Project name**: `epxfresh-cms`
- **Dataset name**: `production`
- **Output path**: `./sanity-studio` (or use embedded studio)
- **Template**: Select "Empty project"

## Step 2: Get Project Credentials

After project creation, find your credentials:

```bash
cd sanity-studio
cat sanity.config.ts
```

You'll find:
- `projectId`: Your unique project ID (e.g., `abc12345`)
- `dataset`: Usually `production`

## Step 3: Configure Environment Variables

Create or update `.env.local`:

```bash
# Sanity CMS Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=abc12345  # Replace with your actual ID
NEXT_PUBLIC_SANITY_DATASET=production

# AI Assistant (OpenAI)
OPENAI_API_KEY=sk-...  # Your OpenAI API key

# Site URL
NEXT_PUBLIC_SITE_URL=https://epxfresh.vercel.app
```

## Step 4: Deploy Sanity Studio

Deploy the Sanity Studio to manage content:

```bash
cd sanity-studio
npx sanity deploy
```

This will give you a URL like: `https://epxfresh-cms.sanity.studio`

## Step 5: Import Seed Data

To populate the CMS with sample data:

```bash
# First, create a tar.gz file from the seed data
cd /Users/oceanlink/Documents/Qoder-1/epxfresh
node -e "
const fs = require('fs');
const data = require('./sanity.seed.ts');
fs.writeFileSync('seed-data.json', JSON.stringify(data, null, 2));
"

# Then import to Sanity
npx sanity dataset import seed-data.json production
```

**Alternative: Manual Entry**

1. Open Sanity Studio at your deployed URL
2. Navigate to each content type (Products, Categories, FAQs, etc.)
3. Click "Create" to add new items
4. Use the seed data in `sanity.seed.ts` as reference for content

## Step 6: Verify Connection

Test the connection by running the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000` and check if products appear on the shop page.

## Schema Overview

### Content Types:

1. **Product** - Product listings with images, prices, specifications
2. **Category** - Product categories (Household, Professional, Film)
3. **FAQ** - Frequently asked questions
4. **Testimonial** - Customer reviews and testimonials
5. **Certification** - FDA, EU, CNAS certifications
6. **Site Settings** - Global site configuration

## Sample Content

The seed file (`sanity.seed.ts`) includes:

- **3 Categories**: Household, Professional, Film
- **2 Products**: Household Bags, Multi-Size Pack
- **5 FAQs**: Product usage, wholesale, shipping, certifications
- **3 Testimonials**: From farmers, retailers, and home users
- **3 Certifications**: FDA, EU, CNAS

## Troubleshooting

### "Cannot find module '@sanity/client'"
```bash
npm install @sanity/client @sanity/image-url
```

### Schema not loading
Ensure `src/sanity-schemas/index.ts` exports all schema types.

### CORS errors
In Sanity dashboard, go to Settings → API → CORS Origins and add:
- `http://localhost:3000`
- `https://epxfresh.vercel.app`

## Next Steps

After setup:
1. Add real product images via Sanity Studio
2. Customize product descriptions
3. Add more FAQs based on customer inquiries
4. Configure site settings with actual contact info
5. Set up webhooks for on-demand revalidation (optional)

## Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
- [Sanity Studio Customization](https://www.sanity.io/docs/studio)
