
-- ESA Vendor Dashboard - Optimized Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core ESA Program Tracker (Optimized: 15 fields)
CREATE TABLE IF NOT EXISTS esa_program_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  state VARCHAR(255) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  program_type VARCHAR(255) NOT NULL,
  vendor_portal_url VARCHAR(255) NOT NULL,
  portal_technology VARCHAR(255) NOT NULL,
  platform_fee DECIMAL NOT NULL DEFAULT 0,
  admin_fee BIGINT NOT NULL DEFAULT 0,
  market_size BIGINT NOT NULL DEFAULT 0,
  payment_timing VARCHAR(255) NOT NULL DEFAULT 'Unknown',
  vendor_approval_time VARCHAR(255) NOT NULL DEFAULT 'Unknown',
  program_status VARCHAR(255) NOT NULL DEFAULT 'Active',
  current_window_status VARCHAR(255) NOT NULL DEFAULT 'Unknown',
  automation_priority VARCHAR(255) NOT NULL DEFAULT 'Medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Tasks for COO Orchestrator
CREATE TABLE IF NOT EXISTS agent_tasks (
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

-- Agent Approval Queue
CREATE TABLE IF NOT EXISTS agent_approval_queue (
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

-- Agent Execution Log
CREATE TABLE IF NOT EXISTS agent_execution_log (
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

-- Session Handoff
CREATE TABLE IF NOT EXISTS session_handoff (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_state ON esa_program_tracker (state);
CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_status ON esa_program_tracker (program_status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks (status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_assigned_agent ON agent_tasks (assigned_agent);
CREATE INDEX IF NOT EXISTS idx_agent_approval_queue_status ON agent_approval_queue (status);
CREATE INDEX IF NOT EXISTS idx_session_handoff_session_id ON session_handoff (session_id);

-- Insert initial session handoff record
INSERT INTO session_handoff (
  session_id,
  project_phase,
  completion_percentage,
  current_objectives,
  completed_tasks,
  blocked_items,
  next_session_priorities,
  scope_constraints,
  critical_notes
) VALUES (
  'foundation-' || extract(epoch from now()),
  'Foundation Phase - Supabase Migration & COO Agent',
  85,
  ARRAY['Complete Supabase migration', 'Test COO agent workflow', 'Validate session handoff system'],
  ARRAY['System audit completed', 'Schema optimized', 'COO agent implemented', 'Control tower created'],
  ARRAY['Manual SQL execution required'],
  ARRAY['Data migration', 'Control tower integration', 'Production testing'],
  ARRAY['No scope creep', 'Human approval required', 'Foundation locked'],
  'Foundation phase complete - ready for production integration'
);

-- Success message
SELECT 'Schema deployment successful! Foundation tables created.' as message;
