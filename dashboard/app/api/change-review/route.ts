import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
)

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching change review data...')
    
    // Only fetch PENDING records (not approved or rejected)
    const { data: pendingChanges, error } = await supabase
      .from('agent_approval_queue')
      .select('*')
      .or('status.is.null,status.eq.pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`Found ${pendingChanges?.length || 0} pending changes`)

    // If no pending changes, create some mock data for testing
    if (!pendingChanges || pendingChanges.length === 0) {
      console.log('No pending changes found, creating mock data for testing...')
      
      // Create a test pending change
      const { data: newChange, error: insertError } = await supabase
        .from('agent_approval_queue')
        .insert({
          task_id: `test-task-${Date.now()}`,
          task_type: 'data_update',
          description: 'Test change request for approval workflow',
          requested_changes: {
            action: 'update_program_status',
            program_id: 'test-program-123',
            old_status: 'Active',
            new_status: 'Inactive',
            reason: 'Program ended'
          },
          status: 'pending',
          priority: 'medium'
        })
        .select()

      if (insertError) {
        console.error('Error creating test change:', insertError)
      } else {
        console.log('Created test change:', newChange)
        return NextResponse.json({
          changes: newChange || [],
          total: newChange?.length || 0,
          status: 'success'
        })
      }
    }

    return NextResponse.json({
      changes: pendingChanges || [],
      total: pendingChanges?.length || 0,
      status: 'success'
    })

  } catch (error) {
    console.error('Error fetching change review data:', error)
    return NextResponse.json(
      { error: `Failed to fetch change review data: ${error.message}` },
      { status: 500 }
    )
  }
}