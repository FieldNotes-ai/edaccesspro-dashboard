#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cqodtsqeiimwgidkrttb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
);

async function verifyDeployment() {
  console.log('🧪 Verifying Supabase schema deployment...');
  
  const tables = [
    'esa_program_tracker',
    'agent_tasks', 
    'agent_approval_queue',
    'agent_execution_log',
    'session_handoff'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table}: Ready (${count || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allTablesExist = false;
    }
  }
  
  if (allTablesExist) {
    console.log('\n🎉 Schema deployment successful!');
    console.log('\n🔄 Ready for next steps:');
    console.log('1. Data import: node migration/import-to-supabase.js');
    console.log('2. COO agent test: node demo-coo-agent.js');
  } else {
    console.log('\n❌ Schema deployment incomplete.');
    console.log('\n💡 Please deploy manually:');
    console.log('1. Go to https://cqodtsqeiimwgidkrttb.supabase.co');
    console.log('2. SQL Editor → paste migration/manual-deployment.sql');
    console.log('3. Run this script again to verify');
  }
}

verifyDeployment().catch(console.error);
