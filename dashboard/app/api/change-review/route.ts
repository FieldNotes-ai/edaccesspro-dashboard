import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const airtableKey = process.env.AIRTABLE_API_KEY
    const airtableBase = process.env.AIRTABLE_BASE_ID
    
    if (!airtableKey || !airtableBase) {
      return NextResponse.json(
        { error: 'Airtable credentials not configured' },
        { status: 500 }
      )
    }
    
    // Fetch pending change requests from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${airtableBase}/Review%20Queue?filterByFormula={Status}="Pending Review"`,
      {
        headers: {
          'Authorization': `Bearer ${airtableKey}`,
        },
      }
    )
    
    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Transform Airtable records to our format
    const changes = data.records?.map((record: any) => ({
      id: record.id,
      action: 'Program Discovery',
      table_name: 'Review Queue',
      field_name: record.fields['Program Name'] || null,
      details: {
        program_name: record.fields['Program Name'] || 'Unknown',
        state: record.fields['State'] || 'Unknown',
        source_url: record.fields['Source URL'] || '',
        discovery_source: record.fields['Discovery Source'] || 'Unknown',
        confidence_score: record.fields['AI Confidence Score'] || 0,
        program_details: record.fields['Program Details'] || '',
        reviewer_notes: record.fields['Reviewer Notes'] || ''
      },
      created_at: record.fields['Date Discovered'] || record.createdTime,
      status: record.fields['Status'] || 'Pending Review',
      approved: false,
    })) || []
    
    return NextResponse.json({ changes })
  } catch (error) {
    console.error('Error fetching change requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch change requests' },
      { status: 500 }
    )
  }
}