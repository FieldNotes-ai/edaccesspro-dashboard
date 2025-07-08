#!/usr/bin/env node

// Script to populate Platform Fee and Admin Fee fields in Airtable
// Based on analysis of Vendor Payment Method and Vendor Insights fields

const AIRTABLE_TOKEN = 'patlKdNWMBVv9s4v6.0b29c0ee52c899ab4a5058e2f8a6471f4f7baa4e6aa2103ac6198a11c6735082';
const AIRTABLE_BASE_ID = 'appghnijKn2LFPbvP';
const TABLE_NAME = 'ESA Program Tracker';

// Extract platform transaction fees from payment method descriptions
function extractPlatformFee(paymentMethod) {
  if (!paymentMethod) return 0;
  
  const lowerMethod = paymentMethod.toLowerCase();
  
  // ClassWallet fees
  if (lowerMethod.includes('classwallet') && lowerMethod.includes('2.5%')) return 2.5;
  if (lowerMethod.includes('classwallet') && lowerMethod.includes('2.0%')) return 2.0;
  if (lowerMethod.includes('classwallet') && lowerMethod.includes('~2.5%')) return 2.5;
  
  // General transaction fee patterns
  if (lowerMethod.includes('2.5% transaction fee')) return 2.5;
  if (lowerMethod.includes('2.0% transaction fee')) return 2.0;
  
  // Odyssey and other closed marketplaces typically have no fees
  if (lowerMethod.includes('odyssey') || lowerMethod.includes('closed marketplace')) return 0;
  
  // Reimbursement systems typically have no transaction fees
  if (lowerMethod.includes('reimbursement')) return 0;
  
  return 0;
}

// Extract administrative fees from payment method and vendor insights
function extractAdminFee(paymentMethod, vendorInsights) {
  if (!paymentMethod && !vendorInsights) return 0;
  
  const combinedText = `${paymentMethod || ''} ${vendorInsights || ''}`.toLowerCase();
  
  // Arkansas specific admin withholding
  if (combinedText.includes('5% admin withholding')) return 5.0;
  if (combinedText.includes('up to 5% admin')) return 5.0;
  
  // Other admin fees pattern matching
  if (combinedText.includes('admin fee')) {
    const match = combinedText.match(/(\d+(?:\.\d+)?)%\s*admin/);
    if (match) return parseFloat(match[1]);
  }
  
  return 0;
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
    
    console.log(`Fetched ${data.records.length} records (total: ${allRecords.length})`);
    
  } while (offset);
  
  return allRecords;
}

async function updateRecord(recordId, platformFee, adminFee) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        'Platform Fee': platformFee,
        'Admin Fee': adminFee
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update record ${recordId}: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function main() {
  try {
    console.log('🚀 Starting fee extraction and update process...');
    
    // Fetch all records
    console.log('📥 Fetching all records from Airtable...');
    const records = await fetchAllRecords();
    console.log(`✅ Fetched ${records.length} total records`);
    
    // Process each record
    let updatedCount = 0;
    let errors = [];
    
    for (const record of records) {
      const programName = record.fields['Program Name'] || 'Unknown';
      const paymentMethod = record.fields['Vendor Payment Method'] || '';
      const vendorInsights = record.fields['Vendor Insights'] || '';
      
      // Extract fees
      const platformFee = extractPlatformFee(paymentMethod);
      const adminFee = extractAdminFee(paymentMethod, vendorInsights);
      
      console.log(`Processing: ${programName}`);
      console.log(`  Platform Fee: ${platformFee}%`);
      console.log(`  Admin Fee: ${adminFee}%`);
      
      try {
        await updateRecord(record.id, platformFee, adminFee);
        updatedCount++;
        console.log(`  ✅ Updated successfully`);
        
        // Rate limiting - wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`  ❌ Update failed: ${error.message}`);
        errors.push({ recordId: record.id, programName, error: error.message });
      }
    }
    
    console.log('\n🎉 Fee extraction and update complete!');
    console.log(`✅ Successfully updated: ${updatedCount} records`);
    console.log(`❌ Failed updates: ${errors.length} records`);
    
    if (errors.length > 0) {
      console.log('\nFailed updates:');
      errors.forEach(err => {
        console.log(`  - ${err.programName} (${err.recordId}): ${err.error}`);
      });
    }
    
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