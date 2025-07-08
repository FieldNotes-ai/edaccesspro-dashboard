import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
)

export async function GET(request: NextRequest) {
  try {
    // Get agent task statistics from Supabase
    const { data: tasks, error } = await supabase
      .from('agent_tasks')
      .select('assigned_agent, status, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Failed to fetch agent tasks: ${error.message}` },
        { status: 500 }
      )
    }

    // Group tasks by agent and get their latest status
    const agentMap = new Map()
    
    tasks?.forEach(task => {
      const agent = task.assigned_agent
      if (!agentMap.has(agent) || new Date(task.updated_at) > new Date(agentMap.get(agent).lastRun)) {
        agentMap.set(agent, {
          name: agent.replace('_', ' '),
          status: task.status === 'completed' ? 'success' : 
                 task.status === 'failed' ? 'failure' : 
                 task.status === 'in_progress' ? 'in_progress' : 'unknown',
          lastRun: new Date(task.updated_at).toLocaleString(),
        })
      }
    })

    // Add COO Orchestrator status
    const cooStatus = {
      name: 'COO Orchestrator',
      status: 'success',
      lastRun: new Date().toLocaleString(),
    }

    const workflows = [cooStatus, ...Array.from(agentMap.values())]
    
    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('Error fetching agent workflow status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent workflow status' },
      { status: 500 }
    )
  }
}