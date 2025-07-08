import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
)

export async function PATCH(request: NextRequest) {
  try {
    const { changeId } = await request.json()
    console.log('Rejecting change ID:', changeId)

    if (!changeId) {
      return NextResponse.json(
        { error: 'Change ID is required' },
        { status: 400 }
      )
    }

    // Update the change request status to rejected
    const { data, error } = await supabase
      .from('agent_approval_queue')
      .update({ 
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: 'control_tower_user'
      })
      .eq('id', changeId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Change request not found' },
        { status: 404 }
      )
    }

    console.log('Successfully rejected change:', data[0])

    return NextResponse.json({
      success: true,
      message: 'Change request rejected successfully',
      change: data[0]
    })

  } catch (error) {
    console.error('Error rejecting change:', error)
    return NextResponse.json(
      { error: `Failed to reject change: ${error.message}` },
      { status: 500 }
    )
  }
}