#!/bin/bash
echo "🔑 Logging into Supabase..."
npx supabase login

echo "🔗 Linking project..."
npx supabase link --project-ref cqodtsqeiimwgidkrttb

echo "📤 Pushing schema..."
npx supabase db push

echo "✅ Schema deployment complete!"
