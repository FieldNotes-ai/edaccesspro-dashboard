# ESA Control Tower Dashboard

A lightweight Next.js 14 admin hub for monitoring and managing the ESA Vendor Dashboard system.

## Features

- **KPI Monitoring**: Real-time data completeness, conflict rates, and latency metrics
- **Workflow Status**: GitHub Actions workflow monitoring for both agents
- **Change Review**: Approve/reject destructive Airtable schema changes
- **Log Viewer**: Browse and download agent logs
- **Cost Tracking**: Monitor API usage and estimated costs
- **Security**: Password-protected access with environment-based authentication

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Deployment**: Vercel (free tier)
- **Authentication**: Simple password gate

## Local Development

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment variables**
   
   Create `.env.local` file:
   ```bash
   # Authentication
   DASHBOARD_PASSWORD=your-secure-password

   # GitHub Integration
   GITHUB_TOKEN=ghp_your_github_token
   GITHUB_REPOSITORY=your-org/esa-vendor-dashboard

   # Airtable Integration
   AIRTABLE_API_KEY=pat_your_airtable_key
   AIRTABLE_BASE_ID=app_your_production_base
   AIRTABLE_BASE_ID_STAGING=app_your_staging_base

   # Data Sources
   KPI_CSV_URL=https://raw.githubusercontent.com/your-org/esa-vendor-dashboard/main/kpi.csv
   LOG_BASE_URL=https://raw.githubusercontent.com/your-org/esa-vendor-dashboard/main/data/logs/
   GOOGLE_COST_CSV_URL=https://docs.google.com/spreadsheets/d/your-sheet-id/export?format=csv

   # Optional: Development mode
   NODE_ENV=development
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open browser**
   ```
   http://localhost:3000/dashboard
   ```

## Vercel Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Configure Environment Variables

In Vercel dashboard, add these environment variables:

#### Required Variables
```bash
DASHBOARD_PASSWORD=your-secure-password
GITHUB_TOKEN=ghp_your_github_token
GITHUB_REPOSITORY=your-org/esa-vendor-dashboard
AIRTABLE_API_KEY=pat_your_airtable_key
AIRTABLE_BASE_ID=app_your_production_base
```

#### Optional Variables
```bash
AIRTABLE_BASE_ID_STAGING=app_your_staging_base
KPI_CSV_URL=https://raw.githubusercontent.com/your-org/esa-vendor-dashboard/main/kpi.csv
LOG_BASE_URL=https://raw.githubusercontent.com/your-org/esa-vendor-dashboard/main/data/logs/
GOOGLE_COST_CSV_URL=https://docs.google.com/spreadsheets/d/your-sheet-id/export?format=csv
```

### 3. Environment Variable Details

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DASHBOARD_PASSWORD` | Password for dashboard access | ✅ | `secure-admin-password-123` |
| `GITHUB_TOKEN` | GitHub personal access token | ✅ | `ghp_1234567890abcdef` |
| `GITHUB_REPOSITORY` | Repository in format `owner/repo` | ✅ | `your-org/esa-vendor-dashboard` |
| `AIRTABLE_API_KEY` | Airtable personal access token | ✅ | `pat_1234567890abcdef` |
| `AIRTABLE_BASE_ID` | Production Airtable base ID | ✅ | `appABCDEFGHIJKLMN` |
| `AIRTABLE_BASE_ID_STAGING` | Staging Airtable base ID | ❌ | `appSTAGINGBASEID` |
| `KPI_CSV_URL` | URL to KPI CSV file | ❌ | GitHub raw URL |
| `LOG_BASE_URL` | Base URL for log files | ❌ | GitHub raw URL |
| `GOOGLE_COST_CSV_URL` | Google Sheets CSV export URL | ❌ | Google Sheets export URL |

### 4. GitHub Token Permissions

Your GitHub token needs these permissions:
- `repo` (full repository access)
- `actions:read` (read workflow status)
- `contents:read` (read log files)

### 5. Airtable API Key Scoping

Scope your Airtable API key to:
- `data.records:read` (read change review records)
- `data.records:write` (update change review status)
- `schema.bases:read` (read base information)

## Optional: Workflow Monitoring Cron

Add this API route for automated monitoring:

### `/api/ping-workflows` (Optional)

Create `app/api/ping-workflows/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check if agents haven't run in 24 hours
  // Send email alert via Vercel Resend integration
  
  const lastRunThreshold = 24 * 60 * 60 * 1000 // 24 hours
  
  // Implementation would check workflow status
  // and send alerts if needed
  
  return NextResponse.json({ status: 'checked' })
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/ping-workflows",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Usage

### 1. Login
- Navigate to `/dashboard`
- Enter your dashboard password
- Access granted for 7 days

### 2. Overview Page
- View KPI snapshot (completeness, conflicts, latency)
- Check GitHub Actions workflow status
- See pending change review count
- Quick access to all features

### 3. Change Review
- Review destructive Airtable schema changes
- Approve or reject changes with one click
- View change details and reasoning

### 4. Log Viewer
- Select log files from dropdown
- View content in browser
- Download logs for offline analysis

### 5. Cost Monitoring
- Track API usage across services
- Monitor free tier limits
- View cost trends and projections

## Security Features

- **Password Protection**: Environment-based authentication
- **HTTPS Only**: Secure communication in production
- **Token Scoping**: Limited API permissions
- **Input Validation**: Sanitized file access
- **Rate Limiting**: Built-in Vercel protections

## Troubleshooting

### Common Issues

1. **"Invalid password"**
   - Check `DASHBOARD_PASSWORD` environment variable
   - Clear browser cookies and try again

2. **"Failed to fetch KPI data"**
   - Verify `KPI_CSV_URL` is accessible
   - Check GitHub repository permissions

3. **"Airtable credentials not configured"**
   - Verify `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`
   - Check API key permissions

4. **"Failed to fetch workflow status"**
   - Verify `GITHUB_TOKEN` has correct permissions
   - Check `GITHUB_REPOSITORY` format

### Development Tips

- Use `NODE_ENV=development` to bypass password gate
- Check browser console for detailed error messages
- Use Vercel logs for serverless function debugging
- Test API routes directly: `/api/kpis`, `/api/workflows`, etc.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│  Vercel Edge     │───▶│   GitHub API    │
│   (Dashboard)   │    │  Functions       │    │   (Workflows)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   Airtable API   │             │
         │              │ (Change Review)  │             │
         │              └──────────────────┘             │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Google Sheets  │    │    GitHub Raw    │    │   Log Files     │
│  (Cost Data)    │    │   (KPI Data)     │    │   (Monitoring)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `pnpm dev`
5. Submit a pull request

## License

MIT License - see LICENSE file for details