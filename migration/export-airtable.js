#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appghnijKn2LFPbvP';
const OUTPUT_DIR = './migration/data-export';

const TABLES = [
  'ESA Program Tracker',
  'Monitoring Logs', 
  'Review Queue',
  'Organizations',
  'Subscriptions',
  'User Accounts',
  'Client Program Access',
  'API Keys',
  'Usage Analytics'
];

async function fetchTableData(tableName) {
  const encodedTableName = encodeURIComponent(tableName);
  let allRecords = [];
  let offset = null;
  
  console.log(`📥 Exporting ${tableName}...`);
  
  do {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodedTableName}${offset ? `?offset=${offset}` : ''}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      allRecords = allRecords.concat(data.records || []);
      offset = data.offset;
      
      console.log(`   ${allRecords.length} records collected...`);
      
    } catch (error) {
      console.error(`❌ Error fetching ${tableName}:`, error.message);
      break;
    }
  } while (offset);
  
  return allRecords;
}

async function exportAllTables() {
  if (!AIRTABLE_TOKEN) {
    console.error('❌ AIRTABLE_TOKEN environment variable not set');
    process.exit(1);
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  console.log('🚀 Starting Airtable data export...');
  console.log(`📂 Output directory: ${OUTPUT_DIR}`);
  console.log(`🎯 Base ID: ${BASE_ID}`);
  console.log('');
  
  const exportSummary = {
    timestamp: new Date().toISOString(),
    baseId: BASE_ID,
    tables: {}
  };
  
  for (const tableName of TABLES) {
    try {
      const records = await fetchTableData(tableName);
      
      // Save raw JSON
      const filename = `${tableName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.json`;
      const filepath = path.join(OUTPUT_DIR, filename);
      
      fs.writeFileSync(filepath, JSON.stringify({
        tableName,
        recordCount: records.length,
        exportedAt: new Date().toISOString(),
        records
      }, null, 2));
      
      exportSummary.tables[tableName] = {
        recordCount: records.length,
        filename,
        exported: true
      };
      
      console.log(`✅ ${tableName}: ${records.length} records → ${filename}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Failed to export ${tableName}:`, error.message);
      exportSummary.tables[tableName] = {
        recordCount: 0,
        filename: null,
        exported: false,
        error: error.message
      };
    }
  }
  
  // Save export summary
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'export_summary.json'),
    JSON.stringify(exportSummary, null, 2)
  );
  
  console.log('');
  console.log('📊 Export Summary:');
  const totalRecords = Object.values(exportSummary.tables)
    .reduce((sum, table) => sum + table.recordCount, 0);
  const successfulTables = Object.values(exportSummary.tables)
    .filter(table => table.exported).length;
  
  console.log(`   ✅ ${successfulTables}/${TABLES.length} tables exported successfully`);
  console.log(`   📈 ${totalRecords} total records exported`);
  console.log(`   📁 Files saved to: ${OUTPUT_DIR}`);
  console.log('');
  console.log('🎉 Export complete! Your data is safely backed up.');
}

// Run the export
exportAllTables().catch(console.error);