#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cqodtsqeiimwgidkrttb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function investigateSupabaseAPI() {
  console.log('🔍 Investigating Supabase API capabilities...');
  console.log('');
  
  // Test 1: Check available RPC functions
  console.log('📋 Testing available RPC functions...');
  try {
    // Try to list available functions through REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Check schema information
  console.log('\n🗄️  Testing schema information access...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/information_schema.tables?select=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const tables = await response.json();
      console.log(`   Found ${tables.length} tables in information_schema`);
      
      // Show existing tables
      const userTables = tables.filter(t => t.table_schema === 'public');
      console.log(`   Public tables: ${userTables.map(t => t.table_name).join(', ') || 'None'}`);
    } else {
      console.log(`   Error: ${await response.text()}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Test direct SQL execution with available methods
  console.log('\n⚡ Testing SQL execution methods...');
  
  // Method 1: Try pg_stat_statements
  try {
    console.log('   Testing pg_stat_statements...');
    const { data, error } = await supabase
      .from('pg_stat_statements')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   pg_stat_statements: ${error.message}`);
    } else {
      console.log(`   pg_stat_statements: Available`);
    }
  } catch (error) {
    console.log(`   pg_stat_statements: ${error.message}`);
  }
  
  // Method 2: Check if we can create a simple test table
  try {
    console.log('   Testing simple table creation via REST...');
    
    // First check if test table exists
    const { data: existing, error: checkError } = await supabase
      .from('test_table')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.log(`   Test table doesn't exist: ${checkError.message}`);
    } else {
      console.log(`   Test table exists with ${existing.length} rows`);
    }
  } catch (error) {
    console.log(`   Table test: ${error.message}`);
  }
  
  // Test 4: Check what functions are available
  console.log('\n🔧 Checking available functions...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/information_schema.routines?select=routine_name,routine_type&routine_schema=eq.public`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    });
    
    if (response.ok) {
      const functions = await response.json();
      console.log(`   Available functions:`, functions.map(f => f.routine_name).join(', ') || 'None');
    } else {
      console.log(`   Functions check failed: ${await response.text()}`);
    }
  } catch (error) {
    console.log(`   Functions error: ${error.message}`);
  }
  
  // Test 5: Test Management API
  console.log('\n🔑 Testing Management API...');
  try {
    // Try to access the database through management API
    const response = await fetch(`${SUPABASE_URL}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT version();'
      })
    });
    
    console.log(`   Management API status: ${response.status}`);
    const result = await response.text();
    console.log(`   Management API response: ${result}`);
  } catch (error) {
    console.log(`   Management API error: ${error.message}`);
  }
  
  // Test 6: Check for SQL editor endpoint
  console.log('\n📝 Testing SQL editor endpoint...');
  try {
    const response = await fetch(`${SUPABASE_URL}/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT 1 as test;'
      })
    });
    
    console.log(`   SQL editor status: ${response.status}`);
    const result = await response.text();
    console.log(`   SQL editor response: ${result}`);
  } catch (error) {
    console.log(`   SQL editor error: ${error.message}`);
  }
  
  console.log('\n🎯 Investigation Summary:');
  console.log('   - Standard REST API exec_sql function not available');
  console.log('   - Need to explore alternative deployment methods');
  console.log('   - Manual SQL execution in dashboard may be required');
  console.log('   - Will test individual table creation via REST API');
}

investigateSupabaseAPI().catch(console.error);