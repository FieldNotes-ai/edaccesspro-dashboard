import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const airtableKey = process.env.AIRTABLE_API_KEY
    const airtableBase = process.env.AIRTABLE_BASE_ID
    
    if (!airtableKey || !airtableBase) {
      return NextResponse.json({ count: 0 })
    }
    
    // Fetch count of pending change requests from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${airtableBase}/Change%20Review?filterByFormula=AND({Status}="Pending Review",{Approved}=FALSE())&fields[]=Status`,
      {
        headers: {
          'Authorization': `Bearer ${airtableKey}`,
        },
      }
    )
    
    if (!response.ok) {
      console.error('Failed to fetch change review count:', response.statusText)
      return NextResponse.json({ count: 0 })
    }
    
    const data = await response.json()
    const count = data.records?.length || 0
    
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching change review count:', error)
    return NextResponse.json({ count: 0 })
  }
}