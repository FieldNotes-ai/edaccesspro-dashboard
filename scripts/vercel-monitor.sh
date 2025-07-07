#!/bin/bash

# EdAccessPro ESA Vendor Dashboard - Vercel Production Monitor
# Monitors production deployment on Vercel

set -e

LOG_FILE="vercel-monitor.log"
PRODUCTION_URL="https://edaccesspro-dashboard.vercel.app"
HEALTH_ENDPOINT="$PRODUCTION_URL/api/health"
DASHBOARD_ENDPOINT="$PRODUCTION_URL/dashboard"
AIRTABLE_ENDPOINT="$PRODUCTION_URL/api/airtable?action=programs"
INTERVAL=300  # Check every 5 minutes for production

echo "Starting EdAccessPro Production Monitor..."
echo "Production URL: $PRODUCTION_URL"
echo "Health checks will run every ${INTERVAL} seconds"
echo "Logs will be written to: ${LOG_FILE}"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check production health
check_production_health() {
    local response
    local status
    
    response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$HEALTH_ENDPOINT" 2>/dev/null || echo "HTTP_STATUS:000")
    status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status" = "200" ]; then
        # Parse health response
        local health_data
        health_data=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
        
        local db_status
        db_status=$(echo "$health_data" | grep -o '"database":[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        
        local build_status
        build_status=$(echo "$health_data" | grep -o '"build":[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        
        local ai_status
        ai_status=$(echo "$health_data" | grep -o '"ai":[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        
        if [ "$db_status" = "healthy" ] && [ "$build_status" = "healthy" ] && [ "$ai_status" = "healthy" ]; then
            log_message "✅ Production health check passed - All services healthy"
            return 0
        else
            log_message "⚠️  Production health check passed but some services degraded (DB:$db_status, Build:$build_status, AI:$ai_status)"
            return 1
        fi
    else
        log_message "❌ Production health check failed - HTTP Status: $status"
        return 1
    fi
}

# Function to check production dashboard
check_production_dashboard() {
    local status
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_ENDPOINT" 2>/dev/null || echo "000")
    
    if [ "$status" = "200" ] || [ "$status" = "307" ]; then
        log_message "✅ Production dashboard accessible (HTTP $status)"
        return 0
    else
        log_message "❌ Production dashboard not accessible - HTTP Status: $status"
        return 1
    fi
}

# Function to check production Airtable API
check_production_airtable() {
    local response
    local status
    
    response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$AIRTABLE_ENDPOINT" 2>/dev/null || echo "HTTP_STATUS:000")
    status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status" = "200" ]; then
        # Check if response contains program data
        if echo "$response" | grep -q '"programs"'; then
            local program_count
            program_count=$(echo "$response" | grep -o '"programs":\[[^]]*\]' | grep -o '{"id"' | wc -l 2>/dev/null || echo "0")
            log_message "✅ Production Airtable API healthy - $program_count programs loaded"
            return 0
        else
            log_message "❌ Production Airtable API returned unexpected data"
            return 1
        fi
    else
        log_message "❌ Production Airtable API failed - HTTP Status: $status"
        return 1
    fi
}

# Function to check Vercel deployment status using CLI
check_vercel_deployment_status() {
    if command -v vercel >/dev/null 2>&1; then
        local latest_deployment
        latest_deployment=$(vercel ls --json 2>/dev/null | head -1 | jq -r '.url // "none"' 2>/dev/null || echo "none")
        
        if [ "$latest_deployment" != "none" ] && [ "$latest_deployment" != "null" ]; then
            local deploy_status
            deploy_status=$(vercel inspect "$latest_deployment" --json 2>/dev/null | jq -r '.readyState // "unknown"' 2>/dev/null || echo "unknown")
            
            local deploy_age
            deploy_age=$(vercel inspect "$latest_deployment" --json 2>/dev/null | jq -r '.createdAt // "unknown"' 2>/dev/null || echo "unknown")
            
            if [ "$deploy_status" = "READY" ]; then
                log_message "✅ Vercel deployment status: READY (Created: $deploy_age)"
                return 0
            else
                log_message "⚠️  Vercel deployment status: $deploy_status"
                return 1
            fi
        else
            log_message "⚠️  Vercel CLI: No deployments found"
            return 1
        fi
    else
        log_message "⚠️  Vercel CLI not available"
        return 1
    fi
}

# Function to perform comprehensive production check
comprehensive_production_check() {
    local health_ok=0
    local dashboard_ok=0
    local airtable_ok=0
    local vercel_ok=0
    
    log_message "Running comprehensive production health check..."
    
    check_production_health && health_ok=1
    check_production_dashboard && dashboard_ok=1
    check_production_airtable && airtable_ok=1
    check_vercel_deployment_status && vercel_ok=1
    
    local total_checks=$((health_ok + dashboard_ok + airtable_ok + vercel_ok))
    
    if [ "$total_checks" -eq 4 ]; then
        log_message "🟢 PRODUCTION FULLY OPERATIONAL ($total_checks/4 checks passed)"
    elif [ "$total_checks" -eq 3 ]; then
        log_message "🟡 PRODUCTION MOSTLY OPERATIONAL ($total_checks/4 checks passed)"
    elif [ "$total_checks" -ge 2 ]; then
        log_message "🟡 PRODUCTION PARTIALLY OPERATIONAL ($total_checks/4 checks passed)"
    else
        log_message "🔴 PRODUCTION EXPERIENCING ISSUES ($total_checks/4 checks passed)"
    fi
    
    return $((4 - total_checks))
}

# Main monitoring loop
main() {
    log_message "Production monitor started for $PRODUCTION_URL"
    
    while true; do
        comprehensive_production_check
        
        log_message "Next production check in ${INTERVAL} seconds..."
        sleep "$INTERVAL"
    done
}

# Handle script termination
cleanup() {
    log_message "Production monitor stopping..."
    exit 0
}

trap cleanup SIGINT SIGTERM

main