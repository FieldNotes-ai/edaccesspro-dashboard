# GitHub Secrets Setup Guide

This guide explains how to add encrypted secrets for the ESA Vendor Dashboard GitHub Actions workflows.

## Required Secrets

### Core Secrets (Required)
```bash
AGENT_KEY                    # Inter-agent communication key (64-char hex)
AIRTABLE_BASE_ID            # Production Airtable base ID (app...)
AIRTABLE_API_KEY            # Production Airtable API key (pat...)
```

### Staging Secrets (Recommended)
```bash
AIRTABLE_BASE_ID_STAGING    # Staging Airtable base ID (app...)
AIRTABLE_API_KEY_STAGING    # Staging Airtable API key (pat...)
```

### Optional Secrets
```bash
RESEARCH_AGENT_WEBHOOK      # Webhook URL for gap reports
GOOGLE_SHEETS_API_KEY       # For cost monitoring (optional)
GOOGLE_SHEETS_ID            # Google Sheets ID for cost tracking
```

## Setup Methods

### Method 1: GitHub Web Interface (Recommended)

1. **Navigate to Repository Settings**
   ```
   GitHub Repository → Settings → Secrets and variables → Actions
   ```

2. **Add New Repository Secret**
   - Click "New repository secret"
   - Enter secret name (e.g., `AGENT_KEY`)
   - Enter secret value
   - Click "Add secret"

3. **Repeat for all required secrets**

### Method 2: GitHub CLI (Advanced)

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate
gh auth login

# Set secrets (you'll be prompted for values)
gh secret set AGENT_KEY
gh secret set AIRTABLE_BASE_ID
gh secret set AIRTABLE_API_KEY
gh secret set AIRTABLE_BASE_ID_STAGING
gh secret set AIRTABLE_API_KEY_STAGING
gh secret set RESEARCH_AGENT_WEBHOOK
```

### Method 3: Automated Setup Script

```bash
# Use the provided setup script
./scripts/setup-secrets.sh
```

## Secret Validation

### AGENT_KEY
- **Format**: 64-character hexadecimal string
- **Generation**: `openssl rand -hex 32`
- **Example**: `a1b2c3d4e5f6...` (64 chars)

### Airtable Secrets
- **Base ID Format**: `app` + 14 alphanumeric characters
- **API Key Format**: `pat` + 40+ characters
- **Example Base ID**: `appABCDEFGHIJKLMN`
- **Example API Key**: `patABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890...`

### Webhook URLs
- **Format**: Valid HTTPS URL
- **Example**: `https://your-webhook-service.com/endpoint`

## Security Best Practices

### 1. Least Privilege Access
- Scope Airtable API keys to specific bases only
- Use separate staging and production keys
- Regularly rotate the AGENT_KEY (monthly recommended)

### 2. Airtable API Key Scoping
```
Required Permissions:
✅ data.records:read
✅ data.records:write
✅ schema.bases:read
✅ schema.bases:write (if schema evolution needed)

Limit to specific bases:
✅ Production base: appXXXXXXXXXXXXXX
✅ Staging base: appYYYYYYYYYYYYYY
```

### 3. Monitoring
- Enable GitHub Actions audit logging
- Monitor secret usage in Actions logs
- Set up alerts for failed workflows

## Verification

### Test Secret Access
```bash
# Check if secrets are properly set (from GitHub Actions)
echo "AGENT_KEY length: ${#AGENT_KEY}"
echo "Base ID format: ${AIRTABLE_BASE_ID:0:3}..."
```

### Workflow Testing
```bash
# Trigger manual workflow runs to test secrets
gh workflow run research_agent.yml
gh workflow run airtable_agent.yml --field environment=staging
```

## Troubleshooting

### Common Issues

1. **Secret Not Found**
   ```
   Error: AGENT_KEY secret not found
   ```
   - Verify secret name matches exactly (case-sensitive)
   - Check secret is set at repository level, not environment level

2. **Invalid Airtable Credentials**
   ```
   Error: 401 Unauthorized
   ```
   - Verify API key has correct permissions
   - Check base ID format (must start with 'app')
   - Ensure API key is not expired

3. **Workflow Permission Denied**
   ```
   Error: Resource not accessible by integration
   ```
   - Check repository Actions permissions
   - Verify workflow has necessary permissions

### Debug Mode
Enable debug logging in workflows:
```bash
gh workflow run research_agent.yml --field debug=true
gh workflow run airtable_agent.yml --field debug=true
```

## Secret Rotation

### Monthly Rotation (Recommended)
1. Generate new AGENT_KEY: `openssl rand -hex 32`
2. Update secret in GitHub
3. Deploy updated key to any external services
4. Monitor workflows for successful operation

### Emergency Rotation
1. Immediately revoke compromised keys in Airtable
2. Generate new keys
3. Update GitHub secrets
4. Restart any running workflows

## Support

For additional help:
- Check GitHub Actions logs for detailed error messages
- Review Airtable API documentation
- Use the provided sanity test scripts to verify configuration

---

**⚠️ Important**: Never commit secrets to git repositories. Always use GitHub's encrypted secrets feature.