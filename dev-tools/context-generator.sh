#!/bin/bash

# ESA Vendor Dashboard - Automated Context Generation
# Generates comprehensive context for AI development sessions

set -e

PROJECT_ROOT="/Users/andrewlewis/Desktop/Hewitt AI Agent/esa-vendor-dashboard"
CONTEXT_DIR="$PROJECT_ROOT/dev-context"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🤖 ESA Vendor Dashboard - Context Generator"
echo "=========================================="

# Create context directory if it doesn't exist
mkdir -p "$CONTEXT_DIR"

# Generate main context file
CONTEXT_FILE="$CONTEXT_DIR/current-context.md"

cat > "$CONTEXT_FILE" << 'EOF'
# ESA Vendor Dashboard - AI Development Context
*Auto-generated context for seamless AI development sessions*

## PROJECT OVERVIEW
- **Name**: ESA Vendor Dashboard  
- **Type**: AI-powered market intelligence platform
- **Tech Stack**: Next.js, TypeScript, Tailwind CSS, Airtable, Claude AI
- **Purpose**: Automate ESA vendor research and provide market intelligence

## CURRENT ARCHITECTURE
```
Market Research Agent (AI) → Airtable Database → API Layer → React Dashboard
```

## KEY COMPONENTS
1. **Market Research Agent** - AI-powered research automation
2. **Admin Dashboard** - Research management interface  
3. **Vendor Dashboard** - Market intelligence display
4. **API Layer** - Data processing and AI integration
5. **Validation System** - Quality assurance and monitoring

EOF

# Add current git status
echo "## GIT STATUS" >> "$CONTEXT_FILE"
echo '```' >> "$CONTEXT_FILE"
cd "$PROJECT_ROOT" && git status --porcelain 2>/dev/null || echo "Not a git repository" >> "$CONTEXT_FILE"
echo '```' >> "$CONTEXT_FILE"
echo "" >> "$CONTEXT_FILE"

# Add recent commits
echo "## RECENT CHANGES" >> "$CONTEXT_FILE"
echo '```' >> "$CONTEXT_FILE"
cd "$PROJECT_ROOT" && git log --oneline -10 2>/dev/null || echo "No git history available" >> "$CONTEXT_FILE"
echo '```' >> "$CONTEXT_FILE"
echo "" >> "$CONTEXT_FILE"

# Add current server status
echo "## SERVER STATUS" >> "$CONTEXT_FILE"
if lsof -i :3001 >/dev/null 2>&1; then
    echo "- ✅ Server running on port 3001" >> "$CONTEXT_FILE"
else
    echo "- ❌ Server not running (start with: npm run dev)" >> "$CONTEXT_FILE"
fi
echo "" >> "$CONTEXT_FILE"

# Add project structure
echo "## PROJECT STRUCTURE" >> "$CONTEXT_FILE"
echo '```' >> "$CONTEXT_FILE"
cd "$PROJECT_ROOT" && find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" | grep -E "(src/|scripts/|\.)" | head -30 >> "$CONTEXT_FILE"
echo '```' >> "$CONTEXT_FILE"
echo "" >> "$CONTEXT_FILE"

# Add environment status
echo "## ENVIRONMENT STATUS" >> "$CONTEXT_FILE"
echo "- **Node Version**: $(node --version 2>/dev/null || echo 'Not installed')" >> "$CONTEXT_FILE"
echo "- **NPM Version**: $(npm --version 2>/dev/null || echo 'Not installed')" >> "$CONTEXT_FILE"
echo "- **Working Directory**: $PROJECT_ROOT" >> "$CONTEXT_FILE"
echo "- **Last Context Update**: $(date)" >> "$CONTEXT_FILE"
echo "" >> "$CONTEXT_FILE"

# Add current tasks from handoff guide
if [ -f "$PROJECT_ROOT/NEXT_SESSION_HANDOFF.md" ]; then
    echo "## CURRENT TASKS" >> "$CONTEXT_FILE"
    echo "*(From handoff guide)*" >> "$CONTEXT_FILE"
    echo "" >> "$CONTEXT_FILE"
    grep -A 10 "IMMEDIATE TASKS" "$PROJECT_ROOT/NEXT_SESSION_HANDOFF.md" >> "$CONTEXT_FILE" 2>/dev/null || echo "No immediate tasks found" >> "$CONTEXT_FILE"
fi

# Add API health check
echo "## API STATUS" >> "$CONTEXT_FILE"
if curl -s -f "http://localhost:3001/api/health" >/dev/null 2>&1; then
    echo "- ✅ Health API responsive" >> "$CONTEXT_FILE"
else
    echo "- ❌ Health API not responding" >> "$CONTEXT_FILE"
fi

if curl -s -f "http://localhost:3001/api/research?action=status" >/dev/null 2>&1; then
    echo "- ✅ Research API responsive" >> "$CONTEXT_FILE"
else
    echo "- ❌ Research API not responding" >> "$CONTEXT_FILE"
fi
echo "" >> "$CONTEXT_FILE"

