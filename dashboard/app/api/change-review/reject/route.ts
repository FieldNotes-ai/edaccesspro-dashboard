import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const { changeId } = await request.json()
    
    if (!changeId) {
      return NextResponse.json(
        { error: 'Change ID is required' },
        { status: 400 }
      )
    }
    
    const airtableKey = process.env.AIRTABLE_API_KEY
    const airtableBase = process.env.AIRTABLE_BASE_ID
    
    if (!airtableKey || !airtableBase) {
      return NextResponse.json(
        { error: 'Airtable credentials not configured' },
        { status: 500 }
      )
    }
    
    // Update the record in Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${airtableBase}/Change%20Review/${changeId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${airtableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Approved': false,
            'Status': 'Rejected',
            'Rejected At': new Date().toISOString(),
          },
        }),
      }
    )
    
    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Change request rejected',
      record: data 
    })
  } catch (error) {
    console.error('Error rejecting change request:', error)
    return NextResponse.json(
      { error: 'Failed to reject change request' },
      { status: 500 }
    )
  }
}