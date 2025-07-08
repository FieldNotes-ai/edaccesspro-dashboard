/**
 * Google Apps Script for ESA Vendor Dashboard Cost Monitoring
 * Deploy this to Google Apps Script (script.google.com)
 * Free tier: Unlimited usage for personal use
 */

// Configuration
const SHEET_NAME = 'ESA Cost Monitoring';
const WEBHOOK_URL = 'YOUR_GITHUB_WEBHOOK_URL'; // Optional: for alerts

/**
 * Initialize the cost monitoring spreadsheet
 */
function initializeCostSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Set up headers
  const headers = [
    'Date',
    'Airtable API Calls',
    'Claude API Calls', 
    'GitHub Actions Minutes',
    'Cloudflare Requests',
    'Total Cost ($)',
    'Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // Date
  sheet.setColumnWidth(2, 120); // Airtable
  sheet.setColumnWidth(3, 120); // Claude
  sheet.setColumnWidth(4, 140); // GitHub
  sheet.setColumnWidth(5, 130); // Cloudflare
  sheet.setColumnWidth(6, 100); // Cost
  sheet.setColumnWidth(7, 200); // Notes
  
  Logger.log('Cost monitoring sheet initialized');
}

/**
 * Add daily metrics (called by GitHub Actions via webhook)
 */
function addDailyMetrics(date, airtableAPICalls, claudeAPICalls, githubMinutes, cloudflareRequests, totalCost, notes = '') {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    initializeCostSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }
  
  // Add new row
  const newRow = [
    new Date(date),
    airtableAPICalls,
    claudeAPICalls,
    githubMinutes,
    cloudflareRequests,
    totalCost,
    notes
  ];
  
  sheet.appendRow(newRow);
  
  // Format the new row
  const lastRow = sheet.getLastRow();
  
  // Format date
  sheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd');
  
  // Format cost as currency
  sheet.getRange(lastRow, 6).setNumberFormat('$#,##0.00');
  
  // Add conditional formatting for high usage
  addConditionalFormatting(sheet, lastRow);
  
  Logger.log(`Added metrics for ${date}`);
  
  // Check for alerts
  checkCostAlerts(airtableAPICalls, totalCost);
}

/**
 * Add conditional formatting for cost alerts
 */
function addConditionalFormatting(sheet, row) {
  // Highlight high Airtable usage (>800 calls)
  const airtableRange = sheet.getRange(row, 2);
  if (airtableRange.getValue() > 800) {
    airtableRange.setBackground('#ffeb3b'); // Yellow
  }
  
  // Highlight high daily cost (>$1)
  const costRange = sheet.getRange(row, 6);
  if (costRange.getValue() > 1.0) {
    costRange.setBackground('#ff9800'); // Orange
  }
  
  // Highlight very high daily cost (>$5)
  if (costRange.getValue() > 5.0) {
    costRange.setBackground('#f44336'); // Red
    costRange.setFontColor('white');
  }
}

/**
 * Check for cost alerts and send notifications
 */
function checkCostAlerts(airtableAPICalls, totalCost) {
  const alerts = [];
  
  // Check Airtable usage (80% of free tier)
  if (airtableAPICalls > 800) {
    alerts.push(`High Airtable usage: ${airtableAPICalls} calls (80% of free tier)`);
  }
  
  // Check daily cost
  if (totalCost > 1.0) {
    alerts.push(`High daily cost: $${totalCost.toFixed(2)}`);
  }
  
  // Estimate monthly cost
  const monthlyEstimate = totalCost * 30;
  if (monthlyEstimate > 20.0) {
    alerts.push(`High monthly estimate: $${monthlyEstimate.toFixed(2)}`);
  }
  
  if (alerts.length > 0) {
    sendCostAlert(alerts);
  }
}

/**
 * Send cost alert notifications
 */
