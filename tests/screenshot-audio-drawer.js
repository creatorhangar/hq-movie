/**
 * Takes screenshots of the Audio Split Timeline (Split-View).
 * Run: node tests/screenshot-audio-drawer.js
 */
const puppeteer = require('puppeteer');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle0', timeout: 15000 });
  
  // Create demo project
  await page.evaluate(() => App.createDemoProject());
  await sleep(1500);
  
  // Screenshot 1: Editor before
  await page.screenshot({ path: 'tests/screenshots/split-01-editor-before.png', fullPage: false });
  console.log('📸 1: Editor before split-view');
  
  // Open split-view
  await page.evaluate(() => App.openAudioSplitEditor());
  await sleep(500);
  
  // Screenshot 2: Split-view open (upload state)
  await page.screenshot({ path: 'tests/screenshots/split-02-upload-state.png', fullPage: false });
  console.log('📸 2: Split-view open (upload state)');
  
  // Close
  await page.evaluate(() => App.closeAudioSplitEditor());
  await sleep(300);
  
  // Screenshot 3: Editor restored
  await page.screenshot({ path: 'tests/screenshots/split-03-after-close.png', fullPage: false });
  console.log('📸 3: Editor after close');

  console.log('\n✅ Screenshots saved to tests/screenshots/');
  
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
