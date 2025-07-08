import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
)

export async function GET(request: NextRequest) {
  try {
    // Fetch agent execution logs from Supabase
    const { data: logs, error } = await supabase
      .from('agent_execution_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agent execution logs' },
        { status: 500 }
      )
    }

    // Transform logs to a format compatible with the control tower
    const logFiles = logs?.map((log: any) => ({
      id: log.id,
      name: `${log.agent_name}_${log.action}.log`,
      agent_name: log.agent_name,
      action: log.action,
      task_id: log.task_id,
      success: log.success,
      execution_details: log.execution_details,
      error_message: log.error_message,
      duration_ms: log.duration_ms,
      lastModified: log.created_at,
      created_at: log.created_at,
    })) || []

    return NextResponse.json({ files: logFiles })
  } catch (error) {
    console.error('Error fetching agent logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent logs' },
      { status: 500 }
    )
  }
}