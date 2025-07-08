#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// You'll need to install this: npm install @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');

const DATA_DIR = './migration/data-export';

// Configuration - update these after Supabase setup
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapping from Airtable table names to Supabase table names
const TABLE_MAPPING = {
  'API Keys': 'api_keys',
  'Client Program Access': 'client_program_access', 
  'ESA Program Tracker': 'esa_program_tracker',
  'Monitoring Logs': 'monitoring_logs',
  'Organizations': 'organizations',
  'Review Queue': 'review_queue',
  'Subscriptions': 'subscriptions',
  'Usage Analytics': 'usage_analytics',
  'User Accounts': 'user_accounts'
};

function transformFieldName(fieldName) {
  return fieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function transformRecord(airtableRecord, tableName) {
  const transformed = {
    airtable_id: airtableRecord.id,
    created_at: airtableRecord.createdTime || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Transform all fields
  Object.entries(airtableRecord.fields || {}).forEach(([fieldName, value]) => {
    const columnName = transformFieldName(fieldName);
    
    // Handle different value types
    if (value === null || value === undefined) {
      transformed[columnName] = null;
    } else if (Array.isArray(value)) {
      // PostgreSQL array format
      transformed[columnName] = value;
    } else if (typeof value === 'object' && !(value instanceof Date)) {
      // Convert objects to JSON
      transformed[columnName] = value;
    } else {
      transformed[columnName] = value;
    }
  });
  
  return transformed;
}

async function importTable(airtableTableName, supabaseTableName, records) {
  console.log(`📥 Importing ${airtableTableName} → ${supabaseTableName}...`);
  
  if (records.length === 0) {
    console.log(`   ⚠️  No records to import`);
    return { success: true, imported: 0, errors: [] };
  }
  
  const transformedRecords = records.map(record => 
    transformRecord(record, airtableTableName)
  );
  
  const batchSize = 50; // Supabase batch limit
  const errors = [];
  let imported = 0;
  
  for (let i = 0; i < transformedRecords.length; i += batchSize) {
    const batch = transformedRecords.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from(supabaseTableName)
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error(`   ❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
        errors.push({
          batch: Math.floor(i/batchSize) + 1,
          error: error.message,
          records: batch.length
        });
      } else {
        imported += batch.length;
        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records imported`);
      }
    } catch (error) {
      console.error(`   ❌ Batch ${Math.floor(i/batchSize) + 1} exception:`, error.message);
      errors.push({
        batch: Math.floor(i/batchSize) + 1,
        error: error.message,
        records: batch.length
      });
    }
  }
  
  return { 
    success: errors.length === 0, 
    imported, 
    errors,
    total: transformedRecords.length
  };
}

async function importAllData() {
  console.log('🚀 Starting Supabase data import...');
  console.log(`🎯 Supabase URL: ${SUPABASE_URL}`);
  console.log('');
  
  // Test connection
  try {
    const { data, error } = await supabase.from('esa_program_tracker').select('count').limit(1);
    if (error && !error.message.includes('row')) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const importSummary = {
    timestamp: new Date().toISOString(),
    tables: {},
    totalRecords: 0,
    totalImported: 0,
    totalErrors: 0
  };
  
  // Get all export files
  const files = fs.readdirSync(DATA_DIR).filter(f => 
    f.endsWith('.json') && f !== 'export_summary.json' && f !== 'schema_analysis.json'
  );
  
  for (const file of files) {
    try {
      const filepath = path.join(DATA_DIR, file);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      const airtableTableName = data.tableName;
      const supabaseTableName = TABLE_MAPPING[airtableTableName];
      
      if (!supabaseTableName) {
        console.log(`⚠️  Skipping ${airtableTableName} - no mapping defined`);
        continue;
      }
      
      const result = await importTable(airtableTableName, supabaseTableName, data.records);
      
      importSummary.tables[airtableTableName] = {
        supabaseTable: supabaseTableName,
        totalRecords: result.total,
        imported: result.imported,
        errors: result.errors,
        success: result.success
      };
      
      importSummary.totalRecords += result.total;
      importSummary.totalImported += result.imported;
      importSummary.totalErrors += result.errors.length;
      
      console.log(`   📊 ${airtableTableName}: ${result.imported}/${result.total} records imported`);
      if (result.errors.length > 0) {
        console.log(`   ⚠️  ${result.errors.length} batches had errors`);
      }
      console.log('');
      
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error.message);
      importSummary.totalErrors++;
    }
  }
  
  // Save import summary
  fs.writeFileSync(
    './migration/import_summary.json',
    JSON.stringify(importSummary, null, 2)
  );
  
  console.log('📊 Import Summary:');
  console.log(`   📈 ${importSummary.totalImported}/${importSummary.totalRecords} total records imported`);
  console.log(`   ✅ ${Object.values(importSummary.tables).filter(t => t.success).length} tables imported successfully`);
  console.log(`   ❌ ${importSummary.totalErrors} total errors`);
  console.log(`   📁 Summary saved to: migration/import_summary.json`);
  console.log('');
  
  if (importSummary.totalErrors === 0) {
    console.log('🎉 All data imported successfully!');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Verify data in Supabase dashboard');
    console.log('   2. Update application APIs to use Supabase');
    console.log('   3. Test all functionality');
    console.log('   4. Switch environment variables when ready');
  } else {
    console.log('⚠️  Import completed with some errors. Check the summary for details.');
  }
}

// Check if required packages are installed
try {
  require('@supabase/supabase-js');
} catch (error) {
  console.error('❌ Missing dependency: @supabase/supabase-js');
  console.error('Please run: npm install @supabase/supabase-js');
  process.exit(1);
}

// Run the import
if (SUPABASE_URL.includes('your-project-ref') || SUPABASE_SERVICE_KEY.includes('your-service-role-key')) {
  console.error('❌ Please update SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('See migration/SUPABASE_SETUP.md for setup instructions');
  process.exit(1);
}

importAllData().catch(console.error);