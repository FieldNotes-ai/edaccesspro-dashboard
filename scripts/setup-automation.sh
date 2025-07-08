#!/bin/bash

# ESA Vendor Dashboard - Automated Research Cycle Setup
# Sets up cron jobs and automated scheduling for research cycles

set -e

# Configuration
APP_URL="http://localhost:3001"
LOG_FILE="automation.log"
CRON_LOG_FILE="cron-research.log"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ESA Vendor Dashboard - Automation Setup${NC}"
echo "========================================"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check if server is running
check_server() {
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" 2>/dev/null || echo "000")
    
    if [ "$status" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Function to setup internal scheduler (recommended)
setup_internal_scheduler() {
    echo -e "\n${YELLOW}🔧 Setting up internal scheduler...${NC}"
    
    if ! check_server; then
        echo -e "${RED}❌ Server not running. Please start with: npm run dev${NC}"
        return 1
    fi
    
    # Configure daily research cycle at 2 AM
    local config_payload='{
        "action": "start",
        "config": {
            "interval": "daily",
            "time": "02:00",
            "qualityThreshold": 70,
            "enabled": true
        }
    }'
    
    local response
    response=$(curl -s -X POST "$APP_URL/api/scheduler/research-cycle" \
        -H "Content-Type: application/json" \
        -d "$config_payload" 2>/dev/null || echo '{"success":false}')
    
    local success
    success=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2 2>/dev/null || echo "false")
    
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✅ Internal scheduler configured successfully${NC}"
        echo "   • Daily research cycles at 2:00 AM"
        echo "   • Quality threshold: 70% (runs only if below)"
        echo "   • Monitor at: $APP_URL/admin/research"
        log_message "Internal scheduler configured successfully"
        return 0
    else
        echo -e "${RED}❌ Failed to configure internal scheduler${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to setup cron job (alternative method)
setup_cron_job() {
    echo -e "\n${YELLOW}🔧 Setting up cron job (alternative method)...${NC}"
    
    # Create the cron script
    local cron_script="$(pwd)/scripts/cron-research-cycle.sh"
    
    cat > "$cron_script" << 'EOF'
#!/bin/bash

# ESA Research Cycle - Cron Job Script
# This script is called by cron to trigger research cycles

APP_URL="http://localhost:3001"
LOG_FILE="$(dirname "$0")/cron-research.log"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if server is running
if ! curl -s "$APP_URL/api/health" > /dev/null 2>&1; then
    log_message "❌ Server not running - skipping research cycle"
    exit 1
fi

# Trigger research cycle
log_message "🚀 Starting scheduled research cycle..."

response=$(curl -s -X POST "$APP_URL/api/research" \
    -H "Content-Type: application/json" \
    -d '{"action": "execute-research"}' 2>/dev/null || echo '{"success":false}')

success=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2 2>/dev/null || echo "false")

if [ "$success" = "true" ]; then
    log_message "✅ Research cycle completed successfully"
    
    # Extract results for logging
    programs_researched=$(echo "$response" | grep -o '"programsResearched":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
    before_score=$(echo "$response" | grep -o '"beforeScore":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
    after_score=$(echo "$response" | grep -o '"afterScore":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
    
    log_message "📊 Results: $programs_researched programs, quality $before_score% → $after_score%"
else
    log_message "❌ Research cycle failed"
    log_message "Response: $response"
fi
EOF

    chmod +x "$cron_script"
    
    # Show cron job options
    echo -e "${BLUE}Cron job script created at: $cron_script${NC}"
    echo ""
    echo "To add to crontab, choose one of these schedules:"
    echo ""
    echo "• Daily at 2 AM:"
    echo "  0 2 * * * $cron_script"
    echo ""
    echo "• Every 6 hours:"
    echo "  0 */6 * * * $cron_script"
    echo ""
    echo "• Weekly on Sunday at 2 AM:"
    echo "  0 2 * * 0 $cron_script"
    echo ""
    echo "To install, run: crontab -e"
    echo "Then add one of the lines above."
    
    log_message "Cron job script created at $cron_script"
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "\n${YELLOW}🔧 Setting up monitoring enhancements...${NC}"
    
    # Update the monitor script to include scheduler status
    local monitor_script="$(pwd)/scripts/monitor.sh"
    
    if [ -f "$monitor_script" ]; then
        # Add scheduler monitoring function
        if ! grep -q "check_scheduler" "$monitor_script"; then
            cat >> "$monitor_script" << 'EOF'

# Function to check scheduler status
check_scheduler() {
    local scheduler_response
    local scheduler_status
    
    scheduler_response=$(curl -s "$HEALTH_URL/../scheduler/research-cycle?action=status" 2>/dev/null || echo '{"scheduler":{"isActive":false}}')
    scheduler_status=$(echo "$scheduler_response" | grep -o '"isActive":[^,]*' | cut -d':' -f2 2>/dev/null || echo "false")
    
    if [ "$scheduler_status" = "true" ]; then
        log_message "✅ Research scheduler active"
        
        # Get next run time
        local next_run
        next_run=$(echo "$scheduler_response" | grep -o '"nextRun":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        if [ "$next_run" != "unknown" ] && [ "$next_run" != "null" ]; then
            log_message "⏰ Next research cycle: $next_run"
        fi
        
        return 0
    else
        log_message "⚠️  Research scheduler not active"
        return 1
    fi
}
EOF

            # Add scheduler check to main monitoring loop
            sed -i.bak 's/check_vercel_cli && vercel_cli_ok=1/check_vercel_cli \&\& vercel_cli_ok=1\
        check_scheduler \&\& scheduler_ok=1/' "$monitor_script"
            
            sed -i.bak 's/local deployment_checks=$((vercel_deployment_ok + vercel_cli_ok))/local scheduler_checks=$((scheduler_ok))\
        local deployment_checks=$((vercel_deployment_ok + vercel_cli_ok))/' "$monitor_script"
            
            echo -e "${GREEN}✅ Enhanced monitoring with scheduler status${NC}"
        else
            echo -e "${BLUE}ℹ️  Monitor script already includes scheduler monitoring${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Monitor script not found - skipping monitoring enhancement${NC}"
    fi
}

# Function to test automation
test_automation() {
    echo -e "\n${YELLOW}🧪 Testing automation setup...${NC}"
    
    if ! check_server; then
        echo -e "${RED}❌ Server not running - cannot test${NC}"
        return 1
    fi
    
    # Test scheduler status
    local status_response
    status_response=$(curl -s "$APP_URL/api/scheduler/research-cycle?action=status" 2>/dev/null || echo '{"success":false}')
    
    local scheduler_active
    scheduler_active=$(echo "$status_response" | grep -o '"isActive":[^,]*' | cut -d':' -f2 2>/dev/null || echo "false")
    
    if [ "$scheduler_active" = "true" ]; then
        echo -e "${GREEN}✅ Scheduler is active and configured${NC}"
        
        # Get configuration details
        local interval
        local next_run
        interval=$(echo "$status_response" | grep -o '"interval":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        next_run=$(echo "$status_response" | grep -o '"nextRun":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        
        echo "   • Interval: $interval"
        echo "   • Next run: $next_run"
        
        # Test manual trigger
        echo -e "\n${BLUE}Testing manual trigger...${NC}"
        local trigger_response
        trigger_response=$(curl -s -X POST "$APP_URL/api/scheduler/research-cycle" \
            -H "Content-Type: application/json" \
            -d '{"action": "trigger-now"}' 2>/dev/null || echo '{"success":false}')
        
        local trigger_success
        trigger_success=$(echo "$trigger_response" | grep -o '"success":[^,]*' | cut -d':' -f2 2>/dev/null || echo "false")
        
        if [ "$trigger_success" = "true" ]; then
            echo -e "${GREEN}✅ Manual trigger test successful${NC}"
        else
            echo -e "${RED}❌ Manual trigger test failed${NC}"
        fi
    else
        echo -e "${RED}❌ Scheduler is not active${NC}"
        return 1
    fi
}

# Main menu
main() {
    echo ""
    echo "Choose setup method:"
    echo "1) Internal Scheduler (Recommended)"
    echo "2) Cron Job Setup"
    echo "3) Both Methods"
    echo "4) Test Current Setup"
    echo "5) Setup Monitoring Only"
    echo ""
    read -p "Enter choice (1-5): " choice
    
    case $choice in
        1)
            setup_internal_scheduler
            setup_monitoring
            test_automation
            ;;
        2)
            setup_cron_job
            setup_monitoring
            ;;
        3)
            setup_internal_scheduler
            setup_cron_job
            setup_monitoring
            test_automation
            ;;
        4)
            test_automation
            ;;
        5)
            setup_monitoring
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Automation setup complete!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "• Monitor at: $APP_URL/admin/research"
    echo "• Check logs: tail -f $LOG_FILE"
    echo "• View cron logs: tail -f $CRON_LOG_FILE"
    echo "• Test manual trigger: curl -X POST '$APP_URL/api/scheduler/research-cycle' -d '{\"action\":\"trigger-now\"}'"
}

# Handle script termination
cleanup() {
    log_message "Setup script terminated"
    exit 0
}

trap cleanup SIGINT SIGTERM

main "$@"