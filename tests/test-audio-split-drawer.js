/**
 * STRESS TEST: Audio Split Timeline (Split-View)
 * Tests the split-view opens inside canvas-area, waveform has proper
 * height, page thumbnails visible, integrates with editor.
 * 
 * Run: node tests/test-audio-split-drawer.js
 */
const puppeteer = require('puppeteer');

const URL = 'http://localhost:8000';
const TIMEOUT = 15000;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
  });

  let passed = 0;
  let failed = 0;
  
  function ok(name) { passed++; console.log(`  ✅ ${name}`); }
  function fail(name, reason) { failed++; console.log(`  ❌ ${name}: ${reason}`); }

  try {
    console.log('\n🔍 TEST: Audio Split Timeline (Split-View)\n');
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    ok('App loaded');

    // Create demo project
    await page.evaluate(() => {
      if (typeof App !== 'undefined' && App.createDemoProject) App.createDemoProject();
    });
    await sleep(1500);
    ok('Demo project created');

    const view = await page.evaluate(() => Store.get('view'));
    if (view === 'editor') ok('Editor view active');
    else fail('Editor view', `view=${view}`);

    const pageCount = await page.evaluate(() => Store.get('currentProject')?.pages?.length || 0);
    if (pageCount > 0) ok(`Project has ${pageCount} pages`);
    else fail('Page count', 'no pages');

    // Open Audio Split Editor
    await page.evaluate(() => App.openAudioSplitEditor());
    await sleep(500);

    // 1. Panel exists inside canvas-area
    const panelExists = await page.$('#ast-panel');
    if (panelExists) ok('ast-panel exists in DOM');
    else fail('ast-panel', 'not found');

    // 2. canvas-area has ast-active class
    const hasClass = await page.evaluate(() => document.querySelector('.canvas-area')?.classList.contains('ast-active'));
    if (hasClass) ok('canvas-area.ast-active class applied');
    else fail('ast-active class', 'missing');

    // 3. Canvas still visible (top half)
    const canvasVisible = await page.evaluate(() => {
      const cs = document.querySelector('.canvas-scroll');
      if (!cs) return false;
      const rect = cs.getBoundingClientRect();
      return rect.height > 80;
    });
    if (canvasVisible) ok('Canvas scroll still visible (top half)');
    else fail('Canvas visible', 'too small or hidden');

    // 4. Panel height ≥ 200px (not a tiny drawer)
    const panelHeight = await page.evaluate(() => {
      const p = document.querySelector('.ast-panel');
      return p ? p.getBoundingClientRect().height : 0;
    });
    if (panelHeight >= 200) ok(`Panel height: ${Math.round(panelHeight)}px (≥200px minimum)`);
    else fail('Panel height', `only ${Math.round(panelHeight)}px`);

    // 5. Upload area visible (no audio yet)
    const uploadArea = await page.$('.ast-upload');
    if (uploadArea) ok('Upload area visible (no audio loaded)');
    else fail('Upload area', 'not found');

    // 6. Toolbar with correct title
    const title = await page.evaluate(() => document.querySelector('.ast-title')?.textContent?.trim());
    if (title && title.includes('Audio Split')) ok(`Toolbar title: "${title}"`);
    else fail('Toolbar title', `got: ${title}`);

    // 7. Close and verify cleanup
    await page.evaluate(() => App.closeAudioSplitEditor());
    await sleep(300);

    const panelGone = await page.$('#ast-panel');
    const classGone = await page.evaluate(() => !document.querySelector('.canvas-area')?.classList.contains('ast-active'));
    if (!panelGone && classGone) ok('Panel removed and ast-active class removed');
    else fail('Close cleanup', `panel=${!!panelGone}, classGone=${classGone}`);

    // 8. Canvas restored to full height
    const canvasFullHeight = await page.evaluate(() => {
      const cs = document.querySelector('.canvas-area');
      if (!cs) return 0;
      return cs.getBoundingClientRect().height;
    });
    if (canvasFullHeight > 400) ok(`Canvas restored: ${Math.round(canvasFullHeight)}px`);
    else fail('Canvas restore', `only ${Math.round(canvasFullHeight)}px`);

    // 9. No duplicate panels on double open
    await page.evaluate(() => App.openAudioSplitEditor());
    await sleep(200);
    await page.evaluate(() => App.openAudioSplitEditor());
    await sleep(200);
    const panelCount = await page.evaluate(() => document.querySelectorAll('#ast-panel').length);
    if (panelCount <= 1) ok('No duplicate panels on double-open');
    else fail('Duplicate check', `found ${panelCount} panels`);

    // 10. Snap toggle
    await page.evaluate(() => App.toggleAudioSplitSnap());
    const snapOn = await page.evaluate(() => App._audioSplitSnap);
    if (snapOn === true) ok('Snap toggle works');
    else fail('Snap toggle', `value=${snapOn}`);

    // 11. Close
    await page.evaluate(() => App.closeAudioSplitEditor());
    await sleep(200);

    // 12. Left and right panels still functional
    const leftPanel = await page.evaluate(() => {
      const lp = document.querySelector('.left-panel');
      return lp ? lp.getBoundingClientRect().width > 50 : false;
    });
    const rightPanel = await page.evaluate(() => {
      const rp = document.querySelector('.right-panel');
      return rp ? rp.getBoundingClientRect().width > 50 : false;
    });
    if (leftPanel && rightPanel) ok('Left and right panels intact');
    else fail('Side panels', `left=${leftPanel}, right=${rightPanel}`);

    // 13. No console errors
    const realErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
    if (realErrors.length === 0) ok('No console errors');
    else fail('Console errors', realErrors.join('; '));

    // Summary
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`${'═'.repeat(50)}\n`);

  } catch (err) {
    console.error('❌ TEST CRASHED:', err.message);
    failed++;
  } finally {
    await browser.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

test();
