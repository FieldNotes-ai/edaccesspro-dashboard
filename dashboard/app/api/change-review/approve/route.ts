import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
)

export async function PATCH(request: NextRequest) {
  try {
    const { changeId } = await request.json()
    
    if (!changeId) {
      return NextResponse.json(
        { error: 'Change ID is required' },
        { status: 400 }
      )
    }
    
    // Update the approval request in Supabase
    const { data: approval, error: updateError } = await supabase
      .from('agent_approval_queue')
      .update({
        status: 'approved',
        approved_by: 'Control Tower User',
        processed_at: new Date().toISOString()
      })
      .eq('id', changeId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating approval:', updateError)
      return NextResponse.json(
        { error: `Failed to approve request: ${updateError.message}` },
        { status: 500 }
      )
    }
    
    // Update the associated task
    const { error: taskError } = await supabase
      .from('agent_tasks')
      .update({
        approval_status: 'approved',
        approved_by: 'Control Tower User',
        approved_at: new Date().toISOString(),
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', approval.task_id)
    
    if (taskError) {
      console.error('Error updating task:', taskError)
      return NextResponse.json(
        { error: `Failed to update task: ${taskError.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Change request approved successfully',
      approval: approval 
    })
  } catch (error) {
    console.error('Error approving change request:', error)
    return NextResponse.json(
      { error: 'Failed to approve change request' },
      { status: 500 }
    )
  }
}