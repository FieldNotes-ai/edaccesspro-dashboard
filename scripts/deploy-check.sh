#!/bin/bash

# EdAccessPro ESA Vendor Dashboard - Deployment Verification
# Verifies successful deployment and system readiness

set -e

HEALTH_URL="http://localhost:3000/api/health"
DASHBOARD_URL="http://localhost:3000/dashboard"
AIRTABLE_URL="http://localhost:3000/api/airtable?action=programs"
ANALYSIS_URL="http://localhost:3000/api/analysis"

echo "🚀 EdAccessPro Dashboard Deployment Verification"
echo "================================================"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check endpoint with retry
check_endpoint() {
    local url="$1"
    local name="$2"
    local max_retries=3
    local retry_delay=5
    
    for i in $(seq 1 $max_retries); do
        log_message "Checking $name (attempt $i/$max_retries)..."
        
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [ "$status" = "200" ]; then
            log_message "✅ $name - OK (HTTP $status)"
            return 0
        else
            log_message "❌ $name - Failed (HTTP $status)"
            if [ $i -lt $max_retries ]; then
                log_message "   Retrying in $retry_delay seconds..."
                sleep $retry_delay
            fi
        fi
    done
    
    return 1
}

# Function to verify build
verify_build() {
    log_message "Verifying build artifacts..."
    
    if [ -d ".next" ]; then
        log_message "✅ Build directory exists"
        
        if [ -f ".next/BUILD_ID" ]; then
            local build_id
            build_id=$(cat .next/BUILD_ID)
            log_message "✅ Build ID: $build_id"
        fi
        
        if [ -f ".next/routes-manifest.json" ]; then
            local routes_count
            routes_count=$(grep -c '"page"' .next/routes-manifest.json 2>/dev/null || echo "0")
            log_message "✅ Routes manifest exists ($routes_count routes)"
        fi
        
        return 0
    else
        log_message "❌ Build directory missing"
        return 1
    fi
}

# Function to verify dependencies
verify_dependencies() {
    log_message "Verifying dependencies..."
    
    if [ -f "package.json" ] && [ -d "node_modules" ]; then
        log_message "✅ Dependencies installed"
        return 0
    else
        log_message "❌ Dependencies missing"
        return 1
    fi
}

# Function to verify environment
verify_environment() {
    log_message "Verifying environment configuration..."
    
    if [ -f ".env.local" ] || [ -f ".env.production" ]; then
        log_message "✅ Environment configuration found"
        return 0
    else
        log_message "⚠️  No environment files found (using defaults)"
        return 0
    fi
}

# Function to test API functionality
test_api_functionality() {
    log_message "Testing API functionality..."
    
    # Test health endpoint
    local health_response
    health_response=$(curl -s "$HEALTH_URL" 2>/dev/null || echo '{"status":"error"}')
    
    if echo "$health_response" | grep -q '"status":"healthy"'; then
        log_message "✅ Health API returning healthy status"
    else
        log_message "❌ Health API not returning healthy status"
        return 1
    fi
    
    # Test Airtable connectivity
    local airtable_response
    airtable_response=$(curl -s "$AIRTABLE_URL" 2>/dev/null || echo '{"error":"failed"}')
    
    if echo "$airtable_response" | grep -q '"programs"'; then
        log_message "✅ Airtable API returning data"
    else
        log_message "❌ Airtable API not returning expected data"
        return 1
    fi
    
    # Test analysis cache
    local analysis_response
    analysis_response=$(curl -s -X POST "$ANALYSIS_URL" -H "Content-Type: application/json" -d '{"action":"cache_status"}' 2>/dev/null || echo '{"success":false}')
    
    if echo "$analysis_response" | grep -q '"success":true'; then
        log_message "✅ Analysis API responding correctly"
    else
        log_message "❌ Analysis API not responding correctly"
        return 1
    fi
    
    return 0
}

# Main deployment verification
main() {
    log_message "Starting deployment verification..."
    
    local checks_passed=0
    local total_checks=7
    
    # Check 1: Build verification
    if verify_build; then
        ((checks_passed++))
    fi
    
    # Check 2: Dependencies
    if verify_dependencies; then
        ((checks_passed++))
    fi
    
    # Check 3: Environment
    if verify_environment; then
        ((checks_passed++))
    fi
    
    # Check 4: Health endpoint
    if check_endpoint "$HEALTH_URL" "Health API"; then
        ((checks_passed++))
    fi
    
    # Check 5: Dashboard (handle redirect to login)
    log_message "Checking Dashboard UI..."
    local dashboard_status
    dashboard_status=$(curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL" 2>/dev/null || echo "000")
    
    if [ "$dashboard_status" = "200" ] || [ "$dashboard_status" = "307" ]; then
        log_message "✅ Dashboard UI - OK (HTTP $dashboard_status)"
        ((checks_passed++))
    else
        log_message "❌ Dashboard UI - Failed (HTTP $dashboard_status)"
    fi
    
    # Check 6: Airtable API
    if check_endpoint "$AIRTABLE_URL" "Airtable API"; then
        ((checks_passed++))
    fi
    
    # Check 7: API functionality
    if test_api_functionality; then
        ((checks_passed++))
    fi
    
    # Summary
    echo
    echo "================================================"
    log_message "Deployment verification complete"
    log_message "Checks passed: $checks_passed/$total_checks"
    
    if [ "$checks_passed" -eq "$total_checks" ]; then
        log_message "🟢 DEPLOYMENT SUCCESSFUL - All systems operational"
        echo "✅ Dashboard is ready for production use"
        exit 0
    elif [ "$checks_passed" -ge $((total_checks - 1)) ]; then
        log_message "🟡 DEPLOYMENT MOSTLY SUCCESSFUL - Minor issues detected"
        echo "⚠️  Dashboard is functional but has minor issues"
        exit 1
    else
        log_message "🔴 DEPLOYMENT FAILED - Critical issues detected"
        echo "❌ Dashboard is not ready for production use"
        exit 2
    fi
}

main