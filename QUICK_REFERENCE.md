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
