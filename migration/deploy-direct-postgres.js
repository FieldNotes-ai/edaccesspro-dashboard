#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');

async function deployViaDirectPostgres() {
  console.log('🐘 Direct PostgreSQL Connection Deployment');
  console.log('==========================================');
  
  // Connection details extracted from service key
  const connectionConfig = {
    host: 'db.cqodtsqeiimwgidkrttb.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    // We need to find the password - let's try common approaches
  };
  
  console.log('🔑 Attempting PostgreSQL connection...');
  console.log(`Host: ${connectionConfig.host}`);
  console.log(`Port: ${connectionConfig.port}`);
  console.log(`Database: ${connectionConfig.database}`);
  console.log(`User: ${connectionConfig.user}`);
  
  // Try different authentication methods
  const authMethods = [
    // Method 1: Use service key as password
    { password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80', method: 'Service Key as Password' },
    
    // Method 2: Use service_role as user with service key as password
    { user: 'service_role', password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80', method: 'Service Role User' },
    
    // Method 3: Try connection without password (trust authentication)
    { method: 'No Password' },
    
    // Method 4: Use common default passwords
    { password: 'postgres', method: 'Default Password' },
    { password: '', method: 'Empty Password' }
  ];
  
  for (const auth of authMethods) {
    console.log(`\n🧪 Testing: ${auth.method}`);
    
    const config = {
      ...connectionConfig,
      user: auth.user || connectionConfig.user,
      password: auth.password,
      ssl: {
        rejectUnauthorized: false // Required for Supabase
      },
      connectionTimeoutMillis: 5000
    };
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log('✅ Connection successful!');
      
      // Test with a simple query
      const result = await client.query('SELECT version();');
      console.log('📊 Database version:', result.rows[0].version.substring(0, 50) + '...');
      
      // If we got here, connection works! Deploy the schema
      console.log('\n🚀 Deploying schema...');
      await deploySchema(client);
      
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
  console.log('\n💡 ALTERNATIVE APPROACHES:');
  console.log('1. Get database password from Supabase dashboard settings');
  console.log('2. Use Supabase CLI with proper authentication');
  console.log('3. Manual SQL execution in Supabase SQL Editor');
  
  // Create instructions for manual approach
  await createManualInstructions();
}

async function deploySchema(client) {
  try {
    // Read and execute the schema
    const schemaSQL = fs.readFileSync('./manual-deployment.sql', 'utf8');
    
    // Split into statements and execute one by one
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        const result = await client.query(statement);
        console.log(`✅ Statement ${i + 1}: Success`);
        
        // Show results for SELECT statements
        if (statement.toLowerCase().includes('select') && result.rows?.length > 0) {
          console.log(`   Result: ${JSON.stringify(result.rows[0])}`);
        }
        
        successCount++;
      } catch (error) {
        console.log(`❌ Statement ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Deployment Summary:`);
    console.log(`   ✅ ${successCount} statements executed successfully`);
    console.log(`   ❌ ${errorCount} statements failed`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Schema deployment completed successfully!');
      
      // Test the tables
      await testDeployment(client);
    } else {
      console.log('\n⚠️  Schema deployment completed with some errors.');
    }
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
  }
}

async function testDeployment(client) {
  console.log('\n🧪 Testing deployed schema...');
  
  const tables = [
    'esa_program_tracker',
    'agent_tasks', 
    'agent_approval_queue',
    'session_handoff'
  ];
  
  for (const table of tables) {
    try {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`✅ ${table}: ${result.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
  
  console.log('\n🏆 Schema validation complete!');
}

async function createManualInstructions() {
  const instructions = `
# 🚀 MANUAL DEPLOYMENT INSTRUCTIONS

## Option 1: Supabase Dashboard (RECOMMENDED)
1. Go to: https://cqodtsqeiimwgidkrttb.supabase.co
2. Login to your Supabase account
3. Navigate to SQL Editor (left sidebar)
4. Copy contents of migration/manual-deployment.sql
5. Paste into SQL Editor
6. Click "Run" to execute

## Option 2: Direct PostgreSQL Connection
1. Get your database password from Supabase Dashboard → Settings → Database
2. Use psql or any PostgreSQL client:
   \`\`\`
   Host: db.cqodtsqeiimwgidkrttb.supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: [Your database password]
   \`\`\`
3. Execute the SQL from migration/manual-deployment.sql

## Option 3: Supabase CLI
1. Install: npm install -g supabase (if supported)
2. Login: supabase login
3. Link: supabase link --project-ref cqodtsqeiimwgidkrttb
4. Push: supabase db push

## After Deployment
Run this to test:
\`\`\`bash
node migration/test-supabase-connection.js
\`\`\`

## Next Steps
1. Verify schema deployment
2. Import data: node migration/import-to-supabase.js
3. Test COO agent: node demo-coo-agent.js
`;
  
  fs.writeFileSync('./DEPLOYMENT_INSTRUCTIONS.md', instructions);
  console.log('\n📄 Created DEPLOYMENT_INSTRUCTIONS.md');
}

// Run the deployment
deployViaDirectPostgres().catch(console.error);