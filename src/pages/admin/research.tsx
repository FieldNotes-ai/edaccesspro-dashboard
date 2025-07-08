import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';

interface ResearchStatus {
  status: 'healthy' | 'degraded' | 'error';
  lastRun: string;
  totalResearched: number;
  pendingTargets: number;
  avgConfidence: number;
}

interface ResearchTarget {
  name: string;
  state: string;
  priority: number;
  dataGaps: string[];
}

interface ResearchResults {
  success: boolean;
  results?: {
    programsResearched: number;
    qualityImprovement: {
      beforeScore: number;
      afterScore: number;
      fieldsImproved: string[];
    };
    avgConfidence: number;
    researchSummary: Array<{
      program: string;
      confidence: number;
      fieldsResearched: number;
      dataQuality: 'high' | 'medium' | 'low';
    }>;
  };
  error?: string;
}

interface SchedulerStatus {
  isActive: boolean;
  config: {
    enabled: boolean;
    interval: 'hourly' | 'daily' | 'weekly';
    time?: string;
    dayOfWeek?: number;
    qualityThreshold?: number;
    lastRun?: string;
    nextRun?: string;
  };
  stats: {
    totalRuns: number;
    successfulRuns: number;
    lastRunResult?: any;
    avgQualityImprovement: number;
  };
}

