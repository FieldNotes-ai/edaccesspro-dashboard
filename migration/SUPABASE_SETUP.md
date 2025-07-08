# Supabase Migration Setup Guide

## 🚀 Phase 2: Supabase Project Setup

### Step 1: Create Supabase Account & Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up** with GitHub (recommended) or email
3. **Create new project**:
   - Project name: `esa-vendor-dashboard`
   - Database password: Generate a strong password (save this!)
   - Region: Choose closest to your users
   - Pricing: Start with **Free tier**

### Step 2: Configure Database Schema

1. **Open SQL Editor** in Supabase dashboard
2. **Copy and paste** the contents of `migration/supabase_schema.sql`
3. **Run the script** to create all tables

### Step 3: Get Connection Details

After project creation, go to **Settings → Database** and copy:

```bash
# Add these to your .env files
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database connection (for direct SQL if needed)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

### Step 4: Enable Row Level Security (RLS)

Run this SQL to secure your tables:

```sql
-- Enable RLS on all tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_program_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE esa_program_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your security requirements)
-- Example: Allow all operations for service role
CREATE POLICY "Service role can do everything" ON esa_program_tracker
FOR ALL USING (auth.role() = 'service_role');

-- Example: Allow authenticated users to read
CREATE POLICY "Authenticated users can read programs" ON esa_program_tracker
FOR SELECT USING (auth.role() = 'authenticated');
```

## 📊 Data Import Process

Once Supabase is set up, we'll run:

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Import all your Airtable data
node migration/import-to-supabase.js
```

## 🔄 API Migration Timeline

**Today**: 
- ✅ Data exported from Airtable
- 🔄 Supabase project setup
- 🔄 Schema deployment

**Next 2-3 days**:
- Import data to Supabase
- Update research agent APIs
- Update control tower APIs
- Test everything thoroughly

**Go-live**: 
- Switch environment variables
- Monitor for issues
- Keep Airtable as read-only backup

## 💰 Cost Benefits

**Current Airtable**: 
- 85% of free API calls used
- Next tier: $20/user/month

**New Supabase**:
- Free tier: 500MB storage, unlimited API calls
- When you scale: $25/month for 8GB storage
- **No API call limits** for your AI agents

## 🛡️ Risk Mitigation

1. **Parallel systems**: Keep both running during transition
2. **Data backup**: All Airtable data exported and versioned
3. **Rollback plan**: Can revert to Airtable if needed
4. **Testing**: Comprehensive testing before switch

## Next Steps

1. **Create Supabase project** (15 minutes)
2. **Run schema setup** (5 minutes)
3. **Get connection credentials** (5 minutes)
4. **Test connection** with simple query

Ready to start? Let me know when your Supabase project is created!