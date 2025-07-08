#!/bin/bash

# Set environment variables for Vercel deployment
echo "Setting up environment variables for control tower..."

# Set SUPABASE_URL
echo "https://cqodtsqeiimwgidkrttb.supabase.co" | npx vercel env add SUPABASE_URL production

# Set SUPABASE_SERVICE_ROLE_KEY
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Set DASHBOARD_PASSWORD
echo "admin123" | npx vercel env add DASHBOARD_PASSWORD production

echo "Environment variables set up successfully!"