# Lead Due Diligence Feature - Specification

## Overview
Enterprise background check feature for leads, generating comprehensive company reports.

## Features
- Company basic info (founded year, headquarters, legal structure)
- Employee count & growth trends
- Funding history & investors
- Business model & target market
- Recent news & executive changes
- Competitive landscape
- Risk assessment

## Data Sources
- **Crunchbase** - Funding, investors, company details
- **LinkedIn** - Employee count, company description
- **NewsAPI** - Recent news & updates

## Pricing
- Lead search: 10 credits
- Due diligence: **40 credits** (4x)

## API Endpoints
- `GET /api/leads/[id]/due-diligence` - Get report
- `POST /api/leads/[id]/due-diligence` - Start investigation

## Environment Variables Required
```
CRUNCHBASE_API_KEY=xxx
LINKEDIN_ACCESS_TOKEN=xxx
NEWS_API_KEY=xxx
```

## Files
- `src/lib/due-diligence/` - Data source integrations
- `src/components/leads/DueDiligenceButton.tsx` - Trigger button
- `src/components/leads/DueDiligenceReport.tsx` - Report display
- `src/app/api/leads/[id]/due-diligence/route.ts` - API endpoints
