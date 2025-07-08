import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    const logBaseUrl = process.env.LOG_BASE_URL
    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPOSITORY || 'your-org/esa-vendor-dashboard'
    
    // Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || !filename.endsWith('.log')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }
    
    // Try GitHub API first if token is available
    if (githubToken) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${githubRepo}/contents/data/logs/${filename}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.content) {
            // Decode base64 content
            const content = Buffer.from(data.content, 'base64').toString('utf-8')
            return new NextResponse(content, {
              headers: {
                'Content-Type': 'text/plain',
              },
            })
          }
        }
      } catch (error) {
        console.error('Error fetching from GitHub API:', error)
      }
    }
    
    // Try direct URL if LOG_BASE_URL is configured
    if (logBaseUrl) {
      try {
        const response = await fetch(`${logBaseUrl}${filename}`)
        if (response.ok) {
          const content = await response.text()
          return new NextResponse(content, {
            headers: {
              'Content-Type': 'text/plain',
            },
          })
        }
      } catch (error) {
        console.error('Error fetching from LOG_BASE_URL:', error)
      }
    }
    
    // Return mock log content for demo
    const mockContent = generateMockLogContent(filename)
    return new NextResponse(mockContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error fetching log content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch log content' },
      { status: 500 }
    )
  }
}

function generateMockLogContent(filename: string): string {
  const now = new Date()
  const entries = []
  
  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - i * 300000).toISOString() // 5 minutes apart
    
    if (filename.includes('research')) {
      entries.push(JSON.stringify({
        timestamp,
        event_type: i % 3 === 0 ? 'webhook_sent' : i % 3 === 1 ? 'field_extracted' : 'page_fetched',
        data: {
          field: 'application_deadline',
          confidence: 0.85 + Math.random() * 0.1,
          status: 200
        }
      }))
    } else if (filename.includes('airtable')) {
      entries.push(JSON.stringify({
        timestamp,
        event_type: i % 3 === 0 ? 'webhook_received' : i % 3 === 1 ? 'chunk_imported' : 'nightly_metrics',
        data: {
          completeness_percent: 85 + Math.random() * 10,
          imported: Math.floor(Math.random() * 50),
          table: 'ESA Programs'
        }
      }))
    }
  }
  
  return entries.join('\n')
}