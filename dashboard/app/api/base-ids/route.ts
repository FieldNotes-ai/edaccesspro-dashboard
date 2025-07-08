import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return current Supabase project information
    const supabaseUrl = process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co'
    const projectId = supabaseUrl.split('//')[1].split('.')[0]
    
    return NextResponse.json({
      production: `Supabase: ${projectId}`,
      staging: `Supabase: ${projectId} (same instance)`,
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