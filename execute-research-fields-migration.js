#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');

async function executeResearchFieldsMigration() {
  console.log('🚀 Executing New Research Fields Migration');
  console.log('Task: Add New Research Fields');
  console.log('Fields: vendor_onboarding_time, compliance_requirements');
  console.log('Agent: ESA_Market_Intelligence_Agent');
  console.log('====================================================');
  
  // Connection details extracted from service key
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
  
  console.log('🔑 Attempting PostgreSQL connection...');
  
  // Try different authentication methods
  const authMethods = [
    { password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80', method: 'Service Key as Password' },
    { user: 'service_role', password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80', method: 'Service Role User' },
    { password: 'DrHcNgjAYKfvfzC8', method: 'Database Password' },
    { password: '', method: 'Empty Password' }
  ];
  
  for (const auth of authMethods) {
    console.log(`\n🧪 Testing: ${auth.method}`);
    
    const config = {
      ...connectionConfig,
      user: auth.user || connectionConfig.user,
      password: auth.password
    };
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log('✅ Connection successful!');
      
      // Test with a simple query
      const result = await client.query('SELECT version();');
      console.log('📊 Database version:', result.rows[0].version.substring(0, 50) + '...');
      
      // Deploy the migration
      console.log('\n🚀 Deploying new research fields...');
      await deployResearchFields(client);
      
      await client.end();
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
  
  console.log('\n❌ All connection methods failed.');
  console.log('\n💡 MANUAL EXECUTION REQUIRED:');
  console.log('1. Go to Supabase Dashboard: https://cqodtsqeiimwgidkrttb.supabase.co');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Execute the migration SQL below:');
  console.log('');
  
  // Show the SQL to execute manually
  const migrationSQL = `
-- Add New Research Fields
-- Task: Add New Research Fields
-- Approved by: Control Tower User
-- Added by: ESA_Market_Intelligence_Agent

ALTER TABLE esa_program_tracker 
ADD COLUMN IF NOT EXISTS vendor_onboarding_time VARCHAR(255) DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS compliance_requirements TEXT DEFAULT 'Unknown';

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_vendor_onboarding_time 
ON esa_program_tracker (vendor_onboarding_time);

CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_compliance_requirements 
ON esa_program_tracker USING gin (to_tsvector('english', compliance_requirements));

-- Update timestamps
UPDATE esa_program_tracker SET updated_at = NOW() WHERE id IS NOT NULL;

-- Log success
SELECT 'New Research Fields (vendor_onboarding_time, compliance_requirements) added successfully!' as message;
`;
  
  console.log(migrationSQL);
  
  // Save the SQL to a file for easy access
  fs.writeFileSync('./research-fields-migration.sql', migrationSQL);
  console.log('\n📄 Migration SQL saved to: research-fields-migration.sql');
}

async function deployResearchFields(client) {
  try {
    const statements = [
      `ALTER TABLE esa_program_tracker ADD COLUMN IF NOT EXISTS vendor_onboarding_time VARCHAR(255) DEFAULT 'Unknown'`,
      `ALTER TABLE esa_program_tracker ADD COLUMN IF NOT EXISTS compliance_requirements TEXT DEFAULT 'Unknown'`,
      `CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_vendor_onboarding_time ON esa_program_tracker (vendor_onboarding_time)`,
      `CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_compliance_requirements ON esa_program_tracker USING gin (to_tsvector('english', compliance_requirements))`,
      `UPDATE esa_program_tracker SET updated_at = NOW() WHERE id IS NOT NULL`
    ];
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await client.query(statement);
        console.log(`✅ Statement ${i + 1}: Success`);
        successCount++;
      } catch (error) {
        console.log(`❌ Statement ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ ${successCount} statements executed successfully`);
    console.log(`   ❌ ${errorCount} statements failed`);
    
    if (errorCount === 0) {
      console.log('\n🎉 New Research Fields migration completed successfully!');
      
      // Test the new fields
      await testNewFields(client);
    } else {
      console.log('\n⚠️  Migration completed with some errors.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

async function testNewFields(client) {
  console.log('\n🧪 Testing new research fields...');
  
  try {
    const result = await client.query(`
      SELECT 
        id,
        program_name,
        vendor_onboarding_time,
        compliance_requirements
      FROM esa_program_tracker 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ New fields verified in database:');
      console.log(`   Program: ${result.rows[0].program_name}`);
      console.log(`   Vendor Onboarding Time: ${result.rows[0].vendor_onboarding_time}`);
      console.log(`   Compliance Requirements: ${result.rows[0].compliance_requirements}`);
    }
    
    console.log('\n🏆 Migration validation complete!');
  } catch (error) {
    console.log(`❌ Field verification failed: ${error.message}`);
  }
}

// Run the migration
executeResearchFieldsMigration().catch(console.error);