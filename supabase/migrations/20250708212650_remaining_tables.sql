-- Deploy remaining 8 tables from supabase_schema.sql
-- These tables complete the ESA Vendor Dashboard database schema

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Client Program Access
CREATE TABLE IF NOT EXISTS client_program_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  access_record VARCHAR(255) NOT NULL,
  organization TEXT[] NOT NULL,
  esa_program TEXT[] NOT NULL,
  access_level VARCHAR(255) NOT NULL,
  date_granted VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  access_reason VARCHAR(255) NOT NULL,
  created_date VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Monitoring Logs
CREATE TABLE IF NOT EXISTS monitoring_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  run_id VARCHAR(255) NOT NULL,
  timestamp VARCHAR(255) NOT NULL,
  source VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  articles_found BIGINT NOT NULL,
  run_duration__seconds_ DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  primary_contact_email VARCHAR(255) NOT NULL,
  primary_contact_name VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  organization_type TEXT[] NOT NULL,
  date_created VARCHAR(255) NOT NULL,
  notes TEXT NOT NULL,
  subscriptions TEXT[] NOT NULL,
  user_accounts TEXT[] NOT NULL,
  client_program_access TEXT[] NOT NULL,
  phone VARCHAR(255) NOT NULL,
  website VARCHAR(255) NOT NULL,
  onboarding_status VARCHAR(255) NOT NULL,
  signup_date VARCHAR(255) NOT NULL,
  last_activity VARCHAR(255) NOT NULL,
  team_size VARCHAR(255) NOT NULL,
  primary_focus VARCHAR(255) NOT NULL,
  product_categories TEXT[] NOT NULL,
  service_categories TEXT[] NOT NULL,
  monthly_revenue BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Review Queue
CREATE TABLE IF NOT EXISTS review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  discovery_id VARCHAR(255) NOT NULL,
  date_discovered VARCHAR(255) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  source_url VARCHAR(255) NOT NULL,
  discovery_source VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  ai_confidence_score DECIMAL NOT NULL,
  program_details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  subscription_tier VARCHAR(255) NOT NULL,
  tier_type VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  start_date VARCHAR(255) NOT NULL,
  monthly_price BIGINT NOT NULL,
  organization TEXT[] NOT NULL,
  created_date VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Usage Analytics
CREATE TABLE IF NOT EXISTS usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: User Accounts
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  organization TEXT[] NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  date_created VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for all new tables
CREATE INDEX IF NOT EXISTS idx_api_keys_airtable_id ON api_keys (airtable_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys (created_at);

CREATE INDEX IF NOT EXISTS idx_client_program_access_airtable_id ON client_program_access (airtable_id);
CREATE INDEX IF NOT EXISTS idx_client_program_access_created_at ON client_program_access (created_at);

CREATE INDEX IF NOT EXISTS idx_monitoring_logs_airtable_id ON monitoring_logs (airtable_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_created_at ON monitoring_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_organizations_airtable_id ON organizations (airtable_id);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations (created_at);

CREATE INDEX IF NOT EXISTS idx_review_queue_airtable_id ON review_queue (airtable_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_created_at ON review_queue (created_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_airtable_id ON subscriptions (airtable_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions (created_at);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_airtable_id ON usage_analytics (airtable_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON usage_analytics (created_at);

CREATE INDEX IF NOT EXISTS idx_user_accounts_airtable_id ON user_accounts (airtable_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_created_at ON user_accounts (created_at);

-- Success message
SELECT 'Remaining 8 tables deployed successfully!' as message;