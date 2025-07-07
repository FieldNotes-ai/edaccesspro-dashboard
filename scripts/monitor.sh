#!/bin/bash

# EdAccessPro ESA Vendor Dashboard - System Health Monitor
# Monitors application health and logs status

set -e

LOG_FILE="monitor.log"
HEALTH_URL="http://localhost:3000/api/health"
DASHBOARD_URL="http://localhost:3000/dashboard"
INTERVAL=60  # Check every 60 seconds

echo "Starting EdAccessPro Dashboard Monitor..."
echo "Health checks will run every ${INTERVAL} seconds"
echo "Logs will be written to: ${LOG_FILE}"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check health endpoint
check_health() {
    local response
    local status
    
    response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "HTTP_STATUS:000")
    status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status" = "200" ]; then
        log_message "✅ Health check passed"
        return 0
    else
        log_message "❌ Health check failed - HTTP Status: $status"
        return 1
    fi
}

# Function to check dashboard accessibility
check_dashboard() {
    local status
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL" 2>/dev/null || echo "000")
    
    if [ "$status" = "200" ]; then
        log_message "✅ Dashboard accessible"
        return 0
    else
        log_message "❌ Dashboard not accessible - HTTP Status: $status"
        return 1
    fi
}

# Function to check Airtable connectivity
check_airtable() {
    local health_response
    local database_status
    
    health_response=$(curl -s "$HEALTH_URL" 2>/dev/null || echo '{"services":{"database":{"status":"error"}}}')
    database_status=$(echo "$health_response" | grep -o '"database":[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$database_status" = "healthy" ]; then
        log_message "✅ Airtable connection healthy"
        return 0
    else
        log_message "❌ Airtable connection issue - Status: $database_status"
        return 1
    fi
}

# Function to check build status
check_build() {
    local build_status
    
    if [ -d ".next" ]; then
        log_message "✅ Build directory exists"
        return 0
    else
        log_message "❌ Build directory missing"
        return 1
    fi
}

# Main monitoring loop
main() {
    log_message "Monitor started"
    
    while true; do
        log_message "Running system health checks..."
        
        local health_ok=0
        local dashboard_ok=0
        local airtable_ok=0
        local build_ok=0
        
        check_health && health_ok=1
        check_dashboard && dashboard_ok=1
        check_airtable && airtable_ok=1
        check_build && build_ok=1
        
        local total_checks=$((health_ok + dashboard_ok + airtable_ok + build_ok))
        
        if [ "$total_checks" -eq 4 ]; then
            log_message "🟢 All systems operational (4/4 checks passed)"
        elif [ "$total_checks" -ge 2 ]; then
            log_message "🟡 System partially operational ($total_checks/4 checks passed)"
        else
            log_message "🔴 System experiencing issues ($total_checks/4 checks passed)"
        fi
        
        log_message "Next check in ${INTERVAL} seconds..."
        sleep "$INTERVAL"
    done
}

# Handle script termination
cleanup() {
    log_message "Monitor stopping..."
    exit 0
}

trap cleanup SIGINT SIGTERM

main