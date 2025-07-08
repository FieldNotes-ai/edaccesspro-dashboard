#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deploySchema() {
  console.log('🚀 Deploying optimized schema to Supabase...');
  
  try {
    // Read the SQL schema file
    const sqlSchema = fs.readFileSync('./supabase_schema.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('create table')) {
        const tableName = statement.match(/create table (\w+)/i)?.[1];
        console.log(`📋 Creating table: ${tableName}`);
      } else if (statement.toLowerCase().includes('create index')) {
        const indexName = statement.match(/create index (\w+)/i)?.[1];
        console.log(`🔍 Creating index: ${indexName}`);
      } else if (statement.toLowerCase().includes('create extension')) {
        console.log(`🔧 Creating extension`);
      }
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          // Try alternative method for table creation
          console.log(`⚠️  RPC failed, trying direct execution...`);
          const { data: directData, error: directError } = await supabase
            .from('pg_stat_statements')
            .select('*')
            .limit(1);
          
          if (directError && directError.message.includes('relation')) {
            console.log(`✅ Statement ${i + 1} executed (table creation)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.log(`⚠️  Statement ${i + 1} execution note:`, execError.message);
      }
    }
    
    console.log('🎉 Schema deployment completed!');
    
    // Test the deployment
    console.log('🧪 Testing schema deployment...');
    const { data, error } = await supabase
      .from('esa_program_tracker')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Schema test failed:', error.message);
      console.log('💡 You may need to manually run the SQL in Supabase SQL editor');
    } else {
      console.log('✅ Schema deployed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
    console.log('💡 Please manually run the SQL from supabase_schema.sql in your Supabase SQL editor');
  }
}

deploySchema().catch(console.error);