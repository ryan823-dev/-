# EPXFresh - Advanced Fresh-Keeping Packaging Solutions

**Live Site**: https://epxfresh.vercel.app

A modern B2B+B2C e-commerce website for FDA & EU certified fresh-keeping packaging solutions. Built with Next.js 16, Sanity CMS, and featuring an AI-first design with integrated AI assistant.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)
![Sanity](https://img.shields.io/badge/Sanity-CMS-ff00cc)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel)

## ✨ Features

- 🎨 **AI-First Design** - Integrated AI assistant preview in hero section
- 🛍️ **B2B + B2C** - Dual business model with separate entry points
- 🤖 **AI Assistant** - Real-time product recommendations and support
- 📱 **Fully Responsive** - Mobile-first responsive design
- 🚀 **SEO Optimized** - Complete metadata, sitemap, and structured data
- 🎯 **Conversion Focused** - Trust badges, certifications, testimonials
- 📦 **E-commerce Ready** - Product catalog, shopping cart, checkout
- 🌍 **Global Ready** - Multi-market support (USA, EU, SEA)

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + CVA
- **CMS**: Sanity (Headless)
- **AI**: Vercel AI SDK + OpenAI GPT-4o-mini
- **Deployment**: Vercel
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Vercel account (for deployment)
- Sanity account (for CMS)
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
cd /Users/oceanlink/Documents/Qoder-1/epxfresh

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your credentials
# - NEXT_PUBLIC_SANITY_PROJECT_ID
# - OPENAI_API_KEY
# - NEXT_PUBLIC_SITE_URL

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## 📁 Project Structure

```
epxfresh/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/ai/chat/       # AI Chat API
│   │   ├── (marketing)/       # Marketing pages
│   │   ├── (shop)/            # Shop pages
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── layout/            # Header, Footer
│   │   ├── marketing/         # Hero, TrustStrip, etc.
│   │   ├── shop/              # ProductCard, etc.
│   │   ├── ai/                # ChatWidget
│   │   └── ui/                # Button, Card
│   ├── lib/
│   │   ├── sanity/            # Sanity client
│   │   └── seo/               # SEO utilities
│   └── sanity-schemas/        # CMS schemas
├── sanity.config.ts           # Sanity configuration
├── sanity.seed.ts             # Sample data
└── package.json
```

## 🌐 Pages

### Marketing Pages
- `/` - Homepage with AI assistant preview
- `/about` - About EPXFresh
- `/wholesale` - B2B wholesale
- `/technology` - Technology overview
- `/certifications` - FDA, EU, CNAS certifications
- `/contact` - Contact form

### Shop Pages
- `/shop` - Product catalog
- `/products/[slug]` - Product detail page

### API Routes
- `/api/ai/chat` - AI chat endpoint (Edge Runtime)

## 🎨 Design System

### Brand Colors
- **Fresh Green**: `hsl(142, 76%, 36%)` - Primary brand color
- **Eco Teal**: `hsl(160, 60%, 40%)` - Secondary color
- **Warm Earth**: `hsl(30, 60%, 50%)` - Accent color

### Components
- **Button**: 8 variants × 5 sizes
- **Card**: 4 variants with compound components
- **Hero**: AI-first design with live preview
- **ProductCard**: Rating, badges, quick add

## 🤖 AI Assistant

The AI assistant is a core feature, not an afterthought:

### Hero Preview
- Live demo of AI capabilities
- Rotating sample questions
- Typing animation
- Quick action buttons

### Full Chat Widget
- Floating button (bottom-right)
- Streaming responses
- Message history
- Contextual recommendations

### System Prompt
Pre-configured with:
- EPXFresh product knowledge
- FDA/EU certification info
- B2B wholesale guidelines
- Produce storage science

## 📦 Sanity CMS Integration

### Content Types
- **Product** - E-commerce products with images, specs
- **Category** - Product categorization
- **FAQ** - Frequently asked questions
- **Testimonial** - Customer reviews
- **Certification** - FDA, EU, CNAS certificates
- **SiteSettings** - Global configuration

### Setup Sanity

```bash
# Run setup script
./setup-sanity.sh

# Or manually:
npx sanity init
npx sanity deploy
```

See `SANITY_SETUP.md` for detailed instructions.

## 🔐 Environment Variables

Create `.env.local` with:

```bash
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production

# OpenAI
OPENAI_API_KEY=sk-your-key-here

# Site URL
NEXT_PUBLIC_SITE_URL=https://epxfresh.vercel.app
```

### Configure on Vercel

```bash
# Use automated script
./vercel-env-setup.sh

# Or manually in Vercel Dashboard
# Settings → Environment Variables
```

## 🚢 Deployment

### Deploy to Vercel

```bash
# Quick deploy
vercel --prod

# Or interactive
vercel
```

### Build Locally

```bash
# Production build
npm run build

# Preview production build
npm run start
```

## 📊 SEO Features

- ✅ Metadata API integration
- ✅ Automatic sitemap generation
- ✅ Robots.txt configuration
- ✅ Schema.org structured data (JSON-LD)
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Canonical URLs

## 🛠️ Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 📚 Documentation

- `QUICK_START.md` - 5-minute quick start guide
- `DEPLOYMENT.md` - Complete deployment guide
- `SANITY_SETUP.md` - Sanity CMS setup
- `项目完成总结.md` - Project completion summary (Chinese)

## 🎯 Key Features Breakdown

### B2B Features
- Wholesale pricing inquiry
- MOQ information
- OEM/Private label options
- Bulk order contact form
- Certification showcase

### B2C Features
- Product catalog with filters
- Shopping cart
- Product ratings & reviews
- Quick add to cart
- Size guides

### Trust Signals
- FDA certification badge
- EU compliance badge
- "50+ Countries" social proof
- Customer testimonials
- Security badges

## 🔧 Configuration

### Next.js Config

See `next.config.ts` for:
- Turbopack optimization
- Image domains
- Experimental features

### Tailwind Config

See `globals.css` for:
- Custom CSS variables
- Design tokens
- Utility classes
- Animations

## 🐛 Troubleshooting

### AI Not Working
1. Check OPENAI_API_KEY is set
2. Verify API key is valid
3. Check API usage limits

### Sanity Not Loading
1. Verify Project ID is correct
2. Check CORS settings in Sanity
3. Add domain to allowed origins

### Build Fails
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 🤝 Contributing

This is a production project. Please follow these guidelines:

1. Create feature branches
2. Test locally before committing
3. Write meaningful commit messages
4. Update documentation if needed

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

- **Documentation**: See `/docs` folder
- **Sanity**: https://www.sanity.io/docs
- **Next.js**: https://nextjs.org/docs
- **Vercel**: https://vercel.com/docs

## 🎉 Acknowledgments

- Design system inspired by shadcn/ui
- AI integration using Vercel AI SDK
- Icons by Lucide React
- Deployed on Vercel

---

**Built with ❤️ by Qoder AI Assistant**

**Status**: ✅ Production Ready | **Deployed**: https://epxfresh.vercel.app
