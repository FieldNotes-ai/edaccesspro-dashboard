#!/bin/bash

# ESA Vendor Dashboard - Development Session Tracker
# Tracks development sessions and maintains development history

set -e

PROJECT_ROOT="/Users/andrewlewis/Desktop/Hewitt AI Agent/esa-vendor-dashboard"
SESSION_DIR="$PROJECT_ROOT/dev-context/sessions"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_READABLE=$(date +"%Y-%m-%d %H:%M:%S")

# Create session directory if it doesn't exist
mkdir -p "$SESSION_DIR"

# Session commands
case "${1:-help}" in
    "start")
        echo "🚀 Starting development session..."
        
        SESSION_FILE="$SESSION_DIR/session_$TIMESTAMP.md"
        
        # Create session log
        cat > "$SESSION_FILE" << EOF
# Development Session - $DATE_READABLE

## Session Info
- **Started**: $DATE_READABLE
- **Session ID**: $TIMESTAMP
- **Working Directory**: $PROJECT_ROOT

## Pre-Session State
EOF

        # Capture current git state
        echo "### Git Status" >> "$SESSION_FILE"
        echo '```' >> "$SESSION_FILE"
        cd "$PROJECT_ROOT" && git status --porcelain 2>/dev/null || echo "Not a git repository" >> "$SESSION_FILE"
        echo '```' >> "$SESSION_FILE"
        echo "" >> "$SESSION_FILE"

        # Capture server status
        echo "### Server Status" >> "$SESSION_FILE"
        if lsof -i :3001 >/dev/null 2>&1; then
            echo "- ✅ Server running on port 3001" >> "$SESSION_FILE"
        else
            echo "- ❌ Server not running" >> "$SESSION_FILE"
        fi
        echo "" >> "$SESSION_FILE"

        # Add session goals template
        cat >> "$SESSION_FILE" << 'EOF'
## Session Goals
- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Tasks Completed
- [ ] Task 1
- [ ] Task 2

## Issues Encountered
- None yet

## Decisions Made
- None yet

## Next Session Priorities
- TBD

## Session Notes
*Add notes throughout the session*

EOF

        # Create symlink to current session
        ln -sf "$SESSION_FILE" "$SESSION_DIR/current-session.md"
        
        echo "✅ Session started: $SESSION_FILE"
        echo "📝 Edit current session: $SESSION_DIR/current-session.md"
        echo ""
        echo "Commands:"
        echo "  ./dev-tools/session-tracker.sh log \"message\"  # Add log entry"
        echo "  ./dev-tools/session-tracker.sh goal \"goal\"    # Add goal"
        echo "  ./dev-tools/session-tracker.sh done \"task\"    # Mark task done"
        echo "  ./dev-tools/session-tracker.sh end              # End session"
        ;;
        
    "log")
        if [ -z "$2" ]; then
            echo "❌ Usage: ./dev-tools/session-tracker.sh log \"message\""
            exit 1
        fi
        
        CURRENT_SESSION="$SESSION_DIR/current-session.md"
        if [ ! -f "$CURRENT_SESSION" ]; then
            echo "❌ No active session. Start with: ./dev-tools/session-tracker.sh start"
            exit 1
        fi
        
        echo "- **$(date +"%H:%M")**: $2" >> "$CURRENT_SESSION"
        echo "📝 Logged: $2"
        ;;
        
    "goal")
        if [ -z "$2" ]; then
            echo "❌ Usage: ./dev-tools/session-tracker.sh goal \"goal description\""
            exit 1
        fi
        
        CURRENT_SESSION="$SESSION_DIR/current-session.md"
        if [ ! -f "$CURRENT_SESSION" ]; then
            echo "❌ No active session. Start with: ./dev-tools/session-tracker.sh start"
            exit 1
        fi
        
        # Add goal to goals section
        sed -i.bak "/## Session Goals/a\\
- [ ] $2" "$CURRENT_SESSION"
        rm "$CURRENT_SESSION.bak" 2>/dev/null || true
        
        echo "🎯 Added goal: $2"
        ;;
        
    "done")
        if [ -z "$2" ]; then
            echo "❌ Usage: ./dev-tools/session-tracker.sh done \"task description\""
            exit 1
        fi
        
        CURRENT_SESSION="$SESSION_DIR/current-session.md"
        if [ ! -f "$CURRENT_SESSION" ]; then
            echo "❌ No active session. Start with: ./dev-tools/session-tracker.sh start"
            exit 1
        fi
        
        # Add completed task
        sed -i.bak "/## Tasks Completed/a\\
