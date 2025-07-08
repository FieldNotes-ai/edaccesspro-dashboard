import { NextApiRequest, NextApiResponse } from 'next';
import { ESAMarketIntelligenceAgent } from '../../../services/esaMarketIntelligenceAgent';

interface SchedulerConfig {
  enabled: boolean;
  interval: 'hourly' | 'daily' | 'weekly';
  time?: string; // HH:MM format for daily/weekly
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  qualityThreshold?: number; // Trigger if quality drops below this
  lastRun?: string;
  nextRun?: string;
}

interface SchedulerStatus {
  isActive: boolean;
  config: SchedulerConfig;
  stats: {
    totalRuns: number;
    successfulRuns: number;
    lastRunResult?: any;
    avgQualityImprovement: number;
  };
}

// In-memory scheduler state (in production, use database or persistent storage)
let schedulerState: SchedulerStatus = {
  isActive: false,
  config: {
    enabled: false,
    interval: 'daily',
    time: '02:00',
    qualityThreshold: 70,
    lastRun: undefined,
    nextRun: undefined
  },
  stats: {
    totalRuns: 0,
    successfulRuns: 0,
    avgQualityImprovement: 0
  }
};

let schedulerInterval: NodeJS.Timeout | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        const { action } = query;

        switch (action) {
          case 'status':
            // Get scheduler status
            return res.status(200).json({
              success: true,
              scheduler: schedulerState,
              timestamp: new Date().toISOString()
            });

          case 'next-run':
            // Calculate next run time
            const nextRun = calculateNextRun(schedulerState.config);
            return res.status(200).json({
              success: true,
              nextRun,
              timeUntilNext: nextRun ? new Date(nextRun).getTime() - Date.now() : null,
              timestamp: new Date().toISOString()
            });

          default:
            return res.status(400).json({ 
              success: false, 
              error: 'Invalid action. Use: status, next-run' 
            });
        }

      case 'POST':
        const { action: postAction, config } = req.body;

        switch (postAction) {
          case 'start':
            // Start the scheduler
            if (!config) {
              return res.status(400).json({
                success: false,
                error: 'Scheduler configuration required'
              });
            }

            schedulerState.config = { ...schedulerState.config, ...config, enabled: true };
            schedulerState.isActive = true;
            
            await startScheduler();
            
            return res.status(200).json({
              success: true,
              message: 'Scheduler started successfully',
              scheduler: schedulerState,
              nextRun: calculateNextRun(schedulerState.config)
            });

          case 'stop':
            // Stop the scheduler
            schedulerState.isActive = false;
            schedulerState.config.enabled = false;
            
            if (schedulerInterval) {
              clearInterval(schedulerInterval);
              schedulerInterval = null;
            }
            
            return res.status(200).json({
              success: true,
              message: 'Scheduler stopped successfully',
              scheduler: schedulerState
            });

          case 'configure':
            // Update scheduler configuration
            if (!config) {
              return res.status(400).json({
                success: false,
                error: 'Configuration required'
              });
            }

            const wasActive = schedulerState.isActive;
            
            // Stop current scheduler if running
            if (schedulerInterval) {
              clearInterval(schedulerInterval);
              schedulerInterval = null;
            }
            
            // Update configuration
            schedulerState.config = { ...schedulerState.config, ...config };
            
            // Restart if it was active
            if (wasActive && schedulerState.config.enabled) {
              await startScheduler();
            }
            
            return res.status(200).json({
              success: true,
              message: 'Scheduler configuration updated',
              scheduler: schedulerState,
              nextRun: calculateNextRun(schedulerState.config)
            });

          case 'trigger-now':
            // Manually trigger research cycle
            console.log('🚀 Manual research cycle triggered via scheduler API...');
            
            const agent = new ESAMarketIntelligenceAgent();
            const results = await agent.executeResearchCycle();
            
            // Update stats
            schedulerState.stats.totalRuns++;
            if (results.success) {
              schedulerState.stats.successfulRuns++;
              schedulerState.stats.lastRunResult = results;
              
              // Update average quality improvement
              const improvement = results.qualityImprovements.afterScore - results.qualityImprovements.beforeScore;
              schedulerState.stats.avgQualityImprovement = 
                ((schedulerState.stats.avgQualityImprovement * (schedulerState.stats.successfulRuns - 1)) + improvement) / 
                schedulerState.stats.successfulRuns;
            }
            
            schedulerState.config.lastRun = new Date().toISOString();
            
            return res.status(200).json({
              success: results.success,
              message: 'Manual research cycle completed',
              results,
              scheduler: schedulerState
            });

          default:
            return res.status(400).json({
              success: false,
              error: 'Invalid action. Use: start, stop, configure, trigger-now'
            });
        }

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed. Use GET or POST'
        });
    }

  } catch (error) {
    console.error('Scheduler API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

async function startScheduler(): Promise<void> {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  const config = schedulerState.config;
  let intervalMs: number;

  switch (config.interval) {
    case 'hourly':
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case 'daily':
      intervalMs = 24 * 60 * 60 * 1000; // 24 hours
      break;
    case 'weekly':
      intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      break;
    default:
      intervalMs = 24 * 60 * 60 * 1000; // Default to daily
  }

  // Calculate time until next scheduled run
  const nextRun = calculateNextRun(config);
  const timeUntilNext = nextRun ? new Date(nextRun).getTime() - Date.now() : intervalMs;

  // Set initial timeout to align with schedule
  setTimeout(async () => {
    await executeScheduledResearch();
    
    // Then set up regular interval
    schedulerInterval = setInterval(async () => {
      await executeScheduledResearch();
    }, intervalMs);
  }, Math.max(0, timeUntilNext));

  schedulerState.config.nextRun = nextRun || new Date(Date.now() + intervalMs).toISOString();
  
  console.log(`📅 Research scheduler started - Next run: ${schedulerState.config.nextRun}`);
}

async function executeScheduledResearch(): Promise<void> {
  if (!schedulerState.config.enabled || !schedulerState.isActive) {
    return;
  }

  try {
    console.log('⏰ Scheduled research cycle starting...');
    
    // Check quality threshold if configured
    if (schedulerState.config.qualityThreshold) {
      const healthResponse = await fetch('http://localhost:3001/api/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        const currentQuality = healthData.services?.database?.dataQuality?.healthScore || 0;
        
        if (currentQuality >= schedulerState.config.qualityThreshold) {
          console.log(`✅ Quality threshold met (${currentQuality}% >= ${schedulerState.config.qualityThreshold}%) - skipping research`);
          return;
        }
        console.log(`📉 Quality below threshold (${currentQuality}% < ${schedulerState.config.qualityThreshold}%) - proceeding with research`);
      }
    }

    const agent = new ESAMarketIntelligenceAgent();
    const results = await agent.executeResearchCycle();
    
    // Update stats
    schedulerState.stats.totalRuns++;
    if (results.success) {
      schedulerState.stats.successfulRuns++;
      schedulerState.stats.lastRunResult = results;
      
      // Update average quality improvement
      const improvement = results.qualityImprovements.afterScore - results.qualityImprovements.beforeScore;
      schedulerState.stats.avgQualityImprovement = 
        ((schedulerState.stats.avgQualityImprovement * (schedulerState.stats.successfulRuns - 1)) + improvement) / 
        schedulerState.stats.successfulRuns;
    }
    
    schedulerState.config.lastRun = new Date().toISOString();
    schedulerState.config.nextRun = calculateNextRun(schedulerState.config);
    
    console.log(`✅ Scheduled research cycle completed - Next run: ${schedulerState.config.nextRun}`);
    
  } catch (error) {
    console.error('❌ Scheduled research cycle failed:', error);
  }
}

function calculateNextRun(config: SchedulerConfig): string | null {
  if (!config.enabled) return null;
  
  const now = new Date();
  let nextRun = new Date();

  switch (config.interval) {
    case 'hourly':
      nextRun.setHours(now.getHours() + 1, 0, 0, 0);
      break;
      
    case 'daily':
      if (config.time) {
        const [hours, minutes] = config.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      } else {
        nextRun.setHours(now.getHours() + 24, 0, 0, 0);
      }
      break;
      
    case 'weekly':
      const targetDay = config.dayOfWeek || 0; // Default to Sunday
      const daysUntilTarget = (targetDay - now.getDay() + 7) % 7 || 7;
      
      nextRun.setDate(now.getDate() + daysUntilTarget);
      
      if (config.time) {
        const [hours, minutes] = config.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
      } else {
        nextRun.setHours(2, 0, 0, 0); // Default to 2 AM
      }
      break;
      
    default:
      return null;
  }

  return nextRun.toISOString();
}

// Export configuration for larger payloads and longer timeouts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
  maxDuration: 300, // 5 minutes for research operations
};