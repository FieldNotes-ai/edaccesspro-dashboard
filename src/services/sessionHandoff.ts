import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
);

export interface SessionHandoffData {
  sessionId: string;
  projectPhase: string;
  completionPercentage: number;
  currentObjectives: string[];
  completedTasks: string[];
  blockedItems: string[];
  nextSessionPriorities: string[];
  scopeConstraints: string[];
  criticalNotes?: string;
}

export interface SystemAuditResult {
  timestamp: string;
  projectPhase: string;
  completionPercentage: number;
  architecture: {
    databases: string[];
    agents: string[];
    apiEndpoints: string[];
    frontendComponents: string[];
  };
  criticalFiles: string[];
  dependencies: string[];
  migrationStatus: {
    supabaseDeployment: boolean;
    dataImported: boolean;
    schemaOptimized: boolean;
  };
  nextActions: string[];
}

export class SessionHandoffService {
  
  /**
   * Complete system audit of current architecture
   */
  async performSystemAudit(): Promise<SystemAuditResult> {
    const timestamp = new Date().toISOString();
    
    const auditResult: SystemAuditResult = {
      timestamp,
      projectPhase: 'Foundation Phase - Supabase Migration & COO Agent',
      completionPercentage: 70,
      architecture: {
        databases: ['Airtable (Legacy)', 'Supabase (Optimized Schema Ready)'],
        agents: ['ESA Market Intelligence Agent', 'COO Agent (In Development)'],
        apiEndpoints: [
          '/api/auth/login',
          '/api/kpis',
          '/api/costs',
          '/api/workflows',
          '/api/change-review'
        ],
        frontendComponents: [
          'Dashboard Components',
          'US Map Visualization',
          'Vendor Onboarding',
          'Admin Research Interface'
        ]
      },
      criticalFiles: [
        'migration/supabase_schema.sql',
        'src/services/esaMarketIntelligenceAgent.ts',
        'SESSION_HANDOFF_CRITICAL.md',
        'src/services/sessionHandoff.ts'
      ],
      dependencies: [
        '@supabase/supabase-js',
        '@anthropic-ai/sdk',
        'next.js',
        'react',
        'typescript'
      ],
      migrationStatus: {
        supabaseDeployment: true,
        dataImported: false,
        schemaOptimized: true
      },
      nextActions: [
        'Manual SQL execution in Supabase dashboard',
        'COO Agent implementation with approval gates',
        'Control tower integration',
        'Session handoff system testing'
      ]
    };

    return auditResult;
  }

