#!/usr/bin/env node

// ESA Program Tracker Table Audit Script
// Analyzes field completeness, data quality, and usage patterns

const AIRTABLE_TOKEN = 'patlKdNWMBVv9s4v6.0b29c0ee52c899ab4a5058e2f8a6471f4f7baa4e6aa2103ac6198a11c6735082';
const AIRTABLE_BASE_ID = 'appghnijKn2LFPbvP';
const TABLE_NAME = 'ESA Program Tracker';

async function fetchAllRecords() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;
  
  let allRecords = [];
  let offset = null;
  
  do {
    const urlWithOffset = offset ? `${url}?offset=${offset}` : url;
    
    const response = await fetch(urlWithOffset, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
    
  } while (offset);
  
  return allRecords;
}

function analyzeFieldUsage(records) {
  const fieldStats = {};
  const totalRecords = records.length;
  
  // Initialize field stats
  const allFields = new Set();
  records.forEach(record => {
    Object.keys(record.fields).forEach(field => allFields.add(field));
  });
  
  allFields.forEach(field => {
    fieldStats[field] = {
      populated: 0,
      empty: 0,
      unique_values: new Set(),
      sample_values: [],
      avg_length: 0,
      total_length: 0
    };
  });
  
  // Analyze each record
  records.forEach(record => {
    allFields.forEach(field => {
      const value = record.fields[field];
      
      if (value !== undefined && value !== null && value !== '') {
        fieldStats[field].populated++;
        fieldStats[field].unique_values.add(String(value));
        
        if (fieldStats[field].sample_values.length < 3) {
          fieldStats[field].sample_values.push(String(value).substring(0, 100));
        }
        
        const length = String(value).length;
        fieldStats[field].total_length += length;
      } else {
        fieldStats[field].empty++;
      }
    });
  });
  
  // Calculate averages and percentages
  Object.keys(fieldStats).forEach(field => {
    const stats = fieldStats[field];
    stats.completeness_pct = ((stats.populated / totalRecords) * 100).toFixed(1);
    stats.unique_count = stats.unique_values.size;
    stats.avg_length = stats.populated > 0 ? (stats.total_length / stats.populated).toFixed(1) : 0;
    
    // Convert Set to array for JSON serialization
    stats.unique_values = Array.from(stats.unique_values).slice(0, 5);
  });
  
  return fieldStats;
}

function categorizeFields(fieldStats) {
  const categories = {
    core_identifiers: [],
    operational_data: [],
    vendor_specific: [],
    metadata: [],
    low_usage: [],
    redundant_or_unclear: []
  };
  
  Object.keys(fieldStats).forEach(field => {
    const stats = fieldStats[field];
    const completeness = parseFloat(stats.completeness_pct);
    
    // Core identifiers - essential for program identification
    if (['Program Name', 'State', 'Program Type', 'Program Status'].includes(field)) {
      categories.core_identifiers.push(field);
    }
    // Operational data - critical for vendor operations
    else if (['Portal Technology', 'Vendor Portal URL', 'Current Window Status', 'Annual Amount Available', 'Platform Fee', 'Admin Fee', 'Vendor Payment Method'].includes(field)) {
      categories.operational_data.push(field);
    }
    // Vendor-specific information
    else if (['Vendor Registration Info', 'Contact Info/Email', 'Eligible Products', 'Required Documents', 'Document Upload', 'Submission Method'].includes(field)) {
      categories.vendor_specific.push(field);
    }
    // Metadata and tracking
    else if (['Last Updated', 'Data Freshness Score', 'Automation Priority', 'Internal Notes'].includes(field)) {
      categories.metadata.push(field);
    }
    // Low usage fields (< 30% completion)
    else if (completeness < 30) {
      categories.low_usage.push(field);
    }
    // Potentially redundant or unclear
    else {
      categories.redundant_or_unclear.push(field);
    }
  });
  
  return categories;
}

