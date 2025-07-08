const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function auditDashboard() {
  console.log('🔍 Starting dashboard audit...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capture network requests and errors
  const networkRequests = [];
  const consoleErrors = [];
  const jsErrors = [];
  
  page.on('request', (request) => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });
  
  page.on('requestfailed', (request) => {
    console.log('❌ Failed request:', request.url(), request.failure().errorText);
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('⚠️  Console error:', msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    jsErrors.push(error.message);
    console.log('💥 JS error:', error.message);
  });
  
  try {
    console.log('📱 Loading login page...');
    await page.goto('http://localhost:3001/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Login with password
    console.log('🔑 Logging in...');
    await page.type('input[type="password"]', 'hewitt2025');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Navigate to dashboard
    console.log('📊 Loading dashboard...');
    await page.goto('http://localhost:3001/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot
    await page.screenshot({ 
      path: 'dashboard-audit-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved');
    
    // Extract dashboard data
    const dashboardData = await page.evaluate(() => {
      const data = {
        title: document.title,
        errors: [],
        tables: [],
        stats: [],
        loadingSpinners: [],
        emptyStates: []
      };
      
      // Check for loading spinners
      const spinners = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="Loading"]');
      data.loadingSpinners = Array.from(spinners).map(el => ({
        element: el.tagName,
        class: el.className,
        text: el.textContent?.trim()
      }));
      
      // Check for error messages
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .text-red-500, .text-red-600');
      data.errors = Array.from(errorElements).map(el => ({
        element: el.tagName,
        class: el.className,
        text: el.textContent?.trim()
      }));
      
      // Extract table data
      const tables = document.querySelectorAll('table');
      data.tables = Array.from(tables).map((table, index) => {
        const rows = table.querySelectorAll('tbody tr');
        return {
          index,
          rowCount: rows.length,
          headers: Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim()),
          hasData: rows.length > 0,
          firstRowData: rows.length > 0 ? Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent?.trim()) : []
        };
      });
      
      // Extract stats/metrics
      const statElements = document.querySelectorAll('[class*="stat"], [class*="metric"], [class*="count"], .text-2xl, .text-3xl, .text-4xl');
      data.stats = Array.from(statElements).map(el => ({
        element: el.tagName,
        class: el.className,
        text: el.textContent?.trim(),
        value: el.textContent?.trim().match(/[\d,]+/)?.[0]
      }));
      
      // Check for empty states
      const emptyElements = document.querySelectorAll('[class*="empty"], [class*="no-data"], [class*="NoData"]');
      data.emptyStates = Array.from(emptyElements).map(el => ({
        element: el.tagName,
        class: el.className,
        text: el.textContent?.trim()
      }));
      
      return data;
    });
    
    // Save audit data
    const auditResults = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3001',
      networkRequests: networkRequests.slice(0, 50), // Limit to first 50
      consoleErrors,
      jsErrors,
      dashboardData
    };
    
    fs.writeFileSync('dashboard-audit-data.json', JSON.stringify(auditResults, null, 2));
    console.log('💾 Audit data saved');
    
    console.log('\n📊 Audit Summary:');
    console.log(`- Network requests: ${networkRequests.length}`);
    console.log(`- Console errors: ${consoleErrors.length}`);
    console.log(`- JS errors: ${jsErrors.length}`);
    console.log(`- Tables found: ${dashboardData.tables.length}`);
    console.log(`- Loading spinners: ${dashboardData.loadingSpinners.length}`);
    console.log(`- Error elements: ${dashboardData.errors.length}`);
    console.log(`- Stats elements: ${dashboardData.stats.length}`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    await page.screenshot({ path: 'dashboard-audit-error.png' });
  } finally {
    await browser.close();
  }
}

auditDashboard().catch(console.error);