// Test Custom RPC Function Approach for Schema Deployment
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cqodtsqeiimwgidkrttb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCustomRPCApproach() {
  console.log('🔧 Testing Custom RPC Function Approach...');
  
  try {
    // Step 1: Try to create a custom RPC function that can execute SQL
    console.log('📝 Step 1: Creating custom RPC function...');
    
    const createRPCSQL = `
      CREATE OR REPLACE FUNCTION deploy_schema_rpc(schema_sql text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result json;
      BEGIN
        -- Execute the provided SQL
        EXECUTE schema_sql;
        
        -- Return success
        result := json_build_object(
          'success', true,
          'message', 'Schema deployed successfully via custom RPC',
          'timestamp', NOW()
        );
        
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        -- Return error details
        result := json_build_object(
          'success', false,
          'error', SQLERRM,
          'sqlstate', SQLSTATE,
          'timestamp', NOW()
        );
        
        RETURN result;
      END;
      $$;
    `;
    
    // Try to create the RPC function using the rpc method
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql: createRPCSQL
    });
    
    if (createError) {
      console.log('❌ Failed to create RPC via exec_sql:', createError.message);
      
      // Try alternative: direct SQL execution via raw query
      console.log('🔄 Trying alternative: direct query execution...');
      
      const { data: directResult, error: directError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .limit(1);
        
      if (directError) {
        console.log('❌ Direct query also failed:', directError.message);
        return { success: false, error: 'Cannot execute SQL via any method', approach: 'custom_rpc' };
      } else {
        console.log('✅ Direct query works, but limited to SELECT operations');
      }
    } else {
      console.log('✅ RPC function created successfully!');
      
      // Step 2: Test the custom RPC function
      console.log('📝 Step 2: Testing custom RPC function...');
      
      const testSchema = `
        CREATE TABLE IF NOT EXISTS test_deployment (
          id SERIAL PRIMARY KEY,
          test_field VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;
      
      const { data: deployResult, error: deployError } = await supabase.rpc('deploy_schema_rpc', {
        schema_sql: testSchema
      });
      
      if (deployError) {
        console.log('❌ Custom RPC execution failed:', deployError.message);
        return { success: false, error: deployError.message, approach: 'custom_rpc_execution' };
      } else {
        console.log('✅ Custom RPC executed successfully!', deployResult);
        return { success: true, data: deployResult, approach: 'custom_rpc' };
      }
    }
    
  } catch (error) {
    console.log('❌ Custom RPC approach failed:', error.message);
    return { success: false, error: error.message, approach: 'custom_rpc_catch' };
  }
}

// Run the test
testCustomRPCApproach()
  .then(result => {
    console.log('\n🎯 Custom RPC Test Result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
