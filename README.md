# ESA Vendor Intelligence Platform - MVP Dashboard

## Monday Demo System

Built for the Hewitt meeting to demonstrate vendor onboarding with tiered pain point intelligence.

### Features

#### Multi-Tier Onboarding System
- **Free Tier**: Basic program access + pain point identification
- **Starter Tier ($99/month)**: Smart matching + basic solutions
- **Professional Tier ($299/month)**: Full intelligence + strategy
- **Enterprise Tier ($999/month)**: Custom consultation + advocacy

#### Pain Point Intelligence
- Collects vendor pain points for current ESA enrollments
- Provides tiered solutions based on subscription level
- Respects vendor capacity constraints (optional fields)
- Builds market intelligence database

#### Smart Product Translation
- Accepts vendor terminology in any format
- Translates to ESA-compatible language
- Provides confidence scores and complexity ratings
- Shows immediate program matches

### Setup

```bash
cd esa-vendor-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Demo Flow for Monday

1. **Landing Page**: Shows value proposition and pricing tiers
2. **Select Tier**: Hewitt can experience different access levels
3. **Basic Info**: Company details and services (in their own words)
4. **Current Enrollments**: Select programs they're already in
5. **Pain Points**: Identify specific issues with current programs
6. **Solutions**: See tiered responses based on subscription level

### Key Demo Points

- **User-friendly for all tech levels**
- **Respects vendor capacity constraints**
- **Immediate value delivery**
- **Clear upgrade incentives**
- **Real market intelligence collection**

### Architecture

- **Frontend**: Next.js + React + TypeScript + Tailwind CSS
- **Backend**: Direct Airtable API integration
- **Deployment**: Vercel (for quick demo deployment)

### Monday Meeting Strategy

Use this to show Hewitt:
1. How easy vendor onboarding will be
2. The tiered value proposition
3. Pain point collection for market intelligence
4. Immediate vendor value delivery
5. Clear path from free to paid tiers

This demonstrates the complete vendor experience while collecting valuable feedback from Hewitt as your lighthouse customer.