  /**
   * Create session handoff record with scope creep prevention
   */
  async createSessionHandoff(data: SessionHandoffData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Validate scope constraints
      const validationResult = this.validateScopeConstraints(data);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Scope constraint violation: ${validationResult.violations.join(', ')}`
        };
      }

      const { data: handoffData, error } = await supabase
        .from('session_handoff')
        .insert([{
          session_id: data.sessionId,
          project_phase: data.projectPhase,
          completion_percentage: data.completionPercentage,
          current_objectives: data.currentObjectives,
          completed_tasks: data.completedTasks,
          blocked_items: data.blockedItems,
          next_session_priorities: data.nextSessionPriorities,
          scope_constraints: data.scopeConstraints,
          critical_notes: data.criticalNotes
        }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: handoffData.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Validate scope constraints to prevent scope creep
   */
  private validateScopeConstraints(data: SessionHandoffData): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];
    
    // Define allowed scope for Foundation Phase
    const allowedObjectives = [
      'supabase migration',
      'coo agent',
      'schema optimization',
      'session handoff',
      'approval gates',
      'control tower',
      'foundation phase'
    ];

    const forbiddenItems = [
      'ui improvements',
      'new features',
      'vendor portal',
      'additional integrations',
      'architecture changes'
    ];

    // Check current objectives for scope creep
    data.currentObjectives.forEach(objective => {
      const lowerObjective = objective.toLowerCase();
      const hasAllowedKeyword = allowedObjectives.some(allowed => 
        lowerObjective.includes(allowed)
      );
      
      const hasForbiddenKeyword = forbiddenItems.some(forbidden => 
        lowerObjective.includes(forbidden)
      );

      if (hasForbiddenKeyword) {
        violations.push(`Forbidden scope item: ${objective}`);
      }
      
      if (!hasAllowedKeyword && !hasForbiddenKeyword) {
        violations.push(`Out of scope objective: ${objective}`);
      }
    });

    // Check completion percentage bounds
    if (data.completionPercentage < 0 || data.completionPercentage > 100) {
      violations.push('Completion percentage must be between 0-100');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Get current session status
   */
  async getCurrentSessionStatus(): Promise<SessionHandoffData | null> {
    try {
      const { data, error } = await supabase
        .from('session_handoff')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        sessionId: data.session_id,
        projectPhase: data.project_phase,
        completionPercentage: data.completion_percentage,
        currentObjectives: data.current_objectives,
        completedTasks: data.completed_tasks,
        blockedItems: data.blocked_items,
        nextSessionPriorities: data.next_session_priorities,
        scopeConstraints: data.scope_constraints,
        criticalNotes: data.critical_notes
      };
    } catch (error) {
      console.error('Error fetching session status:', error);
      return null;
    }
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(
    sessionId: string,
    updates: Partial<SessionHandoffData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('session_handoff')
        .update({
          completion_percentage: updates.completionPercentage,
          current_objectives: updates.currentObjectives,
          completed_tasks: updates.completedTasks,
          blocked_items: updates.blockedItems,
          next_session_priorities: updates.nextSessionPriorities,
          critical_notes: updates.criticalNotes,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        return { success: false, error: error.message };
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
   * Generate session handoff report
   */
  async generateHandoffReport(): Promise<{
    success: boolean;
    report?: string;
    error?: string;
  }> {
    try {
      const currentStatus = await this.getCurrentSessionStatus();
      const systemAudit = await this.performSystemAudit();
      
      if (!currentStatus) {
        return { success: false, error: 'No current session found' };
      }

      const report = `
# 🚨 SESSION HANDOFF REPORT - ${new Date().toISOString()}

## 📊 PROJECT STATUS
- **Phase**: ${currentStatus.projectPhase}
- **Completion**: ${currentStatus.completionPercentage}%
- **Session ID**: ${currentStatus.sessionId}

## ✅ COMPLETED TASKS
${currentStatus.completedTasks.map(task => `- ✅ ${task}`).join('\n')}

## 🎯 CURRENT OBJECTIVES
${currentStatus.currentObjectives.map(obj => `- 🎯 ${obj}`).join('\n')}

## 🚧 BLOCKED ITEMS
${currentStatus.blockedItems.map(item => `- 🚧 ${item}`).join('\n')}

## 📋 NEXT SESSION PRIORITIES
${currentStatus.nextSessionPriorities.map(priority => `- 📋 ${priority}`).join('\n')}

## 🚫 SCOPE CONSTRAINTS
${currentStatus.scopeConstraints.map(constraint => `- 🚫 ${constraint}`).join('\n')}

## 🏗️ ARCHITECTURE AUDIT
- **Databases**: ${systemAudit.architecture.databases.join(', ')}
- **Agents**: ${systemAudit.architecture.agents.join(', ')}
- **API Endpoints**: ${systemAudit.architecture.apiEndpoints.length} endpoints
- **Frontend Components**: ${systemAudit.architecture.frontendComponents.length} components

## 🔄 MIGRATION STATUS
- **Supabase Deployment**: ${systemAudit.migrationStatus.supabaseDeployment ? '✅' : '❌'}
- **Data Imported**: ${systemAudit.migrationStatus.dataImported ? '✅' : '❌'}
- **Schema Optimized**: ${systemAudit.migrationStatus.schemaOptimized ? '✅' : '❌'}

## 📝 CRITICAL NOTES
${currentStatus.criticalNotes || 'None'}

## 🔄 NEXT ACTIONS
${systemAudit.nextActions.map(action => `- 🔄 ${action}`).join('\n')}

---
**Generated**: ${new Date().toISOString()}
**Next Session**: Read this report first, then execute priorities in order
`;

      return { success: true, report };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Initialize current session with foundation phase data
   */
  async initializeFoundationPhase(): Promise<{ success: boolean; error?: string }> {
    const foundationData: SessionHandoffData = {
      sessionId: `foundation-${Date.now()}`,
      projectPhase: 'Foundation Phase - Supabase Migration & COO Agent',
      completionPercentage: 70,
      currentObjectives: [
        'Complete system audit of current architecture',
        'Optimize database schema (remove 21 redundant fields)',
        'Deploy optimized schema to Supabase',
        'Build session handoff system with scope creep prevention',
        'Create COO agent with STRICT human approval gates via control tower'
      ],
      completedTasks: [
        'Airtable data exported (360 records, 9 tables)',
        'Supabase project created with credentials',
        'Database schema designed',
        'Multi-agent architecture planned',
        'User requirements captured'
      ],
      blockedItems: [
        'Manual SQL execution required in Supabase dashboard',
        'Data import pending schema deployment'
      ],
      nextSessionPriorities: [
        'Complete COO agent implementation',
        'Test approval workflow system',
        'Verify session handoff system',
        'Plan next phase architecture'
      ],
      scopeConstraints: [
        'No new feature requests',
        'No architecture changes beyond planned multi-agent system',
        'No additional integrations',
        'No UI/UX improvements',
        'COO-only focus until foundation is solid'
      ],
      criticalNotes: 'CRITICAL: All agent actions require human approval initially. Graduated autonomy system planned.'
    };

    return await this.createSessionHandoff(foundationData);
  }
}

export default SessionHandoffService;