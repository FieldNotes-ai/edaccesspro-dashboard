
# 🚀 MANUAL DEPLOYMENT INSTRUCTIONS

## Option 1: Supabase Dashboard (RECOMMENDED)
1. Go to: https://cqodtsqeiimwgidkrttb.supabase.co
2. Login to your Supabase account
3. Navigate to SQL Editor (left sidebar)
4. Copy contents of migration/manual-deployment.sql
5. Paste into SQL Editor
6. Click "Run" to execute

## Option 2: Direct PostgreSQL Connection
1. Get your database password from Supabase Dashboard → Settings → Database
2. Use psql or any PostgreSQL client:
   ```
   Host: db.cqodtsqeiimwgidkrttb.supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: [Your database password]
   ```
3. Execute the SQL from migration/manual-deployment.sql

## Option 3: Supabase CLI
1. Install: npm install -g supabase (if supported)
2. Login: supabase login
3. Link: supabase link --project-ref cqodtsqeiimwgidkrttb
4. Push: supabase db push

## After Deployment
Run this to test:
```bash
node migration/test-supabase-connection.js
```

## Next Steps
1. Verify schema deployment
2. Import data: node migration/import-to-supabase.js
3. Test COO agent: node demo-coo-agent.js
