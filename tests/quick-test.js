#!/usr/bin/env node
/**
 * Quick automated test for HQ Movie
 * Runs headless browser tests to verify core functionality
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:8085';

async function runTests() {
  console.log('🧪 HQ Movie Quick Test Suite\n');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const errors = [];
  const results = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  try {
    // Test 1: Page loads
    console.log('1. Loading page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 10000 });
    results.push({ test: 'Page loads', pass: true });
    
    // Test 2: Check for critical objects
    console.log('2. Checking core objects...');
    const coreObjects = await page.evaluate(() => {
      return {
        Store: typeof Store !== 'undefined',
        App: typeof App !== 'undefined',
        Layouts: typeof Layouts !== 'undefined',
        renderCanvas: typeof renderCanvas === 'function',
        renderRightPanel: typeof renderRightPanel === 'function'
      };
    });
    
    const allCoreOk = Object.values(coreObjects).every(v => v);
    results.push({ 
      test: 'Core objects exist', 
      pass: allCoreOk,
      details: coreObjects
    });
    
    if (!allCoreOk) {
      console.log('   ❌ Missing:', Object.entries(coreObjects).filter(([k,v]) => !v).map(([k]) => k).join(', '));
    }
    
    // Test 3: Create new project or verify existing
    console.log('3. Creating/verifying project...');
    const projectCreated = await page.evaluate(() => {
      try {
        // Check if already has project - that's valid
        let p = Store.get('currentProject');
        if (p && p.pages && p.pages.length > 0) {
          return { existed: true, pages: p.pages.length };
        }
        // Try to create
        if (typeof App.newProject === 'function') {
          App.newProject('vertical');
        }
        p = Store.get('currentProject');
        if (p && p.pages && p.pages.length > 0) {
          return { created: true, pages: p.pages.length };
        }
        return { error: 'No project after creation attempt' };
      } catch (e) {
        return { error: e.message };
      }
    });
    const projOk = projectCreated && (projectCreated.existed || projectCreated.created);
    results.push({ test: 'Project exists/created', pass: projOk, details: projectCreated });
    
    // Test 4: Check if canvas rendered
    console.log('4. Checking canvas render...');
    await new Promise(r => setTimeout(r, 500));
    const canvasExists = await page.evaluate(() => {
      return document.querySelector('.canvas-content, .page-canvas, #canvas-scroll') !== null;
    });
    results.push({ test: 'Canvas renders', pass: canvasExists });
    
    // Test 5: Check if buttons exist and are clickable
    console.log('5. Checking UI buttons...');
    const buttonsCheck = await page.evaluate(() => {
      const results = {};
      
      // Check layout buttons
      const layoutBtns = document.querySelectorAll('[onclick*="setLayout"]');
      results.layoutButtons = layoutBtns.length;
      
      // Check add balloon buttons
      const balloonBtns = document.querySelectorAll('[onclick*="addBalloon"]');
      results.balloonButtons = balloonBtns.length;
      
      // Check any onclick handlers
      const allOnclick = document.querySelectorAll('[onclick]');
      results.totalOnclickElements = allOnclick.length;
      
      return results;
    });
    results.push({ 
      test: 'UI buttons exist', 
      pass: buttonsCheck.totalOnclickElements > 10,
      details: buttonsCheck
    });
    
    // Test 6: Try changing layout
    console.log('6. Testing layout change...');
    const layoutChange = await page.evaluate(() => {
      try {
        const before = Store.getActivePage()?.layoutId;
        App.setLayout('2p-h-50');
        const after = Store.getActivePage()?.layoutId;
        return { before, after, changed: after === '2p-h-50' };
      } catch (e) {
        return { error: e.message };
      }
    });
    results.push({ test: 'Layout change', pass: layoutChange.changed === true, details: layoutChange });
    
    // Test 7: Try adding balloon
    console.log('7. Testing add balloon...');
    const balloonAdd = await page.evaluate(() => {
      try {
        const before = (Store.getActivePage()?.texts || []).length;
        // Use correct function name
        if (typeof App.addBalloonToPage === 'function') {
          App.addBalloonToPage('speech');
        } else if (typeof App.addBalloon === 'function') {
          App.addBalloon('speech');
        } else {
          return { error: 'No addBalloon function found' };
        }
        const after = (Store.getActivePage()?.texts || []).length;
        return { before, after, added: after > before };
      } catch (e) {
        return { error: e.message };
      }
    });
    results.push({ test: 'Add balloon', pass: balloonAdd.added === true, details: balloonAdd });
    
    // Test 8: Check for blocking overlays
    console.log('8. Checking for blocking overlays...');
    const overlayCheck = await page.evaluate(() => {
      const body = document.body;
      const overlays = [];
      
      // Check for elements that might block clicks
      document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        if (style.position === 'fixed' && style.zIndex > 100 && style.pointerEvents !== 'none') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 100 && rect.height > 100) {
            overlays.push({
              tag: el.tagName,
              id: el.id,
              class: el.className,
              zIndex: style.zIndex
            });
          }
        }
      });
      
      return overlays;
    });
    results.push({ 
      test: 'No blocking overlays', 
      pass: overlayCheck.length === 0,
      details: overlayCheck
    });

  } catch (e) {
    results.push({ test: 'Test execution', pass: false, details: e.message });
  }
  
  await browser.close();
  
  // Print results
  console.log('\n📊 Results:\n');
  let passed = 0, failed = 0;
  
  results.forEach(r => {
    const icon = r.pass ? '✅' : '❌';
    console.log(`${icon} ${r.test}`);
    if (!r.pass && r.details) {
      console.log(`   Details: ${JSON.stringify(r.details)}`);
    }
    if (r.pass) passed++; else failed++;
  });
  
  if (errors.length > 0) {
    console.log('\n🔴 Console Errors:');
    errors.slice(0, 10).forEach(e => console.log(`   - ${e}`));
    if (errors.length > 10) console.log(`   ... and ${errors.length - 10} more`);
  }
  
  console.log(`\n📈 Summary: ${passed}/${passed+failed} passed`);
  
  if (failed > 0 || errors.length > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Test runner error:', e.message);
  process.exit(1);
});
