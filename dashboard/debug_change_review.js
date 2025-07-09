// Test the change review API endpoints
console.log('🔍 Testing Change Review APIs...');

async function testChangeReviewAPI() {
  const baseUrl = 'https://edaccesspro-control-tower-6vya44tol-field-notes-projects.vercel.app';
  
  try {
    // Test fetching change requests
    console.log('1. Testing GET /api/change-review...');
    const response = await fetch(`${baseUrl}/api/change-review`);
    const data = await response.json();
    console.log('✅ Change review data:', data);
    
    if (data.changes && data.changes.length > 0) {
      const firstChange = data.changes[0];
      console.log(`\n2. Testing PATCH /api/change-review/approve with ID: ${firstChange.id}`);
      
      // Test approve
      const approveResponse = await fetch(`${baseUrl}/api/change-review/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeId: firstChange.id })
      });
      
      const approveResult = await approveResponse.json();
      console.log('Approve response:', approveResult);
    } else {
      console.log('ℹ️ No pending changes to test with');
    }
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error);
  }
}

testChangeReviewAPI();
