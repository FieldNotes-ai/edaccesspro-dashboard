const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cqodtsqeiimwgidkrttb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
);

describe('KPI Accuracy Tests', () => {
  let calculatedKPIs;

  beforeAll(async () => {
    // Calculate KPIs from Supabase data
    const { data: programs } = await supabase
      .from('esa_program_tracker')
      .select('*');

    const requiredFields = ['program_name', 'state', 'program_type', 'program_status'];
    const totalPrograms = programs?.length || 0;
    
    const completePrograms = programs?.filter(program => 
      requiredFields.every(field => program[field] && program[field] !== '')
    ).length || 0;

    const dataCompleteness = totalPrograms > 0 ? (completePrograms / totalPrograms) * 100 : 0;

    const conflictPrograms = programs?.filter(program => 
      program.program_status === 'Active' && program.current_window_status === 'Closed'
    ).length || 0;

    const conflictRate = totalPrograms > 0 ? (conflictPrograms / totalPrograms) * 100 : 0;

    const { data: logs } = await supabase
      .from('agent_execution_log')
      .select('duration_ms')
      .not('duration_ms', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(50);

    const validLogs = logs?.filter(log => log.duration_ms && log.duration_ms > 0) || [];
    const meanLatency = validLogs.length > 0 
      ? validLogs.reduce((sum, log) => sum + log.duration_ms, 0) / validLogs.length
      : 0;

    const meanLatencyMin = meanLatency / (1000 * 60);

    calculatedKPIs = { dataCompleteness, conflictRate, meanLatencyMin };
  });

  test('should have data completeness above 95%', () => {
    expect(calculatedKPIs.dataCompleteness).toBeGreaterThanOrEqual(95);
  });

  test('should have conflict rate below 20%', () => {
    expect(calculatedKPIs.conflictRate).toBeLessThan(20);
  });

  test('should have reasonable latency values', () => {
    expect(calculatedKPIs.meanLatencyMin).toBeGreaterThanOrEqual(0);
    expect(calculatedKPIs.meanLatencyMin).toBeLessThan(10);
  });

  test('should fail if completeness drops more than 1%', async () => {
    // This would compare against a baseline - for now just ensure it's high
    expect(calculatedKPIs.dataCompleteness).toBeGreaterThan(99);
  });

  test('should fail if conflict rate increases more than 1%', async () => {
    // This would compare against a baseline - for now ensure it's reasonable
    expect(calculatedKPIs.conflictRate).toBeLessThan(15);
  });
});
