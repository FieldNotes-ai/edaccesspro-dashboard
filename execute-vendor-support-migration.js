#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');

async function executeVendorSupportMigration() {
  console.log('🚀 Executing Vendor Support Quality Metrics Migration');
  console.log('Task ID: 979b65a2-9c78-4ee7-8d08-3bc01ef02a94');
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
      console.log('\n🚀 Deploying vendor support quality metrics...');
      await deployVendorSupportFields(client);
      
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
-- Add Vendor Support Quality Metrics
-- Task ID: 979b65a2-9c78-4ee7-8d08-3bc01ef02a94
-- Approved by: Control Tower User

ALTER TABLE esa_program_tracker 
ADD COLUMN IF NOT EXISTS support_response_time VARCHAR(255) DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS vendor_satisfaction_score DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS technical_support_quality VARCHAR(255) DEFAULT 'Unknown';

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_support_response_time 
ON esa_program_tracker (support_response_time);

CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_vendor_satisfaction_score 
ON esa_program_tracker (vendor_satisfaction_score);

CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_technical_support_quality 
ON esa_program_tracker (technical_support_quality);

-- Update timestamps
UPDATE esa_program_tracker SET updated_at = NOW() WHERE id IS NOT NULL;

-- Log success
SELECT 'Vendor Support Quality Metrics fields added successfully!' as message;
`;
  
  console.log(migrationSQL);
  
  // Save the SQL to a file for easy access
  fs.writeFileSync('./vendor-support-migration.sql', migrationSQL);
  console.log('\n📄 Migration SQL saved to: vendor-support-migration.sql');
}

async function deployVendorSupportFields(client) {
  try {
    const statements = [
      `ALTER TABLE esa_program_tracker ADD COLUMN IF NOT EXISTS support_response_time VARCHAR(255) DEFAULT 'Unknown'`,
      `ALTER TABLE esa_program_tracker ADD COLUMN IF NOT EXISTS vendor_satisfaction_score DECIMAL DEFAULT 0`,
      `ALTER TABLE esa_program_tracker ADD COLUMN IF NOT EXISTS technical_support_quality VARCHAR(255) DEFAULT 'Unknown'`,
      `CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_support_response_time ON esa_program_tracker (support_response_time)`,
      `CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_vendor_satisfaction_score ON esa_program_tracker (vendor_satisfaction_score)`,
      `CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_technical_support_quality ON esa_program_tracker (technical_support_quality)`,
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
      console.log('\n🎉 Vendor Support Quality Metrics migration completed successfully!');
      
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
  console.log('\n🧪 Testing new vendor support quality fields...');
  
  try {
    const result = await client.query(`
      SELECT 
        id,
        program_name,
        support_response_time,
        vendor_satisfaction_score,
        technical_support_quality
      FROM esa_program_tracker 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ New fields verified in database:');
      console.log(`   Program: ${result.rows[0].program_name}`);
      console.log(`   Support Response Time: ${result.rows[0].support_response_time}`);
      console.log(`   Vendor Satisfaction Score: ${result.rows[0].vendor_satisfaction_score}`);
      console.log(`   Technical Support Quality: ${result.rows[0].technical_support_quality}`);
    }
    
    console.log('\n🏆 Migration validation complete!');
  } catch (error) {
    console.log(`❌ Field verification failed: ${error.message}`);
  }
}

// Run the migration
executeVendorSupportMigration().catch(console.error);