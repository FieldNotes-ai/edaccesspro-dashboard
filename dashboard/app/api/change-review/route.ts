import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
)

export async function GET(request: NextRequest) {
  try {
    // Fetch pending approval requests from Supabase
    const { data: approvals, error } = await supabase
      .from('agent_approval_queue')
      .select(`
        *,
        agent_tasks (
          task_name,
          description,
          assigned_agent,
          priority,
          task_type
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch approval requests' },
        { status: 500 }
      )
    }

    // Transform to control tower format
    const changes = approvals?.map((approval: any) => ({
      id: approval.id,
      action: 'Agent Task Approval',
      table_name: 'agent_approval_queue',
      field_name: approval.agent_tasks?.task_name || 'Unknown Task',
      details: {
        task_name: approval.agent_tasks?.task_name || 'Unknown',
        description: approval.agent_tasks?.description || '',
        assigned_agent: approval.agent_tasks?.assigned_agent || 'Unknown',
        priority: approval.agent_tasks?.priority || 'medium',
        task_type: approval.agent_tasks?.task_type || 'unknown',
        request_details: approval.request_details || '',
        approval_level: approval.approval_level || 'standard',
        requested_by: approval.requested_by || 'System'
      },
      created_at: approval.created_at,
      status: approval.status,
      approved: false,
    })) || []

    return NextResponse.json({ changes })
  } catch (error) {
    console.error('Error fetching approval requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approval requests' },
      { status: 500 }
    )
  }
}