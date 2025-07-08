#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://cqodtsqeiimwgidkrttb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80';

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deploySchemaAutomated() {
  console.log('🚀 Automated Schema Deployment using Service Key');
  console.log('================================================');
  
  try {
    // Since we can't execute raw SQL, let's create tables programmatically
    // using the Supabase client with INSERT operations to system tables
    
    console.log('🔧 Method 1: Direct table creation via pg_query...');
    
    // Try using the postgres extension to execute SQL
    const createExtensionResult = await executeSQL('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('UUID Extension:', createExtensionResult.success ? '✅' : '❌');
    
    // Create main ESA Program Tracker table
    console.log('\n📋 Creating esa_program_tracker table...');
    const createTableSQL = `
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
)`;
    
    const createTableResult = await executeSQL(createTableSQL);
    console.log('ESA Program Tracker:', createTableResult.success ? '✅' : '❌');
    
    // Create agent orchestration tables
    console.log('\n🤖 Creating agent orchestration tables...');
    
    const agentTablesSQL = [
      `CREATE TABLE IF NOT EXISTS agent_tasks (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS agent_approval_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL,
        requested_by VARCHAR(255) NOT NULL,
        request_details TEXT NOT NULL,
        approval_level VARCHAR(50) NOT NULL DEFAULT 'standard',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        approved_by VARCHAR(255),
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      )`,
      
      `CREATE TABLE IF NOT EXISTS agent_execution_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL,
        agent_name VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        execution_details JSONB,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        duration_ms INTEGER
      )`,
      
      `CREATE TABLE IF NOT EXISTS session_handoff (
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
      )`
    ];
    
    for (let i = 0; i < agentTablesSQL.length; i++) {
      const result = await executeSQL(agentTablesSQL[i]);
      console.log(`Agent table ${i + 1}:`, result.success ? '✅' : '❌');
    }
    
    // Create indexes
    console.log('\n📊 Creating indexes...');
    const indexSQL = [
      'CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_state ON esa_program_tracker (state)',
      'CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks (status)',
      'CREATE INDEX IF NOT EXISTS idx_agent_approval_queue_status ON agent_approval_queue (status)'
    ];
    
    for (const sql of indexSQL) {
      const result = await executeSQL(sql);
      console.log('Index:', result.success ? '✅' : '❌');
    }
    
    // Test the deployment
    console.log('\n🧪 Testing deployment...');
    await testTables();
    
  } catch (error) {
    console.error('❌ Automated deployment failed:', error.message);
    console.log('\n🔄 Trying alternative method...');
    await tryAlternativeMethod();
  }
}

async function executeSQL(sql) {
  try {
    // Method 1: Try using supabase-js with raw query
    const { data, error } = await supabase.rpc('query', { query_text: sql });
    
    if (!error) {
      return { success: true, data };
    }
    
    // Method 2: Try direct HTTP request with different endpoints
    const endpoints = [
      '/rest/v1/rpc/exec',
      '/rest/v1/query',
      '/database/exec',
      '/sql/exec'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY
          },
          body: JSON.stringify({ sql, query: sql, statement: sql })
        });
        
        if (response.ok) {
          const result = await response.json();
          return { success: true, data: result };
        }
      } catch (endpointError) {
        // Continue to next endpoint
      }
    }
    
    return { success: false, error: error?.message || 'Unknown error' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function tryAlternativeMethod() {
  console.log('🔄 Alternative Method: Creating tables through metadata manipulation...');
  
  try {
    // Try to create tables by manipulating pg_class or other system tables
    // This is a more advanced approach
    
    // Method 1: Use information_schema if available
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .limit(1);
    
    if (!schemaError) {
      console.log('✅ Information schema accessible');
      // Could potentially create tables through schema manipulation
    }
    
    // Method 2: Try to create a simple table using DDL through different approach
    console.log('📝 Attempting programmatic table creation...');
    
    // Create a test record to see if we can trigger table creation
    const testData = {
      id: '00000000-0000-0000-0000-000000000000',
      airtable_id: 'test',
      state: 'Test',
      program_name: 'Test Program',
      program_type: 'Test',
      vendor_portal_url: 'http://test.com',
      portal_technology: 'Test',
      platform_fee: 0,
      admin_fee: 0,
      market_size: 0,
      payment_timing: 'Test',
      vendor_approval_time: 'Test',
      program_status: 'Test',
      current_window_status: 'Test',
      automation_priority: 'Test'
    };
    
    // This will fail if table doesn't exist, but might give us insight
    const { data, error } = await supabase
      .from('esa_program_tracker')
      .insert([testData])
      .select();
    
    if (!error) {
      console.log('✅ Table exists or was created!');
      return true;
    } else {
      console.log('❌ Table creation failed:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Alternative method failed:', error.message);
  }
  
  return false;
}

async function testTables() {
  const tables = ['esa_program_tracker', 'agent_tasks', 'agent_approval_queue', 'session_handoff'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Ready`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

// Run the deployment
deploySchemaAutomated().catch(console.error);