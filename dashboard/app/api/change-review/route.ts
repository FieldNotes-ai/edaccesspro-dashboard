import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
)

export async function GET(request: NextRequest) {
  try {
    // Debug: Log environment variables
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'Using default')
    console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    // Fetch all approval requests (not just pending) to see if we have any data
    const { data: approvals, error } = await supabase
      .from('agent_approval_queue')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Supabase error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Found approvals:', approvals?.length || 0)

    // Transform to control tower format
    const changes = approvals?.map((approval: any) => ({
      id: approval.id,
      action: 'Agent Task Approval',
      table_name: 'agent_approval_queue',
      field_name: approval.request_details || 'Unknown Request',
      details: {
        task_id: approval.task_id,
        request_details: approval.request_details || '',
        approval_level: approval.approval_level || 'standard',
        requested_by: approval.requested_by || 'System',
        approved_by: approval.approved_by || null,
        rejection_reason: approval.rejection_reason || null,
        processed_at: approval.processed_at || null
      },
      created_at: approval.created_at,
      status: approval.status,
      approved: approval.status === 'approved',
    })) || []

    return NextResponse.json({ changes })
  } catch (error) {
    console.error('Error fetching approval requests:', error)
    return NextResponse.json(
      { error: `Failed to fetch approval requests: ${error}` },
      { status: 500 }
    )
  }
}