#!/bin/bash

echo "🚀 Automated Supabase Schema Deployment"
echo "======================================="

# Set project directory
PROJECT_DIR="/Users/andrewlewis/Desktop/Hewitt AI Agent/esa-vendor-dashboard"
cd "$PROJECT_DIR"

echo "📂 Working directory: $PWD"

# Initialize Supabase project if needed
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Initializing Supabase project..."
    npx supabase init
fi

# Create migrations directory
mkdir -p supabase/migrations

# Copy our schema to a migration file
echo "📝 Creating migration file..."
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_initial_schema.sql"

cp migration/manual-deployment.sql "$MIGRATION_FILE"

echo "✅ Created migration: $MIGRATION_FILE"

# Link to our Supabase project
echo "🔗 Linking to Supabase project..."
echo ""
echo "You'll need to login to Supabase first."
echo "1. Run: npx supabase login"
echo "2. Then run: npx supabase link --project-ref cqodtsqeiimwgidkrttb"
echo "3. Finally run: npx supabase db push"
echo ""

# Create a simple deployment script
cat > deploy-schema.sh << 'EOF'
#!/bin/bash
echo "🔑 Logging into Supabase..."
npx supabase login

echo "🔗 Linking project..."
npx supabase link --project-ref cqodtsqeiimwgidkrttb

echo "📤 Pushing schema..."
npx supabase db push

echo "✅ Schema deployment complete!"
EOF

chmod +x deploy-schema.sh

echo ""
echo "🎯 AUTOMATED DEPLOYMENT READY"
echo ""
echo "Option 1 - Run automated script:"
echo "  ./deploy-schema.sh"
echo ""
echo "Option 2 - Manual commands:"
echo "  npx supabase login"
echo "  npx supabase link --project-ref cqodtsqeiimwgidkrttb" 
echo "  npx supabase db push"
echo ""
echo "Option 3 - Manual SQL (fallback):"
echo "  Copy migration/manual-deployment.sql to Supabase SQL Editor"
echo ""

# Test if we can check the connection without auth
echo "🧪 Testing connection (without auth)..."
npx supabase status 2>/dev/null || echo "   ℹ️  (Auth required for status check)"