function sendCostAlert(alerts) {
  const message = `🚨 ESA Dashboard Cost Alert:\n\n${alerts.join('\n')}`;
  
  // Log the alert
  Logger.log(message);
  
  // Send email alert (if configured)
  const email = PropertiesService.getScriptProperties().getProperty('ALERT_EMAIL');
  if (email) {
    MailApp.sendEmail({
      to: email,
      subject: 'ESA Dashboard - Cost Alert',
      body: message
    });
  }
  
  // Send to webhook (if configured)
  if (WEBHOOK_URL && WEBHOOK_URL !== 'YOUR_GITHUB_WEBHOOK_URL') {
    try {
      UrlFetchApp.fetch(WEBHOOK_URL, {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify({
          text: message,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      Logger.log(`Failed to send webhook: ${error}`);
    }
  }
}

/**
 * Generate monthly cost summary
 */
function generateMonthlySummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    Logger.log('No cost data found');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // Get current month data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyData = rows.filter(row => {
    const date = new Date(row[0]);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  if (monthlyData.length === 0) {
    Logger.log('No data for current month');
    return;
  }
  
  // Calculate totals
  const totals = {
    airtableAPICalls: monthlyData.reduce((sum, row) => sum + (row[1] || 0), 0),
    claudeAPICalls: monthlyData.reduce((sum, row) => sum + (row[2] || 0), 0),
    githubMinutes: monthlyData.reduce((sum, row) => sum + (row[3] || 0), 0),
    cloudflareRequests: monthlyData.reduce((sum, row) => sum + (row[4] || 0), 0),
    totalCost: monthlyData.reduce((sum, row) => sum + (row[5] || 0), 0)
  };
  
  // Create summary
  const summary = `
📊 Monthly Cost Summary (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})

Usage:
• Airtable API: ${totals.airtableAPICalls} calls
• Claude API: ${totals.claudeAPICalls} calls  
• GitHub Actions: ${totals.githubMinutes} minutes
• Cloudflare: ${totals.cloudflareRequests} requests

Total Cost: $${totals.totalCost.toFixed(2)}
Average Daily: $${(totals.totalCost / monthlyData.length).toFixed(2)}

Free Tier Status:
• Airtable: ${totals.airtableAPICalls}/1000 calls (${(totals.airtableAPICalls/1000*100).toFixed(1)}%)
• GitHub: ${totals.githubMinutes}/2000 minutes (${(totals.githubMinutes/2000*100).toFixed(1)}%)
• Cloudflare: Well within limits
`;
  
  Logger.log(summary);
  
  // Add summary to sheet
  const summarySheet = ss.getSheetByName('Monthly Summary') || ss.insertSheet('Monthly Summary');
  const summaryRow = [
    new Date(),
    `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    totals.airtableAPICalls,
    totals.claudeAPICalls,
    totals.githubMinutes,
    totals.cloudflareRequests,
    totals.totalCost
  ];
  
  summarySheet.appendRow(summaryRow);
  
  return summary;
}

/**
 * Set up automated triggers
 */
function setupTriggers() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  // Monthly summary trigger (1st of each month)
  ScriptApp.newTrigger('generateMonthlySummary')
    .timeBased()
    .onMonthDay(1)
    .atHour(9)
    .create();
  
  Logger.log('Triggers set up successfully');
}

/**
 * Web app endpoint for receiving data from GitHub Actions
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    addDailyMetrics(
      data.date,
      data.airtable_api_calls,
      data.claude_api_calls,
      data.github_actions_minutes,
      data.cloudflare_requests,
      data.estimated_costs.total,
      data.notes || ''
    );
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log(`Error processing webhook: ${error}`);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Setup function - run this once to initialize everything
 */
function setup() {
  initializeCostSheet();
  setupTriggers();
  
  // Set properties
  const properties = PropertiesService.getScriptProperties();
  properties.setProperties({
    'ALERT_EMAIL': 'your-email@example.com', // Change this
    'SETUP_DATE': new Date().toISOString()
  });
  
  Logger.log('Setup completed successfully');
  Logger.log('Deploy as web app and use the URL in your GitHub Actions workflow');
}