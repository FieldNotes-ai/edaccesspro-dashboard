import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPOSITORY || 'your-org/esa-vendor-dashboard'
    
    if (!githubToken) {
      return NextResponse.json(
        { error: 'GITHUB_TOKEN not configured' },
        { status: 500 }
      )
    }
    
    const workflows = ['research_agent.yml', 'airtable_agent.yml', 'ci.yml', 'watch_logs.yml']
    const workflowStatuses = []
    
    for (const workflow of workflows) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${githubRepo}/actions/workflows/${workflow}/runs?per_page=1`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          const runs = data.workflow_runs || []
          
          if (runs.length > 0) {
            const latestRun = runs[0]
            workflowStatuses.push({
              name: workflow.replace('.yml', '').replace('_', ' '),
              status: latestRun.status === 'completed' ? latestRun.conclusion : latestRun.status,
              lastRun: new Date(latestRun.created_at).toLocaleString(),
              conclusion: latestRun.conclusion,
            })
          } else {
            workflowStatuses.push({
              name: workflow.replace('.yml', '').replace('_', ' '),
              status: 'unknown',
              lastRun: 'Never',
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching workflow ${workflow}:`, error)
        workflowStatuses.push({
          name: workflow.replace('.yml', '').replace('_', ' '),
          status: 'unknown',
          lastRun: 'Error',
        })
      }
    }
    
    return NextResponse.json({ workflows: workflowStatuses })
  } catch (error) {
    console.error('Error fetching workflow status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow status' },
      { status: 500 }
    )
  }
}