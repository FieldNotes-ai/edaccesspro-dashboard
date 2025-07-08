#!/usr/bin/env bash
# ESA Control Tower Dashboard - Deployment Setup Script
set -e

echo "🔭 ESA Control Tower Dashboard - Deployment Setup"
echo "=================================================="

# Get repository root
REPO=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
echo "📁 Repository root: $REPO"

# Check if dashboard directory exists
if [ ! -d "dashboard" ]; then
    echo "❌ Dashboard directory not found in current location"
    echo "💡 Run this script from the directory containing the dashboard folder"
    exit 1
fi

# Copy dashboard to repository root
echo "📋 Copying dashboard to repository..."
cp -R dashboard "$REPO"/dashboard

# Navigate to repository
cd "$REPO"

# Check git status
if ! git status >/dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Add dashboard files
echo "📦 Adding dashboard files to git..."
git add dashboard

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit (dashboard already up to date)"
else
    # Commit changes
    echo "💾 Committing dashboard files..."
    git commit -m "Add Control Tower dashboard

- Next.js 14 admin hub for ESA Vendor Dashboard
- KPI monitoring, workflow status, change review
- Log viewer, cost tracking, secure authentication
- Ready for Vercel deployment with environment variables"

    # Push to remote
    echo "🚀 Pushing to remote repository..."
    git push

    echo ""
    echo "✅ Dashboard code successfully pushed to repository!"
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. 📊 Go to Vercel dashboard (vercel.com)"
echo "2. 🔗 Import your repository or trigger new deployment"
echo "3. ⚙️  Add environment variables (see dashboard/.env.example):"
echo "   • DASHBOARD_PASSWORD"
echo "   • GITHUB_TOKEN" 
echo "   • AIRTABLE_API_KEY"
echo "   • AIRTABLE_BASE_ID"
echo "   • KPI_CSV_URL"
echo "   • LOG_BASE_URL"
echo "   • GOOGLE_COST_CSV_URL"
echo "4. 🚀 Click 'Deploy' in Vercel"
echo "5. 🔐 Access: https://your-project.vercel.app/dashboard"
echo "6. 🔑 Login with your DASHBOARD_PASSWORD"
echo ""
echo "📚 Full setup guide: dashboard/README.md"
echo ""
echo "🎉 Ready to deploy your Control Tower!"