- [x] $2 *($(date +"%H:%M"))*" "$CURRENT_SESSION"
        rm "$CURRENT_SESSION.bak" 2>/dev/null || true
        
        echo "✅ Completed: $2"
        ;;
        
    "end")
        CURRENT_SESSION="$SESSION_DIR/current-session.md"
        if [ ! -f "$CURRENT_SESSION" ]; then
            echo "❌ No active session to end"
            exit 1
        fi
        
        # Add end time and summary
        echo "" >> "$CURRENT_SESSION"
        echo "## Session End" >> "$CURRENT_SESSION"
        echo "- **Ended**: $(date +"%Y-%m-%d %H:%M:%S")" >> "$CURRENT_SESSION"
        echo "- **Duration**: Started at session creation time" >> "$CURRENT_SESSION"
        echo "" >> "$CURRENT_SESSION"
        
        # Capture final git state
        echo "### Final Git Status" >> "$CURRENT_SESSION"
        echo '```' >> "$CURRENT_SESSION"
        cd "$PROJECT_ROOT" && git status --porcelain 2>/dev/null || echo "Not a git repository" >> "$CURRENT_SESSION"
        echo '```' >> "$CURRENT_SESSION"
        echo "" >> "$CURRENT_SESSION"
        
        # Add to session history
        HISTORY_FILE="$SESSION_DIR/session-history.md"
        if [ ! -f "$HISTORY_FILE" ]; then
            echo "# Development Session History" > "$HISTORY_FILE"
            echo "" >> "$HISTORY_FILE"
        fi
        
        echo "## Session $(basename "$CURRENT_SESSION" .md)" >> "$HISTORY_FILE"
        echo "- **Date**: $DATE_READABLE" >> "$HISTORY_FILE"
        echo "- **File**: $(basename "$CURRENT_SESSION")" >> "$HISTORY_FILE"
        echo "" >> "$HISTORY_FILE"
        
        # Remove current session symlink
        rm "$CURRENT_SESSION" 2>/dev/null || true
        
        echo "🏁 Session ended and logged to history"
        echo "📚 View history: $HISTORY_FILE"
        ;;
        
    "status")
        CURRENT_SESSION="$SESSION_DIR/current-session.md"
        if [ -f "$CURRENT_SESSION" ]; then
            echo "📊 Current Session Status:"
            echo "========================"
            
            # Show session info
            grep -A 10 "## Session Info" "$CURRENT_SESSION" | head -15
            
            # Show goals
            echo ""
            echo "🎯 Goals:"
            grep -A 20 "## Session Goals" "$CURRENT_SESSION" | grep "^- \[" | head -10
            
            # Show completed tasks
            echo ""
            echo "✅ Completed:"
            grep -A 20 "## Tasks Completed" "$CURRENT_SESSION" | grep "^- \[x\]" | head -10
            
        else
            echo "❌ No active session"
            echo "Start with: ./dev-tools/session-tracker.sh start"
        fi
        ;;
        
    "history")
        HISTORY_FILE="$SESSION_DIR/session-history.md"
        if [ -f "$HISTORY_FILE" ]; then
            echo "📚 Session History:"
            echo "=================="
            tail -50 "$HISTORY_FILE"
        else
            echo "📚 No session history yet"
        fi
        ;;
        
    "help"|*)
        echo "🔧 Development Session Tracker"
        echo "=============================="
        echo ""
        echo "Commands:"
        echo "  start           # Start new development session"
        echo "  log \"message\"   # Add timestamped log entry"
        echo "  goal \"goal\"     # Add session goal"
        echo "  done \"task\"     # Mark task as completed"
        echo "  end             # End current session"
        echo "  status          # Show current session status"
        echo "  history         # Show session history"
        echo "  help            # Show this help"
        echo ""
        echo "Example workflow:"
        echo "  ./dev-tools/session-tracker.sh start"
        echo "  ./dev-tools/session-tracker.sh goal \"Fix API timeout issues\""
        echo "  ./dev-tools/session-tracker.sh log \"Started investigating timeout\""
        echo "  ./dev-tools/session-tracker.sh done \"Identified root cause\""
        echo "  ./dev-tools/session-tracker.sh end"
        ;;
esac