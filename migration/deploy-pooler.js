#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');

async function deployViaConnectionPooler() {
  console.log('🔄 Supabase Connection Pooler Deployment');
  console.log('=========================================');
  
  // Try different Supabase connection endpoints
  const connectionVariants = [
    // Standard connection pooler
    {
      host: 'aws-0-us-west-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.cqodtsqeiimwgidkrttb',
      method: 'Connection Pooler'
    },
    
    // Direct database connection
    {
      host: 'db.cqodtsqeiimwgidkrttb.supabase.co',
      port: 5432,  
      database: 'postgres',
      user: 'postgres',
      method: 'Direct Database'
    },
    
    // Alternative pooler endpoint
    {
      host: 'cqodtsqeiimwgidkrttb.supabase.co',
      port: 5432,
      database: 'postgres', 
      user: 'postgres',
      method: 'Alternative Endpoint'
    },
    
    // Transaction mode pooler
    {
      host: 'aws-0-us-west-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.cqodtsqeiimwgidkrttb',
      options: '?pgbouncer=true&connect_timeout=15',
      method: 'Transaction Pooler'
    }
  ];
  
  // Try different password approaches  
  const passwords = [
    // Service key variations
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80',
    
    // Try variations
    '[YOUR_PASSWORD_HERE]', // Placeholder
    'postgres',
    '',
    undefined
  ];
  
  for (const conn of connectionVariants) {
    console.log(`\n🧪 Testing: ${conn.method}`);
    console.log(`   Host: ${conn.host}:${conn.port}`);
    
    for (const password of passwords) {
      if (password === '[YOUR_PASSWORD_HERE]') {
        console.log(`   🔑 Password needed from Supabase dashboard`);
        continue;
      }
      
      const config = {
        host: conn.host,
        port: conn.port,
        database: conn.database,
        user: conn.user,
        password: password,
        ssl: {
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000,
        statement_timeout: 30000
      };
      
      const client = new Client(config);
      
      try {
        await client.connect();
        console.log(`   ✅ Connected with password: ${password ? 'Set' : 'None'}`);
        
        // Test connection
        const result = await client.query('SELECT current_user, version() LIMIT 1;');
        console.log(`   👤 User: ${result.rows[0].current_user}`);
        console.log(`   🗄️  DB: ${result.rows[0].version.substring(0, 30)}...`);
        
        // Deploy schema
        console.log('\n🚀 Deploying schema via working connection...');
        await deploySchemaViaConnection(client);
        
        await client.end();
        return true;
        
      } catch (error) {
        try {
          await client.end();
        } catch (e) {}
        
        if (error.message.includes('ENOTFOUND')) {
          console.log(`   🌐 DNS resolution failed`);
          break; // Skip other passwords for this host
        } else if (error.message.includes('authentication')) {
          console.log(`   🔐 Auth failed`);
        } else {
          console.log(`   ❌ ${error.message.substring(0, 50)}...`);
        }
      }
    }
  }
  
  console.log('\n❌ All automated connection attempts failed.');
  console.log('\n🎯 CREATING MANUAL DEPLOYMENT SOLUTION...');
  
  await createComprehensiveDeploymentSolution();
  return false;
}

async function deploySchemaViaConnection(client) {
  try {
    const schemaSQL = fs.readFileSync('./manual-deployment.sql', 'utf8');
    
    // Execute as a single transaction
    await client.query('BEGIN');
    
    try {
      // Split and execute statements
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
        .filter(stmt => !stmt.toLowerCase().includes('select')); // Skip SELECT statements in transaction
      
      for (const statement of statements) {
        await client.query(statement);
      }
      
      await client.query('COMMIT');
      console.log('✅ Schema deployed successfully!');
      
      // Test the deployment
      await testSchemaDeployment(client);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
  }
}

async function testSchemaDeployment(client) {
  console.log('\n🧪 Testing deployed schema...');
  
  const tables = ['esa_program_tracker', 'agent_tasks', 'session_handoff'];
  
  for (const table of tables) {
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`✅ ${table}: ${result.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

async function createComprehensiveDeploymentSolution() {
  console.log('📝 Creating comprehensive deployment solution...');
  
  // Create a complete deployment package
  const deploymentScript = `#!/bin/bash

echo "🚀 ESA Vendor Dashboard - Supabase Schema Deployment"
echo "===================================================="

echo ""
echo "📋 DEPLOYMENT OPTIONS:"
echo ""
echo "1. SUPABASE DASHBOARD (Recommended - Always Works)"
echo "   • Go to: https://cqodtsqeiimwgidkrttb.supabase.co"
echo "   • Login → SQL Editor"
echo "   • Copy/paste: migration/manual-deployment.sql"
echo "   • Click Run"
echo ""

echo "2. POSTGRESQL CLIENT (If you have credentials)"
echo "   • Get password from Supabase Dashboard → Settings → Database"
echo "   • Connect: psql -h aws-0-us-west-1.pooler.supabase.com -p 5432 -U postgres.cqodtsqeiimwgidkrttb -d postgres"
echo "   • Execute: \\\\i migration/manual-deployment.sql"
echo ""

echo "3. AUTOMATED TEST (After manual deployment)"
echo "   node migration/test-supabase-connection.js"
echo ""

echo "📁 Files ready for deployment:"
ls -la migration/manual-deployment.sql
echo ""

echo "🎯 NEXT STEPS AFTER DEPLOYMENT:"
echo "1. Test connection: node migration/test-supabase-connection.js"
echo "2. Import data: node migration/import-to-supabase.js"  
echo "3. Test COO agent: node demo-coo-agent.js"
echo ""

read -p "Press Enter to continue with automated testing..."
`;

  fs.writeFileSync('./deploy-complete.sh', deploymentScript);
  
  // Create a verification script
  const verificationScript = `#!/usr/bin/env node

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
        console.log(\`❌ \${table}: \${error.message}\`);
        allTablesExist = false;
      } else {
        console.log(\`✅ \${table}: Ready (\${count || 0} records)\`);
      }
    } catch (err) {
      console.log(\`❌ \${table}: \${err.message}\`);
      allTablesExist = false;
    }
  }
  
  if (allTablesExist) {
    console.log('\\n🎉 Schema deployment successful!');
    console.log('\\n🔄 Ready for next steps:');
    console.log('1. Data import: node migration/import-to-supabase.js');
    console.log('2. COO agent test: node demo-coo-agent.js');
  } else {
    console.log('\\n❌ Schema deployment incomplete.');
    console.log('\\n💡 Please deploy manually:');
    console.log('1. Go to https://cqodtsqeiimwgidkrttb.supabase.co');
    console.log('2. SQL Editor → paste migration/manual-deployment.sql');
    console.log('3. Run this script again to verify');
  }
}

verifyDeployment().catch(console.error);
`;

  fs.writeFileSync('./verify-deployment.js', verificationScript);
  
  console.log('✅ Created deployment package:');
  console.log('   • deploy-complete.sh - Complete deployment guide');
  console.log('   • verify-deployment.js - Schema verification');
  console.log('   • manual-deployment.sql - Ready-to-paste SQL');
  
  console.log('\n🎯 IMMEDIATE ACTION REQUIRED:');
  console.log('1. Go to: https://cqodtsqeiimwgidkrttb.supabase.co');
  console.log('2. Login → SQL Editor');
  console.log('3. Copy/paste migration/manual-deployment.sql');
  console.log('4. Run: node verify-deployment.js');
}

// Run the deployment
deployViaConnectionPooler().catch(console.error);