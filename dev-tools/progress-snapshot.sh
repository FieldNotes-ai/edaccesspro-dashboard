#!/bin/bash

# ESA Vendor Dashboard - Progress Snapshot System
# Creates comprehensive project snapshots for restoration points

set -e

PROJECT_ROOT="/Users/andrewlewis/Desktop/Hewitt AI Agent/esa-vendor-dashboard"
SNAPSHOT_DIR="$PROJECT_ROOT/dev-context/snapshots"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_READABLE=$(date +"%Y-%m-%d %H:%M:%S")

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}📸 Progress Snapshot System${NC}"
echo "=========================="

# Create snapshot directory
mkdir -p "$SNAPSHOT_DIR"

case "${1:-create}" in
    "create")
        SNAPSHOT_NAME="${2:-auto_$TIMESTAMP}"
        SNAPSHOT_FILE="$SNAPSHOT_DIR/$SNAPSHOT_NAME.md"
        
        echo -e "${YELLOW}📸 Creating snapshot: $SNAPSHOT_NAME${NC}"
        
        # Create comprehensive snapshot
        cat > "$SNAPSHOT_FILE" << EOF
# Progress Snapshot - $SNAPSHOT_NAME
*Created: $DATE_READABLE*

## Project Status
- **Snapshot ID**: $SNAPSHOT_NAME
- **Creation Date**: $DATE_READABLE
- **Working Directory**: $PROJECT_ROOT

## Git State
EOF

        # Capture git information
        echo '```' >> "$SNAPSHOT_FILE"
        cd "$PROJECT_ROOT" && {
            echo "Branch: $(git branch --show-current 2>/dev/null || echo 'Not a git repo')"
            echo "Status:"
            git status --porcelain 2>/dev/null || echo "No git repository"
            echo ""
            echo "Recent commits:"
            git log --oneline -5 2>/dev/null || echo "No git history"
        } >> "$SNAPSHOT_FILE"
        echo '```' >> "$SNAPSHOT_FILE"
        echo "" >> "$SNAPSHOT_FILE"

        # Capture system state
        echo "## System State" >> "$SNAPSHOT_FILE"
        echo "- **Node Version**: $(node --version 2>/dev/null || echo 'N/A')" >> "$SNAPSHOT_FILE"
        echo "- **NPM Version**: $(npm --version 2>/dev/null || echo 'N/A')" >> "$SNAPSHOT_FILE"
        
        # Check server status
        if lsof -i :3001 >/dev/null 2>&1; then
            echo "- **Server Status**: ✅ Running on port 3001" >> "$SNAPSHOT_FILE"
        else
            echo "- **Server Status**: ❌ Not running" >> "$SNAPSHOT_FILE"
        fi
        
        # Check API health
        if curl -s -f "http://localhost:3001/api/health" >/dev/null 2>&1; then
            echo "- **API Health**: ✅ Responsive" >> "$SNAPSHOT_FILE"
        else
            echo "- **API Health**: ❌ Not responding" >> "$SNAPSHOT_FILE"
        fi
        
        echo "" >> "$SNAPSHOT_FILE"

        # Capture package.json state
        echo "## Dependencies" >> "$SNAPSHOT_FILE"
        echo '```json' >> "$SNAPSHOT_FILE"
        if [ -f "package.json" ]; then
            cd "$PROJECT_ROOT" && jq '.dependencies' package.json 2>/dev/null || echo "Could not read package.json"
        else
            echo "No package.json found"
        fi >> "$SNAPSHOT_FILE"
        echo '```' >> "$SNAPSHOT_FILE"
        echo "" >> "$SNAPSHOT_FILE"

        # Capture environment state
        echo "## Environment" >> "$SNAPSHOT_FILE"
        if [ -f ".env.local" ]; then
            echo "- ✅ .env.local exists" >> "$SNAPSHOT_FILE"
            echo "- Environment variables configured: $(grep -v '^#' .env.local | grep -c '=' 2>/dev/null || echo 0)" >> "$SNAPSHOT_FILE"
        else
            echo "- ❌ .env.local not found" >> "$SNAPSHOT_FILE"
        fi
        echo "" >> "$SNAPSHOT_FILE"

        # Capture current tasks from handoff
        echo "## Current Tasks" >> "$SNAPSHOT_FILE"
        if [ -f "NEXT_SESSION_HANDOFF.md" ]; then
            echo "*(From handoff guide)*" >> "$SNAPSHOT_FILE"
            echo "" >> "$SNAPSHOT_FILE"
            grep -A 10 "IMMEDIATE TASKS" "NEXT_SESSION_HANDOFF.md" >> "$SNAPSHOT_FILE" 2>/dev/null || echo "No immediate tasks found" >> "$SNAPSHOT_FILE"
        else
            echo "No handoff guide found" >> "$SNAPSHOT_FILE"
        fi
        echo "" >> "$SNAPSHOT_FILE"

        # Capture project structure
        echo "## Project Structure" >> "$SNAPSHOT_FILE"
        echo '```' >> "$SNAPSHOT_FILE"
        cd "$PROJECT_ROOT" && find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" | grep -E "(src/|scripts/|dev-tools/)" | sort >> "$SNAPSHOT_FILE"
        echo '```' >> "$SNAPSHOT_FILE"
        echo "" >> "$SNAPSHOT_FILE"

        # Capture recent changes
        echo "## Recent Changes" >> "$SNAPSHOT_FILE"
        echo "*(Files modified in last 24 hours)*" >> "$SNAPSHOT_FILE"
        echo '```' >> "$SNAPSHOT_FILE"
        cd "$PROJECT_ROOT" && find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.md" | xargs ls -lt 2>/dev/null | head -10 >> "$SNAPSHOT_FILE"
        echo '```' >> "$SNAPSHOT_FILE"
        echo "" >> "$SNAPSHOT_FILE"

        # Add restoration instructions
        cat >> "$SNAPSHOT_FILE" << 'EOF'
