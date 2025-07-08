import { createClient } from '@supabase/supabase-js';
import { SessionHandoffService } from '../services/sessionHandoff';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
);

export interface AgentTask {
  id: string;
  taskType: string;
  taskName: string;
  description: string;
  assignedAgent: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  requiresHumanApproval: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  parameters?: Record<string, any>;
  result?: Record<string, any>;
  errorDetails?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  requestedBy: string;
  requestDetails: string;
  approvalLevel: 'standard' | 'elevated' | 'critical';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
}

export interface ControlTowerStatus {
  pendingApprovals: number;
  activeAgents: string[];
  completedTasks: number;
  failedTasks: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  lastUpdate: string;
}

export class COOOrchestrator {
  private sessionHandoff: SessionHandoffService;
  private autonomyLevel: 'locked' | 'supervised' | 'graduated' | 'autonomous';

  constructor() {
    this.sessionHandoff = new SessionHandoffService();
    this.autonomyLevel = 'locked'; // Start with strict human approval
  }

  /**
   * Submit task for execution with mandatory human approval
   */
  async submitTask(
    taskType: string,
    taskName: string,
    description: string,
    assignedAgent: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    parameters?: Record<string, any>
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      // All tasks require human approval initially
      const { data: taskData, error: taskError } = await supabase
        .from('agent_tasks')
        .insert([{
          task_type: taskType,
          task_name: taskName,
          description: description,
          assigned_agent: assignedAgent,
          priority: priority,
          status: 'pending',
          requires_human_approval: true,
          approval_status: 'pending',
          parameters: parameters || {}
        }])
        .select()
        .single();

      if (taskError) {
        return { success: false, error: taskError.message };
      }

      // Create approval request
      const approvalResult = await this.requestApproval(
        taskData.id,
        'COO Orchestrator',
        `${taskName}: ${description}`,
        this.getApprovalLevel(taskType, priority)
      );

      if (!approvalResult.success) {
        return { success: false, error: approvalResult.error };
      }

      // Log the task submission
      await this.logExecution(taskData.id, assignedAgent, 'task_submitted', {
        taskType,
        taskName,
        priority,
        requiresApproval: true
      }, true);

      return { success: true, taskId: taskData.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Request human approval for agent action
   */
  async requestApproval(
    taskId: string,
    requestedBy: string,
    requestDetails: string,
    approvalLevel: 'standard' | 'elevated' | 'critical' = 'standard'
  ): Promise<{ success: boolean; approvalId?: string; error?: string }> {
    try {
      const { data: approvalData, error } = await supabase
        .from('agent_approval_queue')
        .insert([{
          task_id: taskId,
          requested_by: requestedBy,
          request_details: requestDetails,
          approval_level: approvalLevel,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, approvalId: approvalData.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Process approval decision (human approval required)
   */
  async processApproval(
    approvalId: string,
    decision: 'approved' | 'rejected',
    approvedBy: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update approval status
      const { data: approvalData, error: approvalError } = await supabase
        .from('agent_approval_queue')
        .update({
          status: decision,
          approved_by: approvedBy,
          rejection_reason: rejectionReason,
          processed_at: new Date().toISOString()
        })
        .eq('id', approvalId)
        .select()
        .single();

      if (approvalError) {
        return { success: false, error: approvalError.message };
      }

      // Update associated task
      const { error: taskError } = await supabase
        .from('agent_tasks')
        .update({
          approval_status: decision,
          approved_by: approvedBy,
          approved_at: decision === 'approved' ? new Date().toISOString() : null,
          status: decision === 'approved' ? 'pending' : 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalData.task_id);

      if (taskError) {
        return { success: false, error: taskError.message };
      }

      // Log the approval decision
      await this.logExecution(
        approvalData.task_id,
        'COO Orchestrator',
        'approval_processed',
        {
          decision,
          approvedBy,
          rejectionReason,
          approvalLevel: approvalData.approval_level
        },
        true
      );

      // If approved, execute the task
      if (decision === 'approved') {
        await this.executeApprovedTask(approvalData.task_id);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute approved task
   */
  private async executeApprovedTask(taskId: string): Promise<void> {
    try {
      // Update task status to in_progress
      const { data: taskData, error: taskError } = await supabase
        .from('agent_tasks')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (taskError) {
        throw new Error(taskError.message);
      }

      // Log execution start
      await this.logExecution(taskId, taskData.assigned_agent, 'execution_started', {
        taskType: taskData.task_type,
        taskName: taskData.task_name
      }, true);

      // Execute task based on type
      const executionResult = await this.executeTaskByType(taskData);

      // Update task with result
      await supabase
        .from('agent_tasks')
        .update({
          status: executionResult.success ? 'completed' : 'failed',
          result: executionResult.result,
          error_details: executionResult.error,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // Log execution completion
      await this.logExecution(taskId, taskData.assigned_agent, 'execution_completed', {
        success: executionResult.success,
        result: executionResult.result,
        error: executionResult.error
      }, executionResult.success);

    } catch (error) {
      console.error('Error executing approved task:', error);
    }
  }

  /**
   * Execute specific task types
   */
  private async executeTaskByType(taskData: any): Promise<{ success: boolean; result?: any; error?: string }> {
    const { task_type, task_name, parameters } = taskData;

    try {
      switch (task_type) {
        case 'system_audit':
          const auditResult = await this.sessionHandoff.performSystemAudit();
          return { success: true, result: auditResult };

        case 'session_handoff':
          const handoffResult = await this.sessionHandoff.generateHandoffReport();
          return { success: handoffResult.success, result: handoffResult.report, error: handoffResult.error };

        case 'data_migration':
          return {
            success: true,
            result: { message: 'Data migration task orchestrated - requires manual SQL execution' }
          };

        case 'agent_coordination':
          return {
            success: true,
            result: { message: 'Agent coordination task completed - all agents under COO control' }
          };

        default:
          return {
            success: false,
            error: `Unknown task type: ${task_type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get control tower status
   */
  async getControlTowerStatus(): Promise<ControlTowerStatus> {
    try {
      const [pendingApprovals, activeTasks, completedTasks, failedTasks] = await Promise.all([
        supabase.from('agent_approval_queue').select('count').eq('status', 'pending'),
        supabase.from('agent_tasks').select('assigned_agent').eq('status', 'in_progress'),
        supabase.from('agent_tasks').select('count').eq('status', 'completed'),
        supabase.from('agent_tasks').select('count').eq('status', 'failed')
      ]);

      const uniqueActiveAgents = Array.from(new Set(
        activeTasks.data?.map(task => task.assigned_agent) || []
      ));

      return {
        pendingApprovals: pendingApprovals.data?.[0]?.count || 0,
        activeAgents: uniqueActiveAgents,
        completedTasks: completedTasks.data?.[0]?.count || 0,
        failedTasks: failedTasks.data?.[0]?.count || 0,
        systemHealth: this.assessSystemHealth(
          pendingApprovals.data?.[0]?.count || 0,
          failedTasks.data?.[0]?.count || 0
        ),
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      return {
        pendingApprovals: 0,
        activeAgents: [],
        completedTasks: 0,
        failedTasks: 0,
        systemHealth: 'error',
        lastUpdate: new Date().toISOString()
      };
    }
  }

  /**
   * Get pending approvals for human review
   */
  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('agent_approval_queue')
        .select(`
          *,
          agent_tasks (
            task_name,
            description,
            assigned_agent,
            priority
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending approvals:', error);
        return [];
      }

      return data.map(approval => ({
        id: approval.id,
        taskId: approval.task_id,
        requestedBy: approval.requested_by,
        requestDetails: approval.request_details,
        approvalLevel: approval.approval_level,
        status: approval.status,
        approvedBy: approval.approved_by,
        rejectionReason: approval.rejection_reason,
        createdAt: approval.created_at,
        processedAt: approval.processed_at
      }));
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }

  /**
   * Log execution details
   */
  private async logExecution(
    taskId: string,
    agentName: string,
    action: string,
    details: Record<string, any>,
    success: boolean,
    durationMs?: number
  ): Promise<void> {
    try {
      await supabase
        .from('agent_execution_log')
        .insert([{
          task_id: taskId,
          agent_name: agentName,
          action: action,
          execution_details: details,
          success: success,
          error_message: success ? null : details.error,
          duration_ms: durationMs
        }]);
    } catch (error) {
      console.error('Error logging execution:', error);
    }
  }

  /**
   * Determine approval level based on task type and priority
   */
  private getApprovalLevel(taskType: string, priority: string): 'standard' | 'elevated' | 'critical' {
    const criticalTasks = ['data_migration', 'schema_changes', 'production_deployment'];
    const elevatedTasks = ['system_audit', 'agent_coordination'];

    if (criticalTasks.includes(taskType) || priority === 'high') {
      return 'critical';
    } else if (elevatedTasks.includes(taskType)) {
      return 'elevated';
    } else {
      return 'standard';
    }
  }

  /**
   * Assess system health
   */
  private assessSystemHealth(pendingApprovals: number, failedTasks: number): 'healthy' | 'warning' | 'error' {
    if (failedTasks > 5) {
      return 'error';
    } else if (pendingApprovals > 10 || failedTasks > 2) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get agent status
   */
  async getAgentStatus(): Promise<{
    autonomyLevel: string;
    totalTasks: number;
    pendingApprovals: number;
    completedTasks: number;
    failedTasks: number;
    systemHealth: string;
  }> {
    const controlTowerStatus = await this.getControlTowerStatus();
    
    return {
      autonomyLevel: this.autonomyLevel,
      totalTasks: controlTowerStatus.completedTasks + controlTowerStatus.failedTasks,
      pendingApprovals: controlTowerStatus.pendingApprovals,
      completedTasks: controlTowerStatus.completedTasks,
      failedTasks: controlTowerStatus.failedTasks,
      systemHealth: controlTowerStatus.systemHealth
    };
  }
}

export default COOOrchestrator;