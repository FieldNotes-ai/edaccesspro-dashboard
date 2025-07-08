#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testConnection() {
  console.log('🧪 Testing Supabase connection...\n');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables:');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
    console.error('\nPlease set these variables and try again.');
    process.exit(1);
  }
  
  console.log('🔗 Connection details:');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);
  console.log('');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Test 1: Basic connection
    console.log('📡 Testing basic connection...');
    const { data, error } = await supabase.from('esa_program_tracker').select('count').limit(1);
    
    if (error) {
      console.error(`❌ Connection failed: ${error.message}`);
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('💡 This likely means the schema hasn\'t been created yet.');
        console.error('   Run the SQL from migration/supabase_schema.sql in your Supabase SQL editor.');
      }
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: List all tables
    console.log('\n📋 Checking schema...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'api_keys', 'client_program_access', 'esa_program_tracker',
        'monitoring_logs', 'organizations', 'review_queue',
        'subscriptions', 'user_accounts', 'usage_analytics'
      ]);
    
    if (tablesError) {
      console.error(`❌ Schema check failed: ${tablesError.message}`);
      return;
    }
    
    const expectedTables = [
      'api_keys', 'client_program_access', 'esa_program_tracker',
      'monitoring_logs', 'organizations', 'review_queue', 
      'subscriptions', 'user_accounts', 'usage_analytics'
    ];
    
    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    console.log(`   ✅ Found ${existingTables.length}/${expectedTables.length} expected tables`);
    
    if (missingTables.length > 0) {
      console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log('   💡 Make sure to run the complete schema SQL in Supabase dashboard');
    }
    
    // Test 3: Check if data exists
    console.log('\n💾 Checking for existing data...');
    for (const table of existingTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`   📊 ${table}: ${count || 0} records`);
        }
      } catch (e) {
        console.log(`   ⚠️  ${table}: Could not check record count`);
      }
    }
    
    console.log('\n🎉 Supabase is ready for data import!');
    console.log('\nNext steps:');
    if (missingTables.length > 0) {
      console.log('   1. Complete schema setup in Supabase dashboard');
    }
    console.log('   2. Run: node migration/import-to-supabase.js');
    console.log('   3. Update application APIs');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   1. Check your SUPABASE_URL is correct');
    console.error('   2. Check your SERVICE_ROLE_KEY (not ANON_KEY)');
    console.error('   3. Ensure the Supabase project is active');
  }
}

testConnection().catch(console.error);