#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://cqodtsqeiimwgidkrttb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeDirectSQL() {
  console.log('🚀 Deploying schema directly to Supabase...');
  
  try {
    // Read the optimized schema
    const schemaSQL = fs.readFileSync('./supabase_schema.sql', 'utf8');
    
    // Split into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';');
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Use REST API to execute SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (response.ok) {
          console.log(`✅ Statement ${i + 1}: Executed successfully`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.log(`⚠️  Statement ${i + 1}: ${errorText}`);
          
          // Some statements might "fail" but actually succeed (like creating existing extensions)
          if (errorText.includes('already exists') || errorText.includes('extension')) {
            console.log(`   ℹ️  (Acceptable - resource already exists)`);
            successCount++;
          } else {
            errorCount++;
          }
        }
      } catch (error) {
        console.log(`❌ Statement ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Deployment Summary:`);
    console.log(`   ✅ ${successCount} statements executed successfully`);
    console.log(`   ❌ ${errorCount} statements failed`);
    
    if (errorCount === 0) {
      console.log(`\n🎉 Schema deployment completed successfully!`);
    } else {
      console.log(`\n⚠️  Schema deployment completed with some issues.`);
    }
    
    // Test the deployment
    console.log('\n🧪 Testing schema deployment...');
    await testDeployment();
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
    console.log('\n💡 Manual execution required in Supabase SQL editor');
    console.log('   1. Go to https://cqodtsqeiimwgidkrttb.supabase.co');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Paste contents of migration/supabase_schema.sql');
    console.log('   4. Execute the SQL');
  }
}

async function testDeployment() {
  try {
    // Test if main tables exist
    const tables = [
      'esa_program_tracker',
      'agent_tasks',
      'agent_approval_queue',
      'session_handoff'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: Ready`);
      }
    }
    
    console.log('\n🏆 Schema validation complete!');
    
  } catch (error) {
    console.log('❌ Schema validation failed:', error.message);
  }
}

executeDirectSQL().catch(console.error);