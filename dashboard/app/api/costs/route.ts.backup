import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const googleCostCsv = process.env.GOOGLE_COST_CSV_URL
    
    // Mock cost data if Google Sheets URL not configured
    if (!googleCostCsv) {
      const mockCosts = generateMockCostData()
      const mockSummary = generateMockSummary()
      
      return NextResponse.json({
        costs: mockCosts,
        summary: mockSummary,
      })
    }
    
    // Fetch from Google Sheets CSV
    try {
      const response = await fetch(googleCostCsv, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cost data: ${response.statusText}`)
      }
      
      const csvText = await response.text()
      const costs = parseCostCsv(csvText)
      const summary = calculateSummary(costs)
      
      return NextResponse.json({
        costs,
        summary,
      })
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error)
      
      // Fallback to mock data
      const mockCosts = generateMockCostData()
      const mockSummary = generateMockSummary()
      
      return NextResponse.json({
        costs: mockCosts,
        summary: mockSummary,
      })
    }
  } catch (error) {
    console.error('Error fetching cost data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost data' },
      { status: 500 }
    )
  }
}

function parseCostCsv(csvText: string) {
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',')
  
  return lines.slice(1).map(line => {
    const values = line.split(',')
    return {
      date: values[0],
      airtable_api_calls: parseInt(values[1]) || 0,
      claude_api_calls: parseInt(values[2]) || 0,
      github_actions_minutes: parseInt(values[3]) || 0,
      cloudflare_requests: parseInt(values[4]) || 0,
      estimated_total_cost: parseFloat(values[5]) || 0,
    }
  })
}

function calculateSummary(costs: any[]) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  const currentMonthData = costs.filter(cost => {
    const date = new Date(cost.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  
  const previousMonthData = costs.filter(cost => {
    const date = new Date(cost.date)
    return date.getMonth() === previousMonth && date.getFullYear() === previousYear
  })
  
  const sumField = (data: any[], field: string) => 
    data.reduce((sum, item) => sum + (item[field] || 0), 0)
  
  return {
    current_month: {
      airtable_calls: sumField(currentMonthData, 'airtable_api_calls'),
      claude_calls: sumField(currentMonthData, 'claude_api_calls'),
      github_minutes: sumField(currentMonthData, 'github_actions_minutes'),
      total_cost: sumField(currentMonthData, 'estimated_total_cost'),
    },
    previous_month: {
      airtable_calls: sumField(previousMonthData, 'airtable_api_calls'),
      claude_calls: sumField(previousMonthData, 'claude_api_calls'),
      github_minutes: sumField(previousMonthData, 'github_actions_minutes'),
      total_cost: sumField(previousMonthData, 'estimated_total_cost'),
    },
    free_tier_limits: {
      airtable_calls: 1000,
      github_minutes: 2000,
    },
  }
}

function generateMockCostData() {
  const costs = []
  const now = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    costs.push({
      date: date.toISOString().split('T')[0],
      airtable_api_calls: Math.floor(Math.random() * 50) + 10,
      claude_api_calls: Math.floor(Math.random() * 20) + 5,
      github_actions_minutes: Math.floor(Math.random() * 30) + 5,
      cloudflare_requests: Math.floor(Math.random() * 100) + 20,
      estimated_total_cost: Math.random() * 2 + 0.5,
    })
  }
  
  return costs
}

function generateMockSummary() {
  return {
    current_month: {
      airtable_calls: 850,
      claude_calls: 320,
      github_minutes: 450,
      total_cost: 15.75,
    },
    previous_month: {
      airtable_calls: 720,
      claude_calls: 280,
      github_minutes: 380,
      total_cost: 12.50,
    },
    free_tier_limits: {
      airtable_calls: 1000,
      github_minutes: 2000,
    },
  }
}