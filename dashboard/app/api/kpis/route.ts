import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
)

export async function GET(request: NextRequest) {
  try {
    // Calculate KPIs from Supabase data
    const { data: programs, error } = await supabase
      .from('esa_program_tracker')
      .select('*')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Failed to fetch program data: ${error.message}` },
        { status: 500 }
      )
    }

    // Calculate data completeness (percentage of programs with all required fields)
    const totalPrograms = programs?.length || 0
    const requiredFields = ['program_name', 'state', 'program_type', 'program_status']
    
    const completePrograms = programs?.filter(program => 
      requiredFields.every(field => program[field] && program[field] !== '')
    ).length || 0

    const completeness_pct = totalPrograms > 0 ? (completePrograms / totalPrograms) * 100 : 0

    // Calculate conflict rate (programs with conflicting data)
    const conflictPrograms = programs?.filter(program => 
      program.program_status === 'Active' && program.current_window_status === 'Closed'
    ).length || 0

    const conflict_pct = totalPrograms > 0 ? (conflictPrograms / totalPrograms) * 100 : 0

    // Calculate mean latency based on agent execution logs
    const { data: logs } = await supabase
      .from('agent_execution_log')
      .select('duration_ms')
      .not('duration_ms', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(50)

    const avgDuration = logs?.length > 0 
      ? logs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / logs.length
      : 0

    const mean_latency_min = avgDuration / (1000 * 60) // Convert to minutes

    const kpis = [{
      date: new Date().toISOString().split('T')[0],
      completeness_pct,
      conflict_pct,
      mean_latency_min,
    }]
    
    return NextResponse.json({ kpis })
  } catch (error) {
    console.error('Error calculating KPI data:', error)
    return NextResponse.json(
      { error: 'Failed to calculate KPI data' },
      { status: 500 }
    )
  }
}