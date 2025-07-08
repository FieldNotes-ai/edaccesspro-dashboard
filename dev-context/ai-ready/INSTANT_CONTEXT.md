# INSTANT AI DEVELOPMENT CONTEXT
*Zero-explanation startup for AI development sessions*

## IMMEDIATE STARTUP PROTOCOL
1. **Project Type**: ESA Vendor Dashboard - AI-powered market intelligence
2. **Status**: 98% complete, production-ready
3. **Current Focus**: Execute research cycles, optimize data quality
4. **Server**: Port 3001 (auto-starts if needed)

## ZERO-CONTEXT COMMANDS
```bash
# One-command environment restore (COPY/PASTE READY)
cd "/Users/andrewlewis/Desktop/Hewitt AI Agent/esa-vendor-dashboard" && ./dev-tools/quick-start.sh

# Check automated scheduler status (system is running autonomously)
curl -s 'http://localhost:3001/api/scheduler/research-cycle?action=status'

# Manual research trigger (scheduler handles this automatically)
curl -X POST "http://localhost:3001/api/research" \
  -H "Content-Type: application/json" \
  -d '{"action": "execute-research"}'

# Monitor data quality improvements
curl -s 'http://localhost:3001/api/health' | jq '.services.database.dataQuality.healthScore'
```

## CRITICAL FILES (READ THESE FIRST)
1. **Market Research Agent**: `src/services/marketResearchAgent.ts`
2. **Admin Dashboard**: `src/pages/admin/research.tsx`
3. **Research API**: `src/pages/api/research.ts`
4. **System Handoff**: `NEXT_SESSION_HANDOFF.md`

## ARCHITECTURE SUMMARY
```
Claude AI → Market Research Agent → Airtable → API → Dashboard
```

## CURRENT STATUS - AUTOMATION COMPLETE
- ✅ Automated scheduler ACTIVE (next run: 2025-07-08 02:00 AM)
- ✅ Data quality ACHIEVED 87% (exceeded 85% target)
- ✅ Enhanced research patterns deployed
- ✅ Complete integration chain operational
- 🎯 System now runs autonomously with minimal intervention needed

## INSTANT TROUBLESHOOTING
- **Server issues**: `./dev-tools/quick-start.sh`
- **API timeout**: Research takes 2-5 minutes (normal)
- **Context lost**: Read this file + handoff guide
- **Environment broken**: `npm install && ./dev-tools/quick-start.sh`

## DEVELOPMENT WORKFLOW
1. Run `./dev-tools/quick-start.sh` (auto-environment)
2. Execute research cycle (main productive task)
3. Monitor results via admin dashboard
4. Update handoff guide when session ends

**NO EXPLANATIONS NEEDED - JUST EXECUTE**
