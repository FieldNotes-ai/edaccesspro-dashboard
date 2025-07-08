#!/usr/bin/env node

// Script to populate new Market Size, Payment Timing, and Vendor Approval Time fields
// Based on analysis of existing data and known market information

const AIRTABLE_TOKEN = 'patlKdNWMBVv9s4v6.0b29c0ee52c899ab4a5058e2f8a6471f4f7baa4e6aa2103ac6198a11c6735082';
const AIRTABLE_BASE_ID = 'appghnijKn2LFPbvP';
const TABLE_NAME = 'ESA Program Tracker';

// Known market sizes from research and dashboard data
const MARKET_SIZES = {
  'Florida': 429585, // FES-EO: 307,609 + FES-UA: 122,051
  'Arizona': 83704,
  'Iowa': 18000,
  'Tennessee': 2088,
  'Indiana': 862,
  'Mississippi': 345,
  'Utah': 10000,
  'Louisiana': 2000,
  'Georgia': 3000,
  'Alabama': 1000,
  'South Carolina': 5000,
  'North Carolina': 3000,
  'Wyoming': 1500,
  'Montana': 500,
  'Alaska': 300,
  'Idaho': 1200,
  'West Virginia': 8000,
  'Arkansas': 4000,
  'Missouri': 6000,
  'New Hampshire': 1500,
  'Ohio': 5000,
  'Kansas': 1000,
  'Pennsylvania': 2000,
  'Wisconsin': 3000,
  'Texas': 0, // Pending launch
  'Virginia': 2500,
  'Minnesota': 1500
};

// Extract payment timing from payment method descriptions
function extractPaymentTiming(paymentMethod, vendorInsights, programInfo) {
  if (!paymentMethod) return 'Unknown';
  
  const combinedText = `${paymentMethod} ${vendorInsights || ''} ${programInfo || ''}`.toLowerCase();
  
  // Immediate payment patterns
  if (combinedText.includes('2-10 business days') || 
      combinedText.includes('2-10 days') ||
      combinedText.includes('acch within')) {
    return '5-10 days';
  }
  
  // Quarterly patterns
  if (combinedText.includes('quarterly') || 
      combinedText.includes('quarterly payments') ||
      combinedText.includes('quarterly disbursements')) {
    return 'Quarterly';
  }
  
  // Monthly patterns
  if (combinedText.includes('monthly') && !combinedText.includes('quarterly')) {
    return '30 days';
  }
  
  // Reimbursement patterns
  if (combinedText.includes('reimbursement') && 
      !combinedText.includes('no reimbursement')) {
    return 'Reimbursement only';
  }
  
  // ClassWallet typically 5-10 days
  if (combinedText.includes('classwallet')) {
    return '5-10 days';
  }
  
  // Odyssey typically immediate
  if (combinedText.includes('odyssey')) {
    return 'Immediate';
  }
  
  return 'Unknown';
}

// Extract vendor approval time from vendor insights and program info
function extractVendorApprovalTime(vendorInsights, programInfo, vendorRegistrationInfo) {
  if (!vendorInsights && !programInfo && !vendorRegistrationInfo) return 'Unknown';
  
  const combinedText = `${vendorInsights || ''} ${programInfo || ''} ${vendorRegistrationInfo || ''}`.toLowerCase();
  
  // Look for specific timeframes
  if (combinedText.includes('14 days') || combinedText.includes('within 14 days')) {
    return '1-2 weeks';
  }
  
  if (combinedText.includes('1-3 days') || combinedText.includes('within 3 days')) {
    return '1-3 days';
  }
  
  if (combinedText.includes('2 weeks') || combinedText.includes('within 2 weeks')) {
    return '1-2 weeks';
  }
  
  if (combinedText.includes('4 weeks') || combinedText.includes('within 4 weeks')) {
    return '2-4 weeks';
  }
  
  if (combinedText.includes('1 month') || combinedText.includes('within a month')) {
    return '2-4 weeks';
  }
  
  if (combinedText.includes('2 months') || combinedText.includes('2-3 months')) {
    return '1-2 months';
  }
  
  // Default patterns by portal type
  if (combinedText.includes('classwallet')) {
    return '1-2 weeks'; // Typical ClassWallet approval time
  }
  
  if (combinedText.includes('odyssey')) {
    return '2-4 weeks'; // Typical Odyssey approval time
  }
  
  if (combinedText.includes('n/a') || combinedText.includes('not applicable')) {
    return 'Unknown';
  }
  
  return 'Unknown';
}

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

async function updateRecord(recordId, updates) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: updates
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update record ${recordId}: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function main() {
  try {
    console.log('🚀 Starting new field population process...');
    
    // Fetch all records
    console.log('📥 Fetching all records from Airtable...');
    const records = await fetchAllRecords();
    console.log(`✅ Fetched ${records.length} total records`);
    
    // Process each record
    let updatedCount = 0;
    let errors = [];
    
    for (const record of records) {
      const programName = record.fields['Program Name'] || 'Unknown';
      const state = record.fields['State'] || '';
      const paymentMethod = record.fields['Vendor Payment Method'] || '';
      const vendorInsights = record.fields['Vendor Insights'] || '';
      const programInfo = record.fields['Program Info'] || '';
      const vendorRegistrationInfo = record.fields['Vendor Registration Info'] || '';
      
      // Calculate new field values
      const marketSize = MARKET_SIZES[state] || 1000; // Default to 1000 if unknown
      const paymentTiming = extractPaymentTiming(paymentMethod, vendorInsights, programInfo);
      const vendorApprovalTime = extractVendorApprovalTime(vendorInsights, programInfo, vendorRegistrationInfo);
      
      console.log(`Processing: ${programName} (${state})`);
      console.log(`  Market Size: ${marketSize.toLocaleString()}`);
      console.log(`  Payment Timing: ${paymentTiming}`);
      console.log(`  Vendor Approval Time: ${vendorApprovalTime}`);
      
      const updates = {
        'Market Size': marketSize,
        'Payment Timing': paymentTiming,
        'Vendor Approval Time': vendorApprovalTime
      };
      
      try {
        await updateRecord(record.id, updates);
        updatedCount++;
        console.log(`  ✅ Updated successfully`);
        
        // Rate limiting - wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`  ❌ Update failed: ${error.message}`);
        errors.push({ recordId: record.id, programName, error: error.message });
      }
    }
    
    console.log('\n🎉 New field population complete!');
    console.log(`✅ Successfully updated: ${updatedCount} records`);
    console.log(`❌ Failed updates: ${errors.length} records`);
    
    if (errors.length > 0) {
      console.log('\nFailed updates:');
      errors.forEach(err => {
        console.log(`  - ${err.programName} (${err.recordId}): ${err.error}`);
      });
    }
    
    // Summary statistics
    console.log('\n📊 Data Summary:');
    console.log(`States with market data: ${Object.keys(MARKET_SIZES).length}`);
    console.log(`Total market size: ${Object.values(MARKET_SIZES).reduce((a, b) => a + b, 0).toLocaleString()} students`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ for fetch support');
  process.exit(1);
}

main();