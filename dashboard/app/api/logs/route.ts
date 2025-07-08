import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const logBaseUrl = process.env.LOG_BASE_URL
    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPOSITORY || 'your-org/esa-vendor-dashboard'
    
    if (!logBaseUrl && !githubToken) {
      return NextResponse.json(
        { error: 'LOG_BASE_URL or GITHUB_TOKEN not configured' },
        { status: 500 }
      )
    }
    
    // If we have GitHub token, fetch from GitHub API
    if (githubToken) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${githubRepo}/contents/data/logs`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        )
        
        if (response.ok) {
          const files = await response.json()
          const logFiles = files
            .filter((file: any) => file.name.endsWith('.log'))
            .map((file: any) => ({
              name: file.name,
              size: file.size,
              lastModified: new Date().toISOString(), // GitHub doesn't provide last modified in contents API
              downloadUrl: file.download_url,
            }))
          
          return NextResponse.json({ files: logFiles })
        }
      } catch (error) {
        console.error('Error fetching from GitHub API:', error)
      }
    }
    
    // Fallback: return mock log files
    const mockFiles = [
      {
        name: 'research_agent.log',
        size: 15420,
        lastModified: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        name: 'airtable_agent.log',
        size: 8932,
        lastModified: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      },
    ]
    
    return NextResponse.json({ files: mockFiles })
  } catch (error) {
    console.error('Error fetching log files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch log files' },
      { status: 500 }
    )
  }
}