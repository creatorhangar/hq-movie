
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function runPersonaTest() {
  console.log('🎬 Starting Persona Test: The Thriller Creator');
  const browser = await puppeteer.launch({
    headless: true, // Set to false to watch it run
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--autoplay-policy=no-user-gesture-required',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream'
    ]
  });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // Set viewport to a reasonable desktop size
  await page.setViewport({ width: 1280, height: 800 });

  const reportDir = path.join(__dirname, 'report-persona');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  try {
    // 1. Onboarding
    console.log('👉 Navigating to App...');
    await page.goto('http://localhost:8083', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(reportDir, '01-dashboard.png') });

    // 2. Project Setup
    console.log('👉 Creating New Project...');
    // Execute via App global to ensure reliability, but simulate user intent
    await page.evaluate(() => App.showFormatSelector());
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(reportDir, '02-format-selector.png') });

    console.log('👉 Selecting Vertical Format...');
    await page.evaluate(() => App.selectVideoFormat('vertical'));
    await new Promise(r => setTimeout(r, 1000)); // Wait for editor to load
    await page.screenshot({ path: path.join(reportDir, '03-editor-opened.png') });

    // Rename Project
    console.log('👉 Renaming Project...');
    await page.type('.project-name-input', 'The Yellow Shadow', { delay: 50 });

    // 3. Scene 3 Composition
    console.log('👉 Composing Scene 3...');
    
    // Upload Image to Page 1
    const imagePath = path.resolve('/home/tiago/CascadeProjects/HQ/hq-movie/img/8fdc28880a7c91b6bc8a02e8c6d90918.jpg');
    if (fs.existsSync(imagePath)) {
        const fileInput = await page.$('#file-input-persistent');
        await fileInput.uploadFile(imagePath);
        await page.evaluate(() => {
            const input = document.getElementById('file-input-persistent');
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        });
        console.log('   - Image uploaded');
    } else {
        console.warn('   ! Image not found, skipping upload');
    }
    await new Promise(r => setTimeout(r, 1000));

    // Open Narrative Section if collapsed
    await page.evaluate(() => {
        // Ensure right panel is open
        if (!Store.get('rightPanelOpen')) App.toggleRight();
        // Ensure narrative section is open
        const narrativeHeader = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('NARRATIVA'));
        if (narrativeHeader && narrativeHeader.textContent.includes('+')) {
            narrativeHeader.click();
        }
    });
    await new Promise(r => setTimeout(r, 500));

    // Add Narrative PT-BR
    console.log('👉 Adding Narration (PT-BR)...');
    await page.evaluate(() => {
        const txt = document.querySelector('textarea[oninput*="updateNarrative"]');
        if (txt) {
            txt.value = "Espera—pela chuva, uma figura. Não estou sozinho!";
            txt.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // Add Narrative EN
    console.log('👉 Adding Narration (EN)...');
    await page.evaluate(() => App.setActiveLanguage('en'));
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => {
        const txt = document.querySelector('textarea[oninput*="updateNarrative"]');
        if (txt) {
            txt.value = "Wait—through the rain, a figure. I’m not alone!";
            txt.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    
    // Switch back to PT
    await page.evaluate(() => App.setActiveLanguage('pt-BR'));

    await page.screenshot({ path: path.join(reportDir, '04-scene3-setup.png') });

    // 4. Scene 4 Composition
    console.log('👉 Adding Scene 4...');
    await page.evaluate(() => App.addPage());
    await new Promise(r => setTimeout(r, 500));
    
    // Upload Image 2 (using same image for test)
    if (fs.existsSync(imagePath)) {
        const fileInput = await page.$('#file-input-persistent');
        await fileInput.uploadFile(imagePath);
        await page.evaluate(() => {
            const input = document.getElementById('file-input-persistent');
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        });
    }
    await new Promise(r => setTimeout(r, 500));

    // Narration Scene 4
    console.log('👉 Adding Narration Scene 4...');
    await page.evaluate(() => {
         const txt = document.querySelector('textarea[oninput*="updateNarrative"]');
        if (txt) {
            txt.value = "Seu rosto marcado, esses olhos—viram o inferno. Quem é ele?";
            txt.dispatchEvent(new Event('input', { bubbles: true }));
            txt.blur(); // CRITICAL: Blur to allow App.render() to switch views
        }
    });
    
    // Ensure no element is focused just in case
    await page.evaluate(() => {
        const active = document.activeElement;
        console.log('Active element before blur:', active ? active.tagName : 'none');
        if (active && typeof active.blur === 'function') {
            active.blur();
            console.log('Called blur() on active element');
        }
    });
    await new Promise(r => setTimeout(r, 500)); // Wait for blur to process
    
    // 6. Preview & Export
    console.log('👉 Opening Export Page...');
    await page.evaluate(() => {
        console.log('Calling App.openExportPage()...');
        App.openExportPage();
        // Force render check
        setTimeout(() => {
            const view = Store.get('view');
            console.log('Current Store view:', view);
            if (document.getElementById('export-quality-btns')) {
                console.log('Export UI found in DOM');
            } else {
                console.log('Export UI NOT found. Active Element:', document.activeElement?.tagName);
                // Attempt force render
                if (view === 'export') {
                    console.log('Forcing App.render()');
                    App.render();
                }
            }
        }, 500);
    });
    
    // Wait for the Export Page UI to render
    try {
        await page.waitForSelector('#export-quality-btns', { timeout: 5000 });
        console.log('   - Export Page Loaded');
    } catch (e) {
        console.error('   ! Export Page load timeout - trying to force render');
        await page.evaluate(() => {
            Store.set({ view: 'export' });
            // Force re-render if needed
            if (typeof render === 'function') render();
        });
        await page.waitForSelector('#export-quality-btns', { timeout: 5000 });
    }
    
    await page.screenshot({ path: path.join(reportDir, '05-export-page.png') });

    // Select PT-BR
    console.log('👉 Selecting PT-BR...');
    // Verify lang buttons exist
    await page.waitForSelector('#export-lang-btns');
    await page.evaluate(() => App._setExportLanguage('pt-BR'));
    await new Promise(r => setTimeout(r, 200));
    
    // Set Quality to Low
    console.log('👉 Setting Quality to Low...');
    await page.waitForSelector('button[data-val="low"]');
    await page.evaluate(() => {
        const btn = document.querySelector('button[data-val="low"]');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 200));

    // Set FPS to 24
    console.log('👉 Setting FPS to 24...');
    await page.waitForSelector('button[data-val="24"]');
    await page.evaluate(() => {
        const btn = document.querySelector('button[data-val="24"]');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 200));

    // Duration: 2s (Optimized for test speed)
    await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
        const durationInput = inputs.find(i => i.title?.includes('Duração')); 
        if (durationInput) {
            durationInput.value = '2';
            durationInput.dispatchEvent(new Event('input', { bubbles: true }));
            durationInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // Click "Exportar Vídeo"
    console.log('👉 Clicking Export Video...');
    // We use evaluate to click because button might be offscreen or inside container
    await page.evaluate(() => {
        const btn = document.getElementById('export-video-btn');
        if (btn) btn.click();
        else App._startVideoExport();
    });

    // Check for MediaRecorder support
    const mediaRecorderSupport = await page.evaluate(() => {
        return {
            exists: typeof MediaRecorder !== 'undefined',
            types: [
                'video/webm',
                'video/webm;codecs=vp8',
                'video/webm;codecs=vp9',
                'video/mp4'
            ].map(t => ({ type: t, supported: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t) }))
        };
    });
    console.log('👉 MediaRecorder Support:', JSON.stringify(mediaRecorderSupport, null, 2));

    // Wait for completion
    console.log('👉 Waiting for rendering (up to 60s)...');
    
    // We poll for the status text
    const result = await page.waitForFunction(
        () => {
            const statusEl = document.getElementById('export-status-text');
            const btn = document.getElementById('export-video-btn');
            const txt = statusEl ? statusEl.textContent : '';
            const btnTxt = btn ? btn.textContent : '';
            
            // Log status to console for debugging (via page.evaluate return is tricky in waitForFunction, so we rely on console.log)
            // But waitForFunction runs in browser context.
            // Let's print progress in the node process loop instead.
            
            // Check success markers
            if (txt.includes('Pronto') || txt.includes('Sucesso') || btnTxt.includes('✅')) return { status: 'success', message: txt };
            if (txt.includes('Erro') || btnTxt.includes('Erro')) return { status: 'error', message: txt + ' | ' + btnTxt };
            return false;
        },
        { timeout: 90000, polling: 1000 } // Increased timeout to 90s
    );

    // Monitor progress in parallel (optional, but helpful)
    const progressInterval = setInterval(async () => {
        try {
            const status = await page.$eval('#export-status-text', el => el.textContent).catch(() => '');
            const pct = await page.$eval('#export-pct-text', el => el.textContent).catch(() => '');
            console.log(`   [Export Status] ${status} (${pct})`);
        } catch (e) {}
    }, 5000);

    const resultVal = await result.jsonValue();
    clearInterval(progressInterval);

    if (resultVal.status === 'success') {
        console.log('✅ Export Completed Successfully!');
        console.log('   Message:', resultVal.message);
    } else {
        console.error('❌ Export Reported Error');
        console.error('   Message:', resultVal.message);
        
        // Check for toast error
        const toastMsg = await page.evaluate(() => {
            const toasts = Array.from(document.querySelectorAll('.toast'));
            return toasts.map(t => t.textContent).join(' | ');
        });
        console.error('   Toasts:', toastMsg);
    }

    await page.screenshot({ path: path.join(reportDir, '06-export-result.png') });

  } catch (error) {
    console.error('❌ Test Failed:', error);
    await page.screenshot({ path: path.join(reportDir, 'error-state.png') });
  } finally {
    await browser.close();
    console.log('🎬 Test Finished. Check tests/manual-qa/report-persona/ folder.');
  }
}

runPersonaTest();
