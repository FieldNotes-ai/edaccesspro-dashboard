#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_DIR = './migration/data-export';

function analyzeFieldTypes(records) {
  const fieldAnalysis = {};
  
  records.forEach(record => {
    const fields = record.fields || {};
    
    Object.entries(fields).forEach(([fieldName, value]) => {
      if (!fieldAnalysis[fieldName]) {
        fieldAnalysis[fieldName] = {
          types: new Set(),
          samples: [],
          nullable: false,
          maxLength: 0
        };
      }
      
      const analysis = fieldAnalysis[fieldName];
      
      if (value === null || value === undefined || value === '') {
        analysis.nullable = true;
      } else {
        // Determine type
        if (Array.isArray(value)) {
          analysis.types.add('array');
          analysis.samples.push(`[${value.length} items]`);
        } else if (typeof value === 'string') {
          analysis.types.add('text');
          analysis.maxLength = Math.max(analysis.maxLength, value.length);
          if (analysis.samples.length < 3) {
            analysis.samples.push(value.substring(0, 50));
          }
        } else if (typeof value === 'number') {
          analysis.types.add('number');
          if (analysis.samples.length < 3) {
            analysis.samples.push(value);
          }
        } else if (typeof value === 'boolean') {
          analysis.types.add('boolean');
          if (analysis.samples.length < 3) {
            analysis.samples.push(value);
          }
        } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
          analysis.types.add('timestamp');
          if (analysis.samples.length < 3) {
            analysis.samples.push(value);
          }
        } else {
          analysis.types.add('json');
          if (analysis.samples.length < 3) {
            analysis.samples.push(JSON.stringify(value).substring(0, 50));
          }
        }
      }
    });
  });
  
  // Convert Sets to Arrays for JSON serialization
  Object.values(fieldAnalysis).forEach(analysis => {
    analysis.types = Array.from(analysis.types);
  });
  
  return fieldAnalysis;
}

function generatePostgreSQLType(analysis) {
  const { types, maxLength, nullable } = analysis;
  
  if (types.includes('array')) {
    return 'TEXT[]';
  } else if (types.includes('json')) {
    return 'JSONB';
  } else if (types.includes('timestamp')) {
    return 'TIMESTAMPTZ';
  } else if (types.includes('boolean')) {
    return 'BOOLEAN';
  } else if (types.includes('number')) {
    // Check if it might be an integer or decimal
    const hasDecimals = analysis.samples.some(sample => 
      typeof sample === 'number' && !Number.isInteger(sample)
    );
    return hasDecimals ? 'DECIMAL' : 'BIGINT';
  } else if (types.includes('text')) {
    if (maxLength > 255) {
      return 'TEXT';
    } else {
      return `VARCHAR(${Math.max(255, maxLength * 2)})`;
    }
  } else {
    return 'TEXT';
  }
}

function generateCreateTableSQL(tableName, fieldAnalysis) {
  const columns = [];
  
  // Add primary key
  columns.push('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
  columns.push('airtable_id VARCHAR(255) UNIQUE NOT NULL');
  
  // Add other fields
  Object.entries(fieldAnalysis).forEach(([fieldName, analysis]) => {
    const columnName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dataType = generatePostgreSQLType(analysis);
    const nullable = analysis.nullable ? '' : ' NOT NULL';
    
    columns.push(`${columnName} ${dataType}${nullable}`);
  });
  
  // Add metadata
  columns.push('created_at TIMESTAMPTZ DEFAULT NOW()');
  columns.push('updated_at TIMESTAMPTZ DEFAULT NOW()');
  
  const sql = `
-- Table: ${tableName}
CREATE TABLE ${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')} (
  ${columns.join(',\n  ')}
);

-- Create indexes
CREATE INDEX idx_${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_airtable_id ON ${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')} (airtable_id);
CREATE INDEX idx_${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_created_at ON ${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')} (created_at);
`;
  
  return sql;
}

async function analyzeAllTables() {
  console.log('🔍 Analyzing Airtable data structure...\n');
  
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && f !== 'export_summary.json');
  const schemaAnalysis = {};
  let fullSQL = `-- Generated PostgreSQL Schema from Airtable Export
-- Generated at: ${new Date().toISOString()}

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`;
  
  for (const file of files) {
    const filepath = path.join(DATA_DIR, file);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    console.log(`📋 Analyzing ${data.tableName} (${data.recordCount} records)...`);
    
    const fieldAnalysis = analyzeFieldTypes(data.records);
    schemaAnalysis[data.tableName] = {
      recordCount: data.recordCount,
      fields: fieldAnalysis
    };
    
    // Generate SQL
    fullSQL += generateCreateTableSQL(data.tableName, fieldAnalysis);
    fullSQL += '\n';
    
    // Show field summary
    const fieldCount = Object.keys(fieldAnalysis).length;
    console.log(`   📊 ${fieldCount} fields analyzed`);
    
    // Show a few interesting fields
    const interestingFields = Object.entries(fieldAnalysis)
      .slice(0, 3)
      .map(([name, analysis]) => `${name} (${analysis.types.join('|')})`);
    console.log(`   🔗 Key fields: ${interestingFields.join(', ')}`);
    console.log('');
  }
  
  // Save analysis
  fs.writeFileSync(
    path.join(DATA_DIR, 'schema_analysis.json'),
    JSON.stringify(schemaAnalysis, null, 2)
  );
  
  // Save SQL schema
  fs.writeFileSync(
    './migration/supabase_schema.sql',
    fullSQL
  );
  
  console.log('✅ Schema analysis complete!');
  console.log(`📄 Schema SQL saved to: migration/supabase_schema.sql`);
  console.log(`📊 Detailed analysis saved to: ${DATA_DIR}/schema_analysis.json`);
}

analyzeAllTables().catch(console.error);