#!/bin/bash

# ESA Vendor Dashboard - Quick Start Script
# Instantly restores development environment to working state

set -e

PROJECT_ROOT="/Users/andrewlewis/Desktop/Hewitt AI Agent/esa-vendor-dashboard"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 ESA Vendor Dashboard - Quick Start${NC}"
echo "======================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "  ${GREEN}✅ $2${NC}"
    else
        echo -e "  ${RED}❌ $2${NC}"
    fi
}

# Change to project directory
cd "$PROJECT_ROOT" || {
    echo -e "${RED}❌ Cannot access project directory: $PROJECT_ROOT${NC}"
    exit 1
}

echo -e "${YELLOW}📋 Pre-flight Checks${NC}"
echo "===================="

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "  ${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "  ${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check NPM
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "  ${GREEN}✅ NPM: $NPM_VERSION${NC}"
else
    echo -e "  ${RED}❌ NPM not found${NC}"
    exit 1
fi

# Check if project files exist
if [ -f "package.json" ]; then
    echo -e "  ${GREEN}✅ Package.json found${NC}"
else
    echo -e "  ${RED}❌ Package.json not found${NC}"
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "  ${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "  ${YELLOW}⚠️  Installing dependencies...${NC}"
    npm install
    print_status $? "Dependencies installed"
fi

echo ""
echo -e "${YELLOW}🔧 Environment Setup${NC}"
echo "==================="

# Check for environment file
if [ -f ".env.local" ]; then
    echo -e "  ${GREEN}✅ Environment file found${NC}"
else
    echo -e "  ${YELLOW}⚠️  Creating .env.local template${NC}"
    cat > .env.local << 'EOF'
# ESA Vendor Dashboard Environment Variables
# Copy this file to .env.local and fill in your values

# Airtable Configuration
AIRTABLE_TOKEN=your_airtable_token_here
AIRTABLE_BASE_ID=appghnijKn2LFPbvP

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Custom API URLs
# AIRTABLE_API_URL=https://api.airtable.com/v0
# ANTHROPIC_API_URL=https://api.anthropic.com

# Development Settings
NODE_ENV=development
EOF
    echo -e "  ${YELLOW}⚠️  Please edit .env.local with your API keys${NC}"
fi

# Check if server is already running
if lsof -i :3001 >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Server already running on port 3001${NC}"
    SERVER_RUNNING=true
else
    echo -e "  ${YELLOW}⚠️  Server not running${NC}"
    SERVER_RUNNING=false
fi

echo ""
echo -e "${YELLOW}🎯 System Status${NC}"
echo "==============="

# Generate current context
if [ -f "dev-tools/context-generator.sh" ]; then
    echo -e "  ${YELLOW}📊 Generating current context...${NC}"
    ./dev-tools/context-generator.sh >/dev/null 2>&1
    echo -e "  ${GREEN}✅ Context generated${NC}"
else
    echo -e "  ${RED}❌ Context generator not found${NC}"
fi

# Check API health (if server is running)
if [ "$SERVER_RUNNING" = true ]; then
    if curl -s -f "http://localhost:3001/api/health" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Health API responsive${NC}"
    else
        echo -e "  ${RED}❌ Health API not responding${NC}"
    fi
    
    if curl -s -f "http://localhost:3001/api/research?action=status" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Research API responsive${NC}"
    else
        echo -e "  ${RED}❌ Research API not responding${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}🚀 Quick Actions${NC}"
echo "==============="

# Start server if not running
if [ "$SERVER_RUNNING" = false ]; then
    echo -e "  ${YELLOW}🔄 Starting development server...${NC}"
    echo "  (Server will start in background)"
    
    # Start server in background
    npm run dev > server.log 2>&1 &
    SERVER_PID=$!
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server started successfully
    if lsof -i :3001 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Server started successfully on port 3001${NC}"
        echo "  📝 Server PID: $SERVER_PID"
        echo "  📋 Server logs: server.log"
    else
        echo -e "  ${RED}❌ Server failed to start${NC}"
        echo "  📋 Check server.log for errors"
    fi
else
    echo -e "  ${GREEN}✅ Server already running${NC}"
fi

echo ""
echo -e "${GREEN}📚 Ready to Develop!${NC}"
echo "==================="
echo ""
echo "🌐 Application URLs:"
echo "  • Main App: http://localhost:3001"
echo "  • Admin Panel: http://localhost:3001/admin/research"
echo "  • API Health: http://localhost:3001/api/health"
echo ""
echo "🛠️  Development Tools:"
echo "  • Context Generator: ./dev-tools/context-generator.sh"
echo "  • Session Tracker: ./dev-tools/session-tracker.sh start"
echo "  • Data Validation: ./scripts/validate-data-flow.sh"
echo ""
echo "🎯 Next Steps:"
echo "  1. Read: dev-context/ai-context.md"
echo "  2. Review: NEXT_SESSION_HANDOFF.md"
echo "  3. Execute: Research cycle or planned tasks"
echo ""
echo "📊 Quick Commands:"
echo "  • Execute Research: curl -X POST 'http://localhost:3001/api/research' -H 'Content-Type: application/json' -d '{\"action\": \"execute-research\"}'"
echo "  • Check Status: curl -s 'http://localhost:3001/api/research?action=status'"
echo "  • Validate System: ./scripts/validate-data-flow.sh"
echo ""

# Create quick reference file
cat > "QUICK_REFERENCE.md" << 'EOF'
# ESA Vendor Dashboard - Quick Reference

## Development Server
- **URL**: http://localhost:3001
- **Start**: npm run dev
- **Stop**: Ctrl+C or kill process on port 3001

## Key URLs
- Main App: http://localhost:3001
- Admin Panel: http://localhost:3001/admin/research
- Health Check: http://localhost:3001/api/health

## API Commands
```bash
# Execute research cycle
curl -X POST "http://localhost:3001/api/research" \
  -H "Content-Type: application/json" \
  -d '{"action": "execute-research"}'

# Check research status
curl -s "http://localhost:3001/api/research?action=status"

# Get research targets
curl -s "http://localhost:3001/api/research?action=targets"
```

## Development Tools
```bash
# Generate context
./dev-tools/context-generator.sh

# Start session tracking
./dev-tools/session-tracker.sh start

# Validate system
./scripts/validate-data-flow.sh

# Quick start environment
./dev-tools/quick-start.sh
```

## Key Files
- `NEXT_SESSION_HANDOFF.md` - Complete session handoff
- `dev-context/ai-context.md` - AI development context
- `src/services/marketResearchAgent.ts` - Core AI system
- `src/pages/admin/research.tsx` - Admin interface

## Common Issues
- **Port in use**: `lsof -i :3001` then `kill -9 PID`
- **API timeout**: Research cycles take 2-5 minutes
- **Database error**: Check .env.local for API keys
- **Build error**: `npm install` then `npm run dev`

Generated: $(date)
EOF

echo -e "${GREEN}📋 Quick reference created: QUICK_REFERENCE.md${NC}"
echo ""
echo -e "${GREEN}🎉 Environment ready for development!${NC}"