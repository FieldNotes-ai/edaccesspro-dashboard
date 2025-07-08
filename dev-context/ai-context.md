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
