-- Generated PostgreSQL Schema from Airtable Export
-- Generated at: 2025-07-08T03:27:37.757Z

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Table: API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_api_keys_airtable_id ON api_keys (airtable_id);
CREATE INDEX idx_api_keys_created_at ON api_keys (created_at);


-- Table: Client Program Access
CREATE TABLE client_program_access (
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

-- Create indexes
CREATE INDEX idx_client_program_access_airtable_id ON client_program_access (airtable_id);
CREATE INDEX idx_client_program_access_created_at ON client_program_access (created_at);


-- Table: ESA Program Tracker - Optimized for COO Agent (15 core fields)
CREATE TABLE esa_program_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  state VARCHAR(255) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  program_type VARCHAR(255) NOT NULL,
  vendor_portal_url VARCHAR(255) NOT NULL,
  portal_technology VARCHAR(255) NOT NULL,
  platform_fee DECIMAL NOT NULL,
  admin_fee BIGINT NOT NULL,
  market_size BIGINT NOT NULL,
  payment_timing VARCHAR(255) NOT NULL,
  vendor_approval_time VARCHAR(255) NOT NULL,
  program_status VARCHAR(255) NOT NULL,
  current_window_status VARCHAR(255) NOT NULL,
  automation_priority VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_esa_program_tracker_airtable_id ON esa_program_tracker (airtable_id);
CREATE INDEX idx_esa_program_tracker_created_at ON esa_program_tracker (created_at);


-- Table: Monitoring Logs
CREATE TABLE monitoring_logs (
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

-- Create indexes
CREATE INDEX idx_monitoring_logs_airtable_id ON monitoring_logs (airtable_id);
CREATE INDEX idx_monitoring_logs_created_at ON monitoring_logs (created_at);


-- Table: Organizations
CREATE TABLE organizations (
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

-- Create indexes
CREATE INDEX idx_organizations_airtable_id ON organizations (airtable_id);
CREATE INDEX idx_organizations_created_at ON organizations (created_at);


-- Table: Review Queue
CREATE TABLE review_queue (
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

-- Create indexes
CREATE INDEX idx_review_queue_airtable_id ON review_queue (airtable_id);
CREATE INDEX idx_review_queue_created_at ON review_queue (created_at);


-- Table: Subscriptions
CREATE TABLE subscriptions (
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

-- Create indexes
CREATE INDEX idx_subscriptions_airtable_id ON subscriptions (airtable_id);
CREATE INDEX idx_subscriptions_created_at ON subscriptions (created_at);


-- Table: Usage Analytics
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_usage_analytics_airtable_id ON usage_analytics (airtable_id);
CREATE INDEX idx_usage_analytics_created_at ON usage_analytics (created_at);


-- Table: User Accounts
CREATE TABLE user_accounts (
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

-- Create indexes
CREATE INDEX idx_user_accounts_airtable_id ON user_accounts (airtable_id);
CREATE INDEX idx_user_accounts_created_at ON user_accounts (created_at);


-- Agent Orchestration Tables for COO Agent System

-- Table: Agent Tasks
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type VARCHAR(255) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  assigned_agent VARCHAR(255) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  requires_human_approval BOOLEAN NOT NULL DEFAULT true,
  approval_status VARCHAR(50) DEFAULT 'pending',
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  parameters JSONB,
  result JSONB,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Table: Agent Approval Queue
CREATE TABLE agent_approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES agent_tasks(id),
  requested_by VARCHAR(255) NOT NULL,
  request_details TEXT NOT NULL,
  approval_level VARCHAR(50) NOT NULL DEFAULT 'standard',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approved_by VARCHAR(255),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Table: Agent Execution Log
CREATE TABLE agent_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES agent_tasks(id),
  agent_name VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  execution_details JSONB,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  duration_ms INTEGER
);

-- Table: Session Handoff
CREATE TABLE session_handoff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  project_phase VARCHAR(255) NOT NULL,
  completion_percentage INTEGER NOT NULL,
  current_objectives TEXT[] NOT NULL,
  completed_tasks TEXT[] NOT NULL,
  blocked_items TEXT[] NOT NULL,
  next_session_priorities TEXT[] NOT NULL,
  scope_constraints TEXT[] NOT NULL,
  critical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent orchestration
CREATE INDEX idx_agent_tasks_status ON agent_tasks (status);
CREATE INDEX idx_agent_tasks_assigned_agent ON agent_tasks (assigned_agent);
CREATE INDEX idx_agent_tasks_created_at ON agent_tasks (created_at);
CREATE INDEX idx_agent_approval_queue_status ON agent_approval_queue (status);
CREATE INDEX idx_agent_approval_queue_created_at ON agent_approval_queue (created_at);
CREATE INDEX idx_agent_execution_log_task_id ON agent_execution_log (task_id);
CREATE INDEX idx_agent_execution_log_timestamp ON agent_execution_log (timestamp);
CREATE INDEX idx_session_handoff_session_id ON session_handoff (session_id);
CREATE INDEX idx_session_handoff_created_at ON session_handoff (created_at);

