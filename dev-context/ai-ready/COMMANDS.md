# Development Commands - AI Context

## INSTANT PRODUCTIVITY
```bash
# Complete environment setup
./dev-tools/quick-start.sh

# Execute main research task
curl -X POST "http://localhost:3001/api/research" \
  -H "Content-Type: application/json" \
  -d '{"action": "execute-research"}'

# Validate entire system
./scripts/validate-data-flow.sh
```

## DEVELOPMENT TOOLS
```bash
# Context management
./dev-tools/context-generator.sh        # Generate current context
./dev-tools/ai-context-builder.sh       # Build AI-optimized context

# Session tracking
./dev-tools/session-tracker.sh start    # Start session
./dev-tools/session-tracker.sh log "msg" # Log progress
./dev-tools/session-tracker.sh end      # End session

# Progress snapshots
./dev-tools/progress-snapshot.sh create # Create snapshot
./dev-tools/progress-snapshot.sh list   # List snapshots
```

## SERVER MANAGEMENT
```bash
# Start server
npm run dev

# Check server status
lsof -i :3001

# Kill server if needed
kill -9 $(lsof -t -i:3001)
```

## API TESTING
```bash
# Health check
curl -s "http://localhost:3001/api/health"

# Research status
curl -s "http://localhost:3001/api/research?action=status"

# Get research targets
curl -s "http://localhost:3001/api/research?action=targets"
```

## EMERGENCY RECOVERY
```bash
# Complete environment reset
npm install
./dev-tools/quick-start.sh

# Restore from snapshot
./dev-tools/progress-snapshot.sh restore <snapshot_name>

# Generate fresh context
./dev-tools/context-generator.sh
```