export default function ResearchAdmin() {
  const [status, setStatus] = useState<ResearchStatus | null>(null);
  const [targets, setTargets] = useState<ResearchTarget[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResults, setLastResults] = useState<ResearchResults | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [schedulerConfig, setSchedulerConfig] = useState({
    interval: 'daily' as 'hourly' | 'daily' | 'weekly',
    time: '02:00',
    qualityThreshold: 70
  });

  useEffect(() => {
    fetchStatus();
    fetchTargets();
    fetchSchedulerStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/research?action=status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching research status:', error);
    }
  };

  const fetchTargets = async () => {
    try {
      const response = await fetch('/api/research?action=targets');
      const data = await response.json();
      if (data.success) {
        setTargets(data.nextCycleTargets || []);
      }
    } catch (error) {
      console.error('Error fetching research targets:', error);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/scheduler/research-cycle?action=status');
      const data = await response.json();
      if (data.success) {
        setSchedulerStatus(data.scheduler);
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    }
  };

  const toggleScheduler = async (enable: boolean) => {
    try {
      const action = enable ? 'start' : 'stop';
      const payload: any = { action };
      
      if (enable) {
        payload.config = schedulerConfig;
      }

      const response = await fetch('/api/scheduler/research-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setLogs(prev => [...prev, `✅ Scheduler ${enable ? 'started' : 'stopped'} successfully`]);
        await fetchSchedulerStatus();
      } else {
        setLogs(prev => [...prev, `❌ Failed to ${enable ? 'start' : 'stop'} scheduler: ${data.error}`]);
      }
    } catch (error) {
      setLogs(prev => [...prev, `❌ Scheduler error: ${error}`]);
    }
  };

  const updateSchedulerConfig = async () => {
    try {
      const response = await fetch('/api/scheduler/research-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure',
          config: schedulerConfig
        }),
      });

      const data = await response.json();
      if (data.success) {
        setLogs(prev => [...prev, `✅ Scheduler configuration updated`]);
        await fetchSchedulerStatus();
      } else {
        setLogs(prev => [...prev, `❌ Failed to update scheduler: ${data.error}`]);
      }
    } catch (error) {
      setLogs(prev => [...prev, `❌ Config update error: ${error}`]);
    }
  };

  const executeResearch = async () => {
    setIsRunning(true);
    setLogs(['🚀 Starting research cycle...']);
    
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'execute-research' }),
      });

      const data = await response.json();
      setLastResults(data);

      if (data.success) {
        setLogs(prev => [...prev, 
          `✅ Research completed successfully`,
          `📊 Programs researched: ${data.results?.programsResearched || 0}`,
          `📈 Quality improvement: ${data.results?.qualityImprovement?.beforeScore || 0}% → ${data.results?.qualityImprovement?.afterScore || 0}%`,
          `🎯 Average confidence: ${Math.round((data.results?.avgConfidence || 0) * 100)}%`
        ]);
      } else {
        setLogs(prev => [...prev, `❌ Research failed: ${data.error}`]);
      }

      // Refresh status and targets
      await fetchStatus();
      await fetchTargets();

    } catch (error) {
      setLogs(prev => [...prev, `❌ Error: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Market Research Agent Administration
          </h1>

          {/* Status Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900">Agent Status</h3>
              <p className={`text-lg font-semibold ${getStatusColor(status?.status || 'unknown')}`}>
                {status?.status || 'Loading...'}
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-900">Pending Targets</h3>
              <p className="text-lg font-semibold text-yellow-600">
                {status?.pendingTargets || 0}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-900">Avg Confidence</h3>
              <p className="text-lg font-semibold text-green-600">
                {Math.round((status?.avgConfidence || 0) * 100)}%
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-900">Total Researched</h3>
              <p className="text-lg font-semibold text-purple-600">
                {status?.totalResearched || 0}
              </p>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-indigo-900">Automation</h3>
              <p className={`text-lg font-semibold ${schedulerStatus?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {schedulerStatus?.isActive ? 'Active' : 'Inactive'}
              </p>
              {schedulerStatus?.config.nextRun && (
                <p className="text-xs text-indigo-600 mt-1">
                  Next: {new Date(schedulerStatus.config.nextRun).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Automation Controls */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Automation Controls</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scheduler Configuration */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Scheduler Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval
                    </label>
                    <select
                      value={schedulerConfig.interval}
                      onChange={(e) => setSchedulerConfig(prev => ({ 
                        ...prev, 
                        interval: e.target.value as 'hourly' | 'daily' | 'weekly' 
                      }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time (24-hour format)
                    </label>
                    <input
                      type="time"
                      value={schedulerConfig.time}
                      onChange={(e) => setSchedulerConfig(prev => ({ ...prev, time: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={schedulerConfig.qualityThreshold}
                      onChange={(e) => setSchedulerConfig(prev => ({ 
                        ...prev, 
                        qualityThreshold: parseInt(e.target.value) 
                      }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Research only runs if data quality is below this threshold
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleScheduler(!schedulerStatus?.isActive)}
                      className={`px-4 py-2 rounded-md font-medium ${
                        schedulerStatus?.isActive
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {schedulerStatus?.isActive ? '⏹️ Stop Scheduler' : '▶️ Start Scheduler'}
                    </button>
                    
                    <button
                      onClick={updateSchedulerConfig}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700"
                    >
                      💾 Update Config
                    </button>
                  </div>
                </div>
              </div>

              {/* Scheduler Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Scheduler Status</h3>
                
                {schedulerStatus ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`font-medium ${schedulerStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {schedulerStatus.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Interval:</span>
                      <span className="font-medium">{schedulerStatus.config.interval}</span>
                    </div>
                    
                    {schedulerStatus.config.lastRun && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Run:</span>
                        <span className="font-medium text-xs">
                          {new Date(schedulerStatus.config.lastRun).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {schedulerStatus.config.nextRun && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Next Run:</span>
                        <span className="font-medium text-xs">
                          {new Date(schedulerStatus.config.nextRun).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Runs:</span>
                      <span className="font-medium">{schedulerStatus.stats.totalRuns}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Success Rate:</span>
                      <span className="font-medium">
                        {schedulerStatus.stats.totalRuns > 0 
                          ? Math.round((schedulerStatus.stats.successfulRuns / schedulerStatus.stats.totalRuns) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Loading scheduler status...</div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Research Controls */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Manual Research Controls</h2>
              <button
                onClick={executeResearch}
                disabled={isRunning}
                className={`px-4 py-2 rounded-md font-medium ${
                  isRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRunning ? '🔄 Researching...' : '🚀 Execute Research Cycle'}
              </button>
            </div>

            {/* Research Targets */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Next Cycle Targets ({targets.length})
              </h3>
              <div className="space-y-2">
                {targets.slice(0, 5).map((target, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{target.name}</span>
                      <span className="text-gray-500 ml-2">({target.state})</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        Priority: {Math.round(target.priority)}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {target.dataGaps.slice(0, 3).map((gap, i) => (
                          <span key={i} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            {gap}
                          </span>
                        ))}
                        {target.dataGaps.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            +{target.dataGaps.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Last Results */}
          {lastResults && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Research Results</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                {lastResults.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Programs Researched:</span>
                        <span className="font-semibold ml-2">{lastResults.results?.programsResearched}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Quality Score:</span>
                        <span className="font-semibold ml-2">
                          {lastResults.results?.qualityImprovement?.beforeScore}% → {lastResults.results?.qualityImprovement?.afterScore}%
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Avg Confidence:</span>
                        <span className="font-semibold ml-2">{Math.round((lastResults.results?.avgConfidence || 0) * 100)}%</span>
                      </div>
                    </div>
                    
                    {lastResults.results?.researchSummary && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Research Summary:</h4>
                        <div className="space-y-2">
                          {lastResults.results.researchSummary.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                              <span className="font-medium">{item.program}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm">Confidence: {item.confidence}%</span>
                                <span className="text-sm">Fields: {item.fieldsResearched}</span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  item.dataQuality === 'high' ? 'bg-green-100 text-green-600' :
                                  item.dataQuality === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-red-100 text-red-600'
                                }`}>
                                  {item.dataQuality}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600">
                    <span className="font-medium">Error:</span> {lastResults.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Logs */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Logs</h2>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    [{new Date().toLocaleTimeString()}] {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No activity logs yet...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Simple auth check - in production, implement proper admin authentication
  const { req } = context;
  const cookies = req.headers.cookie || '';
  const authCookie = cookies.split(';').find(c => c.trim().startsWith('demo-auth='));
  
  if (!authCookie || !authCookie.includes('authenticated')) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};