const { Client } = require('pg');
const fs = require('fs');

async function deploySchemaDirectPostgres() {
  console.log('🔧 Testing direct PostgreSQL connection for schema deployment...');
  
  // Connection configurations to try
  const connectionConfigs = [
    {
      name: 'Direct DB Connection',
      config: {
        host: 'db.cqodtsqeiimwgidkrttb.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80',
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Pooler Connection',
      config: {
        host: 'aws-0-us-east-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres.cqodtsqeiimwgidkrttb',
        password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80',
        ssl: { rejectUnauthorized: false }
      }
    }
  ];

  for (const { name, config } of connectionConfigs) {
    console.log(`\n🔍 Trying ${name}...`);
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log(`✅ ${name}: Connected successfully!`);
      
      // Test basic query
      const result = await client.query('SELECT version()');
      console.log(`✅ ${name}: Database version:`, result.rows[0].version.substring(0, 50) + '...');
      
      // Read schema file
      const schemaSQL = fs.readFileSync('migration/manual-deployment.sql', 'utf8');
      console.log(`✅ ${name}: Schema file loaded (${schemaSQL.length} characters)`);
      
      // Try to execute schema (this is the real test)
      console.log(`🚀 ${name}: Attempting schema deployment...`);
      await client.query(schemaSQL);
      console.log(`🎉 ${name}: SCHEMA DEPLOYED SUCCESSFULLY!`);
      
      await client.end();
      return { success: true, method: name };
      
    } catch (error) {
      console.log(`❌ ${name}: Failed -`, error.message);
      try { await client.end(); } catch {}
    }
  }
  
  return { success: false, error: 'All connection methods failed' };
}

deploySchemaDirectPostgres()
  .then(result => {
    if (result.success) {
      console.log(`\n🎉 SUCCESS! Schema deployed using: ${result.method}`);
      console.log('✅ Ready to proceed with data migration!');
    } else {
      console.log('\n❌ All automated approaches failed');
      console.log('📋 Manual deployment required');
    }
  })
  .catch(error => {
    console.error('💥 Deployment script error:', error);
  });
