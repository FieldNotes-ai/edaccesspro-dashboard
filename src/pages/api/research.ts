import { NextApiRequest, NextApiResponse } from 'next';
import { ESAMarketIntelligenceAgent } from '../../services/esaMarketIntelligenceAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  try {
    const agent = new ESAMarketIntelligenceAgent();

    switch (method) {
      case 'GET':
        const { action } = query;

        switch (action) {
          case 'status':
            // Get research agent status for monitoring
            const status = await agent.getResearchStatus();
            return res.status(200).json({
              success: true,
              status,
              timestamp: new Date().toISOString()
            });

          case 'targets':
            // Get current research targets (programs needing data)
            const targets = await (agent as any).identifyResearchTargets();
            const prioritized = (agent as any).prioritizeResearchTargets(targets);
            
            return res.status(200).json({
              success: true,
              totalTargets: targets.length,
              prioritizedTargets: prioritized.slice(0, 10), // Top 10
              nextCycleTargets: prioritized.slice(0, 5).map(t => ({
                name: t.name,
                state: t.state,
                priority: (agent as any).calculateResearchPriority(t),
                dataGaps: Object.keys(t.currentData).filter(key => 
                  !t.currentData[key] || t.currentData[key] === 0
                )
              }))
            });

          default:
            return res.status(400).json({ 
              success: false, 
              error: 'Invalid action. Use: status, targets' 
            });
        }

      case 'POST':
        const { action: postAction } = req.body;

        switch (postAction) {
          case 'execute-research':
            // Execute a full research cycle
            console.log('🚀 Starting manual research cycle via API...');
            
            const researchResults = await agent.executeResearchCycle();
            
            return res.status(200).json({
              success: researchResults.success,
              message: researchResults.success ? 
                'Research cycle completed successfully' : 
                'Research cycle completed with errors',
              results: {
                programsResearched: researchResults.researchResults.length,
                qualityImprovement: researchResults.qualityImprovements,
                avgConfidence: researchResults.researchResults.length > 0 ?
                  researchResults.researchResults.reduce((sum, r) => sum + r.confidence, 0) / researchResults.researchResults.length :
                  0,
                researchSummary: researchResults.researchResults.map(r => ({
                  program: r.programName,
                  confidence: Math.round(r.confidence * 100),
                  fieldsResearched: Object.keys(r.findings).length,
                  dataQuality: Object.values(r.findings).every((f: any) => f.confidence >= 0.6) ? 'high' : 'medium'
                }))
              },
              error: researchResults.error,
              timestamp: new Date().toISOString()
            });

          case 'research-program':
            // Research a specific program by ID
            const { programId } = req.body;
            
            if (!programId) {
              return res.status(400).json({
                success: false,
                error: 'Program ID required for targeted research'
              });
            }

            // This would need to be implemented - research a single program
            return res.status(501).json({
              success: false,
              error: 'Single program research not yet implemented'
            });

          default:
            return res.status(400).json({
              success: false,
              error: 'Invalid action. Use: execute-research, research-program'
            });
        }

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed. Use GET or POST'
        });
    }

  } catch (error) {
    console.error('Research API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// Export configuration for larger payloads and longer timeouts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
  // Increase timeout for research operations
  maxDuration: 300, // 5 minutes for research cycles
};