#!/usr/bin/env node
/**
 * Fix 12.2% Conflict Rate Issue
 * 
 * The control tower shows a 12.2% conflict rate because 5 out of 41 programs 
 * have conflicting data: program_status='Active' but current_window_status='Closed'
 * 
 * This script identifies and provides solutions for these conflicts.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80'
);

async function fixConflictRate() {
  console.log('🔍 Analyzing 12.2% Conflict Rate Issue...');
  console.log('=' .repeat(50));
  
  try {
    // Get all programs
    const { data: programs, error } = await supabase
      .from('esa_program_tracker')
      .select('*');

    if (error) {
      console.error('❌ Error fetching programs:', error);
      return;
    }

    // Identify conflicting programs
    const conflictPrograms = programs.filter(program => 
      program.program_status === 'Active' && program.current_window_status === 'Closed'
    );
    
    console.log(`📊 Total programs: ${programs.length}`);
    console.log(`⚠️  Conflicting programs: ${conflictPrograms.length}`);
    console.log(`💯 Conflict rate: ${((conflictPrograms.length / programs.length) * 100).toFixed(1)}%`);
    
    console.log('\n🎯 CONFLICTING PROGRAMS:');
    console.log('-'.repeat(50));
    
    conflictPrograms.forEach((program, index) => {
      console.log(`${index + 1}. ${program.program_name} (${program.state})`);
      console.log(`   Status: ${program.program_status} | Window: ${program.current_window_status}`);
      console.log(`   ID: ${program.id}`);
      console.log('');
    });
    
    console.log('🔧 RESOLUTION OPTIONS:');
    console.log('-'.repeat(50));
    console.log('Option 1: Update programs to "Inactive" status (recommended for closed enrollment)');
    console.log('Option 2: Update window status to "Open" (if enrollment is actually open)');
    console.log('Option 3: Implement data validation rules to prevent future conflicts');
    
    console.log('\n🚀 AUTOMATED FIX RECOMMENDATIONS:');
    console.log('-'.repeat(50));
    
    // Generate recommendations for each conflicting program
    const recommendations = await generateRecommendations(conflictPrograms);
    
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.program_name} (${rec.state})`);
      console.log(`   Recommendation: ${rec.recommendation}`);
      console.log(`   Reason: ${rec.reason}`);
      console.log('');
    });
    
    console.log('📋 MANUAL RESOLUTION STEPS:');
    console.log('-'.repeat(50));
    console.log('1. Review each program\'s current enrollment status');
    console.log('2. Contact program administrators to verify correct status');
    console.log('3. Update database with correct information');
    console.log('4. Run validation checks');
    console.log('5. Monitor conflict rate reduction');
    
    console.log('\n💡 PREVENTION MEASURES:');
    console.log('-'.repeat(50));
    console.log('• Implement database constraints to prevent invalid status combinations');
    console.log('• Add automated validation in the data entry process');
    console.log('• Create alerts for status conflicts');
    console.log('• Regular data quality audits');
    
  } catch (error) {
    console.error('❌ Error analyzing conflict rate:', error);
  }
}

async function generateRecommendations(conflictPrograms) {
  return conflictPrograms.map(program => {
    // Basic heuristics for recommendations
    let recommendation = 'Set program_status to "Inactive"';
    let reason = 'Program shows as Active but enrollment window is Closed';
    
    // Check if program has recent activity (if we had timestamp data)
    // For now, use basic logic based on program name patterns
    if (program.program_name.toLowerCase().includes('scholarship') || 
        program.program_name.toLowerCase().includes('grant')) {
      recommendation = 'Verify with administrators - may need window status update';
      reason = 'Scholarship/grant programs may have seasonal enrollment patterns';
    }
    
    return {
      program_name: program.program_name,
      state: program.state,
      recommendation,
      reason,
      id: program.id
    };
  });
}

// Run the analysis
fixConflictRate();