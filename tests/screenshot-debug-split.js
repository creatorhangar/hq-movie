/**
 * DEBUG: Screenshot audio split with simulated audio loaded
 * Tests: waveform, markers, add/remove cuts, dynamic segment count, new page indicators
 */
const puppeteer = require('puppeteer');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('http://localhost:8000', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.evaluate(() => App.createDemoProject());
  await sleep(1500);

  // Open editor
  await page.evaluate(() => App.openAudioSplitEditor());
  await sleep(500);

  // Screenshot 1: upload state
  await page.screenshot({ path: 'tests/screenshots/debug-01-upload.png' });
  console.log('📸 1: Upload state');

  // Inject fake audio (45s) with equal boundaries for 8 pages
  await page.evaluate(() => {
    const draft = AudioSplitter.getDraft();
    draft.sourceFile = 'data:audio/wav;base64,FAKE';
    draft.sourceDuration = 45;
    draft.mode = 'equal';
    const waveform = [];
    for (let i = 0; i < 600; i++) {
      waveform.push(Math.min(1.0, Math.max(0.05, 0.3 + Math.sin(i*0.02)*0.15 + Math.sin(i*0.07)*0.1 + Math.random()*0.35)));
    }
    AudioSplitter._waveformData = waveform;
    const pages = Store.get('currentProject').pages;
    const boundaries = [];
    for (let i = 0; i <= pages.length; i++) boundaries.push((i / pages.length) * 45);
    draft.boundaries = boundaries;
    draft.pageCount = pages.length;
    draft.segmentMeta = [];
    for (let i = 0; i < pages.length; i++) draft.segmentMeta.push({ volume: 0.8, fadeIn: 0.08, fadeOut: 0.08, note: '' });
    AudioSplitter.setSelectedSegment(2);
  });
  await page.evaluate(() => App._refreshAudioSplitPanel());
  await sleep(500);

  // Screenshot 2: 8 segments (equal split)
  await page.screenshot({ path: 'tests/screenshots/debug-02-equal8.png' });
  console.log('📸 2: Equal 8 segments');

  // Add 2 extra cuts to create more segments (simulating podcast scenario)
  const addResult = await page.evaluate(() => {
    const r1 = AudioSplitter.addBoundary(3.0);   // New cut at 3s
    const r2 = AudioSplitter.addBoundary(40.0);   // New cut at 40s
    return { r1, r2, segs: AudioSplitter.getSegments().length, bounds: AudioSplitter.getDraft().boundaries.length };
  });
  console.log(`  Added cuts: ${JSON.stringify(addResult)}`);
  await page.evaluate(() => App._refreshAudioSplitPanel());
  await sleep(300);

  // Screenshot 3: 10 segments (8 pages + 2 new)
  await page.screenshot({ path: 'tests/screenshots/debug-03-10segs.png' });
  console.log('📸 3: 10 segments (2 extra cuts → 2 new pages needed)');

  // Panel zoom
  const panelEl = await page.$('.ast-panel');
  if (panelEl) {
    await panelEl.screenshot({ path: 'tests/screenshots/debug-04-panel-zoom.png' });
    console.log('📸 4: Panel zoom with 10 segments');
  }

  // Toolbar zoom (should show "10 seg → 10 pág (+2 novas)")
  const toolbar = await page.$('.ast-toolbar');
  if (toolbar) {
    await toolbar.screenshot({ path: 'tests/screenshots/debug-05-toolbar.png' });
    console.log('📸 5: Toolbar zoom');
  }

  // Thumbnails (should show "Nova 9" and "Nova 10")
  const thumbs = await page.$('.ast-thumbs');
  if (thumbs) {
    await thumbs.screenshot({ path: 'tests/screenshots/debug-06-thumbs.png' });
    console.log('📸 6: Thumbnails with new page indicators');
  }

  // Remove one cut
  const removeResult = await page.evaluate(() => {
    return AudioSplitter.removeBoundary(3);
  });
  console.log(`  Removed boundary 3: ${removeResult}`);
  await page.evaluate(() => App._refreshAudioSplitPanel());
  await sleep(300);

  // Screenshot 7: 9 segments after removing 1 cut
  await page.screenshot({ path: 'tests/screenshots/debug-07-after-remove.png' });
  console.log('📸 7: 9 segments after removing 1 cut');

  // Info bar
  const info = await page.$('.ast-info');
  if (info) {
    await info.screenshot({ path: 'tests/screenshots/debug-08-info.png' });
    console.log('📸 8: Info bar');
  }

  // Collect measurements
  const m = await page.evaluate(() => {
    const r = {};
    const panel = document.querySelector('.ast-panel');
    if (panel) { const b = panel.getBoundingClientRect(); r.panel = `${Math.round(b.width)}x${Math.round(b.height)}`; }
    r.markers = document.querySelectorAll('.ast-marker').length;
    r.deleteButtons = document.querySelectorAll('.ast-marker-delete').length;
    r.segments = AudioSplitter.getSegments().length;
    r.pages = Store.get('currentProject').pages.length;
    r.newPagesNeeded = Math.max(0, r.segments - r.pages);
    const newThumbs = document.querySelectorAll('.ast-thumb-new');
    r.newPageThumbs = newThumbs.length;
    return r;
  });

  console.log('\n📐 Measurements:', JSON.stringify(m, null, 2));

  if (errors.length > 0) {
    console.log('\n⚠️  Console errors:');
    errors.forEach(e => console.log('  ', e));
  } else {
    console.log('\n✅ No console errors');
  }

  await browser.close();
  console.log('\n✅ Done');
}

run().catch(e => { console.error(e); process.exit(1); });
