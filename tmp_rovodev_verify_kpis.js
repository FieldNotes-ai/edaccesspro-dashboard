#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cqodtsqeiimwgidkrttb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
);

async function verifyKPIs() {
  console.log('🔍 VERIFYING KPI ACCURACY\n');

  try {
    // 1. Read Supabase tables and check row counts
    console.log('📊 Reading Supabase tables...');
    
    const { data: programs, error: programsError } = await supabase
      .from('esa_program_tracker')
      .select('*');

    if (programsError) {
      console.error('❌ Error fetching programs:', programsError);
      return;
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('agent_tasks')
      .select('*');

    const { data: logs, error: logsError } = await supabase
      .from('agent_execution_log')
      .select('*');

    console.log(`✅ esa_programs: ${programs?.length || 0} records`);
    console.log(`✅ agent_tasks: ${tasks?.length || 0} records`);
    console.log(`✅ agent_execution_log: ${logs?.length || 0} records\n`);

    // 2. Analyze programs by state
    console.log('🗺️  Programs by state:');
    const stateCount = {};
    programs?.forEach(program => {
      const state = program.state || 'Unknown';
      stateCount[state] = (stateCount[state] || 0) + 1;
    });
    
    Object.entries(stateCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([state, count]) => {
        console.log(`   ${state}: ${count} programs`);
      });

    // 3. Re-calculate KPIs with detailed analysis
    console.log('\n📈 RECALCULATING KPIs:\n');

    // Data Completeness Analysis
    const requiredFields = ['program_name', 'state', 'program_type', 'program_status'];
    const totalPrograms = programs?.length || 0;
    
    let completePrograms = 0;
    let fieldCompleteness = {};
    
    programs?.forEach(program => {
      let isComplete = true;
      requiredFields.forEach(field => {
        const hasValue = program[field] && program[field] !== '';
        if (!hasValue) isComplete = false;
        
        fieldCompleteness[field] = fieldCompleteness[field] || { filled: 0, total: 0 };
        fieldCompleteness[field].total++;
        if (hasValue) fieldCompleteness[field].filled++;
      });
      
      if (isComplete) completePrograms++;
    });

    const dataCompleteness = totalPrograms > 0 ? (completePrograms / totalPrograms) * 100 : 0;
    
    console.log('📋 Data Completeness Analysis:');
    console.log(`   Overall: ${dataCompleteness.toFixed(2)}% (${completePrograms}/${totalPrograms})`);
    requiredFields.forEach(field => {
      const pct = (fieldCompleteness[field].filled / fieldCompleteness[field].total) * 100;
      console.log(`   ${field}: ${pct.toFixed(1)}% (${fieldCompleteness[field].filled}/${fieldCompleteness[field].total})`);
    });

    // Conflict Rate Analysis
    const conflictPrograms = programs?.filter(program => 
      program.program_status === 'Active' && program.current_window_status === 'Closed'
    ).length || 0;

    const conflictRate = totalPrograms > 0 ? (conflictPrograms / totalPrograms) * 100 : 0;
    
    console.log('\n⚠️  Conflict Rate Analysis:');
    console.log(`   Conflicts: ${conflictRate.toFixed(2)}% (${conflictPrograms}/${totalPrograms})`);
    console.log(`   Logic: Active programs with Closed windows`);

    // Mean Latency Analysis
    const validLogs = logs?.filter(log => log.duration_ms && log.duration_ms > 0) || [];
    const latencies = validLogs.map(log => log.duration_ms);
    
    let meanLatency = 0;
    let medianLatency = 0;
    
    if (latencies.length > 0) {
      meanLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const sorted = [...latencies].sort((a, b) => a - b);
      medianLatency = sorted[Math.floor(sorted.length / 2)];
    }

    const meanLatencyMin = meanLatency / (1000 * 60);
    const medianLatencyMin = medianLatency / (1000 * 60);

    console.log('\n⏱️  Latency Analysis:');
    console.log(`   Valid logs: ${validLogs.length}/${logs?.length || 0}`);
    console.log(`   Mean: ${meanLatencyMin.toFixed(2)} minutes (${meanLatency.toFixed(0)}ms)`);
    console.log(`   Median: ${medianLatencyMin.toFixed(2)} minutes (${medianLatency.toFixed(0)}ms)`);
    
    if (latencies.length > 0) {
      console.log(`   Min: ${Math.min(...latencies)}ms`);
      console.log(`   Max: ${Math.max(...latencies)}ms`);
    }

    // 4. Compare with Control Tower API
    console.log('\n🎯 FETCHING CONTROL TOWER KPIs...');
    
    try {
      const response = await fetch('https://edaccesspro-control-tower-hzemle6om-field-notes-projects.vercel.app/api/kpis');
      const controlTowerData = await response.json();
      
      if (controlTowerData.kpis && controlTowerData.kpis[0]) {
        const ctKpis = controlTowerData.kpis[0];
        
        console.log('\n📊 COMPARISON:');
        console.log('                    Calculated  |  Control Tower  |  Delta');
        console.log('                    ------------|----------------|--------');
        console.log(`Data Completeness:  ${dataCompleteness.toFixed(2)}%        |  ${ctKpis.completeness_pct.toFixed(2)}%          |  ${Math.abs(dataCompleteness - ctKpis.completeness_pct).toFixed(2)}%`);
        console.log(`Conflict Rate:      ${conflictRate.toFixed(2)}%        |  ${ctKpis.conflict_pct.toFixed(2)}%          |  ${Math.abs(conflictRate - ctKpis.conflict_pct).toFixed(2)}%`);
        console.log(`Mean Latency:       ${meanLatencyMin.toFixed(2)} min     |  ${ctKpis.mean_latency_min.toFixed(2)} min       |  ${Math.abs(meanLatencyMin - ctKpis.mean_latency_min).toFixed(2)} min`);

        // Check for significant deltas
        const completenessDeltas = Math.abs(dataCompleteness - ctKpis.completeness_pct);
        const conflictDelta = Math.abs(conflictRate - ctKpis.conflict_pct);
        const latencyDelta = Math.abs(meanLatencyMin - ctKpis.mean_latency_min);

        console.log('\n🚨 DELTA ANALYSIS:');
        console.log(`   Completeness delta: ${completenessDeltas > 1 ? '❌ FAIL' : '✅ PASS'} (${completenessDeltas.toFixed(2)}% vs 1% threshold)`);
        console.log(`   Conflict delta: ${conflictDelta > 1 ? '❌ FAIL' : '✅ PASS'} (${conflictDelta.toFixed(2)}% vs 1% threshold)`);
        console.log(`   Latency delta: ${latencyDelta > 0.5 ? '⚠️  HIGH' : '✅ OK'} (${latencyDelta.toFixed(2)} min difference)`);

        return {
          calculated: { dataCompleteness, conflictRate, meanLatencyMin },
          controlTower: ctKpis,
          deltas: { completenessDeltas, conflictDelta, latencyDelta },
          testResults: {
            completenessPass: completenessDeltas <= 1,
            conflictPass: conflictDelta <= 1,
            latencyAcceptable: latencyDelta <= 0.5
          }
        };
      }
    } catch (fetchError) {
      console.error('❌ Error fetching Control Tower KPIs:', fetchError.message);
    }

  } catch (error) {
    console.error('❌ Error in KPI verification:', error);
  }
}

if (require.main === module) {
  verifyKPIs().then(() => process.exit(0));
}

module.exports = { verifyKPIs };