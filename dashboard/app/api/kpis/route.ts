import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const kpiCsvUrl = process.env.KPI_CSV_URL
    
    if (!kpiCsvUrl) {
      return NextResponse.json(
        { error: 'KPI_CSV_URL not configured' },
        { status: 500 }
      )
    }
    
    // Fetch KPI CSV from GitHub raw URL
    const response = await fetch(kpiCsvUrl, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch KPI data: ${response.statusText}`)
    }
    
    const csvText = await response.text()
    
    // Parse CSV
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',')
    
    const kpis = lines.slice(1).map(line => {
      const values = line.split(',')
      return {
        date: values[0],
        completeness_pct: parseFloat(values[1]) || 0,
        conflict_pct: parseFloat(values[2]) || 0,
        mean_latency_min: parseFloat(values[3]) || 0,
      }
    })
    
    return NextResponse.json({ kpis })
  } catch (error) {
    console.error('Error fetching KPI data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    )
  }
}