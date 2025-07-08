import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return current production and staging base IDs
    // These would typically be stored in environment variables or fetched from GitHub secrets
    
    const productionBaseId = process.env.AIRTABLE_BASE_ID || 'Unknown'
    const stagingBaseId = process.env.AIRTABLE_BASE_ID_STAGING || 'Unknown'
    
    return NextResponse.json({
      production: productionBaseId,
      staging: stagingBaseId,
      last_updated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching base IDs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch base IDs' },
      { status: 500 }
    )
  }
}