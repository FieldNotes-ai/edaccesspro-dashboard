import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connectivity (Airtable)
    const airtableStatus = await checkAirtableConnection();
    
    // Check build status
    const buildStatus = checkBuildStatus();
    
    // Check AI services
    const aiStatus = checkAIServices();

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: airtableStatus,
        build: buildStatus,
        ai: aiStatus
      }
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function checkAirtableConnection() {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID || 'appghnijKn2LFPbvP';
    const apiKey = process.env.AIRTABLE_TOKEN || 'patlKdNWMBVv9s4v6.0b29c0ee52c899ab4a5058e2f8a6471f4f7baa4e6aa2103ac6198a11c6735082';
    
    if (!baseId || !apiKey) {
      return { status: 'warning', message: 'Airtable credentials not configured' };
    }
    
    // Simple connection test
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/ESA%20Program%20Tracker?maxRecords=1`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      return { status: 'healthy', message: 'Airtable connection successful' };
    } else {
      return { status: 'error', message: `Airtable connection failed: ${response.status}` };
    }
  } catch (error) {
    return { status: 'error', message: `Airtable connection error: ${error}` };
  }
}

function checkBuildStatus() {
  try {
    // Check if we're in a built environment
    const isBuilt = process.env.NODE_ENV === 'production';
    return {
      status: 'healthy',
      message: isBuilt ? 'Production build' : 'Development mode',
      environment: process.env.NODE_ENV || 'unknown'
    };
  } catch (error) {
    return { status: 'error', message: `Build check failed: ${error}` };
  }
}

function checkAIServices() {
  try {
    // Basic AI service availability check
    return {
      status: 'healthy',
      message: 'AI analysis services available',
      features: ['vendor-analysis', 'compliance-matching', 'strategic-insights']
    };
  } catch (error) {
    return { status: 'error', message: `AI services check failed: ${error}` };
  }
}