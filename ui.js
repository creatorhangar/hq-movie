/* ═══════════════════════════════════════════════════════════════
   HQ MOVIE — UI Renderer v4
   True A4 Canvas, Margin Guides, Zoom, Order Numbers, Layout Picker
   ═══════════════════════════════════════════════════════════════ */

function renderFormatSelector() {
  return `
  <div class="dashboard" id="dashboard">
    <div class="dashboard-header">
      <div class="logo-big">${Icons.logo.replace(/width="\d+"/, 'width="48"').replace(/height="\d+"/, 'height="48"')}</div>
      <h1>${t('formats.chooseTitle')}</h1>
      <p>${t('formats.chooseDescription')}</p>
    </div>
    <div class="format-selector" style="display:flex; gap:24px; justify-content:center; flex-wrap:wrap; margin:40px 0;">
      ${Object.values(VIDEO_FORMATS).map(fmt => `
        <button type="button" class="format-card" aria-label="${fmt.name} — ${fmt.description}" onclick="App.selectVideoFormat('${fmt.id}')" style="
          background: var(--surface-1);
          border: 2px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          width: 200px;
          display: block;
        " onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-4px)'" 
           onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)'">
          <div style="font-size:48px; margin-bottom:12px;">${fmt.icon}</div>
          <div style="font-size:18px; font-weight:600; color:var(--text-1); margin-bottom:4px;">${fmt.name}</div>
          <div style="font-size:13px; color:var(--text-2);">${fmt.description}</div>
          <div style="font-size:11px; color:var(--text-3); margin-top:8px;">${fmt.width}×${fmt.height}px</div>
        </button>
      `).join('')}
    </div>
    <div style="text-align:center;">
      <button class="btn btn-ghost" onclick="App.goHome()">${t('formats.back')}</button>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════
   EXPORT PAGE — Dedicated full-screen export view
   ═══════════════════════════════════════ */
function renderExportPage() {
  const proj = Store.get('currentProject');
  if (!proj) return `<div>${t('export.noProject')}</div>`;
  const pages = proj.pages || [];
  const vf = proj.videoFormat ? VIDEO_FORMATS[proj.videoFormat] : null;
  const fmtName = vf ? vf.name : 'A4';
  const fmtRes = vf ? `${vf.width}×${vf.height}` : '794×1123';
  const totalDuration = pages.reduce((s, p) => s + (p.duration || 2.5), 0);
  const durStr = `${Math.floor(totalDuration / 60).toString().padStart(2,'0')}:${(totalDuration % 60).toString().padStart(2,'0')}`;
  const exportLang = Store.get('exportLanguage') || 'pt-BR';
  const exportFormatRaw = (typeof App !== 'undefined' && App._exportFormat) ? App._exportFormat : 'auto';
  const exportFormat = ['auto', 'mp4', 'webm'].includes(exportFormatRaw) ? exportFormatRaw : 'auto';
  const exportQuality = (typeof App !== 'undefined' && App._videoQuality) ? App._videoQuality : 'high';
  const exportFps = (typeof App !== 'undefined' && App._videoFps) ? App._videoFps : 30;
  const exportButtonLabel = `${t('export.exportVideo')} · ${exportLang === 'both' ? t('export.both') : exportLang === 'en' ? t('export.english') : t('export.portuguese')} · ${exportFormat === 'auto' ? 'Auto' : exportFormat.toUpperCase()}`;
  const pagesWithoutImages = pages.map((pg, i) => ({ pg, i })).filter(({ pg }) => !(pg.images && pg.images.some(img => img && img.src))).map(({ i }) => i + 1);
  const missingImagesDetail = pagesWithoutImages.length === 1
    ? `${t('export.missingImageSingle')} ${pagesWithoutImages[0]}`
    : pagesWithoutImages.length
      ? `${t('export.missingImages')} ${pagesWithoutImages.join(', ')}`
      : t('export.visualsReady');
  const hasAnyNarrative = pages.some(pg => {
    if (!pg.narrative) return false;
    if (typeof pg.narrative === 'string') return !!pg.narrative.trim();
    return Object.values(pg.narrative).some(val => typeof val === 'string' && val.trim());
  });
  const missingExportLangPages = exportLang === 'both'
    ? pages.map((pg, i) => ({ pg, i })).filter(({ pg }) => {
        const pt = typeof pg.narrative === 'string' ? pg.narrative : (pg.narrative?.['pt-BR'] || '');
        const en = typeof pg.narrative === 'string' ? '' : (pg.narrative?.en || '');
        return !!(pt || en) && (!pt || !en);
      }).map(({ i }) => i + 1)
    : [];
  const hasAnyAudio = !!proj.videoAudio?.background?.file || pages.some(pg => {
    const narr = proj.videoAudio?.pages?.find(item => item.pageId === pg.id);
    if (!narr) return false;
    if (narr.file) return true;
    return Object.values(narr).some(val => val && typeof val === 'object' && val.file);
  });
  const preflightItems = [
    {
      key: 'format',
      title: t('export.formatCheck'),
      detail: `${fmtName} · ${exportFormat === 'auto' ? 'Auto' : exportFormat.toUpperCase()} · ${exportQuality} · ${exportFps}fps`,
      state: 'ready'
    },
    {
      key: 'duration',
      title: t('export.durationCheck'),
      detail: `${durStr} · ${pages.length} ${t('export.pages')}`,
      state: totalDuration > 0 && pages.length > 0 ? 'ready' : 'attention'
    },
    {
      key: 'visuals',
      title: t('export.visualsCheck'),
      detail: missingImagesDetail,
      state: pagesWithoutImages.length ? 'attention' : 'ready'
    },
    {
      key: 'text',
      title: t('export.textCheck'),
      detail: missingExportLangPages.length
        ? `${t('export.missingLanguagePages')} ${missingExportLangPages.join(', ')}`
        : hasAnyNarrative ? t('export.textReady') : t('export.textOptional'),
      state: missingExportLangPages.length ? 'attention' : (hasAnyNarrative ? 'ready' : 'optional')
    },
    {
      key: 'audio',
      title: t('export.audioCheck'),
      detail: hasAnyAudio ? t('export.audioReady') : t('export.audioOptional'),
      state: hasAnyAudio ? 'ready' : 'optional'
    },
    {
      key: 'output',
      title: t('export.outputCheck'),
      detail: `${exportLang === 'both' ? t('export.both') : exportLang === 'en' ? t('export.english') : t('export.portuguese')} · ${exportFormat === 'auto' ? 'Auto' : exportFormat.toUpperCase()}`,
      state: 'ready'
    }
  ];
  const kbIcons = { 'zoom-in': Icons.zoomIn, 'zoom-out': Icons.zoomOut, 'pan-left': Icons.arrowLeft, 'pan-right': Icons.arrowRight, 'pan-up': Icons.arrowUp, 'drift': Icons.waves, 'none': Icons.square };
  const trLabels = { none: '', cut: '', fade: 'fade 0.5s' };

  const thumbnails = pages.map((pg, i) => {
    const img = pg.images && pg.images[0] ? pg.images[0] : null;
    const kb = kbIcons[pg.kenBurns || 'none'] || '⏹';
    const tr = trLabels[pg.transition || 'cut'] || '';
    const thumb = img && img.src
      ? `<img src="${img.src}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`
      : `<div style="width:100%;height:100%;background:#1a1a1a;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#555;">${Icons.camera}</div>`;
    return `
      <div style="flex-shrink:0;width:180px;">
        <div style="width:180px;height:${vf ? Math.round(180 / (vf.width/vf.height)) : 240}px;border-radius:8px;overflow:hidden;border:2px solid var(--border);position:relative;">
          ${thumb}
          <div style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;padding:2px 8px;border-radius:10px;font-weight:700;">Pg ${i+1}</div>
          <div style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.7);color:var(--accent);font-size:10px;padding:2px 6px;border-radius:10px;">${pg.duration || 2.5}s ${kb}</div>
        </div>
        <div style="text-align:center;margin-top:4px;font-size:10px;color:var(--text-3);">${tr}${i < pages.length - 1 ? ' →' : ''}</div>
      </div>`;
  }).join('');

  return `
  <div class="export-page" style="min-height:100vh;background:var(--bg-main);color:var(--text-1);display:flex;flex-direction:column;">
    <!-- Header -->
    <div class="export-page-header" style="display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid var(--border);background:var(--bg-surface);">
      <button onclick="Store.set({view:'editor'})" style="background:none;border:1px solid var(--border);color:var(--text-2);padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:6px;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">${t('export.backToEditor')}</button>
      <div class="export-page-header-summary" style="flex:1;text-align:center;">
        <span style="font-size:16px;font-weight:700;">${proj.metadata?.name || t('export.project')}</span>
        <span style="font-size:12px;color:var(--text-3);margin-left:8px;">${pages.length} ${t('export.pages')} · ${fmtName} · ${durStr}</span>
      </div>
      <div class="export-page-header-spacer" style="width:120px;"></div>
    </div>

    <!-- Main content -->
    <div class="export-page-main" style="flex:1;display:flex;gap:0;overflow:hidden;">
      <!-- Left: Preview area -->
      <div class="export-page-preview-pane" style="flex:1;display:flex;flex-direction:column;padding:24px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">${t('export.pagesPreview')}</div>
        <div style="display:flex;gap:16px;overflow-x:auto;padding-bottom:16px;" id="export-thumbnails">
          ${thumbnails}
        </div>

        <!-- Project summary -->
        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
          <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;margin-bottom:6px;">${t('export.format')}</div>
            <div style="font-size:20px;font-weight:700;">${vf ? vf.icon : Icons.file} ${fmtName}</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px;">${fmtRes}px</div>
          </div>
          <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;margin-bottom:6px;">${t('export.totalDuration')}</div>
            <div style="font-size:20px;font-weight:700;">${Icons.clock} ${durStr}</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px;">${pages.length} ${t('export.pages')}</div>
          </div>
          <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;margin-bottom:6px;">${t('export.animations')}</div>
            <div style="font-size:20px;font-weight:700;">${Icons.film} ${t('export.kenBurns')}</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px;">${pages.filter(p => p.kenBurns && p.kenBurns !== 'none' && p.kenBurns !== 'static').length} ${t('export.animatedPages')}</div>
          </div>
        </div>
      </div>

      <!-- Right: Export options -->
      <div class="export-page-sidebar" style="width:340px;background:var(--bg-surface);border-left:1px solid var(--border);padding:20px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;">
        <div style="font-size:14px;font-weight:700;color:var(--accent);">${t('export.title')}</div>

        <!-- QUICK EXPORT — always visible -->
        <div class="export-quick-section" style="background:var(--bg-main);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;gap:4px;">
            <div style="font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:4px;width:100%;">${t('export.quality')}
              <div style="display:flex;gap:4px;margin-top:4px;" id="export-quality-btns">
                <button onclick="App._setExportQuality('low')" class="export-opt-btn ${exportQuality === 'low' ? 'active' : ''}" data-val="low" style="flex:1;padding:5px;border-radius:6px;border:1px solid ${exportQuality === 'low' ? 'var(--accent)' : 'var(--border)'};background:${exportQuality === 'low' ? 'var(--accent-glow, rgba(107,114,128,0.1))' : 'var(--bg-surface)'};color:${exportQuality === 'low' ? 'var(--accent)' : 'var(--text-2)'};font-size:10px;cursor:pointer;font-weight:${exportQuality === 'low' ? '600' : '400'};">${t('export.qualityFast')}</button>
                <button onclick="App._setExportQuality('medium')" class="export-opt-btn ${exportQuality === 'medium' ? 'active' : ''}" data-val="medium" style="flex:1;padding:5px;border-radius:6px;border:1px solid ${exportQuality === 'medium' ? 'var(--accent)' : 'var(--border)'};background:${exportQuality === 'medium' ? 'var(--accent-glow, rgba(107,114,128,0.1))' : 'var(--bg-surface)'};color:${exportQuality === 'medium' ? 'var(--accent)' : 'var(--text-2)'};font-size:10px;cursor:pointer;font-weight:${exportQuality === 'medium' ? '600' : '400'};">${t('export.qualityNormal')}</button>
                <button onclick="App._setExportQuality('high')" class="export-opt-btn ${exportQuality === 'high' ? 'active' : ''}" data-val="high" style="flex:1;padding:5px;border-radius:6px;border:1px solid ${exportQuality === 'high' ? 'var(--accent)' : 'var(--border)'};background:${exportQuality === 'high' ? 'var(--accent-glow, rgba(107,114,128,0.1))' : 'var(--bg-surface)'};color:${exportQuality === 'high' ? 'var(--accent)' : 'var(--text-2)'};font-size:10px;cursor:pointer;font-weight:${exportQuality === 'high' ? '600' : '400'};">${t('export.qualityHigh')}</button>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:8px;">
            <div style="flex:1;">
              <div style="font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:4px;">${t('export.format')}</div>
              <div style="display:flex;gap:3px;" id="export-format-btns">
                ${(typeof VideoExporter !== 'undefined' ? VideoExporter.getSupportedFormats() : [{family:'mp4',label:'MP4',supported:true},{family:'webm',label:'WebM',supported:true}]).map(f => {
                  const isActive = exportFormat === f.family;
                  return `<button onclick="App._setExportFormat('${f.family}')" class="export-opt-btn ${isActive ? 'active' : ''}" data-val="${f.family}" style="flex:1;padding:5px;border-radius:6px;border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};background:${isActive ? 'rgba(107,114,128,0.1)' : 'var(--bg-surface)'};color:${f.supported ? (isActive ? 'var(--accent)' : 'var(--text-2)') : 'var(--text-4)'};font-size:10px;cursor:${f.supported ? 'pointer' : 'not-allowed'};opacity:${f.supported ? '1' : '0.5'};font-weight:${isActive ? '600' : '400'};" ${f.supported ? '' : 'disabled'}>${f.label}</button>`;
                }).join('')}
                <button onclick="App._setExportFormat('auto')" class="export-opt-btn ${exportFormat === 'auto' ? 'active' : ''}" data-val="auto" style="flex:1;padding:5px;border-radius:6px;border:1px solid ${exportFormat === 'auto' ? 'var(--accent)' : 'var(--border)'};background:${exportFormat === 'auto' ? 'rgba(107,114,128,0.1)' : 'var(--bg-surface)'};color:${exportFormat === 'auto' ? 'var(--accent)' : 'var(--text-2)'};font-size:10px;cursor:pointer;font-weight:${exportFormat === 'auto' ? '600' : '400'};">Auto</button>
              </div>
            </div>
            <div style="flex:0 0 auto;">
              <div style="font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:4px;">FPS</div>
              <div style="display:flex;gap:3px;" id="export-fps-btns">
                <button onclick="App._setExportFps(24)" class="export-opt-btn ${exportFps === 24 ? 'active' : ''}" data-val="24" style="padding:5px 8px;border-radius:6px;border:1px solid ${exportFps === 24 ? 'var(--accent)' : 'var(--border)'};background:${exportFps === 24 ? 'var(--accent-glow, rgba(107,114,128,0.1))' : 'var(--bg-surface)'};color:${exportFps === 24 ? 'var(--accent)' : 'var(--text-2)'};font-size:10px;cursor:pointer;font-weight:${exportFps === 24 ? '600' : '400'};">24</button>
                <button onclick="App._setExportFps(30)" class="export-opt-btn ${exportFps === 30 ? 'active' : ''}" data-val="30" style="padding:5px 8px;border-radius:6px;border:1px solid ${exportFps === 30 ? 'var(--accent)' : 'var(--border)'};background:${exportFps === 30 ? 'var(--accent-glow, rgba(107,114,128,0.1))' : 'var(--bg-surface)'};color:${exportFps === 30 ? 'var(--accent)' : 'var(--text-2)'};font-size:10px;cursor:pointer;font-weight:${exportFps === 30 ? '600' : '400'};">30</button>
              </div>
            </div>
          </div>

          <div>
            <div style="font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:4px;">${Icons.globe} ${t('export.language')}</div>
            <div style="display:flex;gap:3px;" id="export-lang-btns">
              <button onclick="App._setExportLanguage('pt-BR')" class="export-opt-btn ${(Store.get('exportLanguage') || 'pt-BR') === 'pt-BR' ? 'active' : ''}" data-val="pt-BR" style="flex:1;padding:5px;border-radius:6px;border:1px solid ${(Store.get('exportLanguage') || 'pt-BR') === 'pt-BR' ? 'var(--accent)' : 'var(--border)'};background:${(Store.get('exportLanguage') || 'pt-BR') === 'pt-BR' ? 'var(--accent-glow, rgba(107,114,128,0.1))' : 'var(--bg-surface)'};color:${(Store.get('exportLanguage') || 'pt-BR') === 'pt-BR' ? 'var(--accent)' : 'var(--text-2)'};font-size:10px;cursor:pointer;font-weight:${(Store.get('exportLanguage') || 'pt-BR') === 'pt-BR' ? '600' : '400'};">${Icons.flagBR} PT</button>
              <button onclick="App._setExportLanguage('en')" class="export-opt-btn ${Store.get('exportLanguage') === 'en' ? 'active' : ''}" data-val="en" style="flex:1;padding:5px;border-radius:6px;border:1px solid ${Store.get('exportLanguage') === 'en' ? 'var(--accent)' : 'var(--border)'};background:${Store.get('exportLanguage') === 'en' ? 'var(--accent-glow, rgba(107,114,128,0.1))' : 'var(--bg-surface)'};color:${Store.get('exportLanguage') === 'en' ? 'var(--accent)' : 'var(--text-2)'};font-size:10px;cursor:pointer;font-weight:${Store.get('exportLanguage') === 'en' ? '600' : '400'};">${Icons.flagUS} EN</button>
              <button onclick="App._setExportLanguage('both')" class="export-opt-btn ${Store.get('exportLanguage') === 'both' ? 'active' : ''}" data-val="both" style="flex:1;padding:5px;border-radius:6px;border:1px solid ${Store.get('exportLanguage') === 'both' ? 'var(--accent)' : 'var(--border)'};background:${Store.get('exportLanguage') === 'both' ? 'var(--accent-glow, rgba(107,114,128,0.1))' : 'var(--bg-surface)'};color:${Store.get('exportLanguage') === 'both' ? 'var(--accent)' : 'var(--text-2)'};font-size:10px;cursor:pointer;font-weight:${Store.get('exportLanguage') === 'both' ? '600' : '400'};">${t('export.both')}</button>
            </div>
          </div>
        </div>

        <!-- PRIMARY EXPORT BUTTON — always visible -->
        <button onclick="App._startVideoExport()" id="export-video-btn" class="export-video-primary-btn" style="width:100%;padding:12px;border-radius:10px;border:none;background:var(--accent);color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s;min-height:48px;display:flex;align-items:center;justify-content:center;gap:8px;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='brightness(1)'">${Icons.video} ${t('export.exportVideo')}</button>

        <!-- Progress -->
        <div id="export-progress-area" style="display:none;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span id="export-status-text" style="font-size:10px;color:var(--text-3);">${t('export.preparing')}</span>
            <span id="export-pct-text" style="font-size:10px;color:var(--accent);font-weight:700;">0%</span>
          </div>
          <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
            <div id="export-progress-bar" style="height:100%;width:0%;background:var(--accent);border-radius:3px;transition:width 0.2s;"></div>
          </div>
        </div>

        <!-- COLLAPSIBLE: Preflight Checklist -->
        <details class="export-collapse" style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">
          <summary style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-2);cursor:pointer;background:var(--bg-main);display:flex;align-items:center;gap:6px;list-style:none;">
            <span style="transition:transform 0.2s;display:inline-block;" class="collapse-arrow">▶</span>
            ${Icons.check || '✓'} ${t('export.preflightTitle')}
            <span style="margin-left:auto;font-size:9px;color:var(--accent);font-weight:600;">${preflightItems.filter(i => i.state === 'attention').length ? '⚠' : '✓'}</span>
          </summary>
          <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px;background:var(--bg-main);">
            ${preflightItems.map(item => {
              const isAttention = item.state === 'attention';
              const isOptional = item.state === 'optional';
              const accent = isAttention ? '#f59e0b' : isOptional ? 'var(--text-3)' : 'var(--accent)';
              const badge = isAttention ? t('export.statusAttention') : isOptional ? t('export.statusOptional') : t('export.statusReady');
              return `<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);">
                <span style="font-size:10px;color:var(--text-2);">${item.title}</span>
                <span style="font-size:9px;font-weight:700;color:${accent};white-space:nowrap;">${badge}</span>
              </div>`;
            }).join('')}
          </div>
        </details>

        <!-- COLLAPSIBLE: Export Mode -->
        <details class="export-collapse" style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">
          <summary style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-2);cursor:pointer;background:var(--bg-main);display:flex;align-items:center;gap:6px;list-style:none;">
            <span style="transition:transform 0.2s;display:inline-block;" class="collapse-arrow">▶</span>
            ${Icons.film} ${t('export.exportMode')}
          </summary>
          <div style="padding:10px 14px;background:var(--bg-main);">
            <div style="font-size:10px;color:var(--text-3);margin-bottom:8px;">${t('export.exportModeHint')}</div>
            <button onclick="App.showExportModeSelector()" style="width:100%;padding:8px;border-radius:6px;border:1px solid rgba(99,102,241,0.5);background:rgba(99,102,241,0.15);color:#818cf8;font-size:11px;font-weight:600;cursor:pointer;">${t('export.chooseFormat')}</button>
          </div>
        </details>

        <!-- COLLAPSIBLE: PNG Export -->
        <details class="export-collapse" style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">
          <summary style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-2);cursor:pointer;background:var(--bg-main);display:flex;align-items:center;gap:6px;list-style:none;">
            <span style="transition:transform 0.2s;display:inline-block;" class="collapse-arrow">▶</span>
            ${Icons.camera} ${t('export.pngIndividual')}
          </summary>
          <div style="padding:10px 14px;background:var(--bg-main);">
            <div style="font-size:10px;color:var(--text-3);margin-bottom:8px;">${t('export.pngDescription')}</div>
            <div style="display:flex;gap:6px;">
              <button onclick="App._exportAllPng()" style="flex:1;padding:8px;border-radius:6px;border:1px solid var(--accent);background:transparent;color:var(--accent);font-size:11px;font-weight:600;cursor:pointer;">${t('export.exportAllPages')}</button>
            </div>
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button onclick="App.doExport('story')" style="flex:1;padding:7px;border-radius:6px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text-2);font-size:10px;cursor:pointer;">${t('export.story')}</button>
              <button onclick="App.doExport('feed')" style="flex:1;padding:7px;border-radius:6px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text-2);font-size:10px;cursor:pointer;">${t('export.feed')}</button>
            </div>
          </div>
        </details>

        <!-- COLLAPSIBLE: Asset Export (ZIP) -->
        <details class="export-collapse" style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">
          <summary style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-2);cursor:pointer;background:var(--bg-main);display:flex;align-items:center;gap:6px;list-style:none;">
            <span style="transition:transform 0.2s;display:inline-block;" class="collapse-arrow">▶</span>
            ${Icons.package} ${t('export.assetsZip')}
          </summary>
          <div style="padding:10px 14px;background:var(--bg-main);">
            <div id="asset-export-summary" style="background:var(--bg-surface);border-radius:6px;padding:8px 10px;margin-bottom:8px;font-size:10px;color:var(--text-2);">
              ${t('export.analyzingProject')}
            </div>

            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text-2);cursor:pointer;">
                <input type="checkbox" id="asset-chk-images" checked style="accent-color:var(--accent);"> ${Icons.imageIcon} ${t('export.imagesOption')}
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text-2);cursor:pointer;">
                <input type="checkbox" id="asset-chk-narration" checked style="accent-color:var(--accent);"> ${Icons.mic} ${t('export.narrationOption')}
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text-2);cursor:pointer;">
                <input type="checkbox" id="asset-chk-music" checked style="accent-color:var(--accent);"> ${Icons.music} ${t('export.musicOption')}
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text-2);cursor:pointer;">
                <input type="checkbox" id="asset-chk-project" checked style="accent-color:var(--accent);"> ${Icons.save} ${t('export.projectFileOption')}
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text-2);cursor:pointer;">
                <input type="checkbox" id="asset-chk-readme" checked style="accent-color:var(--accent);"> ${Icons.fileText} ${t('export.readmeOption')}
              </label>
            </div>

            <div style="display:flex;gap:4px;margin-bottom:8px;">
              <button onclick="App._setAssetPreset('lightweight')" class="asset-preset-btn" data-preset="lightweight" style="flex:1;padding:5px;border-radius:6px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text-2);font-size:9px;cursor:pointer;" title="${t('tooltip.lightPreset')}">${Icons.feather} ${t('export.presetLight')}</button>
              <button onclick="App._setAssetPreset('complete')" class="asset-preset-btn active" data-preset="complete" style="flex:1;padding:5px;border-radius:6px;border:1px solid rgba(245,158,11,0.5);background:rgba(245,158,11,0.1);color:#f59e0b;font-size:9px;cursor:pointer;font-weight:600;" title="${t('tooltip.completePreset')}">${Icons.package} ${t('export.presetComplete')}</button>
              <button onclick="App._setAssetPreset('edit')" class="asset-preset-btn" data-preset="edit" style="flex:1;padding:5px;border-radius:6px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text-2);font-size:9px;cursor:pointer;" title="${t('tooltip.editPreset')}">${Icons.scissors} ${t('export.presetEdit')}</button>
            </div>

            <button onclick="App._startAssetExport()" id="asset-export-btn" style="width:100%;padding:8px;border-radius:8px;border:none;background:#4b5563;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">${Icons.package} ${t('export.exportAssets')}</button>

            <div id="asset-export-progress" style="display:none;margin-top:8px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span id="asset-status-text" style="font-size:10px;color:var(--text-3);">${t('export.preparing')}</span>
                <span id="asset-pct-text" style="font-size:10px;color:#f59e0b;font-weight:700;">0%</span>
              </div>
              <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                <div id="asset-progress-bar" style="height:100%;width:0%;background:#6b7280;border-radius:3px;transition:width 0.2s;"></div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>`;
}

function renderDashboard() {
  const currentLang = i18n.getLocale();
  const icon24 = (svg) => svg.replace(/width="\d+"/, 'width="24"').replace(/height="\d+"/, 'height="24"');
  return `
  <div class="dashboard" id="dashboard">
    <!-- Language Selector (Top Right) -->
    <div style="position:absolute;top:16px;right:24px;display:flex;gap:4px;background:var(--surface-2);border-radius:4px;padding:3px;z-index:100;">
      <button onclick="i18n.changeLocale('en')" title="English" style="padding:6px 12px;border-radius:4px;border:none;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;background:${currentLang === 'en' ? 'var(--accent)' : 'transparent'};color:${currentLang === 'en' ? '#fff' : 'var(--text-2)'};">EN</button>
      <button onclick="i18n.changeLocale('pt-BR')" title="Português" style="padding:6px 12px;border-radius:4px;border:none;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;background:${currentLang === 'pt-BR' ? 'var(--accent)' : 'transparent'};color:${currentLang === 'pt-BR' ? '#fff' : 'var(--text-2)'};">PT</button>
    </div>
    <div class="dashboard-header">
      <div class="logo-big">${Icons.logo.replace(/width="\d+"/, 'width="48"').replace(/height="\d+"/, 'height="48"')}</div>
      <h1>${t('dashboard.title')}</h1>
      <p>${t('dashboard.subtitle')}</p>
    </div>
    <div class="dashboard-actions">
      <div style="width:100%;max-width:1040px;margin:0 auto 28px;display:grid;gap:14px;">
        <div style="background:#1a1a1a;border:1px solid #333333;border-radius:4px;padding:20px 20px 18px;box-shadow:var(--sh-md);">
          <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">${t('dashboard.primaryTitle')}</div>
          <div style="font-size:14px;color:var(--text-1);max-width:660px;line-height:1.55;margin-bottom:14px;">${t('dashboard.primaryDescription')}</div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-lg dashboard-primary-cta" onclick="App.newProject('vertical')" style="display:inline-flex;align-items:center;gap:10px;padding:12px 18px;font-size:14px;background:#14b8a6;color:#ffffff;border:none;box-shadow:0 0 0 1px rgba(20,184,166,0.35),0 8px 20px rgba(20,184,166,0.28);">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:32px;background:rgba(255,255,255,0.25);border-radius:3px;flex-shrink:0;"></span>
              <span>Stories / Reels</span>
            </button>
            <div style="display:flex;gap:6px;">
              <button onclick="App.newProject('widescreen')" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 12px;border-radius:6px;border:1px solid #444;background:#1a1a1a;color:#a0a0a0;font-size:10px;cursor:pointer;transition:all 0.15s;min-width:56px;" onmouseenter="this.style.borderColor='#14b8a6';this.style.color='#fff'" onmouseleave="this.style.borderColor='#444';this.style.color='#a0a0a0'" title="YouTube, TV">
                <span style="display:block;width:32px;height:18px;background:#444;border-radius:2px;"></span>
                <span>YouTube</span>
              </button>
              <button onclick="App.newProject('square')" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 12px;border-radius:6px;border:1px solid #444;background:#1a1a1a;color:#a0a0a0;font-size:10px;cursor:pointer;transition:all 0.15s;min-width:56px;" onmouseenter="this.style.borderColor='#14b8a6';this.style.color='#fff'" onmouseleave="this.style.borderColor='#444';this.style.color='#a0a0a0'" title="Instagram Feed">
                <span style="display:block;width:24px;height:24px;background:#444;border-radius:2px;"></span>
                <span>Feed</span>
              </button>
              <button onclick="App.newProject('portrait')" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 12px;border-radius:6px;border:1px solid #444;background:#1a1a1a;color:#a0a0a0;font-size:10px;cursor:pointer;transition:all 0.15s;min-width:56px;" onmouseenter="this.style.borderColor='#14b8a6';this.style.color='#fff'" onmouseleave="this.style.borderColor='#444';this.style.color='#a0a0a0'" title="Apresentações">
                <span style="display:block;width:28px;height:21px;background:#444;border-radius:2px;"></span>
                <span>Slides</span>
              </button>
            </div>
          </div>
        </div>

        <!-- More Options Accordion (Import, Script, Templates) -->
        <details class="more-options-accordion" id="more-options-accordion" ${localStorage.getItem('hqm_more_options_expanded') === 'true' ? 'open' : ''} ontoggle="localStorage.setItem('hqm_more_options_expanded', this.open)">
          <summary class="more-options-summary">
            <span class="more-options-arrow">▸</span>
            <span>${t('dashboard.moreOptions') || 'More options'}</span>
          </summary>
          <div class="more-options-content">
            <!-- Import / Script Cards -->
            <div class="more-options-cards">
              <button class="more-options-card" onclick="document.getElementById('import-project-input').click()">
                <span class="more-options-card-icon">${Icons.download}</span>
                <span class="more-options-card-label">${t('dashboard.import')}</span>
              </button>
              <button class="more-options-card" onclick="App.showBulkTextModal()">
                <span class="more-options-card-icon">${Icons.fileText}</span>
                <span class="more-options-card-label">${t('dashboard.createFromScript')}</span>
              </button>
            </div>
            
            <!-- Templates Section -->
            <div class="more-options-templates">
              <div class="more-options-templates-header">
                <span class="more-options-templates-label">${t('dashboard.templatesTitle') || 'Templates'}</span>
                <div class="more-options-templates-actions">
                  <button class="btn btn-ghost btn-sm" onclick="App.showBulkAudioModal()" title="Audio project">
                    <span>${icon24(Icons.mic)}</span> Audio
                  </button>
                  <button class="btn btn-ghost btn-sm" onclick="App.createDemoProject()" title="Demo project">
                    <span>${icon24(Icons.play)}</span> Demo
                  </button>
                </div>
              </div>
              <div class="more-options-templates-grid">
                <button type="button" class="template-card" onclick="App.createFromTemplate('motion-comic')">
                  <div class="template-card-icon">${icon24(Icons.grid)}</div>
                  <div class="template-card-title">${t('templates.motionComic')}</div>
                  <div class="template-card-meta">4 pgs · 2×2</div>
                </button>
                <button type="button" class="template-card" onclick="App.createFromTemplate('podcast')">
                  <div class="template-card-icon">${icon24(Icons.headphones)}</div>
                  <div class="template-card-title">${t('templates.podcast')}</div>
                  <div class="template-card-meta">8 pgs · Full</div>
                </button>
                <button type="button" class="template-card" onclick="App.createFromTemplate('tutorial')">
                  <div class="template-card-icon">${icon24(Icons.bookOpen)}</div>
                  <div class="template-card-title">${t('templates.tutorial')}</div>
                  <div class="template-card-meta">6 pgs · Text</div>
                </button>
                <button type="button" class="template-card" onclick="App.createFromTemplate('story')">
                  <div class="template-card-icon">${icon24(Icons.smartphone)}</div>
                  <div class="template-card-title">${t('templates.story')}</div>
                  <div class="template-card-meta">5 pgs · 9:16</div>
                </button>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
    <div class="dashboard-projects" id="projects-section"></div>
    <div class="toast-container" id="toast-container"></div>
  </div>`;
}

function renderProjectsList() {
  const projects = Store.get('projects');
  const section = document.getElementById('projects-section');
  if (!section) return;
  if (!projects.length) { section.innerHTML = ''; return; }
  const cards = projects.map(p => {
    const d = new Date(p.metadata.updatedAt);
    const preview = p.thumbnail ? `<img src="${p.thumbnail}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" alt="Preview">` : Icons.page;
    return `<div class="project-card" role="button" tabindex="0" aria-label="${S_ATTR(p.metadata.name)}" onclick="App.openProject('${p.id}')" onkeydown="if(event.target===this && (event.key==='Enter' || event.key===' ')){event.preventDefault();App.openProject('${p.id}');}">
      <div class="card-preview">${preview}</div>
      <h4 class="truncate">${S(p.metadata.name)}</h4>
      <div class="card-meta"><span>${p.pages?.length || 0} ${t('dashboard.pag')}</span><span>${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div>
      <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();App.deleteProjectConfirm('${p.id}')" style="margin-top:4px;width:100%">${Icons.trash} ${t('common.delete')}</button>
    </div>`;
  }).join('');
  section.innerHTML = `<h2>${t('dashboard.recentProjects')}</h2><div class="projects-grid" style="max-height:320px;overflow-y:auto;padding-right:4px;">${cards}</div>`;
}

function renderEditor() {
  const p = Store.get('currentProject');
  if (!p) return '';
  const page = Store.getActivePage();
  const tbActive = page && page.showTextBelow;
  return `
  <div class="toolbar" id="toolbar">
    <div class="toolbar-left">
      <button class="btn btn-icon" onclick="App.goHome()" title="${t('tooltip.home')}" aria-label="${t('toolbar.home')}">${Icons.home}</button>
      <div class="toolbar-divider"></div>
      <span class="logo-icon">${Icons.logo}</span>
      <input type="text" class="project-name-input" value="${S_ATTR(p.metadata.name)}" onchange="App.renameProject(this.value)" spellcheck="false">
      <span id="save-indicator" class="save-indicator" style="font-size:10px;color:var(--success);margin-left:8px;opacity:0.8;">${t('toolbar.saved')}</span>
    </div>
    <div class="toolbar-center">
     <div style="position:relative;display:inline-flex;">
       <button class="btn btn-icon" onclick="App.undo()" title="${t('toolbar.undo')}" style="${Store.get('undoStack')?.length ? '' : 'opacity:0.35;pointer-events:none;'}">${Icons.undo}</button>
       ${Store.get('undoStack')?.length ? `<span style="position:absolute;top:-2px;right:-2px;width:14px;height:14px;background:var(--accent);color:#fff;font-size:8px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;">${Store.get('undoStack').length}</span>` : ''}
     </div>
     <div style="position:relative;display:inline-flex;">
       <button class="btn btn-icon" onclick="App.redo()" title="${t('toolbar.redo')}" style="${Store.get('redoStack')?.length ? '' : 'opacity:0.35;pointer-events:none;'}">${Icons.redo}</button>
       ${Store.get('redoStack')?.length ? `<span style="position:absolute;top:-2px;right:-2px;width:14px;height:14px;background:var(--accent);color:#fff;font-size:8px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;">${Store.get('redoStack').length}</span>` : ''}
     </div>
      <div class="toolbar-divider"></div>
      <details class="toolbar-compact-menu">
        <summary class="toolbar-compact-summary" title="${t('toolbar.properties')}">${Icons.settings}<span>Canvas</span></summary>
        <div class="toolbar-compact-panel">
          <button class="btn btn-sm ${tbActive ? 'btn-active' : 'btn-ghost'}" onclick="App.toggleTextBelow()" title="${t('toolbar.textBelow')}">${Icons.textBelow} ${t('toolbar.text')}</button>
          <button class="btn btn-sm ${Store.get('showGuides') ? 'btn-active' : 'btn-ghost'}" onclick="App.toggleGuides()" title="${t('toolbar.guides')}">${Icons.grid} ${t('toolbar.guides')}</button>
        </div>
      </details>
    </div>
    <div class="toolbar-right">
      <div class="toolbar-lang-section" style="display:inline-flex;align-items:center;gap:6px;margin-right:8px;">
        <span style="font-size:11px;color:var(--text-2);font-weight:500;">${t('toolbar.language')}:</span>
        <div class="toolbar-lang-toggle" style="display:inline-flex;gap:3px;background:rgba(107,114,128,0.15);border:1px solid rgba(107,114,128,0.3);border-radius:4px;padding:3px;">
          <button onclick="i18n.changeLocale('en')" title="${t('toolbar.switchToEnglish')}" class="btn-lang${i18n.getLocale() === 'en' ? ' btn-lang-active' : ''}" style="padding:6px 14px;border-radius:3px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;background:${i18n.getLocale() === 'en' ? 'var(--accent)' : 'transparent'};color:${i18n.getLocale() === 'en' ? '#fff' : 'var(--text-2)'};">EN</button>
          <button onclick="i18n.changeLocale('pt-BR')" title="${t('toolbar.switchToPortuguese')}" class="btn-lang${i18n.getLocale() === 'pt-BR' ? ' btn-lang-active' : ''}" style="padding:6px 14px;border-radius:3px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;background:${i18n.getLocale() === 'pt-BR' ? 'var(--accent)' : 'transparent'};color:${i18n.getLocale() === 'pt-BR' ? '#fff' : 'var(--text-2)'};">PT</button>
        </div>
      </div>
      <button class="btn btn-icon" onclick="App.toggleFullscreenPreview()" title="${t('toolbar.fullscreenPreview')}" aria-label="${t('toolbar.fullscreenPreview')}">${Icons.zoomFit}</button>
      <button class="btn btn-icon" onclick="App.showShortcutsHelp()" title="${t('toolbar.shortcuts')}" aria-label="${t('toolbar.shortcuts')}">?</button>
      <button class="btn btn-icon" onclick="App.toggleLeft()" title="${t('toolbar.tools')}" aria-label="${t('toolbar.tools')}">${Icons.menu}</button>
      <button class="btn btn-icon" onclick="App.toggleRight()" title="${t('tooltip.properties')}" aria-label="${t('toolbar.properties')}">${Icons.settings}</button>
      <div class="toolbar-divider"></div>
      <button class="btn btn-primary btn-sm" onclick="App.openExportPage()">${Icons.export} ${t('toolbar.export')}</button>
    </div>
  </div>
  <div class="workspace" id="workspace">
    <div class="left-panel ${Store.get('leftPanelOpen') ? '' : 'collapsed'}" id="left-panel">
      ${renderLeftPanel()}
      <button class="sidebar-toggle sidebar-toggle-left" onclick="App.toggleLeft()">
        ${Store.get('leftPanelOpen') ? '‹' : '›'}
      </button>
    </div>
    <div class="canvas-area" id="canvas-area" onclick="App.handleCanvasAreaClick(event)" onmousedown="App.handleCanvasAreaMouseDown(event)" ondragover="event.preventDefault();event.dataTransfer.dropEffect='copy'" ondrop="App.handleDrop(event)">
      <div class="canvas-scroll" id="canvas-scroll"></div>
      ${renderZoomControls()}
    </div>
    <div class="right-panel ${Store.get('rightPanelOpen') ? '' : 'collapsed'}" id="right-panel">
      <button class="sidebar-toggle sidebar-toggle-right" onclick="App.toggleRight()">
        ${Store.get('rightPanelOpen') ? '›' : '‹'}
      </button>
      <div id="right-panel-content"></div>
    </div>
  </div>
  <div id="timeline-bar" class="timeline-bar hidden"></div>
  <div id="mobile-page-carousel" class="timeline"></div>
  <div class="mobile-editor-nav" aria-label="${t('mobileNav.title')}">
    <button class="mobile-editor-nav-btn ${(Store.get('mobileWorkflowStep') || 'media') === 'media' ? 'active' : ''}" onclick="App.openMobileWorkflow('media')">${Icons.imageIcon}<span>${t('mobileNav.media')}</span></button>
    <button class="mobile-editor-nav-btn ${(Store.get('mobileWorkflowStep') || 'media') === 'text' ? 'active' : ''}" onclick="App.openMobileWorkflow('text')">${Icons.text}<span>${t('mobileNav.text')}</span></button>
    <button class="mobile-editor-nav-btn" onclick="App.openExcalidraw()">${Icons.pencil}<span>${t('mobileNav.draw')}</span></button>
    <button class="mobile-editor-nav-btn ${(Store.get('mobileWorkflowStep') || 'media') === 'timing' ? 'active' : ''}" onclick="App.openMobileWorkflow('timing')">${Icons.clock}<span>${t('mobileNav.timing')}</span></button>
    <button class="mobile-editor-nav-btn" onclick="App.openMobileWorkflow('preview')">${Icons.zoomFit}<span>${t('mobileNav.preview')}</span></button>
    <button class="mobile-editor-nav-btn" onclick="App.openMobileWorkflow('export')">${Icons.export}<span>${t('mobileNav.export')}</span></button>
  </div>
  <div class="toast-container" id="toast-container"></div>
  <div class="modal-backdrop" id="modal-backdrop" onclick="App.closeModal()">
    <div class="modal" id="modal-content" onclick="event.stopPropagation()"></div>
  </div>
  <!-- Mobile Sidebar Toggle (FAB) -->
  <button class="mobile-sidebar-fab" onclick="App.toggleMobileSidebar()" title="${t('toolbar.properties')}" aria-label="${t('toolbar.properties')}">
    ☰
  </button>
  <div class="mobile-backdrop" onclick="App.toggleMobileSidebar()"></div>
  <!-- file-input is in index.html as file-input-persistent -->`;
}

function renderMobileDrawerShell(title, content) {
  return `
    <div class="mobile-drawer-shell">
      <div class="mobile-drawer-title">${title}</div>
      ${content}
    </div>
  `;
}

function getMobileDrawerContextTitle(step, mode) {
  const stepLabel = step === 'text'
    ? t('mobileNav.text')
    : step === 'timing'
      ? t('mobileNav.timing')
      : t('mobileNav.media');
  const modeLabel = mode === 'tools' ? t('toolbar.tools') : t('toolbar.properties');
  return `${stepLabel} · ${modeLabel}`;
}

function renderMobileTextTools() {
  const p = Store.get('currentProject');
  if (!p) return '';
  const page = Store.getActivePage() || {};
  const _isMateria = page?.type === 'materia' || page?.isMateria === true;
  const _dis = (type) => _isMateria && ['thought','shout','sfx'].includes(type) ? 'disabled-in-context' : '';
  const _title = (type, orig) => _isMateria && ['thought','shout','sfx'].includes(type) ? t('balloons.notAvailableMateria') : orig;
  const _btnStyle = `display:flex; flex-direction:column; align-items:center; gap:4px; padding:12px 8px; border:1px solid var(--border); border-radius:8px; background:var(--surface2); color:var(--text2); cursor:pointer; font-size:11px; transition:all 0.12s; min-height:60px;`;
  const _hover = `onmouseenter="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--text2)'"`;
  
  return `
    <div style="padding:12px;">
      <div style="font-size:10px;font-weight:700;color:var(--text3);letter-spacing:1px;margin-bottom:10px;">${t('sidebar.comicElements')}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        <button data-balloon-type="narration" class="${_dis('narration')}" onclick="App.startBalloonPlacement('narration');App.closeMobileSidebar()" title="${_title('narration',t('balloons.narrationTooltip'))}" style="${_btnStyle}" ${_hover}>
          ${Icons.narrationBox} <span>${t('balloons.narration')}</span>
        </button>
        <button data-balloon-type="speech" class="${_dis('speech')}" onclick="App.startBalloonPlacement('speech');App.closeMobileSidebar()" title="${_title('speech',t('balloons.speechTooltip'))}" style="${_btnStyle}" ${_hover}>
          ${Icons.balloon} <span>${t('balloons.speech')}</span>
        </button>
        <button data-balloon-type="thought" class="${_dis('thought')}" onclick="App.startBalloonPlacement('thought');App.closeMobileSidebar()" title="${_title('thought',t('balloons.thoughtTooltip'))}" style="${_btnStyle}" ${_hover}>
          ${Icons.thought} <span>${t('balloons.thought')}</span>
        </button>
        <button data-balloon-type="shout" class="${_dis('shout')}" onclick="App.startBalloonPlacement('shout');App.closeMobileSidebar()" title="${_title('shout',t('balloons.shoutTooltip'))}" style="${_btnStyle}" ${_hover}>
          ${Icons.shout} <span>${t('balloons.shout')}</span>
        </button>
        <button data-balloon-type="caption" class="${_dis('caption')}" onclick="App.startBalloonPlacement('caption');App.closeMobileSidebar()" title="${_title('caption',t('balloons.captionTooltip'))}" style="${_btnStyle}" ${_hover}>
          ${Icons.fileText} <span>${t('balloons.caption')}</span>
        </button>
        <button data-balloon-type="sfx" class="${_dis('sfx')}" onclick="App.addSfxToPage();App.closeMobileSidebar()" title="${_title('sfx',t('balloons.sfxTooltip'))}" style="${_btnStyle}" ${_hover}>
          ${Icons.text} <span>${t('balloons.sfx')}</span>
        </button>
      </div>
      <button onclick="App.openExcalidrawModal()" style="margin-top:12px;width:100%;padding:12px;border-radius:8px;border:1px dashed var(--accent);background:rgba(107,114,128,0.05);color:var(--accent);font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;">
        ${t('sidebar.createArt')}
      </button>
      
      <!-- TEXTO NARRATIVO Section -->
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
        <div style="font-size:10px;font-weight:700;color:var(--text3);letter-spacing:1px;margin-bottom:10px;">TEXTO NARRATIVO</div>
        ${(() => {
          const _pg = Store.getActivePage();
          const _active = _pg?.showTextBelow || false;
          const _narr = _pg?.narrative || '';
          const _narrText = typeof _narr === 'string' ? _narr : (_narr?.['pt-BR'] || _narr?.en || '');
          const _h = _pg?.narrativeHeight || 120;
          
          return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface2);border-radius:8px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              ${Icons.textBelow}
              <span style="font-size:12px;font-weight:500;color:var(--text);">Ativar Narrativa</span>
            </div>
            <button onclick="App.toggleTextBelow()" style="width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:all 0.2s;background:${_active ? 'var(--accent)' : 'var(--border)'};">
              <span style="position:absolute;top:2px;${_active ? 'right:2px' : 'left:2px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>
            </button>
          </div>
          ${_active ? `
          <textarea 
            placeholder="Escreva a narrativa aqui..."
            oninput="App.updateNarrative(this.value)"
            style="width:100%;min-height:80px;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:13px;line-height:1.5;resize:vertical;font-family:var(--font-story);margin-bottom:10px;box-sizing:border-box;"
          >${_narrText}</textarea>
          <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border-radius:8px;">
            <span style="font-size:10px;color:var(--text3);white-space:nowrap;">Altura:</span>
            <input type="range" min="40" max="400" value="${_h}" 
              oninput="App.setNarrativeHeight(parseInt(this.value));this.nextElementSibling.textContent=this.value+'px'"
              style="flex:1;height:4px;cursor:pointer;">
            <span style="font-size:10px;color:var(--text2);min-width:40px;text-align:right;">${_h}px</span>
          </div>
          ` : `
          <div style="padding:16px;background:rgba(107,114,128,0.05);border-radius:8px;border:1px dashed var(--border);">
            <p style="font-size:11px;color:var(--text3);margin:0;text-align:center;">
              Ative para adicionar texto embaixo dos painéis
            </p>
          </div>
          `}`;
        })()}
      </div>
    </div>
  `;
}

function renderPanelCountButtons(targetCount) {
  return [1,2,3,4,5,6,7,8,9].map(c => {
    const varCount = LayoutEngine.getForCount(c).filter(opt => opt.count === c).length;
    const isActive = c === targetCount;
    const borderStyle = isActive ? 'var(--accent)' : 'var(--border)';
    const bgColor = isActive ? 'var(--accent)' : 'var(--surface2)';
    const textColor = isActive ? '#fff' : 'var(--text2)';
    return '<button onclick="App.setPlannedCount(' + c + ')" title="' + c + ' painéis — ' + varCount + ' variações" style="padding:6px 0;border-radius:4px;border:1.5px solid ' + borderStyle + ';background:' + bgColor + ';color:' + textColor + ';font-size:12px;font-weight:700;cursor:pointer;transition:all 0.12s;">' + c + '</button>';
  }).join('');
}

function renderVideoLayoutsSection(layoutOptions, currentLayoutId, videoFormat) {
  if (!layoutOptions || layoutOptions.length === 0) return '<div style="color:var(--text3);font-size:11px;padding:8px;">Nenhum layout disponível</div>';
  
  const fmt = VIDEO_FORMATS[videoFormat];
  const previewW = fmt && fmt.width > fmt.height ? 60 : 36;
  const previewH = fmt && fmt.width > fmt.height ? 34 : 64;
  
  return layoutOptions.map(opt => {
    const isCurrentLayout = opt.id === currentLayoutId;
    const optBorder = isCurrentLayout ? 'var(--accent)' : 'var(--border)';
    const bgColor = isCurrentLayout ? 'rgba(107,114,128,0.15)' : 'var(--surface2)';
    const textColor = isCurrentLayout ? 'var(--accent)' : 'var(--text2)';
    const fontWeight = isCurrentLayout ? '700' : '500';
    const checkmark = isCurrentLayout ? '<span style="position:absolute;top:4px;right:4px;font-size:10px;color:var(--accent);">✓</span>' : '';
    
    return '<button onclick="App.setLayout(\'' + opt.id + '\')" title="' + opt.name + '" style="border-radius:8px;border:2px solid ' + optBorder + ';background:' + bgColor + ';cursor:pointer;padding:10px 8px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all 0.15s;position:relative;">'
      + checkmark
      + LayoutEngine.preview(opt.id, previewW, previewH)
      + '<span style="font-size:10px;color:' + textColor + ';font-weight:' + fontWeight + ';text-align:center;">' + opt.name + '</span>'
      + '<span style="font-size:9px;color:var(--text3);">' + opt.count + (opt.count === 1 ? ' painel' : ' painéis') + '</span>'
      + '</button>';
  }).join('');
}

function renderCustomLayoutsSection(p, currentLayoutId) {
  if (!p.customLayouts || p.customLayouts.length === 0) return '';
  
  return `
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">
      <span style="font-size:9px;color:var(--text3);display:block;margin-bottom:6px;padding-left:2px;">MEUS LAYOUTS (${p.customLayouts.length})</span>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">
        ${p.customLayouts.map(custom => {
          const isCurrentLayout = custom.id === currentLayoutId;
          const isFavorite = p.favoriteLayoutId === custom.id;
          const optBorder = isCurrentLayout ? 'var(--accent)' : 'var(--border)';
          const optName = custom.name.length > 10 ? custom.name.substring(0,9)+'…' : custom.name;
          return `<div style="border-radius:6px;border:2px solid ${optBorder};background:${isCurrentLayout ? 'rgba(107,114,128,0.15)' : 'var(--surface2)'};padding:4px;display:flex;flex-direction:column;align-items:center;gap:2px;position:relative;">
            <img src="${custom.thumbnail}" onclick="App.setLayout('${custom.id}')" style="width:36px;height:50px;border-radius:3px;cursor:pointer;" title="${custom.name}">
            ${isCurrentLayout ? '<span style="position:absolute;top:2px;right:2px;font-size:8px;color:var(--accent);">✓</span>' : ''}
            <span onclick="event.stopPropagation();App.setFavoriteLayout('${custom.id}')" style="position:absolute;top:2px;left:2px;font-size:9px;color:${isFavorite ? 'var(--warning)' : 'var(--text3)'};cursor:pointer;opacity:${isFavorite ? '1' : '0.4'};" title="${isFavorite ? 'Remover padrao' : 'Definir como padrao'}">★</span>
            <span style="font-size:8px;color:${isCurrentLayout ? 'var(--accent)' : 'var(--text3)'};max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:${isCurrentLayout ? '700' : '500'};">${optName}</span>
            <div style="display:flex;gap:4px;margin-top:2px;">
              <button onclick="App.enterLayoutEditor('${custom.id}')" title="Editar" style="padding:2px 6px;border:none;background:var(--surface);border-radius:3px;cursor:pointer;font-size:9px;color:var(--text2);">✏</button>
              <button onclick="App.deleteCustomLayout('${custom.id}')" title="Deletar" style="padding:2px 6px;border:none;background:var(--surface);border-radius:3px;cursor:pointer;font-size:9px;color:var(--error);">✕</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderLayoutEditorSidebar() {
  const panels = Store.get('layoutEditorPanels') || [];
  const sel = Store.get('layoutEditorSelectedPanel');
  const fills = ['#5b8def','#e8625c','#50c878','#f5a623','#9b59b6','#1abc9c','#e74c8b','#34495e','#f39c12'];

  const panelListHTML = panels.map((panel, i) => {
    const isSel = i === sel;
    const col = fills[i % fills.length];
    return `<div onclick="App.layoutEditorSelectPanel(${i})" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;border:1.5px solid ${isSel ? col : 'transparent'};background:${isSel ? col+'15' : 'transparent'};transition:all 0.1s;" onmouseenter="if(!${isSel})this.style.background='var(--hover)'" onmouseleave="if(!${isSel})this.style.background='transparent'">
      <div style="width:22px;height:22px;border-radius:50%;background:${col};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0;">${panel.order||i+1}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:11px;font-weight:600;color:${isSel?'var(--text)':'var(--text2)'};">Panel ${panel.order||i+1}</div>
        <div style="font-size:9px;color:var(--text3);font-family:monospace;">${panel.w}x${panel.h} @ (${panel.x},${panel.y})</div>
      </div>
      ${panels.length > 1 ? `<button onclick="event.stopPropagation();App.layoutEditorDeletePanel(${i})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:11px;padding:2px;opacity:0.5;" title="${t('layoutEditor.deletePanel')}">✕</button>` : ''}
    </div>`;
  }).join('');

  // Numeric inputs for selected panel
  let numericHTML = '';
  if (sel >= 0 && sel < panels.length) {
    const sp = panels[sel];
    const _d = getProjectDims();
    const inputStyle = 'width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text);font-size:11px;font-family:monospace;box-sizing:border-box;';
    const labelStyle = 'font-size:9px;color:var(--text3);font-weight:600;display:block;margin-bottom:2px;';
    numericHTML = `
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
        <div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:8px;">${t('layoutEditor.panelProperties', {number: sp.order||sel+1})}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div><label style="${labelStyle}">${t('layoutEditor.x')}</label><input type="number" value="${sp.x}" min="0" max="${_d.contentW-sp.w}" style="${inputStyle}" onchange="App.layoutEditorSetPanelProp(${sel},'x',this.value)"></div>
          <div><label style="${labelStyle}">${t('layoutEditor.y')}</label><input type="number" value="${sp.y}" min="0" max="${_d.contentH-sp.h}" style="${inputStyle}" onchange="App.layoutEditorSetPanelProp(${sel},'y',this.value)"></div>
          <div><label style="${labelStyle}">${t('layoutEditor.w')}</label><input type="number" value="${sp.w}" min="80" max="${_d.contentW-sp.x}" style="${inputStyle}" onchange="App.layoutEditorSetPanelProp(${sel},'w',this.value)"></div>
          <div><label style="${labelStyle}">${t('layoutEditor.h')}</label><input type="number" value="${sp.h}" min="60" max="${_d.contentH-sp.y}" style="${inputStyle}" onchange="App.layoutEditorSetPanelProp(${sel},'h',this.value)"></div>
        </div>
      </div>`;
  }

  // Quick grid presets
  const gridBtnStyle = 'padding:5px 0;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text2);cursor:pointer;font-size:10px;font-weight:600;transition:all 0.1s;';
  const gridsHTML = `
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
      <div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:6px;">${t('layoutEditor.quickGrid')}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">
        <button onclick="App.layoutEditorApplyGrid('2x1')" style="${gridBtnStyle}" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">2x1</button>
        <button onclick="App.layoutEditorApplyGrid('1x2')" style="${gridBtnStyle}" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">1x2</button>
        <button onclick="App.layoutEditorApplyGrid('2x2')" style="${gridBtnStyle}" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">2x2</button>
        <button onclick="App.layoutEditorApplyGrid('3x1')" style="${gridBtnStyle}" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">3x1</button>
        <button onclick="App.layoutEditorApplyGrid('3x2')" style="${gridBtnStyle}" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">3x2</button>
        <button onclick="App.layoutEditorApplyGrid('3x3')" style="${gridBtnStyle}" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">3x3</button>
      </div>
    </div>`;

  return `
    <div style="padding:8px 0;overflow-y:auto;height:100%;">
      <div style="padding:8px 12px 10px;background:linear-gradient(135deg,rgba(107,114,128,0.12),rgba(107,114,128,0.04));border-bottom:1px solid var(--border);margin-bottom:8px;">
        <div style="font-size:12px;font-weight:700;color:var(--accent);display:flex;align-items:center;gap:6px;">
          <span style="font-size:16px;">✏</span> ${t('layoutEditor.title')}
        </div>
        <div style="font-size:10px;color:var(--text2);margin-top:2px;">${panels.length} ${t('sidebar.panels')} — ${t('layoutEditor.clickToSelect')}</div>
      </div>
      <div style="padding:0 8px;">
        <div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:6px;">${t('layoutEditor.panels')}</div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          ${panelListHTML}
        </div>
        <button onclick="App.layoutEditorAddPanel()" style="margin-top:6px;width:100%;padding:6px;border:1px dashed var(--border3);background:transparent;color:var(--text2);border-radius:6px;cursor:pointer;font-size:11px;font-weight:500;">${t('layoutEditor.addPanel')}</button>
        ${numericHTML}
        ${gridsHTML}
        <div style="margin-top:14px;display:flex;gap:6px;">
          <button onclick="App.exitLayoutEditor(true)" style="flex:1;padding:8px;border:none;background:var(--accent);color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">${t('layoutEditor.save')}</button>
          <button onclick="App.exitLayoutEditor(false)" style="flex:1;padding:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);border-radius:6px;cursor:pointer;font-size:12px;">${t('layoutEditor.cancel')}</button>
        </div>
      </div>
    </div>
  `;
}

function renderLeftPanel() {
  const p = Store.get('currentProject');
  const active = Store.get('activePageIndex');
  if (!p) return '';

  // When layout editor is active, show dedicated editor sidebar
  if (Store.get('layoutEditorActive')) {
    return renderLayoutEditorSidebar();
  }

  const scenes = p.pages.map((page, i) => {
    const qCount = page.images?.filter(img => img && img.src).length || 0;
    const balloonCount = page.texts?.length || 0;
    const hasText = page.showTextBelow ? 'T' : '';
    const hasImages = qCount > 0;
    const hasBalloons = balloonCount > 0;
    const isEmpty = !hasImages && !hasBalloons && !page.showTextBelow;
    const statusColor = isEmpty ? 'var(--error, #ef4444)' : (hasImages && hasBalloons ? 'var(--success, #22c55e)' : 'var(--warning, #f59e0b)');
    return `<div class="scene-item ${i === active ? 'active' : ''}" onclick="App.setActivePage(${i})" oncontextmenu="event.preventDefault();App.showPageContextMenu(event,${i})" draggable="true" ondragstart="event.dataTransfer.setData('text/plain','page:'+${i});event.dataTransfer.effectAllowed='move';" ondragover="event.preventDefault();this.style.borderTop='2px solid var(--accent)';" ondragleave="this.style.borderTop='none';" ondrop="event.preventDefault();this.style.borderTop='none';const src=parseInt(event.dataTransfer.getData('text/plain').split(':')[1]);if(!isNaN(src)&&src!==${i})App.movePage(src,${i}-src);" style="padding: 6px 10px; margin: 1px 8px; cursor: pointer; border-radius: 6px; border-left: ${i === active ? '3px solid var(--accent)' : '3px solid transparent'}; background: ${i === active ? 'var(--hover)' : 'transparent'}; display:flex; align-items:center; justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="width:6px;height:6px;border-radius:50%;background:${statusColor};flex-shrink:0;" title="${isEmpty ? t('sidebar.empty') : (hasImages && hasBalloons ? t('sidebar.complete') : t('sidebar.inProgress'))}"></span>
        <span style="font-weight: 600; font-size:12px; color: ${i === active ? 'var(--text)' : 'var(--text2)'};">Pg ${i + 1}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size: 10px; color: var(--text3)">${qCount > 0 ? qCount+'img' : ''}${hasBalloons ? ' '+balloonCount+'b' : ''} ${hasText}</span>
        ${p.pages.length > 1 ? `<button onclick="event.stopPropagation();App.deletePage(${i})" title="${t('sidebar.deletePage')}" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:0;font-size:11px;line-height:1;opacity:0.5;">✕</button>` : ''}
      </div>
    </div>`;
  }).join('');

  const page = p.pages[active] || {};
  const currentLayoutTpl = page.layoutId ? LayoutEngine.get(page.layoutId, page.images || []) : null;
  
  // Check if this is a video project
  const videoFormat = p.videoFormat || null;
  const isVideoProject = !!videoFormat;
  
  // Get panel count from current layout (handle dynamic layouts with count -1)
  let currentCount = 0;
  if (currentLayoutTpl) {
    if (currentLayoutTpl.count > 0) {
      currentCount = currentLayoutTpl.count;
    } else if (currentLayoutTpl.isDynamic && currentLayoutTpl.panels) {
      // For dynamic layouts, use actual panel count or image count
      currentCount = currentLayoutTpl.panels.length || (page.images ? page.images.filter(img => img && img.src).length : 0);
    }
  }
  
  // Use plannedCount as preference, then currentCount, then default to 1 (not 3!)
  const plannedCount = page.plannedCount || Store.get('plannedCount') || 0;
  const targetCount = plannedCount || currentCount || 1;
  
  // Get layout options - video layouts for video projects, A4 layouts otherwise
  const layoutOptions = isVideoProject 
    ? LayoutEngine.getVideoLayouts(videoFormat)
    : LayoutEngine.getForCount(targetCount).filter(opt => opt.count === targetCount);
  const currentLayoutId = page.layoutId || (isVideoProject ? getDefaultVideoLayout(videoFormat) : LayoutEngine.getDefaultForCount(targetCount));
  const variationsExpanded = ((Store.get('sidebarCollapsed') || {}).variationsExpanded === true);
  const layoutCollapsed = (Store.get('sidebarCollapsed') || {}).leftLayout;
  const leftMateriaCollapsed = (Store.get('sidebarCollapsed') || {}).leftMateria === undefined ? true : (Store.get('sidebarCollapsed') || {}).leftMateria;

  const coverActive = Store.get('coverActive');

  // Build cover section HTML (avoid nested template literal issues)
  let coverSectionHTML;
  if (p.cover) {
    const coverTitle = p.cover.title ? p.cover.title.substring(0, 12) + (p.cover.title.length > 12 ? '…' : '') : t('sidebar.noTitle');
    const coverBorder = coverActive ? '3px solid var(--accent)' : '3px solid transparent';
    const coverBg = coverActive ? 'var(--hover)' : 'rgba(107,114,128,0.06)';
    const coverColor = coverActive ? 'var(--text)' : 'var(--accent)';
    const coverActiveClass = coverActive ? 'active' : '';
    coverSectionHTML = '<div class="scene-item cover-scene-item ' + coverActiveClass + '" onclick="App.setActiveCover()" oncontextmenu="event.preventDefault();App.showCoverContextMenu(event)" title="Capa do quadrinho" style="padding:6px 10px;margin:1px 8px 3px 8px;cursor:pointer;border-radius:6px;border-left:' + coverBorder + ';background:' + coverBg + ';display:flex;align-items:center;justify-content:space-between;">'
      + '<div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-flex;vertical-align:middle;color:var(--accent);">' + Icons.palette + '</span><span style="font-weight:700;font-size:12px;color:' + coverColor + ';letter-spacing:0.5px;">' + t('sidebar.cover') + '</span></div>'
      + '<div style="display:flex;align-items:center;gap:4px;"><span style="font-size:9px;color:var(--accent);opacity:0.7;">' + coverTitle + '</span>'
      + '<button onclick="event.stopPropagation();App.removeCover()" title="' + t('sidebar.removeCover') + '" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:0;font-size:11px;line-height:1;opacity:0.5;">✕</button></div></div>'
      + '<div style="margin:0 12px 4px 12px;height:1px;background:var(--border);"></div>';
  } else {
    coverSectionHTML = '<button onclick="App.addCover()" class="cover-add-btn" style="margin:2px 12px 6px 12px;padding:7px 10px;background:rgba(107,114,128,0.08);border:1px dashed rgba(107,114,128,0.4);color:var(--accent);border-radius:6px;cursor:pointer;font-weight:600;font-size:11px;display:flex;align-items:center;gap:6px;transition:all 0.15s;" onmouseenter="this.style.background=\'rgba(107,114,128,0.16)\'" onmouseleave="this.style.background=\'rgba(107,114,128,0.08)\'">' + Icons.palette + ' ' + t('sidebar.addCover') + '</button>';
  }

  // Back cover item in sidebar
  const backCoverActive = Store.get('backCoverActive');
  let backCoverSectionHTML = '';
  if (p.cover) {
    if (p.backCover) {
      const bcBorder = backCoverActive ? '3px solid var(--accent)' : '3px solid transparent';
      const bcBg = backCoverActive ? 'var(--hover)' : 'rgba(107,114,128,0.06)';
      const bcColor = backCoverActive ? 'var(--text)' : 'rgba(107,114,128,0.9)';
      backCoverSectionHTML = '<div class="scene-item cover-scene-item ' + (backCoverActive ? 'active' : '') + '" onclick="App.setActiveBackCover()" title="Contracapa" style="padding:6px 10px;margin:1px 8px 3px 8px;cursor:pointer;border-radius:6px;border-left:' + bcBorder + ';background:' + bcBg + ';display:flex;align-items:center;justify-content:space-between;">'
        + '<div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-flex;color:rgba(107,114,128,0.9);">' + Icons.copy + '</span><span style="font-weight:700;font-size:12px;color:' + bcColor + ';letter-spacing:0.5px;">' + t('sidebar.backCover') + '</span></div>'
        + '<div style="display:flex;align-items:center;gap:4px;">'
        + '<button onclick="event.stopPropagation();App.removeBackCover()" title="' + t('sidebar.removeBackCover') + '" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:0;font-size:11px;line-height:1;opacity:0.5;">✕</button></div></div>';
    } else {
      backCoverSectionHTML = '<button onclick="App.addBackCover()" style="margin:1px 12px 3px 12px;padding:5px 10px;background:rgba(107,114,128,0.06);border:1px dashed rgba(107,114,128,0.3);color:rgba(107,114,128,0.8);border-radius:6px;cursor:pointer;font-weight:600;font-size:10px;display:flex;align-items:center;gap:6px;transition:all 0.15s;" onmouseenter="this.style.background=\'rgba(107,114,128,0.12)\'" onmouseleave="this.style.background=\'rgba(107,114,128,0.06)\'">' + Icons.copy + ' ' + t('sidebar.addBackCover') + '</button>';
    }
  }

  const pagesCollapsed = (Store.get('sidebarCollapsed') || {}).leftPages;

  return `
    <div id="mobile-anchor-pages" style="padding: 8px 0; overflow-y:auto; height:100%;">
      <div onclick="App.toggleSidebarSection('leftPages')" style="display:flex;align-items:center;padding:4px 12px;cursor:pointer;user-select:none;margin-bottom:6px;">
        <span style="font-size: 10px; font-weight: 700; color: var(--text3); letter-spacing: 1px; flex:1;">${t('sidebar.pages')}</span>
        <span style="font-size:10px;color:var(--text3);">${pagesCollapsed ? '+' : '-'}</span>
      </div>
      ${!pagesCollapsed ? `<div class="scenes-list" style="display:flex; flex-direction:column; gap:2px;">
        ${coverSectionHTML}
        ${backCoverSectionHTML}
        ${scenes}
         <button onclick="App.addPage()" style="margin: 4px 12px; padding: 8px; background:transparent; border: 1px dashed var(--border3); color:var(--text2); border-radius:6px; cursor:pointer; font-weight: 500; font-size:11px;">${t('sidebar.newPage')}</button>
      </div>` : ''}

      <div style="margin: 12px 8px 6px 8px;">
        <div onclick="App.toggleSidebarSection('leftLayout')" style="display:flex;align-items:center;padding:4px;cursor:pointer;user-select:none;">
          <span style="font-size: 10px; font-weight: 700; color: var(--text3); letter-spacing: 1px; flex:1;">${t('sidebar.layout')}</span>
          ${isVideoProject 
            ? `<span style="font-size:9px;color:var(--accent);margin-right:4px;font-weight:600;">${VIDEO_FORMATS[videoFormat]?.icon || Icons.video} ${VIDEO_FORMATS[videoFormat]?.name || videoFormat}</span>`
            : `<span style="font-size:9px;color:var(--accent);margin-right:4px;font-weight:600;">${targetCount} ${targetCount === 1 ? t('sidebar.panel') : t('sidebar.panels')}</span>`
          }
          <span style="font-size:10px;color:var(--text3);">${layoutCollapsed ? '+' : '-'}</span>
        </div>
        ${!layoutCollapsed ? (isVideoProject ? `
          <!-- Video Layouts Grid -->
          <div style="margin-bottom:8px;">
            <div style="font-size:9px;color:var(--text3);margin-bottom:6px;">Layouts para ${VIDEO_FORMATS[videoFormat]?.description || 'vídeo'}</div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">
              ${renderVideoLayoutsSection(layoutOptions, currentLayoutId, videoFormat)}
            </div>
          </div>
          ` : `
          <!-- Step 1: Panel Count Selector -->
          <div style="margin-bottom:8px;">
            <div class="panel-count-row" style="display:grid;grid-template-columns:repeat(9,1fr) auto;gap:2px;align-items:center;">
              ${renderPanelCountButtons(targetCount)}
              <span class="help-hint" data-tooltip="Quantos painéis nesta página?">?</span>
            </div>
          </div>
          <!-- Step 2: Layout Variations -->
          <div>
            <div class="variations-header">
              <span class="variations-badge">${layoutOptions.length}</span>
              <span class="help-hint" data-tooltip="Escolha o layout dos painéis">?</span>
            </div>
            <div id="variations-grid-wrap">
              <div id="variations-grid" class="${variationsExpanded ? 'expanded' : ''}">
                ${layoutOptions.map(opt => {
                  const isCurrentLayout = opt.id === currentLayoutId;
                  const isFavorite = p.favoriteLayoutId === opt.id;
                  const optBorder = isCurrentLayout ? 'var(--accent)' : 'var(--border)';
                  const optName = opt.name.length > 12 ? opt.name.substring(0,11)+'…' : opt.name;
                  return `<button onclick="App.setLayout('${opt.id}')" title="${opt.name}${isFavorite ? ' (Padrao)' : ''}" style="border-radius:6px;border:2px solid ${optBorder};background:${isCurrentLayout ? 'rgba(107,114,128,0.15)' : 'var(--surface2)'};cursor:pointer;padding:6px 4px 4px;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.15s;position:relative;" onmouseenter="this.style.borderColor='var(--accent)';this.style.transform='scale(1.03)'" onmouseleave="this.style.borderColor='${optBorder}';this.style.transform='scale(1)'">
                    ${isCurrentLayout ? '<span style="position:absolute;top:2px;right:2px;font-size:8px;color:var(--accent);">✓</span>' : ''}
                    <span onclick="event.stopPropagation();App.setFavoriteLayout('${opt.id}')" style="position:absolute;top:2px;left:2px;font-size:9px;color:${isFavorite ? 'var(--warning)' : 'var(--text3)'};cursor:pointer;opacity:${isFavorite ? '1' : '0.4'};" title="${isFavorite ? 'Remover padrao' : 'Definir como padrao'}">★</span>
                    ${LayoutEngine.preview(opt.id, 36, 50)}
                    <span style="font-size:8px;color:${isCurrentLayout ? 'var(--accent)' : 'var(--text3)'};max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.1;font-weight:${isCurrentLayout ? '700' : '500'};text-align:center;">${optName}</span>
                  </button>`;
                }).join('')}
              </div>
            </div>
          </div>
          <!-- Custom Layouts Section -->
          ${renderCustomLayoutsSection(p, currentLayoutId)}
        `)
        : ''}
        <!-- Create Custom Layout Button — ALWAYS visible -->
        <button onclick="App.enterLayoutEditor()" style="margin-top:10px;width:100%;padding:10px;border:2px dashed var(--accent);background:rgba(107,114,128,0.08);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.15s;" onmouseenter="this.style.background='rgba(107,114,128,0.18)';this.style.borderStyle='solid'" onmouseleave="this.style.background='rgba(107,114,128,0.08)';this.style.borderStyle='dashed'">
          <span style="display:inline-flex;">${Icons.feather}</span> Criar Meu Layout
        </button>

        <!-- Matéria Special Layouts (hide if current page is matéria) -->
        ${!page?.isMateria && !page?.layoutId?.includes('materia') ? `
        <div style="margin-top:10px;">
          <div onclick="App.toggleSidebarSection('leftMateria')" style="display:flex;align-items:center;padding:4px;cursor:pointer;user-select:none;">
            <span style="font-size:10px;font-weight:700;color:var(--text3);letter-spacing:1px;flex:1;">${Icons.narrationBox} MATÉRIA (ESPECIAL)</span>
            <span style="font-size:10px;color:var(--text3);">${leftMateriaCollapsed ? '+' : '-'}</span>
          </div>
          ${!leftMateriaCollapsed ? `
            <div style="font-size:9px;color:var(--text3);padding:0 2px 6px;line-height:1.4;">Páginas com texto longo + imagem. Ideal para zines, capítulos introdutórios e narração densa.</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
              ${Object.entries(Layouts).filter(([k,v]) => v.isMateria).map(([id, layout]) => {
                const isActive = id === currentLayoutId;
                return `<button onclick="App.setLayout('${id}')" title="${layout.name}: ${layout.description}" style="border-radius:6px;border:2px solid ${isActive ? 'rgba(234,179,8,0.7)' : 'var(--border)'};background:${isActive ? 'rgba(234,179,8,0.1)' : 'var(--surface2)'};cursor:pointer;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;transition:all 0.15s;" onmouseenter="this.style.borderColor='rgba(234,179,8,0.6)'" onmouseleave="this.style.borderColor='${isActive ? 'rgba(234,179,8,0.7)' : 'var(--border)'}'">
                  <span style="display:inline-flex;color:rgba(234,179,8,0.7);">${Icons.narrationBox}</span>
                  <span style="font-size:9px;font-weight:600;color:${isActive ? 'rgba(234,179,8,0.9)' : 'var(--text2)'};text-align:center;">${layout.name}</span>
                  <span style="font-size:8px;color:var(--text3);text-align:center;line-height:1.2;">${layout.description}</span>
                </button>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
        ` : ''}
      </div>

      <div id="mobile-anchor-texttools" style="font-size: 10px; font-weight: 700; color: var(--text3); margin: 12px 12px 6px 12px; letter-spacing: 1px;">${t('sidebar.comicElements')}</div>
      ${(() => {
        const _isMateria = page?.type === 'materia' || page?.isMateria === true;
        const _isCover = Store.get('coverActive') || Store.get('backCoverActive');
        const _btnStyle = `display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 4px; border:1px solid var(--border); border-radius:6px; background:var(--surface2); color:var(--text2); cursor:pointer; font-size:10px; transition:all 0.12s;`;
        const _hover = `onmouseenter="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--text2)'"`;
        
        // In cover mode, don't show balloon tools at all
        if (_isCover) {
          return `<div style="padding:8px 12px;background:var(--surface2);border-radius:6px;margin:0 8px;">
            <div style="font-size:10px;color:var(--text3);text-align:center;">Balões não disponíveis no modo capa</div>
          </div>`;
        }
        
        // In matéria mode, only show narration and caption
        if (_isMateria) {
          return `<div class="balloon-toolbox" style="display:grid; grid-template-columns:1fr 1fr; gap:4px; padding: 0 8px;">
            <button data-balloon-type="narration" onclick="App.startBalloonPlacement('narration')" title="${t('balloons.narrationTooltip')}" style="${_btnStyle}" ${_hover}>
              ${Icons.narrationBox} <span>${t('balloons.narration')}</span>
            </button>
            <button data-balloon-type="caption" onclick="App.startBalloonPlacement('caption')" title="${t('balloons.captionTooltip')}" style="${_btnStyle}" ${_hover}>
              ${Icons.fileText} <span>${t('balloons.caption')}</span>
            </button>
          </div>
          <div style="padding:4px 12px;font-size:9px;color:var(--text3);text-align:center;">Modo Matéria: apenas narração e legenda</div>`;
        }
        
        // Normal mode - show all balloon types
        return `<div class="balloon-toolbox" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; padding: 0 8px;">
        <button data-balloon-type="narration" onclick="App.startBalloonPlacement('narration')" title="${t('balloons.narrationTooltip')}" style="${_btnStyle}" ${_hover}>
          ${Icons.narrationBox} <span>${t('balloons.narration')}</span>
        </button>
        <button data-balloon-type="speech" onclick="App.startBalloonPlacement('speech')" title="${t('balloons.speechTooltip')}" style="${_btnStyle}" ${_hover}>
          ${Icons.balloon} <span>${t('balloons.speech')}</span>
        </button>
        <button data-balloon-type="thought" onclick="App.startBalloonPlacement('thought')" title="${t('balloons.thoughtTooltip')}" style="${_btnStyle}" ${_hover}>
          ${Icons.thought} <span>${t('balloons.thought')}</span>
        </button>
        <button data-balloon-type="shout" onclick="App.startBalloonPlacement('shout')" title="${t('balloons.shoutTooltip')}" style="${_btnStyle}" ${_hover}>
          ${Icons.shout} <span>${t('balloons.shout')}</span>
        </button>
        <button data-balloon-type="caption" onclick="App.startBalloonPlacement('caption')" title="${t('balloons.captionTooltip')}" style="${_btnStyle}" ${_hover}>
          ${Icons.fileText} <span>${t('balloons.caption')}</span>
        </button>
        <button data-balloon-type="sfx" onclick="App.addSfxToPage()" title="${t('balloons.sfxTooltip')}" style="${_btnStyle}" ${_hover}>
          ${Icons.text} <span>${t('balloons.sfx')}</span>
        </button>
      </div>`;
      })()}
      
      <div style="margin: 12px 8px 6px 8px;">
        <button onclick="App.openExcalidrawModal()" style="width:100%;padding:8px;border-radius:6px;border:1px dashed var(--accent);background:rgba(107,114,128,0.05);color:var(--accent);font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.15s;" onmouseenter="this.style.background='rgba(107,114,128,0.15)'" onmouseleave="this.style.background='rgba(107,114,128,0.05)'">
          ${t('sidebar.createArt')}
        </button>
      </div>

      <!-- TEXTO NARRATIVO - Mobile Section -->
      <div id="mobile-anchor-narrative-section" style="margin: 16px 8px 8px 8px; padding-top: 12px; border-top: 1px solid var(--border);">
        <div style="font-size: 10px; font-weight: 700; color: var(--text3); margin-bottom: 8px; letter-spacing: 1px;">TEXTO NARRATIVO</div>
        
        ${(() => {
          const _page = Store.getActivePage();
          const _isActive = _page?.showTextBelow || false;
          const _narrative = _page?.narrative || '';
          const _narrativeText = typeof _narrative === 'string' ? _narrative : (_narrative?.['pt-BR'] || _narrative?.en || '');
          const _height = _page?.narrativeHeight || 120;
          
          return `
          <!-- Toggle ON/OFF -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              ${Icons.textBelow}
              <span style="font-size:11px;font-weight:500;color:var(--text);">Ativar Texto Narrativo</span>
            </div>
            <button onclick="App.toggleTextBelow()" style="width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:all 0.2s;background:${_isActive ? 'var(--accent)' : 'var(--border)'};">
              <span style="position:absolute;top:2px;${_isActive ? 'right:2px' : 'left:2px'};width:18px;height:18px;border-radius:50%;background:#fff;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>
            </button>
          </div>
          
          ${_isActive ? `
          <!-- Editor de Texto -->
          <div style="margin-bottom:8px;">
            <textarea 
              id="mobile-narrative-editor"
              placeholder="Escreva a narrativa aqui..."
              oninput="App.updateNarrative(this.value)"
              style="width:100%;min-height:80px;padding:10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:13px;line-height:1.5;resize:vertical;font-family:var(--font-story);"
            >${_narrativeText}</textarea>
          </div>
          
          <!-- Altura do Texto -->
          <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border-radius:6px;">
            <span style="font-size:10px;color:var(--text3);white-space:nowrap;">Altura:</span>
            <input type="range" min="40" max="400" value="${_height}" 
              oninput="App.setNarrativeHeight(parseInt(this.value))"
              style="flex:1;height:4px;cursor:pointer;">
            <span style="font-size:10px;color:var(--text2);min-width:35px;text-align:right;">${_height}px</span>
          </div>
          ` : `
          <!-- Hint quando desativado -->
          <div style="padding:12px;background:rgba(107,114,128,0.05);border-radius:6px;border:1px dashed var(--border);">
            <p style="font-size:11px;color:var(--text3);margin:0;text-align:center;">
              Ative para adicionar texto narrativo embaixo dos painéis
            </p>
          </div>
          `}
          `;
        })()}
      </div>
    </div>
  `;
}

function renderZoomControls() {
  const z = App._viewport ? App._viewport.scale : Store.get('zoom');
  const panMode = App._viewport ? App._viewport.mode === 'pan' : Store.get('panMode');
  return `<div class="zoom-controls">
    <button class="zoom-btn" onclick="App.zoomOut()" title="${t('zoom.out')}">${Icons.zoomOut}</button>
    <button class="zoom-btn zoom-pct" onclick="App.zoomReset()" title="${t('zoom.reset')}">${Math.round(z * 100)}%</button>
    <button class="zoom-btn" onclick="App.zoomIn()" title="${t('zoom.in')}">${Icons.zoomIn}</button>
    <button class="zoom-btn" onclick="App.zoomFit()" title="${t('zoom.fit')}">${Icons.zoomFit}</button>
    <button class="zoom-btn pan-btn ${panMode ? 'active' : ''}" onclick="App.togglePanMode()" title="${panMode ? t('zoom.panModeActive') : t('zoom.panMode')}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
    </button>
  </div>`;
}

function renderTimeline() {
  const p = Store.get('currentProject');
  if (!p) return '';
  const active = Store.get('activePageIndex');
  const timelineMode = Store.get('timelineMode') || 'pages';
  
  const coverActive = Store.get('coverActive');
  let items = '';
  if (timelineMode === 'pages') {
    // Cover page item (before page 1)
    const coverItem = p.cover ? `<button class="tl-page tl-cover ${coverActive ? 'active' : ''}"
      onclick="App.setActiveCover()"
      title="Capa do quadrinho">
      <span style="display:inline-flex;">${Icons.palette}</span>
      ${coverActive ? '<span class="tl-active-bar"></span>' : ''}
    </button>` : '';

    const backCoverActive = Store.get('backCoverActive');
    const backCoverItem = (p.cover && p.backCover) ? `<button class="tl-page tl-cover ${backCoverActive ? 'active' : ''}"
      onclick="App.setActiveBackCover()"
      title="Contracapa"
      style="${backCoverActive ? 'border-color:rgba(107,114,128,0.6);background:rgba(107,114,128,0.1);' : ''}">
      <span style="display:inline-flex;">${Icons.copy}</span>
      ${backCoverActive ? '<span class="tl-active-bar" style="background:rgba(107,114,128,0.8);"></span>' : ''}
    </button>` : '';

    items = coverItem + backCoverItem + p.pages.map((page, i) => {
      const imgCount = page.images ? page.images.filter(im => im && im.src).length : 0;
      const balloonCount = page.texts ? page.texts.length : 0;
      const hasText = page.showTextBelow;
      const isEmpty = imgCount === 0 && balloonCount === 0;
      const isActive = !coverActive && !backCoverActive && i === active;

      // Status dots: green=complete, yellow=partial, red=empty
      const dots = [];
      if (imgCount > 0) dots.push('#14b8a6');
      if (balloonCount > 0) dots.push('#14b8a6');
      if (hasText) dots.push('#14b8a6');
      if (dots.length === 0) dots.push('#ef4444');
      const dotsHTML = dots.map(c => `<span class="tl-dot" style="background:${c}"></span>`).join('');

      const addBtnHTML = `<button onclick="App.addPage(${i + 1})" title="Nova página aqui" style="width:16px;height:16px;border-radius:50%;background:var(--surface3);border:1px solid var(--border);color:var(--text3);display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;flex-shrink:0;transition:all 0.15s;padding:0;margin:0 -2px;z-index:5;" onmouseenter="this.style.background='var(--accent)';this.style.color='#000';this.style.borderColor='var(--accent)';this.style.transform='scale(1.2)'" onmouseleave="this.style.background='var(--surface3)';this.style.color='var(--text3)';this.style.borderColor='var(--border)';this.style.transform='scale(1)'">+</button>`;

      return `<button class="tl-page ${isActive ? 'active' : ''}"
        onclick="App.setActivePage(${i})"
        oncontextmenu="event.preventDefault();App.showPageContextMenu(event,${i})"
        draggable="true" ondragstart="App.pageDragStart(event,${i})"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="this.classList.remove('drag-over');App.pageDrop(event,${i})"
        title="Pg ${i + 1}: ${imgCount} imgs, ${balloonCount} balões">
        <span class="tl-page-num">${i + 1}</span>
        <span class="tl-page-dots">${dotsHTML}</span>
        ${isActive ? '<span class="tl-active-bar"></span>' : ''}
      </button>${addBtnHTML}`;
    }).join('');
  } else {
    const allAssets = [];
    p.pages.forEach(pg => pg.images?.forEach(img => {
      if (img && img.src && !allAssets.includes(img.src)) allAssets.push(img.src);
    }));
    items = allAssets.map((src, si) => `
      <button class="tl-page tl-asset" onclick="App.insertLibraryImage('${src.replace(/'/g, "\\'")}')" title="Clique para inserir">
        <img src="${src}" draggable="true">
      </button>
    `).join('');
    if (!allAssets.length) items = '<span class="tl-empty-msg">Nenhuma imagem no projeto</span>';
  }

  const collapsed = Store.get('timelineCollapsed');
  const totalPages = p.pages.length;
  const totalImages = p.pages.reduce((sum, pg) => sum + (pg.images ? pg.images.filter(im => im && im.src).length : 0), 0);

  return `<div class="timeline ${collapsed ? 'collapsed' : ''}" id="timeline-bar">
    <div class="tl-inner">
      <div class="tl-left">
        <button class="tl-collapse-btn" onclick="App.toggleTimeline()" title="${collapsed ? 'Mostrar' : 'Ocultar'}">
          ${collapsed ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 7L5 3L8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3L5 7L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
        </button>
        <div class="tl-mode-toggle">
          <button class="tl-mode-btn ${timelineMode === 'pages' ? 'active' : ''}" onclick="Store.set({timelineMode:'pages'});document.getElementById('app').innerHTML=renderEditor();renderCanvas();renderRightPanel();">Pages</button>
          <button class="tl-mode-btn ${timelineMode === 'images' ? 'active' : ''}" onclick="Store.set({timelineMode:'images'});document.getElementById('app').innerHTML=renderEditor();renderCanvas();renderRightPanel();">Assets</button>
        </div>
      </div>
      <div class="tl-center">
        <div class="tl-pages-track">${items}</div>
        <button class="tl-add" onclick="App.addPage()" title="Nova página">+</button>
      </div>
      <div class="tl-right">
        <div class="tl-status">
          <span class="tl-status-label">PROJECT STATUS</span>
          <span class="tl-status-value"><span class="tl-status-indicator"></span><span id="tl-save-state">${Store.get('_saving') ? 'Saving...' : 'Saved'}</span></span>
        </div>
        <button class="tl-settings-btn" onclick="App.showShortcutsHelp()" title="Configurações">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

function renderPageList() {
  const p = Store.get('currentProject');
  const active = Store.get('activePageIndex');
  const el = document.getElementById('page-list');
  if (!el || !p) return;
  el.innerHTML = p.pages.map((page, i) => {
    const n = page.images ? page.images.length : 0;
    const firstImg = n > 0 ? page.images[0] : null;
    const thumbHTML = firstImg
      ? `<img src="${firstImg.src}" alt="" class="page-thumb-img">`
      : `<span class="page-thumb-empty">${Icons.page}</span>`;
    return `<div class="page-item ${i === active ? 'active' : ''}" onclick="App.setActivePage(${i})">
      <div class="page-thumb">${thumbHTML}</div>
      <div class="page-item-body">
        <span class="page-item-label">Pg ${i + 1}</span>
        <span class="page-item-info">${n} img${page.showTextBelow ? ' + txt' : ''}</span>
      </div>
      <div class="page-item-actions">
        <button onclick="event.stopPropagation();App.duplicatePage(${i})">${Icons.copy}</button>
        <button class="danger" onclick="event.stopPropagation();App.deletePage(${i})">${Icons.trash}</button>
      </div></div>`;
  }).join('') + `<button class="page-add-btn" onclick="App.addPage()">${Icons.plus} ${t('sidebar.newPage')}</button>`;
}

/* ═══════════════════════════════════════
   COVER PAGE CANVAS
   ═══════════════════════════════════════ */
function renderCoverCanvas() {
  const scrollEl = document.getElementById('canvas-scroll');
  if (!scrollEl) return;
  const p = Store.get('currentProject');
  if (!p || !p.cover) { scrollEl.innerHTML = ''; return; }
  const cover = p.cover;
  const zoom = Store.get('zoom');
  const selectedEl = Store.get('selectedElement');

  // Canvas dimensions (video format or A4 fallback)
  const dims = getProjectDims(p);
  const pageW = dims.canvasW;
  const pageH = dims.canvasH;
  const BLEED = 11; // ~3mm at 96dpi
  const SAFE = 34; // ~9mm safe zone

  // Background
  const bgStyle = cover.backgroundImage
    ? `background-image:url('${cover.backgroundImage}');background-size:cover;background-position:center;`
    : `background:${cover.backgroundColor || '#ffffff'};`;

  // Bleed guides overlay
  const bleedGuide = cover.showBleedGuides ? `
    <div style="position:absolute;inset:0;pointer-events:none;z-index:30;">
      <div style="position:absolute;inset:${BLEED}px;border:1.5px dashed rgba(220,0,0,0.55);"></div>
      <span style="position:absolute;top:${BLEED+2}px;left:${BLEED+5}px;font-size:9px;color:rgba(220,0,0,0.7);background:rgba(255,255,255,0.85);padding:1px 5px;border-radius:3px;font-weight:700;">BLEED</span>
    </div>` : '';

  // Safe area guides overlay
  const safeGuide = cover.showSafeAreaGuides ? `
    <div style="position:absolute;inset:0;pointer-events:none;z-index:30;">
      <div style="position:absolute;inset:${SAFE}px;border:1.5px dashed rgba(0,140,255,0.45);"></div>
      <span style="position:absolute;top:${SAFE+2}px;left:${SAFE+5}px;font-size:9px;color:rgba(0,140,255,0.7);background:rgba(255,255,255,0.85);padding:1px 5px;border-radius:3px;font-weight:700;">SAFE</span>
    </div>` : '';

  // Impactful placeholder when cover is empty (no bg image AND no template elements)
  const hasElements = (cover.elements || []).length > 0;
  const isEmpty = !cover.backgroundImage && !hasElements;
  const accentColor = 'rgba(107,114,128,1)';
  const coverTitle = cover.title || p.metadata.name || 'MY PROJECT';
  const coverAuthor = cover.author || 'Author';
  const coverVol = cover.volume || 1;
  const coverYear = cover.year || new Date().getFullYear();

  let dropZone = '';
  if (isEmpty) {
    // Clean centered empty state
    dropZone = `
      <div class="cover-empty-placeholder" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;z-index:10;">
        <div class="cover-drop-zone" onclick="App.triggerCoverImageUpload()" 
          ondragover="event.preventDefault();this.classList.add('drag-over')"
          ondragleave="this.classList.remove('drag-over')"
          ondrop="event.preventDefault();this.classList.remove('drag-over');App._handleCoverDrop(event)"
          style="pointer-events:all;width:320px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 40px;border:2px dashed rgba(107,114,128,0.3);background:rgba(107,114,128,0.05);cursor:pointer;transition:all 0.25s;"
          onmouseenter="this.style.borderColor='rgba(107,114,128,0.5)';this.style.background='rgba(107,114,128,0.08)';this.querySelector('svg').style.stroke='rgba(107,114,128,0.7)';this.querySelectorAll('span')[0].style.color='rgba(107,114,128,0.85)';this.querySelectorAll('span')[1].style.color='rgba(107,114,128,0.6)';"
          onmouseleave="this.style.borderColor='rgba(107,114,128,0.3)';this.style.background='rgba(107,114,128,0.05)';this.querySelector('svg').style.stroke='rgba(107,114,128,0.5)';this.querySelectorAll('span')[0].style.color='rgba(107,114,128,0.8)';this.querySelectorAll('span')[1].style.color='rgba(107,114,128,0.5)';">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(107,114,128,0.5)" stroke-width="1.5" style="transition:all 0.25s;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span style="font-size:15px;font-weight:600;color:rgba(107,114,128,0.8);margin-top:16px;text-align:center;transition:all 0.25s;">Click to add background image</span>
          <span style="font-size:12px;color:rgba(107,114,128,0.5);margin-top:6px;transition:all 0.25s;">or drag & drop here</span>
        </div>
        <div style="margin-top:30px;text-align:center;">
          <div style="font-family:'Archivo Black','Impact',sans-serif;font-size:32px;font-weight:700;color:rgba(0,0,0,0.4);letter-spacing:2px;line-height:1.1;text-transform:uppercase;">${S(coverTitle)}</div>
          <div style="font-family:'Inter',sans-serif;font-size:12px;color:rgba(0,0,0,0.3);letter-spacing:1px;margin-top:8px;font-weight:500;">${S(coverAuthor)} · Vol. ${coverVol} · ${coverYear}</div>
        </div>
      </div>`;
  } else if (!cover.backgroundImage) {
    // Has elements but no background — show subtle centered drop zone
    dropZone = `
      <div class="cover-drop-zone" onclick="App.triggerCoverImageUpload()"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="event.preventDefault();this.classList.remove('drag-over');App._handleCoverDrop(event)"
        style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;padding:36px 48px;border:2px dashed rgba(107,114,128,0.25);cursor:pointer;z-index:5;opacity:0.4;transition:all 0.25s;"
        onmouseenter="this.style.opacity='1';this.style.borderColor='rgba(107,114,128,0.5)';this.style.background='rgba(107,114,128,0.05)';" onmouseleave="this.style.opacity='0.4';this.style.borderColor='rgba(107,114,128,0.25)';this.style.background='transparent';">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(107,114,128,0.6);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span style="font-size:11px;font-weight:500;">Add background image</span>
        </div>
      </div>`;
  }

  // Cover elements (text and images)
  const elementsHTML = (cover.elements || []).map((el, idx) => {
    const isSelected = selectedEl && selectedEl.id === el.id;
    const baseZ = 20 + idx;

    if (el.type === 'cover-image') {
      const styleObj = el.style || {};
      const styleStr = Object.entries(styleObj).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';');
      return `<div class="cover-image-element ${isSelected ? 'selected' : ''}"
        style="position:absolute;left:${Math.round(el.x)}px;top:${Math.round(el.y)}px;width:${Math.round(el.width)}px;height:${Math.round(el.height)}px;cursor:move;z-index:${isSelected ? 50 : baseZ};${styleStr}"
        onmousedown="App.startDragCoverElement(event,'${el.id}')"
        onclick="event.stopPropagation();var _s=Store.get('selectedElement');if(!_s||_s.id!=='${el.id}'){Store.set({selectedElement:{type:'cover-image',id:'${el.id}'}});renderRightPanel();}"
        oncontextmenu="event.preventDefault();event.stopPropagation();App.showCoverElementContextMenu(event,'${el.id}')"
        title="Drag to move">
        <img src="${el.src}" style="width:100%;height:100%;object-fit:contain;pointer-events:none;" draggable="false">
        ${isSelected ? `<div style="position:absolute;inset:-3px;border:2px dashed var(--accent);border-radius:4px;pointer-events:none;z-index:26;"></div>
          <!-- Resize Handle -->
          <div style="position:absolute;right:-6px;bottom:-6px;width:14px;height:14px;background:var(--accent);border:2px solid #fff;border-radius:50%;cursor:nwse-resize;z-index:27;" onmousedown="event.stopPropagation();App.startResizeCoverElement(event,'${el.id}')"></div>
          <!-- Delete Button -->
          <button onclick="event.stopPropagation();App.deleteCoverElement('${el.id}')" style="position:absolute;top:-10px;right:-10px;width:20px;height:20px;border-radius:50%;background:#e00;color:#fff;border:2px solid #fff;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:27;">✕</button>` : ''}
      </div>`;
    }

    const styleObj = el.style || {};
    const pxProps = ['font-size','letter-spacing','line-height','border-radius','padding','margin','width','height','top','left','right','bottom'];
    const styleStr = Object.entries(styleObj).map(([k, v]) => {
      const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (typeof v === 'number' && pxProps.some(p => cssKey.includes(p))) return `${cssKey}:${v}px`;
      return `${cssKey}:${v}`;
    }).join(';');
    
    return `<div class="cover-text-element ${isSelected ? 'selected' : ''}"
      style="position:absolute;left:${Math.round(el.x)}px;top:${Math.round(el.y)}px;width:${el.width || 634}px;min-height:30px;cursor:move;z-index:${isSelected ? 50 : baseZ};padding:4px 0;"
      onmousedown="App.startDragCoverElement(event,'${el.id}')"
      onclick="event.stopPropagation();var _s=Store.get('selectedElement');if(!_s||_s.id!=='${el.id}'){Store.set({selectedElement:{type:'cover-text',id:'${el.id}'}});renderRightPanel();}"
      ondblclick="event.stopPropagation();App._editCoverElementInline('${el.id}',this)"
      oncontextmenu="event.preventDefault();event.stopPropagation();App.showCoverElementContextMenu(event,'${el.id}')"
      title="Arraste para mover · Duplo-clique para editar">
      <div class="cover-text-inner" style="${styleStr};outline:none;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;max-width:100%;box-sizing:border-box;"
        contenteditable="false"
        data-el-id="${el.id}"
        onblur="App._saveCoverElementText('${el.id}',this.innerText)"
        onkeydown="event.stopImmediatePropagation();"
      >${S(el.text || '')}</div>
      ${isSelected ? `<div style="position:absolute;inset:-3px;border:2px dashed var(--accent);border-radius:4px;pointer-events:none;z-index:26;"></div>
        <!-- Resize handles for width -->
        <div class="resize-handle-left" onmousedown="event.stopPropagation();App.startResizeCoverTextWidth(event,'${el.id}','left')" title="Arrastar para redimensionar"></div>
        <div class="resize-handle-right" onmousedown="event.stopPropagation();App.startResizeCoverTextWidth(event,'${el.id}','right')" title="Arrastar para redimensionar"></div>
        <button onclick="event.stopPropagation();App.deleteCoverElement('${el.id}')" style="position:absolute;top:-10px;right:-10px;width:20px;height:20px;border-radius:50%;background:#e00;color:#fff;border:2px solid #fff;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:27;">✕</button>` : ''}
    </div>`;
  }).join('');

  // Template structural elements (banners, lines, badges)
  let structureHTML = '';
  if (cover.template && COVER_TEMPLATES[cover.template]) {
    const tmpl = COVER_TEMPLATES[cover.template];
    const s = tmpl.structure || {};
    if (s.topBanner) {
      structureHTML += `<div style="position:absolute;top:0;left:0;right:0;height:${s.topBanner.height}px;background:${s.topBanner.bgColor};z-index:8;pointer-events:none;"></div>`;
    }
    if (s.bottomBar) {
      structureHTML += `<div style="position:absolute;bottom:0;left:0;right:0;height:${s.bottomBar.height}px;background:${s.bottomBar.bgColor};z-index:8;pointer-events:none;"></div>`;
    }
    if (s.topLine) {
      structureHTML += `<div style="position:absolute;top:${s.topLine.y}px;left:40px;right:40px;height:${s.topLine.width}px;background:${s.topLine.color};z-index:8;pointer-events:none;"></div>`;
    }
    if (s.bottomLine) {
      structureHTML += `<div style="position:absolute;top:${s.bottomLine.y}px;left:40px;right:40px;height:${s.bottomLine.width}px;background:${s.bottomLine.color};z-index:8;pointer-events:none;"></div>`;
    }
    if (s.thickLine) {
      structureHTML += `<div style="position:absolute;top:${s.thickLine.y}px;left:40px;right:40px;height:${s.thickLine.width}px;background:${s.thickLine.color};z-index:8;pointer-events:none;"></div>`;
    }
    if (s.volBadge) {
      structureHTML += `<div style="position:absolute;left:${s.volBadge.x}px;top:${s.volBadge.y}px;width:${s.volBadge.w}px;height:${s.volBadge.h}px;border:${s.volBadge.border};background:${s.volBadge.bg};display:flex;align-items:flex-start;justify-content:center;padding-top:4px;z-index:9;pointer-events:none;border-radius:2px;">
        <span style="font-size:9px;font-weight:700;color:${s.volBadge.textColor};letter-spacing:1px;">${s.volBadge.text}</span>
      </div>`;
    }
  }

  // Fixed back button — highly visible with accent color
  const fixedBackBtn = `<button class="cover-back-btn-fixed" onclick="App.setActivePage(0)" style="position:fixed;top:70px;left:16px;z-index:9999;padding:10px 18px;background:var(--accent);border:2px solid var(--accent);border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(20,184,166,0.4);transition:all 0.15s;" onmouseenter="this.style.transform='scale(1.05)';this.style.boxShadow='0 6px 16px rgba(20,184,166,0.5)'" onmouseleave="this.style.transform='scale(1)';this.style.boxShadow='0 4px 12px rgba(20,184,166,0.4)'" title="Voltar para páginas (Esc)">← Voltar</button>`;
  
  // Cover badge with duration info
  const coverDuration = cover.duration || 0.2;
  const coverBadge = `<div style="position:fixed;top:70px;right:16px;z-index:9999;display:flex;align-items:center;gap:8px;">
    <span style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:11px;color:var(--text2);display:flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
      ${Icons.clock} <input type="number" value="${coverDuration}" min="0.1" max="10" step="0.1" onchange="App.setCoverDuration(parseFloat(this.value))" style="width:45px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text);font-size:11px;text-align:center;">s
    </span>
    <span style="background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:6px 14px;border-radius:6px;letter-spacing:1px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">CAPA</span>
  </div>`;

  // Wrapper with actual zoomed dimensions for proper scrolling
  scrollEl.innerHTML = `
    ${fixedBackBtn}
    ${coverBadge}
    <div class="cover-canvas-wrapper" style="display:flex;align-items:flex-start;justify-content:center;padding:20px;">
      <div class="bento-frame cover-canvas" id="canvas-page"
        style="width:${pageW}px;height:${pageH}px;${bgStyle}position:relative;overflow:hidden;flex-shrink:0;"
        onclick="App.handleCoverCanvasClick(event)">
        ${structureHTML}
        ${elementsHTML}
        ${dropZone}
        ${bleedGuide}
        ${safeGuide}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════
   BACK COVER (CONTRACAPA) CANVAS
   ═══════════════════════════════════════ */
function renderBackCoverCanvas() {
  const scrollEl = document.getElementById('canvas-scroll');
  if (!scrollEl) return;
  const p = Store.get('currentProject');
  if (!p || !p.backCover) { scrollEl.innerHTML = ''; return; }
  const bc = p.backCover;
  const zoom = Store.get('zoom');
  const selectedEl = Store.get('selectedElement');
  const pageW = A4.W, pageH = A4.H;
  const BLEED = 11, SAFE = 34;

  const bgStyle = bc.backgroundImage
    ? `background-image:url('${bc.backgroundImage}');background-size:cover;background-position:center;`
    : `background:${bc.backgroundColor || '#f5f5f5'};`;

  const bleedGuide = bc.showBleedGuides ? `
    <div style="position:absolute;inset:0;pointer-events:none;z-index:30;">
      <div style="position:absolute;inset:${BLEED}px;border:1.5px dashed rgba(220,0,0,0.55);"></div>
      <span style="position:absolute;top:${BLEED+2}px;left:${BLEED+5}px;font-size:9px;color:rgba(220,0,0,0.7);background:rgba(255,255,255,0.85);padding:1px 5px;border-radius:3px;font-weight:700;">BLEED</span>
    </div>` : '';
  const safeGuide = bc.showSafeAreaGuides ? `
    <div style="position:absolute;inset:0;pointer-events:none;z-index:30;">
      <div style="position:absolute;inset:${SAFE}px;border:1.5px dashed rgba(0,140,255,0.45);"></div>
      <span style="position:absolute;top:${SAFE+2}px;left:${SAFE+5}px;font-size:9px;color:rgba(0,140,255,0.7);background:rgba(255,255,255,0.85);padding:1px 5px;border-radius:3px;font-weight:700;">SAFE</span>
    </div>` : '';

  const hasElements = (bc.elements || []).length > 0;
  const isEmpty = !bc.backgroundImage && !hasElements;

  let dropZone = '';
  if (isEmpty) {
    dropZone = `
      <div class="cover-empty-placeholder" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;z-index:10;">
        <div class="cover-drop-zone" onclick="App.triggerCoverImageUpload()" 
          ondragover="event.preventDefault();this.classList.add('drag-over')"
          ondragleave="this.classList.remove('drag-over')"
          ondrop="event.preventDefault();this.classList.remove('drag-over');App._handleBackCoverDrop(event)"
          style="pointer-events:all;width:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 30px;border:2px dashed rgba(107,114,128,0.3);border-radius:12px;background:rgba(107,114,128,0.03);cursor:pointer;transition:all 0.2s;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(107,114,128,0.4)" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span style="font-size:14px;font-weight:600;color:rgba(107,114,128,0.6);margin-top:14px;text-align:center;">Click to add background image</span>
          <span style="font-size:11px;color:rgba(107,114,128,0.35);margin-top:4px;">or drag & drop here</span>
        </div>
        <div style="margin-top:20px;text-align:center;">
          <div style="font-family:'Inter',sans-serif;font-size:12px;color:rgba(0,0,0,0.12);letter-spacing:1px;">Pick a template or add text elements from the right panel</div>
        </div>
      </div>`;
  } else if (!bc.backgroundImage) {
    dropZone = `
      <div class="cover-drop-zone" onclick="App.triggerCoverImageUpload()"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="event.preventDefault();this.classList.remove('drag-over');App._handleBackCoverDrop(event)"
        style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;padding:30px 40px;border:2px dashed rgba(0,0,0,0.08);border-radius:8px;cursor:pointer;z-index:5;opacity:0.3;transition:opacity 0.2s;"
        onmouseenter="this.style.opacity='0.7'" onmouseleave="this.style.opacity='0.3'">
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#bbb;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span style="font-size:10px;">Add background image</span>
        </div>
      </div>`;
  }

  // Text elements (reuse same rendering as cover)
  const elementsHTML = (bc.elements || []).map(el => {
    const isSelected = selectedEl && selectedEl.type === 'cover-text' && selectedEl.id === el.id;
    const styleObj = el.style || {};
    const pxProps = ['font-size','letter-spacing','line-height','border-radius','padding','margin','width','height','top','left','right','bottom'];
    const styleStr = Object.entries(styleObj).map(([k, v]) => {
      const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (typeof v === 'number' && pxProps.some(p => cssKey.includes(p))) return `${cssKey}:${v}px`;
      return `${cssKey}:${v}`;
    }).join(';');
    return `<div class="cover-text-element ${isSelected ? 'selected' : ''}"
      style="position:absolute;left:${Math.round(el.x)}px;top:${Math.round(el.y)}px;width:${el.width || 634}px;min-height:30px;cursor:move;z-index:${isSelected ? 25 : 20};padding:4px 0;"
      onmousedown="App.startDragCoverElement(event,'${el.id}')"
      onclick="event.stopPropagation();var _s=Store.get('selectedElement');if(!_s||_s.id!=='${el.id}'){Store.set({selectedElement:{type:'cover-text',id:'${el.id}'}});renderRightPanel();}"
      ondblclick="event.stopPropagation();App._editCoverElementInline('${el.id}',this)"
      title="Drag to move · Double-click to edit">
      <div class="cover-text-inner" style="${styleStr};outline:none;white-space:pre-wrap;word-break:normal;overflow-wrap:break-word;"
        contenteditable="false" data-el-id="${el.id}"
        onblur="App._saveCoverElementText('${el.id}',this.innerText)"
        onkeydown="event.stopImmediatePropagation();"
      >${S(el.text || '')}</div>
      ${isSelected ? `<div style="position:absolute;inset:-3px;border:2px dashed var(--accent);border-radius:4px;pointer-events:none;z-index:26;"></div>
        <button onclick="event.stopPropagation();App.deleteCoverElement('${el.id}')" style="position:absolute;top:-10px;right:-10px;width:20px;height:20px;border-radius:50%;background:#e00;color:#fff;border:2px solid #fff;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:27;">✕</button>` : ''}
    </div>`;
  }).join('');

  // Fixed back button — always visible regardless of zoom/pan
  const fixedBackBtn = `<button class="cover-back-btn-fixed" onclick="App.setActivePage(0)" style="position:fixed;top:70px;left:16px;z-index:9999;padding:8px 14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text1);font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:all 0.15s;" onmouseenter="this.style.background='var(--accent)';this.style.color='#fff';this.style.borderColor='var(--accent)'" onmouseleave="this.style.background='var(--surface)';this.style.color='var(--text1)';this.style.borderColor='var(--border)'" title="Back to pages (Esc)">← Back to Pages</button>`;
  
  // Back cover badge — also fixed position
  const backBadge = `<span style="position:fixed;top:70px;right:16px;z-index:9999;background:rgba(107,114,128,0.9);color:#fff;font-size:10px;font-weight:700;padding:4px 12px;border-radius:6px;letter-spacing:1px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">BACK COVER</span>`;

  scrollEl.innerHTML = `
    ${fixedBackBtn}
    ${backBadge}
    <div class="cover-canvas-wrapper" style="display:flex;align-items:flex-start;justify-content:center;padding:20px;">
      <div class="bento-frame cover-canvas" id="canvas-page"
        style="width:${pageW}px;height:${pageH}px;${bgStyle}position:relative;overflow:hidden;flex-shrink:0;"
        onclick="App.handleCoverCanvasClick(event)">
        ${elementsHTML}
        ${dropZone}
        ${bleedGuide}
        ${safeGuide}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════
   LAYOUT EDITOR CANVAS (v2)
   ═══════════════════════════════════════ */
function renderLayoutEditorCanvas() {
  const scrollEl = document.getElementById('canvas-scroll');
  if (!scrollEl) return;

  const zoom = Store.get('zoom');
  const panels = Store.get('layoutEditorPanels') || [];
  const sel = Store.get('layoutEditorSelectedPanel');
  const snapEnabled = Store.get('layoutEditorSnap');
  const editingId = Store.get('layoutEditorEditingId');
  const p = Store.get('currentProject');
  const undoLen = (Store.get('layoutEditorUndoStack') || []).length;
  const redoLen = (Store.get('layoutEditorRedoStack') || []).length;

  let editingName = '';
  if (editingId && p?.customLayouts) {
    const ex = p.customLayouts.find(c => c.id === editingId);
    if (ex) editingName = ex.name;
  }

  const dims = getProjectDims(p);
  const CW = dims.contentW, CH = dims.contentH;
  const fills = ['#5b8def','#e8625c','#50c878','#f5a623','#9b59b6','#1abc9c','#e74c8b','#34495e','#f39c12'];

  // Render panels
  const panelsHTML = panels.map((panel, i) => {
    const isSel = i === sel;
    const px = panel.x, py = panel.y, pw = panel.w, ph = panel.h;
    const col = fills[i % fills.length];

    // 8 resize handles (only on selected)
    const handles = [
      { pos:'nw',x:-5,y:-5,cur:'nwse-resize'},{ pos:'n',x:pw/2-5,y:-5,cur:'ns-resize'},
      { pos:'ne',x:pw-5,y:-5,cur:'nesw-resize'},{ pos:'w',x:-5,y:ph/2-5,cur:'ew-resize'},
      { pos:'e',x:pw-5,y:ph/2-5,cur:'ew-resize'},{ pos:'sw',x:-5,y:ph-5,cur:'nesw-resize'},
      { pos:'s',x:pw/2-5,y:ph-5,cur:'ns-resize'},{ pos:'se',x:pw-5,y:ph-5,cur:'nwse-resize'}
    ];
    const handlesHTML = isSel ? handles.map(h =>
      `<div style="position:absolute;left:${h.x}px;top:${h.y}px;width:10px;height:10px;background:var(--accent);border:2px solid #fff;border-radius:2px;cursor:${h.cur};z-index:100;box-shadow:0 1px 3px rgba(0,0,0,0.3);" onmousedown="App.startLayoutPanelResize(event,${i},'${h.pos}')"></div>`
    ).join('') : '';

    // Panel action toolbar (only on selected, below panel)
    const canSplit = panels.length < 9;
    const toolbarHTML = isSel ? `
      <div style="position:absolute;left:50%;bottom:-36px;transform:translateX(-50%);display:flex;gap:3px;z-index:110;white-space:nowrap;">
        ${canSplit ? `<button onclick="event.stopPropagation();App.layoutEditorSplitH(${i})" style="padding:3px 8px;border:none;background:var(--accent);color:#fff;border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;" title="Dividir Horizontal (H)">─ Split H</button>
        <button onclick="event.stopPropagation();App.layoutEditorSplitV(${i})" style="padding:3px 8px;border:none;background:var(--accent);color:#fff;border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;" title="Dividir Vertical (V)">│ Split V</button>
        <button onclick="event.stopPropagation();App.layoutEditorDuplicate(${i})" style="padding:3px 8px;border:none;background:#14b8a6;color:#fff;border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;" title="Duplicar (Ctrl+D)">⊞ Dup</button>` : ''}
        ${panels.length > 1 ? `<button onclick="event.stopPropagation();App.layoutEditorDeletePanel(${i})" style="padding:3px 8px;border:none;background:#ef4444;color:#fff;border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;" title="Deletar (Del)">${Icons.trash}</button>` : ''}
      </div>` : '';

    // Move handle (center, drag icon)
    const moveHandle = isSel ?
      `<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:28px;height:28px;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:move;color:#fff;font-size:16px;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.3);" onmousedown="App.startLayoutPanelDrag(event,${i})" title="Arrastar painel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M12 2v20M2 12h20M5 5l-3 3 3 3M19 5l3 3-3 3M5 19l-3-3 3-3M19 19l3-3-3-3"/></svg>
      </div>` : '';

    // Dimension label
    const dimLabel = `<div style="position:absolute;left:50%;bottom:${isSel ? '42px' : '8px'};transform:translateX(-50%);background:rgba(0,0,0,0.75);color:#fff;padding:2px 8px;border-radius:3px;font-size:10px;font-family:monospace;pointer-events:none;white-space:nowrap;">${pw}x${ph} @ (${px},${py})</div>`;

    return `<div class="layout-editor-panel ${isSel ? 'selected' : ''}"
      style="position:absolute;left:${px}px;top:${py}px;width:${pw}px;height:${ph}px;background:${isSel ? col+'33' : col+'1a'};border:2px ${isSel ? 'solid '+col : 'solid '+col+'88'};box-sizing:border-box;cursor:pointer;transition:border-color 0.1s;overflow:visible;"
      onclick="App.layoutEditorSelectPanel(${i})"
      oncontextmenu="App.showLayoutEditorContextMenu(event,${i})">
      <div style="position:absolute;left:8px;top:8px;background:${col};color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${panel.order || i+1}</div>
      ${dimLabel}
      ${handlesHTML}
      ${moveHandle}
      ${toolbarHTML}
    </div>`;
  }).join('');

  // Grid guides
  const g3 = Math.floor(CW / 3), g2 = Math.floor(CW / 2);
  const guidesHTML = `
    <div style="position:absolute;left:${g3}px;top:0;width:0;height:100%;border-left:1px dashed rgba(107,114,128,0.2);pointer-events:none;z-index:0;"></div>
    <div style="position:absolute;left:${g3*2}px;top:0;width:0;height:100%;border-left:1px dashed rgba(107,114,128,0.2);pointer-events:none;z-index:0;"></div>
    <div style="position:absolute;left:${g2}px;top:0;width:0;height:100%;border-left:1px dashed rgba(107,114,128,0.35);pointer-events:none;z-index:0;"></div>
    <div style="position:absolute;left:0;top:${Math.floor(CH/2)}px;width:100%;height:0;border-top:1px dashed rgba(107,114,128,0.35);pointer-events:none;z-index:0;"></div>
    <div style="position:absolute;left:0;top:${Math.floor(CH/3)}px;width:100%;height:0;border-top:1px dashed rgba(107,114,128,0.2);pointer-events:none;z-index:0;"></div>
    <div style="position:absolute;left:0;top:${Math.floor(CH*2/3)}px;width:100%;height:0;border-top:1px dashed rgba(107,114,128,0.2);pointer-events:none;z-index:0;"></div>
  `;

  // Banner toolbar
  const btnBase = 'padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;';
  const bannerHTML = `
    <div style="position:absolute;top:-52px;left:-3px;right:-3px;height:48px;background:linear-gradient(135deg,#0d9488,#14b8a6);border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:space-between;padding:0 14px;color:#fff;font-size:12px;box-shadow:0 -2px 12px rgba(0,0,0,0.15);">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-weight:700;font-size:13px;">${editingName ? editingName : 'Editor de Layout'}</span>
        <span style="opacity:0.7;font-size:11px;">${panels.length} paineis</span>
      </div>
      <div style="display:flex;align-items:center;gap:5px;">
        <button onclick="App.layoutEditorAddPanel()" style="${btnBase}background:rgba(255,255,255,0.2);color:#fff;" title="Adicionar painel">+ Painel</button>
        <span style="width:1px;height:20px;background:rgba(255,255,255,0.3);"></span>
        <button onclick="App._leUndo()" style="${btnBase}background:rgba(255,255,255,${undoLen?'0.2':'0.08'});color:#fff;opacity:${undoLen?'1':'0.4'};" title="Desfazer (Ctrl+Z)">↩</button>
        <button onclick="App._leRedo()" style="${btnBase}background:rgba(255,255,255,${redoLen?'0.2':'0.08'});color:#fff;opacity:${redoLen?'1':'0.4'};" title="Refazer (Ctrl+Y)">↪</button>
        <span style="width:1px;height:20px;background:rgba(255,255,255,0.3);"></span>
        <button onclick="App.toggleLayoutEditorSnap()" style="${btnBase}background:${snapEnabled?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.1)'};color:#fff;" title="Snap magnético">${snapEnabled ? 'Snap ON' : 'Snap'}</button>
        <span style="width:1px;height:20px;background:rgba(255,255,255,0.3);"></span>
        <button onclick="App.exitLayoutEditor(true)" style="${btnBase}background:#fff;color:var(--accent);" title="Salvar (Enter)">Salvar</button>
        <button onclick="App.exitLayoutEditor(false)" style="${btnBase}background:rgba(255,255,255,0.15);color:#fff;" title="Cancelar (Esc)">Cancelar</button>
      </div>
    </div>
  `;

  // Shortcuts hint bar (below canvas)
  const hintsHTML = `
    <div style="margin-top:12px;text-align:center;color:var(--text3);font-size:10px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <span><kbd style="background:#333;color:#fff;padding:1px 4px;border-radius:2px;font-size:9px;">H</kbd> Split H</span>
      <span><kbd style="background:#333;color:#fff;padding:1px 4px;border-radius:2px;font-size:9px;">V</kbd> Split V</span>
      <span><kbd style="background:#333;color:#fff;padding:1px 4px;border-radius:2px;font-size:9px;">Ctrl+D</kbd> Duplicar</span>
      <span><kbd style="background:#333;color:#fff;padding:1px 4px;border-radius:2px;font-size:9px;">Del</kbd> Deletar</span>
      <span><kbd style="background:#333;color:#fff;padding:1px 4px;border-radius:2px;font-size:9px;">Setas</kbd> Mover</span>
      <span><kbd style="background:#333;color:#fff;padding:1px 4px;border-radius:2px;font-size:9px;">Ctrl+Z</kbd> Desfazer</span>
      <span><kbd style="background:#333;color:#fff;padding:1px 4px;border-radius:2px;font-size:9px;">Enter</kbd> Salvar</span>
    </div>
  `;

  scrollEl.innerHTML = `
    <div class="canvas-wrapper" style="margin:70px auto 40px;position:relative;">
      <div class="page-canvas layout-editor-active" style="width:${CW}px;height:${CH}px;background:#fff;position:relative;box-shadow:0 4px 24px rgba(0,0,0,0.18);border:3px solid var(--accent);animation:pulse-border 2s ease-in-out infinite;overflow:visible;">
        ${bannerHTML}
        <div class="canvas-content" style="position:relative;width:100%;height:100%;overflow:visible;">
          ${guidesHTML}
          ${panelsHTML}
        </div>
      </div>
      ${hintsHTML}
    </div>
  `;
}

/* ═══════════════════════════════════════
   VIDEO CANVAS with Dynamic Dimensions
   ═══════════════════════════════════════ */
function renderCanvas() {
  const scrollEl = document.getElementById('canvas-scroll');
  if (!scrollEl) return;

  // GUARD: Don't re-render if user is actively editing text (preserves focus)
  const activeEl = document.activeElement;
  if (!Store.get('isDraggingBalloon') && !Store.get('isResizingBalloon') && activeEl && (activeEl.isContentEditable || activeEl.tagName === 'TEXTAREA')) {
    return; // Skip render — will happen on blur
  }

  // If layout editor is active, render editor mode
  if (Store.get('layoutEditorActive')) {
    renderLayoutEditorCanvas();
    return;
  }

  // If cover is active, render cover canvas
  if (Store.get('coverActive')) {
    renderCoverCanvas();
    return;
  }

  // If back cover is active, render back cover canvas
  if (Store.get('backCoverActive')) {
    renderBackCoverCanvas();
    return;
  }

  const page = Store.getActivePage();
  if (!page) { scrollEl.innerHTML = ''; return; }

  const zoom = Store.get('zoom');
  const imgCount = page.images ? page.images.length : 0;
  const realImgCount = page.images ? page.images.filter(im => im && im.src).length : 0;
  const selectedSlot = Store.get('selectedSlot');

  // Get dimensions from video format (HQ Movie) or fallback to A4
  const project = Store.get('currentProject');
  const videoFormat = project?.videoFormat ? VIDEO_FORMATS[project.videoFormat] : null;
  const isVideoMode = !!videoFormat;
  const pageW = videoFormat ? videoFormat.width : A4.CONTENT.w;
  const pageH = videoFormat ? videoFormat.height : A4.CONTENT.h;
  // In video mode: canvas = content size, no margins
  const canvasW = isVideoMode ? pageW : A4.W;
  const canvasH = isVideoMode ? pageH : A4.H;
  const canvasMarginX = isVideoMode ? 0 : A4.MARGIN.left;
  const canvasMarginY = isVideoMode ? 0 : A4.MARGIN.top;
  const textBelowActive = page.showTextBelow;
  const maxNarrH = Math.round(pageH * 0.4);
  const textBelowH = textBelowActive ? Math.min(page.narrativeHeight || 120, maxNarrH) : 0;
  const narrativePosition = (page.narrativeStyle && page.narrativeStyle.position) || 'bottom';
  const narrativeAtTop = textBelowActive && narrativePosition === 'top';
  const panelZoneH = pageH - textBelowH;
  const panelZoneTop = narrativeAtTop ? textBelowH : 0;

  let panelsHTML = '';
  
  // ── SLIDESHOW / SEQUENCE MODE RENDERING ──
  // Renders on ANY layout when slides exist (not just layoutId==='slideshow')
  const _seqSlides = page.slides || [];
  const _hasSequence = _seqSlides.length > 0;
  
  if (_hasSequence) {
    // Use Store activeSlideIndex if set, otherwise fall back to App._activeSlidePreview
    const _storeIdx = Store.get('activeSlideIndex');
    const _si = Math.min(Math.max(0, (_storeIdx !== null && _storeIdx !== undefined ? _storeIdx : (App._activeSlidePreview || 0))), _seqSlides.length - 1);
    const _activeSlide = _seqSlides[_si];
    const _slideImg = _activeSlide.image;
    const _hasNav = _seqSlides.length > 1;
    
    // Dot indicators - smart display for many slides
    let _dots = '';
    if (_seqSlides.length <= 15) {
      // Few slides: show all dots
      _dots = _seqSlides.map((s, di) => 
        `<span onclick="App.setSlidePreview(${di})" style="width:${di === _si ? '16px' : '6px'};height:6px;border-radius:3px;background:${di === _si ? 'var(--accent)' : 'rgba(255,255,255,0.4)'};cursor:pointer;transition:all 0.2s;"></span>`
      ).join('');
    } else {
      // Many slides: show progress bar
      const progress = (_si + 1) / _seqSlides.length * 100;
      _dots = `
        <div style="width:120px;height:6px;background:rgba(255,255,255,0.2);border-radius:3px;overflow:hidden;">
          <div style="width:${progress}%;height:100%;background:var(--accent);transition:width 0.3s;"></div>
        </div>
      `;
    }
    
    panelsHTML = `<div class="canvas-content" style="height:${panelZoneH}px;position:relative;top:${panelZoneTop}px;">
      <div class="slideshow-preview" style="position:absolute;inset:0;overflow:hidden;background:#111;">
        <img src="${_slideImg}" style="position:absolute;top:50%;left:50%;width:100%;height:100%;object-fit:cover;transform:translate(-50%,-50%);" draggable="false" onerror="this.style.display='none'">
        
        ${_hasNav ? `
          <button onclick="App.prevSlidePreview()" class="seq-nav-btn seq-nav-prev" title="Slide anterior">‹</button>
          <button onclick="App.nextSlidePreview()" class="seq-nav-btn seq-nav-next" title="Próximo slide">›</button>
        ` : ''}
        
        <div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.85);padding:6px 14px;border-radius:20px;">
          <span style="color:#fff;font-size:11px;font-weight:700;">${_si + 1}/${_seqSlides.length}</span>
          <span style="color:var(--accent);font-size:9px;">|</span>
          <span style="color:rgba(255,255,255,0.7);font-size:10px;">${_activeSlide.duration}s</span>
          <span style="color:var(--accent);font-size:9px;">|</span>
          <span style="color:rgba(255,255,255,0.5);font-size:9px;">${_activeSlide.kenBurns || 'static'}</span>
        </div>
        
        ${_hasNav ? `<div style="position:absolute;bottom:44px;left:50%;transform:translateX(-50%);display:flex;gap:4px;align-items:center;">${_dots}</div>` : ''}
      </div>
      ${renderBalloons(page)}${renderStickers(page)}
    </div>`;
  } else if (page.layoutId === 'slideshow') {
    // Slideshow layout but no slides yet - show prompt
    panelsHTML = `<div class="canvas-content" style="height:${panelZoneH}px;top:${panelZoneTop}px;">
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(107,114,128,0.02);border:2px dashed var(--accent);border-radius:8px;margin:20px;">
        <div style="color:var(--accent);margin-bottom:12px;">${Icons.images}</div>
        <div style="color:var(--accent);font-weight:600;font-size:16px;margin-bottom:6px;">Sequência de Fotos</div>
        <div style="color:var(--text3);font-size:13px;text-align:center;line-height:1.5;max-width:300px;">Use o painel "Fotos em Sequência" ao lado para adicionar fotos da Library</div>
      </div>
      ${renderBalloons(page)}${renderStickers(page)}
    </div>`;
  } else {
  
  // Determine if we should show empty state or render panels
  const hasLayout = page.layoutId && page.layoutId !== '';
  const hasImages = realImgCount > 0;
  
  if (!hasLayout && !hasImages) {
    // Completely empty page - show upload prompt + any balloons/stickers
    panelsHTML = `<div class="canvas-content" style="height:${panelZoneH}px;top:${panelZoneTop}px;">
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;" 
        ondblclick="App.triggerImageUpload()"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')" ondrop="App.handleDrop(event)">
        <div style="color:#999;margin-bottom:12px;">${Icons.image.replace(/width="\d+"/, 'width="40"').replace(/height="\d+"/, 'height="40"')}</div>
        <div style="color:#666;font-weight:600;font-size:16px;margin-bottom:6px;">Arraste imagens aqui</div>
        <div style="color:#aaa;font-size:13px;">ou selecione um layout ao lado</div>
      </div>
      ${renderBalloons(page)}${renderStickers(page)}
    </div>`;
  } else if (page.layoutId && Layouts[page.layoutId] && Layouts[page.layoutId].isMateria) {
    // ── MATÉRIA SPECIAL LAYOUT ──
    const materiaLayout = Layouts[page.layoutId];
    const cols = materiaLayout.columns;
    const titleH = materiaLayout.titleHeight || 100;
    const gap = 12;
    const margin = 40;
    const colAreaW = pageW - margin * 2;
    const subtitleH = 32;
    const colAreaH = panelZoneH - titleH - subtitleH - margin - gap;
    const totalFlex = cols.reduce((s, c) => s + (c.flex || 1), 0);
    const captionH = 36;

    if (!page.images) page.images = [];
    if (!page.materiaTexts) page.materiaTexts = {};
    if (!page.materiaTitle) page.materiaTitle = '';
    if (!page.materiaZones) page.materiaZones = {};

    const _mFontMap = { serif: "'Lora','Georgia',serif", sans: "'Inter','Instrument Sans',sans-serif", comic: "'Bangers',cursive", display: "'Playfair Display',serif", mono: "'Courier New',monospace", marker: "'Permanent Marker',cursive" };

    // Read stored styles with editorial defaults
    const titleZone = page.materiaZones['materia-titulo'] || {};
    const titleStyle = titleZone.style || {};
    const tFont = _mFontMap[titleStyle.font || 'sans'] || _mFontMap.sans;
    const tSize = titleStyle.size || 36;
    const tWeight = titleStyle.weight || 700;
    const tColor = titleStyle.color || '#1a1a1a';
    const tAlign = titleStyle.align || 'left';
    const tLeading = titleStyle.leading || 1.1;
    const tUppercase = titleStyle.uppercase ? 'uppercase' : 'none';
    const tLetterSpacing = titleStyle.letterSpacing || '-0.02em';

    const subtitleZone = page.materiaZones['materia-subtitulo'] || {};
    const subtitleStyle = subtitleZone.style || {};
    const stFont = _mFontMap[subtitleStyle.font || 'sans'] || _mFontMap.sans;
    const stSize = subtitleStyle.size || 11;
    const stColor = subtitleStyle.color || '#666';
    const stAlign = subtitleStyle.align || 'left';
    const stUppercase = subtitleStyle.uppercase !== false ? 'uppercase' : 'none';

    const colunaZone = page.materiaZones['materia-coluna'] || {};
    const colunaStyle = colunaZone.style || {};
    const cFont = _mFontMap[colunaStyle.font || 'sans'] || _mFontMap.sans;
    const cSize = colunaStyle.size || 12;
    const cColor = colunaStyle.color || '#333';
    const cAlign = colunaStyle.align || 'justify';
    const cLeading = colunaStyle.leading || 1.7;
    const cColumns = colunaZone.columns || 1;
    const cColumnGap = colunaZone.columnGap || 16;
    const cDropCap = colunaZone.dropCap || false;
    const cIndent = colunaZone.indent || false;

    const legendaZone = page.materiaZones['materia-legenda'] || {};
    const legendaStyle = legendaZone.style || {};
    const lFont = _mFontMap[legendaStyle.font || 'sans'] || _mFontMap.sans;
    const lSize = legendaStyle.size || 10;
    const lColor = legendaStyle.color || '#666';

    const pageIdx = Store.get('activePageIndex');

    let imgIdx = 0;
    const colsHTML = cols.map((col, ci) => {
      const colW = Math.round(((col.flex || 1) / totalFlex) * (colAreaW - gap * (cols.length - 1)));
      if (col.type === 'text') {
        const textKey = 'col_' + ci;
        const txt = page.materiaTexts[textKey] || '';
        const colWidthMap = { 1: 'auto', 2: '140px', 3: '90px' };
        const cColWidth = colWidthMap[cColumns] || 'auto';
        const indentClass = cIndent ? ' indent-first' : '';
        return `<div style="width:${colW}px;height:${colAreaH}px;display:flex;flex-direction:column;">
          <div contenteditable="true" class="materia-text-zone materia-body-text${indentClass}"
            style="flex:1;font-family:${cFont};font-size:${cSize}px;line-height:${cLeading};color:${cColor};text-align:${cAlign};padding:12px 10px;overflow-y:auto;border:1px solid transparent;border-radius:4px;outline:none;white-space:pre-wrap;word-break:break-word;transition:border-color 0.15s;column-count:${cColumns};column-width:${cColWidth};column-gap:${cColumnGap}px;column-rule:1px solid rgba(0,0,0,0.06);hyphens:auto;-webkit-hyphens:auto;text-rendering:optimizeLegibility;"
            data-columns="${cColumns}"
            data-dropcap="${cDropCap}"
            onfocus="this.style.borderColor='rgba(234,179,8,0.4)'"
            onblur="this.style.borderColor='transparent';App.saveMateriaText(${pageIdx},'${textKey}',this.innerText)"
            onclick="event.stopPropagation();App.handleTextZoneClick(this, 'materia-coluna')"
            onkeydown="event.stopImmediatePropagation();"
            placeholder="Escreva o texto aqui..."
            data-materia-col="${textKey}"
          >${txt}</div>
        </div>`;
      } else {
        const si = imgIdx;
        imgIdx++;
        while (page.images.length <= si) page.images.push(null);
        const img = page.images[si];
        const isSel = selectedSlot === si;
        const captionKey = 'caption_' + ci;
        const caption = page.materiaTexts[captionKey] || '';
        const imgH = colAreaH - (col.hasCaption ? captionH + 4 : 0);
        return `<div style="width:${colW}px;height:${colAreaH}px;display:flex;flex-direction:column;gap:4px;">
          <div class="panel ${isSel ? 'selected' : ''}" 
            style="width:${colW}px;height:${imgH}px;border-radius:4px;overflow:hidden;position:relative;cursor:pointer;border:2px solid ${isSel ? 'var(--accent)' : '#ddd'};"
            onclick="App.selectSlot(${si})" ondblclick="App.triggerImageUpload()"
            ondragover="event.preventDefault();this.style.borderColor='var(--accent)'" 
            ondragleave="this.style.borderColor='${isSel ? 'var(--accent)' : '#ddd'}'"
            ondrop="event.preventDefault();App.handleSlotDrop(event,${si})">
            ${img && img.src 
              ? `<img src="${img.src}" style="position:absolute;top:50%;left:50%;width:100%;height:100%;object-fit:cover;object-position:center center;transform:translate(-50%,-50%);pointer-events:none;" draggable="false">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f8f8f8;color:#ccc;font-size:24px;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </div>`}
            <div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.5);color:#fff;font-size:9px;padding:1px 6px;border-radius:3px;pointer-events:none;">${si + 1}</div>
          </div>
          ${col.hasCaption ? `<div contenteditable="true" class="materia-text-zone"
            style="height:${captionH}px;font-family:${lFont};font-size:${lSize}px;font-style:italic;color:${lColor};padding:4px 6px;border:1px solid transparent;border-radius:3px;outline:none;line-height:1.3;overflow:hidden;transition:border-color 0.15s;"
            onfocus="this.style.borderColor='rgba(234,179,8,0.4)'"
            onblur="this.style.borderColor='transparent';App.saveMateriaText(${pageIdx},'${captionKey}',this.innerText)"
            onclick="event.stopPropagation();App.handleTextZoneClick(this, 'materia-legenda')"
            onkeydown="event.stopImmediatePropagation();"
            placeholder="Legenda da imagem..."
            data-materia-col="${captionKey}"
          >${caption}</div>` : ''}
        </div>`;
      }
    }).join(`<div style="width:${gap}px;flex-shrink:0;"></div>`);

    panelsHTML = `<div class="canvas-content" style="height:${panelZoneH}px;top:${panelZoneTop}px;display:flex;flex-direction:column;padding:${margin}px;">
      <!-- Title Strip -->
      <div style="width:100%;margin-bottom:4px;">
        <div contenteditable="true" class="materia-text-zone"
          style="font-family:${tFont};font-size:${tSize}px;font-weight:${tWeight};color:${tColor};text-align:${tAlign};line-height:${tLeading};letter-spacing:${tLetterSpacing};text-transform:${tUppercase};padding:8px 4px 6px;border-bottom:3px solid rgba(0,0,0,0.15);outline:none;min-height:40px;"
          onfocus="this.style.borderBottomColor='rgba(107,114,128,0.6)'"
          onblur="this.style.borderBottomColor='rgba(0,0,0,0.15)';App.saveMateriaTitle(${pageIdx},this.innerText)"
          onclick="event.stopPropagation();App.handleTextZoneClick(this, 'materia-titulo')"
          onkeydown="event.stopImmediatePropagation();"
          placeholder="Título da matéria..."
          data-materia-title="true"
        >${page.materiaTitle || ''}</div>
      </div>
      <!-- Subtitle / Credit Line -->
      <div style="width:100%;margin-bottom:${gap}px;">
        <div contenteditable="true" class="materia-text-zone materia-subtitle"
          style="font-family:${stFont};font-size:${stSize}px;color:${stColor};text-align:${stAlign};text-transform:${stUppercase};letter-spacing:0.12em;font-weight:400;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:6px 4px;outline:none;min-height:16px;"
          onfocus="this.style.borderColor='rgba(107,114,128,0.4)'"
          onblur="this.style.borderTopColor='#ccc';this.style.borderBottomColor='#ccc';App.saveMateriaText(${pageIdx},'subtitulo',this.innerText)"
          onclick="event.stopPropagation();App.handleTextZoneClick(this, 'materia-subtitulo')"
          onkeydown="event.stopImmediatePropagation();"
          data-placeholder="Subtítulo ou linha de crédito..."
          data-materia-col="subtitulo"
        >${page.materiaTexts['subtitulo'] || ''}</div>
      </div>
      <!-- Column Area -->
      <div style="display:flex;flex:1;min-height:0;">
        ${colsHTML}
      </div>
    </div>`;
  } else {
    // Has layout or images - render panels
    const layoutId = page.layoutId || LayoutEngine.getDefaultForCount(realImgCount || 1);
    const tmpl = LayoutEngine.get(layoutId, page.images || []);
    
    // DEFENSIVE: If template is invalid, show fallback instead of black screen
    if (!tmpl || !tmpl.panels || !Array.isArray(tmpl.panels) || tmpl.panels.length === 0) {
      console.warn('[renderCanvas] Invalid template for layoutId:', layoutId, tmpl);
      panelsHTML = `<div class="canvas-content" style="height:${panelZoneH}px;top:${panelZoneTop}px;display:flex;align-items:center;justify-content:center;background:#f8f8f8;">
        <div style="text-align:center;color:#666;">
          <div style="margin-bottom:8px;color:#f59e0b;">${Icons.alert}</div>
          <div>Layout inválido</div>
          <div style="font-size:12px;margin-top:4px;">Selecione outro layout na sidebar</div>
        </div>
      </div>`;
    } else {
    
    let panels = tmpl.panels;
    const isSkewed = tmpl.skewed;
    // panelOverrides removed — panels render 100% from layout template
    // (overrides were architecturally broken and caused persistent misalignment)

    // Ensure images array is at least as long as panels
    if (!page.images) page.images = [];
    while (page.images.length < panels.length) page.images.push(null);

    // Calculate scale factor to fit panels within panel zone
    let maxH = 0, maxW = 0;
    panels.forEach(p => { maxH = Math.max(maxH, p.y + p.h); maxW = Math.max(maxW, p.x + p.w); });
    const scaleY = maxH > 0 ? panelZoneH / maxH : 1;
    const scaleX = maxW > 0 ? pageW / maxW : 1;

    panelsHTML = `<div class="canvas-content" style="height:${panelZoneH}px;top:${panelZoneTop}px;">` + panels.map((panel, i) => {
      const img = page.images[i];
      const isSel = selectedSlot === i;
      // Use floor for position, ceil for size to eliminate gaps
      const px = Math.floor(panel.x * scaleX);
      const py = Math.floor(panel.y * scaleY);
      const isLastCol = (panel.x + panel.w) >= maxW - 1;
      const isLastRow = (panel.y + panel.h) >= maxH - 1;
      const pw = isLastCol ? (pageW - px) : Math.ceil(panel.w * scaleX);
      const ph = isLastRow ? (panelZoneH - py) : Math.ceil(panel.h * scaleY);
      const clipStyle = panel.clipPath ? `clip-path:${panel.clipPath};` : '';

      // Requadro (frame border) — core HQ visual element
      const pRadius = page.panelRadius || 0;
      const videoBorderless = isVideoMode && panels.length === 1;
      const requadro = isSkewed || videoBorderless ? '' : `border:${page.panelBorderWidth != null ? page.panelBorderWidth : 2}px solid ${page.panelBorderColor || '#111'};${pRadius ? 'border-radius:'+pRadius+'px;' : ''}`;
      const selOutline = isSel ? 'outline:2.5px solid #4ecdc4;outline-offset:-2px;' : '';

      // Effects are now baked into img.src — no CSS overlays needed

      // Replace target mode overlay
      const replaceOverlay = App._replaceTargetMode ? `<div class="replace-target-overlay" onclick="event.stopPropagation();App._replaceTargetSlot(${i})"><span>↔ Substituir</span></div>` : '';

      if (img && img.src) {
        const t = img.transform || { scale: 1, x: 0, y: 0 };
        const extraScale = isSkewed ? 1.3 : 1;
        const imgScale = t.scale * extraScale;
        const fitMode = img.fit || 'cover';
        // Check if in crop mode for this slot
        const inCropMode = App._cropMode?.active && App._cropMode?.panelIndex === i;
        // In crop mode: show FULL image with position offset, user drags to select visible area
        // Normal mode: standard cover/contain fit
        const imgStyle = inCropMode 
          ? `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) translate(${t.x}px,${t.y}px) scale(${imgScale});transform-origin:center center;cursor:move;`
          : `position:absolute;top:50%;left:50%;width:100%;height:100%;object-fit:${fitMode};object-position:center center;transform:translate(-50%,-50%) scale(${imgScale}) translate(${t.x}px,${t.y}px);transform-origin:center center;cursor:${App._replaceTargetMode ? 'pointer' : 'grab'};background:#000;`;
        const cropClass = inCropMode ? 'crop-mode-active' : '';
        return `<div class="panel-slot filled ${isSel ? 'selected' : ''} ${cropClass}" style="left:${px}px;top:${py}px;width:${pw}px;height:${ph}px;${inCropMode ? '' : 'overflow:hidden;'}${requadro}${selOutline}${clipStyle}box-sizing:border-box;" 
          onclick="event.stopPropagation();${App._replaceTargetMode ? `App._replaceTargetSlot(${i})` : `App.selectSlot(${i})`}" 
          ondblclick="event.stopPropagation();App.enterCropMode(${i})"
          oncontextmenu="event.preventDefault();event.stopPropagation();App.showContextMenu(event,'image',${i})" 
          ondragover="event.preventDefault();event.dataTransfer.dropEffect='copy'" 
          ondragenter="event.preventDefault();App._panelDragEnter(this)" 
          ondragleave="App._panelDragLeave(this)" 
          ondrop="App._panelDragDrop(this);App.handleSlotDrop(event,${i})"
          onmousedown="App.startImagePan(event,${i})"
          ontouchstart="App.startImagePanTouch(event,${i})"
          onwheel="App.handleImageZoom(event,${i})">
          <img src="${img.src}" alt="" draggable="false" style="${imgStyle}" onerror="this.style.display='none';this.parentElement.classList.add('img-error');">
          ${renderRecordatorio(page, i, pw, ph)}
          <div class="frame-label-overlay" style="position:absolute;top:3px;left:3px;width:20px;height:20px;background:rgba(0,0,0,0.65);color:#fff;font-size:11px;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;">${panel.order || i + 1}</div>
          <div class="panel-mini-toolbar" style="position:absolute;top:0;left:0;right:0;height:28px;display:flex;align-items:center;justify-content:center;gap:4px;background:rgba(0,0,0,0.7);z-index:20;">
            <button onmousedown="event.stopPropagation()" onclick="event.stopPropagation();App.triggerImageUpload(${i})" title="Substituir imagem" style="background:transparent;color:#fff;border:none;padding:2px 8px;font-size:11px;cursor:pointer;font-weight:600;">${Icons.upload} Trocar</button>
            <button onmousedown="event.stopPropagation()" onclick="event.stopPropagation();App.removeImage(${i})" title="Remover imagem" style="background:transparent;color:#fff;border:none;padding:2px 8px;font-size:11px;cursor:pointer;">${Icons.trash}</button>
            <button onmousedown="event.stopPropagation()" onclick="event.stopPropagation();App.showContextMenu(event,'image',${i})" title="Mais opções" style="background:transparent;color:#fff;border:none;padding:2px 8px;font-size:11px;cursor:pointer;">⋯</button>
          </div>
          ${replaceOverlay}
        </div>`;
      }
      // Empty panel - single click triggers upload directly (more intuitive UX)
      const emptySelected = selectedSlot === i;
      const emptySelOutline = emptySelected ? 'outline:2.5px solid #4ecdc4;outline-offset:-2px;' : '';
      return `<div class="panel-slot empty ${emptySelected ? 'selected' : ''}" style="left:${px}px;top:${py}px;width:${pw}px;height:${ph}px;${requadro}${emptySelOutline}${clipStyle}box-sizing:border-box;background:repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(0,0,0,0.03) 8px,rgba(0,0,0,0.03) 9px);" 
        onclick="event.stopPropagation();App.selectSlot(${i});App.triggerImageUpload(${i})"
        oncontextmenu="event.preventDefault();event.stopPropagation();App.showContextMenu(event,'empty-panel',${i})"
        ondragover="event.preventDefault();event.dataTransfer.dropEffect='copy'" 
        ondragenter="event.preventDefault();App._panelDragEnter(this)" 
        ondragleave="App._panelDragLeave(this)" 
        ondrop="App._panelDragDrop(this);App.handleSlotDrop(event,${i})">
          ${emptySelected ? `<div class="panel-mini-toolbar" style="position:absolute;top:0;left:0;right:0;height:28px;display:flex;align-items:center;justify-content:center;gap:4px;background:rgba(0,0,0,0.7);z-index:20;">
            <button onmousedown="event.stopPropagation()" onclick="event.stopPropagation();App.triggerImageUpload(${i})" title="Upload imagem" style="background:transparent;color:#fff;border:none;padding:2px 8px;font-size:11px;cursor:pointer;font-weight:600;">${Icons.upload} Upload</button>
            <button onmousedown="event.stopPropagation()" onclick="event.stopPropagation();App.pasteFromClipboard()" title="Colar (Ctrl+V)" style="background:transparent;color:#fff;border:none;padding:2px 8px;font-size:11px;cursor:pointer;">${Icons.copy} Colar</button>
          </div>` : ''}
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;pointer-events:none;height:100%;">
            <div style="width:72px;height:72px;border-radius:12px;background:${emptySelected ? 'rgba(78,205,196,0.15)' : 'rgba(255,255,255,0.08)'};border:2px dashed ${emptySelected ? 'var(--accent)' : 'rgba(255,255,255,0.25)'};display:flex;align-items:center;justify-content:center;transition:all 0.2s;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${emptySelected ? 'var(--accent)' : 'rgba(255,255,255,0.5)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            </div>
            <div style="text-align:center;">
              <div style="color:${emptySelected ? 'var(--accent)' : 'rgba(255,255,255,0.7)'};font-size:14px;font-weight:600;margin-bottom:4px;">${window.innerWidth <= 768 ? 'Toque para adicionar foto' : 'Adicionar foto'}</div>
              <div style="font-size:11px;color:${emptySelected ? 'var(--accent)' : 'rgba(255,255,255,0.4)'};">Quadro ${i + 1} ${window.innerWidth <= 768 ? '' : '• Clique ou arraste'}</div>
            </div>
          </div>
        </div>`;
    }).join('');
    
    // Render gutter indicators between panels (tooltip-only, no drag resize)
    let gutterHTML = '';
    if (!isSkewed && panels.length > 1) {
      const gutters = findGutters(panels, scaleX, scaleY);
      gutterHTML = gutters.map(g => {
        if (g.dir === 'h') {
          return `<div class="gutter-handle gutter-h" style="position:absolute;left:${Math.round(g.x)}px;top:${Math.round(g.y - 10)}px;width:${Math.round(g.len)}px;height:20px;cursor:default;z-index:45;display:flex;align-items:center;justify-content:center;" title="Para ajustar proporções, escolha um layout na sidebar ←"><div class="gutter-handle-line" style="width:50px;height:4px;border-radius:2px;background:rgba(107,114,128,0.4);transition:all 0.15s;"></div></div>`;
        } else {
          return `<div class="gutter-handle gutter-v" style="position:absolute;left:${Math.round(g.x - 10)}px;top:${Math.round(g.y)}px;width:20px;height:${Math.round(g.len)}px;cursor:default;z-index:45;display:flex;align-items:center;justify-content:center;" title="Para ajustar proporções, escolha um layout na sidebar ←"><div class="gutter-handle-line" style="width:4px;height:50px;border-radius:2px;background:rgba(107,114,128,0.4);transition:all 0.15s;"></div></div>`;
        }
      }).join('');
    }
    
    panelsHTML += gutterHTML + renderBalloons(page) + renderStickers(page) + `</div>`;
    } // end if (tmpl valid)
  }
  } // end else (non-slideshow layouts)

  // Narrative "Texto Embaixo" — rendered on canvas when active
  const narrativeStyle = page.narrativeStyle || { align: 'justify', font: 'serif', size: 15 };
  const narrativeFont = FontUtils.family(narrativeStyle.font);
  const activeLang = project?.activeLanguage || 'pt-BR';
  const narrativeText = MultiLang.get(page.narrative, activeLang);
  const _nBgOpacity = narrativeStyle.bgOpacity != null ? narrativeStyle.bgOpacity : 0.55;
  const _nBgHex = narrativeStyle.bgColor && narrativeStyle.bgColor.startsWith('#') ? narrativeStyle.bgColor : '#000000';
  const _nR = parseInt(_nBgHex.slice(1,3),16)||0, _nG = parseInt(_nBgHex.slice(3,5),16)||0, _nB2 = parseInt(_nBgHex.slice(5,7),16)||0;
  const _nBg = `rgba(${_nR},${_nG},${_nB2},${_nBgOpacity})`;
  const _isDualNarr = project?.narrativeDisplay === 'dual';
  const _dualSpacing = project?.narrativeDualSpacing || 4;
  const _dualOrder = project?.narrativeOrder || 'pt-first';
  const _ptText = MultiLang.get(page.narrative, 'pt-BR');
  const _enText = MultiLang.get(page.narrative, 'en');
  const _topLang = _dualOrder === 'pt-first' ? 'pt-BR' : 'en';
  const _botLang = _dualOrder === 'pt-first' ? 'en' : 'pt-BR';
  const _topText = _dualOrder === 'pt-first' ? _ptText : _enText;
  const _botText = _dualOrder === 'pt-first' ? _enText : _ptText;
  const _topLabel = _topLang === 'pt-BR' ? 'PT' : 'EN';
  const _botLabel = _botLang === 'pt-BR' ? 'PT' : 'EN';
  const _dualFontSize = Math.max(10, Math.round((narrativeStyle.size || 15) * 0.8));
  const _nStrokeStyle = narrativeStyle.strokeEnabled ? `-webkit-text-stroke:${narrativeStyle.strokeWidth || 3}px ${narrativeStyle.strokeColor || '#000000'};paint-order:stroke fill;` : '';
  const _nBaseStyle = `font-family:${narrativeFont};text-align:${narrativeStyle.align};${narrativeStyle.bold ? 'font-weight:bold;' : 'font-weight:normal;'}${narrativeStyle.italic ? 'font-style:italic;' : ''}color:${narrativeStyle.color || narrativeStyle.textColor || '#ffffff'};${narrativeStyle.leading ? 'line-height:'+narrativeStyle.leading+';' : ''}${_nStrokeStyle}${narrativeStyle.strokeEnabled ? '' : 'text-shadow:0 1px 2px rgba(0,0,0,0.5);'}letter-spacing:0.01em;`;
  const narrativeHTML = textBelowActive ? `
    <div class="narrative-resize-handle" style="position:absolute;left:0;top:${narrativeAtTop ? textBelowH - 12 : panelZoneH - 12}px;width:${pageW}px;height:24px;cursor:ns-resize;z-index:50;display:flex;align-items:center;justify-content:center;gap:8px;" onmousedown="App.startNarrativeDrag(event)">
      <div style="width:40px;height:3px;border-radius:1px;background:rgba(107,114,128,0.5);"></div>
      <span style="font-size:9px;color:rgba(107,114,128,0.7);font-weight:600;pointer-events:none;">${textBelowH}px${_isDualNarr ? ' · DUAL' : ''}${narrativeAtTop ? ' · TOP' : ''}</span>
      <div style="width:40px;height:3px;border-radius:1px;background:rgba(107,114,128,0.5);"></div>
    </div>
    <div class="text-below-area narrative-box-pro" style="position:absolute;left:0;top:${narrativeAtTop ? 0 : panelZoneH}px;width:${pageW}px;height:${textBelowH}px;background:${_nBg};backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:${narrativeAtTop ? '0 2px 12px rgba(0,0,0,0.3)' : '0 -2px 12px rgba(0,0,0,0.3)'};">

      ${_isDualNarr ? `
      <div style="display:flex;flex-direction:column;width:100%;height:100%;box-sizing:border-box;">
        <div style="position:relative;flex:1;min-height:0;">
          <span style="position:absolute;left:6px;top:4px;font-size:8px;font-weight:700;color:rgba(0,212,255,0.7);z-index:1;pointer-events:none;text-transform:uppercase;letter-spacing:0.5px;">${_topLabel}</span>
          <div contenteditable="true" class="text-below-content text-below-dual-top" placeholder="${_topLang === 'pt-BR' ? 'Narrativa PT-BR...' : 'Narrative EN...'}"
            oninput="App.updateNarrativeLang('${_topLang}', this.innerText)"
            onclick="event.stopPropagation();App.handleTextZoneClick(this, 'narrativa')"
            onkeydown="event.stopImmediatePropagation();"
            onmousedown="event.stopPropagation();"
            style="width:100%;height:100%;padding:14px 20px 4px 20px;box-sizing:border-box;font-size:${_dualFontSize}px;overflow-y:auto;${_nBaseStyle}"
          >${S(_topText || '')}</div>
        </div>
        <div style="height:0;border-top:1px solid rgba(0,212,255,0.2);margin:0 16px;flex-shrink:0;"></div>
        <div style="position:relative;flex:1;min-height:0;">
          <span style="position:absolute;left:6px;top:4px;font-size:8px;font-weight:700;color:rgba(168,162,158,0.7);z-index:1;pointer-events:none;text-transform:uppercase;letter-spacing:0.5px;">${_botLabel}</span>
          <div contenteditable="true" class="text-below-content text-below-dual-bot" placeholder="${_botLang === 'pt-BR' ? 'Narrativa PT-BR...' : 'Narrative EN...'}"
            oninput="App.updateNarrativeLang('${_botLang}', this.innerText)"
            onclick="event.stopPropagation();App.handleTextZoneClick(this, 'narrativa')"
            onkeydown="event.stopImmediatePropagation();"
            onmousedown="event.stopPropagation();"
            style="width:100%;height:100%;padding:14px 20px 4px 20px;box-sizing:border-box;font-size:${_dualFontSize}px;overflow-y:auto;opacity:0.8;${_nBaseStyle}"
          >${S(_botText || '')}</div>
        </div>
      </div>` : `
      <div contenteditable="true" class="text-below-content" placeholder="${activeLang === 'pt-BR' ? 'Escreva a narrativa aqui...' : 'Write narration here...'}"
        oninput="App.updateNarrative(this.innerText)"
        onclick="event.stopPropagation();App.handleTextZoneClick(this, 'narrativa')"
        onkeydown="event.stopImmediatePropagation();"
        onmousedown="event.stopPropagation();"
        style="width:100%;height:100%;padding:16px 24px 16px 20px;box-sizing:border-box;font-family:${narrativeFont};font-size:${narrativeStyle.size}px;text-align:${narrativeStyle.align};overflow-y:auto;${narrativeStyle.bold ? 'font-weight:bold;' : 'font-weight:normal;'}${narrativeStyle.italic ? 'font-style:italic;' : ''}color:${narrativeStyle.color || narrativeStyle.textColor || '#ffffff'};${narrativeStyle.leading ? 'line-height:'+narrativeStyle.leading+';' : ''}text-shadow:0 1px 2px rgba(0,0,0,0.5);letter-spacing:0.01em;"
      >${S(narrativeText || '')}</div>`}
    </div>` : '';
  const canvasTools = '';
  
  // Floating properties toolbar for selected balloon
  const selectedEl = Store.get('selectedElement');
  const selectedBalloon = selectedEl && selectedEl.type === 'balloon' ? page.texts[selectedEl.index] : null;
  const currentDir = selectedBalloon?.direction || 's';
  const balloonBgColor = selectedBalloon?.bgColor || '#ffffff';
  const balloonTextColor = selectedBalloon?.textColor || (selectedBalloon?.type === 'sfx' ? '#ff3333' : '#1a1a1a');
  const _dirBtn = (dir, label, idx) => {
    const isActive = currentDir === dir;
    const isNone = dir === 'none';
    return `<button class="tdg-btn ${isActive ? 'active' : ''} ${isNone ? 'tdg-none' : ''}" data-dir="${dir}" onmousedown="event.preventDefault()" onclick="App.changeBalloonDirection(${idx},'${dir}')" title="${label}">${label}</button>`;
  };
  const directionPicker = selectedBalloon && selectedBalloon.type !== 'narration' && selectedBalloon.type !== 'sfx' ? `
    <div class="tail-dir-grid" title="Direção da cauda">
      ${_dirBtn('nw','↖',selectedEl.index)}${_dirBtn('n','↑',selectedEl.index)}${_dirBtn('ne','↗',selectedEl.index)}
      ${_dirBtn('w','←',selectedEl.index)}${_dirBtn('none','○',selectedEl.index)}${_dirBtn('e','→',selectedEl.index)}
      ${_dirBtn('sw','↙',selectedEl.index)}${_dirBtn('s','↓',selectedEl.index)}${_dirBtn('se','↘',selectedEl.index)}
    </div>
  ` : '';
  // Bleed/Safe zone guides overlay (disabled in video mode)
  const showBleed = isVideoMode ? false : (Store.get('showBleed') || false);
  const bleedMargin = 10; // 3mm ~10px at 96dpi
  const safeMargin = 30;  // ~10mm safe zone
  const bleedOverlay = showBleed ? `
    <div style="position:absolute;inset:0;pointer-events:none;z-index:25;">
      <div style="position:absolute;inset:${bleedMargin}px;border:1px dashed rgba(255,0,0,0.5);"></div>
      <div style="position:absolute;inset:${safeMargin}px;border:1px dashed rgba(0,150,255,0.4);"></div>
      <span style="position:absolute;top:${bleedMargin - 1}px;left:${bleedMargin + 4}px;font-size:8px;color:rgba(255,0,0,0.6);background:rgba(255,255,255,0.8);padding:0 3px;border-radius:2px;">BLEED</span>
      <span style="position:absolute;top:${safeMargin - 1}px;left:${safeMargin + 4}px;font-size:8px;color:rgba(0,150,255,0.6);background:rgba(255,255,255,0.8);padding:0 3px;border-radius:2px;">SAFE</span>
    </div>` : '';

  // Reading order overlay
  const showReadingOrder = Store.get('showReadingOrder') || false;
  const readingOrderOverlay = showReadingOrder && page.texts && page.texts.length > 0 ? `
    <svg style="position:absolute;inset:0;pointer-events:none;z-index:24;width:100%;height:100%;">
      ${page.texts.map((b, bi) => {
        const bx = (b.x || 100) + (b.w || 180) / 2;
        const by = (b.y || 100) + (b.h || 100) / 2;
        const next = page.texts[bi + 1];
        const line = next ? `<line x1="${bx}" y1="${by}" x2="${(next.x || 100) + (next.w || 180) / 2}" y2="${(next.y || 100) + (next.h || 100) / 2}" stroke="rgba(74,153,153,0.5)" stroke-width="2" stroke-dasharray="6,4"/>` : '';
        return `<circle cx="${bx}" cy="${by}" r="12" fill="rgba(74,153,153,0.8)" stroke="#fff" stroke-width="1.5"/>
          <text x="${bx}" y="${by + 4}" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">${bi + 1}</text>${line}`;
      }).join('')}
    </svg>` : '';

  // Page number indicator
  const activePageIndex = Store.get('activePageIndex') || 0;
  const totalPages = Store.get('currentProject')?.pages?.length || 1;
  const pageNumberOverlay = `<div style="position:absolute;bottom:6px;right:8px;font-size:10px;color:rgba(0,0,0,0.3);pointer-events:none;z-index:22;font-weight:600;">${activePageIndex + 1} / ${totalPages}</div>`;

  // Page background color
  const pageBgColor = page.bgColor || '#ffffff';

  // Margin guide lines (disabled in video mode — no margins)
  const showGuides = isVideoMode ? false : Store.get('showGuides');
  const mx = canvasMarginX, my = canvasMarginY;
  const marginGuides = showGuides ? `
    <div style="position:absolute;left:${mx}px;top:${my}px;width:${pageW}px;height:${pageH}px;border:1.5px dashed rgba(107,114,128,0.25);pointer-events:none;z-index:5;box-sizing:border-box;"></div>
    <span style="position:absolute;top:${my - 14}px;left:${mx}px;font-size:8px;color:rgba(107,114,128,0.35);pointer-events:none;z-index:5;">MARGEM</span>` : '';

  // Fixed panel selector buttons (1-9)
  const selectorLayoutId = page.layoutId || LayoutEngine.getDefaultForCount(realImgCount || 1);
  const tmplForButtons = LayoutEngine.get(selectorLayoutId, page.images || []);
  const panelCount = tmplForButtons && tmplForButtons.panels ? tmplForButtons.panels.length : 0;
  const panelSelectorHTML = panelCount > 0 ? `
    <div class="panel-selector-fixed" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:4px;background:rgba(0,0,0,0.75);padding:6px 10px;border-radius:20px;z-index:100;backdrop-filter:blur(8px);box-shadow:0 2px 12px rgba(0,0,0,0.3);">
      ${Array.from({length: panelCount}, (_, i) => {
        const isSelected = selectedSlot === i;
        const hasImage = page.images && page.images[i] && page.images[i].src;
        const bgColor = isSelected ? 'var(--accent)' : (hasImage ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.15)');
        const textColor = isSelected || hasImage ? '#fff' : 'rgba(255,255,255,0.6)';
        return `<button onclick="event.stopPropagation();App.selectSlot(${i})" title="Painel ${i+1}${hasImage ? ' (com imagem)' : ' (vazio)'}" style="width:28px;height:28px;border-radius:50%;border:2px solid ${isSelected ? '#fff' : 'transparent'};background:${bgColor};color:${textColor};font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center;" onmouseenter="this.style.transform='scale(1.15)'" onmouseleave="this.style.transform='scale(1)'">${i+1}</button>`;
      }).join('')}
    </div>` : '';

  const videoBg = isVideoMode ? '#000' : pageBgColor;
  scrollEl.innerHTML = `
    <div class="bento-frame" id="canvas-page" onclick="App.handleCanvasPageClick(event)" style="width:${canvasW}px;height:${canvasH}px;background:${videoBg};${isVideoMode ? 'box-shadow:0 4px 40px rgba(0,0,0,0.5);' : ''}position:relative;overflow:hidden;">
      
      <!-- Motion Layer: Only this gets the Ken Burns transform -->
      <div id="canvas-motion-layer" style="position:absolute;left:${mx}px;top:${my}px;width:${pageW}px;height:${pageH}px;transform-origin:center center;will-change:transform;">
        ${panelsHTML}
      </div>

      <!-- Static Layer: Narrative text, balloons, and guides stay fixed -->
      <div id="canvas-static-layer" style="position:absolute;left:${mx}px;top:${my}px;width:${pageW}px;height:${pageH}px;pointer-events:none;">
        <div style="pointer-events:all;">${narrativeHTML}</div>
        <div style="pointer-events:all;">${canvasTools}</div>
      </div>
      
      ${marginGuides}
      ${bleedOverlay}
      ${readingOrderOverlay}
      ${pageNumberOverlay}
      ${panelSelectorHTML}
    </div>
  `;
  
  // Initialize ResizeObservers for shout balloons
  _initShoutObservers();
  if (typeof App !== 'undefined' && App.applyNarrativeAutoFit) {
    requestAnimationFrame(() => App.applyNarrativeAutoFit());
  }
}

// ── Shout ResizeObserver — updates SVG when text changes wrapper size ──
let _shoutObservers = [];
function _initShoutObservers() {
  // Disconnect existing observers
  _shoutObservers.forEach(ro => ro.disconnect());
  _shoutObservers = [];
  
  // Find all shout balloons
  const shoutBalloons = document.querySelectorAll('.balloon-css.shout');
  shoutBalloons.forEach(el => {
    const idx = parseInt(el.dataset.balloonIdx, 10);
    if (isNaN(idx)) return;
    
    // Create ResizeObserver for this shout
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const wrapper = entry.target;
        const w = wrapper.offsetWidth;
        const h = wrapper.offsetHeight;
        
        // Update SVG to match new dimensions
        const svgLayer = wrapper.querySelector('.shout-svg-bg');
        if (svgLayer && typeof BalloonSVGRenderer !== 'undefined') {
          const page = Store.getActivePage();
          const balloon = page?.texts?.[idx];
          if (!balloon) continue;
          
          const dir = balloon.direction || 's';
          const bg = balloon.bgColor || '#fffde7';
          const stroke = balloon.strokeColor || '#1a1a1a';
          svgLayer.innerHTML = BalloonSVGRenderer.shout(w, h, dir, { 
            fill: bg === '#ffffff' ? '#fffde7' : bg, 
            stroke: stroke, 
            strokeWidth: 2.5 
          });
          
          // Update balloon data
          balloon.w = w;
          balloon.h = h;
        }
      }
    });
    
    ro.observe(el);
    _shoutObservers.push(ro);
    
    // Initial SVG update to match current size
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const svgLayer = el.querySelector('.shout-svg-bg');
    if (svgLayer && typeof BalloonSVGRenderer !== 'undefined') {
      const page = Store.getActivePage();
      const balloon = page?.texts?.[idx];
      if (balloon) {
        const dir = balloon.direction || 's';
        const bg = balloon.bgColor || '#fffde7';
        const stroke = balloon.strokeColor || '#1a1a1a';
        svgLayer.innerHTML = BalloonSVGRenderer.shout(w, h, dir, { 
          fill: bg === '#ffffff' ? '#fffde7' : bg, 
          stroke: stroke, 
          strokeWidth: 2.5 
        });
      }
    }
  });
}

/* ═══════════════════════════════════════
   COVER RIGHT PANEL
   ═══════════════════════════════════════ */
function renderCoverRightPanel() {
  const el = document.getElementById('right-panel-content');
  if (!el) return;
  const p = Store.get('currentProject');
  if (!p || !p.cover) { el.innerHTML = ''; return; }
  const cover = p.cover;
  const selectedEl = Store.get('selectedElement');
  const selectedCoverEl = selectedEl && selectedEl.type === 'cover-text'
    ? (cover.elements || []).find(e => e.id === selectedEl.id)
    : null;
  const collapsed = Store.get('sidebarCollapsed') || {};

  let html = `<div style="padding:6px;font-size:11px;">
    <div style="display:flex;align-items:center;gap:8px;padding:6px 4px 10px;border-bottom:1px solid var(--border);margin-bottom:8px;">
      <span style="display:inline-flex;color:var(--accent);">${Icons.palette}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--accent);">${t('cover.title')}</div>
        <div style="font-size:9px;color:var(--text3);">${t('cover.subtitle')}</div>
      </div>
    </div>`;

  // ── SELECTED COVER TEXT ELEMENT ──
  if (selectedCoverEl) {
    const el_id = selectedCoverEl.id;
    const s = selectedCoverEl.style || {};
    const _hex = c => { if (!c || c === 'transparent') return '#000000'; if (/^#[0-9a-f]{6}$/i.test(c)) return c; if (/^#[0-9a-f]{3}$/i.test(c)) return '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]; return '#000000'; };
    const roleLabels = { title: t('cover.metaTitle'), subtitle: t('cover.metaSubtitle'), author: t('cover.metaAuthor'), publisher: t('cover.metaPublisher'), tagline: 'Tagline', custom: t('cover.customElement').replace('+ ','') };
    html += `
      <div style="background:var(--surface2);border-radius:6px;padding:8px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;">
          <span style="font-size:10px;font-weight:700;color:var(--accent);flex:1;">${Icons.feather} ${roleLabels[selectedCoverEl.role] || 'Texto'}</span>
          <button onclick="App.deleteCoverElement('${el_id}')" style="padding:2px 6px;border-radius:3px;border:1px solid #c00;background:#400;color:#fff;font-size:10px;cursor:pointer;">✕ Remover</button>
        </div>
        <textarea
          oninput="App.updateCoverElement('${el_id}','text',this.value)"
          style="width:100%;min-height:56px;border:1px solid var(--border);border-radius:4px;background:var(--surface);color:var(--text);padding:6px;font-size:11px;resize:vertical;outline:none;margin-bottom:6px;"
        >${S(selectedCoverEl.text || '')}</textarea>

        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:9px;color:var(--text3);width:40px;">Cor</span>
          <input type="color" value="${_hex(s.color)}" onchange="App.updateCoverElement('${el_id}','style.color',this.value)" style="width:28px;height:22px;border:1px solid var(--border);border-radius:3px;cursor:pointer;padding:0;">
          <span style="font-size:9px;color:var(--text3);margin-left:4px;">Tamanho</span>
          <span style="font-size:9px;color:var(--text2);width:26px;">${s.fontSize || 24}px</span>
          <input type="range" min="10" max="250" value="${s.fontSize || 24}" oninput="this.previousElementSibling.textContent=this.value+'px';App.updateCoverElement('${el_id}','style.fontSize',parseInt(this.value))" style="flex:1;height:14px;">
        </div>

        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:9px;color:var(--text3);width:40px;">Espaço</span>
          <span style="font-size:9px;color:var(--text2);width:26px;">${s.letterSpacing ? s.letterSpacing.replace('px','') : '0'}</span>
          <input type="range" min="-10" max="30" value="${s.letterSpacing ? parseInt(s.letterSpacing) : 0}" oninput="this.previousElementSibling.textContent=this.value;App.updateCoverElement('${el_id}','style.letterSpacing',this.value+'px')" style="flex:1;height:14px;">
          <span style="font-size:9px;color:var(--text3);margin-left:4px;">Linhas</span>
          <span style="font-size:9px;color:var(--text2);width:26px;">${s.lineHeight || '1.0'}</span>
          <input type="range" min="0.5" max="2" step="0.05" value="${s.lineHeight || 1.0}" oninput="this.previousElementSibling.textContent=this.value;App.updateCoverElement('${el_id}','style.lineHeight',this.value)" style="flex:1;height:14px;">
        </div>

        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:9px;color:var(--text3);width:40px;">Estilo</span>
          <div style="display:flex;gap:2px;">
            <button onclick="App.updateCoverElement('${el_id}','style.fontWeight',${(s.fontWeight==='700'||s.fontWeight==='bold'||s.fontWeight==='900')?`'400'`:`'700'`})" style="padding:2px 8px;border-radius:3px;border:1px solid ${(s.fontWeight==='700'||s.fontWeight==='bold'||s.fontWeight==='900')?'var(--accent)':'var(--border)'};background:${(s.fontWeight==='700'||s.fontWeight==='bold'||s.fontWeight==='900')?'var(--accent-glow)':'var(--surface)'};color:${(s.fontWeight==='700'||s.fontWeight==='bold'||s.fontWeight==='900')?'var(--accent)':'var(--text3)'};font-size:10px;font-weight:700;cursor:pointer;">B</button>
            <button onclick="App.updateCoverElement('${el_id}','style.fontStyle',${s.fontStyle==='italic'?`'normal'`:`'italic'`})" style="padding:2px 8px;border-radius:3px;border:1px solid ${s.fontStyle==='italic'?'var(--accent)':'var(--border)'};background:${s.fontStyle==='italic'?'var(--accent-glow)':'var(--surface)'};color:${s.fontStyle==='italic'?'var(--accent)':'var(--text3)'};font-size:10px;font-style:italic;cursor:pointer;">I</button>
            <button onclick="App.updateCoverElement('${el_id}','style.textTransform',${s.textTransform==='uppercase'?`'none'`:`'uppercase'`})" style="padding:2px 8px;border-radius:3px;border:1px solid ${s.textTransform==='uppercase'?'var(--accent)':'var(--border)'};background:${s.textTransform==='uppercase'?'var(--accent-glow)':'var(--surface)'};color:${s.textTransform==='uppercase'?'var(--accent)':'var(--text3)'};font-size:10px;cursor:pointer;">AA</button>
            <button onclick="App.updateCoverElement('${el_id}','style.transform',${(s.transform||'').includes('scaleX')?`'none'`:`'scaleX(1.2)'`})" style="padding:2px 6px;border-radius:3px;border:1px solid ${(s.transform||'').includes('scaleX')?'var(--accent)':'var(--border)'};background:${(s.transform||'').includes('scaleX')?'var(--accent-glow)':'var(--surface)'};color:${(s.transform||'').includes('scaleX')?'var(--accent)':'var(--text3)'};font-size:10px;letter-spacing:1px;cursor:pointer;" title="Esticar Horizontalmente">↔️</button>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;">
          <span style="font-size:9px;color:var(--text3);width:40px;">Fonte</span>
          <select onchange="App.updateCoverElement('${el_id}','style.fontFamily',this.value)" style="flex:1;padding:3px;border-radius:3px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:10px;">
            <optgroup label="Impacto Extremo (Heavy)">
              <option value="'Archivo Black', sans-serif" ${(s.fontFamily||'').includes('Archivo')?'selected':''}>Archivo Black (Super Wide)</option>
              <option value="'Anton', sans-serif" ${(s.fontFamily||'').includes('Anton')?'selected':''}>Anton (Super Tall)</option>
              <option value="'Koulen', sans-serif" ${(s.fontFamily||'').includes('Koulen')?'selected':''}>Koulen (Modern Block)</option>
              <option value="'Black Han Sans', sans-serif" ${(s.fontFamily||'').includes('Black Han')?'selected':''}>Black Han Sans (Massive)</option>
            </optgroup>
            <optgroup label="Editorial & Moderno">
              <option value="'Syne', sans-serif" ${(s.fontFamily||'').includes('Syne')?'selected':''}>Syne (Avant-Garde)</option>
              <option value="'Playfair Display', Georgia, serif" ${(s.fontFamily||'').includes('Playfair')?'selected':''}>Playfair Display</option>
              <option value="'Bebas Neue', 'Oswald', sans-serif" ${(s.fontFamily||'').includes('Bebas')?'selected':''}>Bebas Neue</option>
              <option value="'Oswald', sans-serif" ${(s.fontFamily||'').includes('Oswald')&&!(s.fontFamily||'').includes('Bebas')?'selected':''}>Oswald</option>
            </optgroup>
            <optgroup label="Clássicos & HQ">
              <option value="'Bangers', 'Impact', sans-serif" ${(s.fontFamily||'').includes('Bangers')?'selected':''}>Bangers</option>
              <option value="'Nunito', sans-serif" ${(s.fontFamily||'').includes('Nunito')?'selected':''}>Nunito</option>
              <option value="'Instrument Sans', sans-serif" ${(s.fontFamily||'').includes('Instrument')?'selected':''}>Instrument Sans</option>
              <option value="'Inter', sans-serif" ${(s.fontFamily||'').includes('Inter')&&!(s.fontFamily||'').includes('Spline')&&!(s.fontFamily||'').includes('Instrument')?'selected':''}>Inter</option>
            </optgroup>
          </select>
        </div>

        <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;">
          <span style="font-size:9px;color:var(--text3);width:40px;">Camada</span>
          <div style="display:flex;gap:4px;flex:1;">
            <button onclick="App.moveCoverElementZ('${el_id}', -1)" style="flex:1;padding:3px;border-radius:3px;border:1px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;cursor:pointer;">↓ Recuar</button>
            <button onclick="App.moveCoverElementZ('${el_id}', 1)" style="flex:1;padding:3px;border-radius:3px;border:1px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;cursor:pointer;">↑ Avançar</button>
          </div>
          <span style="font-size:9px;color:var(--text3);margin-left:4px;">Alinhar</span>
          <div style="display:flex;gap:2px;">
            ${['left','center','right'].map(a => `<button onclick="App.updateCoverElement('${el_id}','style.textAlign','${a}')" style="padding:2px 8px;border-radius:3px;border:1px solid ${s.textAlign===a?'var(--accent)':'var(--border)'};background:${s.textAlign===a?'var(--accent-glow)':'var(--surface)'};color:${s.textAlign===a?'var(--accent)':'var(--text3)'};font-size:10px;cursor:pointer;">${a==='left'?'⇤':a==='center'?'↔':'⇥'}</button>`).join('')}
          </div>
        </div>

        <div style="margin-bottom:4px;">
          <span style="font-size:9px;color:var(--text3);display:block;margin-bottom:4px;">PRESETS DE ESTILO</span>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">
            ${Object.entries(COVER_TEXT_PRESETS).map(([id, preset]) =>
              `<button onclick="App.applyCoverTextPreset('${el_id}','${id}')" style="padding:3px 4px;border-radius:3px;border:1px solid var(--border);background:var(--surface2);color:var(--text3);font-size:9px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${preset.name}">${preset.name}</button>`
            ).join('')}
          </div>
        </div>
      </div>`;
  }

  // ── TEMPLATES ──
  const tmplCollapsed = collapsed.coverTemplates;
  html += `
    <div style="margin-bottom:6px;">
      <div onclick="App.toggleSidebarSection('coverTemplates')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;">${Icons.layers} TEMPLATES</span>
        <span style="font-size:10px;color:var(--text3);">${tmplCollapsed ? '+' : '-'}</span>
      </div>
      ${!tmplCollapsed ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
          ${Object.entries(COVER_TEMPLATES).map(([id, tmpl]) => `
            <button onclick="App.applyCoverTemplate('${id}')" style="padding:8px 6px;border-radius:6px;border:1.5px solid ${cover.template===id?'var(--accent)':'var(--border)'};background:${cover.template===id?'var(--accent-glow)':'var(--surface2)'};color:${cover.template===id?'var(--accent)':'var(--text2)'};cursor:pointer;text-align:left;font-size:10px;font-weight:${cover.template===id?'700':'400'};transition:all 0.15s;display:flex;flex-direction:column;gap:4px;" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='${cover.template===id?'var(--accent)':'var(--border)'}'">
              <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:${cover.template===id?'var(--accent)':'var(--text3)'};">${tmpl.icon}</div>
              <div>
                <span style="font-weight:600;">${tmpl.name}</span>
                ${tmpl.description ? '<br><span style="font-size:8px;opacity:0.6;line-height:1.2;display:block;margin-top:2px;">'+tmpl.description+'</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>`;

  // ── ADD TEXT ELEMENTS ──
  html += `
    <div style="margin-bottom:6px;">
      <div style="font-size:10px;font-weight:700;color:var(--text3);padding:4px 0 6px;">${t('cover.addElements')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
        ${[['title',t('cover.titleElement')],['subtitle',t('cover.subtitleElement')],['author',t('cover.authorElement')],['publisher',t('cover.publisherElement')],['tagline',t('cover.taglineElement')],['custom',t('cover.customElement')]].map(([role,label]) =>
          `<button onclick="App.addCoverTextElement('${role}')" style="padding:4px;border-radius:4px;border:1px dashed var(--border);background:transparent;color:var(--text2);font-size:10px;cursor:pointer;text-align:center;transition:all 0.12s;" onmouseenter="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--text2)'">+ ${label}</button>`
        ).join('')}
      </div>
    </div>`;

  // ── METADADOS ──
  const metaCollapsed = collapsed.coverMeta;
  html += `
    <div style="margin-bottom:6px;">
      <div onclick="App.toggleSidebarSection('coverMeta')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;">${Icons.fileText} ${t('cover.metadata')}</span>
        <span style="font-size:10px;color:var(--text3);">${metaCollapsed ? '+' : '-'}</span>
      </div>
      ${!metaCollapsed ? `
        <div style="display:flex;flex-direction:column;gap:5px;">
          ${[['title',t('cover.metaTitle')],['subtitle',t('cover.metaSubtitle')],['author',t('cover.metaAuthor')],['penciller',t('cover.metaArtist')],['colorist',t('cover.metaColorist')],['publisher',t('cover.metaPublisher')]].map(([f,l]) =>
            `<div style="display:flex;align-items:center;gap:4px;">
              <span style="font-size:10px;color:var(--text3);width:60px;flex-shrink:0;">${l}</span>
              <input type="text" value="${(cover[f]||'').replace(/"/g,'&quot;')}" onchange="App.updateCoverMeta('${f}',this.value)" placeholder="${l}..." style="flex:1;padding:4px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:10px;outline:none;">
            </div>`
          ).join('')}
          <div style="display:flex;gap:4px;">
            <div style="flex:1;display:flex;align-items:center;gap:4px;">
              <span style="font-size:10px;color:var(--text3);width:44px;">Vol.</span>
              <input type="number" value="${cover.volume||1}" min="1" onchange="App.updateCoverMeta('volume',parseInt(this.value))" style="flex:1;padding:4px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:10px;outline:none;">
            </div>
            <div style="flex:1;display:flex;align-items:center;gap:4px;">
              <span style="font-size:10px;color:var(--text3);width:30px;">${t('cover.metaYear')}</span>
              <input type="number" value="${cover.year||new Date().getFullYear()}" min="1900" onchange="App.updateCoverMeta('year',parseInt(this.value))" style="flex:1;padding:4px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:10px;outline:none;">
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <div style="flex:1;display:flex;align-items:center;gap:4px;">
              <span style="font-size:10px;color:var(--text3);width:44px;">${t('cover.metaGenre')}</span>
              <input type="text" list="genre-suggestions" value="${(cover.genre||'').replace(/"/g,'&quot;')}" onchange="App.updateCoverMeta('genre',this.value)" placeholder="Ex: Aventura..." style="flex:1;padding:4px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:10px;outline:none;">
              <datalist id="genre-suggestions">
                ${['Aventura','Ação','Drama','Comédia','Terror','Ficção Científica','Romance','Fantasia','Mistério','Slice of Life','Horror','Policial','Sobrenatural','Escolar','Esporte','Histórico','Psicológico'].map(g => '<option value="'+g+'">').join('')}
              </datalist>
            </div>
            <div style="flex:1;display:flex;align-items:center;gap:4px;">
              <span style="font-size:10px;color:var(--text3);width:38px;">Class.</span>
              <input type="text" list="rating-suggestions" value="${(cover.rating||'').replace(/"/g,'&quot;')}" onchange="App.updateCoverMeta('rating',this.value)" placeholder="Ex: Livre" style="flex:1;padding:4px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:10px;outline:none;">
              <datalist id="rating-suggestions">
                ${['Livre','+10','+12','+14','+16','+18'].map(r => '<option value="'+r+'">').join('')}
              </datalist>
            </div>
          </div>
          <div>
            <span style="font-size:10px;color:var(--text3);display:block;margin-bottom:3px;">${t('cover.metaSynopsis')}</span>
            <textarea oninput="App.updateCoverMeta('synopsis',this.value)" placeholder="${t('cover.metaSynopsisPlaceholder')}" style="width:100%;min-height:60px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text);padding:6px;font-size:10px;resize:vertical;outline:none;">${cover.synopsis||''}</textarea>
          </div>
        </div>
      ` : ''}
    </div>`;

  // ── DESIGN ──
  const designCollapsed = collapsed.coverDesign;
  html += `
    <div style="margin-bottom:6px;">
      <div onclick="App.toggleSidebarSection('coverDesign')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;">${Icons.palette} DESIGN</span>
        <span style="font-size:10px;color:var(--text3);">${designCollapsed ? '+' : '-'}</span>
      </div>
      ${!designCollapsed ? `
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">${t('cover.bgColor')}</span>
            <input type="color" value="${cover.backgroundColor||'#ffffff'}" onchange="App.setCoverBgColor(this.value)" style="width:28px;height:22px;border:1px solid var(--border);border-radius:3px;cursor:pointer;padding:0;">
          </div>
          <div style="display:flex;gap:4px;">
            <button onclick="App.triggerCoverImageUpload()" style="flex:1;padding:5px;border-radius:4px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);font-size:10px;cursor:pointer;">${Icons.imageIcon} ${cover.backgroundImage ? t('cover.changeImage') : t('cover.bgImage')}</button>
            ${cover.backgroundImage ? `<button onclick="App.setCoverBackground(null)" style="padding:5px 8px;border-radius:4px;border:1px solid #c00;background:rgba(200,0,0,0.15);color:#e06060;font-size:10px;cursor:pointer;">✕</button>` : ''}
          </div>
          <div style="display:flex;gap:4px;">
            <button onclick="App.toggleCoverGuide('showBleedGuides')" style="flex:1;padding:4px;border-radius:3px;border:1px solid ${cover.showBleedGuides?'rgba(220,0,0,0.5)':'var(--border)'};background:${cover.showBleedGuides?'rgba(220,0,0,0.1)':'var(--surface)'};color:${cover.showBleedGuides?'rgba(220,100,100,1)':'var(--text3)'};font-size:10px;cursor:pointer;">Bleed</button>
            <button onclick="App.toggleCoverGuide('showSafeAreaGuides')" style="flex:1;padding:4px;border-radius:3px;border:1px solid ${cover.showSafeAreaGuides?'rgba(0,140,255,0.5)':'var(--border)'};background:${cover.showSafeAreaGuides?'rgba(0,140,255,0.1)':'var(--surface)'};color:${cover.showSafeAreaGuides?'rgba(80,160,255,1)':'var(--text3)'};font-size:10px;cursor:pointer;">Safe Area</button>
          </div>
        </div>
      ` : ''}
    </div>`;

  // ── EXPORTAR ──
  html += `
    <div style="margin-bottom:6px;">
      <div style="font-size:10px;font-weight:700;color:var(--text3);padding:4px 0 6px;">${Icons.export} ${t('cover.exportSection')}</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <button onclick="App.exportCoverPng()" style="padding:8px;border-radius:6px;border:1px solid var(--accent);background:var(--accent-glow);color:var(--accent);font-size:11px;cursor:pointer;font-weight:600;text-align:center;">${Icons.camera} ${t('cover.exportPng')}</button>
        <button onclick="App.openExportPage()" style="padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);font-size:11px;cursor:pointer;text-align:center;">${Icons.export} ${t('cover.exportFull')}</button>
      </div>
    </div>`;

  html += `</div>`;
  el.innerHTML = html;
}

/* ═══════════════════════════════════════
   BACK COVER RIGHT PANEL
   ═══════════════════════════════════════ */
function renderBackCoverRightPanel() {
  const el = document.getElementById('right-panel-content');
  if (!el) return;
  const p = Store.get('currentProject');
  if (!p || !p.backCover) { el.innerHTML = ''; return; }
  const bc = p.backCover;
  const selectedEl = Store.get('selectedElement');
  const selectedBcEl = selectedEl && selectedEl.type === 'cover-text'
    ? (bc.elements || []).find(e => e.id === selectedEl.id)
    : null;
  const collapsed = Store.get('sidebarCollapsed') || {};

  let html = `<div style="padding:6px;font-size:11px;">
    <div style="display:flex;align-items:center;gap:8px;padding:6px 4px 10px;border-bottom:1px solid var(--border);margin-bottom:8px;">
      <span style="display:inline-flex;color:rgba(107,114,128,0.9);">${Icons.copy}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:rgba(107,114,128,0.9);">CONTRACAPA</div>
        <div style="font-size:9px;color:var(--text3);">Sinopse, créditos e ISBN</div>
      </div>
    </div>`;

  // ── SELECTED ELEMENT EDITOR ──
  if (selectedBcEl) {
    const el_id = selectedBcEl.id;
    const s = selectedBcEl.style || {};
    const _hex = c => { if (!c || c === 'transparent') return '#000000'; if (/^#[0-9a-f]{6}$/i.test(c)) return c; if (/^#[0-9a-f]{3}$/i.test(c)) return '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]; return '#000000'; };
    const roleLabels = { synopsis: 'Sinopse', title: 'Título', subtitle: 'Subtítulo', author: 'Autor', publisher: 'Editora', tagline: 'Citação', custom: 'Personalizado' };
    html += `
      <div style="background:var(--surface2);border-radius:6px;padding:8px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;">
          <span style="font-size:10px;font-weight:700;color:rgba(107,114,128,0.9);flex:1;">${Icons.feather} ${roleLabels[selectedBcEl.role] || 'Texto'}</span>
          <button onclick="App.deleteCoverElement('${el_id}')" style="padding:2px 6px;border-radius:3px;border:1px solid #c00;background:#400;color:#fff;font-size:10px;cursor:pointer;">✕</button>
        </div>
        <textarea oninput="App.updateCoverElement('${el_id}','text',this.value)"
          style="width:100%;min-height:${selectedBcEl.role==='synopsis'?'100':'56'}px;border:1px solid var(--border);border-radius:4px;background:var(--surface);color:var(--text);padding:6px;font-size:11px;resize:vertical;outline:none;margin-bottom:6px;"
        >${S(selectedBcEl.text || '')}</textarea>

        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:9px;color:var(--text3);width:40px;">Cor</span>
          <input type="color" value="${_hex(s.color)}" onchange="App.updateCoverElement('${el_id}','style.color',this.value)" style="width:28px;height:22px;border:1px solid var(--border);border-radius:3px;cursor:pointer;padding:0;">
          <span style="font-size:9px;color:var(--text3);margin-left:4px;">Tamanho</span>
          <span style="font-size:9px;color:var(--text2);">${s.fontSize || 14}px</span>
          <input type="range" min="8" max="72" value="${s.fontSize || 14}" oninput="this.previousElementSibling.textContent=this.value+'px';App.updateCoverElement('${el_id}','style.fontSize',parseInt(this.value))" style="flex:1;height:14px;">
        </div>

        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:9px;color:var(--text3);width:40px;">Estilo</span>
          <div style="display:flex;gap:2px;">
            <button onclick="App.updateCoverElement('${el_id}','style.fontWeight',${(s.fontWeight==='700'||s.fontWeight==='bold'||s.fontWeight==='900')?`'400'`:`'700'`})" style="padding:2px 8px;border-radius:3px;border:1px solid ${(s.fontWeight==='700'||s.fontWeight==='bold'||s.fontWeight==='900')?'var(--accent)':'var(--border)'};background:${(s.fontWeight==='700'||s.fontWeight==='bold'||s.fontWeight==='900')?'var(--accent-glow)':'var(--surface)'};color:${(s.fontWeight==='700'||s.fontWeight==='bold'||s.fontWeight==='900')?'var(--accent)':'var(--text3)'};font-size:10px;font-weight:700;cursor:pointer;">B</button>
            <button onclick="App.updateCoverElement('${el_id}','style.fontStyle',${s.fontStyle==='italic'?`'normal'`:`'italic'`})" style="padding:2px 8px;border-radius:3px;border:1px solid ${s.fontStyle==='italic'?'var(--accent)':'var(--border)'};background:${s.fontStyle==='italic'?'var(--accent-glow)':'var(--surface)'};color:${s.fontStyle==='italic'?'var(--accent)':'var(--text3)'};font-size:10px;font-style:italic;cursor:pointer;">I</button>
          </div>
          <span style="font-size:9px;color:var(--text3);margin-left:4px;">Alinhar</span>
          <div style="display:flex;gap:2px;">
            ${['left','center','right','justify'].map(a => `<button onclick="App.updateCoverElement('${el_id}','style.textAlign','${a}')" style="padding:2px 6px;border-radius:3px;border:1px solid ${s.textAlign===a?'var(--accent)':'var(--border)'};background:${s.textAlign===a?'var(--accent-glow)':'var(--surface)'};color:${s.textAlign===a?'var(--accent)':'var(--text3)'};font-size:10px;cursor:pointer;">${a==='left'?'⇤':a==='center'?'↔':a==='right'?'⇥':'≡'}</button>`).join('')}
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;">
          <span style="font-size:9px;color:var(--text3);width:40px;">Fonte</span>
          <select onchange="App.updateCoverElement('${el_id}','style.fontFamily',this.value)" style="flex:1;padding:3px;border-radius:3px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:10px;">
            <option value="'Inter', sans-serif" ${(s.fontFamily||'').includes('Inter')&&!(s.fontFamily||'').includes('Spline')?'selected':''}>Inter</option>
            <option value="'Instrument Sans', sans-serif" ${(s.fontFamily||'').includes('Instrument')?'selected':''}>Instrument Sans</option>
            <option value="'Playfair Display', Georgia, serif" ${(s.fontFamily||'').includes('Playfair')?'selected':''}>Playfair Display</option>
            <option value="'Lora', Georgia, serif" ${(s.fontFamily||'').includes('Lora')?'selected':''}>Lora</option>
            <option value="'Nunito', sans-serif" ${(s.fontFamily||'').includes('Nunito')?'selected':''}>Nunito</option>
            <option value="'Spline Sans', 'Inter', sans-serif" ${(s.fontFamily||'').includes('Spline')?'selected':''}>Spline Sans</option>
            <option value="'Bangers', 'Impact', sans-serif" ${(s.fontFamily||'').includes('Bangers')?'selected':''}>Bangers</option>
            <option value="'Bebas Neue', 'Oswald', sans-serif" ${(s.fontFamily||'').includes('Bebas')?'selected':''}>Bebas Neue</option>
          </select>
        </div>
      </div>`;
  }

  // ── TEMPLATES ──
  const tmplCollapsed = collapsed.bcTemplates;
  html += `
    <div style="margin-bottom:6px;">
      <div onclick="App.toggleSidebarSection('bcTemplates')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;">${Icons.layers} TEMPLATES CONTRACAPA</span>
        <span style="font-size:10px;color:var(--text3);">${tmplCollapsed ? '+' : '-'}</span>
      </div>
      ${!tmplCollapsed ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
          ${Object.entries(BACKCOVER_TEMPLATES).map(([id, tmpl]) => `
            <button onclick="App.applyBackCoverTemplate('${id}')" style="padding:8px 6px;border-radius:6px;border:1.5px solid ${bc.template===id?'rgba(107,114,128,0.8)':'var(--border)'};background:${bc.template===id?'rgba(107,114,128,0.1)':'var(--surface2)'};color:${bc.template===id?'rgba(107,114,128,0.9)':'var(--text2)'};cursor:pointer;text-align:left;font-size:10px;font-weight:${bc.template===id?'700':'400'};transition:all 0.15s;" onmouseenter="this.style.borderColor='rgba(107,114,128,0.6)'" onmouseleave="this.style.borderColor='${bc.template===id?'rgba(107,114,128,0.8)':'var(--border)'}'">
              <span style="font-size:16px;display:block;margin-bottom:2px;">${tmpl.icon}</span>
              <span style="font-weight:600;">${tmpl.name}</span>
              ${tmpl.description ? '<br><span style="font-size:8px;opacity:0.6;">'+tmpl.description+'</span>' : ''}
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>`;

  // ── ADD TEXT ELEMENTS ──
  html += `
    <div style="margin-bottom:6px;">
      <div style="font-size:10px;font-weight:700;color:var(--text3);padding:4px 0 6px;">${t('cover.addElements')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
        ${[['synopsis','Sinopse'],['tagline','Citação'],['custom','Texto Livre'],['publisher','Editora']].map(([role,label]) =>
          `<button onclick="App.addCoverTextElement('${role}')" style="padding:4px;border-radius:4px;border:1px dashed var(--border);background:transparent;color:var(--text2);font-size:10px;cursor:pointer;text-align:center;transition:all 0.12s;" onmouseenter="this.style.borderColor='rgba(107,114,128,0.6)';this.style.color='rgba(107,114,128,0.9)'" onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--text2)'">+ ${label}</button>`
        ).join('')}
      </div>
    </div>`;

  // ── DESIGN ──
  const designCollapsed = collapsed.bcDesign;
  html += `
    <div style="margin-bottom:6px;">
      <div onclick="App.toggleSidebarSection('bcDesign')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;">${Icons.palette} DESIGN</span>
        <span style="font-size:10px;color:var(--text3);">${designCollapsed ? '+' : '-'}</span>
      </div>
      ${!designCollapsed ? `
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">Fundo cor</span>
            <input type="color" value="${bc.backgroundColor||'#f5f5f5'}" onchange="App.setBackCoverBgColor(this.value)" style="width:28px;height:22px;border:1px solid var(--border);border-radius:3px;cursor:pointer;padding:0;">
          </div>
          <div style="display:flex;gap:4px;">
            <button onclick="App.toggleBackCoverGuide('showBleedGuides')" style="flex:1;padding:4px;border-radius:3px;border:1px solid ${bc.showBleedGuides?'rgba(220,0,0,0.5)':'var(--border)'};background:${bc.showBleedGuides?'rgba(220,0,0,0.1)':'var(--surface)'};color:${bc.showBleedGuides?'rgba(220,100,100,1)':'var(--text3)'};font-size:10px;cursor:pointer;">Bleed</button>
            <button onclick="App.toggleBackCoverGuide('showSafeAreaGuides')" style="flex:1;padding:4px;border-radius:3px;border:1px solid ${bc.showSafeAreaGuides?'rgba(0,140,255,0.5)':'var(--border)'};background:${bc.showSafeAreaGuides?'rgba(0,140,255,0.1)':'var(--surface)'};color:${bc.showSafeAreaGuides?'rgba(80,160,255,1)':'var(--text3)'};font-size:10px;cursor:pointer;">Safe Area</button>
          </div>
        </div>
      ` : ''}
    </div>`;

  // ── EXPORTAR ──
  html += `
    <div style="margin-bottom:6px;">
      <div style="font-size:10px;font-weight:700;color:var(--text3);padding:4px 0 6px;">${Icons.export} ${t('cover.exportSection')}</div>
      <button onclick="App.exportCoverPng()" style="width:100%;padding:8px;border-radius:6px;border:1px solid rgba(107,114,128,0.6);background:rgba(107,114,128,0.08);color:rgba(107,114,128,0.9);font-size:11px;cursor:pointer;font-weight:600;text-align:center;">${Icons.camera} ${t('backCover.title')} (PNG)</button>
    </div>`;

  html += `</div>`;
  el.innerHTML = html;
}

/* ═══════════════════════════════════════
   RIGHT PANEL: Compact, Collapsible Design
   ═══════════════════════════════════════ */
function renderRightPanel() {
  const el = document.getElementById('right-panel-content');
  if (!el) return;

  if ((typeof App !== 'undefined' && App.isMobile && App.isMobile()) && Store.get('mobileDrawerContent') === 'tools') {
    const step = Store.get('mobileWorkflowStep') || 'media';
    const title = getMobileDrawerContextTitle(step, 'tools');
    // Use focused text tools panel for text workflow, full left panel for media
    const content = step === 'text' ? renderMobileTextTools() : renderLeftPanel();
    el.innerHTML = renderMobileDrawerShell(title, content);
    return;
  }

  // Preserve sidebar text context panel if matéria zone is active
  const prevTextCtx = el.querySelector('#sidebar-text-context');
  const savedTextCtxHtml = (prevTextCtx && prevTextCtx.innerHTML) ? prevTextCtx.innerHTML : null;

  // Cover panel when cover is active
  if (Store.get('coverActive')) {
    renderCoverRightPanel();
    return;
  }

  // Back cover panel
  if (Store.get('backCoverActive')) {
    renderBackCoverRightPanel();
    return;
  }

  const page = Store.getActivePage();
  if (!page) { el.innerHTML = ''; return; }

  const proj = Store.get('currentProject');
  const imgCount = page.images ? page.images.length : 0;
  const selectedEl = Store.get('selectedElement');
  const selectedBalloon = selectedEl && selectedEl.type === 'balloon' ? page.texts[selectedEl.index] : null;
  
  const collapsed = Store.get('sidebarCollapsed') || {};
  const selectedSticker = selectedEl && selectedEl.type === 'sticker' && page.stickers ? page.stickers[selectedEl.index] : null;
  const isMobileDrawer = (typeof App !== 'undefined' && App.isMobile && App.isMobile());
  const mobileStep = Store.get('mobileWorkflowStep') || 'media';
  const mobileDrawerMode = Store.get('mobileDrawerContent') || 'properties';
  const shouldShowMobileContextLabel = isMobileDrawer && (mobileStep === 'text' || mobileStep === 'timing');

  let html = `<div style="padding:4px 6px;font-size:11px;">`;
  if (shouldShowMobileContextLabel) {
    html += `<div class="mobile-panel-context-label">${getMobileDrawerContextTitle(mobileStep, mobileDrawerMode)}</div>`;
  }

  // ── PAINEL ATIVO (Active Panel Card) ──
  const selectedSlot = Store.get('selectedSlot');
  const hasSelectedPanel = selectedSlot >= 0;
  const selectedImage = hasSelectedPanel && page.images && page.images[selectedSlot] ? page.images[selectedSlot] : null;
  
  // PAINEL ATIVO card removed — all controls available via mini-toolbar + context menu

  // ── STICKER PROPERTIES ──
  if (selectedSticker) {
    const stkIdx = selectedEl.index;
    const stkOpacity = selectedSticker.opacity != null ? selectedSticker.opacity : 1;
    const stkRotation = selectedSticker.rotation || 0;
    html += `
      <div style="background:var(--surface2);border-radius:6px;padding:8px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;">
          <span style="font-size:10px;font-weight:700;color:var(--accent);flex:1;">STICKER #${stkIdx + 1}</span>
          <button onclick="App._showStickerTooltip(${stkIdx})" title="Editar tooltip" style="padding:2px 6px;border-radius:4px;border:1px solid var(--accent);background:var(--accent-glow);color:var(--accent);font-size:10px;cursor:pointer;">✎</button>
          <button onclick="App.addStickerImage(Store.getActivePage().stickers[${stkIdx}].src)" title="Duplicar" style="padding:2px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:#fff;font-size:10px;cursor:pointer;">⧉</button>
          <button onclick="App.deleteSticker(${stkIdx})" title="Remover" style="padding:2px 6px;border-radius:4px;border:1px solid #c00;background:#400;color:#fff;font-size:10px;cursor:pointer;">✕</button>
        </div>
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:10px;color:var(--text3);width:36px;">Opac.</span>
          <span style="font-size:10px;color:var(--text3);width:28px;">${Math.round(stkOpacity*100)}%</span>
          <input type="range" min="0.1" max="1" step="0.05" value="${stkOpacity}" oninput="App._stickerTooltipChange(${stkIdx},'opacity',parseFloat(this.value));App.renderRightPanelDebounced()" style="flex:1;height:14px;">
        </div>
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:10px;color:var(--text3);width:36px;">Rotação</span>
          <span style="font-size:10px;color:var(--text3);width:28px;">${stkRotation}°</span>
          <input type="range" min="-180" max="180" value="${stkRotation}" oninput="App._stickerTooltipChange(${stkIdx},'rotation',parseInt(this.value));App.renderRightPanelDebounced()" style="flex:1;height:14px;">
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="font-size:10px;color:var(--text3);width:36px;">Tam.</span>
          <input type="number" value="${Math.round(selectedSticker.w)}" min="20" oninput="App._stickerTooltipChange(${stkIdx},'w',parseInt(this.value));App._stickerTooltipChange(${stkIdx},'h',parseInt(this.value))" style="width:60px;padding:4px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:#fff;font-size:10px;">
          <span style="font-size:10px;color:var(--text3);">px</span>
        </div>
      </div>`;
  }

  // ── BALLOON PROPERTIES (redesigned sidebar) ──
  const _hex7 = c => { if (!c || c === 'transparent') return '#ffffff'; if (/^#[0-9a-f]{6}$/i.test(c)) return c; if (/^#[0-9a-f]{3}$/i.test(c)) return '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]; return '#ffffff'; };
  if (selectedBalloon) {
    const bType = selectedBalloon.type;
    const bgColor = _hex7(selectedBalloon.bgColor);
    const txtColor = selectedBalloon.textColor ? _hex7(selectedBalloon.textColor) : (bType === 'sfx' ? '#ff3333' : '#1a1a1a');
    const dir = selectedBalloon.direction || 's';
    const idx = selectedEl.index;
    const opacity = selectedBalloon.opacity != null ? selectedBalloon.opacity : 1;
    const isLocked = selectedBalloon.locked || false;
    const totalBalloons = page.texts ? page.texts.length : 0;
    const currentFont = selectedBalloon.font || 'comic';
    const fontFamily = FontUtils.family(currentFont);
    const bgPresets = window.BALLOON_BG_PRESETS || [];
    const txtPresets = window.BALLOON_TEXT_PRESETS || [];
    const _pd = 'onmousedown="event.preventDefault()"';
    const _selBtn = (active) => `border:1px solid ${active?'var(--accent)':'var(--border)'};background:${active?'var(--accent-glow)':'var(--surface)'};color:${active?'var(--accent)':'var(--text3)'}`;
    const szCfg = (window.BALLOON_SIZE_CONFIG || {})[bType] || { default: 14, min: 8, max: 72 };
    const _isDark = (c) => { const n = parseInt(c.replace('#',''),16); return ((n>>16)&255)*0.299+((n>>8)&255)*0.587+(n&255)*0.114 < 128; };

    const fontOpts = bType === 'sfx'
      ? [['bangers','Bangers'],['boogaloo','Boogaloo'],['lilita','Lilita One'],['fredoka','Fredoka One'],['righteous','Righteous']]
      : [['comic','Comic'],['marker','Marker'],['serif','Serif'],['sans','Sans']];

    const _tailSvg = {
      nw: `<svg viewBox="0 0 10 10"><path d="M9 9L1 1M1 1L4 1M1 1L1 4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
      n:  `<svg viewBox="0 0 10 10"><path d="M5 9L5 1M2 4L5 1L8 4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      ne: `<svg viewBox="0 0 10 10"><path d="M1 9L9 1M9 1L6 1M9 1L9 4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
      w:  `<svg viewBox="0 0 10 10"><path d="M9 5L1 5M4 2L1 5L4 8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      center: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="2" fill="currentColor" opacity="0.4"/></svg>`,
      e:  `<svg viewBox="0 0 10 10"><path d="M1 5L9 5M6 2L9 5L6 8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      sw: `<svg viewBox="0 0 10 10"><path d="M9 1L1 9M1 9L4 9M1 9L1 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
      s:  `<svg viewBox="0 0 10 10"><path d="M5 1L5 9M2 6L5 9L8 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      se: `<svg viewBox="0 0 10 10"><path d="M1 1L9 9M9 9L6 9M9 9L9 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
    };

    html += `
      <div id="mobile-anchor-selected-text" style="background:var(--surface2);border-radius:3px;padding:6px;margin-bottom:4px;">
        <!-- HEADER compact -->
        <div style="display:flex;align-items:center;gap:3px;margin-bottom:4px;">
          <span style="font-size:9px;font-weight:700;color:var(--accent);flex:1;">BALÃO #${idx + 1}</span>
          <button onclick="App.editBalloon(${idx})" title="Editar" style="width:18px;height:18px;border-radius:2px;border:1px solid var(--accent);background:transparent;color:var(--accent);font-size:9px;cursor:pointer;padding:0;">✎</button>
          <button onclick="App.toggleBalloonLock(${idx})" title="${isLocked?'Destravar':'Travar'}" style="width:18px;height:18px;border-radius:2px;border:1px solid ${isLocked?'#f59e0b':'var(--border)'};background:transparent;color:${isLocked?'#f59e0b':'var(--text3)'};font-size:9px;cursor:pointer;padding:0;">${isLocked?Icons.lock:Icons.unlock}</button>
          <button onclick="App.duplicateBalloon(${idx})" title="Duplicar" style="width:18px;height:18px;border-radius:2px;border:1px solid var(--border);background:transparent;color:var(--text3);font-size:9px;cursor:pointer;padding:0;">⧉</button>
          <button onclick="App.deleteBalloon(${idx})" title="Remover" style="width:18px;height:18px;border-radius:2px;border:1px solid #c00;background:transparent;color:#f66;font-size:9px;cursor:pointer;padding:0;">✕</button>
        </div>

        <!-- TYPE + FONT row -->
        <div class="bcr-row">
          <select onchange="App.changeBalloonType(${idx},this.value)" style="flex:1;padding:2px 4px;border-radius:2px;border:1px solid var(--border);background:var(--surface);color:#fff;font-size:9px;">
            <option value="speech" ${bType==='speech'?'selected':''}>Fala</option>
            <option value="thought" ${bType==='thought'?'selected':''}>Pensamento</option>
            <option value="shout" ${bType==='shout'?'selected':''}>Grito</option>
            <option value="caption" ${bType==='caption'?'selected':''}>Legenda</option>
            <option value="narration" ${bType==='narration'?'selected':''}>Narração</option>
            <option value="sfx" ${bType==='sfx'?'selected':''}>SFX</option>
          </select>
          <select onchange="App.changeBalloonFont(${idx},this.value)" style="flex:1;padding:2px 4px;border-radius:2px;border:1px solid var(--border);background:var(--surface);color:#fff;font-size:9px;">
            ${fontOpts.map(([id,label]) => `<option value="${id}" ${currentFont===id?'selected':''}>${label}</option>`).join('')}
          </select>
        </div>

        <!-- FONT PREVIEW -->
        <div class="bcr-font-preview" id="font-preview-${idx}" style="font-family:${fontFamily};color:${txtColor}">${MultiLang.get(selectedBalloon.text, proj.activeLanguage || 'pt-BR') || 'Abc 123'}</div>

        <!-- SIZE row -->
        <div class="bcr-row">
          <span class="bcr-label">TAMANHO</span>
          <span style="font-size:9px;color:var(--text3);width:24px;">${selectedBalloon.fontSize||szCfg.default}px</span>
          <input type="range" min="${szCfg.min}" max="${szCfg.max}" value="${selectedBalloon.fontSize||szCfg.default}" oninput="App.changeBalloonFontSize(${idx},this.value)" ${_pd} style="flex:1;height:12px;">
        </div>

        <!-- OPACITY row -->
        <div class="bcr-row">
          <span class="bcr-label">OPACID.</span>
          <span style="font-size:9px;color:var(--text3);width:24px;">${Math.round(opacity*100)}%</span>
          <input type="range" min="0.1" max="1" step="0.05" value="${opacity}" oninput="App.changeBalloonOpacity(${idx},this.value)" ${_pd} style="flex:1;height:12px;">
        </div>

        <!-- LINE-HEIGHT row -->
        <div class="bcr-row">
          <span class="bcr-label">LINHA</span>
          <span style="font-size:9px;color:var(--text3);width:24px;">${(selectedBalloon.lineHeight || 1.35).toFixed(1)}</span>
          <input type="range" min="0.8" max="2.5" step="0.05" value="${selectedBalloon.lineHeight || 1.35}" oninput="App.changeBalloonLineHeight(${idx},this.value)" ${_pd} style="flex:1;height:12px;">
        </div>

        <!-- LETTER-SPACING row -->
        <div class="bcr-row">
          <span class="bcr-label">LETRAS</span>
          <span style="font-size:9px;color:var(--text3);width:28px;">${(selectedBalloon.letterSpacing || 0).toFixed(1)}px</span>
          <input type="range" min="-2" max="8" step="0.1" value="${selectedBalloon.letterSpacing || 0}" oninput="App.changeBalloonLetterSpacing(${idx},this.value)" ${_pd} style="flex:1;height:12px;">
        </div>

        ${bType === 'narration' ? `
        <!-- NARRATION STYLE PRESETS - Visual creative options -->
        <div class="bcr-row" style="flex-wrap:wrap;gap:4px;">
          <span class="bcr-label" style="width:100%;margin-bottom:4px;">${Icons.style} ESTILO</span>
          <button onclick="App.applyNarrationPreset('classic')" ${_pd} title="Clássico HQ - amarelo com borda dupla" style="flex:1;min-width:45%;padding:6px 4px;border-radius:4px;border:2px solid #1a1a1a;background:linear-gradient(135deg,#fffde7,#fff9c4);color:#1a1a1a;font-size:8px;font-weight:600;cursor:pointer;box-shadow:inset 0 0 0 2px rgba(0,0,0,0.1);">Classico</button>
          <button onclick="App.applyNarrationPreset('cinema')" ${_pd} title="Cinema - preto com texto branco" style="flex:1;min-width:45%;padding:6px 4px;border-radius:4px;border:1px solid #333;background:linear-gradient(180deg,#1a1a1a,#0a0a0a);color:#fff;font-size:8px;font-weight:600;cursor:pointer;">Cinema</button>
          <button onclick="App.applyNarrationPreset('manga')" ${_pd} title="Mangá - branco clean" style="flex:1;min-width:45%;padding:6px 4px;border-radius:4px;border:1px solid #000;background:#fff;color:#000;font-size:8px;font-weight:600;cursor:pointer;">Manga</button>
          <button onclick="App.applyNarrationPreset('neon')" ${_pd} title="Neon - cyberpunk style" style="flex:1;min-width:45%;padding:6px 4px;border-radius:4px;border:1px solid #0ff;background:linear-gradient(135deg,#0a0a1a,#1a0a2a);color:#0ff;font-size:8px;font-weight:600;cursor:pointer;text-shadow:0 0 4px #0ff;">Neon</button>
          <button onclick="App.applyNarrationPreset('vintage')" ${_pd} title="Vintage - papel envelhecido" style="flex:1;min-width:45%;padding:6px 4px;border-radius:4px;border:1px solid #8b4513;background:linear-gradient(135deg,#f5deb3,#deb887);color:#4a3728;font-size:8px;font-weight:600;cursor:pointer;">Vintage</button>
          <button onclick="App.applyNarrationPreset('horror')" ${_pd} title="Horror - vermelho sangue" style="flex:1;min-width:45%;padding:6px 4px;border-radius:4px;border:1px solid #8b0000;background:linear-gradient(135deg,#1a0a0a,#2a0a0a);color:#ff3333;font-size:8px;font-weight:600;cursor:pointer;">Horror</button>
        </div>
        <!-- POSITION PRESETS - Simplified: Full Width toggle + 3 positions -->
        <div class="bcr-row" style="flex-wrap:wrap;gap:4px;margin-top:4px;">
          <span class="bcr-label" style="width:100%;margin-bottom:2px;display:flex;align-items:center;gap:4px;">${Icons.crosshair} POSICAO</span>
          <!-- Full Width Toggle -->
          <button onclick="App.toggleNarrationFullWidth()" ${_pd} title="Largura total do frame" style="width:100%;padding:6px 8px;border-radius:4px;border:1px solid ${selectedBalloon.fullWidth?'var(--accent)':'var(--border)'};background:${selectedBalloon.fullWidth?'var(--accent)':'var(--surface)'};color:${selectedBalloon.fullWidth?'#fff':'var(--text2)'};font-size:9px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">${Icons.expand} Largura Total ${selectedBalloon.fullWidth?'ON':'OFF'}</button>
          <!-- 3 Position buttons -->
          <button onclick="App.setNarrationPosition('top')" ${_pd} title="Fixar no topo" style="flex:1;padding:6px 4px;border-radius:4px;border:1px solid ${selectedBalloon.positionMode==='top'||selectedBalloon.positionMode==='top-full'||selectedBalloon.positionMode==='top-safe'?'var(--accent)':'var(--border)'};background:${selectedBalloon.positionMode==='top'||selectedBalloon.positionMode==='top-full'||selectedBalloon.positionMode==='top-safe'?'var(--accent)':'var(--surface)'};color:${selectedBalloon.positionMode==='top'||selectedBalloon.positionMode==='top-full'||selectedBalloon.positionMode==='top-safe'?'#fff':'var(--text2)'};font-size:9px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">${Icons.alignTop} Topo</button>
          <button onclick="App.setNarrationPosition('middle')" ${_pd} title="Centralizar" style="flex:1;padding:6px 4px;border-radius:4px;border:1px solid ${selectedBalloon.positionMode==='center'||selectedBalloon.positionMode==='middle'?'var(--accent)':'var(--border)'};background:${selectedBalloon.positionMode==='center'||selectedBalloon.positionMode==='middle'?'var(--accent)':'var(--surface)'};color:${selectedBalloon.positionMode==='center'||selectedBalloon.positionMode==='middle'?'#fff':'var(--text2)'};font-size:9px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">${Icons.alignMiddle} Meio</button>
          <button onclick="App.setNarrationPosition('bottom')" ${_pd} title="Fixar na base" style="flex:1;padding:6px 4px;border-radius:4px;border:1px solid ${selectedBalloon.positionMode==='bottom'||selectedBalloon.positionMode==='bottom-full'||selectedBalloon.positionMode==='bottom-safe'?'var(--accent)':'var(--border)'};background:${selectedBalloon.positionMode==='bottom'||selectedBalloon.positionMode==='bottom-full'||selectedBalloon.positionMode==='bottom-safe'?'var(--accent)':'var(--surface)'};color:${selectedBalloon.positionMode==='bottom'||selectedBalloon.positionMode==='bottom-full'||selectedBalloon.positionMode==='bottom-safe'?'#fff':'var(--text2)'};font-size:9px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">${Icons.alignBottom} Base</button>
        </div>` : ''}

        <!-- FUNDO row (6 fixed + 6 editable) -->
        <div class="bcr-row">
          <span class="bcr-label">FUNDO</span>
          <div class="bcr-swatch-grid">
            ${window.BALLOON_BG_FIXED.map(c => `<button class="bcr-swatch ${bgColor.toLowerCase()===c.toLowerCase()?'active':''}" style="--sw:${c};${_isDark(c)?'--sw-check:#fff;':''}" onclick="App.setBalloonBg('${c}')" ${_pd} title="Cor fixa"></button>`).join('')}
            ${ColorPresets.getBgCustom().map((c,i) => `<button class="bcr-swatch editable ${bgColor.toLowerCase()===c.toLowerCase()?'active':''}" style="--sw:${c};${_isDark(c)?'--sw-check:#fff;':''}" onclick="App.setBalloonBg('${c}')" ondblclick="App.editBgCustomColor(${i},this)" ${_pd} title="Dbl-click para editar"></button>`).join('')}
          </div>
        </div>

        <!-- TEXTO row (6 fixed + 6 editable) -->
        <div class="bcr-row">
          <span class="bcr-label">TEXTO</span>
          <div class="bcr-swatch-grid">
            ${window.BALLOON_TEXT_FIXED.map(c => `<button class="bcr-swatch ${txtColor.toLowerCase()===c.toLowerCase()?'active':''}" style="--sw:${c};${_isDark(c)?'--sw-check:#fff;':''}" onclick="App.setBalloonTextColor('${c}')" ${_pd} title="Cor fixa"></button>`).join('')}
            ${ColorPresets.getTextCustom().map((c,i) => `<button class="bcr-swatch editable ${txtColor.toLowerCase()===c.toLowerCase()?'active':''}" style="--sw:${c};${_isDark(c)?'--sw-check:#fff;':''}" onclick="App.setBalloonTextColor('${c}')" ondblclick="App.editTextCustomColor(${i},this)" ${_pd} title="Dbl-click para editar"></button>`).join('')}
          </div>
        </div>

        <!-- ESTILO + ALINHAR row -->
        <div class="bcr-format-row">
          <div class="bcr-format-col">
            <div class="bcr-label-sm">ESTILO</div>
            <div class="bcr-style-grid">
              <button class="bcr-style-btn ${selectedBalloon.bold?'active':''}" onclick="App.toggleBalloonBold()" ${_pd} title="Negrito"><b>B</b></button>
              <button class="bcr-style-btn ${selectedBalloon.italic?'active':''}" onclick="App.toggleBalloonItalic()" ${_pd} title="Itálico"><i>I</i></button>
              <button class="bcr-style-btn ${selectedBalloon.underline?'active':''}" onclick="App.toggleBalloonUnderline()" ${_pd} title="Sublinhado"><u>U</u></button>
            </div>
          </div>
          <div class="bcr-format-col">
            <div class="bcr-label-sm">ALINHAR</div>
            <div class="bcr-style-grid">
              <button class="bcr-style-btn ${(selectedBalloon.textAlign||'center')==='left'?'active':''}" onclick="App.setBalloonTextAlign('left')" ${_pd} title="Esquerda">←</button>
              <button class="bcr-style-btn ${(selectedBalloon.textAlign||'center')==='center'?'active':''}" onclick="App.setBalloonTextAlign('center')" ${_pd} title="Centro">↔</button>
              <button class="bcr-style-btn ${(selectedBalloon.textAlign||'center')==='right'?'active':''}" onclick="App.setBalloonTextAlign('right')" ${_pd} title="Direita">→</button>
            </div>
          </div>
        </div>

        ${(bType !== 'narration' && bType !== 'sfx' && bType !== 'shout') ? `
        <!-- CAUDA centered -->
        <div style="margin:4px 0;">
          <div class="bcr-label-sm" style="text-align:center;">CAUDA</div>
          <div class="bcr-tail-grid">
            ${['nw','n','ne','w','center','e','sw','s','se'].map(d =>
              `<button class="bcr-tail-btn ${dir===d?'active':''}" onclick="App.changeBalloonDirection(${idx},'${d}')" ${_pd}>${_tailSvg[d]}</button>`
            ).join('')}
          </div>
        </div>` : ''}

        ${bType === 'narration' ? `
        <!-- CANTOS row -->
        <div class="bcr-row">
          <span class="bcr-label">CANTOS</span>
          <span style="font-size:9px;color:var(--text3);width:24px;">${selectedBalloon.cornerRadius ?? 4}px</span>
          <input type="range" min="0" max="20" value="${selectedBalloon.cornerRadius ?? 4}" oninput="App.setBalloonCornerRadius(parseInt(this.value))" ${_pd} style="flex:1;height:12px;">
        </div>` : ''}

        ${bType === 'sfx' ? `
        <!-- ROTAÇÃO row -->
        <div class="bcr-row">
          <span class="bcr-label">ROTAÇÃO</span>
          <span style="font-size:9px;color:var(--text3);width:24px;">${selectedBalloon.rotation || -8}°</span>
          <input type="range" min="-45" max="45" value="${selectedBalloon.rotation || -8}" oninput="App.setSFXRotation(parseInt(this.value))" ${_pd} style="flex:1;height:12px;">
        </div>
        <!-- PRESET row -->
        <div class="bcr-row">
          <span class="bcr-label">PRESET</span>
          <select onchange="App.applySfxPreset(${idx},this.value)" style="flex:1;padding:2px 4px;border-radius:2px;border:1px solid var(--border);background:var(--surface);color:#fff;font-size:9px;">
            ${Object.values(window.SFX_PRESETS || {}).map(pr => `<option value="${pr.id}" ${(selectedBalloon.sfxPreset || 'boom')===pr.id?'selected':''}>${pr.name}</option>`).join('')}
          </select>
        </div>` : ''}

        <!-- PRESET + NAV row -->
        <div class="bcr-row" style="margin-top:4px;padding-top:4px;border-top:1px solid var(--border);">
          <button class="bcr-preset-btn" onclick="App.saveBalloonPreset(${idx})" ${_pd}>☆ Salvar Preset</button>
        </div>
        <div class="bcr-nav">
          <button class="bcr-nav-btn" onclick="App.selectPrevBalloon()" ${_pd} ${idx<=0?'disabled':''}><svg viewBox="0 0 10 10" width="10"><path d="M7 2L3 5L7 8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>
          <span class="bcr-nav-label">${idx+1}<span class="bcr-nav-total">/${totalBalloons}</span></span>
          <button class="bcr-nav-btn" onclick="App.selectNextBalloon()" ${_pd} ${idx>=totalBalloons-1?'disabled':''}><svg viewBox="0 0 10 10" width="10"><path d="M3 2L7 5L3 8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>
        </div>
      </div>`;

    // Presets section
    const presets = App._balloonPresets || [];
    if (presets.length > 0) {
      html += `<div style="background:var(--surface2);border-radius:6px;padding:6px;margin-bottom:6px;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);display:block;margin-bottom:4px;">PRESETS</span>
        <div style="display:flex;flex-wrap:wrap;gap:3px;">
          ${presets.map((pr, pi) => `
            <div style="display:flex;gap:2px;">
              <button onclick="App.applyBalloonPreset(${idx},${pi})" ${_pd} title="${pr.name}" style="padding:2px 6px;border-radius:3px;border:1px solid var(--border);background:var(--surface);color:#fff;font-size:9px;cursor:pointer;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${pr.bgColor};border:1px solid ${pr.textColor};margin-right:2px;"></span>${pr.name}
              </button>
              <button onclick="App.deleteBalloonPreset(${pi})" ${_pd} style="padding:2px 4px;border-radius:3px;border:1px solid #c00;background:transparent;color:#c00;font-size:8px;cursor:pointer;">✕</button>
            </div>
          `).join('')}
        </div>
      </div>`;
    }
  }

  // ── BIBLIOTECA (Global Project Library) — TOP OF SIDEBAR ──
  Library.ensure(proj);
  Library.computeUsage(proj);
  const libEntries = proj.library || [];
  const libCollapsed = collapsed.biblioteca;
  const pageIdx = Store.get('activePageIndex');
  const usageMap = Library.getUsageForPage(proj, pageIdx);
  
  html += `
    <div id="mobile-anchor-library" style="margin-bottom:6px;">
      <div onclick="App.toggleSidebarSection('biblioteca')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--accent);flex:1;">${Icons.folder} ${t('sidebar.library')} (${libEntries.length})</span>
        <span style="font-size:10px;color:var(--text3);">${libCollapsed ? '+' : '-'}</span>
      </div>
      ${!libCollapsed ? `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin-bottom:4px;">
          ${libEntries.slice(0,24).map((entry) => {
            const escapedSrc = entry.src.replace(/'/g, "\\'");
            const selectedSlotV = Store.get('selectedSlot');
            const insertHint = selectedSlotV >= 0 ? 'no quadro ' + (selectedSlotV + 1) : 'no próximo vazio';
            const usage = usageMap[entry.id] || 'unused';
            const usageDot = usage === 'current' ? '<div class="lib-usage-dot current" title="Usada nesta página"></div>'
              : usage === 'other' ? '<div class="lib-usage-dot other" title="Usada em outra página"></div>' : '';
            return '<div class="library-thumb" onclick="App.insertLibraryImage(\'' + escapedSrc + '\')" draggable="true" ondragstart="event.dataTransfer.setData(\'text/plain\',\'libimg:' + escapedSrc + '\');event.dataTransfer.effectAllowed=\'copy\';" title="Clique: inserir ' + insertHint + '&#10;Arraste: soltar em um quadro&#10;Fonte: ' + (entry.source || 'upload') + '" style="aspect-ratio:1;border-radius:4px;overflow:hidden;border:1px solid var(--border);cursor:grab;position:relative;transition:all 0.12s;" onmouseenter="this.style.transform=\'scale(1.08)\';this.style.borderColor=\'var(--accent)\';this.style.boxShadow=\'0 2px 8px rgba(107,114,128,0.3)\';App._libHoverTimer=setTimeout(()=>App.showLibraryPreview(this, \'' + escapedSrc + '\'), 300);" onmouseleave="this.style.transform=\'scale(1)\';this.style.borderColor=\'var(--border)\';this.style.boxShadow=\'none\';clearTimeout(App._libHoverTimer);App.hideLibraryPreview();"><img src="' + entry.src + '" style="width:100%;height:100%;object-fit:cover;pointer-events:none;">' + usageDot + '<div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%);opacity:0;transition:opacity 0.15s;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px;gap:3px;" class="lib-thumb-overlay"><span onclick="event.stopPropagation();App.insertLibraryImage(\'' + escapedSrc + '\')" style="color:#fff;font-size:9px;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,0.8);background:rgba(107,114,128,0.8);padding:1px 5px;border-radius:3px;cursor:pointer;">+ Usar</span><span onclick="event.stopPropagation();App.removeFromLibrary(\'' + entry.id + '\')" style="color:#fff;font-size:9px;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,0.8);background:rgba(200,0,0,0.7);padding:1px 5px;border-radius:3px;cursor:pointer;">✕</span></div></div>';
          }).join('')}
        </div>
        <style>.library-thumb:hover .lib-thumb-overlay{opacity:1!important;}</style>
        ${libEntries.length > 24 ? '<div style="font-size:9px;color:var(--text3);padding:2px 0 4px;">+' + (libEntries.length - 24) + ' mais imagens</div>' : ''}
        <div style="display:flex;gap:6px;margin-top:6px;">
          <button onclick="App.triggerImageUpload()" style="flex:1;padding:8px 10px;border-radius:4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.24);color:var(--text);cursor:pointer;font-size:11px;font-weight:700;letter-spacing:.2px;transition:all 0.15s;" onmouseenter="this.style.borderColor='var(--brand-teal)';this.style.background='rgba(20,184,166,0.14)';this.style.color='var(--brand-teal-light)';this.style.boxShadow='0 0 0 1px rgba(20,184,166,0.35)';" onmouseleave="this.style.borderColor='rgba(255,255,255,0.24)';this.style.background='rgba(255,255,255,0.04)';this.style.color='var(--text)';this.style.boxShadow='none';">+ Upload</button>
          <button onclick="App.promptImageUrl()" style="flex:1;padding:8px 10px;border-radius:4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.24);color:var(--text);cursor:pointer;font-size:11px;font-weight:700;letter-spacing:.2px;transition:all 0.15s;" onmouseenter="this.style.borderColor='var(--brand-teal)';this.style.background='rgba(20,184,166,0.14)';this.style.color='var(--brand-teal-light)';this.style.boxShadow='0 0 0 1px rgba(20,184,166,0.35)';" onmouseleave="this.style.borderColor='rgba(255,255,255,0.24)';this.style.background='rgba(255,255,255,0.04)';this.style.color='var(--text)';this.style.boxShadow='none';">+ URL</button>
        </div>
      ` : ''}
    </div>`;

  // ── SLIDES MODE (Universal - works on ANY page) ──
  const slides = page.slides || [];
  const hasSlides = slides.length > 0;
  const totalDuration = page.duration || 2.5;
  
  // Get active slide index from Store
  const _activeSlideIdx = Store.get('activeSlideIndex');
  const _hasActiveSlide = hasSlides && _activeSlideIdx !== null && _activeSlideIdx !== undefined && _activeSlideIdx < slides.length;
  const _activeSlideData = _hasActiveSlide ? slides[_activeSlideIdx] : null;

  if (hasSlides) {
    // ── SLIDE SELECTED: show controls for the selected slide ──
    if (_hasActiveSlide && _activeSlideData) {
      const si = _activeSlideIdx;
      const slide = _activeSlideData;
      html += `
        <div style="margin-bottom:6px;border:2px solid #14b8a6;border-radius:6px;padding:6px;background:rgba(20,184,166,0.08);">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:700;color:#14b8a6;flex:1;">SLIDE ${si + 1} / ${slides.length}</span>
            <button onclick="App.selectSlide(${Store.get('activePageIndex')},${Math.max(0,si-1)})" 
                    style="padding:2px 6px;border:1px solid var(--border);border-radius:3px;background:var(--surface);color:var(--text2);font-size:11px;cursor:pointer;" 
                    ${si === 0 ? 'disabled' : ''} title="Slide anterior">‹</button>
            <button onclick="App.selectSlide(${Store.get('activePageIndex')},${Math.min(slides.length-1,si+1)})" 
                    style="padding:2px 6px;border:1px solid var(--border);border-radius:3px;background:var(--surface);color:var(--text2);font-size:11px;cursor:pointer;" 
                    ${si === slides.length - 1 ? 'disabled' : ''} title="Próximo slide">›</button>
          </div>
          
          <!-- Thumbnail preview -->
          ${slide.image ? `<div style="width:100%;aspect-ratio:16/9;border-radius:4px;overflow:hidden;margin-bottom:8px;background:#000;"><img src="${slide.image}" style="width:100%;height:100%;object-fit:cover;"></div>` : ''}
          
          <!-- Duration -->
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">Duração</span>
            <input type="number" value="${slide.duration || 2}" min="0.5" max="60" step="0.5"
                   onchange="App.updateSlideDuration(${si}, parseFloat(this.value))"
                   style="width:56px;padding:3px 6px;border:1px solid var(--border);border-radius:3px;background:var(--surface);color:var(--text);font-size:12px;font-weight:600;text-align:center;">
            <span style="font-size:10px;color:var(--text3);">s</span>
          </div>
          
          <!-- Ken Burns -->
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">Ken Burns</span>
            <select onchange="App.updateSlideKenBurns(${si}, this.value)"
                    style="flex:1;padding:3px 4px;border:1px solid var(--border);border-radius:3px;background:var(--surface);color:var(--text);font-size:10px;">
              ${Object.entries(KEN_BURNS_PRESETS).map(([id, preset]) => 
                `<option value="${id}" ${(slide.kenBurns || 'zoom-in') === id ? 'selected' : ''}>${preset.name}</option>`
              ).join('')}
            </select>
          </div>
          
          <!-- Transition -->
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">Transição</span>
            <select onchange="App.updateSlideTransition(${si}, this.value)"
                    style="flex:1;padding:3px 4px;border:1px solid var(--border);border-radius:3px;background:var(--surface);color:var(--text);font-size:10px;">
              <option value="cut" ${(slide.transition || 'cut') === 'cut' ? 'selected' : ''}>Corte</option>
              <option value="crossfade" ${slide.transition === 'crossfade' ? 'selected' : ''}>Crossfade</option>
              <option value="fade-black" ${slide.transition === 'fade-black' ? 'selected' : ''}>Fade Black</option>
            </select>
          </div>
          
          <!-- Delete + Add -->
          <div style="display:flex;gap:4px;">
            <button onclick="App.addSlideFromLibrary()"
                    style="flex:1;padding:6px;border-radius:4px;border:1px dashed rgba(20,184,166,0.5);background:transparent;color:#14b8a6;font-size:10px;cursor:pointer;font-weight:600;">+ Foto</button>
            <button onclick="App.removeSlide(${si})"
                    style="padding:6px 10px;border-radius:4px;border:1px solid rgba(220,38,38,0.4);background:transparent;color:#f87171;font-size:10px;cursor:pointer;">🗑 Remover</button>
          </div>
        </div>
      `;
    } else {
      // ── SLIDES EXIST but none selected: show summary + hint ──
      const usedTime = slides.reduce((sum, s) => sum + (s.duration || 0), 0);
      const perSlide = slides.length > 0 ? (usedTime / slides.length).toFixed(1) : 0;
      html += `
        <div style="margin-bottom:6px;border:2px solid var(--accent);border-radius:6px;padding:8px;background:rgba(20,184,166,0.08);">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:700;color:var(--accent);flex:1;">📷 SEQUÊNCIA · ${slides.length} fotos</span>
          </div>

          <!-- Stats row -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:8px;">
            <div style="text-align:center;background:var(--surface);border-radius:4px;padding:4px;">
              <div style="font-size:14px;font-weight:700;color:var(--accent);">${slides.length}</div>
              <div style="font-size:9px;color:var(--text3);">fotos</div>
            </div>
            <div style="text-align:center;background:var(--surface);border-radius:4px;padding:4px;">
              <div style="font-size:14px;font-weight:700;color:#fff;">${usedTime.toFixed(0)}s</div>
              <div style="font-size:9px;color:var(--text3);">total</div>
            </div>
            <div style="text-align:center;background:var(--surface);border-radius:4px;padding:4px;">
              <div style="font-size:14px;font-weight:700;color:#fff;">${perSlide}s</div>
              <div style="font-size:9px;color:var(--text3);">por foto</div>
            </div>
          </div>

          <!-- Set total duration & redistribute -->
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding:6px;background:var(--surface);border-radius:4px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">Duração alvo</span>
            <input type="number" id="slide-total-dur-input" value="${usedTime.toFixed(0)}" min="1" max="3600" step="1"
                   style="width:56px;padding:3px 6px;border:1px solid var(--border);border-radius:3px;background:var(--surface2);color:var(--text);font-size:12px;font-weight:600;text-align:center;"
                   title="Digite o total em segundos e clique ÷">
            <span style="font-size:10px;color:var(--text3);">s</span>
            <button onclick="App.setTotalDurationAndRedistribute(document.getElementById('slide-total-dur-input').value)"
                    style="padding:4px 8px;border-radius:3px;border:1px solid var(--accent);background:var(--accent);color:#fff;font-size:11px;cursor:pointer;font-weight:700;"
                    title="Dividir igualmente pela duração alvo">÷</button>
          </div>

          <div style="display:flex;gap:4px;">
            <button onclick="App.addSlideFromLibrary()"
                    style="flex:1;padding:7px;border-radius:4px;border:1px dashed var(--accent);background:rgba(20,184,166,0.1);color:var(--accent);font-size:11px;cursor:pointer;font-weight:600;">+ Adicionar Foto</button>
            <button onclick="App.removeAllSlides()" title="Remover todos os slides"
                    style="padding:7px 10px;border-radius:4px;border:1px solid rgba(220,38,38,0.4);background:transparent;color:#f87171;font-size:11px;cursor:pointer;">🗑 Limpar</button>
          </div>
        </div>
      `;
    }
  } else {
    // ── NO SLIDES: show enable button ──
    html += `
      <div style="margin-bottom:6px;border:2px solid var(--accent);border-radius:6px;padding:8px;background:rgba(20,184,166,0.08);">
        <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:6px;display:flex;align-items:center;gap:6px;">${Icons.images} FOTOS EM SEQUÊNCIA</div>
        <div style="font-size:10px;color:var(--text2);line-height:1.5;margin-bottom:10px;">
          Várias fotos na mesma página, cada uma aparece por um tempo antes de trocar para a próxima.
        </div>
        <button onclick="App.enableSlidesMode()" style="width:100%;padding:10px;border-radius:6px;border:none;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;font-weight:600;">Converter para sequência</button>
      </div>
    `;
  }
  
  // ── SLIDES GRID (quando tem muitos slides) ──
  if (hasSlides && slides.length > 5) {
    const gridCollapsed = collapsed.slidesGrid !== false; // default expanded
    
    html += `
      <div style="margin-bottom:6px;border:1px solid var(--border);border-radius:4px;padding:6px;background:var(--surface);">
        <div onclick="App.toggleSidebarSection('slidesGrid')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
          <span style="font-size:11px;font-weight:700;color:var(--text);flex:1;display:flex;align-items:center;gap:6px;">
            ${Icons.images} TODAS AS FOTOS (${slides.length})
          </span>
          <span style="font-size:10px;color:var(--text3);">${gridCollapsed ? '+' : '-'}</span>
        </div>
        
        ${!gridCollapsed ? `
          <!-- Thumbnails Grid -->
          <div style="max-height:300px;overflow-y:auto;margin-top:8px;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
            ${slides.map((slide, idx) => {
              const isActive = idx === _activeSlideIdx;
              return `
                <div onclick="App.selectSlide(${Store.get('activePageIndex')}, ${idx})" 
                     style="position:relative;aspect-ratio:1;border-radius:4px;overflow:hidden;cursor:pointer;border:2px solid ${isActive ? 'var(--accent)' : 'transparent'};transition:all 0.2s;"
                     onmouseenter="this.style.transform='scale(1.05)'"
                     onmouseleave="this.style.transform='scale(1)'">
                  <img src="${slide.image}" style="width:100%;height:100%;object-fit:cover;" draggable="false">
                  <div style="position:absolute;top:2px;left:2px;background:rgba(0,0,0,0.75);color:#fff;font-size:9px;padding:2px 4px;border-radius:3px;font-weight:700;">${idx + 1}</div>
                  <div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.75);color:#fff;font-size:8px;padding:1px 3px;border-radius:2px;">${slide.duration}s</div>
                  ${isActive ? `<div style="position:absolute;inset:0;background:rgba(78,205,196,0.2);pointer-events:none;"></div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          
          <!-- Quick actions -->
          <div style="display:flex;gap:4px;margin-top:8px;">
            <button onclick="App.addSlideFromLibrary()" style="flex:1;padding:6px;border-radius:4px;border:1px dashed var(--accent);background:rgba(20,184,166,0.1);color:var(--accent);font-size:10px;cursor:pointer;font-weight:600;">+ Foto</button>
          </div>
        ` : ''}
      </div>
    `;
  }
    
  // ── SLIDESHOW AUDIO (only show if slides exist) ──
  if (hasSlides) {
    const audioCollapsed = collapsed.slideshowAudio;
    const audioData = page.slideshowAudio || { file: null, duration: 0, syncMode: 'auto', perSlideDuration: 4, volume: 0.8 };
    const hasAudio = audioData.file && audioData.duration > 0;
    const totalSlideDuration = slides.reduce((sum, s) => sum + (s.duration || 0), 0);
    const isPlaying = typeof SlideshowPreview !== 'undefined' && SlideshowPreview.playing;
      
    html += `
      <div style="margin-bottom:6px;border:1px solid #14b8a6;border-radius:4px;padding:6px;background:rgba(20,184,166,0.05);">
          <div onclick="App.toggleSidebarSection('slideshowAudio')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
            <span style="font-size:11px;font-weight:700;color:#14b8a6;flex:1;display:flex;align-items:center;gap:6px;">${Icons.music} AUDIO NARRATIVO</span>
            <span style="font-size:10px;color:#14b8a6;">${audioCollapsed ? '+' : '-'}</span>
          </div>
          ${!audioCollapsed ? `
            ${!hasAudio ? `
              <!-- No audio state -->
              <div style="padding:8px;background:#1a1a1a;border-radius:4px;margin-bottom:8px;">
                <div style="font-size:11px;color:#a0a0a0;margin-bottom:8px;">Status: Sem áudio</div>
                <div style="display:flex;gap:8px;">
                  <button onclick="App.uploadSlideshowAudio()" style="flex:1;padding:8px;border-radius:4px;border:1px solid #14b8a6;background:rgba(20,184,166,0.1);color:#14b8a6;font-size:11px;font-weight:600;cursor:pointer;">Upload MP3/WAV</button>
                </div>
              </div>
            ` : `
              <!-- Audio loaded state -->
              <div style="padding:8px;background:#1a1a1a;border-radius:4px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <div style="flex:1;">
                    <div style="font-size:12px;color:#fff;font-weight:500;">Audio: ${audioData.duration.toFixed(1)}s</div>
                    <div style="font-size:10px;color:#707070;">Slides: ${slides.length} (${totalSlideDuration.toFixed(1)}s total)</div>
                  </div>
                  <button onclick="App.removeSlideshowAudio()" title="Remover áudio" style="padding:4px 8px;border-radius:3px;border:1px solid #c00;background:transparent;color:#f66;font-size:10px;cursor:pointer;">Remover</button>
                </div>
                
                ${Math.abs(audioData.duration - totalSlideDuration) > 1 ? `
                  <div style="padding:8px;background:rgba(245,158,11,0.1);border:1px solid #f59e0b;border-radius:4px;margin-bottom:8px;">
                    <div style="font-size:11px;color:#f59e0b;margin-bottom:4px;font-weight:600;">⚠ Desync</div>
                    <div style="font-size:10px;color:#a0a0a0;margin-bottom:8px;">
                      ${audioData.duration > totalSlideDuration ? `Áudio é ${(audioData.duration - totalSlideDuration).toFixed(0)}s mais longo que slides` : `Slides são ${(totalSlideDuration - audioData.duration).toFixed(0)}s mais longos que áudio`}
                    </div>
                    <button onclick="App.checkSlideshowSync()" style="width:100%;padding:6px;border-radius:4px;border:none;background:#f59e0b;color:#000;font-size:11px;font-weight:600;cursor:pointer;">Ajustar Sync</button>
                  </div>
                ` : ''}
                
                <!-- Sync mode -->
                <div style="margin-bottom:8px;">
                  <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:4px;">Modo de Sync</div>
                  <div style="font-size:11px;color:#fff;">${audioData.syncMode === 'loop' ? 'Loop de slides' : audioData.syncMode === 'distribute' ? 'Distribuição igual' : audioData.syncMode === 'kenburns' ? 'Ken Burns' : 'Auto'}</div>
                </div>
              </div>
            `}
            
            ${hasAudio ? `
              <!-- Preview controls -->
              <div style="padding:8px;background:#1a1a1a;border-radius:4px;">
                <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:8px;">Pré-visualização</div>
                
                <!-- Scrubber -->
                <input type="range" 
                       id="slideshow-preview-scrubber" 
                       min="0" 
                       max="${audioData.duration}" 
                       value="${typeof SlideshowPreview !== 'undefined' ? SlideshowPreview.currentTime : 0}" 
                       step="0.1"
                       oninput="App.seekSlideshowPreview(this.value)"
                       style="width:100%;margin-bottom:8px;accent-color:#14b8a6;">
                
                <!-- Time display -->
                <div id="slideshow-preview-time" style="font-size:11px;color:#a0a0a0;text-align:center;margin-bottom:8px;">0:00 / ${Math.floor(audioData.duration / 60)}:${Math.floor(audioData.duration % 60).toString().padStart(2, '0')}</div>
                
                <!-- Play/Pause button -->
                <button onclick="App.toggleSlideshowPreview()" style="width:100%;padding:10px;border-radius:4px;border:none;background:#14b8a6;color:#fff;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
                  ${isPlaying ? '⏸ Pausar' : '▶ Reproduzir'}
                </button>
              </div>
            ` : ''}
          ` : ''}
        </div>
    `;
  }

  // ── PAGE SETTINGS ──
  const pageCollapsed = collapsed.pageSettings;
  const pageBgColor = page.bgColor || '#ffffff';
  const panelBorderW = page.panelBorderWidth != null ? page.panelBorderWidth : 2;
  const panelBorderC = page.panelBorderColor || '#000000';
  const gutterSize = page.gutterSize != null ? page.gutterSize : 10;
  const panelRadius = page.panelRadius != null ? page.panelRadius : 0;
  const showBleed = Store.get('showBleed') || false;
  const showReadingOrder = Store.get('showReadingOrder') || false;
  const _isVideoProject = !!proj?.videoFormat;

  html += `
    <div style="margin-bottom:6px;">
      <div onclick="App.toggleSidebarSection('pageSettings')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;display:flex;align-items:center;gap:6px;">${Icons.file} ${t('sidebar.page')}</span>
        <span style="font-size:10px;color:var(--text3);">${pageCollapsed ? '+' : '-'}</span>
      </div>
      ${!pageCollapsed ? `
        <div style="display:flex;flex-direction:column;gap:4px;">
          <!-- + Nova Página (prominent, near layout) -->
          <button onclick="App.addPage()" style="width:100%;padding:6px;border-radius:4px;border:1px dashed var(--accent);background:rgba(107,114,128,0.06);color:var(--accent);font-size:10px;cursor:pointer;font-weight:600;">${t('sidebar.newPageFull')}</button>
          
          ${_isVideoProject ? '' : `
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">Fundo</span>
            <input type="color" value="${pageBgColor}" onchange="App.setPageBgColor(this.value)" style="width:28px;height:20px;border:1px solid var(--border);border-radius:3px;cursor:pointer;padding:0;">
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">Borda (${panelBorderW}px)</span>
            <input type="range" min="0" max="8" value="${panelBorderW}" oninput="App.setPanelBorderWidth(this.value)" style="width:60px;height:14px;">
            <input type="color" value="${panelBorderC}" onchange="App.setPanelBorderColor(this.value)" style="width:22px;height:20px;border:1px solid var(--border);border-radius:3px;cursor:pointer;padding:0;">
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">Gutter (${gutterSize}px)</span>
            <input type="range" min="0" max="30" value="${gutterSize}" oninput="App.setGutterSize(this.value)" style="width:80px;height:14px;">
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:var(--text3);flex:1;">Cantos (${panelRadius}px)</span>
            <input type="range" min="0" max="30" value="${panelRadius}" oninput="App.setPanelRadius(this.value)" style="width:80px;height:14px;">
          </div>
          <div style="display:flex;gap:4px;">
            <button onclick="App.toggleBleedGuides()" style="flex:1;padding:3px;border-radius:3px;border:1px solid ${showBleed ? 'var(--accent)' : 'var(--border)'};background:${showBleed ? 'var(--accent-glow)' : 'var(--surface)'};color:${showBleed ? 'var(--accent)' : 'var(--text3)'};font-size:10px;cursor:pointer;">Bleed</button>
            <button onclick="App.toggleReadingOrder()" style="flex:1;padding:3px;border-radius:3px;border:1px solid ${showReadingOrder ? 'var(--accent)' : 'var(--border)'};background:${showReadingOrder ? 'var(--accent-glow)' : 'var(--surface)'};color:${showReadingOrder ? 'var(--accent)' : 'var(--text3)'};font-size:10px;cursor:pointer;">Ordem Leitura</button>
          </div>
          `}
          
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 0;">
            <input type="checkbox" ${proj?.settings?.autoPastePage ? 'checked' : ''} onchange="App.toggleAutoPastePage(this.checked)" style="accent-color:var(--accent);">
            <span style="font-size:9px;color:var(--text2);flex:1;">${t('sidebar.createImageOrPage')}</span>
          </label>

          <div style="display:flex;gap:4px;">
            <button onclick="App.savePageAsPng()" title="Salvar esta página como PNG" style="flex:1;padding:4px;border-radius:4px;border:1px solid var(--accent);background:var(--accent-glow);color:var(--accent);font-size:10px;cursor:pointer;font-weight:600;">${Icons.camera} ${t('sidebar.savePng')}</button>
            <button onclick="App.resetPanelOverrides()" title="Resetar layout" style="flex:1;padding:4px;border-radius:4px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);font-size:10px;cursor:pointer;font-weight:500;">↺ Resetar</button>
          </div>
        </div>
      ` : ''}
    </div>`;

  // ── EFEITOS VISUAIS (per-image, 6 effects with radio selection) ──
  const fxCollapsed = collapsed.visualEffects === undefined ? true : collapsed.visualEffects;
  const selSlot = Store.get('selectedSlot');
  const selImg = (selSlot >= 0 && page.images) ? page.images[selSlot] : null;
  const hasImage = selImg && selImg.src;
  const currentEffect = selImg?.effect?.name || 'none';
  const currentIntensity = selImg?.effect?.intensity ?? 0.6;
  const fxColorMode = selImg?.effect?.colorMode || false;
  const fxVintageMode = selImg?.effect?.vintageMode || 'sepia';
  const fxRiso1 = selImg?.effect?.riso1 || '#FF4D8D';
  const fxRiso2 = selImg?.effect?.riso2 || '#1a1a1a';
  const fxSepiaColor = selImg?.effect?.sepiaColor || '#C8A060';
  const fxVignetteColor = selImg?.effect?.vignetteColor || '#000000';
  const fxVignetteIntensity = selImg?.effect?.vignetteIntensity ?? currentIntensity;
  const fxVhsMode = selImg?.effect?.vhsMode || 'vhs';

  const buildModeControls = (effectId) => {
    let extra = '';
    if (effectId === 'halftone') {
      extra = `<div class="effect-mode-toggle">
        <button class="effect-mode-btn ${!fxColorMode ? 'active' : ''}" onclick="event.stopPropagation();App.setHalftoneMode(false)">P&B Clássico</button>
        <button class="effect-mode-btn ${fxColorMode ? 'active' : ''}" onclick="event.stopPropagation();App.setHalftoneMode(true)">Colorido</button>
      </div>`;
    } else if (effectId === 'vintage') {
      extra = `<div class="effect-mode-toggle">
        <button class="effect-mode-btn ${fxVintageMode === 'sepia' ? 'active' : ''}" onclick="event.stopPropagation();App.setVintageMode('sepia')">Vintage Sépia</button>
        <button class="effect-mode-btn ${fxVintageMode === 'risograph' ? 'active' : ''}" onclick="event.stopPropagation();App.setVintageMode('risograph')">Risograph</button>
      </div>`;
      if (fxVintageMode === 'sepia') {
        extra += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:9px;color:var(--text2)">Tom sépia</span>
          <input type="color" value="${fxSepiaColor}" onchange="App.setVintageColor('sepiaColor', this.value)" style="width:28px;height:20px;border:1px solid var(--border);border-radius:3px;padding:0;cursor:pointer;background:none;">
          <span style="font-size:9px;color:var(--text2)">Cor vinheta</span>
          <input type="color" value="${fxVignetteColor}" onchange="App.setVintageColor('vignetteColor', this.value)" style="width:28px;height:20px;border:1px solid var(--border);border-radius:3px;padding:0;cursor:pointer;background:none;">
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:10px;color:var(--text2)">Vinheta</span>
          <input type="range" min="0" max="100" value="${Math.round(fxVignetteIntensity * 100)}" onchange="App.setVintageVignetteIntensity(this.value/100)" style="flex:1">
          <span style="font-size:10px;font-weight:600;min-width:28px;text-align:right;color:var(--text1)">${Math.round(fxVignetteIntensity * 100)}%</span>
        </div>`;
      } else if (fxVintageMode === 'risograph') {
        extra += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:9px;color:var(--text2)">Cor clara</span>
          <input type="color" value="${fxRiso1}" onchange="App.setRisoColor(1, this.value)" style="width:28px;height:20px;border:1px solid var(--border);border-radius:3px;padding:0;cursor:pointer;background:none;">
          <span style="font-size:9px;color:var(--text2)">Cor escura</span>
          <input type="color" value="${fxRiso2}" onchange="App.setRisoColor(2, this.value)" style="width:28px;height:20px;border:1px solid var(--border);border-radius:3px;padding:0;cursor:pointer;background:none;">
        </div>`;
      }
    } else if (effectId === 'vhs') {
      extra = `<div class="effect-mode-toggle">
        <button class="effect-mode-btn ${fxVhsMode === 'vhs' ? 'active' : ''}" onclick="event.stopPropagation();App.setVHSMode('vhs')">VHS</button>
        <button class="effect-mode-btn ${fxVhsMode === 'crt' ? 'active' : ''}" onclick="event.stopPropagation();App.setVHSMode('crt')">CRT</button>
        <button class="effect-mode-btn ${fxVhsMode === 'cctv' ? 'active' : ''}" onclick="event.stopPropagation();App.setVHSMode('cctv')">CCTV</button>
      </div>`;
    }
    return extra;
  };

  // ── EFEITOS VISUAIS (per-image, effects with radio selection) ──
  html += `
    <div style="margin-bottom:4px;">
      <div onclick="App.toggleSidebarSection('visualEffects')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;display:flex;align-items:center;gap:6px;">${Icons.sparkles} ${t('sidebar.effects')}</span>
        <span style="font-size:10px;color:var(--text3);">${fxCollapsed ? '+' : '-'}</span>
      </div>
      ${!fxCollapsed ? `
        <div class="fx-section">
          ${!hasImage ? `<div style="padding:12px 8px;text-align:center;color:var(--text3);font-size:10px;">${t('sidebar.selectPanelWithImage')}</div>` : `
          ${EFFECT_DEFINITIONS.map(e => `
            <div class="effect-option ${currentEffect === e.id ? 'active' : ''}" onclick="App.selectEffect('${e.id}')">
              <div class="effect-radio ${currentEffect === e.id ? 'checked' : ''}"></div>
              <div class="effect-info">
                <span class="effect-label">${e.label}</span>
                ${e.desc ? `<span class="effect-desc">${e.desc}</span>` : ''}
              </div>
            </div>
            ${currentEffect === e.id && e.id !== 'none' ? `
              <div class="effect-controls">
                ${buildModeControls(e.id)}
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <span style="font-size:10px;color:var(--text2)">Intensidade</span>
                  <input type="range" min="0" max="100" value="${Math.round(currentIntensity * 100)}" onchange="App.setEffectIntensity(this.value/100)" style="flex:1">
                  <span style="font-size:10px;font-weight:600;min-width:28px;text-align:right;color:var(--text1)">${Math.round(currentIntensity * 100)}%</span>
                </div>
              </div>
            ` : ''}
          `).join('')}
          <div style="display:flex;gap:6px;margin-top:10px;">
            <button onclick="App.applyEffectToAll()" style="flex:1;padding:6px;border-radius:4px;border:1px solid var(--accent);background:rgba(107,114,128,0.1);color:var(--accent);font-size:10px;font-weight:600;cursor:pointer;">Aplicar a Todas</button>
            <button onclick="App.resetEffect()" style="flex:1;padding:6px;border-radius:4px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);font-size:10px;font-weight:600;cursor:pointer;">Resetar</button>
          </div>
          `}
        </div>
      ` : ''}
    </div>`;

  // ── NARRATIVA (moved from canvas to sidebar) ──
  const narrativeCollapsed = collapsed.narrative;
  const activeLangSidebar = proj?.activeLanguage || 'pt-BR';
  const narrativeTextSidebar = MultiLang.get(page.narrative, activeLangSidebar);
  const narrativeStyle = page.narrativeStyle || { align: 'justify', font: 'serif', size: 15 };
  const showNarrative = page.showTextBelow;
  const narrativeMode = proj?.narrativeMode || 'per-page';
  if (showNarrative) {
    html += `
    <div id="mobile-anchor-narrative" style="margin-bottom:4px;">
      <div onclick="App.toggleSidebarSection('narrative')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;display:flex;align-items:center;gap:6px;">${Icons.fileText} NARRATIVA</span>
        <span style="font-size:8px;padding:2px 4px;border-radius:3px;background:${activeLangSidebar === 'pt-BR' ? '#22c55e' : '#3b82f6'};color:#fff;font-weight:600;margin-right:4px;">${activeLangSidebar === 'pt-BR' ? 'PT' : 'EN'}</span>
        <span style="font-size:10px;color:var(--text3);">${narrativeCollapsed ? '+' : '-'}</span>
      </div>
      ${!narrativeCollapsed ? renderNarrativeControlsMarkup({ page, proj, panelMode: 'sidebar' }) : ''}
    </div>`;
  }

  // ── LAYERS (unified: images + balloons + stickers + narrative) ──
  const layersCollapsed = collapsed.layers === undefined ? true : collapsed.layers;
  const imageCount = page.images ? page.images.filter(img => img && img.src).length : 0;
  const balloonCount = page.texts ? page.texts.length : 0;
  const stickerCount = page.stickers ? page.stickers.length : 0;
  const hasNarrative = page.showTextBelow && page.narrative;
  const totalLayers = imageCount + balloonCount + stickerCount + (hasNarrative ? 1 : 0);
  const selectedSlotVal = Store.get('selectedSlot');
  
  html += `
    <div style="margin-bottom:4px;">
      <div onclick="App.toggleSidebarSection('layers')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;display:flex;align-items:center;gap:6px;">${Icons.layers} ${t('sidebar.layers')} (${totalLayers})</span>
        <span style="font-size:10px;color:var(--text3);">${layersCollapsed ? '+' : '-'}</span>
      </div>
      ${!layersCollapsed ? `
        <div style="display:flex;flex-direction:column;gap:2px;max-height:200px;overflow-y:auto;">
          <!-- Narrative layer (if active) -->
          ${hasNarrative ? `
            <div style="display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface2);cursor:default;font-size:9px;color:var(--text2);">
              <span style="display:inline-flex;">${Icons.fileText}</span>
              <div style="flex:1;min-width:0;">
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;">Narrativa</div>
                <div style="font-size:8px;color:var(--text3);">Texto embaixo</div>
              </div>
            </div>
          ` : ''}
          
          <!-- Stickers -->
          ${page.stickers ? page.stickers.map((stk, si) => {
            const isActive = selectedEl && selectedEl.type === 'sticker' && selectedEl.index === si;
            return `<div onclick="App.selectSticker(${si})" style="display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:4px;border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};background:${isActive ? 'var(--accent-glow)' : 'var(--surface2)'};cursor:pointer;font-size:9px;color:${isActive ? 'var(--accent)' : 'var(--text2)'};">
              <img src="${stk.src}" style="width:20px;height:20px;object-fit:contain;border-radius:2px;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:10px;font-weight:${isActive?'600':'400'};">Sticker #${si + 1}</div>
                <div style="font-size:8px;color:var(--text3);">${Math.round(stk.w)}×${Math.round(stk.h)}px</div>
              </div>
              <button onclick="event.stopPropagation();App.deleteSticker(${si})" title="Remover" style="width:18px;height:18px;border-radius:3px;border:1px solid #c00;background:transparent;color:#c00;font-size:8px;cursor:pointer;">✕</button>
            </div>`;
          }).reverse().join('') : ''}
          
          <!-- Balloons -->
          ${page.texts ? page.texts.map((b, bi) => {
            const isActive = selectedEl && selectedEl.type === 'balloon' && selectedEl.index === bi;
            const typeIcons = { speech: Icons.balloon, thought: Icons.thought, shout: Icons.shout, caption: Icons.fileText, narration: Icons.fileText, sfx: Icons.shout };
            const typeLabels = { speech:'Fala', thought:'Pensamento', shout:'Grito', caption:'Legenda', narration:'Narração', sfx:'SFX' };
            const isLocked = b.locked || false;
            return `<div onclick="App.selectBalloon(${bi})" style="display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:4px;border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};background:${isActive ? 'var(--accent-glow)' : 'var(--surface2)'};cursor:pointer;font-size:9px;color:${isActive ? 'var(--accent)' : 'var(--text2)'};${isLocked ? 'opacity:0.65;' : ''}">
              <span title="${typeLabels[b.type]||''}">${typeIcons[b.type] || Icons.balloon}</span>
              <div style="flex:1;min-width:0;">
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:${isActive?'600':'400'};${isLocked ? 'text-decoration:line-through;' : ''}">${(typeof MultiLang !== 'undefined' ? MultiLang.get(b.text, proj?.activeLanguage || 'pt-BR') : (typeof b.text === 'string' ? b.text : b.text?.['pt-BR'] || '')) || '(vazio)'}</div>
                <div style="font-size:8px;color:var(--text3);">${typeLabels[b.type]||'Fala'} • ${b.fontSize||14}px</div>
              </div>
              <button onclick="event.stopPropagation();App.toggleBalloonLock(${bi})" title="${isLocked ? 'Destravar' : 'Travar'}" style="width:18px;height:18px;border-radius:3px;border:1px solid ${isLocked ? 'var(--warning,#f59e0b)' : 'var(--border)'};background:${isLocked ? 'rgba(245,158,11,0.15)' : 'transparent'};color:${isLocked ? '#f59e0b' : 'var(--text3)'};font-size:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;">${isLocked ? Icons.lock : Icons.unlock}</button>
              <button onclick="event.stopPropagation();App.deleteBalloon(${bi})" title="Remover" style="width:18px;height:18px;border-radius:3px;border:1px solid #c00;background:transparent;color:#c00;font-size:8px;cursor:pointer;">✕</button>
            </div>`;
          }).reverse().join('') : ''}
          
          <!-- Images -->
          ${page.images ? page.images.map((img, ii) => {
            if (!img || !img.src) return '';
            const isActive = selectedSlotVal === ii;
            const fitMode = img.fit || 'cover';
            return `<div onclick="App.selectSlot(${ii})" style="display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:4px;border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};background:${isActive ? 'var(--accent-glow)' : 'var(--surface2)'};cursor:pointer;font-size:9px;color:${isActive ? 'var(--accent)' : 'var(--text2)'};">
              <img src="${img.src}" style="width:24px;height:24px;object-fit:cover;border-radius:3px;border:1px solid var(--border);">
              <div style="flex:1;min-width:0;">
                <div style="font-size:10px;font-weight:${isActive?'600':'400'};">Quadro ${ii + 1}</div>
                <div style="font-size:8px;color:var(--text3);">${fitMode === 'contain' ? 'Inteira' : 'Preencher'}</div>
              </div>
              <button onclick="event.stopPropagation();App.toggleImageFit(${ii})" title="${fitMode === 'cover' ? 'Mostrar imagem inteira' : 'Preencher quadro'}" style="width:22px;height:18px;border-radius:3px;border:1px solid ${fitMode === 'contain' ? 'var(--accent)' : 'var(--border)'};background:${fitMode === 'contain' ? 'var(--accent-glow)' : 'transparent'};color:${fitMode === 'contain' ? 'var(--accent)' : 'var(--text3)'};font-size:8px;cursor:pointer;">${fitMode === 'contain' ? '⊡' : '⊞'}</button>
              <button onclick="event.stopPropagation();App.removeImage(${ii})" title="Remover" style="width:18px;height:18px;border-radius:3px;border:1px solid #c00;background:transparent;color:#c00;font-size:8px;cursor:pointer;">✕</button>
            </div>`;
          }).join('') : ''}
        </div>
      ` : ''}
      ${!layersCollapsed && totalLayers === 0 ? '<div style="font-size:9px;color:var(--text3);padding:4px;">Nenhum elemento</div>' : ''}
    </div>`;

  // ── STICKERS (PNG upload based) ──
  const stickersCollapsed = collapsed.stickers === undefined ? true : collapsed.stickers;
  const stickerAssets = Store.get('stickerLibrary') || [];
  html += `
    <div style="margin-bottom:4px;">
      <div onclick="App.toggleSidebarSection('stickers')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;display:flex;align-items:center;gap:6px;">${Icons.image} STICKERS (${stickerAssets.length})</span>
        <span style="font-size:10px;color:var(--text3);">${stickersCollapsed ? '+' : '-'}</span>
      </div>
      ${!stickersCollapsed ? `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin-bottom:4px;">
          ${stickerAssets.map((src, si) => `<div onclick="App.addStickerImage('${src.replace(/'/g, "\\'")}')"
            title="Clique para adicionar à página" 
            style="aspect-ratio:1;border-radius:4px;overflow:hidden;border:1px solid var(--border);cursor:pointer;position:relative;background:var(--surface2);display:flex;align-items:center;justify-content:center;transition:transform 0.1s;"
            onmouseenter="this.style.transform='scale(1.08)';this.style.borderColor='var(--accent)'"
            onmouseleave="this.style.transform='scale(1)';this.style.borderColor='var(--border)'">
            <img src="${src}" style="max-width:90%;max-height:90%;object-fit:contain;pointer-events:none;">
            <button onclick="event.stopPropagation();App.removeStickerFromLibrary(${si})" title="Remover" style="position:absolute;top:1px;right:1px;width:14px;height:14px;border-radius:50%;border:none;background:rgba(200,0,0,0.7);color:#fff;font-size:8px;cursor:pointer;display:none;align-items:center;justify-content:center;line-height:1;"
              onmouseenter="this.style.display='flex'" onmouseleave="">✕</button>
          </div>`).join('')}
        </div>
        <button onclick="App.uploadSticker()" style="width:100%;padding:5px;border-radius:4px;background:transparent;border:1px dashed var(--border);color:var(--text2);cursor:pointer;font-size:10px;">+ Upload PNG Sticker</button>
      ` : ''}
    </div>`;

  // ── ÁUDIO (HQ Movie Audio System) ──
  const audioCollapsed = collapsed.audio === undefined ? true : collapsed.audio;
  const videoAudio = proj.videoAudio || { background: { file: null, volume: 0.6, loop: true }, pages: [] };
  const bgMusic = videoAudio.background;
  const pageNarration = AudioManager.getPageNarration(proj, page.id);
  const pageDuration = page.duration || 2.5;
  const isPlayingBg = AudioManager.isPlaying('background');
  const isPlayingNarration = AudioManager.isPlaying('narration-' + page.id);
  
  html += `
    <div style="margin-bottom:4px;">
      <div onclick="App.toggleSidebarSection('audio')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;">${Icons.music} ${t('sidebar.audio')}</span>
        <span style="font-size:10px;color:var(--text3);">${audioCollapsed ? '+' : '-'}</span>
      </div>
      ${!audioCollapsed ? `
        <div style="display:flex;flex-direction:column;gap:6px;">
          
          <!-- Música de Fundo -->
          <div style="background:var(--surface2);border-radius:6px;padding:8px;">
            <div style="font-size:9px;font-weight:700;color:var(--accent);margin-bottom:6px;">${Icons.music} ${t('sidebar.backgroundMusic')}</div>
            ${bgMusic.file ? `
              <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;">
                <button onclick="App.toggleBackgroundMusic()" title="${isPlayingBg ? 'Pausar' : 'Play'}" 
                  style="width:28px;height:28px;border-radius:50%;border:1px solid ${isPlayingBg ? 'var(--accent)' : 'var(--border)'};background:${isPlayingBg ? 'var(--accent)' : 'var(--surface)'};color:${isPlayingBg ? '#fff' : 'var(--text2)'};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;">
                  ${isPlayingBg ? '⏸' : '▶'}
                </button>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:10px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Música carregada</div>
                  <div style="font-size:9px;color:var(--text3);">Volume: ${Math.round(bgMusic.volume * 100)}%</div>
                </div>
                <button onclick="App.removeBackgroundMusic()" title="Remover" style="width:20px;height:20px;border-radius:3px;border:1px solid #c00;background:transparent;color:#c00;font-size:10px;cursor:pointer;">✕</button>
              </div>
              <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
                <span style="font-size:9px;color:var(--text3);width:50px;">Volume</span>
                <input type="range" min="0" max="100" value="${Math.round(bgMusic.volume * 100)}" 
                  oninput="App.setBackgroundVolume(this.value/100)" style="flex:1;height:14px;">
                <span style="font-size:9px;color:var(--text3);width:30px;">${Math.round(bgMusic.volume * 100)}%</span>
              </div>
              <div style="display:flex;align-items:center;gap:4px;">
                <label style="font-size:9px;color:var(--text3);display:flex;align-items:center;gap:4px;cursor:pointer;">
                  <input type="checkbox" ${bgMusic.loop ? 'checked' : ''} onchange="App.toggleBackgroundLoop(this.checked)"> Loop
                </label>
              </div>
            ` : `
              <button onclick="App.uploadBackgroundMusic()" style="width:100%;padding:8px;border-radius:4px;background:transparent;border:1px dashed var(--accent);color:var(--accent);cursor:pointer;font-size:10px;font-weight:600;">
                + Upload MP3/WAV
              </button>
            `}
          </div>
          
          <!-- Narração da Página (Multi-idioma) -->
          <div style="background:var(--surface2);border-radius:6px;padding:8px;">
            <div style="font-size:9px;font-weight:700;color:var(--warning);margin-bottom:8px;">${Icons.mic} ${t('sidebar.narrationPage')} ${Store.get('activePageIndex') + 1}</div>
            
            <!-- PT-BR Narração -->
            <div style="margin-bottom:6px;padding:6px;background:var(--surface);border-radius:4px;border-left:3px solid #22c55e;">
              <div style="font-size:9px;color:#22c55e;font-weight:600;margin-bottom:4px;">Português</div>
              ${page.narration && page.narration['pt-BR'] && page.narration['pt-BR'].file ? `
                <div style="display:flex;align-items:center;gap:4px;">
                  <button onclick="App.playNarrationLang('pt-BR')" title="Play PT-BR" style="width:24px;height:24px;border-radius:50%;border:1px solid #22c55e;background:transparent;color:#22c55e;cursor:pointer;font-size:10px;">▶</button>
                  <div style="flex:1;font-size:9px;color:var(--text2);">${page.narration['pt-BR'].duration ? page.narration['pt-BR'].duration.toFixed(1) + 's' : 'Loaded'}</div>
                  <button onclick="App.removeNarrationLang('pt-BR')" title="Remove" style="width:18px;height:18px;border-radius:3px;border:1px solid #c00;background:transparent;color:#c00;font-size:8px;cursor:pointer;">✕</button>
                </div>
              ` : `
                <div style="display:flex;gap:4px;">
                  <button onclick="App.uploadNarrationLang('pt-BR')" style="flex:1;padding:6px;border-radius:3px;background:transparent;border:1px dashed #22c55e;color:#22c55e;cursor:pointer;font-size:9px;">Upload</button>
                  ${typeof MediaRecorder !== 'undefined' ? '<button onclick="App.openRecordingModal(\\\'pt-BR\\\')" style="flex:1;padding:6px;border-radius:3px;background:rgba(34,197,94,0.15);border:1px solid #22c55e;color:#22c55e;cursor:pointer;font-size:9px;">Record</button>' : ''}
                </div>
              `}
            </div>
            
            <!-- EN Narração -->
            <div style="padding:6px;background:var(--surface);border-radius:4px;border-left:3px solid #3b82f6;">
              <div style="font-size:9px;color:#3b82f6;font-weight:600;margin-bottom:4px;">English</div>
              ${page.narration && page.narration['en'] && page.narration['en'].file ? `
                <div style="display:flex;align-items:center;gap:4px;">
                  <button onclick="App.playNarrationLang('en')" title="Play EN" style="width:24px;height:24px;border-radius:50%;border:1px solid #3b82f6;background:transparent;color:#3b82f6;cursor:pointer;font-size:10px;">▶</button>
                  <div style="flex:1;font-size:9px;color:var(--text2);">${page.narration['en'].duration ? page.narration['en'].duration.toFixed(1) + 's' : 'Loaded'}</div>
                  <button onclick="App.removeNarrationLang('en')" title="Remove" style="width:18px;height:18px;border-radius:3px;border:1px solid #c00;background:transparent;color:#c00;font-size:8px;cursor:pointer;">✕</button>
                </div>
              ` : `
                <div style="display:flex;gap:4px;">
                  <button onclick="App.uploadNarrationLang('en')" style="flex:1;padding:6px;border-radius:3px;background:transparent;border:1px dashed #3b82f6;color:#3b82f6;cursor:pointer;font-size:9px;">Upload</button>
                  ${typeof MediaRecorder !== 'undefined' ? '<button onclick="App.openRecordingModal(\\\'en\\\')" style="flex:1;padding:6px;border-radius:3px;background:rgba(59,130,246,0.15);border:1px solid #3b82f6;color:#3b82f6;cursor:pointer;font-size:9px;">Record</button>' : ''}
                </div>
              `}
            </div>
          </div>
          
          <!-- Criar Páginas por Áudio -->
          <div style="background:var(--surface2);border-radius:6px;padding:8px;">
            <div style="font-size:9px;font-weight:700;color:#f59e0b;margin-bottom:4px;">${Icons.scissors} ${t('sidebar.createPagesFromAudio')}</div>
            <div style="font-size:8px;color:var(--text3);margin-bottom:6px;line-height:1.3;">
              Áudio longo → divida → cada parte vira uma página.
            </div>
            <button onclick="App.openAudioSplitEditor()" style="width:100%;padding:6px;border-radius:4px;background:#4b5563;border:none;color:#fff;cursor:pointer;font-size:10px;font-weight:600;">
              ${Icons.scissors} ${t('sidebar.openCutEditor')}
            </button>
          </div>
          
        </div>
      ` : ''}
    </div>`;

  // ── DURAÇÃO (colapsável) ──
  const durationCollapsed = collapsed.duration === undefined ? false : collapsed.duration;
  html += `
    <div id="mobile-anchor-duration" style="margin-bottom:4px;">
      <div onclick="App.toggleSidebarSection('duration')" style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;display:flex;align-items:center;gap:6px;">${Icons.clock} DURAÇÃO</span>
        <span style="font-size:10px;color:var(--text3);">${durationCollapsed ? '+' : '-'}</span>
      </div>
      ${!durationCollapsed ? `
        <div style="display:flex;align-items:center;gap:6px;padding:8px;background:var(--surface2);border-radius:6px;">
          ${page.durationLocked ? `
            <span style="font-size:12px;font-weight:700;color:var(--accent);">${Icons.mic} ${pageDuration}s</span>
            <span style="font-size:9px;color:var(--text3);opacity:0.7;">bloqueada pelo áudio</span>
          ` : `
            <input type="number" value="${pageDuration}" min="0.5" max="15" step="0.5"
              onchange="App.setPageDuration(parseFloat(this.value))"
              style="width:60px;padding:6px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;text-align:center;">
            <span style="font-size:10px;color:var(--text3);">segundos (0.5-15)</span>
          `}
        </div>
      ` : ''}
    </div>`;

  // ── ANIMAÇÃO (Ken Burns) (colapsável) ──
  const animationCollapsed = collapsed.animation === undefined ? false : collapsed.animation;
  html += `
    <div style="margin-bottom:4px;">
      <div onclick="App.toggleSidebarSection('animation')" style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:#e879f9;flex:1;display:flex;align-items:center;gap:6px;">${Icons.zoomIn} ANIMAÇÃO (Ken Burns)</span>
        <span style="font-size:10px;color:var(--text3);">${animationCollapsed ? '+' : '-'}</span>
      </div>
      ${!animationCollapsed ? `
        <div style="background:var(--surface2);border-radius:6px;padding:8px;">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
            ${KenBurns.getAllPresets().map(p => {
              const isActive = (page.kenBurns || 'zoom-in') === p.id;
              return '<button onclick="App.setPageKenBurns(\'' + p.id + '\')" title="' + p.name + '" style="padding:6px 4px;border-radius:4px;border:1.5px solid ' + (isActive ? '#e879f9' : 'var(--border)') + ';background:' + (isActive ? 'rgba(232,121,249,0.15)' : 'var(--surface)') + ';color:' + (isActive ? '#e879f9' : 'var(--text3)') + ';cursor:pointer;font-size:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:58px;transition:all 0.12s;"><span style="font-size:16px;line-height:1;">' + p.icon + '</span><span style="font-size:8px;line-height:1.1;min-height:18px;text-align:center;font-weight:' + (isActive ? '700' : '500') + ';">' + p.name + '</span></button>';
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>`;

  // ── TRANSIÇÃO (colapsável) ──
  const transitionCollapsed = collapsed.transition === undefined ? false : collapsed.transition;
  html += `
    <div style="margin-bottom:4px;">
      <div onclick="App.toggleSidebarSection('transition')" style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;display:flex;align-items:center;gap:6px;">${Icons.transition} TRANSICAO</span>
        <span style="font-size:10px;color:var(--text3);">${transitionCollapsed ? '+' : '-'}</span>
      </div>
      ${!transitionCollapsed ? `
        <div style="display:flex;align-items:center;gap:6px;padding:8px;background:var(--surface2);border-radius:6px;">
          <select onchange="App.setPageTransition(this.value)" style="flex:1;padding:6px 8px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:11px;font-weight:500;">
            <option value="none" ${page.transition==='none'?'selected':''}>Nenhuma</option>
            <option value="cut" ${(page.transition||'cut')==='cut'?'selected':''}>Corte Seco</option>
            <option value="fade" ${page.transition==='fade'?'selected':''}>Fade (0.5s)</option>
          </select>
        </div>
      ` : ''}
    </div>`;

  // ── ATALHOS (Shortcuts) ──
  const shortcutsCollapsed = collapsed.shortcuts === undefined ? true : collapsed.shortcuts;
  html += `
    <div style="margin-bottom:4px;">
      <div onclick="App.toggleSidebarSection('shortcuts')" style="display:flex;align-items:center;padding:4px 0;cursor:pointer;user-select:none;">
        <span style="font-size:10px;font-weight:700;color:var(--text3);flex:1;">${Icons.keyboard} ATALHOS</span>
        <span style="font-size:10px;color:var(--text3);">${shortcutsCollapsed ? '+' : '-'}</span>
      </div>
      ${!shortcutsCollapsed ? `
        <div style="display:flex;flex-direction:column;gap:2px;font-size:9px;color:var(--text3);">
          <div style="display:flex;justify-content:space-between;padding:2px 4px;background:var(--surface2);border-radius:3px;">
            <span>Desfazer</span><span style="color:var(--text2);">Ctrl+Z</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;">
            <span>Refazer</span><span style="color:var(--text2);">Ctrl+Y</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;background:var(--surface2);border-radius:3px;">
            <span>Salvar</span><span style="color:var(--text2);">Ctrl+S</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;">
            <span>Colar imagem</span><span style="color:var(--text2);">Ctrl+V</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;background:var(--surface2);border-radius:3px;">
            <span>Novo balão</span><span style="color:var(--text2);">T</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;">
            <span>Desselecionar</span><span style="color:var(--text2);">Esc</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;background:var(--surface2);border-radius:3px;">
            <span>Excluir elemento</span><span style="color:var(--text2);">Del</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;">
            <span>Página anterior</span><span style="color:var(--text2);">←</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;background:var(--surface2);border-radius:3px;">
            <span>Próxima página</span><span style="color:var(--text2);">→</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;">
            <span>Zoom +</span><span style="color:var(--text2);">+</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;background:var(--surface2);border-radius:3px;">
            <span>Zoom -</span><span style="color:var(--text2);">-</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;">
            <span>Zoom ajustar</span><span style="color:var(--text2);">0</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 4px;background:var(--surface2);border-radius:3px;">
            <span>Fullscreen</span><span style="color:var(--text2);">F</span>
          </div>
        </div>
      ` : ''}
    </div>`;

  html += `</div>`;
  el.innerHTML = html;

  // Re-inject preserved sidebar text context panel
  if (savedTextCtxHtml) {
    let container = document.createElement('div');
    container.id = 'sidebar-text-context';
    container.innerHTML = savedTextCtxHtml;
    const scrollDiv = el.querySelector('div');
    if (scrollDiv) {
      scrollDiv.insertBefore(container, scrollDiv.firstChild);
    } else {
      el.insertBefore(container, el.firstChild);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   CONTEXTUAL TEXT PANELS (for sidebar)
   ═══════════════════════════════════════════════════════════════ */

function renderNarrativeControlsMarkup({ page, proj, panelMode = 'sidebar' } = {}) {
  const activePage = page || Store.getActivePage();
  const project = proj || Store.get('currentProject');
  if (!activePage || !project) return '';

  const style = { font: 'serif', size: 48, align: 'justify', color: '#ffffff', textColor: '#ffffff', bgColor: '#000000', bgOpacity: 0.55, leading: 1.4, bold: false, italic: false, strokeEnabled: false, strokeColor: '#000000', strokeWidth: 3, ...(activePage.narrativeStyle || {}) };
  const settings = { heightLocked: false, fontSizeLocked: false, overflow: 'shrink', minFontSize: 12, warnOnMin: false, ...(project.narrativeSettings || {}) };
  const fontList = Object.values(APP_FONTS || {}).filter(f => f && (f.category === 'text' || f.category === 'display'));
  const fontOpts = fontList.map(f => `<option value="${f.id}" ${style.font === f.id ? 'selected' : ''}>${f.name}</option>`).join('');
  const textColor = style.color || style.textColor || '#ffffff';
  const _btn = (active) => `width:28px;height:28px;border-radius:4px;border:1px solid ${active ? '#3182ce' : '#4a5568'};background:${active ? '#3182ce' : 'transparent'};color:${active ? '#fff' : '#a0aec0'};display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;`;

  // Get accordion states from Store
  const narrAccordion = Store.get('narrAccordion') || { basicText: true, advancedLayout: false, position: true, bilingual: false };
  const _expanded = (key) => narrAccordion[key] ? 'expanded' : 'collapsed';
  const _icon = (key) => narrAccordion[key] ? '▼' : '▶';

  // Position/Safe Zones data
  const _fmt = project.videoFormat || 'vertical';
  const _isVert = _fmt === 'vertical';
  const _textPos = style.position || (typeof SafeZones !== 'undefined' ? SafeZones.defaultPosition(_fmt) : 'top');
  const _unsafeBot = _isVert;
  const _posBtn = (pos, label, desc, isUnsafe) => {
    const isActive = _textPos === pos;
    const borderC = isActive ? (isUnsafe ? '#ef4444' : 'var(--accent, #14b8a6)') : '#4a5568';
    const bgC = isActive ? (isUnsafe ? 'rgba(239,68,68,0.15)' : 'rgba(107,114,128,0.15)') : 'transparent';
    const txtC = isActive ? (isUnsafe ? '#ef4444' : 'var(--accent, #14b8a6)') : '#a0aec0';
    return `<button onclick="App.setTextPosition('${pos}')" style="flex:1;padding:6px 4px;border-radius:4px;border:1px solid ${borderC};background:${bgC};color:${txtC};font-size:10px;cursor:pointer;font-weight:${isActive ? '700' : '400'};display:flex;flex-direction:column;align-items:center;gap:2px;" title="${desc}"><span>${label}</span>${isUnsafe && isActive ? '<span style="font-size:8px;color:#ef4444;font-weight:600;">UNSAFE</span>' : ''}</button>`;
  };
  const _topDesc = _isVert ? t('safeZones.topDescVertical') : t('safeZones.topDesc');
  const _midDesc = t('safeZones.middleDesc');
  const _botDesc = _isVert ? t('safeZones.bottomDescVertical') : t('safeZones.bottomDesc');
  const isDual = (project.narrativeDisplay || 'single') === 'dual';

  return `
    <div class="narr-accordion" style="padding:${panelMode === 'context' ? '8px' : '10px'};">

      <!-- SECTION 1: Basic Text (expanded by default) -->
      <div class="narr-section" data-narr-section="basicText">
        <div class="narr-section-header" onclick="event.stopPropagation();App.toggleNarrSection('basicText')" onmousedown="event.preventDefault()">
          <span class="narr-toggle-icon">${_icon('basicText')}</span>
          <span class="narr-section-title">${t('sidebar.basicText')}</span>
          <span class="narr-section-count">6</span>
        </div>
        <div class="narr-section-content ${_expanded('basicText')}">
          <div style="display:flex;gap:6px;align-items:end;margin-bottom:8px;">
            <label style="flex:1;display:flex;flex-direction:column;gap:3px;min-width:0;">
              <span style="font-size:10px;font-weight:600;color:#a0aec0;">Fonte</span>
              <select onchange="App.setNarrativeStyle('font', this.value)" style="height:28px;padding:0 6px;border-radius:4px;border:1px solid #3a3a3a;background:#2a2a2a;color:#fff;font-size:11px;min-width:0;">
                ${fontOpts}
              </select>
            </label>
            <label style="width:56px;display:flex;flex-direction:column;gap:3px;">
              <span style="font-size:10px;font-weight:600;color:#a0aec0;">Tam.</span>
              <input type="number" min="8" max="250" step="1" value="${style.size || 48}" onchange="App.setNarrativeStyle('size', parseInt(this.value,10))" style="height:28px;padding:0 4px;border-radius:4px;border:1px solid #3a3a3a;background:#2a2a2a;color:#fff;font-size:11px;text-align:center;outline:none;">
            </label>
          </div>
          <div style="display:flex;gap:3px;align-items:center;margin-bottom:8px;">
            <button onclick="App.setNarrativeStyle('bold',!${!!style.bold})" title="Negrito" style="${_btn(!!style.bold)}font-weight:800;">B</button>
            <button onclick="App.setNarrativeStyle('italic',!${!!style.italic})" title="Italico" style="${_btn(!!style.italic)}font-style:italic;">I</button>
            <span style="width:1px;height:18px;background:#3a3a3a;margin:0 2px;"></span>
            <button onclick="App.setNarrativeStyle('align','left')" title="Esquerda" style="${_btn(style.align==='left')}">${_stpAlignSVG('left')}</button>
            <button onclick="App.setNarrativeStyle('align','center')" title="Centro" style="${_btn(style.align==='center')}">${_stpAlignSVG('center')}</button>
            <button onclick="App.setNarrativeStyle('align','right')" title="Direita" style="${_btn(style.align==='right')}">${_stpAlignSVG('right')}</button>
            <button onclick="App.setNarrativeStyle('align','justify')" title="Justificar" style="${_btn(style.align==='justify')}">${_stpAlignSVG('justify')}</button>
          </div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
            <label style="display:flex;align-items:center;gap:4px;flex:1;" title="Cor do texto">
              <input type="color" value="${textColor}" onchange="App.setNarrativeStyle('color', this.value)" style="width:22px;height:22px;border:1px solid #3a3a3a;border-radius:4px;padding:0;cursor:pointer;background:transparent;">
              <span style="font-size:9px;color:#a0aec0;">Texto</span>
            </label>
            <label style="display:flex;align-items:center;gap:4px;flex:1;" title="Cor de fundo">
              <input type="color" value="${style.bgColor && style.bgColor.startsWith('#') ? style.bgColor : '#000000'}" onchange="App.setNarrativeStyle('bgColor', this.value)" style="width:22px;height:22px;border:1px solid #3a3a3a;border-radius:4px;padding:0;cursor:pointer;background:transparent;">
              <span style="font-size:9px;color:#a0aec0;">Fundo</span>
            </label>
            <label style="display:flex;align-items:center;gap:3px;" title="Opacidade do fundo">
              <input type="range" min="0" max="100" step="5" value="${Math.round((style.bgOpacity ?? 0.55) * 100)}" oninput="this.nextElementSibling.textContent=this.value+'%'; App.setNarrativeStyle('bgOpacity', this.value/100)" style="width:50px;accent-color:#60a5fa;">
              <span style="font-size:9px;color:#a0aec0;min-width:26px;text-align:right;">${Math.round((style.bgOpacity ?? 0.55) * 100)}%</span>
            </label>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:9px;font-weight:600;color:#a0aec0;width:50px;">${t('narrative.leading')}</span>
            <input type="range" min="0.8" max="3" step="0.1" value="${style.leading || 1.4}" oninput="this.nextElementSibling.textContent=parseFloat(this.value).toFixed(1); App.setNarrativeStyle('leading', parseFloat(this.value))" style="flex:1;accent-color:#60a5fa;">
            <span style="min-width:22px;font-size:10px;color:#e2e8f0;text-align:right;">${Number(style.leading || 1.4).toFixed(1)}</span>
          </div>
          <!-- Stroke/Contorno controls -->
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #333;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <button onclick="App.setNarrativeStyle('strokeEnabled',!${!!style.strokeEnabled})" title="Contorno do texto" style="${_btn(!!style.strokeEnabled)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </button>
              <span style="font-size:9px;font-weight:600;color:#a0aec0;">Contorno</span>
              ${style.strokeEnabled ? `
              <label style="display:flex;align-items:center;gap:3px;margin-left:auto;" title="Cor do contorno">
                <input type="color" value="${style.strokeColor || '#000000'}" onchange="App.setNarrativeStyle('strokeColor', this.value)" style="width:20px;height:20px;border:1px solid #3a3a3a;border-radius:3px;padding:0;cursor:pointer;background:transparent;">
              </label>
              <input type="range" min="1" max="6" step="0.5" value="${style.strokeWidth || 3}" oninput="this.nextElementSibling.textContent=this.value+'px'; App.setNarrativeStyle('strokeWidth', parseFloat(this.value))" style="width:50px;accent-color:#f59e0b;">
              <span style="font-size:9px;color:#a0aec0;min-width:22px;">${style.strokeWidth || 3}px</span>
              ` : ''}
            </div>
            <!-- Preset Estilo Clássico -->
            <button onclick="App.applyNarrativePreset('classic')" style="width:100%;padding:6px 8px;border-radius:4px;border:1px solid #f59e0b;background:rgba(245,158,11,0.1);color:#f59e0b;font-size:10px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;" title="Aplica: amarelo + contorno preto + sem fundo">
              Estilo Classico
            </button>
          </div>
        </div>
      </div>

      <!-- SECTION 2: Advanced Layout (collapsed by default) -->
      <div class="narr-section" data-narr-section="advancedLayout">
        <div class="narr-section-header" onclick="event.stopPropagation();App.toggleNarrSection('advancedLayout')" onmousedown="event.preventDefault()">
          <span class="narr-toggle-icon">${_icon('advancedLayout')}</span>
          <span class="narr-section-title">${t('sidebar.advancedLayout')}</span>
          <span class="narr-section-count">3</span>
        </div>
        <div class="narr-section-content ${_expanded('advancedLayout')}">
          <div style="display:flex;gap:6px;align-items:end;margin-bottom:8px;">
            <label style="flex:1;display:flex;flex-direction:column;gap:3px;">
              <span style="font-size:9px;font-weight:600;color:#a0aec0;">Altura</span>
              <div style="display:flex;align-items:center;gap:4px;">
                <input type="number" min="40" max="420" step="10" value="${activePage.narrativeHeight || 120}" ${settings.heightLocked ? 'disabled' : ''} onchange="App.setNarrativeHeight(parseInt(this.value,10))" style="flex:1;height:26px;padding:0 4px;border-radius:4px;border:1px solid #3a3a3a;background:${settings.heightLocked ? '#222' : '#2a2a2a'};color:#fff;font-size:10px;outline:none;opacity:${settings.heightLocked ? '0.5' : '1'};">
                <span style="font-size:9px;color:#666;">px</span>
                <button onclick="App.setNarrativeLock('height')" title="${settings.heightLocked ? 'Destravar' : 'Travar'}" style="width:24px;height:24px;border-radius:4px;border:1px solid ${settings.heightLocked ? '#3182ce' : '#4a5568'};background:${settings.heightLocked ? '#3182ce' : 'transparent'};color:${settings.heightLocked ? '#fff' : '#a0aec0'};cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;">${settings.heightLocked ? Icons.lock : Icons.unlock}</button>
              </div>
            </label>
          </div>
          <div style="padding:6px;border-radius:4px;background:#1a1a1a;border:1px solid #333;">
            <span style="font-size:9px;font-weight:600;color:#a0aec0;display:block;margin-bottom:5px;">Se o texto nao couber:</span>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="display:flex;align-items:center;gap:5px;font-size:10px;color:#ccc;cursor:pointer;">
                <input type="radio" name="narr-overflow-${panelMode}" value="shrink" ${settings.overflow === 'shrink' ? 'checked' : ''} onchange="if(this.checked) App.setNarrativeAutoFit(this.value)" style="accent-color:#60a5fa;margin:0;">
                <span>${Icons.arrowDown} Diminuir fonte</span>
              </label>
              <label style="display:flex;align-items:center;gap:5px;font-size:10px;color:#ccc;cursor:pointer;">
                <input type="radio" name="narr-overflow-${panelMode}" value="truncate" ${settings.overflow === 'truncate' ? 'checked' : ''} onchange="if(this.checked) App.setNarrativeAutoFit(this.value)" style="accent-color:#60a5fa;margin:0;">
                <span>${Icons.scissors} Cortar...</span>
              </label>
              <label style="display:flex;align-items:center;gap:5px;font-size:10px;color:#ccc;cursor:pointer;">
                <input type="radio" name="narr-overflow-${panelMode}" value="warn" ${settings.overflow === 'warn' ? 'checked' : ''} onchange="if(this.checked) App.setNarrativeAutoFit(this.value)" style="accent-color:#60a5fa;margin:0;">
                <span>${Icons.alert} So avisar</span>
              </label>
            </div>
            ${settings.overflow === 'shrink' ? `<div style="display:flex;align-items:center;gap:5px;margin-top:5px;padding-top:5px;border-top:1px solid #333;">
              <span style="font-size:9px;color:#a0aec0;">Min:</span>
              <input type="number" min="8" max="100" step="1" value="${settings.minFontSize || 12}" onchange="App.setNarrativeMinFont(parseInt(this.value,10))" style="width:40px;height:22px;padding:0 3px;border-radius:4px;border:1px solid #3a3a3a;background:#2a2a2a;color:#fff;font-size:10px;outline:none;text-align:center;">
              <span style="font-size:9px;color:#666;">px</span>
            </div>` : ''}
          </div>
          <button onclick="App.applyNarrativeToAll()" style="width:100%;margin-top:8px;height:28px;border-radius:4px;border:none;background:#3182ce;color:#fff;font-size:10px;font-weight:600;cursor:pointer;">
            Aplicar a todas as paginas
          </button>
        </div>
      </div>

      <!-- SECTION 3: Position & Safe Zones (expanded by default) -->
      <div class="narr-section" data-narr-section="position">
        <div class="narr-section-header" onclick="event.stopPropagation();App.toggleNarrSection('position')" onmousedown="event.preventDefault()">
          <span class="narr-toggle-icon">${_icon('position')}</span>
          <span class="narr-section-title">${t('sidebar.positionSafeZones')}</span>
          ${_isVert && _textPos === 'top' ? '<span class="narr-section-badge safe">Safe</span>' : ''}
          ${_isVert && _textPos === 'bottom' ? '<span class="narr-section-badge" style="background:rgba(239,68,68,0.15);color:#ef4444;">Unsafe</span>' : ''}
        </div>
        <div class="narr-section-content ${_expanded('position')}">
          <div style="display:flex;gap:4px;margin-bottom:6px;">
            ${_posBtn('top', t('safeZones.top'), _topDesc, false)}
            ${_posBtn('middle', t('safeZones.middle'), _midDesc, false)}
            ${_posBtn('bottom', t('safeZones.bottom'), _botDesc, _unsafeBot)}
          </div>
          ${_isVert && _textPos === 'bottom' ? `<div style="padding:5px;border-radius:4px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);font-size:8px;color:#fca5a5;line-height:1.3;margin-bottom:6px;">${t('safeZones.unsafeWarning')}</div>` : ''}
          ${_isVert && _textPos === 'top' ? `<div style="font-size:8px;color:#22c55e;text-align:center;margin-bottom:6px;">${t('safeZones.safeIndicator')}</div>` : ''}
          <button onclick="App.applyTextPositionToAll('${_textPos}')" style="width:100%;padding:4px;border-radius:3px;border:1px dashed #4a5568;background:transparent;color:#a0aec0;font-size:9px;cursor:pointer;">${t('safeZones.applyToAll')}</button>
        </div>
      </div>

      <!-- SECTION 4: Bilingual Subtitles (collapsed by default) -->
      <div class="narr-section" data-narr-section="bilingual">
        <div class="narr-section-header" onclick="event.stopPropagation();App.toggleNarrSection('bilingual')" onmousedown="event.preventDefault()">
          <span class="narr-toggle-icon">${_icon('bilingual')}</span>
          <span class="narr-section-title">${t('sidebar.bilingualSubtitles')}</span>
          ${isDual ? '<span class="narr-section-badge dual">PT+EN</span>' : ''}
        </div>
        <div class="narr-section-content ${_expanded('bilingual')}">
          <span style="font-size:8px;color:#666;display:block;margin-bottom:6px;">${t('narrative.dualTrackHint')}</span>
          <div style="display:flex;gap:4px;margin-bottom:6px;">
            <button onclick="App.setNarrativeDisplay('single')" style="flex:1;padding:5px 6px;border-radius:4px;border:1px solid ${!isDual ? '#00d4ff' : '#4a5568'};background:${!isDual ? 'rgba(0,212,255,0.15)' : 'transparent'};color:${!isDual ? '#00d4ff' : '#a0aec0'};font-size:10px;cursor:pointer;font-weight:${!isDual ? '600' : '400'};">1 Idioma</button>
            <button onclick="App.setNarrativeDisplay('dual')" style="flex:1;padding:5px 6px;border-radius:4px;border:1px solid ${isDual ? '#00d4ff' : '#4a5568'};background:${isDual ? 'rgba(0,212,255,0.15)' : 'transparent'};color:${isDual ? '#00d4ff' : '#a0aec0'};font-size:10px;cursor:pointer;font-weight:${isDual ? '600' : '400'};">PT + EN</button>
          </div>
          ${isDual ? `
          <div style="display:flex;flex-direction:column;gap:5px;padding-top:6px;border-top:1px solid #333;">
            <div style="display:flex;gap:4px;">
              <button onclick="App.setNarrativeOrder('pt-first')" style="flex:1;padding:4px;border-radius:4px;border:1px solid ${(project.narrativeOrder || 'pt-first') === 'pt-first' ? '#00d4ff' : '#4a5568'};background:${(project.narrativeOrder || 'pt-first') === 'pt-first' ? 'rgba(0,212,255,0.1)' : 'transparent'};color:${(project.narrativeOrder || 'pt-first') === 'pt-first' ? '#00d4ff' : '#888'};font-size:9px;cursor:pointer;">PT EN</button>
              <button onclick="App.setNarrativeOrder('en-first')" style="flex:1;padding:4px;border-radius:4px;border:1px solid ${(project.narrativeOrder || 'pt-first') === 'en-first' ? '#00d4ff' : '#4a5568'};background:${(project.narrativeOrder || 'pt-first') === 'en-first' ? 'rgba(0,212,255,0.1)' : 'transparent'};color:${(project.narrativeOrder || 'pt-first') === 'en-first' ? '#00d4ff' : '#888'};font-size:9px;cursor:pointer;">EN PT</button>
            </div>
            <div style="display:flex;align-items:center;gap:5px;">
              <span style="font-size:9px;color:#a0aec0;white-space:nowrap;">Gap:</span>
              <input type="range" min="0" max="24" step="2" value="${project.narrativeDualSpacing || 4}" oninput="this.nextElementSibling.textContent=this.value+'px'; App.setNarrativeDualSpacing(this.value)" style="flex:1;accent-color:#00d4ff;">
              <span style="min-width:24px;font-size:9px;color:#e2e8f0;text-align:right;">${project.narrativeDualSpacing || 4}px</span>
            </div>
            <button onclick="App.showBulkTranslationModal('en')" style="width:100%;padding:4px 6px;border-radius:4px;border:1px dashed #4a5568;background:transparent;color:#a0aec0;font-size:9px;cursor:pointer;">Importar EN em lote</button>
            <button onclick="App.showBulkTranslationModal('pt-BR')" style="width:100%;padding:4px 6px;border-radius:4px;border:1px dashed #4a5568;background:transparent;color:#a0aec0;font-size:9px;cursor:pointer;">Importar PT em lote</button>
            <button onclick="App.validateTranslations()" style="width:100%;padding:4px 6px;border-radius:4px;border:1px solid #4a5568;background:transparent;color:#a0aec0;font-size:9px;cursor:pointer;">Verificar traducoes</button>
          </div>` : ''}
        </div>
      </div>

    </div>
  `;
}

function renderTextNarrativaPanel() {
  const page = Store.getActivePage();
  if (!page) return '';

  return `
    <div class="sidebar-text-panel" id="panel-text-narrativa">
      <div class="stc-header">
        <span class="stc-zone-icon">¶</span>
        <span class="stc-title">NARRATIVA</span>
        <span class="stc-zone-label">Texto</span>
        <button class="stc-close" onclick="App.hideTextContextPanel()" onmousedown="event.preventDefault()" title="Fechar">×</button>
      </div>
      ${renderNarrativeControlsMarkup({ page, panelMode: 'context' })}
    </div>
  `;
}

function _stpAlignSVG(type) {
  const svgs = {
    left: '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2" rx="1"/><rect x="0" y="5" width="10" height="2" rx="1"/><rect x="0" y="9" width="12" height="2" rx="1"/></svg>',
    center: '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2" rx="1"/><rect x="2" y="5" width="10" height="2" rx="1"/><rect x="1" y="9" width="12" height="2" rx="1"/></svg>',
    right: '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2" rx="1"/><rect x="4" y="5" width="10" height="2" rx="1"/><rect x="2" y="9" width="12" height="2" rx="1"/></svg>',
    justify: '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2" rx="1"/><rect x="0" y="5" width="14" height="2" rx="1"/><rect x="0" y="9" width="14" height="2" rx="1"/></svg>',
  };
  return svgs[type] || '';
}

function renderTextMateriaPanel(zoneType) {
  const page = Store.getActivePage();
  if (!page) return '';
  
  const zones = page.materiaZones || {};
  const zone = zones[zoneType] || {};

  const ZONE_DEFAULTS = {
    'materia-titulo':    { font: 'sans', size: 36, weight: 700, color: '#1a1a1a', align: 'left', uppercase: false, leading: 1.1 },
    'materia-subtitulo': { font: 'sans', size: 11, weight: 400, color: '#666666', align: 'left', uppercase: true, leading: 1.4 },
    'materia-coluna':    { font: 'sans', size: 12, weight: 400, color: '#333333', align: 'justify', uppercase: false, leading: 1.7 },
    'materia-legenda':   { font: 'sans', size: 10, weight: 400, color: '#666666', align: 'left', uppercase: false, leading: 1.3 },
  };
  const defaults = ZONE_DEFAULTS[zoneType] || ZONE_DEFAULTS['materia-coluna'];
  const style = { ...defaults, ...(zone.style || {}) };

  const zoneLabels = {
    'materia-titulo': 'Título',
    'materia-subtitulo': 'Subtítulo',
    'materia-coluna': 'Texto',
    'materia-legenda': 'Legenda'
  };

  const ZONA_CONFIG = {
    'materia-titulo':    { fontSizeMin: 8, fontSizeMax: 200, showWeight: true, showCaps: true, showColumns: false, showLeading: true },
    'materia-subtitulo': { fontSizeMin: 6, fontSizeMax: 200, showWeight: false, showCaps: true, showColumns: false, showLeading: true },
    'materia-coluna':    { fontSizeMin: 6, fontSizeMax: 200, showWeight: false, showCaps: false, showColumns: true, showLeading: true },
    'materia-legenda':   { fontSizeMin: 6, fontSizeMax: 200, showWeight: false, showCaps: false, showColumns: false, showLeading: true },
  };
  const config = ZONA_CONFIG[zoneType] || ZONA_CONFIG['materia-coluna'];
  const fontOpts = Object.values(APP_FONTS).map(f => `<option value="${f.id}" ${style.font === f.id ? 'selected' : ''}>${f.name}</option>`).join('');
  const colorVal = style.color || '#222222';
  const leadingVal = style.leading || 1.5;
  
  return `
    <div class="sidebar-text-panel" id="panel-text-materia">
      <div class="stc-header">
        <span class="stc-zone-icon">✦</span>
        <span class="stc-title">MATÉRIA</span>
        <span class="stc-zone-label">${zoneLabels[zoneType] || 'Texto'}</span>
        <button class="stc-close" onclick="App.hideTextContextPanel()" onmousedown="event.preventDefault()" title="Fechar">×</button>
      </div>
      
      <div class="stp-row">
        <label>Fonte</label>
        <select class="stp-font-select" onchange="App.setMateriaFont('${zoneType}', this.value)" onmousedown="event.preventDefault()">
          ${fontOpts}
        </select>
        <div class="stp-size-row">
          <input type="number" class="stp-size-input" min="${config.fontSizeMin}" max="${config.fontSizeMax}" value="${style.size}" 
            onchange="App.setMateriaSize('${zoneType}', parseInt(this.value))" onmousedown="event.preventDefault()">
          <span class="stp-unit">px</span>
        </div>
      </div>
      
      ${config.showWeight ? `
      <div class="stp-row">
        <label>Peso</label>
        <select class="stp-select" onchange="App.setMateriaWeight('${zoneType}', this.value)" onmousedown="event.preventDefault()">
          <option value="400" ${style.weight === 400 ? 'selected' : ''}>Regular</option>
          <option value="600" ${style.weight === 600 ? 'selected' : ''}>Semi-bold</option>
          <option value="700" ${style.weight === 700 ? 'selected' : ''}>Bold</option>
          <option value="900" ${style.weight === 900 ? 'selected' : ''}>Black</option>
        </select>
        ${config.showCaps ? `
        <label style="min-width:auto;">CAPS</label>
        <button class="stp-toggle-pill ${style.uppercase ? 'active' : ''}" onclick="App.setMateriaUppercase('${zoneType}', !${style.uppercase})" onmousedown="event.preventDefault()">
          <span class="pill-track"><span class="pill-thumb"></span></span>
        </button>` : ''}
      </div>
      ` : (config.showCaps ? `
      <div class="stp-row">
        <label>CAPS</label>
        <button class="stp-toggle-pill ${style.uppercase ? 'active' : ''}" onclick="App.setMateriaUppercase('${zoneType}', !${style.uppercase})" onmousedown="event.preventDefault()">
          <span class="pill-track"><span class="pill-thumb"></span></span>
        </button>
      </div>
      ` : '')}
      
      ${config.showColumns ? `
      <div class="stp-row">
        <label>Colunas</label>
        <button class="stp-col-btn ${(zone.columns || 1) === 1 ? 'active' : ''}" onclick="App.setMateriaColumns('${zoneType}', 1)" onmousedown="event.preventDefault()">1</button>
        <button class="stp-col-btn ${(zone.columns || 1) === 2 ? 'active' : ''}" onclick="App.setMateriaColumns('${zoneType}', 2)" onmousedown="event.preventDefault()">2</button>
        <button class="stp-col-btn ${(zone.columns || 1) === 3 ? 'active' : ''}" onclick="App.setMateriaColumns('${zoneType}', 3)" onmousedown="event.preventDefault()">3</button>
      </div>
      <div class="stp-row">
        <label>Espaço</label>
        <input type="range" class="stp-slider" min="8" max="40" step="2" value="${zone.columnGap || 16}"
          oninput="App.setMateriaColumnGap('${zoneType}', parseInt(this.value));document.getElementById('stp-gap-val').textContent=this.value+'px'"
          onmousedown="event.preventDefault()">
        <span class="stp-value" id="stp-gap-val">${zone.columnGap || 16}px</span>
      </div>
      <div class="stp-row">
        <label>Drop Cap</label>
        <button class="stp-toggle-pill ${zone.dropCap ? 'active' : ''}" onclick="App.setMateriaDropCap('${zoneType}', !${!!zone.dropCap})" onmousedown="event.preventDefault()" title="Letra capitular grande no início">
          <span class="pill-track"><span class="pill-thumb"></span></span>
        </button>
        <label style="min-width:auto;margin-left:8px;">Recuo</label>
        <button class="stp-toggle-pill ${zone.indent ? 'active' : ''}" onclick="App.setMateriaIndent('${zoneType}', !${!!zone.indent})" onmousedown="event.preventDefault()" title="Recuo no primeiro parágrafo">
          <span class="pill-track"><span class="pill-thumb"></span></span>
        </button>
      </div>
      ` : ''}
      
      ${config.showLeading ? `
      <div class="stp-row">
        <label>Leading</label>
        <input type="range" class="stp-slider" min="0.8" max="3.0" step="0.1" value="${leadingVal}"
          oninput="App.setMateriaLeading('${zoneType}', parseFloat(this.value));document.getElementById('stp-leading-val').textContent=this.value"
          onmousedown="event.preventDefault()">
        <span class="stp-value" id="stp-leading-val">${leadingVal}</span>
      </div>
      ` : ''}
      
      <div class="stp-row">
        <label>Cor</label>
        <div class="stp-color-wrap">
          <input type="color" class="stp-color-input" value="${colorVal}"
            oninput="App.setMateriaColor('${zoneType}', this.value);document.getElementById('stp-color-prev').style.background=this.value">
          <span class="stp-color-preview" id="stp-color-prev" style="background:${colorVal}"></span>
        </div>
      </div>
      
      <div class="stp-align-row">
        <button class="stp-align-btn ${style.align === 'left' ? 'active' : ''}" onclick="App.setMateriaAlign('${zoneType}', 'left')" onmousedown="event.preventDefault()" title="Alinhar à esquerda">${_stpAlignSVG('left')}</button>
        <button class="stp-align-btn ${style.align === 'center' ? 'active' : ''}" onclick="App.setMateriaAlign('${zoneType}', 'center')" onmousedown="event.preventDefault()" title="Centralizar">${_stpAlignSVG('center')}</button>
        <button class="stp-align-btn ${style.align === 'right' ? 'active' : ''}" onclick="App.setMateriaAlign('${zoneType}', 'right')" onmousedown="event.preventDefault()" title="Alinhar à direita">${_stpAlignSVG('right')}</button>
        <button class="stp-align-btn ${style.align === 'justify' ? 'active' : ''}" onclick="App.setMateriaAlign('${zoneType}', 'justify')" onmousedown="event.preventDefault()" title="Justificar">${_stpAlignSVG('justify')}</button>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════
   RECORDATÓRIO (fixed narrative text per panel)
   ═══════════════════════════════════════ */
function renderRecordatorio(page, panelIndex, pw, ph) {
  if (!page || !page.recordatorios) return '';
  const rec = page.recordatorios.find(r => r.panelIndex === panelIndex);
  if (!rec || !rec.text) return '';
  const pos = rec.position || 'top'; // 'top' or 'bottom'
  const bgColor = rec.bgColor || 'rgba(255,248,220,0.92)';
  const textColor = rec.textColor || '#1a1a1a';
  const fontSize = rec.fontSize || 11;
  const fontFamily = rec.fontFamily || "'Bangers', 'Comic Neue', cursive, sans-serif";
  const height = rec.height || Math.min(ph * 0.25, 40);
  const posStyle = pos === 'top' ? 'top:0;left:0;right:0;' : 'bottom:0;left:0;right:0;';
  const borderStyle = pos === 'top' ? 'border-bottom:1.5px solid rgba(0,0,0,0.25);' : 'border-top:1.5px solid rgba(0,0,0,0.25);';
  return `<div class="recordatorio" style="position:absolute;${posStyle}height:${height}px;background:${bgColor};${borderStyle}display:flex;align-items:center;justify-content:center;padding:3px 8px;z-index:25;cursor:pointer;overflow:hidden;box-sizing:border-box;"
    onclick="event.stopPropagation();App.editRecordatorio(${panelIndex})"
    ondblclick="event.stopPropagation();App.editRecordatorio(${panelIndex})"
    title="Clique para editar recordatório">
    <span style="font-size:${fontSize}px;color:${textColor};font-family:${fontFamily};font-style:italic;text-align:center;line-height:1.3;white-space:pre-wrap;word-break:break-word;">${rec.text}</span>
  </div>`;
}

/* ═══════════════════════════════════════
   STICKER RENDERING ON CANVAS
   ═══════════════════════════════════════ */
// Export UI functions to window for global access
window.renderCanvas = renderCanvas;
window.renderRightPanel = renderRightPanel;
window.renderTimeline = renderTimeline;
window.renderPageList = renderPageList;
window.renderProjectsList = renderProjectsList;

/* ═══════════════════════════════════════
   MOBILE PAGE CAROUSEL — Compact page strip
   Fixed above bottom nav on mobile
   ═══════════════════════════════════════ */
function renderPageCarousel() {
  const el = document.getElementById('mobile-page-carousel');
  if (!el) return;
  const p = Store.get('currentProject');
  const view = Store.get('view');
  if (!p || view !== 'editor') { el.innerHTML = ''; return; }

  const active = Store.get('activePageIndex');
  const coverActive = Store.get('coverActive');
  const backCoverActive = Store.get('backCoverActive');

  let items = '';

  // Cover
  if (p.cover) {
    items += `<button class="tl-page tl-cover ${coverActive ? 'active' : ''}"
      onclick="App.setActiveCover()" title="Capa">
      <span style="display:inline-flex;">${Icons.palette}</span>
      ${coverActive ? '<span class="tl-active-bar"></span>' : ''}
    </button>`;
  }

  // Back cover
  if (p.cover && p.backCover) {
    items += `<button class="tl-page tl-cover ${backCoverActive ? 'active' : ''}"
      onclick="App.setActiveBackCover()" title="Contracapa">
      <span style="display:inline-flex;">${Icons.copy}</span>
      ${backCoverActive ? '<span class="tl-active-bar" style="background:rgba(107,114,128,0.8);"></span>' : ''}
    </button>`;
  }

  // Pages
  items += p.pages.map((page, i) => {
    const isActive = !coverActive && !backCoverActive && i === active;
    const hasImg = page.images && page.images.some(im => im && im.src);
    const hasSlides = page.slides && page.slides.length > 0;
    const slideCount = hasSlides ? page.slides.length : 0;
    const hasAudio = page.slideshowAudio && page.slideshowAudio.file;
    
    // Slideshow pages get special styling
    if (hasSlides) {
      return `<button class="tl-page tl-slideshow ${isActive ? 'active' : ''}"
        onclick="App.setActivePage(${i})"
        title="Pg ${i + 1} - ${slideCount} slides">
        <span class="tl-page-num">${i + 1}</span>
        <span class="tl-slide-count">${slideCount}</span>
        ${hasAudio ? '<span class="tl-audio-dot">🎵</span>' : ''}
        ${isActive ? '<span class="tl-active-bar" style="background:#14b8a6;"></span>' : ''}
      </button>`;
    }
    
    return `<button class="tl-page ${isActive ? 'active' : ''}"
      onclick="App.setActivePage(${i})"
      title="Pg ${i + 1}">
      <span class="tl-page-num">${i + 1}</span>
      ${hasImg ? '<span class="tl-dot" style="background:#14b8a6;width:4px;height:4px;border-radius:50%;position:absolute;bottom:3px;"></span>' : ''}
      ${isActive ? '<span class="tl-active-bar"></span>' : ''}
    </button>`;
  }).join('');

  el.innerHTML = `<div class="tl-inner">
    <div class="tl-center">
      <div class="tl-pages-track" id="mobile-pages-track">${items}</div>
      <button class="tl-add" onclick="App.addPage()" title="Nova página">+</button>
    </div>
  </div>`;

  // Auto-scroll active page into view
  requestAnimationFrame(() => {
    const track = document.getElementById('mobile-pages-track');
    if (!track) return;
    const activeBtn = track.querySelector('.tl-page.active');
    if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
}
window.renderPageCarousel = renderPageCarousel;

function renderStickers(page) {
  if (!page || !page.stickers || page.stickers.length === 0) return '';
  const selectedEl = Store.get('selectedElement');
  return page.stickers.map((stk, i) => {
    const { src, x = 100, y = 100, w = 120, h = 120, rotation = 0, opacity = 1 } = stk;
    const isSelected = selectedEl && selectedEl.type === 'sticker' && selectedEl.index === i;
    return `<div class="sticker-wrapper ${isSelected ? 'selected' : ''}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${isSelected ? 22 : 18};cursor:move;transform:rotate(${rotation}deg);opacity:${opacity};"
      onclick="event.stopPropagation();App.selectSticker(${i})"
      ondblclick="event.stopPropagation();App._showStickerTooltip(${i})"
      onmousedown="App.startStickerDrag(event,${i})"
      oncontextmenu="event.preventDefault();event.stopPropagation();App.showContextMenu(event,'sticker',${i})">
      <img src="${src}" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none;">
      ${isSelected ? `
      <div style="position:absolute;inset:-3px;border:2px dashed var(--accent);border-radius:4px;pointer-events:none;"></div>
      <div class="sticker-resize-handle" onmousedown="event.stopPropagation();App.startStickerResize(event,${i})" style="position:absolute;right:-5px;bottom:-5px;width:12px;height:12px;background:var(--accent);border:2px solid #fff;border-radius:2px;cursor:se-resize;z-index:19;"></div>
      ` : `
      <div class="sticker-resize-handle" onmousedown="event.stopPropagation();App.startStickerResize(event,${i})" style="position:absolute;right:-5px;bottom:-5px;width:10px;height:10px;background:var(--accent);border:2px solid #fff;border-radius:2px;cursor:se-resize;z-index:19;opacity:0;transition:opacity 0.15s;"></div>
      `}
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════
   BALLOON RENDERING ON CANVAS — CSS-FIRST v1
   The balloon div IS the text container (height:auto).
   Only Shout keeps SVG. All others = pure CSS shapes.
   ═══════════════════════════════════════ */

const SFX_COLOR_PRESETS = {
  'BOOM!':    { color: '#FF3300', stroke: '#1a1a1a', shadow: '#FFB300' },
  'POW!':     { color: '#FFD700', stroke: '#1a1a1a', shadow: '#FF3300' },
  'CRASH!!!': { color: '#ffffff', stroke: '#1a1a1a', shadow: '#cc0000' },
  'SPLASH!':  { color: '#00AAFF', stroke: '#003399', shadow: '#ffffff' },
  'WHOOSH!':  { color: '#AA00FF', stroke: '#1a1a1a', shadow: '#ffffff' },
  'ZAP!':     { color: '#FFFF00', stroke: '#1a1a1a', shadow: '#0000cc' },
};

function renderBalloons(page) {
  if (!page || !page.texts || page.texts.length === 0) return '';
  
  const selectedEl = Store.get('selectedElement');
  const proj = Store.get('currentProject');
  const activeLang = proj?.activeLanguage || 'pt-BR';
  
  return page.texts.map((balloon, i) => {
    const { type = 'speech', x = 100, y = 100, w = 180, fontSize, bgColor, textColor, opacity = 1, locked = false } = balloon;
    // Multi-language support: get text for active language
    const text = MultiLang.get(balloon.text, activeLang);
    const direction = balloon.direction || balloon.tailDirection || 's';
    const isSelected = selectedEl && selectedEl.type === 'balloon' && selectedEl.index === i;
    const isSfx = type === 'sfx';
    const isShout = type === 'shout';
    
    const typo = window.BALLOON_TYPOGRAPHY[type] || window.BALLOON_TYPOGRAPHY.speech;
    const actualFontSize = fontSize || typo.fontSize;
    const actualTextColor = textColor || (isSfx ? '#ff3333' : '#1a1a1a');

    // CSS custom properties for dynamic colors
    const balloonBg = bgColor || (type === 'narration' ? '#fffde7' : '#ffffff');
    const balloonStroke = balloon.strokeColor || '#1a1a1a';
    const balloonTextColor = textColor || '#1a1a1a';
    let cssVars = `--b-bg:${balloonBg}; --b-stroke:${balloonStroke}; --b-text:${balloonTextColor};`;
    if (balloon.lineHeight) cssVars += ` --b-lh:${balloon.lineHeight};`;
    if (balloon.letterSpacing) cssVars += ` --b-ls:${balloon.letterSpacing}px;`;
    if (type === 'narration' && balloon.cornerRadius !== undefined) {
      cssVars += ` --b-radius:${balloon.cornerRadius}px;`;
    }

    // SFX inline style overrides
    let sfxInline = '';
    if (isSfx) {
      const sfxRotate = balloon.sfxRotate ?? -5;
      const sfxSkewX = balloon.sfxSkewX ?? 0;
      const sfxStrokeWidth = balloon.sfxStrokeWidth ?? 3;
      const sfxPresetKey = balloon.sfxPreset || (text || '').toUpperCase().trim() || 'BOOM!';
      const sfxColors = SFX_COLOR_PRESETS[sfxPresetKey] || { color: '#FF3300', stroke: '#1a1a1a', shadow: '#FFB300' };
      const sfxColorFinal = textColor || sfxColors.color;
      const sfxStrokeFinal = balloon.sfxStroke || sfxColors.stroke;
      sfxInline = `font-size:${actualFontSize}px; color:${sfxColorFinal}; -webkit-text-stroke:${sfxStrokeWidth}px ${sfxStrokeFinal}; text-shadow:2px 2px 0 ${sfxStrokeFinal},4px 4px 0 ${sfxColors.shadow},6px 6px 0 rgba(0,0,0,0.3); transform:rotate(${sfxRotate}deg) skewX(${sfxSkewX}deg);`;
    }

    // Shout: render SVG background
    let shoutSvgHtml = '';
    if (isShout) {
      const shoutH = balloon.h || 120;
      shoutSvgHtml = `<div class="shout-svg-bg">${BalloonSVGRenderer.shout(w, shoutH, direction, { fill: balloonBg === '#ffffff' ? '#fffde7' : balloonBg, stroke: balloonStroke, strokeWidth: 2.5 })}</div>`;
    }

    // Caption: render SVG (simple rounded rectangle)
    let captionSvgHtml = '';
    if (type === 'caption') {
      const captionH = balloon.h || 60;
      captionSvgHtml = `<div class="caption-svg-bg">${BalloonSVGRenderer.caption(w, captionH, { fill: balloonBg, stroke: balloonStroke })}</div>`;
    }

    // Thought: 3rd bubble dot
    let thoughtDot = '';
    if (type === 'thought') {
      thoughtDot = '<span class="thought-dot-3"></span>';
    }

    // Selection UI (handles)
    const selectionUI = isSelected ? `
      <div class="balloon-css-selection"></div>
      <div class="balloon-css-resize" data-corner="se" onmousedown="event.stopPropagation();App.startBalloonResize(event,${i},'se')"></div>
      <div class="balloon-css-resize" data-corner="sw" onmousedown="event.stopPropagation();App.startBalloonResize(event,${i},'sw')"></div>
      <div class="balloon-css-resize" data-corner="ne" onmousedown="event.stopPropagation();App.startBalloonResize(event,${i},'ne')"></div>
      <div class="balloon-css-resize" data-corner="nw" onmousedown="event.stopPropagation();App.startBalloonResize(event,${i},'nw')"></div>
    ` : '';

    // Font size inline override (only if different from type default)
    let fontSizeInline = '';
    if (fontSize && fontSize !== typo.fontSize) {
      fontSizeInline = `font-size:${actualFontSize}px;`;
    }
    let textColorInline = '';
    if (textColor) {
      textColorInline = `color:${actualTextColor};`;
    }
    // Text formatting styles (bold, italic, underline, textAlign)
    const fmtBold = balloon.bold ? 'font-weight:700;' : '';
    const fmtItalic = balloon.italic ? 'font-style:italic;' : '';
    const fmtUnderline = balloon.underline ? 'text-decoration:underline;' : '';
    const fmtAlign = balloon.textAlign && balloon.textAlign !== 'center' ? `text-align:${balloon.textAlign};` : '';
    const fmtInline = fmtBold + fmtItalic + fmtUnderline + fmtAlign;

    // All balloons use fixed width — text wraps inside, height grows via ResizeObserver
    const widthStyle = `width:${w}px;`;
    
    const snapAttr = type === 'narration' && balloon.positionMode && balloon.positionMode !== 'free' ? ` data-snap="${balloon.positionMode}"` : '';
    return `<div class="balloon-css ${type} ${isSelected ? 'selected' : ''} ${locked ? 'locked' : ''}"
      data-type="${type}"
      data-tail="${direction}"
      data-balloon-idx="${i}"${snapAttr}
      style="left:${x}px; top:${y}px; ${widthStyle} ${cssVars} opacity:${opacity};"
      draggable="false"
      onclick="event.stopPropagation();App.selectBalloon(${i})"
      ondblclick="event.stopPropagation();App.editBalloonCss(${i})"
      onmousedown="${locked ? 'event.stopPropagation()' : `(function(e){var t=e.target;if(t.classList.contains('balloon-text-css')&&t.contentEditable==='true')return;e.stopPropagation();App.startBalloonDrag(e,${i})})(event)`}"
      oncontextmenu="event.preventDefault();event.stopPropagation();App.showContextMenu(event,'balloon',${i})">
      ${shoutSvgHtml}
      ${captionSvgHtml}
      ${thoughtDot}
      <div class="balloon-text-css"
        contenteditable="false"
        data-balloon-index="${i}"
        data-placeholder="${isSfx ? '' : '...'}"
        onblur="App.saveBalloonTextCss(${i}, this.innerText)"
        onkeydown="event.stopImmediatePropagation();"
        oninput="${isShout ? 'App._updateShoutSvgLive('+i+')' : ''}"
        onpaste="setTimeout(()=>{App.saveBalloonTextCss(${i},this.innerText);if(this.closest('.shout'))App._updateShoutSvg(${i})},50)"
        style="${fontSizeInline}${textColorInline}${fmtInline}${sfxInline}"
      >${S(text || '')}</div>
      ${selectionUI}
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════
   CONTEXT MENU
   ═══════════════════════════════════════ */
function renderContextMenu(x, y, items) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.id = 'context-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.innerHTML = items.map(item => {
    if (item.separator) return '<div class="ctx-separator"></div>';
    if (item.html) return item.html;
    if (item.submenu) {
      const subItems = item.submenu.map(sub => 
        `<button class="ctx-item" onclick="${sub.action};closeContextMenu()"><span>${sub.label}</span></button>`
      ).join('');
      return `<div class="ctx-submenu-wrap">
        <button class="ctx-item ctx-has-submenu"><span>${item.label}</span><span style="margin-left:auto;opacity:0.5;">▸</span></button>
        <div class="ctx-submenu">${subItems}</div>
      </div>`;
    }
    const danger = item.danger ? ' ctx-danger' : '';
    return `<button class="ctx-item${danger}" onclick="${item.action};closeContextMenu()">${item.icon || ''}<span>${item.label}</span></button>`;
  }).join('');
  document.body.appendChild(menu);
  // Ensure menu stays within viewport
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
  });
  setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 50);
}

function closeContextMenu() {
  const m = document.getElementById('context-menu');
  if (m) m.remove();
}

/* ═══════════════════════════════════════
   TIMELINE - HQ Movie Video Timeline
   ═══════════════════════════════════════ */
function renderTimeline() {
  const bar = document.getElementById('timeline-bar');
  if (!bar) return;
  
  const proj = Store.get('currentProject');
  const view = Store.get('view');
  
  if (!proj || view !== 'editor' || !proj.videoFormat) {
    bar.classList.add('hidden');
    if (typeof renderPageCarousel === 'function') renderPageCarousel();
    return;
  }
  
  bar.classList.remove('hidden');
  
  const pages = proj.pages || [];
  const activeIdx = Store.get('activePageIndex');
  const player = Store.get('timelinePlayer') || {};
  const isPlaying = player.playing || false;
  const playingPageIdx = player.pageIndex ?? -1;
  const pageProgress = player.pageProgress ?? 0;
  
  let totalDuration = 0;
  let currentTime = 0;
  const pageTimes = pages.map((pg, i) => {
    const dur = pg.duration || 2.5;
    const start = totalDuration;
    totalDuration += dur;
    if (isPlaying && i < playingPageIdx) currentTime += dur;
    if (isPlaying && i === playingPageIdx) currentTime += dur * pageProgress;
    return { start, dur };
  });
  
  if (!isPlaying) {
    for (let i = 0; i < activeIdx && i < pageTimes.length; i++) {
      currentTime += pageTimes[i].dur;
    }
  }
  
  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
  };
  
  const narrationMap = {};
  if (proj.videoAudio && proj.videoAudio.pages) {
    proj.videoAudio.pages.forEach(pa => { narrationMap[pa.pageId] = true; });
  }
  const hasBgMusic = proj.videoAudio?.background?.file ? true : false;
  
  bar.innerHTML = `
    <div class="timeline-controls">
      <button class="timeline-play-btn ${isPlaying ? 'playing' : ''}" onclick="App.timelineTogglePlay()" title="${isPlaying ? 'Pausar' : 'Play Preview'}">
        ${isPlaying ? '⏸' : '▶'}
      </button>
      <span class="timeline-time">${fmtTime(currentTime)} / ${fmtTime(totalDuration)}</span>
      <input type="range" class="timeline-scrubber" min="0" max="${Math.round(totalDuration * 10)}" value="${Math.round(currentTime * 10)}"
        oninput="App.timelineScrub(this.value / 10, ${totalDuration})">
      <span class="timeline-total">${pages.length} pág · ${fmtTime(totalDuration)} total</span>
    </div>
    <div class="timeline-tracks">
      ${pages.map((pg, i) => {
        const dur = pg.duration || 2.5;
        const widthPx = Math.max(60, dur * 18);
        const isActive = i === activeIdx;
        const isPlayingNow = isPlaying && i === playingPageIdx;
        const hasNarr = narrationMap[pg.id] || false;
        const isLocked = pg.durationLocked || false;
        const kb = pg.kenBurns || 'none';
        const kbPreset = KEN_BURNS_PRESETS[kb];
        const hasKB = kb && kb !== 'none' && kb !== 'static';
        const progressPct = isPlayingNow ? (pageProgress * 100) : (isPlaying && i < playingPageIdx ? 100 : 0);
        const hasImg = pg.images && pg.images.some(im => im && im.src);
        const hasNarrText = pg.showTextBelow && pg.narrative;
        const tr = pg.transition || 'fade';
        const trDur = (tr === 'fade' && pg.transitionDuration) ? pg.transitionDuration : (proj.timeline?.transitionDuration || 0.5);
        
        const addBtnHTML = i < pages.length - 1 
          ? '<div class="transition-line" onclick="event.stopPropagation();App.quickEditTransition(' + i + ',event)" title="' + (tr === 'cut' ? 'Corte seco' : tr + ' ' + trDur + 's') + '">'
            + '<div class="transition-bar" style="background:' + (tr === 'cut' ? 'transparent' : '#00d4ff') + '"></div>'
            + (tr !== 'cut' ? '<div class="transition-time">' + trDur + 's</div>' : '')
          + '</div>'
          : '';
        
        let classes = 'timeline-page';
        if (isActive) classes += ' active';
        if (isPlayingNow) classes += ' playing-now';
        if (hasKB) classes += ' has-effect';
        if (hasNarr) classes += ' has-audio';
        if (hasNarrText) classes += ' has-narrative';

        // ── SLIDESHOW EXPANDED RENDER ──
        const pgSlides = pg.slides || [];
        const hasSlides = pgSlides.length > 0;
        const activeSlideIdx = Store.get('activeSlideIndex');

        if (hasSlides) {
          const hasPgAudio = pg.slideshowAudio && pg.slideshowAudio.file;
          const audioDur = hasPgAudio ? pg.slideshowAudio.duration.toFixed(1) : null;
          const expandedClasses = classes + ' slideshow-expanded';

          return '<div class="' + expandedClasses + '" ' +
            'onclick="App.timelineClickPage(' + i + ')" ' +
            'draggable="true" ondragstart="App.pageDragStart(event,' + i + ')" ' +
            'ondragover="event.preventDefault();this.style.outline=\'2px solid var(--accent)\';" ' +
            'ondragleave="this.style.outline=\'none\';" ' +
            'ondrop="this.style.outline=\'none\';App.pageDrop(event,' + i + ')">' +
            // Header row
            '<div class="slideshow-expanded-header">' +
              '<span class="slideshow-expanded-label">Pg ' + (i + 1) + ' · ' + pgSlides.length + ' slides</span>' +
              '<button class="delete-btn slideshow-expanded-del" onclick="event.stopPropagation();App.deletePage(' + i + ')" title="Deletar">×</button>' +
            '</div>' +
            // Slides inline row
            '<div class="slides-inline">' +
              pgSlides.map((sl, si) => {
                const isActiveSlide = isActive && si === activeSlideIdx;
                return '<div class="slide-mini-thumb' + (isActiveSlide ? ' selected' : '') + '" ' +
                  'draggable="true" ' +
                  'ondragstart="event.stopPropagation();App.slideDragStart(event,' + i + ',' + si + ')" ' +
                  'ondragover="event.preventDefault();event.stopPropagation();this.classList.add(\'drag-over\')" ' +
                  'ondragleave="this.classList.remove(\'drag-over\')" ' +
                  'ondrop="event.stopPropagation();this.classList.remove(\'drag-over\');App.slideDrop(event,' + i + ',' + si + ')" ' +
                  'onclick="event.stopPropagation();App.selectSlide(' + i + ',' + si + ')" ' +
                  'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();App.selectSlide(' + i + ',' + si + ');}" ' +
                  'tabindex="0" role="button" ' +
                  'aria-label="Slide ' + (si + 1) + ' de ' + pgSlides.length + ', ' + (sl.duration || 2) + ' segundos" ' +
                  'title="Slide ' + (si + 1) + ': ' + (sl.duration || 2) + 's (duplo-clique para editar)">' +
                  (sl.image ? '<img src="' + sl.image + '" alt="">' : '<div class="slide-mini-empty"></div>') +
                  '<span class="slide-mini-dur" ondblclick="event.stopPropagation();App.editSlideDurationInline(' + i + ',' + si + ',event)">' + (sl.duration || 2) + 's</span>' +
                  '<span class="slide-mini-num">' + (si + 1) + '</span>' +
                  '<button class="slide-mini-del" onclick="event.stopPropagation();App.removeSlideFromTimeline(' + i + ',' + si + ')" title="Remover slide">×</button>' +
                '</div>';
              }).join('') +
              '<button class="slide-mini-add" onclick="event.stopPropagation();App.timelineClickPage(' + i + ');App.addSlideFromLibrary();" title="Adicionar slide">+</button>' +
            '</div>' +
            // Audio + progress indicator
            (hasPgAudio
              ? '<div class="slideshow-expanded-audio" onclick="event.stopPropagation();App.timelineClickPage(' + i + ');">🎵 ' + audioDur + 's</div>'
              : '') +
            '<div class="tl-progress-bar" style="width:' + progressPct + '%;position:absolute;bottom:0;left:0;height:3px;"></div>' +
          '</div>' + addBtnHTML;
        }

        return '<div class="' + classes + '" style="width:' + widthPx + 'px;" ' +
          'onclick="App.timelineClickPage(' + i + ')" ' +
          'draggable="true" ondragstart="App.pageDragStart(event,' + i + ')" ' +
          'ondragover="event.preventDefault();this.style.outline=\'2px solid var(--accent)\';" ' +
          'ondragleave="this.style.outline=\'none\';" ' +
          'ondrop="this.style.outline=\'none\';App.pageDrop(event,' + i + ')">' +
          '<div class="page-thumb">' +
            (hasImg ? '<img src="' + pg.images[0].src + '" alt="">' : '') +
            (hasKB ? '<div class="kb-badge" onclick="event.stopPropagation();App.toggleKenBurns(' + i + ')" title="' + (kbPreset ? kbPreset.name : kb) + '">KB</div>' : '') +
            '<div class="duration-text' + (isLocked ? ' locked' : '') + '" ondblclick="event.stopPropagation();' + (isLocked ? '' : 'App.timelineEditDurationInline(' + i + ',event)') + '" title="' + (isLocked ? 'Bloqueado' : 'Editar') + '">' + dur + 's</div>' +
            '<button class="delete-btn" onclick="event.stopPropagation();App.deletePage(' + i + ')" title="Deletar">×</button>' +
            '<div class="tl-progress-bar" style="width:' + progressPct + '%;"></div>' +
          '</div>' +
        '</div>' + addBtnHTML;
      }).join('')}
      <button class="timeline-add-btn" onclick="App.addPage()" title="Adicionar página">+</button>
    </div>
  `;

  // Also update mobile page carousel
  if (typeof renderPageCarousel === 'function') renderPageCarousel();
}

/* ═══════════════════════════════════════════════════════════════
   AUDIO SPLIT TIMELINE — Split-view panel inside canvas-area
   Canvas 45% top · Audio Timeline 55% bottom (Premiere/DaVinci)
   Features: RMS+Peak waveform, page thumbnails, clipping, snap
   ═══════════════════════════════════════════════════════════════ */

function _asFmt(s) {
  if (!s || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m}:${sec.toString().padStart(2, '0')}.${ms}`;
}

function renderAudioSplitTimeline() {
  const proj = Store.get('currentProject');
  if (!proj) return '';

  const draft = AudioSplitter.getDraft();
  const pages = proj.pages || [];
  const pageCount = pages.length;
  const hasAudio = draft && draft.sourceFile;
  const segments = hasAudio ? AudioSplitter.getSegments() : [];
  const isPlaying = AudioSplitter.isPreviewPlaying();
  const currentTime = AudioSplitter.getPreviewTime();
  const totalDuration = draft?.sourceDuration || 0;
  const selIdx = AudioSplitter.getSelectedSegment();
  const selMeta = AudioSplitter.getSegmentMeta(selIdx);
  const selSeg = segments[selIdx] || null;
  const snap = App._audioSplitSnap || false;

  const validSegmentsCount = segments.filter((_, i) => !AudioSplitter.getSegmentMeta(i).ignored).length;
  const segCount = segments.length;
  const existingPages = pages.length;
  const newPagesNeeded = Math.max(0, validSegmentsCount - existingPages);

  // --- Segment thumbnails strip (one per segment, may create new pages) ---
  let validIndex = 0;
  const thumbsHtml = segments.map((seg, i) => {
    const meta = AudioSplitter.getSegmentMeta(i);
    const isIgnored = meta.ignored;
    const pg = pages[validIndex] || null;
    const thumb = isIgnored ? '' : (pg?.images?.[0]?.src || '');
    const isSel = i === selIdx;
    const isNew = !isIgnored && validIndex >= existingPages;
    const durLabel = seg.duration.toFixed(1) + 's';
    
    let label = isIgnored ? 'Descarte' : (isNew ? 'Nova' : 'Pág');
    let num = isIgnored ? '' : (validIndex + 1);
    
    if (!isIgnored) validIndex++;

    return `<div class="ast-thumb ${isSel ? 'selected' : ''} ${isNew ? 'ast-thumb-new' : ''} ${isIgnored ? 'ast-thumb-ignored' : ''}" onclick="App.selectAudioSplitSegment(${i})">
      ${thumb
        ? `<img class="ast-thumb-img" src="${thumb}" alt="Seg ${i+1}">`
        : `<div class="ast-thumb-placeholder">${isIgnored ? '\u2013' : (isNew ? '+' : num)}</div>`}
      <div style="display:flex;flex-direction:column;min-width:0;">
        <span class="ast-thumb-label">${label} ${num}</span>
        <span class="ast-thumb-dur">${durLabel}</span>
      </div>
    </div>`;
  }).join('');

  // --- Info bar for selected segment (clean multi-row layout) ---
  const infoHtml = selSeg ? `
    <div class="ast-info" style="flex-direction:column;gap:4px;align-items:stretch;">
      <div style="display:flex;align-items:center;gap:6px;">
        <div class="ast-info-dot"></div>
        <strong>Seg ${selIdx+1}</strong>
        <span style="color:var(--text3);font-size:10px;">${_asFmt(selSeg.start)} → ${_asFmt(selSeg.end)}</span>
        <span style="color:var(--text3);font-size:10px;">${selSeg.duration.toFixed(1)}s</span>
        <span style="color:var(--text3);font-size:10px;">${Icons.volumeIcon} ${Math.round(selMeta.volume*100)}%</span>
        <input type="range" min="0" max="100" value="${Math.round(selMeta.volume*100)}" oninput="App.setAudioSplitSegmentMeta(${selIdx},'volume',this.value/100)" style="width:80px;" ${selMeta.ignored ? 'disabled' : ''}>
        <span class="ast-info-sep">│</span>
        <span style="font-size:10px;color:var(--text2);">Fade In ${selMeta.fadeIn.toFixed(2)}s</span>
        <input type="range" min="0" max="200" value="${Math.round(selMeta.fadeIn*100)}" oninput="App.setAudioSplitSegmentMeta(${selIdx},'fadeIn',this.value/100)" style="width:70px;" ${selMeta.ignored ? 'disabled' : ''}>
        <span style="font-size:10px;color:var(--text2);">Out ${selMeta.fadeOut.toFixed(2)}s</span>
        <input type="range" min="0" max="200" value="${Math.round(selMeta.fadeOut*100)}" oninput="App.setAudioSplitSegmentMeta(${selIdx},'fadeOut',this.value/100)" style="width:70px;" ${selMeta.ignored ? 'disabled' : ''}>
        <span class="ast-info-sep">│</span>
        <span style="display:inline-flex;">${Icons.fileText}</span>
        <input type="text" maxlength="200" value="${(selMeta.note||'').replace(/"/g,'&quot;')}" placeholder="Nota..." onchange="App.setAudioSplitSegmentMeta(${selIdx},'note',this.value)" style="flex:1;min-width:80px;" ${selMeta.ignored ? 'disabled' : ''}>
        <button class="ast-btn" onclick="App.playAudioSplitSegment(${selIdx})">▶ Ouvir</button>
        <button class="ast-btn ${selMeta.ignored ? 'ast-btn-danger active' : ''}" onclick="App.toggleAudioSplitSegmentIgnore(${selIdx})">
          ${selMeta.ignored ? '✕ Ignorado' : '✕ Descartar'}
        </button>
      </div>
    </div>` : '';

  return `
  <div class="ast-panel" id="ast-panel">
    <!-- TOOLBAR -->
    <div class="ast-toolbar">
      <span class="ast-title">${Icons.scissors} Audio Split</span>
      <span class="ast-badge">${segCount} seg → ${validSegmentsCount} pág</span>
      <select onchange="App.setAudioSplitLang(this.value)" style="padding:2px 5px;border-radius:3px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:10px;">
        <option value="pt-BR" ${draft?.lang !== 'en' ? 'selected' : ''}>PT-BR</option>
        <option value="en" ${draft?.lang === 'en' ? 'selected' : ''}>EN</option>
      </select>
      <div class="ast-sep"></div>
      ${hasAudio ? `
        <button class="ast-btn" onclick="App.uploadAudioSplitSource()">${Icons.folder} Trocar</button>
        <button class="ast-btn" onclick="App.resetAudioSplitBoundaries()">⚖ Dividir Igual</button>
        <button class="ast-btn" onclick="App.undoAudioSplit()">↩ Undo</button>
        <button class="ast-btn ${snap ? 'active' : ''}" onclick="App.toggleAudioSplitSnap()">Snap</button>
      ` : ''}
      <div style="flex:1;"></div>
      ${hasAudio ? `
        <span class="ast-badge" style="color:var(--warning);border:1px solid var(--warning);">
          ${Icons.scissors} Clique na waveform para cortar
        </span>
        <button class="ast-btn primary" onclick="App.applyAudioSplitToPages()">
          ${Icons.check} Aplicar ${segCount} seg → ${validSegmentsCount} pág${newPagesNeeded > 0 ? ` (+${newPagesNeeded} novas)` : ''}
        </button>
      ` : ''}
      <button class="ast-btn danger" onclick="App.closeAudioSplitEditor()">✕</button>
    </div>

    ${!hasAudio ? `
      <!-- Upload state -->
      <div class="ast-upload">
        <div class="ast-upload-icon">${Icons.scissors}</div>
        <div class="ast-upload-text">
          Upload áudio longo (podcast, narração, tutorial)<br>
          <strong>Divida em partes → cada parte vira uma página</strong><br>
          <span style="font-size:11px;color:var(--text3);">Entrada separada de narração individual e música de fundo</span>
        </div>
        <button class="ast-upload-btn" onclick="App.uploadAudioSplitSource()">${Icons.folder} Escolher Arquivo</button>
      </div>
    ` : `
      <!-- Page thumbnails strip -->
      <div class="ast-thumbs" id="ast-thumbs">${thumbsHtml}</div>

      <!-- Waveform area -->
      <div class="ast-wave-area">
        <div class="ast-wave-wrap" id="ast-wave-wrap">
          <canvas id="audio-split-waveform" onclick="App.handleWaveformClick(event)" style="cursor:crosshair;"></canvas>
          <div class="ast-markers" id="audio-split-markers"></div>
          <div class="ast-playhead" id="audio-split-playhead"></div>
        </div>
        <div class="ast-time-axis" id="audio-split-time-axis"></div>
      </div>

      <!-- Controls row -->
      <div class="ast-controls">
        <button class="ast-play-btn ${isPlaying ? 'playing' : ''}" onclick="App.toggleAudioSplitPreview()">
          ${isPlaying ? '⏸' : '▶'}
        </button>
        <button class="ast-btn" onclick="App.stopAudioSplitPreview()" style="padding:4px 6px;">⏹</button>
        <input type="range" class="ast-seek" id="audio-split-seek" min="0" max="${Math.round(totalDuration*100)}" value="${Math.round(currentTime*100)}"
          oninput="App.seekAudioSplitPreview(this.value/100)">
        <span class="ast-time-label" id="audio-split-time-label">${_asFmt(currentTime)} / ${_asFmt(totalDuration)}</span>
      </div>

      <!-- Info bar (selected segment) -->
      ${infoHtml}
    `}
  </div>`;
}

function drawAudioSplitWaveform() {
  const canvas = document.getElementById('audio-split-waveform');
  if (!canvas) return;
  const waveform = AudioSplitter.getWaveformData();
  const draft = AudioSplitter.getDraft();
  if (!waveform || !draft) return;

  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const barW = w / waveform.length;
  const centerY = h / 2;
  const boundaries = draft.boundaries || [];
  const duration = draft.sourceDuration || 1;
  const selIdx = AudioSplitter.getSelectedSegment();

  // Background — use app's --bg
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#111214';
  ctx.fillRect(0, 0, w, h);

  // Segment region tints (alternating)
  for (let i = 0; i < boundaries.length - 1; i++) {
    const x1 = (boundaries[i] / duration) * w;
    const x2 = (boundaries[i + 1] / duration) * w;
    const isSel = i === selIdx;
    const meta = AudioSplitter.getSegmentMeta(i);
    const isIgnored = meta && meta.ignored;
    
    if (isIgnored) {
      ctx.fillStyle = isSel ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)';
    } else {
      ctx.fillStyle = isSel ? 'rgba(107,114,128,0.12)' : (i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.008)');
    }
    ctx.fillRect(x1, 0, x2 - x1, h);
    
    if (isIgnored) {
      ctx.strokeStyle = 'rgba(239,68,68,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, 0);
      ctx.lineTo(x2, h);
      ctx.moveTo(x2, 0);
      ctx.lineTo(x1, h);
      ctx.stroke();
    }
  }

  // Snap grid lines (if snap enabled)
  if (App._audioSplitSnap) {
    const gridStep = duration <= 30 ? 1 : duration <= 120 ? 5 : 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let t = gridStep; t < duration; t += gridStep) {
      const x = (t / duration) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  // Center line (0dB reference)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(w, centerY);
  ctx.stroke();

  // --- RMS layer (lighter, wider — perceived loudness) ---
  ctx.fillStyle = 'rgba(107,114,128,0.25)';
  waveform.forEach((peak, i) => {
    const rms = peak * 0.6; // approximate RMS as 60% of peak
    const barH = Math.max(1, rms * h * 0.85);
    const x = i * barW;
    ctx.fillRect(x, centerY - barH / 2, Math.max(1, barW - 0.3), barH);
  });

  // --- Peak layer (brighter, sharper) ---
  const gradient = ctx.createLinearGradient(0, centerY - h * 0.42, 0, centerY + h * 0.42);
  gradient.addColorStop(0, 'rgba(94,234,212,0.95)');
  gradient.addColorStop(0.4, 'rgba(107,114,128,0.85)');
  gradient.addColorStop(0.5, 'rgba(13,148,136,0.7)');
  gradient.addColorStop(0.6, 'rgba(107,114,128,0.85)');
  gradient.addColorStop(1, 'rgba(94,234,212,0.95)');

  ctx.fillStyle = gradient;
  waveform.forEach((peak, i) => {
    const barH = Math.max(2, peak * h * 0.85);
    const x = i * barW;
    ctx.fillRect(x, centerY - barH / 2, Math.max(1, barW - 0.3), barH);
  });

  // --- Peak white highlights (top loudness) ---
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  waveform.forEach((peak, i) => {
    if (peak > 0.55) {
      const barH = Math.max(1, peak * h * 0.3);
      ctx.fillRect(i * barW, centerY - barH / 2, Math.max(1, barW - 0.3), barH);
    }
  });

  // --- Clipping indicators (red lines for peaks > 0.95) ---
  ctx.fillStyle = 'rgba(239,68,68,0.7)';
  waveform.forEach((peak, i) => {
    if (peak > 0.95) {
      const x = i * barW;
      ctx.fillRect(x, 0, Math.max(1, barW), 3);
      ctx.fillRect(x, h - 3, Math.max(1, barW), 3);
    }
  });

  // --- Boundary dividers ---
  boundaries.forEach((time, i) => {
    if (i === 0 || i === boundaries.length - 1) return;
    const x = (time / duration) * w;

    // Dashed line
    ctx.strokeStyle = 'rgba(245,158,11,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // --- Segment page numbers (centered in each zone) ---
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < boundaries.length - 1; i++) {
    const x1 = (boundaries[i] / duration) * w;
    const x2 = (boundaries[i + 1] / duration) * w;
    const cx = (x1 + x2) / 2;
    const isSel = i === selIdx;
    ctx.fillStyle = isSel ? 'rgba(94,234,212,0.9)' : 'rgba(255,255,255,0.15)';
    ctx.fillText(`${i + 1}`, cx, h - 8);
  }
  ctx.textAlign = 'start';

  // --- Boundary drag handles (DOM overlay) ---
  const markersDiv = document.getElementById('audio-split-markers');
  if (markersDiv) {
    markersDiv.innerHTML = boundaries.map((time, i) => {
      if (i === 0 || i === boundaries.length - 1) return '';
      const pct = (time / duration) * 100;
      return `<div class="ast-marker" data-index="${i}" style="left:${pct}%;">
        <div class="ast-marker-line"></div>
        <div class="ast-marker-handle"></div>
        <div class="ast-marker-delete" onclick="event.stopPropagation();App.removeAudioSplitCut(${i})" title="Remover corte">✕</div>
      </div>`;
    }).join('');

    _bindAudioSplitDrag(markersDiv, w, duration, boundaries);
  }

  // --- Time axis ticks ---
  const timeAxis = document.getElementById('audio-split-time-axis');
  if (timeAxis) {
    const ticks = [];
    const step = duration <= 20 ? 2 : duration <= 60 ? 5 : duration <= 180 ? 10 : 30;
    for (let t = 0; t <= duration; t += step) {
      const pct = (t / duration) * 100;
      ticks.push(`<span style="position:absolute;left:${pct}%;font-size:8px;color:var(--text4);font-family:monospace;transform:translateX(-50%);top:2px;">${_asFmt(t)}</span>`);
    }
    timeAxis.innerHTML = ticks.join('');
  }
}

function _bindAudioSplitDrag(container, canvasW, duration, boundaries) {
  const snap = App._audioSplitSnap;
  const gridStep = duration <= 30 ? 1 : duration <= 120 ? 5 : 10;

  container.querySelectorAll('.ast-marker').forEach(marker => {
    marker.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const index = parseInt(marker.dataset.index);
      const startX = e.clientX;
      const startTime = boundaries[index];

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        let newTime = startTime + (dx / canvasW) * duration;
        // Snap to grid
        if (snap) {
          newTime = Math.round(newTime / gridStep) * gridStep;
        }
        AudioSplitter.updateBoundary(index, newTime);
        drawAudioSplitWaveform();
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}

window.renderAudioSplitTimeline = renderAudioSplitTimeline;
window.drawAudioSplitWaveform = drawAudioSplitWaveform;

/* ═══════════════════════════════════════════════════════════════
   BULK TEXT IMPORT MODAL
   ═══════════════════════════════════════════════════════════════ */

function renderBulkTextModal() {
  const videoFormats = Object.values(VIDEO_FORMATS);
  return `
  <div class="bulk-modal-overlay" id="bulk-text-overlay" onclick="if(event.target===this)App.closeBulkTextModal()">
    <div class="bulk-modal bulk-modal-wide" onclick="event.stopPropagation()">
      <div class="bulk-modal-header">
        <h2>${Icons.fileText} Criar Páginas de Script</h2>
        <button class="bulk-modal-close" onclick="App.closeBulkTextModal()">✕</button>
      </div>
      <div class="bulk-modal-body" style="display:flex;gap:20px;min-height:420px;">
        <!-- LEFT: Input area -->
        <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;">Texto do Script</span>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-ghost btn-sm" onclick="App._bulkTextInsertBreak()" style="font-size:10px;padding:3px 8px;" title="Insere uma linha divisória no cursor">${Icons.scissors} Quebra de Página</button>
              <button class="btn btn-ghost btn-sm" onclick="App._bulkTextFillExample()" style="font-size:10px;padding:3px 8px;">Ver Exemplo</button>
            </div>
          </div>
          <!-- Language mode selector -->
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;padding:10px 12px;background:rgba(20,184,166,0.06);border:1px solid rgba(20,184,166,0.2);border-radius:6px;">
            <div style="font-size:11px;font-weight:700;color:#14b8a6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">🌐 IDIOMA DAS LEGENDAS</div>
            <label style="display:flex;align-items:flex-start;gap:8px;padding:8px;background:var(--surface);border:1px solid var(--border);border-radius:4px;cursor:pointer;transition:border-color 0.15s;" onmouseenter="this.style.borderColor='#14b8a6'" onmouseleave="this.style.borderColor='var(--border)'">
              <input type="radio" name="bulk-text-lang" value="single-pt" checked onchange="App._bulkTextPreview()" style="accent-color:#14b8a6;margin-top:2px;">
              <div><div style="font-size:12px;font-weight:600;color:var(--text);">Idioma único</div><div style="font-size:10px;color:var(--text3);margin-top:2px;">Digite o texto em um idioma apenas</div></div>
            </label>
            <label style="display:flex;align-items:flex-start;gap:8px;padding:8px;background:var(--surface);border:1px solid var(--border);border-radius:4px;cursor:pointer;transition:border-color 0.15s;" onmouseenter="this.style.borderColor='#14b8a6'" onmouseleave="this.style.borderColor='var(--border)'">
              <input type="radio" name="bulk-text-lang" value="bilingual" onchange="App._bulkTextPreview()" style="accent-color:#14b8a6;margin-top:2px;">
              <div><div style="font-size:12px;font-weight:600;color:#14b8a6;">Dois idiomas (Bilíngue)</div><div style="font-size:10px;color:var(--text3);margin-top:2px;">Digite <strong>DUAS LINHAS</strong> por bloco: 1: e 2:</div></div>
            </label>
          </div>
          <div id="bulk-text-bilingual-help" style="display:none;margin-bottom:8px;padding:10px 12px;background:rgba(20,184,166,0.06);border-radius:4px;border:1px solid rgba(20,184,166,0.2);">
            <div style="font-size:11px;color:#14b8a6;font-weight:700;margin-bottom:6px;">FORMATO DOIS IDIOMAS — cole assim:</div>
            <pre style="font-size:11px;color:var(--text2);margin:0;white-space:pre-wrap;line-height:1.6;background:#1a1a1a;padding:8px;border-radius:4px;">1: Era uma vez um herói...
2: Once upon a time a hero...

1: Ele viajou pelo mundo.
2: He traveled the world.</pre>
            <div style="font-size:10px;color:var(--text3);margin-top:6px;line-height:1.4;"><strong>Cada bloco</strong> separado por linha vazia = 1 página<br><strong>1:</strong> = primeiro idioma &nbsp;•&nbsp; <strong>2:</strong> = segundo idioma</div>
          </div>
          <textarea id="bulk-text-input" class="bulk-textarea" style="flex:1;min-height:220px;max-height:none;resize:none;" placeholder="Cole seu texto aqui...\n\nSepare cada parte com uma linha em branco.\nCada bloco de texto vira uma página.\n\nExemplo: este seria o texto da página 3." oninput="App._bulkTextPreview()"></textarea>
          <div id="bulk-text-feedback" class="bulk-feedback bulk-feedback-empty">
            <span class="bulk-feedback-icon">${Icons.info}</span>
            <span>Separe cada parte com uma <strong>linha em branco</strong> entre elas</span>
          </div>
          <div class="bulk-options" style="margin-top:10px;">
            <div class="bulk-opt-group">
              <label>Formato:</label>
              <select id="bulk-text-format" onchange="App._bulkTextPreview()">
                ${videoFormats.map(f => `<option value="${f.id}" ${f.id === 'vertical' ? 'selected' : ''}>${f.name}</option>`).join('')}
              </select>
            </div>
            <div class="bulk-opt-group">
              <label>Duração:</label>
              <select id="bulk-text-duration">
                <option value="3">3s</option>
                <option value="4" selected>4s</option>
                <option value="5">5s</option>
                <option value="6">6s</option>
                <option value="8">8s</option>
                <option value="10">10s</option>
              </select>
            </div>
            <div class="bulk-opt-group">
              <label>Texto visível:</label>
              <select id="bulk-text-show">
                <option value="true" selected>Sim (Overlay)</option>
                <option value="false">Não (só áudio)</option>
              </select>
            </div>
          </div>
        </div>
        <!-- RIGHT: Preview panel -->
        <div style="width:280px;flex-shrink:0;display:flex;flex-direction:column;">
          <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Preview das Páginas</div>
          <div id="bulk-text-preview" class="bulk-preview-panel">
            <div class="bulk-preview-empty">
              <div style="font-size:32px;opacity:0.3;margin-bottom:8px;">${Icons.file}</div>
              <div style="font-size:12px;color:var(--text4);">As páginas detectadas aparecerão aqui</div>
            </div>
          </div>
          <div id="bulk-text-stats" class="bulk-stats-bar">
            <span id="bulk-text-stats-text">Nenhuma página detectada</span>
          </div>
          <div id="bulk-text-warnings" class="bulk-warnings" style="display:none;"></div>
        </div>
      </div>
      <div class="bulk-modal-footer">
        <button class="btn btn-ghost" onclick="App.closeBulkTextModal()">Cancelar</button>
        <button class="btn btn-primary" id="bulk-text-create-btn" onclick="App.executeBulkTextImport()" disabled>Criar 0 Páginas</button>
      </div>
    </div>
  </div>`;
}

window.renderBulkTextModal = renderBulkTextModal;

/* ═══════════════════════════════════════════════════════════════
   BULK AUDIO IMPORT MODAL
   ═══════════════════════════════════════════════════════════════ */

function renderBulkAudioModal() {
  const videoFormats = Object.values(VIDEO_FORMATS);
  return `
  <div class="bulk-modal-overlay" id="bulk-audio-overlay" onclick="if(event.target===this)App.closeBulkAudioModal()">
    <div class="bulk-modal bulk-modal-wide" onclick="event.stopPropagation()">
      <div class="bulk-modal-header">
        <h2>${Icons.music} Criar Páginas de Áudio</h2>
        <button class="bulk-modal-close" onclick="App.closeBulkAudioModal()">✕</button>
      </div>
      <div class="bulk-modal-body">
        <div id="bulk-audio-upload-area" class="bulk-audio-upload">
          <div style="margin-bottom:12px;opacity:0.5;">${Icons.headphones}</div>
          <div style="font-weight:600;margin-bottom:8px;">Arraste um arquivo de áudio aqui</div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:16px;">MP3, WAV, OGG, M4A</div>
          <button class="btn btn-primary" onclick="document.getElementById('bulk-audio-file-input').click()">Escolher Arquivo</button>
          <input type="file" id="bulk-audio-file-input" accept="audio/*" style="display:none" onchange="App.handleBulkAudioFile(event)">
        </div>
        <div id="bulk-audio-loaded" style="display:none;">
          <div id="bulk-audio-info" class="bulk-audio-info"></div>
          <div class="bulk-audio-split-options">
            <label>Dividir por:</label>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="bulk-split-btn active" data-mode="silence" onclick="App.bulkAudioSplitMode('silence')">${Icons.volumeX} Silêncio (auto)</button>
              <button class="bulk-split-btn" data-mode="duration" onclick="App.bulkAudioSplitMode('duration')">${Icons.clock} Duração fixa</button>
              <button class="bulk-split-btn" data-mode="manual" onclick="App.bulkAudioSplitMode('manual')">${Icons.scissors} Manual</button>
            </div>
          </div>
          <div id="bulk-audio-silence-opts" class="bulk-audio-opts">
            <div class="bulk-opt-group">
              <label>Silêncio mínimo:</label>
              <select id="bulk-audio-min-silence" onchange="App.bulkAudioRedetect()">
                <option value="300">0.3s</option>
                <option value="500" selected>0.5s</option>
                <option value="800">0.8s</option>
                <option value="1000">1.0s</option>
                <option value="1500">1.5s</option>
                <option value="2000">2.0s</option>
              </select>
            </div>
            <div class="bulk-opt-group">
              <label>Sensibilidade:</label>
              <select id="bulk-audio-threshold" onchange="App.bulkAudioRedetect()">
                <option value="0.02">Muito sensível (detecta respiração)</option>
                <option value="0.03" selected>Normal (pausa entre frases)</option>
                <option value="0.05">Pouco sensível (silêncio longo)</option>
                <option value="0.08">Mínima (apenas silêncio total)</option>
              </select>
            </div>
          </div>
          <div id="bulk-audio-duration-opts" class="bulk-audio-opts" style="display:none;">
            <div class="bulk-opt-group" style="width:100%;">
              <label>Duração de cada segmento:</label>
              <div style="display:flex;align-items:center;gap:10px;">
                <input type="range" id="bulk-audio-seg-duration" min="2" max="30" value="5" step="1" oninput="App.bulkAudioResplit();document.getElementById('bulk-dur-val').textContent=this.value+'s'" style="flex:1;">
                <span id="bulk-dur-val" style="font-size:13px;font-weight:700;color:var(--accent);min-width:30px;">5s</span>
              </div>
              <div id="bulk-audio-dur-calc" style="font-size:10px;color:var(--text3);margin-top:4px;"></div>
            </div>
          </div>
          <div id="bulk-audio-manual-hint" class="bulk-feedback bulk-feedback-empty" style="display:none;">
            <span class="bulk-feedback-icon">${Icons.info}</span>
            <span>Clique na waveform para adicionar marcadores de corte. Clique no <strong>✕</strong> do marcador para removê-lo.</span>
          </div>
          <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;">
            <div class="bulk-opt-group">
              <label>Formato do projeto:</label>
              <select id="bulk-audio-format">
                ${videoFormats.map(f => `<option value="${f.id}" ${f.id === 'vertical' ? 'selected' : ''}>${f.name}</option>`).join('')}
              </select>
            </div>
            <div class="bulk-opt-group">
              <label style="display:flex;align-items:center;gap:4px;">🌐 Legendas:</label>
              <select id="bulk-audio-subtitle-mode">
                <option value="single-pt" selected>Apenas PT-BR</option>
                <option value="single-en">Apenas EN</option>
                <option value="dual">Bilíngue (PT + EN)</option>
              </select>
            </div>
          </div>
          <div id="bulk-audio-dual-hint" style="display:none;margin-top:6px;padding:6px 10px;background:rgba(0,212,255,0.04);border-radius:4px;border:1px dashed rgba(0,212,255,0.2);font-size:10px;color:#00d4ff;">
            Após criar as páginas, adicione a tradução EN na sidebar narrativa (Dual Track) ou use "Importar tradução EN em lote".
          </div>
          <div id="bulk-audio-waveform-container" class="bulk-waveform-container">
            <canvas id="bulk-audio-waveform" width="760" height="120" onclick="App.handleBulkAudioWaveformClick(event)" style="cursor:crosshair;"></canvas>
            <div id="bulk-audio-markers" class="bulk-audio-markers"></div>
          </div>
          <div id="bulk-audio-segments-info" class="bulk-stats"></div>
          <div id="bulk-audio-segment-list" class="bulk-preview-list"></div>
          <div id="bulk-audio-warnings" class="bulk-warnings" style="display:none;"></div>
        </div>
      </div>
      <div class="bulk-modal-footer">
        <button class="btn btn-ghost" onclick="App.closeBulkAudioModal()">Cancelar</button>
        <button class="btn btn-primary" id="bulk-audio-create-btn" onclick="App.executeBulkAudioImport()" disabled>Criar 0 Páginas</button>
      </div>
    </div>
  </div>`;
}

window.renderBulkAudioModal = renderBulkAudioModal;

/* ═══════════════════════════════════════════════════════════════
   EXPORT MODE SELECTOR MODAL — Choose format before export
   ═══════════════════════════════════════════════════════════════ */

function renderExportModeSelector() {
  const proj = Store.get('currentProject');
  if (!proj) return '';
  const presets = ExportPresets.getAll();
  const currentFormat = proj.videoFormat || 'vertical';
  const currentPresetId = Object.keys(EXPORT_MODE_PRESETS).find(k => ExportPresets.toVideoFormat(k) === currentFormat) || 'story';

  return `
  <div class="bulk-modal-overlay" id="export-mode-overlay" onclick="if(event.target===this)App.closeExportModeSelector()">
    <div class="bulk-modal" onclick="event.stopPropagation()">
      <div class="bulk-modal-header">
        <h2>${Icons.film} Escolha o Formato de Export</h2>
        <button class="bulk-modal-close" onclick="App.closeExportModeSelector()">✕</button>
      </div>
      <div class="bulk-modal-body">
        <p class="bulk-hint">Exporte o mesmo projeto em formatos diferentes sem refazer conteúdo. O texto e posição se adaptam automaticamente.</p>
        <div class="export-mode-grid">
          ${presets.map(p => {
            const isCurrent = ExportPresets.toVideoFormat(p.id) === currentFormat;
            const warnings = ExportPresets.getWarnings(proj, p.id);
            return `
            <div class="export-mode-card ${isCurrent ? 'current' : ''}" onclick="App.selectExportMode('${p.id}')">
              <div class="export-mode-icon">${p.icon}</div>
              <div class="export-mode-label">${p.label}</div>
              <div class="export-mode-desc">${p.description}</div>
              <div class="export-mode-res">${p.width}×${p.height}</div>
              ${isCurrent ? '<div class="export-mode-badge">Formato atual</div>' : ''}
              ${warnings.length > 0 ? `<div class="export-mode-warning">${Icons.alert} ${warnings.length} aviso(s)</div>` : ''}
            </div>`;
          }).join('')}
        </div>
        <div id="export-mode-warnings" class="export-mode-warnings-list"></div>
      </div>
      <div class="bulk-modal-footer">
        <button class="btn btn-ghost" onclick="App.closeExportModeSelector()">Cancelar</button>
      </div>
    </div>
  </div>`;
}

window.renderExportModeSelector = renderExportModeSelector;

/* ═══════════════════════════════════════════════════════════════
   BULK AUDIO WAVEFORM RENDERER
   ═══════════════════════════════════════════════════════════════ */

function drawBulkAudioWaveform() {
  const canvas = document.getElementById('bulk-audio-waveform');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const waveform = BulkAudioImporter.getWaveformData();
  const segments = BulkAudioImporter.getSegments();
  const buffer = BulkAudioImporter.getBuffer();
  if (!waveform || !buffer) return;
  const duration = buffer.duration;

  // Draw segment backgrounds
  const colors = ['rgba(99,102,241,0.15)', 'rgba(107,114,128,0.15)', 'rgba(245,158,11,0.15)', 'rgba(239,68,68,0.15)', 'rgba(34,197,94,0.15)'];
  segments.forEach((seg, i) => {
    const x1 = (seg.start / duration) * w;
    const x2 = (seg.end / duration) * w;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x1, 0, x2 - x1, h);
  });

  // Draw waveform bars
  const barW = w / waveform.length;
  waveform.forEach((peak, i) => {
    const barH = peak * h * 0.8;
    const x = i * barW;
    const y = (h - barH) / 2;
    ctx.fillStyle = 'rgba(99,102,241,0.7)';
    ctx.fillRect(x, y, Math.max(1, barW - 0.5), barH);
  });

  // Draw segment boundaries
  segments.forEach((seg, i) => {
    if (i === 0) return;
    const x = (seg.start / duration) * w;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Draw segment numbers
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  segments.forEach((seg, i) => {
    const x1 = (seg.start / duration) * w;
    const x2 = (seg.end / duration) * w;
    const cx = (x1 + x2) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`${i + 1}`, cx, h - 6);
  });

  // Update markers overlay
  const markersDiv = document.getElementById('bulk-audio-markers');
  if (markersDiv) {
    markersDiv.innerHTML = segments.map((seg, i) => {
      if (i === 0) return '';
      const pct = (seg.start / duration) * 100;
      return `<div class="bulk-audio-marker" style="left:${pct}%;">
        <div class="bulk-audio-marker-line"></div>
        <button class="bulk-audio-marker-del" onclick="event.stopPropagation();App.removeBulkAudioBoundary(${i})" title="Remover">✕</button>
      </div>`;
    }).join('');
  }

  // Update segments list with play buttons
  const listEl = document.getElementById('bulk-audio-segment-list');
  if (listEl) {
    listEl.innerHTML = segments.map((seg, i) => {
      const isShort = seg.duration < 1.5;
      const isLong = seg.duration > 30;
      const warnClass = isShort ? 'bulk-seg-short' : isLong ? 'bulk-seg-long' : '';
      return `
      <div class="bulk-preview-item ${warnClass}">
        <button class="bulk-seg-play-btn" data-seg="${i}" onclick="event.stopPropagation();App.playBulkAudioSegment(${i})" title="Ouvir segmento ${i+1}">${Icons.play}</button>
        <span class="bulk-preview-num">${i + 1}</span>
        <span class="bulk-preview-text">${BulkAudioImporter.formatTime(seg.start)} → ${BulkAudioImporter.formatTime(seg.end)}</span>
        <span class="bulk-preview-meta">${seg.duration.toFixed(1)}s</span>
      </div>`;
    }).join('');
  }

  // Update stats
  const statsEl = document.getElementById('bulk-audio-segments-info');
  if (statsEl) {
    const totalDur = segments.reduce((s, seg) => s + seg.duration, 0);
    statsEl.textContent = `${segments.length} segmentos · ${BulkAudioImporter.formatTime(totalDur)} total`;
  }

  // Warnings
  const warningsEl = document.getElementById('bulk-audio-warnings');
  if (warningsEl) {
    const warnings = [];
    segments.forEach((seg, i) => {
      if (seg.duration < 1.5) warnings.push(`Segmento ${i+1} muito curto (${seg.duration.toFixed(1)}s)`);
      if (seg.duration > 30) warnings.push(`Segmento ${i+1} muito longo (${seg.duration.toFixed(1)}s)`);
    });
    if (warnings.length > 0) {
      warningsEl.style.display = 'block';
      warningsEl.innerHTML = warnings.map(w => `<div class="bulk-warning-item">${Icons.alert} ${w}</div>`).join('');
    } else {
      warningsEl.style.display = 'none';
    }
  }

  // Update button
  const btn = document.getElementById('bulk-audio-create-btn');
  if (btn) {
    btn.disabled = segments.length === 0;
    btn.textContent = `Criar ${segments.length} Páginas`;
  }
}

window.drawBulkAudioWaveform = drawBulkAudioWaveform;
