#!/bin/bash
# Setup script for least-privilege API keys and encrypted secrets

set -e

echo "🔐 ESA Vendor Dashboard - Security Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is required but not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please authenticate with GitHub CLI first:${NC}"
    echo "gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"

# Function to generate secure random key
generate_key() {
    openssl rand -hex 32
}

# Function to set GitHub secret
set_github_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo -e "${YELLOW}Setting secret: $secret_name${NC}"
    echo "$secret_value" | gh secret set "$secret_name"
    echo -e "${GREEN}✅ $secret_name set successfully${NC}"
}

echo ""
echo "🔑 Generating least-privilege API keys..."
echo "========================================="

# Generate agent communication key
AGENT_KEY=$(generate_key)
echo -e "${GREEN}✅ Generated AGENT_KEY for inter-agent communication${NC}"

# Prompt for Airtable credentials
echo ""
echo -e "${YELLOW}📋 Airtable Configuration${NC}"
echo "Please provide your Airtable credentials:"
echo ""

read -p "Airtable Base ID (app...): " AIRTABLE_BASE_ID
if [[ ! $AIRTABLE_BASE_ID =~ ^app[a-zA-Z0-9]{14}$ ]]; then
    echo -e "${RED}❌ Invalid Airtable Base ID format${NC}"
    exit 1
fi

read -s -p "Airtable API Key (pat...): " AIRTABLE_API_KEY
echo ""
if [[ ! $AIRTABLE_API_KEY =~ ^pat[a-zA-Z0-9\.]{40,}$ ]]; then
    echo -e "${RED}❌ Invalid Airtable API Key format${NC}"
    exit 1
fi

# Optional: Staging base
read -p "Airtable Staging Base ID (optional, app...): " AIRTABLE_STAGING_BASE_ID

# Research Agent webhook URL
read -p "Research Agent Webhook URL (for gap reports): " RESEARCH_AGENT_WEBHOOK

echo ""
echo "🔒 Setting GitHub Secrets..."
echo "============================"

# Set all secrets
set_github_secret "AGENT_KEY" "$AGENT_KEY" "Inter-agent communication key"
set_github_secret "AIRTABLE_BASE_ID" "$AIRTABLE_BASE_ID" "Production Airtable base"
set_github_secret "AIRTABLE_API_KEY" "$AIRTABLE_API_KEY" "Airtable API key (scoped)"

if [[ -n "$AIRTABLE_STAGING_BASE_ID" ]]; then
    set_github_secret "AIRTABLE_STAGING_BASE_ID" "$AIRTABLE_STAGING_BASE_ID" "Staging Airtable base"
fi

if [[ -n "$RESEARCH_AGENT_WEBHOOK" ]]; then
    set_github_secret "RESEARCH_AGENT_WEBHOOK" "$RESEARCH_AGENT_WEBHOOK" "Research Agent webhook URL"
fi

echo ""
echo "🛡️  Security Recommendations"
echo "============================"
echo -e "${GREEN}✅ Secrets stored securely in GitHub${NC}"
echo -e "${YELLOW}⚠️  Airtable API Key Scoping:${NC}"
echo "   1. Go to https://airtable.com/create/tokens"
echo "   2. Edit your token to limit scope to:"
echo "      - data.records:read"
echo "      - data.records:write"
echo "      - schema.bases:read"
echo "      - schema.bases:write (if schema evolution needed)"
echo "   3. Limit to specific base: $AIRTABLE_BASE_ID"
echo ""
echo -e "${YELLOW}⚠️  Additional Security Steps:${NC}"
echo "   1. Enable 2FA on your Airtable account"
echo "   2. Regularly rotate the AGENT_KEY (monthly)"
echo "   3. Monitor API usage in Airtable dashboard"
echo "   4. Set up alerts for unusual activity"

echo ""
echo "🚀 Cloudflare Worker Setup"
echo "=========================="
echo "To deploy the webhook proxy:"
echo ""
echo "1. Install Wrangler CLI:"
echo "   npm install -g wrangler"
echo ""
echo "2. Login to Cloudflare:"
echo "   wrangler login"
echo ""
echo "3. Set secrets:"
echo "   wrangler secret put AGENT_KEY"
echo "   # Enter: $AGENT_KEY"
echo ""
echo "4. Deploy worker:"
echo "   cd ops"
echo "   wrangler deploy"
echo ""

echo ""
echo "📋 Environment Variables Summary"
echo "==============================="
cat << EOF
# Production Environment
AIRTABLE_BASE_ID=$AIRTABLE_BASE_ID
AIRTABLE_API_KEY=***hidden***
AGENT_KEY=***hidden***
RESEARCH_AGENT_WEBHOOK=$RESEARCH_AGENT_WEBHOOK

# Staging Environment (if provided)
AIRTABLE_STAGING_BASE_ID=$AIRTABLE_STAGING_BASE_ID
EOF

echo ""
echo -e "${GREEN}🎉 Security setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy Cloudflare Worker (see instructions above)"
echo "2. Test the CI/CD pipeline: git push"
echo "3. Monitor logs in GitHub Actions"
echo "4. Set up monitoring dashboard"

# Save configuration for reference
cat > .env.example << EOF
# ESA Vendor Dashboard - Environment Variables
# Copy to .env.local and fill in actual values

# Airtable Configuration
AIRTABLE_BASE_ID=app...
AIRTABLE_API_KEY=pat...
AIRTABLE_STAGING_BASE_ID=app...

# Agent Security
AGENT_KEY=...

# Webhook URLs
RESEARCH_AGENT_WEBHOOK=https://...

# Optional: External Services
GOOGLE_SHEETS_API_KEY=...
CLAUDE_API_KEY=...
EOF

echo ""
echo -e "${GREEN}✅ Created .env.example with template${NC}"
echo -e "${YELLOW}⚠️  Remember: Never commit actual secrets to git!${NC}"