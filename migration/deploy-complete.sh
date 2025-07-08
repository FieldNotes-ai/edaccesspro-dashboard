#!/bin/bash

echo "🚀 ESA Vendor Dashboard - Supabase Schema Deployment"
echo "===================================================="

echo ""
echo "📋 DEPLOYMENT OPTIONS:"
echo ""
echo "1. SUPABASE DASHBOARD (Recommended - Always Works)"
echo "   • Go to: https://cqodtsqeiimwgidkrttb.supabase.co"
echo "   • Login → SQL Editor"
echo "   • Copy/paste: migration/manual-deployment.sql"
echo "   • Click Run"
echo ""

echo "2. POSTGRESQL CLIENT (If you have credentials)"
echo "   • Get password from Supabase Dashboard → Settings → Database"
echo "   • Connect: psql -h aws-0-us-west-1.pooler.supabase.com -p 5432 -U postgres.cqodtsqeiimwgidkrttb -d postgres"
echo "   • Execute: \\i migration/manual-deployment.sql"
echo ""

echo "3. AUTOMATED TEST (After manual deployment)"
echo "   node migration/test-supabase-connection.js"
echo ""

echo "📁 Files ready for deployment:"
ls -la migration/manual-deployment.sql
echo ""

echo "🎯 NEXT STEPS AFTER DEPLOYMENT:"
echo "1. Test connection: node migration/test-supabase-connection.js"
echo "2. Import data: node migration/import-to-supabase.js"  
echo "3. Test COO agent: node demo-coo-agent.js"
echo ""

read -p "Press Enter to continue with automated testing..."