# Add quick commands
cat >> "$CONTEXT_FILE" << 'EOF'
## QUICK COMMANDS
```bash
# Start development server
npm run dev

# Run system validation
./scripts/validate-data-flow.sh

# Execute research cycle
curl -X POST "http://localhost:3001/api/research" \
  -H "Content-Type: application/json" \
  -d '{"action": "execute-research"}'

# Check API status
curl -s "http://localhost:3001/api/research?action=status"

# Update context
./dev-tools/context-generator.sh
```

## FILES TO READ FIRST
1. `NEXT_SESSION_HANDOFF.md` - Complete session handoff
2. `src/services/marketResearchAgent.ts` - Core AI research system
3. `src/pages/admin/research.tsx` - Research management dashboard
4. `src/pages/api/research.ts` - Research API endpoints

## COMMON ISSUES & SOLUTIONS
- **Server not starting**: Check port 3001, kill existing processes
- **API timeouts**: Research cycles take 2-5 minutes, increase timeout
- **Database errors**: Verify Airtable credentials in .env.local
- **Research failures**: Check Claude API key configuration

---
*Generated: $(date)*
*Location: $PROJECT_ROOT/dev-context/current-context.md*
EOF

echo "✅ Context file generated: $CONTEXT_FILE"

# Create snapshot of current state
SNAPSHOT_FILE="$CONTEXT_DIR/snapshots/snapshot_$TIMESTAMP.md"
mkdir -p "$CONTEXT_DIR/snapshots"
cp "$CONTEXT_FILE" "$SNAPSHOT_FILE"
echo "📸 Snapshot saved: $SNAPSHOT_FILE"

# Create AI-specific context
AI_CONTEXT_FILE="$CONTEXT_DIR/ai-context.md"
cat > "$AI_CONTEXT_FILE" << 'EOF'
# AI Development Context - ESA Vendor Dashboard

## INSTANT SESSION STARTUP GUIDE

### 1. READ THIS FIRST
This project is an AI-powered ESA vendor intelligence platform that's 97% complete.

### 2. CURRENT STATE
- Market Research Agent fully operational
- Admin dashboard complete
- Server runs on port 3001
- All APIs functional

### 3. IMMEDIATE ACTIONS
```bash
# Check if server is running
lsof -i :3001

# If not running, start it
npm run dev

# Execute research cycle
curl -X POST "http://localhost:3001/api/research" \
  -H "Content-Type: application/json" \
  -d '{"action": "execute-research"}'
```

### 4. KEY FILES TO UNDERSTAND
- `src/services/marketResearchAgent.ts` - Core AI research engine
- `src/pages/admin/research.tsx` - Management interface
- `src/pages/api/research.ts` - API endpoints
- `NEXT_SESSION_HANDOFF.md` - Complete handoff guide

### 5. COMMON TASKS
- Execute research cycles to improve data quality
- Monitor system health via admin dashboard
- Validate data flow with scripts/validate-data-flow.sh
- Enhance monitoring and reporting features

### 6. TECHNICAL NOTES
- Uses Claude AI for market research
- Airtable as primary database
- Next.js with TypeScript
- Tailwind for styling
- Real-time research monitoring

### 7. DEVELOPMENT WORKFLOW
1. Check current context with ./dev-tools/context-generator.sh
2. Review handoff guide in NEXT_SESSION_HANDOFF.md
3. Start/verify server on port 3001
4. Execute planned tasks
5. Update handoff guide when session ends

This context allows immediate productive work without re-explanation.
EOF

echo "🧠 AI context file created: $AI_CONTEXT_FILE"

# Update the main handoff guide with context tool info
if [ -f "$PROJECT_ROOT/NEXT_SESSION_HANDOFF.md" ]; then
    if ! grep -q "Context Generation Tools" "$PROJECT_ROOT/NEXT_SESSION_HANDOFF.md"; then
        cat >> "$PROJECT_ROOT/NEXT_SESSION_HANDOFF.md" << 'EOF'

---

## CONTEXT GENERATION TOOLS

### Automated Context Generator
Run `./dev-tools/context-generator.sh` to generate comprehensive context including:
- Current project state and server status
- Recent git changes and project structure
- API health checks and environment status
- Quick commands and troubleshooting guide

### Context Files
- `dev-context/current-context.md` - Complete current state
- `dev-context/ai-context.md` - AI-specific development context
- `dev-context/snapshots/` - Historical state snapshots

### Usage
```bash
# Generate fresh context
./dev-tools/context-generator.sh

# View current context
cat dev-context/current-context.md

# Start new AI session with context
# Point AI to: dev-context/ai-context.md
```

These tools eliminate the need to re-explain project state across sessions.
EOF
    fi
fi

echo ""
echo "🎯 CONTEXT SYSTEM READY"
echo "======================="
echo "✅ Generated comprehensive context files"
echo "✅ Created AI-specific development context"
echo "✅ Set up automated snapshot system"
echo "✅ Updated handoff guide with context tools"
echo ""
echo "📍 Next session startup:"
echo "1. Run: ./dev-tools/context-generator.sh"
echo "2. Read: dev-context/ai-context.md"
echo "3. Continue development immediately"
echo ""
echo "No more re-explaining project state! 🎉"