function generateRecommendations(fieldStats, categories) {
  const recommendations = {
    fields_to_keep: [],
    fields_to_improve: [],
    fields_to_consolidate: [],
    fields_to_remove: [],
    missing_fields_to_add: []
  };
  
  // Fields to definitely keep (high usage, core functionality)
  ['Program Name', 'State', 'Program Type', 'Program Status', 'Portal Technology', 'Platform Fee', 'Admin Fee', 'Current Window Status', 'Annual Amount Available', 'Program Website'].forEach(field => {
    if (fieldStats[field]) {
      recommendations.fields_to_keep.push({
        field,
        reason: 'Core functionality',
        completeness: fieldStats[field].completeness_pct + '%'
      });
    }
  });
  
  // Fields that need improvement (important but low completion)
  Object.keys(fieldStats).forEach(field => {
    const stats = fieldStats[field];
    const completeness = parseFloat(stats.completeness_pct);
    
    if (['Vendor Portal URL', 'Contact Info/Email', 'Vendor Payment Method'].includes(field) && completeness < 70) {
      recommendations.fields_to_improve.push({
        field,
        reason: 'Important for vendors but low completion rate',
        current_completion: stats.completeness_pct + '%'
      });
    }
  });
  
  // Fields to consolidate (similar purpose)
  if (fieldStats['Program Info'] && fieldStats['Internal Notes']) {
    recommendations.fields_to_consolidate.push({
      fields: ['Program Info', 'Internal Notes'],
      reason: 'Both contain descriptive text, could be merged into single "Program Details" field',
      completion_rates: `Program Info: ${fieldStats['Program Info'].completeness_pct}%, Internal Notes: ${fieldStats['Internal Notes'].completeness_pct}%`
    });
  }
  
  // Fields to remove (very low usage, unclear purpose)
  Object.keys(fieldStats).forEach(field => {
    const stats = fieldStats[field];
    const completeness = parseFloat(stats.completeness_pct);
    
    if (completeness < 15 && !['Platform Fee', 'Admin Fee'].includes(field)) {
      recommendations.fields_to_remove.push({
        field,
        reason: `Very low usage (${stats.completeness_pct}% completion)`,
        unique_values: stats.unique_count
      });
    }
  });
  
  // Missing fields that should be added
  recommendations.missing_fields_to_add = [
    {
      field: 'Market Size',
      reason: 'Number of students/families served - critical for vendor revenue planning',
      type: 'Number'
    },
    {
      field: 'Launch Date',
      reason: 'When the program started accepting vendors - helps with market timing',
      type: 'Date'
    },
    {
      field: 'Vendor Approval Time',
      reason: 'How long vendor approval takes - critical for vendor planning',
      type: 'Text'
    },
    {
      field: 'Payment Timing',
      reason: 'When vendors get paid (immediate, 30 days, etc.) - separate from method',
      type: 'Single Select'
    }
  ];
  
  return recommendations;
}

async function main() {
  try {
    console.log('🔍 Starting ESA Program Tracker Table Audit...\n');
    
    // Fetch all records
    console.log('📥 Fetching all records...');
    const records = await fetchAllRecords();
    console.log(`✅ Fetched ${records.length} records\n`);
    
    // Analyze field usage
    console.log('📊 Analyzing field usage and completeness...');
    const fieldStats = analyzeFieldUsage(records);
    
    // Categorize fields
    const categories = categorizeFields(fieldStats);
    
    // Generate recommendations
    const recommendations = generateRecommendations(fieldStats, categories);
    
    // Print detailed analysis
    console.log('📋 FIELD COMPLETENESS ANALYSIS');
    console.log('================================');
    
    Object.keys(fieldStats).sort((a, b) => parseFloat(fieldStats[b].completeness_pct) - parseFloat(fieldStats[a].completeness_pct)).forEach(field => {
      const stats = fieldStats[field];
      console.log(`${field}:`);
      console.log(`  Completeness: ${stats.completeness_pct}% (${stats.populated}/${records.length})`);
      console.log(`  Unique values: ${stats.unique_count}`);
      console.log(`  Avg length: ${stats.avg_length} chars`);
      if (stats.sample_values.length > 0) {
        console.log(`  Sample: ${stats.sample_values[0].substring(0, 50)}${stats.sample_values[0].length > 50 ? '...' : ''}`);
      }
      console.log('');
    });
    
    console.log('\n🏷️  FIELD CATEGORIZATION');
    console.log('========================');
    Object.keys(categories).forEach(category => {
      console.log(`${category.toUpperCase()}: ${categories[category].join(', ')}`);
    });
    
    console.log('\n💡 IMPROVEMENT RECOMMENDATIONS');
    console.log('===============================');
    
    console.log('\n✅ FIELDS TO KEEP (High Value):');
    recommendations.fields_to_keep.forEach(item => {
      console.log(`  - ${item.field} (${item.completeness}) - ${item.reason}`);
    });
    
    console.log('\n🔧 FIELDS TO IMPROVE:');
    recommendations.fields_to_improve.forEach(item => {
      console.log(`  - ${item.field} (${item.current_completion}) - ${item.reason}`);
    });
    
    console.log('\n🔗 FIELDS TO CONSOLIDATE:');
    recommendations.fields_to_consolidate.forEach(item => {
      console.log(`  - ${item.fields.join(' + ')} - ${item.reason} (${item.completion_rates})`);
    });
    
    console.log('\n❌ FIELDS TO REMOVE:');
    recommendations.fields_to_remove.forEach(item => {
      console.log(`  - ${item.field} - ${item.reason} (${item.unique_values} unique values)`);
    });
    
    console.log('\n➕ MISSING FIELDS TO ADD:');
    recommendations.missing_fields_to_add.forEach(item => {
      console.log(`  - ${item.field} (${item.type}) - ${item.reason}`);
    });
    
    console.log('\n🎯 SUMMARY RECOMMENDATIONS');
    console.log('============================');
    console.log(`• Keep ${recommendations.fields_to_keep.length} core fields`);
    console.log(`• Improve data collection for ${recommendations.fields_to_improve.length} important fields`);
    console.log(`• Consolidate ${recommendations.fields_to_consolidate.length} redundant field groups`);
    console.log(`• Remove ${recommendations.fields_to_remove.length} low-value fields`);
    console.log(`• Add ${recommendations.missing_fields_to_add.length} critical missing fields`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ for fetch support');
  process.exit(1);
}

main();