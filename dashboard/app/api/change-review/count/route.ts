import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
)

export async function GET(request: NextRequest) {
  try {
    // Fetch count of pending approval requests from Supabase
    const { data, error } = await supabase
      .from('agent_approval_queue')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ count: 0 })
    }
    
    return NextResponse.json({ count: data?.length || 0 })
  } catch (error) {
    console.error('Error fetching approval queue count:', error)
    return NextResponse.json({ count: 0 })
  }
}