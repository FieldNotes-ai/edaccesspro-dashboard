#!/usr/bin/env node

const { ESAMarketIntelligenceAgent } = require('./src/services/esaMarketIntelligenceAgent');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80';

async function executeMarketResearch() {
  console.log('🔬 Starting Market Size Data Update Task...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // 1. Update task status to in_progress
    console.log('📝 Updating task status to in_progress...');
    const { data: taskUpdate, error: taskError } = await supabase
      .from('agent_tasks')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('task_name', 'Update Market Size Data')
      .eq('approval_status', 'approved')
      .select();
    
    if (taskError) {
      console.error('❌ Error updating task status:', taskError);
      return;
    }
    
    console.log('✅ Task status updated to in_progress');
    
    // 2. Execute research cycle
    console.log('\n🚀 Starting Market Research Cycle...');
    const agent = new ESAMarketIntelligenceAgent();
    const results = await agent.executeResearchCycle();
    
    // 3. Log results
    console.log('\n📊 Research Cycle Results:');
    console.log(`   Success: ${results.success}`);
    console.log(`   Programs Researched: ${results.researchResults.length}`);
    console.log(`   Quality Improvement: ${results.qualityImprovements.beforeScore}% → ${results.qualityImprovements.afterScore}%`);
    console.log(`   Fields Improved: ${results.qualityImprovements.fieldsImproved.join(', ')}`);
    
    if (results.error) {
      console.error(`   Error: ${results.error}`);
    }
    
    // 4. Show detailed results
    console.log('\n📈 Detailed Research Results:');
    results.researchResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.programName}`);
      console.log(`   Overall Confidence: ${Math.round(result.confidence * 100)}%`);
      console.log(`   Findings:`);
      
      Object.entries(result.findings).forEach(([field, finding]) => {
        console.log(`     - ${field}: ${finding.value} (${Math.round(finding.confidence * 100)}% confidence)`);
      });
    });
    
    // 5. Update task with results
    console.log('\n💾 Updating task with results...');
    const { data: resultUpdate, error: resultError } = await supabase
      .from('agent_tasks')
      .update({
        status: results.success ? 'completed' : 'failed',
        result: results,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_details: results.error || null
      })
      .eq('task_name', 'Update Market Size Data')
      .eq('approval_status', 'approved')
      .select();
    
    if (resultError) {
      console.error('❌ Error updating task results:', resultError);
    } else {
      console.log('✅ Task results updated successfully');
    }
    
    // 6. Log execution to agent_execution_log
    console.log('\n📝 Logging execution...');
    const { data: logEntry, error: logError } = await supabase
      .from('agent_execution_log')
      .insert({
        task_id: taskUpdate[0].id,
        agent_name: 'AI_Market_Research_Agent',
        action: 'execute_market_research',
        execution_details: {
          programsResearched: results.researchResults.length,
          qualityImprovement: results.qualityImprovements,
          avgConfidence: results.researchResults.length > 0 ? 
            results.researchResults.reduce((sum, r) => sum + r.confidence, 0) / results.researchResults.length : 0
        },
        success: results.success,
        error_message: results.error || null,
        duration_ms: null
      });
    
    if (logError) {
      console.error('❌ Error logging execution:', logError);
    } else {
      console.log('✅ Execution logged successfully');
    }
    
    console.log('\n🎉 Market Size Data Update Task completed successfully!');
    
  } catch (error) {
    console.error('❌ Market Research execution failed:', error);
    
    // Update task with error
    try {
      await supabase
        .from('agent_tasks')
        .update({
          status: 'failed',
          error_details: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('task_name', 'Update Market Size Data')
        .eq('approval_status', 'approved');
    } catch (updateError) {
      console.error('❌ Error updating task with failure:', updateError);
    }
  }
}

// Execute the research if this script is run directly
if (require.main === module) {
  executeMarketResearch().catch(console.error);
}

module.exports = { executeMarketResearch };