#!/bin/bash

# EdAccessPro ESA Vendor Dashboard - System Health Monitor
# Monitors application health and logs status

set -e

LOG_FILE="monitor.log"
HEALTH_URL="http://localhost:3002/api/health"
DASHBOARD_URL="http://localhost:3002/dashboard"
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

# Function to check Airtable connectivity and fee fields
check_airtable() {
    local health_response
    local database_status
    local fee_field_health
    
    health_response=$(curl -s "$HEALTH_URL" 2>/dev/null || echo '{"services":{"database":{"status":"error"}}}')
    database_status=$(echo "$health_response" | grep -o '"database":[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$database_status" = "healthy" ]; then
        log_message "✅ Airtable connection healthy"
        
        # Check for fee field health score
        fee_field_health=$(echo "$health_response" | grep -o '"healthScore":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
        
        if [ "$fee_field_health" -ge 80 ]; then
            log_message "✅ Fee fields data quality excellent (${fee_field_health}%)"
        elif [ "$fee_field_health" -ge 60 ]; then
            log_message "⚠️  Fee fields data quality good (${fee_field_health}%)"
        elif [ "$fee_field_health" -ge 40 ]; then
            log_message "⚠️  Fee fields data quality fair (${fee_field_health}%)"
        else
            log_message "❌ Fee fields data quality poor (${fee_field_health}%)"
        fi
        
        # Extract and log specific field completeness
        local platform_fee_completeness
        local admin_fee_completeness
        local market_size_completeness
        
        platform_fee_completeness=$(echo "$health_response" | grep -o '"Platform Fee":[^}]*}' | grep -o '"completeness":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
        admin_fee_completeness=$(echo "$health_response" | grep -o '"Admin Fee":[^}]*}' | grep -o '"completeness":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
        market_size_completeness=$(echo "$health_response" | grep -o '"Market Size":[^}]*}' | grep -o '"completeness":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
        
        if [ "$platform_fee_completeness" -gt 0 ] || [ "$admin_fee_completeness" -gt 0 ] || [ "$market_size_completeness" -gt 0 ]; then
            log_message "📊 Field completeness - Platform Fee: ${platform_fee_completeness}%, Admin Fee: ${admin_fee_completeness}%, Market Size: ${market_size_completeness}%"
        fi
        
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

# Function to check Vercel deployment status
check_vercel_deployment() {
    local production_url="https://edaccesspro-dashboard.vercel.app"
    local health_endpoint="$production_url/api/health"
    local dashboard_endpoint="$production_url/dashboard"
    
    # Check if production site is accessible
    local prod_status
    prod_status=$(curl -s -o /dev/null -w "%{http_code}" "$production_url" 2>/dev/null || echo "000")
    
    if [ "$prod_status" = "200" ]; then
        log_message "✅ Vercel production site accessible"
        
        # Check if health endpoint exists on production
        local health_status
        health_status=$(curl -s -o /dev/null -w "%{http_code}" "$health_endpoint" 2>/dev/null || echo "000")
        
        if [ "$health_status" = "200" ]; then
            log_message "✅ Production health endpoint operational"
            return 0
        else
            log_message "⚠️  Production health endpoint not deployed yet (HTTP $health_status)"
            return 1
        fi
    else
        log_message "❌ Vercel production site not accessible (HTTP $prod_status)"
        return 1
    fi
}

# Function to check deployment using Vercel CLI (if authenticated)
check_vercel_cli() {
    if command -v vercel >/dev/null 2>&1; then
        local latest_deployment
        latest_deployment=$(vercel ls --json 2>/dev/null | head -1 | jq -r '.url // "none"' 2>/dev/null || echo "none")
        
        if [ "$latest_deployment" != "none" ] && [ "$latest_deployment" != "null" ]; then
            log_message "✅ Vercel CLI connected - Latest: $latest_deployment"
            
            # Get deployment status
            local deploy_status
            deploy_status=$(vercel inspect "$latest_deployment" --json 2>/dev/null | jq -r '.readyState // "unknown"' 2>/dev/null || echo "unknown")
            
            if [ "$deploy_status" = "READY" ]; then
                log_message "✅ Latest deployment ready"
                return 0
            else
                log_message "⚠️  Latest deployment status: $deploy_status"
                return 1
            fi
        else
            log_message "⚠️  Vercel CLI not authenticated or no deployments found"
            return 1
        fi
    else
        log_message "⚠️  Vercel CLI not available"
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
        local vercel_deployment_ok=0
        local vercel_cli_ok=0
        
        check_health && health_ok=1
        check_dashboard && dashboard_ok=1
        check_airtable && airtable_ok=1
        check_build && build_ok=1
        check_vercel_deployment && vercel_deployment_ok=1
        check_vercel_cli && vercel_cli_ok=1
        
        local core_checks=$((health_ok + dashboard_ok + airtable_ok + build_ok))
        local deployment_checks=$((vercel_deployment_ok + vercel_cli_ok))
        local total_checks=$((core_checks + deployment_checks))
        
        if [ "$core_checks" -eq 4 ] && [ "$deployment_checks" -ge 1 ]; then
            log_message "🟢 All systems operational ($total_checks/6 checks passed)"
        elif [ "$core_checks" -eq 4 ]; then
            log_message "🟡 Core systems operational, deployment monitoring limited ($core_checks/4 core + $deployment_checks/2 deployment)"
        elif [ "$core_checks" -ge 2 ]; then
            log_message "🟡 System partially operational ($core_checks/4 core + $deployment_checks/2 deployment)"
        else
            log_message "🔴 System experiencing issues ($core_checks/4 core + $deployment_checks/2 deployment)"
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