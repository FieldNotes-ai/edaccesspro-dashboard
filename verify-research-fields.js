#!/usr/bin/env node

const { Client } = require('pg');

async function verifyResearchFields() {
  console.log('🔍 Verifying New Research Fields Implementation');
  console.log('Fields to verify: vendor_onboarding_time, compliance_requirements');
  console.log('==========================================================');
  
  const connectionConfig = {
    host: 'db.cqodtsqeiimwgidkrttb.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  };
  
  const authMethods = [
    { password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80', method: 'Service Key as Password' },
    { user: 'service_role', password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80', method: 'Service Role User' },
    { password: 'DrHcNgjAYKfvfzC8', method: 'Database Password' }
  ];
  
  for (const auth of authMethods) {
    console.log(`\n🧪 Testing connection: ${auth.method}`);
    
    const config = {
      ...connectionConfig,
      user: auth.user || connectionConfig.user,
      password: auth.password
    };
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log('✅ Connection successful!');
      
      // Check if the columns exist
      console.log('\n📊 Checking column existence...');
      const columnCheck = await client.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_name = 'esa_program_tracker' 
        AND column_name IN ('vendor_onboarding_time', 'compliance_requirements')
        ORDER BY column_name;
      `);
      
      if (columnCheck.rows.length > 0) {
        console.log('✅ New research fields found:');
        columnCheck.rows.forEach(row => {
          console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
        });
      } else {
        console.log('❌ New research fields not found in database schema');
      }
      
      // Check indexes
      console.log('\n📊 Checking indexes...');
      const indexCheck = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'esa_program_tracker' 
        AND indexname IN ('idx_esa_program_tracker_vendor_onboarding_time', 'idx_esa_program_tracker_compliance_requirements');
      `);
      
      if (indexCheck.rows.length > 0) {
        console.log('✅ Indexes found:');
        indexCheck.rows.forEach(row => {
          console.log(`   - ${row.indexname}`);
        });
      } else {
        console.log('❌ No indexes found for new fields');
      }
      
      // Test data retrieval
      console.log('\n📊 Testing data retrieval...');
      const dataTest = await client.query(`
        SELECT 
          id,
          program_name,
          vendor_onboarding_time,
          compliance_requirements
        FROM esa_program_tracker 
        LIMIT 3
      `);
      
      if (dataTest.rows.length > 0) {
        console.log('✅ Data retrieval successful:');
        dataTest.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.program_name}`);
          console.log(`      Vendor Onboarding Time: ${row.vendor_onboarding_time}`);
          console.log(`      Compliance Requirements: ${row.compliance_requirements}`);
        });
      } else {
        console.log('❌ No data found in esa_program_tracker table');
      }
      
      await client.end();
      console.log('\n🎉 Research fields verification complete!');
      return;
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      try {
        await client.end();
      } catch (endError) {
        // Ignore end errors
      }
    }
  }
  
  console.log('\n❌ Unable to connect to database for verification');
  console.log('The migration SQL has been prepared and is ready for manual execution.');
}

// Run the verification
verifyResearchFields().catch(console.error);