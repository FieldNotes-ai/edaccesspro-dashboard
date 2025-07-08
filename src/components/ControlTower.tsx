import React, { useState, useEffect } from 'react';
import { COOOrchestrator, ApprovalRequest, ControlTowerStatus } from '../agents/cooOrchestrator';

interface ControlTowerProps {
  orchestrator: COOOrchestrator;
}

const ControlTower: React.FC<ControlTowerProps> = ({ orchestrator }) => {
  const [status, setStatus] = useState<ControlTowerStatus | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingApproval, setProcessingApproval] = useState<string | null>(null);

  useEffect(() => {
    loadControlTowerData();
    const interval = setInterval(loadControlTowerData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadControlTowerData = async () => {
    try {
      const [statusData, approvalsData] = await Promise.all([
        orchestrator.getControlTowerStatus(),
        orchestrator.getPendingApprovals()
      ]);
      
      setStatus(statusData);
      setPendingApprovals(approvalsData);
    } catch (error) {
      console.error('Error loading control tower data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, decision: 'approved' | 'rejected', reason?: string) => {
    setProcessingApproval(approvalId);
    
    try {
      const result = await orchestrator.processApproval(
        approvalId,
        decision,
        'Human Administrator', // In production, this would come from auth
        reason
      );
      
      if (result.success) {
        await loadControlTowerData();
      } else {
        alert(`Error processing approval: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Error processing approval');
    } finally {
      setProcessingApproval(null);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getApprovalLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'elevated': return 'bg-yellow-100 text-yellow-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading Control Tower...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">COO Agent Control Tower</h1>
        <p className="text-gray-600">Strict human approval gates for all agent actions</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">System Health</h3>
            <span className={`text-lg font-semibold ${getHealthColor(status?.systemHealth || 'unknown')}`}>
              {status?.systemHealth || 'Unknown'}
            </span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
            <span className="text-lg font-semibold text-blue-600">
              {status?.pendingApprovals || 0}
            </span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Completed Tasks</h3>
            <span className="text-lg font-semibold text-green-600">
              {status?.completedTasks || 0}
            </span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Failed Tasks</h3>
            <span className="text-lg font-semibold text-red-600">
              {status?.failedTasks || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Active Agents */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Agents</h3>
          <div className="flex flex-wrap gap-2">
            {status?.activeAgents && status.activeAgents.length > 0 ? (
              status.activeAgents.map((agent, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {agent}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No active agents</span>
            )}
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Approvals</h3>
          
          {pendingApprovals.length === 0 ? (
            <p className="text-gray-500">No pending approvals</p>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalLevelColor(approval.approvalLevel)}`}>
                          {approval.approvalLevel}
                        </span>
                        <span className="text-sm text-gray-500">
                          Requested by {approval.requestedBy}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2">
                        {approval.requestDetails}
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        Requested: {new Date(approval.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApproval(approval.id, 'approved')}
                        disabled={processingApproval === approval.id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingApproval === approval.id ? 'Processing...' : 'Approve'}
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for rejection:');
                          if (reason) {
                            handleApproval(approval.id, 'rejected', reason);
                          }
                        }}
                        disabled={processingApproval === approval.id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Last updated: {status?.lastUpdate ? new Date(status.lastUpdate).toLocaleString() : 'Unknown'}
      </div>
    </div>
  );
};

export default ControlTower;