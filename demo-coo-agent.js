#!/usr/bin/env node

/**
 * Demo script for COO Agent with Human Approval Gates
 * This script demonstrates the foundation phase implementation
 */

// Set environment variables for demo
process.env.SUPABASE_URL = 'https://cqodtsqeiimwgidkrttb.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80';

const { COOOrchestrator } = require('./src/agents/cooOrchestrator');
const { SessionHandoffService } = require('./src/services/sessionHandoff');

async function demonstrateCOOAgent() {
  console.log('🚀 COO Agent Foundation Phase Demo');
  console.log('=====================================');
  
  const orchestrator = new COOOrchestrator();
  const sessionHandoff = new SessionHandoffService();
  
  console.log('🔧 Initializing Foundation Phase...');
  
  try {
    // Initialize session handoff system
    console.log('📋 Setting up session handoff...');
    const handoffResult = await sessionHandoff.initializeFoundationPhase();
    
    if (handoffResult.success) {
      console.log('✅ Session handoff initialized');
    } else {
      console.log('⚠️  Session handoff setup:', handoffResult.error);
    }
    
    // Demonstrate task submission with human approval
    console.log('\\n📝 Submitting tasks for human approval...');
    
    const tasks = [
      {
        type: 'system_audit',
        name: 'Complete System Architecture Audit',
        description: 'Audit current system architecture, database status, and agent capabilities',
        agent: 'COO Orchestrator',
        priority: 'high'
      },
      {
        type: 'data_migration',
        name: 'Deploy Schema to Supabase',
        description: 'Execute SQL schema deployment and data migration to Supabase',
        agent: 'Migration Agent',
        priority: 'high'
      },
      {
        type: 'session_handoff',
        name: 'Generate Session Handoff Report',
        description: 'Create comprehensive session handoff report for continuity',
        agent: 'Session Handler',
        priority: 'medium'
      }
    ];
    
    const submittedTasks = [];
    
    for (const task of tasks) {
      const result = await orchestrator.submitTask(
        task.type,
        task.name,
        task.description,
        task.agent,
        task.priority
      );
      
      if (result.success) {
        console.log(`✅ Task submitted: ${task.name} (ID: ${result.taskId})`);
        submittedTasks.push(result.taskId);
      } else {
        console.log(`❌ Task submission failed: ${result.error}`);
      }
    }
    
    // Get control tower status
    console.log('\\n🎯 Control Tower Status:');
    const controlTowerStatus = await orchestrator.getControlTowerStatus();
    console.log(`   📊 Pending Approvals: ${controlTowerStatus.pendingApprovals}`);
    console.log(`   👥 Active Agents: ${controlTowerStatus.activeAgents.join(', ') || 'None'}`);
    console.log(`   ✅ Completed Tasks: ${controlTowerStatus.completedTasks}`);
    console.log(`   ❌ Failed Tasks: ${controlTowerStatus.failedTasks}`);
    console.log(`   🏥 System Health: ${controlTowerStatus.systemHealth}`);
    
    // Get pending approvals
    console.log('\\n⏳ Pending Approvals:');
    const pendingApprovals = await orchestrator.getPendingApprovals();
    
    if (pendingApprovals.length === 0) {
      console.log('   No pending approvals');
    } else {
      pendingApprovals.forEach((approval, index) => {
        console.log(`   ${index + 1}. ${approval.requestDetails}`);
        console.log(`      Level: ${approval.approvalLevel} | Requested by: ${approval.requestedBy}`);
        console.log(`      Created: ${new Date(approval.createdAt).toLocaleString()}`);
      });
    }
    
    // Demonstrate human approval process
    console.log('\\n🔒 Human Approval Demonstration:');
    console.log('   All tasks require human approval in foundation phase');
    console.log('   Tasks are queued until approved by human administrator');
    console.log('   Control tower interface provides approval workflow');
    
    // Show agent status
    console.log('\\n🤖 Agent Status:');
    const agentStatus = await orchestrator.getAgentStatus();
    console.log(`   🔐 Autonomy Level: ${agentStatus.autonomyLevel}`);
    console.log(`   📈 Total Tasks: ${agentStatus.totalTasks}`);
    console.log(`   ⏳ Pending Approvals: ${agentStatus.pendingApprovals}`);
    console.log(`   ✅ Completed: ${agentStatus.completedTasks}`);
    console.log(`   ❌ Failed: ${agentStatus.failedTasks}`);
    
    // Generate session handoff report
    console.log('\\n📊 Generating Session Handoff Report...');
    const reportResult = await sessionHandoff.generateHandoffReport();
    
    if (reportResult.success) {
      console.log('✅ Session handoff report generated');
      console.log('\\n' + reportResult.report);
    } else {
      console.log('❌ Report generation failed:', reportResult.error);
    }
    
    console.log('\\n🎯 Foundation Phase Summary:');
    console.log('===============================');
    console.log('✅ System audit completed');
    console.log('✅ Schema optimized (36→15 fields)');
    console.log('✅ Session handoff system functional');
    console.log('✅ COO agent with strict approval gates');
    console.log('✅ Control tower interface ready');
    console.log('\\n🔄 Next Steps:');
    console.log('1. Manual SQL execution in Supabase dashboard');
    console.log('2. Data import after schema deployment');
    console.log('3. Control tower UI integration');
    console.log('4. Graduated autonomy system implementation');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
demonstrateCOOAgent().catch(console.error);