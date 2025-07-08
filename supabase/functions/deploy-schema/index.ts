import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Read the schema SQL
    const schemaSQL = `
-- ESA Vendor Dashboard - Optimized Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core ESA Program Tracker (Optimized: 15 fields)
CREATE TABLE IF NOT EXISTS esa_program_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  state VARCHAR(255) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  program_type VARCHAR(255) NOT NULL,
  vendor_portal_url VARCHAR(255) NOT NULL,
  portal_technology VARCHAR(255) NOT NULL,
  platform_fee DECIMAL NOT NULL DEFAULT 0,
  admin_fee BIGINT NOT NULL DEFAULT 0,
  market_size BIGINT NOT NULL DEFAULT 0,
  payment_timing VARCHAR(255) NOT NULL DEFAULT 'Unknown',
  vendor_requirements TEXT NOT NULL DEFAULT '',
  application_deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    `

    // Try to execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSQL })
    
    if (error) {
      console.error('Schema deployment error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          approach: 'edge_function_rpc'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Schema deployed successfully via edge function',
        data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        approach: 'edge_function_catch'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
