#!/usr/bin/env node

const SUPABASE_URL = 'https://cqodtsqeiimwgidkrttb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80';

async function exploreAdminAPIs() {
  console.log('🔍 Exploring Supabase Admin API endpoints...');
  console.log('');
  
  // Try different admin endpoints that might allow schema manipulation
  const adminEndpoints = [
    // Database admin endpoints
    { path: '/database/query', method: 'POST' },
    { path: '/admin/database/query', method: 'POST' },
    { path: '/v1/admin/database/query', method: 'POST' },
    
    // Edge function endpoints
    { path: '/functions/v1/sql-executor', method: 'POST' },
    { path: '/edge-functions/sql-executor', method: 'POST' },
    
    // Management API endpoints
    { path: '/management/v1/projects/cqodtsqeiimwgidkrttb/database/query', method: 'POST' },
    { path: '/v1/projects/cqodtsqeiimwgidkrttb/sql', method: 'POST' },
    
    // Direct postgres endpoints
    { path: '/postgres/query', method: 'POST' },
    { path: '/pg/query', method: 'POST' },
    
    // API Gateway endpoints
    { path: '/api/database/exec', method: 'POST' },
    { path: '/api/sql/exec', method: 'POST' }
  ];
  
  const testSQL = 'SELECT version();';
  
  for (const endpoint of adminEndpoints) {
    try {
      console.log(`🧪 Testing: ${endpoint.method} ${endpoint.path}`);
      
      const response = await fetch(`${SUPABASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'X-Client-Info': 'supabase-js/2.50.3'
        },
        body: JSON.stringify({
          query: testSQL,
          sql: testSQL,
          statement: testSQL
        })
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ SUCCESS! Response:`, JSON.stringify(result, null, 2));
        
        // If we found a working endpoint, try to create tables
        if (response.status === 200) {
          console.log('\n🎯 Found working endpoint! Attempting schema creation...');
          await createSchemaViaEndpoint(endpoint.path);
          return;
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🔄 Trying alternative: Supabase Management API...');
  await tryManagementAPI();
}

async function createSchemaViaEndpoint(workingEndpoint) {
  console.log(`🚀 Creating schema via: ${workingEndpoint}`);
  
  const schemaSQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

SELECT 'Schema created successfully!' as result;
`;
  
  try {
    const response = await fetch(`${SUPABASE_URL}${workingEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        query: schemaSQL,
        sql: schemaSQL
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Schema creation successful!', result);
    } else {
      const error = await response.text();
      console.log('❌ Schema creation failed:', error);
    }
    
  } catch (error) {
    console.log('❌ Schema creation exception:', error.message);
  }
}

async function tryManagementAPI() {
  console.log('🔧 Trying Supabase Management API...');
  
  // Try the official management API endpoints
  const managementEndpoints = [
    'https://api.supabase.com/v1/projects/cqodtsqeiimwgidkrttb/database/query',
    'https://api.supabase.io/v1/projects/cqodtsqeiimwgidkrttb/database/query'
  ];
  
  for (const endpoint of managementEndpoints) {
    try {
      console.log(`🧪 Testing management endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'SELECT version();'
        })
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ Management API works!', result);
        return;
      } else {
        const error = await response.text();
        console.log(`   ❌ Management API error: ${error.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Management API exception: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Exploring direct PostgreSQL connection...');
  await tryDirectPostgres();
}

async function tryDirectPostgres() {
  console.log('🐘 Attempting direct PostgreSQL connection...');
  
  // Extract connection details from the service key
  try {
    const payload = JSON.parse(Buffer.from(SUPABASE_SERVICE_KEY.split('.')[1], 'base64').toString());
    console.log('🔑 Service key details:', {
      iss: payload.iss,
      ref: payload.ref,
      role: payload.role
    });
    
    // Try to construct postgres connection string
    const pgHost = `db.${payload.ref}.supabase.co`;
    const pgPort = 5432;
    
    console.log(`🔗 PostgreSQL endpoint: ${pgHost}:${pgPort}`);
    console.log('');
    console.log('💡 DIRECT CONNECTION OPTION:');
    console.log('You could use a PostgreSQL client directly:');
    console.log(`Host: ${pgHost}`);
    console.log(`Port: ${pgPort}`);
    console.log(`Database: postgres`);
    console.log(`User: postgres`);
    console.log(`Password: [Your database password from Supabase settings]`);
    console.log('');
    
  } catch (error) {
    console.log('❌ Failed to decode service key:', error.message);
  }
  
  console.log('🎯 RECOMMENDATION: Use one of these methods:');
  console.log('1. Manual SQL in Supabase Dashboard (migration/manual-deployment.sql)');
  console.log('2. Direct PostgreSQL connection with psql or pg client');
  console.log('3. Supabase CLI with authentication');
}

// Run the exploration
exploreAdminAPIs().catch(console.error);