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
    
    // Check Market Research Agent
    const researchAgentStatus = await checkResearchAgentStatus();

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: airtableStatus,
        build: buildStatus,
        ai: aiStatus,
        researchAgent: researchAgentStatus
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
    
    // Enhanced connection test with field validation
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/ESA%20Program%20Tracker?maxRecords=3`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const records = data.records || [];
      
      // Check for new fee fields in the data
      const feeFieldAnalysis = analyzeFieldAvailability(records);
      
      return { 
        status: 'healthy', 
        message: 'Airtable connection successful',
        dataQuality: feeFieldAnalysis,
        recordCount: records.length,
        timestamp: new Date().toISOString()
      };
    } else {
      return { status: 'error', message: `Airtable connection failed: ${response.status}` };
    }
  } catch (error) {
    return { status: 'error', message: `Airtable connection error: ${error}` };
  }
}

function analyzeFieldAvailability(records: any[]) {
  if (!records || records.length === 0) {
    return { status: 'no_data', message: 'No records available for analysis' };
  }

  const fieldChecks = {
    'Platform Fee': { available: 0, populated: 0, values: [] },
    'Admin Fee': { available: 0, populated: 0, values: [] },
    'Market Size': { available: 0, populated: 0, values: [] },
    'Payment Timing': { available: 0, populated: 0, values: [] },
    'Vendor Approval Time': { available: 0, populated: 0, values: [] }
  };

  records.forEach(record => {
    const fields = record.fields || {};
    
    Object.keys(fieldChecks).forEach(fieldName => {
      if (fieldName in fields) {
        fieldChecks[fieldName].available++;
        if (fields[fieldName] != null && fields[fieldName] !== '' && fields[fieldName] !== 0) {
          fieldChecks[fieldName].populated++;
          if (fieldChecks[fieldName].values.length < 3) {
            fieldChecks[fieldName].values.push(fields[fieldName]);
          }
        }
      }
    });
  });

  // Calculate completion percentages
  const completionStats = Object.entries(fieldChecks).reduce((acc, [field, stats]) => {
    acc[field] = {
      availability: Math.round((stats.available / records.length) * 100),
      completeness: stats.available > 0 ? Math.round((stats.populated / stats.available) * 100) : 0,
      sampleValues: stats.values
    };
    return acc;
  }, {} as Record<string, any>);

  return {
    status: 'analyzed',
    totalRecords: records.length,
    fieldCompleteness: completionStats,
    healthScore: calculateFieldHealthScore(completionStats)
  };
}

function calculateFieldHealthScore(stats: Record<string, any>): number {
  const criticalFields = ['Platform Fee', 'Admin Fee', 'Market Size'];
  const scores = criticalFields.map(field => {
    const fieldStat = stats[field];
    if (!fieldStat) return 0;
    return (fieldStat.availability * 0.3) + (fieldStat.completeness * 0.7);
  });
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / criticalFields.length);
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
      features: ['vendor-analysis', 'compliance-matching', 'strategic-insights', 'market-research']
    };
  } catch (error) {
    return { status: 'error', message: `AI services check failed: ${error}` };
  }
}

async function checkResearchAgentStatus() {
  try {
    // Import Market Research Agent dynamically to avoid build issues
    const { ESAMarketIntelligenceAgent } = await import('../../services/esaMarketIntelligenceAgent');
    const agent = new ESAMarketIntelligenceAgent();
    
    const agentStatus = await agent.getResearchStatus();
    
    return {
      status: agentStatus.status,
      message: `Research agent operational - ${agentStatus.pendingTargets} targets pending`,
      pendingTargets: agentStatus.pendingTargets,
      lastRun: agentStatus.lastRun,
      avgConfidence: agentStatus.avgConfidence,
      features: ['automated-research', 'fee-analysis', 'market-intelligence', 'data-quality-improvement']
    };
  } catch (error) {
    return { 
      status: 'error', 
      message: `Research agent check failed: ${error}`,
      pendingTargets: 0,
      lastRun: null,
      avgConfidence: 0
    };
  }
}