## Restoration Instructions
To restore this state:
1. Review git status and restore files if needed
2. Run: `npm install` to restore dependencies
3. Run: `./dev-tools/quick-start.sh` to restore environment
4. Check server status and start if needed
5. Review handoff guide for current tasks

## Snapshot Metadata
- **Created by**: Progress Snapshot System
- **Purpose**: Development state preservation
- **Next Steps**: Continue with tasks from handoff guide
EOF

        echo -e "${GREEN}✅ Snapshot created: $SNAPSHOT_FILE${NC}"
        
        # Update snapshot index
        SNAPSHOT_INDEX="$SNAPSHOT_DIR/index.md"
        if [ ! -f "$SNAPSHOT_INDEX" ]; then
            echo "# Progress Snapshots Index" > "$SNAPSHOT_INDEX"
            echo "" >> "$SNAPSHOT_INDEX"
        fi
        
        echo "- **$SNAPSHOT_NAME** - $DATE_READABLE" >> "$SNAPSHOT_INDEX"
        
        # Keep only last 20 snapshots
        SNAPSHOT_COUNT=$(ls -1 "$SNAPSHOT_DIR"/*.md 2>/dev/null | wc -l)
        if [ "$SNAPSHOT_COUNT" -gt 20 ]; then
            echo -e "${YELLOW}🧹 Cleaning old snapshots (keeping last 20)${NC}"
            cd "$SNAPSHOT_DIR" && ls -t *.md | tail -n +21 | xargs rm -f 2>/dev/null || true
        fi
        
        echo -e "${GREEN}📋 View snapshot: $SNAPSHOT_FILE${NC}"
        ;;
        
    "list")
        echo -e "${YELLOW}📋 Available Snapshots${NC}"
        echo "====================="
        
        if [ -f "$SNAPSHOT_DIR/index.md" ]; then
            tail -20 "$SNAPSHOT_DIR/index.md"
        else
            echo "No snapshots found"
        fi
        ;;
        
    "restore")
        SNAPSHOT_NAME="$2"
        if [ -z "$SNAPSHOT_NAME" ]; then
            echo -e "${RED}❌ Usage: ./dev-tools/progress-snapshot.sh restore <snapshot_name>${NC}"
            echo -e "${YELLOW}Available snapshots:${NC}"
            ls -1 "$SNAPSHOT_DIR"/*.md 2>/dev/null | basename -s .md || echo "No snapshots found"
            exit 1
        fi
        
        SNAPSHOT_FILE="$SNAPSHOT_DIR/$SNAPSHOT_NAME.md"
        if [ ! -f "$SNAPSHOT_FILE" ]; then
            echo -e "${RED}❌ Snapshot not found: $SNAPSHOT_NAME${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}🔄 Restoring snapshot: $SNAPSHOT_NAME${NC}"
        echo "======================================"
        
        # Show restoration instructions
        echo -e "${GREEN}📋 Restoration Instructions:${NC}"
        grep -A 20 "## Restoration Instructions" "$SNAPSHOT_FILE" | grep -v "^## " | head -20
        
        echo ""
        echo -e "${YELLOW}Would you like to run automatic restoration? (y/N):${NC}"
        read -r CONFIRM
        
        if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
            echo -e "${YELLOW}🔄 Running automatic restoration...${NC}"
            
            # Run quick start to restore environment
            if [ -f "dev-tools/quick-start.sh" ]; then
                ./dev-tools/quick-start.sh
            else
                echo -e "${RED}❌ Quick start script not found${NC}"
            fi
            
            echo -e "${GREEN}✅ Restoration complete${NC}"
        else
            echo -e "${YELLOW}ℹ️  Manual restoration required${NC}"
        fi
        ;;
        
    "auto")
        # Auto-snapshot with meaningful name
        ACTIVITY="general"
        if [ -n "$2" ]; then
            ACTIVITY="$2"
        fi
        
        SNAPSHOT_NAME="auto_${ACTIVITY}_$TIMESTAMP"
        "$0" create "$SNAPSHOT_NAME"
        ;;
        
    "help"|*)
        echo -e "${GREEN}📸 Progress Snapshot System${NC}"
        echo "=========================="
        echo ""
        echo "Commands:"
        echo "  create [name]           # Create snapshot with optional name"
        echo "  list                    # List available snapshots"
        echo "  restore <name>          # Restore from snapshot"
        echo "  auto [activity]         # Auto-snapshot with activity name"
        echo "  help                    # Show this help"
        echo ""
        echo "Examples:"
        echo "  ./dev-tools/progress-snapshot.sh create"
        echo "  ./dev-tools/progress-snapshot.sh create \"before_api_changes\""
        echo "  ./dev-tools/progress-snapshot.sh auto \"research_agent_update\""
        echo "  ./dev-tools/progress-snapshot.sh list"
        echo "  ./dev-tools/progress-snapshot.sh restore auto_20231207_143022"
        echo ""
        echo "Use cases:"
        echo "  • Before major changes"
        echo "  • After completing features"
        echo "  • Before experimental work"
        echo "  • Daily progress checkpoints"
        ;;
esac