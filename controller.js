/* ═══════════════════════════════════════════════════════════════
   HQ MOVIE — Controller v12
   Zoom, Guides, Auto-Layout, Full Feature Set
   ═══════════════════════════════════════════════════════════════ */

const App = {
    
    async init() {
        // Wait for i18n to load translations before rendering UI
        if (window.i18n && window.i18n.ready) {
            await window.i18n.ready();
        }
        
        await Store.loadProjects();
        
        // Initialize Onboarding
        if (typeof Onboarding !== 'undefined') Onboarding.init();
        
        Store.subscribe(() => {
            this.render();
            // Check onboarding on every render
            if (typeof Onboarding !== 'undefined') Onboarding.check(Store.get('view'));
        });
        
        this.render();
        // Check initial view for onboarding
        if (typeof Onboarding !== 'undefined') Onboarding.check(Store.get('view'));

        this._bindTextInputGuard(); // Must be first — stops propagation before _bindKeys sees events
        this._bindKeys();
        this._bindPaste();
        

        // Global dragend cleanup — fixes canvas verde bug where drop-active state gets stuck
        document.addEventListener('dragend', () => {
            document.querySelectorAll('.drop-active').forEach(el => {
                el.classList.remove('drop-active');
                el.dataset.dragCount = 0;
            });
        });
        window.addEventListener('resize', () => { if (Store.get('view') === 'editor') renderCanvas(); });
        window.addEventListener('beforeunload', (e) => {
            if (Store.get('view') === 'editor' && Store.get('currentProject')) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },

    // ── Runtime Auto-Fixer for Legacy Typography ──
    _enforceVideoTypography() {
        const p = Store.get('currentProject');
        if (!p) return;
        
        let changed = false;
        p.pages.forEach(page => {
            // Fix Narrative
            if (page.narrativeStyle && (page.narrativeStyle.size < 30)) {
                page.narrativeStyle.size = 48;
                changed = true;
            }
            
            // Fix Balloons
            if (page.texts) {
                page.texts.forEach(t => {
                    const minSize = t.type === 'sfx' ? 72 : 32;
                    if (!t.fontSize || t.fontSize < 20) { // Aggressive fix for tiny text
                        t.fontSize = minSize;
                        changed = true;
                    }
                });
            }
        });
        
        if (changed) {
            Store.setSilent({ currentProject: p });
            Store.save();
        }
    },

    render() {
        const app = document.getElementById('app');
        
        // Run auto-fixer on every render cycle to catch loaded projects
        this._enforceVideoTypography();

        // GUARD: Don't destroy DOM if user is actively editing text (preserves focus)
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.isContentEditable || activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && !['checkbox','radio','range','color'].includes((activeEl.type||'').toLowerCase())))) {
            // Only do safe partial updates that don't nuke the DOM
            if (Store.get('view') === 'editor') {
                renderRightPanel();
            }
            return;
        }

        const view = Store.get('view');
        if (view === 'dashboard') {
            this.hideFloatingTextToolbar();
            app.innerHTML = renderDashboard();
            renderProjectsList();
        } else if (view === 'format-selector') {
            this.hideFloatingTextToolbar();
            app.innerHTML = renderFormatSelector();
        } else if (view === 'export') {
            this.hideFloatingTextToolbar();
            app.innerHTML = renderExportPage();
            requestAnimationFrame(() => this._updateAssetSummary());
        } else {
            app.innerHTML = renderEditor();
            renderPageList();
            renderCanvas();
            renderRightPanel();
            renderTimeline();
            if (typeof renderPageCarousel === 'function') renderPageCarousel();
            requestAnimationFrame(() => this._initViewportEvents());
        }
    },

    _blurActive() {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    },

    // ── Projects ──
    async newProject(videoFormat = 'vertical') {
        this._blurActive();
        const p = createVideoProject('My Project', videoFormat);
        await db.projects.put(p);
        await Store.loadProjects();
        Store.set({ view: 'editor', currentProject: p, activePageIndex: 0, selectedElement: null, selectedSlot: -1, undoStack: [], redoStack: [] });
        // Auto-fit canvas to viewport after render (critical for mobile)
        requestAnimationFrame(() => { requestAnimationFrame(() => { this.zoomFit(); }); });
    },
    
    showFormatSelector() {
        this._blurActive();
        Store.set({ view: 'format-selector' });
    },
    
    async selectVideoFormat(formatId) {
        await this.newProject(formatId);
    },
    
    async createFromTemplate(templateId) {
        this._blurActive();
        
        const templates = {
            'motion-comic': { name: 'Motion Comic', pages: 4, layout: 'v4-grid', format: 'vertical' },
            'podcast': { name: 'Podcast Visual', pages: 8, layout: '1p-full', format: 'vertical' },
            'tutorial': { name: 'Tutorial', pages: 6, layout: 'v2-split', format: 'vertical' },
            'story': { name: 'Story Instagram', pages: 5, layout: '1p-full', format: 'vertical' },
            'meme': { name: 'Meme Animado', pages: 3, layout: '1p-full', format: 'square' }
        };
        
        const t = templates[templateId];
        if (!t) return;
        
        const p = createVideoProject(t.name, t.format);
        p.pages = [];
        
        for (let i = 0; i < t.pages; i++) {
            p.pages.push({
                id: genId(),
                layoutId: t.layout,
                images: [],
                texts: [],
                showTextBelow: templateId === 'tutorial', // Tutorial shows text below by default
                narrative: '',
                duration: 2.5
            });
        }
        
        await db.projects.put(p);
        await Store.loadProjects();
        Store.set({ view: 'editor', currentProject: p, activePageIndex: 0, selectedElement: null, selectedSlot: -1, undoStack: [], redoStack: [] });
        Toast.show(t('toast.projectCreated', { name: t.name }), 'success');
    },

    async createDemoProject() {
        const lorem = [
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            "Ut enim ad minim veniam, quis nostrud exercitation.",
            "Duis aute irure dolor in reprehenderit in voluptate.",
            "Excepteur sint occaecat cupidatat non proident.",
            "Sunt in culpa qui officia deserunt mollit anim.",
            "Quis autem vel eum iure reprehenderit qui in ea voluptate.",
            "Nemo enim ipsam voluptatem quia voluptas sit aspernatur.",
            "Neque porro quisquam est, qui dolorem ipsum quia dolor.",
            "At vero eos et accusamus et iusto odio dignissimos.",
            "Nam libero tempore, cum soluta nobis est eligendi.",
            "Temporibus autem quibusdam et aut officiis debitis."
        ];
        // Real images from /img/ folder
        const realImages = [
            'img/Desenhos-dos-anos-2000-danny.jpg',
            'img/desenhos-globo90.jpg',
            'img/Monica5-1-.webp',
            'img/disney-ilustrações-retratos-heroínas-rapunzel.jpg',
            'img/os-flintstones.jpeg',
            'img/super_imganimaniacs-desenho-anos-90.webp',
            'img/these-are-my-favourite-cartoon-intros-of-all-time-what-are-v0-rzqgaop2tz9e1.webp',
            'img/who-is-your-favorite-cartoon-mother-v0-sqdy424isk6f1.webp',
            'img/how-would-you-describe-disneys-early-2000s-2d-art-styles-i-v0-ljx0v36p7sh81.jpg',
            'img/images.jpeg'
        ];
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085'];
        const layouts = ['v1-splash', 'v2-split', 'v3-stack', 'v4-grid'];
        const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
        const balloonTypes = ['speech', 'thought', 'shout', 'narration', 'whisper', 'sfx'];
        
        const createColorImage = (color, w = 400, h = 300) => {
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, w, h);
            // Add subtle gradient overlay
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, 'rgba(255,255,255,0.1)');
            grad.addColorStop(1, 'rgba(0,0,0,0.1)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
            return canvas.toDataURL('image/png');
        };
        
        // Helper to get image (real or fallback to color)
        const getImage = (index) => realImages[index % realImages.length] || createColorImage(colors[index % colors.length]);
        
        const p = createVideoProject('Demo HQ Movie', 'vertical');
        p.pages = [];
        
        // Page 1: Full page splash with real cartoon image
        p.pages.push({
            id: genId(), layoutId: 'v1-splash',
            images: [{ id: genId(), src: getImage(0), filters: { brightness: 100, contrast: 100 } }],
            texts: [
                { type: 'speech', x: 80, y: 60, w: 200, h: 110, text: 'Olá! Bem-vindo ao mundo dos quadrinhos!', direction: 'sw', font: 'comic' },
                { type: 'thought', x: 420, y: 180, w: 180, h: 100, text: 'Que aventura nos espera...', direction: 'se', font: 'marker' },
                { type: 'sfx', x: 500, y: 400, w: 140, h: 70, text: 'POW!', direction: 'center', font: 'comic', fontSize: 32 }
            ],
            showTextBelow: false, narrative: ''
        });
        
        // Page 2: 2 panels vertical with dialogue
        p.pages.push({
            id: genId(), layoutId: 'v2-split',
            images: [
                { id: genId(), src: getImage(1), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(2), filters: { brightness: 100, contrast: 100 } }
            ],
            texts: [
                { type: 'speech', x: 50, y: 80, w: 180, h: 90, text: 'Você viu aquilo?!', direction: 's', font: 'comic' },
                { type: 'whisper', x: 400, y: 100, w: 160, h: 80, text: 'Shh... não faça barulho...', direction: 'sw', font: 'comic' },
                { type: 'shout', x: 300, y: 550, w: 200, h: 100, text: 'CUIDADO!', direction: 'n', font: 'comic' }
            ],
            showTextBelow: true, narrative: 'Enquanto isso, nossos heróis descobrem um segredo misterioso...'
        });
        
        // Page 3: 3 panels with narration
        p.pages.push({
            id: genId(), layoutId: 'v3-stack',
            images: [
                { id: genId(), src: getImage(3), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(4), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(5), filters: { brightness: 100, contrast: 100 } }
            ],
            texts: [
                { type: 'narration', x: 20, y: 20, w: 250, h: 70, text: 'Era uma vez, em um lugar distante...', direction: 'center', font: 'serif' },
                { type: 'speech', x: 100, y: 380, w: 170, h: 95, text: 'Vamos nessa!', direction: 'e', font: 'comic' },
                { type: 'sfx', x: 450, y: 700, w: 120, h: 60, text: 'ZOOM!', direction: 'center', font: 'comic', fontSize: 26 }
            ],
            showTextBelow: false, narrative: ''
        });
        
        // Page 4: 4 panel grid - conversation
        p.pages.push({
            id: genId(), layoutId: 'v4-grid',
            images: [
                { id: genId(), src: getImage(6), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(7), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(8), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(9), filters: { brightness: 100, contrast: 100 } }
            ],
            texts: [
                { type: 'speech', x: 30, y: 50, w: 160, h: 85, text: 'O que faremos agora?', direction: 's', font: 'comic' },
                { type: 'speech', x: 380, y: 50, w: 160, h: 85, text: 'Tenho um plano!', direction: 'sw', font: 'comic' },
                { type: 'thought', x: 30, y: 550, w: 160, h: 85, text: 'Será que vai funcionar?', direction: 'ne', font: 'marker' },
                { type: 'speech', x: 380, y: 550, w: 160, h: 85, text: 'Confie em mim!', direction: 'nw', font: 'comic' }
            ],
            showTextBelow: false, narrative: ''
        });
        
        // Page 5: With Text Below enabled - narrative focus
        p.pages.push({
            id: genId(), layoutId: 'v3-stack',
            images: [
                { id: genId(), src: getImage(0), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(3), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(6), filters: { brightness: 100, contrast: 100 } }
            ],
            texts: [
                { type: 'narration', x: 20, y: 20, w: 280, h: 60, text: 'Capítulo 2: A Jornada Continua', direction: 'center', font: 'serif' }
            ],
            showTextBelow: true,
            narrative: 'E assim, após muitas aventuras, nossos heróis finalmente encontraram o caminho para casa. Mas a jornada estava apenas começando...'
        });
        
        // Page 6: Action sequence
        p.pages.push({
            id: genId(), layoutId: 'v2-split',
            images: [
                { id: genId(), src: getImage(1), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(4), filters: { brightness: 100, contrast: 100 } }
            ],
            texts: [
                { type: 'speech', x: 50, y: 100, w: 180, h: 100, text: 'Agora é a hora!', direction: 'e', font: 'comic' },
                { type: 'sfx', x: 400, y: 300, w: 180, h: 90, text: 'CRASH!', direction: 'center', font: 'comic', fontSize: 120 },
                { type: 'shout', x: 200, y: 750, w: 200, h: 110, text: 'VITÓRIA!', direction: 'n', font: 'comic' }
            ],
            showTextBelow: false, narrative: ''
        });
        
        // Page 7: 5 panel finale
        p.pages.push({
            id: genId(), layoutId: 'v4-grid',
            images: [
                { id: genId(), src: getImage(2), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(5), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(8), filters: { brightness: 100, contrast: 100 } },
                { id: genId(), src: getImage(7), filters: { brightness: 100, contrast: 100 } }
            ],
            texts: [
                { type: 'narration', x: 250, y: 10, w: 220, h: 60, text: 'Capítulo Final', direction: 'center', font: 'serif' },
                { type: 'speech', x: 30, y: 150, w: 150, h: 80, text: 'Conseguimos!', direction: 'se', font: 'comic' },
                { type: 'whisper', x: 500, y: 600, w: 140, h: 70, text: 'Até a próxima...', direction: 'nw', font: 'marker' }
            ],
            showTextBelow: false, narrative: ''
        });
        
        // Page 8: Empty page for user testing
        p.pages.push({
            id: genId(), layoutId: 'v4-grid',
            images: [],
            texts: [],
            showTextBelow: false, narrative: ''
        });
        
        Library.syncFromPages(p);
        await db.projects.put(p);
        await Store.loadProjects();
        Store.set({ view: 'editor', currentProject: p, activePageIndex: 0, selectedElement: null, selectedSlot: -1 });
        Toast.show(t('toast.demoCreated'), 'success');
    },
    async openProject(id) {
        const p = await db.projects.get(id);
        if (!p) return;
        // Migration: clear corrupt panelOverrides from all pages
        let migrated = false;
        if (p.pages) {
            p.pages.forEach(page => {
                if (page.panelOverrides && Object.keys(page.panelOverrides).length > 0) {
                    delete page.panelOverrides;
                    migrated = true;
                }
            });
        }
        // Migration: add customLayouts and favoriteLayoutId if missing
        if (!p.customLayouts) { p.customLayouts = []; migrated = true; }
        if (p.favoriteLayoutId === undefined) { p.favoriteLayoutId = null; migrated = true; }
        // Migration: HQ Movie video-specific fields
        if (!p.videoFormat) { p.videoFormat = 'vertical'; migrated = true; }
        if (!p.videoAudio) { 
            p.videoAudio = { background: { file: null, volume: 0.6, loop: true, fadeIn: 1, fadeOut: 2 }, pages: [] }; 
            migrated = true; 
        }
        if (!p.timeline) { 
            p.timeline = { defaultDuration: 2.5, transition: 'fade', transitionDuration: 0.5 }; 
            migrated = true; 
        }
        // Migration: clean old page-level effects system, init per-image effect fields
        if (p.pages) {
            p.pages.forEach(page => {
                if (page.effects || page.effectsPreset !== undefined) {
                    delete page.effects;
                    delete page.effectsPreset;
                    migrated = true;
                }
                (page.images || []).forEach(img => {
                    if (!img) return;
                    if ('screentone' in img || 'inkBleed' in img || 'paperTexture' in img || 'grain' in img || 'sharpness' in img) {
                        delete img.screentone; delete img.inkBleed; delete img.paperTexture; delete img.grain; delete img.sharpness;
                        migrated = true;
                    }
                    if (img.effect === undefined) { img.effect = null; migrated = true; }
                    if (img.loading) { delete img.loading; migrated = true; }
                    if (!img.transform) { img.transform = { scale: 1, x: 0, y: 0 }; migrated = true; }
                    if (img.srcOriginal === undefined) { img.srcOriginal = null; migrated = true; }
                });
                // Migration: init page-level fields added after v1
                if (!page.recordatorios) { page.recordatorios = []; migrated = true; }
                if (!page.stickers) { page.stickers = []; migrated = true; }
                if (page.plannedCount === undefined) { page.plannedCount = 0; migrated = true; }
                if (page.materiaTitle === undefined) { page.materiaTitle = ''; migrated = true; }
                if (!page.materiaTexts) { page.materiaTexts = {}; migrated = true; }
                if (!page.narrativeHeight) { page.narrativeHeight = 120; migrated = true; }
                if (!page.narrativeStyle) { page.narrativeStyle = { align: 'justify', font: 'serif', size: 48, color: '#ffffff', leading: 1.4, bgOpacity: 0.55 }; migrated = true; }
                if (page.narrativeStyle && page.narrativeStyle.color === '#333333') { page.narrativeStyle.color = '#ffffff'; migrated = true; }
                if (page.narrativeStyle && page.narrativeStyle.bgOpacity === undefined) { page.narrativeStyle.bgOpacity = 0.55; migrated = true; }
                if (page.narrativeStyle && page.narrativeStyle.bgOpacity === 1 && !page.narrativeStyle.bgColor) { page.narrativeStyle.bgOpacity = 0.55; migrated = true; }
                if (!page.materiaZones) { page.materiaZones = {}; migrated = true; }
                // Migration: HQ Movie page duration and Ken Burns
                if (page.duration === undefined) { page.duration = 2.5; migrated = true; }
                if (page.durationLocked === undefined) { page.durationLocked = false; migrated = true; }
                if (!page.kenBurns) { page.kenBurns = 'zoom-in'; migrated = true; }
                if (!page.transition) { page.transition = 'fade'; migrated = true; }
                // Migration: Slideshow mode - convert images to slides if layoutId is slideshow
                if (page.layoutId === 'slideshow' && !page.slides) {
                    page.slides = (page.images || []).map((img, i) => ({
                        id: genId(),
                        image: img.src,
                        duration: page.duration / Math.max(1, (page.images || []).length),
                        kenBurns: page.kenBurns || 'zoom-in',
                        transition: i === 0 ? 'cut' : 'crossfade',
                        transitionDuration: 0.5,
                        panX: img.panX || 0,
                        panY: img.panY || 0,
                        zoom: img.zoom || 1.0
                    }));
                    migrated = true;
                }
                // Migration: Initialize slides array for all pages
                if (!page.slides) { page.slides = []; migrated = true; }
                // Migration: normalize balloon fields (legacy-safe)
                (page.texts || []).forEach(t => {
                    if (!t || typeof t !== 'object') return;
                    if (!t.type) { t.type = 'speech'; migrated = true; }
                    if (t.x === undefined) { t.x = 100; migrated = true; }
                    if (t.y === undefined) { t.y = 100; migrated = true; }
                    if (t.w === undefined) { t.w = t.type === 'narration' ? 220 : 180; migrated = true; }
                    if (t.h === undefined) { t.h = t.type === 'narration' ? 80 : 100; migrated = true; }
                    if (t.text === undefined) { t.text = ''; migrated = true; }
                    if (!t.direction) { t.direction = t.type === 'sfx' ? 'center' : 's'; migrated = true; }
                    if (!t.font) { t.font = t.type === 'narration' ? 'serif' : 'comic'; migrated = true; }
                    if (!t.fontSize) {
                        const byType = { speech: 15, thought: 15, shout: 20, whisper: 12, narration: 13, sfx: 42 };
                        t.fontSize = byType[t.type] || 15;
                        migrated = true;
                    }
                    if (t.type === 'narration' && !t.snapPosition) { t.snapPosition = 'top'; migrated = true; }
                    if (t.type === 'narration' && t.cornerRadius === undefined) { t.cornerRadius = 4; migrated = true; }
                    if (t.type === 'narration' && !t.bgColor) { t.bgColor = '#fffde7'; migrated = true; }
                    // Migration v89: text formatting fields
                    if (t.bold === undefined) { t.bold = false; migrated = true; }
                    if (t.italic === undefined) { t.italic = false; migrated = true; }
                    if (t.underline === undefined) { t.underline = false; migrated = true; }
                    if (t.textAlign === undefined) { t.textAlign = 'center'; migrated = true; }
                });
            });
        }
        // Migration: project-level backCover
        if (p.backCover === undefined) { p.backCover = null; migrated = true; }
        // Migration: Multi-language support
        if (!p.defaultLanguage) { p.defaultLanguage = 'pt-BR'; migrated = true; }
        if (!p.languages) { p.languages = ['pt-BR', 'en']; migrated = true; }
        if (!p.activeLanguage) { p.activeLanguage = 'pt-BR'; migrated = true; }
        // Migration: Narrative Track system
        if (!p.narrativeMode) { p.narrativeMode = 'per-page'; migrated = true; }
        if (!p.narrativePosition) { p.narrativePosition = 'bottom'; migrated = true; }
        if (!p.narrativeSegments) { p.narrativeSegments = []; migrated = true; }
        // Migration: Ducking support
        if (p.videoAudio && !p.videoAudio.ducking) { 
            p.videoAudio.ducking = { enabled: true, level: 0.15, fadeMs: 200 }; 
            migrated = true; 
        }
        // Migration: Page narrative string → multi-lang object
        if (p.pages) {
            p.pages.forEach(page => {
                if (typeof page.narrative === 'string') {
                    page.narrative = { 'pt-BR': page.narrative, 'en': '' };
                    migrated = true;
                }
                if (!page.narrative) {
                    page.narrative = { 'pt-BR': '', 'en': '' };
                    migrated = true;
                }
                if (page.narrativeSegmentId === undefined) {
                    page.narrativeSegmentId = null;
                    migrated = true;
                }
                // Migration: Balloon text string → multi-lang object
                (page.texts || []).forEach(t => {
                    if (t && typeof t.text === 'string') {
                        t.text = { 'pt-BR': t.text, 'en': '' };
                        migrated = true;
                    }
                });
            });
        }
        // Migration: VideoAudio pages narration → multi-lang
        if (p.videoAudio && p.videoAudio.pages) {
            p.videoAudio.pages.forEach(pa => {
                if (pa.narration && pa.narration.file !== undefined) {
                    // Old format: { file, volume, duration }
                    // New format: { 'pt-BR': { file, volume, duration }, 'en': {...} }
                    const oldNarr = pa.narration;
                    pa.narration = {
                        'pt-BR': { file: oldNarr.file, volume: oldNarr.volume || 0.9, duration: oldNarr.duration || 0 },
                        'en': { file: null, volume: 0.9, duration: 0 }
                    };
                    migrated = true;
                }
            });
        }
        if (migrated) {
            await db.projects.put(p);
        }
        Library.syncFromPages(p);
        Store.set({ view: 'editor', currentProject: p, activePageIndex: 0, selectedElement: null, selectedSlot: -1, undoStack: [], redoStack: [] });
        // Auto-fit canvas to viewport after render
        requestAnimationFrame(() => { this.zoomFit(); });
    },
    async openExportPage() {
        this._blurActive();
        Store.set({ view: 'export', selectedElement: null, selectedSlot: -1 });
    },
    goHome() { 
        this._blurActive();
        Store.set({ view: 'dashboard', currentProject: null, selectedElement: null, selectedSlot: -1 });
        Store.loadProjects(); 
    },
    
    // ── Project Export/Import ──
    async exportProjectFile() {
        const p = Store.get('currentProject');
        if (!p) return;
        
        try {
            Toast.show(t('toast.preparingExport'), 'info');
            
            const zip = new JSZip();
            
            // Deep clone to avoid modifying active state
            const projectData = JSON.parse(JSON.stringify(p));
            
            // In a more complex app we would extract base64 images to separate files in the ZIP
            // to save memory and parsing time. But for 'Launch & Leave' resilience, a single JSON
            // inside the ZIP is the safest and most portable method.
            
            zip.file('project.json', JSON.stringify(projectData));
            
            const content = await zip.generateAsync({ type: 'blob' });
            
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            const cleanName = (p.metadata.name || 'projeto').toLowerCase().replace(/[^a-z0-9]/g, '-');
            a.download = `hq-${cleanName}.hq`;
            a.click();
            
            Toast.show(t('toast.projectSaved'), 'success');
        } catch (e) {
            console.error(e);
            Toast.show(t('toast.exportError'), 'error');
        }
    },
    
    async importProject(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            Toast.show(t('toast.readingFile'), 'info');
            
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            
            const jsonFile = contents.file('project.json');
            if (!jsonFile) {
                throw new Error("Arquivo .hq inválido. project.json não encontrado.");
            }
            
            const jsonString = await jsonFile.async('string');
            const projectData = JSON.parse(jsonString);
            
            // Ensure unique ID to avoid overwriting existing project
            projectData.id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
            projectData.metadata.updatedAt = Date.now();
            projectData.metadata.name = `${projectData.metadata.name} (Importado)`;
            
            await db.projects.put(projectData);
            await Store.loadProjects();
            
            Toast.show(t('toast.projectImported'), 'success');
        } catch (e) {
            console.error(e);
            Toast.show(t('toast.importError'), 'error');
        }
        
        // Reset file input so same file can be selected again
        event.target.value = '';
    },

    async deleteProjectConfirm(id) { if (!confirm(t('confirm.deleteProject'))) return; await Store.deleteProject(id); Toast.show(t('toast.deleted'), 'info'); },
    renameProject(name) { const p = Store.get('currentProject'); if (!p) return; p.metadata.name = name.trim() || t('placeholder.noName'); Store.set({ currentProject: p }); Store.save(); },

    // ── Cover Page ──
    addCover() {
        const p = Store.get('currentProject'); if (!p) return;
        if (p.cover) { this.setActiveCover(); Toast.show(t('toast.coverExists'), 'info'); return; }
        Store.pushUndo();
        p.cover = createCover(p.metadata.name);
        Store.set({ currentProject: p, coverActive: true, selectedElement: null, selectedSlot: -1 });
        Store.save();
        Toast.show(t('toast.coverCreated'), 'success', 4000);
    },
    setActiveCover() {
        const p = Store.get('currentProject'); if (!p || !p.cover) return;
        if (Store.get('coverActive')) {
            this.setActivePage(0);
            return;
        }
        if (p) Library.syncFromPages(p);
        Store.set({ coverActive: true, backCoverActive: false, selectedElement: null, selectedSlot: -1 });
        this.resetPan();
        this.resetPasteIndex();
    },
    removeCover() {
        const p = Store.get('currentProject'); if (!p || !p.cover) return;
        if (!confirm(t('confirm.removeCover'))) return;
        Store.pushUndo();
        p.cover = null;
        Store.set({ currentProject: p, coverActive: false, activePageIndex: 0, selectedElement: null, selectedSlot: -1 });
        Store.save();
        Toast.show(t('toast.coverRemoved'), 'info');
    },

    // ── Back Cover (Contracapa) ──
    addBackCover() {
        const p = Store.get('currentProject'); if (!p) return;
        if (p.backCover) { this.setActiveBackCover(); Toast.show(t('toast.backCoverExists'), 'info'); return; }
        Store.pushUndo();
        p.backCover = createBackCover();
        // Pre-fill synopsis from cover if available
        if (p.cover && p.cover.synopsis) p.backCover.synopsis = p.cover.synopsis;
        Store.set({ currentProject: p, backCoverActive: true, coverActive: false, selectedElement: null, selectedSlot: -1 });
        Store.save();
        Toast.show(t('toast.backCoverCreated'), 'success', 4000);
    },
    setActiveBackCover() {
        const p = Store.get('currentProject'); if (!p || !p.backCover) return;
        if (Store.get('backCoverActive')) {
            this.setActivePage(0);
            return;
        }
        Store.set({ backCoverActive: true, coverActive: false, selectedElement: null, selectedSlot: -1 });
        this.resetPan();
    },
    removeBackCover() {
        const p = Store.get('currentProject'); if (!p || !p.backCover) return;
        if (!confirm(t('confirm.removeBackCover'))) return;
        Store.pushUndo();
        p.backCover = null;
        Store.set({ currentProject: p, backCoverActive: false, activePageIndex: 0, selectedElement: null, selectedSlot: -1 });
        Store.save();
        Toast.show(t('toast.backCoverRemoved'), 'info');
    },
    applyBackCoverTemplate(templateId) {
        const p = Store.get('currentProject'); if (!p || !p.backCover) return;
        const tmpl = BACKCOVER_TEMPLATES[templateId];
        if (!tmpl) return;
        Store.pushUndo();
        p.backCover.template = templateId;
        p.backCover.elements = JSON.parse(JSON.stringify(tmpl.elements)).map(el => ({ ...el, id: genId() }));
        if (tmpl.bgColor) p.backCover.backgroundColor = tmpl.bgColor;
        // Pre-fill synopsis element from cover metadata
        if (p.cover && p.cover.synopsis) {
            const synEl = p.backCover.elements.find(el => el.role === 'synopsis');
            if (synEl) synEl.text = p.cover.synopsis;
        }
        Store.set({ currentProject: p }); Store.save();
        Toast.show(t('toast.backCoverTemplateApplied', { name: tmpl.name }), 'success');
        renderCanvas(); renderRightPanel();
    },

    applyCoverTemplate(templateId) {
        const p = Store.get('currentProject'); if (!p || !p.cover) return;
        const tmpl = COVER_TEMPLATES[templateId];
        if (!tmpl) return;
        Store.pushUndo();
        p.cover.template = templateId;
        p.cover.elements = JSON.parse(JSON.stringify(tmpl.elements)).map(el => ({ ...el, id: genId() }));
        // Apply template background color
        if (tmpl.bgColor) p.cover.backgroundColor = tmpl.bgColor;
        // Pre-fill title from metadata if not set
        const titleEl = p.cover.elements.find(el => el.role === 'title');
        if (titleEl && p.cover.title) titleEl.text = p.cover.title;
        // Auto-scale font for large-title templates to prevent overflow
        if (titleEl && titleEl.style && titleEl.style.fontSize >= 48) {
            const maxW = titleEl.width || 634;
            titleEl.style.fontSize = autoScaleFontSize(titleEl.text, titleEl.style.fontSize, maxW);
        }
        // Also auto-scale subtitle if it's large
        const subtitleEl = p.cover.elements.find(el => el.role === 'subtitle');
        if (subtitleEl && subtitleEl.style && subtitleEl.style.fontSize >= 72) {
            const maxW = subtitleEl.width || 634;
            subtitleEl.style.fontSize = autoScaleFontSize(subtitleEl.text, subtitleEl.style.fontSize, maxW);
        }
        const authorEl = p.cover.elements.find(el => el.role === 'author');
        if (authorEl && p.cover.author) authorEl.text = p.cover.author;
        Store.set({ currentProject: p });
        Store.save();
        Toast.show(t('toast.templateApplied', { name: tmpl.name }), 'success');
        renderCanvas(); renderRightPanel();
    },
    _coverMetaSaveTimeout: null,
    updateCoverMeta(field, value) {
        const p = Store.get('currentProject'); if (!p || !p.cover) return;
        p.cover[field] = value;
        if (field === 'title') {
            p.metadata.name = value;
            const input = document.querySelector('.project-name-input');
            if (input) input.value = p.metadata.name;
        }
        
        Store.setSilent({ currentProject: p });
        clearTimeout(this._coverMetaSaveTimeout);
        this._coverMetaSaveTimeout = setTimeout(() => {
            Store.save();
        }, 500);
        
        // Atualiza a barra superior da contracapa se for edição da sinopse
        if (field === 'synopsis' && p.backCover) {
            p.backCover.synopsis = value;
        }
    },
    setCoverBackground(src) {
        const p = Store.get('currentProject'); if (!p || !p.cover) return;
        Store.pushUndo();
        p.cover.backgroundImage = src;
        p._thumbDirty = true;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    setCoverBgColor(color) {
        const p = Store.get('currentProject'); if (!p || !p.cover) return;
        p.cover.backgroundColor = color;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    toggleCoverGuide(guide) {
        const p = Store.get('currentProject'); if (!p || !p.cover) return;
        p.cover[guide] = !p.cover[guide];
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    // Add a cover text element
    // Helper: returns the active cover object (front cover or back cover)
    _getActiveCoverObj() {
        const p = Store.get('currentProject'); if (!p) return null;
        if (Store.get('backCoverActive') && p.backCover) return p.backCover;
        if (p.cover) return p.cover;
        return null;
    },
    addCoverImageElement(src) {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        Store.pushUndo();
        const el = {
            id: genId(),
            type: 'cover-image',
            src: src,
            x: 100,
            y: 100,
            width: 300,
            height: 300,
            style: {
                opacity: 1,
                transform: 'none',
                mixBlendMode: 'normal'
            }
        };
        coverObj.elements.push(el);
        Store.set({ currentProject: p, selectedElement: { type: 'cover-image', id: el.id } }); Store.save();
        renderCanvas(); renderRightPanel();
        Toast.show(t('toast.imageAdded'));
    },
    addCoverTextElement(role = 'custom') {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        Store.pushUndo();
        // Determine smart defaults based on role and active template
        const isBackCover = Store.get('backCoverActive');
        const tmplId = coverObj.template;
        const tmpl = tmplId ? (isBackCover ? BACKCOVER_TEMPLATES[tmplId] : COVER_TEMPLATES[tmplId]) : null;
        const roleDefaults = {
            title: { text: (p.cover && p.cover.title) || 'Título', fontSize: isBackCover ? 18 : 52, fontWeight: isBackCover ? '600' : '700', fontFamily: isBackCover ? "'Inter', sans-serif" : "'Bangers', 'Impact', sans-serif", letterSpacing: isBackCover ? '1px' : '3px', textTransform: isBackCover ? 'none' : 'uppercase', y: isBackCover ? 40 : 60 },
            subtitle: { text: (p.cover && p.cover.subtitle) || 'Subtítulo', fontSize: 20, fontWeight: '600', fontFamily: "'Inter', sans-serif", letterSpacing: '1px', textTransform: 'uppercase', y: 880 },
            author: { text: (p.cover && p.cover.author) || 'Autor', fontSize: 14, fontWeight: '400', fontFamily: "'Inter', sans-serif", letterSpacing: '2px', textTransform: 'none', y: 960 },
            publisher: { text: (p.cover && p.cover.publisher) || 'Editora', fontSize: 11, fontWeight: '400', fontFamily: "'Inter', sans-serif", letterSpacing: '2px', textTransform: 'uppercase', y: isBackCover ? 950 : 22 },
            tagline: { text: isBackCover ? '"Uma citação impactante."' : 'Tagline aqui', fontSize: isBackCover ? 18 : 16, fontWeight: '400', fontFamily: "'Lora', Georgia, serif", letterSpacing: '0px', textTransform: 'none', fontStyle: 'italic', y: isBackCover ? 450 : 920 },
            synopsis: { text: (p.cover && p.cover.synopsis) || 'Insira a sinopse aqui...', fontSize: 14, fontWeight: '400', fontFamily: "'Inter', sans-serif", letterSpacing: '0px', textTransform: 'none', y: 80, color: '#333' },
            custom: { text: 'Texto', fontSize: isBackCover ? 14 : 22, fontWeight: '400', fontFamily: "'Inter', sans-serif", letterSpacing: '0px', textTransform: 'none', y: 500 }
        };
        const d = roleDefaults[role] || roleDefaults.custom;
        // If template active, try to match its font style for new title/subtitle elements
        if (tmpl && tmpl.elements) {
            const tmplMatch = tmpl.elements.find(e => e.role === role);
            if (tmplMatch && tmplMatch.style) {
                if (tmplMatch.style.fontFamily) d.fontFamily = tmplMatch.style.fontFamily;
                if (tmplMatch.style.color) d.color = tmplMatch.style.color;
            }
        }
        const el = {
            id: genId(),
            type: 'cover-text',
            role,
            text: d.text,
            x: 40 + Math.random() * 60,
            y: d.y + Math.random() * 30,
            width: 634,
            style: {
                fontFamily: d.fontFamily,
                fontSize: d.fontSize,
                fontWeight: d.fontWeight,
                color: d.color || '#000000',
                textAlign: 'center',
                textShadow: '',
                letterSpacing: d.letterSpacing,
                textTransform: d.textTransform,
                fontStyle: d.fontStyle || 'normal'
            }
        };
        coverObj.elements.push(el);
        Store.set({ currentProject: p, selectedElement: { type: 'cover-text', id: el.id } }); Store.save();
        renderCanvas(); renderRightPanel();
        Toast.show(t('toast.textElementAdded'));
    },
    _coverSaveTimeout: null,
    updateCoverElement(elId, prop, value) {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        const el = coverObj.elements.find(e => e.id === elId); if (!el) return;
        if (prop.startsWith('style.')) {
            el.style[prop.slice(6)] = value;
        } else {
            el[prop] = value;
        }
        
        // Se for edição de texto, use setSilent e debounce no save para não perder o foco
        if (prop === 'text') {
            Store.setSilent({ currentProject: p });
            clearTimeout(this._coverSaveTimeout);
            this._coverSaveTimeout = setTimeout(() => {
                Store.save();
            }, 500);
            
            // Atualiza o DOM diretamente (apenas na capa principal onde os elementos têm data-el-id)
            const textInner = document.querySelector(`[data-el-id="${elId}"]`);
            if (textInner && document.activeElement !== textInner) {
                textInner.innerText = value;
            }
        } else {
            // Para outras propriedades (tamanho, cor, etc), o render imediato é desejado
            Store.set({ currentProject: p }); Store.save();
            renderCanvas();
        }
    },
    moveCoverElementZ(elId, dir) {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        const idx = coverObj.elements.findIndex(e => e.id === elId);
        if (idx === -1) return;
        const targetIdx = idx + dir;
        if (targetIdx < 0 || targetIdx >= coverObj.elements.length) return;
        Store.pushUndo();
        // Swap elements to change rendering order (z-index)
        const temp = coverObj.elements[idx];
        coverObj.elements[idx] = coverObj.elements[targetIdx];
        coverObj.elements[targetIdx] = temp;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    deleteCoverElement(elId) {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        Store.pushUndo();
        coverObj.elements = coverObj.elements.filter(e => e.id !== elId);
        Store.set({ currentProject: p, selectedElement: null }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    startDragCoverElement(e, elId) {
        // Do NOT call e.preventDefault() here — let clicks flow to textarea/inputs
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        const el = coverObj.elements.find(ce => ce.id === elId); if (!el) return;
        const zoom = Store.get('zoom');
        const sx = e.clientX, sy = e.clientY;
        const ox = el.x, oy = el.y;
        let dragging = false;
        let domNode = null;
        const THRESHOLD = 3;

        const move = ev => {
            const dx = ev.clientX - sx, dy = ev.clientY - sy;
            if (!dragging) {
                if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;
                // Threshold exceeded — activate drag mode
                dragging = true;
                ev.preventDefault();
                // Find the DOM element to move directly
                domNode = document.querySelector(`[data-el-id="${elId}"]`)?.parentElement
                    || document.querySelector(`.cover-image-element[onmousedown*="${elId}"]`);
                if (domNode) domNode.style.willChange = 'left, top';
            }
            if (dragging && domNode) {
                const newX = ox + dx / zoom;
                const newY = oy + dy / zoom;
                domNode.style.left = Math.round(newX) + 'px';
                domNode.style.top = Math.round(newY) + 'px';
                // Store new position in data (not saved yet)
                el.x = newX;
                el.y = newY;
            }
        };
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            if (dragging) {
                if (domNode) domNode.style.willChange = '';
                Store.save();
                renderCanvas();
                renderRightPanel();
            }
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    },
    startResizeCoverElement(e, elId) {
        e.preventDefault();
        e.stopPropagation();
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        const el = coverObj.elements.find(ce => ce.id === elId); if (!el) return;
        const zoom = Store.get('zoom');
        const sx = e.clientX, sy = e.clientY;
        const ow = el.width || 300, oh = el.height || 300;
        
        // Maintain aspect ratio if it's an image
        const aspectRatio = ow / oh;
        
        const move = ev => {
            let newW = ow + (ev.clientX - sx) / zoom;
            let newH = oh + (ev.clientY - sy) / zoom;
            
            if (el.type === 'cover-image') {
                // Determine which axis moved more and scale proportionally
                const dw = Math.abs(newW - ow);
                const dh = Math.abs(newH - oh);
                if (dw > dh) {
                    newH = newW / aspectRatio;
                } else {
                    newW = newH * aspectRatio;
                }
            }
            
            el.width = Math.max(20, newW);
            el.height = Math.max(20, newH);
            renderCanvas();
        };
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            Store.save();
            renderRightPanel();
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    },
    applyCoverTextPreset(elId, presetId) {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        const el = coverObj.elements.find(e => e.id === elId); if (!el) return;
        const preset = COVER_TEXT_PRESETS[presetId]; if (!preset) return;
        Store.pushUndo();
        const { name, ...styleProps } = preset;
        el.style = { ...el.style, ...styleProps };
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
        Toast.show(`Preset "${preset.name}" aplicado`);
    },
    triggerCoverImageUpload() {
        this._coverImageMode = true;
        const input = document.getElementById('file-input-persistent');
        if (!input) return;
        input.value = '';
        input.onchange = (e) => this.handleFileUpload(e);
        input.click();
    },
    triggerCoverImageElementUpload() {
        this._coverImageElementMode = true;
        const input = document.getElementById('file-input-persistent');
        if (!input) return;
        input.value = '';
        input.onchange = (e) => this.handleFileUpload(e);
        input.click();
    },
    // ── Back Cover specific methods ──
    setBackCoverBgColor(color) {
        const p = Store.get('currentProject'); if (!p || !p.backCover) return;
        Store.pushUndo();
        p.backCover.backgroundColor = color;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    toggleBackCoverGuide(field) {
        const p = Store.get('currentProject'); if (!p || !p.backCover) return;
        p.backCover[field] = !p.backCover[field];
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    _handleBackCoverDrop(e) {
        const files = e.dataTransfer ? e.dataTransfer.files : [];
        if (!files.length) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const p = Store.get('currentProject'); if (!p || !p.backCover) return;
            Store.pushUndo();
            p.backCover.backgroundImage = ev.target.result;
            Store.set({ currentProject: p }); Store.save();
            renderCanvas(); renderRightPanel();
        };
        reader.readAsDataURL(file);
    },

    async exportCoverPng() {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        const vp = this._viewport;
        const savedVP = { x: vp.x, y: vp.y, scale: vp.scale };
        vp.scale = 1; vp.x = 0; vp.y = 0;
        this._applyViewportTransform();
        Store.set({ showGuides: false, selectedElement: null, selectedSlot: -1 });
        renderCanvas();
        await new Promise(r => setTimeout(r, 400));
        const el = document.getElementById('canvas-page');
        if (!el) { vp.x = savedVP.x; vp.y = savedVP.y; vp.scale = savedVP.scale; this._applyViewportTransform(); return; }
        try {
            const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: coverObj.backgroundColor || '#fff' });
            canvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                const prefix = Store.get('backCoverActive') ? 'contracapa' : 'capa';
                a.download = `${prefix}-${((p.cover && p.cover.title) || p.metadata.name).replace(/\s+/g, '-')}.png`;
                a.click();
                URL.revokeObjectURL(a.href);
                Toast.show(t('toast.coverExported'), 'success');
            }, 'image/png');
        } catch (err) { Toast.show(t('toast.exportErrorDetail', { message: err.message }), 'error'); }
        vp.x = savedVP.x; vp.y = savedVP.y; vp.scale = savedVP.scale;
        this._applyViewportTransform();
        Store.set({ showGuides: true });
        renderCanvas();
    },

    // ── Matéria text persistence ──
    saveMateriaTitle(pageIdx, text) {
        const p = Store.get('currentProject'); if (!p) return;
        const page = p.pages[pageIdx]; if (!page) return;
        page.materiaTitle = text;
        Store.setSilent({ currentProject: p }); Store.save();
    },
    saveMateriaText(pageIdx, key, text) {
        const p = Store.get('currentProject'); if (!p) return;
        const page = p.pages[pageIdx]; if (!page) return;
        if (!page.materiaTexts) page.materiaTexts = {};
        page.materiaTexts[key] = text;
        Store.setSilent({ currentProject: p }); Store.save();
    },

    // ── Pages ──
    addPage(atIndex = null) {
        const p = Store.get('currentProject'); if (!p) return;
        Store.pushUndo();
        const activeIdx = Store.get('activePageIndex');
        const activePage = p.pages[activeIdx];
        
        const newPage = createPage(p.pages.length, p.videoFormat);
        
        // Feature 5: Herdar configurações
        if (activePage) {
            if (activePage.layoutId) newPage.layoutId = activePage.layoutId;
            if (activePage.narrativeStyle) newPage.narrativeStyle = JSON.parse(JSON.stringify(activePage.narrativeStyle));
            if (activePage.narrativeHeight !== undefined) newPage.narrativeHeight = activePage.narrativeHeight;
            if (activePage.showTextBelow !== undefined) newPage.showTextBelow = activePage.showTextBelow;
        }

        const insertIndex = atIndex !== null ? atIndex : p.pages.length;
        p.pages.splice(insertIndex, 0, newPage);
        
        Store.set({ currentProject: p, activePageIndex: insertIndex, selectedSlot: -1, selectedElement: null });
        Store.save();
        if (typeof renderPageCarousel === 'function') renderPageCarousel();
    },
    duplicatePage(index) {
        const p = Store.get('currentProject');
        if (!p || !p.pages[index]) return;
        Store.pushUndo();
        
        // Deep clone the page
        const original = p.pages[index];
        const clone = JSON.parse(JSON.stringify(original));
        
        // Generate new IDs for the cloned page and its elements
        clone.id = genId();
        if (clone.images) {
            clone.images.forEach(img => { if (img) img.id = genId(); });
        }
        if (clone.texts) {
            clone.texts.forEach(txt => { txt.id = genId(); });
        }
        if (clone.stickers) {
            clone.stickers.forEach(stk => { stk.id = genId(); });
        }
        
        // Insert right after the original
        p.pages.splice(index + 1, 0, clone);
        
        Store.set({ currentProject: p, activePageIndex: index + 1, selectedSlot: -1, selectedElement: null });
        Store.save();
        Toast.show(t('toast.pageDuplicated', { number: index + 1 }), 'success');
    },
    setActivePage(i) {
        const p = Store.get('currentProject');
        if (p) Library.syncFromPages(p);
        Store.set({ activePageIndex: i, coverActive: false, backCoverActive: false, selectedElement: null, selectedSlot: -1 });
        this.resetPan();
        this.resetPasteIndex();
        if (typeof renderPageCarousel === 'function') renderPageCarousel();
    },
    deletePage(i) {
        const p = Store.get('currentProject');
        if (!p || p.pages.length <= 1) { Toast.show(t('toast.lastPage'), 'error'); return; }
        Store.pushUndo();
        p.pages.splice(i, 1);
        Store.set({ currentProject: p, activePageIndex: Math.min(Store.get('activePageIndex'), p.pages.length - 1), selectedElement: null, selectedSlot: -1 });
        Store.save();
        if (typeof renderPageCarousel === 'function') renderPageCarousel();
    },
    pageDragStart(e, i) { e.dataTransfer.setData('text/plain', `page:${i}`); },
    movePageTo(from, to) {
        const p = Store.get('currentProject');
        if (!p || from === to) return;
        Store.pushUndo();
        const [page] = p.pages.splice(from, 1);
        p.pages.splice(to, 0, page);
        Store.set({ currentProject: p, activePageIndex: to });
        Store.save();
    },
    clearPage(i) {
        const p = Store.get('currentProject');
        if (!p || !p.pages[i]) return;
        if (!confirm(t('confirm.clearPage'))) return;
        Store.pushUndo();
        p.pages[i].images = [];
        p.pages[i].texts = [];
        p.pages[i].narrative = '';
        p.pages[i].layoutId = null;
        Store.set({ currentProject: p });
        Store.save();
        Toast.show(t('toast.pageCleared'));
    },
    pageDrop(e, toI) {
        e.preventDefault(); const d = e.dataTransfer.getData('text/plain'); if (!d.startsWith('page:')) return;
        const from = parseInt(d.split(':')[1]); const p = Store.get('currentProject'); if (!p || from === toI) return;
        Store.pushUndo(); const [m] = p.pages.splice(from, 1); p.pages.splice(toI, 0, m);
        Store.set({ currentProject: p, activePageIndex: toI }); Store.save();
    },

    // ── Images ──
    _uploadDebounce: null,
    triggerImageUpload(slot) {
        // Debounce to prevent multiple rapid clicks
        if (this._uploadDebounce) {
            clearTimeout(this._uploadDebounce);
        }
        
        this._uploadDebounce = setTimeout(() => {
            this._pendingSlot = slot !== undefined ? slot : -1;
            const input = document.getElementById('file-input-persistent');
            if (!input) {
                console.error('file-input-persistent não encontrado');
                Toast.show(t('toast.fileInputNotFound'), 'error');
                return;
            }
            
            // Remove old event listener and add new one
            input.onchange = null;
            input.onchange = (e) => this.handleFileUpload(e);
            
            // Reset value to allow same file selection
            input.value = '';
            
            try {
                input.click();
            } catch (e) {
                console.error('Erro ao clicar no input:', e);
                this._triggerImageUploadAlternative();
            }
            
            this._uploadDebounce = null;
        }, 100);
    },

    _triggerImageUploadAlternative() {
        // Criar input dinamicamente como fallback
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e) => this.handleFileUpload(e);
        input.click();
    },
    handleFileUpload(e) {
        Array.from(e.target.files || []).forEach(f => {
            if (!f.type.startsWith('image/')) { Toast.show(t('toast.onlyImages'), 'error'); return; }
            if (f.size > 50 * 1024 * 1024) { Toast.show(t('toast.imageTooLarge'), 'warning'); return; }
            Toast.show(t('toast.optimizingImage'), 'info', 1500);
            const r = new FileReader();
            r.onload = () => {
                if (this._coverImageMode) {
                    this._coverImageMode = false;
                    this._optimizeToWebP(r.result, (opt) => this.setCoverBackground(opt));
                } else if (this._coverImageElementMode) {
                    this._coverImageElementMode = false;
                    this._optimizeToWebP(r.result, (opt) => this.addCoverImageElement(opt));
                } else {
                    this._addImage(r.result);
                }
            };
            r.readAsDataURL(f);
        });
        e.target.value = '';
    },
    promptImageUrl() {
        const url = prompt('Cole a URL da imagem (PNG, JPG, GIF, WebP):');
        if (!url) return;
        if (!url || !url.trim()) return;
        this._addImage(url);
    },
    _optimizeToWebP(src, callback) {
        const MAX_DIM = 1600;
        const QUALITY = 0.85;
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, Math.min(MAX_DIM / img.width, MAX_DIM / img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const resized = canvas.toDataURL('image/webp', QUALITY);
            const saved = src.length > resized.length;
            if (saved) {
                const pct = Math.round((1 - resized.length / src.length) * 100);
                Toast.show(`WebP otimizado (${canvas.width}×${canvas.height}, -${pct}%)`, 'success', 2000);
                callback(resized);
            } else {
                callback(src);
            }
        };
        img.onerror = () => callback(src);
        img.src = src;
    },
    _resizeImageIfNeeded(src, callback) {
        this._optimizeToWebP(src, callback);
    },
    _addImage(src) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;

        // ALWAYS optimize images to WebP
        if (src.startsWith('data:')) {
            this._optimizeToWebP(src, (optimized) => this._addImageDirect(optimized));
            return;
        }
        this._addImageDirect(src);
    },
    _addImageDirect(src) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        const pageIdx = Store.get('activePageIndex');
        
        // Consume _pendingSlot if set (user clicked a specific panel)
        const pendingSlot = this._pendingSlot;
        this._pendingSlot = -1;
        
        // Check if page layout has capacity
        const cap = PanelHelper.getCapacity(page);
        
        // Determine target slot: pending > first empty > auto-expand
        let targetSlot = -1;
        if (pendingSlot >= 0 && pendingSlot < cap) {
            targetSlot = pendingSlot;
        } else {
            targetSlot = PanelHelper.findFirstEmpty(page);
        }
        
        // If page has no layout yet or has a target slot, insert normally
        if (cap <= 0 || targetSlot >= 0) {
            Store.pushUndo();
            if (!page.images) page.images = [];
            if (targetSlot >= 0 && targetSlot < cap) {
                while (page.images.length <= targetSlot) page.images.push(null);
                page.images[targetSlot] = { id: genId(), src, filters: { brightness: 100, contrast: 100 }, transform: { scale: 1, x: 0, y: 0 } };
            } else {
                page.images.push({ id: genId(), src, filters: { brightness: 100, contrast: 100 }, transform: { scale: 1, x: 0, y: 0 } });
                const newCount = page.images.length;
                page.layoutId = LayoutEngine.getDefaultForCount(newCount);
                page.plannedCount = newCount;
            }
            // Also add to library
            if (!Library.findBySrc(p, src)) Library.add(p, src, 'upload', pageIdx);
            const filled = PanelHelper.countFilled(page);
            Store.set({ currentProject: p, selectedSlot: targetSlot >= 0 ? targetSlot : page.images.length - 1 });
            Store.save();
            Toast.show(`Imagem adicionada (${filled}/${cap || filled})`);
            renderCanvas();
            return;
        }
        
        // Layout is FULL — image goes to library, user decides
        Library.add(p, src, 'overflow', pageIdx);
        Store.set({ currentProject: p }); Store.save();
        this._pendingOverflowSrc = src;
        
        const nextWithEmpty = PanelHelper.findPageWithEmpty(p, pageIdx + 1);
        const actions = [
            { label: '+ Nova página', action: `App._overflowNewPage()` },
            { label: '↔ Substituir painel', action: `App._enterReplaceTargetMode()` },
        ];
        if (nextWithEmpty >= 0) {
            actions.splice(1, 0, { label: `Usar na pág. ${nextWithEmpty + 1}`, action: `App._overflowGoToPage(${nextWithEmpty})` });
        }
        actions.push({ label: '✕ OK', action: `App._pendingOverflowSrc=null` });
        Toast.showAction(`Painel cheio — imagem salva na Biblioteca`, actions, 8000);
        renderRightPanel();
    },
    
    // Overflow: batch of N images all at once
    _overflowBatch(sources) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        const pageIdx = Store.get('activePageIndex');
        sources.forEach(src => {
            if (!Library.findBySrc(p, src)) Library.add(p, src, 'overflow', pageIdx);
        });
        this._pendingOverflowBatch = sources;
        Store.set({ currentProject: p }); Store.save();
        
        const n = sources.length;
        Toast.showAction(
            `${n} imagens salvas na Biblioteca (painéis cheios)`,
            [
                { label: `+ Nova página com as ${n}`, action: `App._overflowBatchNewPage()` },
                { label: '↔ Gerenciar', action: `App.toggleSidebarSection('biblioteca');App._pendingOverflowBatch=null` },
                { label: '✕ OK', action: `App._pendingOverflowBatch=null` }
            ],
            8000
        );
        renderRightPanel();
    },
    
    _overflowNewPage() {
        const p = Store.get('currentProject');
        if (!p || !this._pendingOverflowSrc) return;
        Store.pushUndo();
        const page = Store.getActivePage();
        const currentLayout = page ? page.layoutId : null;
        const newPage = { 
            id: genId(), 
            images: [{ id: genId(), src: this._pendingOverflowSrc, filters: { brightness: 100, contrast: 100 }, transform: { scale: 1, x: 0, y: 0 } }], 
            texts: [], 
            layoutId: currentLayout || '1p-full', 
            narrative: '' 
        };
        // Feature 5: Herdar configurações
        if (page) {
            if (page.narrativeStyle) newPage.narrativeStyle = JSON.parse(JSON.stringify(page.narrativeStyle));
            if (page.narrativeHeight !== undefined) newPage.narrativeHeight = page.narrativeHeight;
            if (page.showTextBelow !== undefined) newPage.showTextBelow = page.showTextBelow;
        }
        p.pages.push(newPage);
        Store.set({ currentProject: p, activePageIndex: p.pages.length - 1, selectedSlot: 0 });
        Store.save();
        Toast.show(t('toast.newPageCreated'));
        this._pendingOverflowSrc = null;
        renderCanvas(); renderLeftPanel();
    },
    
    _overflowGoToPage(pageIdx) {
        const p = Store.get('currentProject');
        if (!p || !this._pendingOverflowSrc || !p.pages[pageIdx]) return;
        Store.pushUndo();
        const targetPage = p.pages[pageIdx];
        const emptySlot = PanelHelper.findFirstEmpty(targetPage);
        if (emptySlot < 0) { Toast.show(t('toast.noEmptySlots'), 'error'); return; }
        if (!targetPage.images) targetPage.images = [];
        while (targetPage.images.length <= emptySlot) targetPage.images.push(null);
        targetPage.images[emptySlot] = { id: genId(), src: this._pendingOverflowSrc, filters: { brightness: 100, contrast: 100 } };
        Store.set({ currentProject: p, activePageIndex: pageIdx, selectedSlot: emptySlot });
        Store.save();
        Toast.show(`Imagem adicionada ao painel ${emptySlot + 1} da página ${pageIdx + 1}`);
        this._pendingOverflowSrc = null;
        renderCanvas(); renderLeftPanel();
    },
    
    _overflowBatchNewPage() {
        const p = Store.get('currentProject');
        if (!p || !this._pendingOverflowBatch || !this._pendingOverflowBatch.length) return;
        Store.pushUndo();
        const sources = this._pendingOverflowBatch;
        const n = sources.length;
        const layoutId = PanelHelper.suggestLayout(n);
        const newPage = { id: genId(), images: sources.map(src => ({ id: genId(), src, filters: { brightness: 100, contrast: 100 }, transform: { scale: 1, x: 0, y: 0 } })), texts: [], layoutId, narrative: '' };
        
        // Feature 5: Herdar configurações
        const page = Store.getActivePage();
        if (page) {
            if (page.narrativeStyle) newPage.narrativeStyle = JSON.parse(JSON.stringify(page.narrativeStyle));
            if (page.narrativeHeight !== undefined) newPage.narrativeHeight = page.narrativeHeight;
            if (page.showTextBelow !== undefined) newPage.showTextBelow = page.showTextBelow;
        }

        p.pages.push(newPage);
        Store.set({ currentProject: p, activePageIndex: p.pages.length - 1, selectedSlot: -1 });
        Store.save();
        Toast.show(`Nova página criada com layout para ${n} imagens`);
        this._pendingOverflowBatch = null;
        renderCanvas(); renderLeftPanel();
    },
    
    _enterReplaceTargetMode() {
        this._replaceTargetMode = true;
        this._replaceTargetSrc = this._pendingOverflowSrc;
        this._pendingOverflowSrc = null;
        Toast.show(t('toast.clickPanelToReplace'), 'info', 4000);
        renderCanvas();
    },
    
    _exitReplaceTargetMode() {
        this._replaceTargetMode = false;
        this._replaceTargetSrc = null;
        renderCanvas();
    },
    
    _replaceTargetSlot(slot) {
        if (!this._replaceTargetSrc) return;
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndo();
        const pageIdx = Store.get('activePageIndex');
        // Save old image to library
        if (page.images[slot] && page.images[slot].src) {
            if (!Library.findBySrc(p, page.images[slot].src)) {
                Library.add(p, page.images[slot].src, 'replaced', pageIdx);
            }
        }
        page.images[slot] = { id: genId(), src: this._replaceTargetSrc, filters: { brightness: 100, contrast: 100 } };
        Store.set({ currentProject: p, selectedSlot: slot });
        Store.save();
        Toast.show(`Painel ${slot + 1} substituído — imagem anterior salva na biblioteca`);
        this._replaceTargetMode = false;
        this._replaceTargetSrc = null;
        renderCanvas(); renderRightPanel();
    },
    insertLibraryImage(src) {
        const page = Store.getActivePage();
        const slot = Store.get('selectedSlot');
        
        // Priority 0: If slides/sequence mode is active, add as slide
        if (page && page.slides && page.slides.length > 0) {
            this.addSlide(src);
            return;
        }
        
        // Priority 1: If a panel is selected, insert there
        if (slot >= 0 && page) {
            this._replaceImageInSlot(slot, src);
            Toast.show(`Imagem inserida no quadro ${slot + 1} (selecionado)`);
            return;
        }
        
        // Priority 2: Find next empty panel
        if (page) {
            const emptySlot = PanelHelper.findFirstEmpty(page);
            if (emptySlot >= 0) {
                this._replaceImageInSlot(emptySlot, src);
                Toast.show(`Imagem inserida no quadro ${emptySlot + 1} (próximo vazio)`);
                return;
            }
        }
        
        // Priority 3: Fallback to overflow flow (no auto-layout change)
        this._addImage(src);
    },
    showLibraryPreview(el, src) {
        let preview = document.getElementById('lib-hover-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'lib-hover-preview';
            preview.style.cssText = 'position:fixed; z-index:99999; width:300px; height:300px; border-radius:8px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.8); border:2px solid var(--border); background:var(--surface2); pointer-events:none; opacity:0; transition:opacity 0.2s;';
            const img = document.createElement('img');
            img.style.cssText = 'width:100%; height:100%; object-fit:contain;';
            preview.appendChild(img);
            document.body.appendChild(preview);
        }
        const img = preview.querySelector('img');
        img.src = src;
        
        const rect = el.getBoundingClientRect();
        // Position to the left of the sidebar
        let left = rect.left - 310;
        let top = rect.top - 150 + (rect.height / 2);
        
        if (left < 10) left = rect.right + 10;
        if (top < 10) top = 10;
        if (top + 300 > window.innerHeight - 10) top = window.innerHeight - 310;
        
        preview.style.left = left + 'px';
        preview.style.top = top + 'px';
        
        // Small delay to allow image to start loading before fading in
        setTimeout(() => {
            if (document.getElementById('lib-hover-preview')) {
                preview.style.opacity = '1';
            }
        }, 50);
    },
    hideLibraryPreview() {
        const preview = document.getElementById('lib-hover-preview');
        if (preview) {
            preview.style.opacity = '0';
            setTimeout(() => {
                if (preview && preview.style.opacity === '0') {
                    preview.remove();
                }
            }, 200);
        }
    },
    fitImageToPanel(slot) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.images[slot]) return;
        Store.pushUndo();
        page.images[slot].transform = { scale: 1, x: 0, y: 0 };
        Store.set({ currentProject: p }); Store.save();
        Toast.show(t('toast.imageAdjusted'));
        renderCanvas();
    },
    
    toggleAutoPastePage(val) {
        const p = Store.get('currentProject');
        if (!p) return;
        if (!p.settings) p.settings = {};
        p.settings.autoPastePage = val;
        Store.set({ currentProject: p });
        Store.save();
    },
    
    // ── Crop Mode (double-click to edit image inside frame) ──
    _cropMode: { active: false, panelIndex: null },
    
    enterCropMode(slot) {
        const page = Store.getActivePage();
        if (!page || !page.images[slot]) return;
        
        const img = page.images[slot];
        
        // Initialize transform if not exists, or apply initial zoom if scale is 1
        if (!img.transform) {
            img.transform = { scale: 1.3, x: 0, y: 0 }; // Start zoomed in
        } else if (img.transform.scale <= 1) {
            img.transform.scale = 1.3; // Zoom in to allow cropping
        }
        
        this._cropMode = { active: true, panelIndex: slot };
        Store.set({ selectedSlot: slot, selectedElement: null });
        
        // Add backdrop to dim canvas area
        const canvasArea = document.getElementById('canvas-area');
        if (canvasArea && !document.querySelector('.crop-mode-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.className = 'crop-mode-backdrop';
            canvasArea.appendChild(backdrop);
        }
        
        // Apply visual states
        document.querySelectorAll('.panel-slot').forEach((el, i) => {
            if (i === slot) {
                el.classList.add('crop-mode-active');
                el.style.cursor = 'move';
            } else {
                el.classList.add('crop-mode-dimmed');
            }
        });
        
        renderCanvas(); // Re-render with zoom applied
        const isMobile = window.innerWidth <= 768;
        Toast.show(t(isMobile ? 'toast.dragToPositionTouch' : 'toast.dragToPosition'), 3000);
        renderRightPanel();
    },
    
    exitCropMode() {
        if (!this._cropMode.active) return;
        
        this._cropMode = { active: false, panelIndex: null };
        
        // Remove backdrop
        const backdrop = document.querySelector('.crop-mode-backdrop');
        if (backdrop) backdrop.remove();
        
        // Remove visual states
        document.querySelectorAll('.panel-slot').forEach(el => {
            el.classList.remove('crop-mode-active', 'crop-mode-dimmed');
            el.style.cursor = '';
        });
        
        Store.save();
        renderCanvas();
    },
    
    // Handle clicks outside crop mode panel to exit
    _checkCropModeExit(e) {
        if (!this._cropMode.active) return false;
        const clickedPanel = e.target.closest('.panel-slot');
        if (!clickedPanel) {
            this.exitCropMode();
            return true;
        }
        const panelSlots = Array.from(document.querySelectorAll('.panel-slot'));
        const clickedIndex = panelSlots.indexOf(clickedPanel);
        if (clickedIndex !== this._cropMode.panelIndex) {
            this.exitCropMode();
            return true;
        }
        return false;
    },
    async savePageAsPng() {
        const el = document.getElementById('canvas-page');
        if (!el) return;
        const vp = this._viewport;
        const savedVP = { x: vp.x, y: vp.y, scale: vp.scale };
        const oldBleed = Store.get('showBleed'), oldReading = Store.get('showReadingOrder');
        vp.scale = 1; vp.x = 0; vp.y = 0;
        this._applyViewportTransform();
        Store.set({ showGuides: false, showBleed: false, showReadingOrder: false, selectedSlot: -1, selectedElement: null });
        renderCanvas();
        await new Promise(r => setTimeout(r, 400));
        const el2 = document.getElementById('canvas-page');
        const ft = el2 ? el2.querySelector('.canvas-float-tools') : null;
        const fp = el2 ? el2.querySelector('.floating-props-toolbar') : null;
        const uiOverlays = el2 ? el2.querySelectorAll('.panel-mini-toolbar, .panel-selector-fixed, .gutter-handle, .narrative-resize-handle, .balloon-selection, .balloon-resize-handle, .frame-label-overlay') : [];
        if (ft) ft.style.display = 'none';
        if (fp) fp.style.display = 'none';
        uiOverlays.forEach(s => s.style.display = 'none');
        try {
            const canvas = await html2canvas(el2, { scale: this._exportScale || 2, useCORS: true, allowTaint: true, backgroundColor: '#fff' });
            canvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                const idx = Store.get('activePageIndex') || 0;
                a.download = `pagina-${String(idx + 1).padStart(3, '0')}.png`;
                a.click();
                URL.revokeObjectURL(a.href);
                Toast.show(t('toast.pngSaved'), 'success');
            }, 'image/png');
        } catch (err) { Toast.show('Erro: ' + err.message, 'error'); }
        if (ft) ft.style.display = '';
        if (fp) fp.style.display = '';
        uiOverlays.forEach(s => s.style.display = '');
        vp.x = savedVP.x; vp.y = savedVP.y; vp.scale = savedVP.scale;
        this._applyViewportTransform();
        Store.set({ showGuides: true, showBleed: oldBleed, showReadingOrder: oldReading });
        renderCanvas();
    },
    removeImage(slot) {
        const p = Store.get('currentProject'), page = Store.getActivePage(); if (!p || !page) return;
        if (!page.images[slot] || !page.images[slot].src) return;
        Store.pushUndo();
        const pageIdx = Store.get('activePageIndex');
        const backup = JSON.parse(JSON.stringify(page.images[slot]));
        const backupSlot = slot;

        // Save removed image to library before deleting
        if (!Library.findBySrc(p, backup.src)) {
            Library.add(p, backup.src, 'removed', pageIdx);
        }

        // Remove immediately from UI
        page.images[backupSlot] = null;
        Store.set({ currentProject: p, selectedSlot: -1 });
        renderCanvas(); renderRightPanel();

        // Undo toast — 5 seconds to recover
        let undone = false;
        Toast.showAction('Imagem removida', [
            { label: 'Desfazer', action: `App._undoRemoveImage(${backupSlot})` },
        ], 5000);

        // Store backup for undo
        this._removeBackup = { slot: backupSlot, data: backup, pageIdx };

        // Confirm removal after 5s if not undone
        setTimeout(() => {
            if (this._removeBackup && this._removeBackup.slot === backupSlot) {
                this._removeBackup = null;
                Store.save();
            }
        }, 5200);
    },
    _undoRemoveImage(slot) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !this._removeBackup) return;
        const backup = this._removeBackup;
        this._removeBackup = null;

        // Restore image
        while (page.images.length <= backup.slot) page.images.push(null);
        page.images[backup.slot] = backup.data;
        Store.set({ currentProject: p, selectedSlot: backup.slot });
        Store.save();
        renderCanvas(); renderRightPanel();
        Toast.show(t('toast.imageRestored'), 'success');
    },
    toggleImageFit(slot) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.images || !page.images[slot]) return;
        Store.pushUndo();
        const img = page.images[slot];
        img.fit = img.fit === 'contain' ? 'cover' : 'contain';
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
        Toast.show(img.fit === 'contain' ? 'Imagem inteira' : 'Preencher quadro', 'info');
    },
    _removeConfirmActive: false,
    removeFromLibrary(libId) {
        const p = Store.get('currentProject');
        if (!p) return;
        const entry = (p.library || []).find(e => e.id === libId);
        if (!entry) return;
        // Check if used in any page
        Library.computeUsage(p);
        if (entry.usedInPages && entry.usedInPages.length > 0) {
            if (this._removeConfirmActive) return;
            this._removeConfirmActive = true;
            Toast.showAction(`Imagem usada em ${entry.usedInPages.length} página(s). Remover da biblioteca mesmo assim?`, [
                { label: 'Sim, remover', action: `App._removeConfirmActive=false;App._confirmRemoveFromLibrary('${libId}')`, danger: true },
                { label: 'Cancelar', action: `App._removeConfirmActive=false` }
            ], 5000, () => { App._removeConfirmActive = false; });
            return;
        }
        Library.remove(p, libId);
        Store.set({ currentProject: p }); Store.save();
        Toast.show(t('toast.imageRemovedFromLibrary'));
        renderRightPanel();
    },
    _confirmRemoveFromLibrary(libId) {
        const p = Store.get('currentProject');
        if (!p) return;
        Library.remove(p, libId);
        Store.set({ currentProject: p }); Store.save();
        Toast.show(t('toast.imageRemovedFromLibrary'));
        renderRightPanel();
    },
    selectSlot(i) { 
        Store.set({ selectedSlot: i, selectedElement: null }); 
        this._manualSlotSelection = true; 
        renderCanvas();
        renderRightPanel();
    },
    deselectAll() { 
        Store.set({ selectedSlot: -1, selectedElement: null }); 
        this._manualSlotSelection = false; 
        this.closeBalloonTooltip(); 
        this.closeStickerTooltip(); 
        renderCanvas();
        renderRightPanel();
    },
    
    // ── Recordatório (fixed narrative text per panel) ──
    addRecordatorio(panelIndex, position = 'top') {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        if (!page.recordatorios) page.recordatorios = [];
        // Check if already exists for this panel
        const existing = page.recordatorios.find(r => r.panelIndex === panelIndex);
        if (existing) { this.editRecordatorio(panelIndex); return; }
        Store.pushUndo();
        page.recordatorios.push({
            id: genId(),
            panelIndex,
            text: '',
            position,
            bgColor: 'rgba(255,248,220,0.92)',
            textColor: '#1a1a1a',
            fontSize: 11,
            height: 36
        });
        Store.set({ currentProject: p }); Store.save();
        this.editRecordatorio(panelIndex);
    },
    editRecordatorio(panelIndex) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.recordatorios) return;
        const rec = page.recordatorios.find(r => r.panelIndex === panelIndex);
        if (!rec) { this.addRecordatorio(panelIndex); return; }
        
        // Show inline edit prompt
        const newText = prompt('Texto do Recordatório:', rec.text || '');
        if (newText === null) return; // cancelled
        Store.pushUndo();
        rec.text = newText;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    setRecordatorioPosition(panelIndex, position) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.recordatorios) return;
        const rec = page.recordatorios.find(r => r.panelIndex === panelIndex);
        if (!rec) return;
        Store.pushUndo();
        rec.position = position;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    removeRecordatorio(panelIndex) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.recordatorios) return;
        Store.pushUndo();
        page.recordatorios = page.recordatorios.filter(r => r.panelIndex !== panelIndex);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    updateImageFilter(slot, prop, val) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!page || !page.images[slot]) return;
        if (!page.images[slot].filters) page.images[slot].filters = { brightness: 100, contrast: 100 };
        page.images[slot].filters[prop] = parseInt(val);
        Store.set({ currentProject: p }); Store.save();
    },
    flipImage(slot, axis) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!page || !page.images[slot]) return;
        if (!page.images[slot].filters) page.images[slot].filters = { brightness: 100, contrast: 100 };
        Store.pushUndo();
        page.images[slot].filters[axis] = !page.images[slot].filters[axis];
        Store.set({ currentProject: p }); Store.save();
    },

    // ── Image Pan/Zoom Inside Panels (ONLY in crop mode) ──
    startImagePan(e, slot) {
        if (e.button !== 0) return; // Left click only
        // Only allow image pan/drag in crop mode for this slot
        if (!this._cropMode.active || this._cropMode.panelIndex !== slot) return;
        e.preventDefault();
        e.stopPropagation();
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!page || !page.images[slot]) return;
        
        const img = page.images[slot];
        if (!img.transform) img.transform = { scale: 1, x: 0, y: 0 };
        
        const startX = e.clientX, startY = e.clientY;
        const origX = img.transform.x, origY = img.transform.y;
        const zoom = Store.get('zoom');
        const scale = img.transform.scale;
        let dragged = false;
        
        // Select slot without full re-render — direct state mutation + canvas-only update
        Store._s.selectedSlot = slot;
        Store._s.selectedElement = null;
        renderCanvas();
        
        const move = (ev) => {
            dragged = true;
            const dx = (ev.clientX - startX) / zoom / scale;
            const dy = (ev.clientY - startY) / zoom / scale;
            img.transform.x = origX + dx;
            img.transform.y = origY + dy;
            renderCanvas();
        };
        
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            if (dragged) {
                Store.save();
            }
        };
        
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    },

    // Touch equivalent of startImagePan for mobile crop mode
    startImagePanTouch(e, slot) {
        if (!this._cropMode.active || this._cropMode.panelIndex !== slot) return;
        if (e.touches.length !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        const page = Store.getActivePage();
        if (!page || !page.images[slot]) return;

        const img = page.images[slot];
        if (!img.transform) img.transform = { scale: 1, x: 0, y: 0 };

        const startX = e.touches[0].clientX, startY = e.touches[0].clientY;
        const origX = img.transform.x, origY = img.transform.y;
        const zoom = Store.get('zoom');
        const scale = img.transform.scale;
        let dragged = false;

        Store._s.selectedSlot = slot;
        Store._s.selectedElement = null;
        renderCanvas();

        const move = (ev) => {
            if (ev.touches.length !== 1) return;
            dragged = true;
            const dx = (ev.touches[0].clientX - startX) / zoom / scale;
            const dy = (ev.touches[0].clientY - startY) / zoom / scale;
            img.transform.x = origX + dx;
            img.transform.y = origY + dy;
            renderCanvas();
        };

        const end = () => {
            document.removeEventListener('touchmove', move);
            document.removeEventListener('touchend', end);
            if (dragged) Store.save();
        };

        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('touchend', end);
    },

    handleImageZoom(e, slot) {
        // Only zoom image inside panel when in crop mode for this slot
        if (!this._cropMode.active || this._cropMode.panelIndex !== slot) return;
        e.preventDefault();
        e.stopPropagation();
        const page = Store.getActivePage();
        if (!page || !page.images[slot]) return;
        
        const img = page.images[slot];
        if (!img.transform) img.transform = { scale: 1, x: 0, y: 0 };
        
        // Zoom in/out with scroll
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        img.transform.scale = Math.max(0.5, Math.min(3, img.transform.scale + delta));
        
        // Direct state mutation to avoid full re-render during zoom
        Store._s.selectedSlot = slot;
        renderCanvas();
        Store.save();
    },
    
    resetImageTransform(slot) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!page || !page.images[slot]) return;
        Store.pushUndo();
        page.images[slot].transform = { scale: 1, x: 0, y: 0 };
        Store.set({ currentProject: p }); Store.save();
        Toast.show(t('toast.imageReset'));
    },
    fitImageCover(slot) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!page || !page.images[slot]) return;
        Store.pushUndo();
        // Set scale to 1 and center - object-fit:cover handles the rest
        page.images[slot].transform = { scale: 1, x: 0, y: 0 };
        Store.set({ currentProject: p }); Store.save();
        Toast.show(t('toast.imageAdjusted'));
    },
    centerImage(slot) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!page || !page.images[slot]) return;
        Store.pushUndo();
        const img = page.images[slot];
        if (!img.transform) img.transform = { scale: 1, x: 0, y: 0 };
        img.transform.x = 0;
        img.transform.y = 0;
        Store.set({ currentProject: p }); Store.save();
        Toast.show(t('toast.imageCentered'));
    },

    // ── Layout ──
    setPlannedCount(n) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        
        // Always update plannedCount
        page.plannedCount = n;
        Store.set({ plannedCount: n, currentProject: p });
        
        // Get current layout panel count
        const currentTmpl = page.layoutId ? LayoutEngine.get(page.layoutId, page.images || []) : null;
        const currentCount = currentTmpl ? currentTmpl.panels.length : 0;
        
        // If current layout already has this count, just re-render to show new variations
        if (currentCount === n) {
            this._refreshLeftPanel();
            return;
        }
        
        // Different count → apply first non-dynamic layout of that quantity
        const layouts = LayoutEngine.getForCount(n).filter(l => l.count === n);
        if (layouts.length === 0) {
            console.warn('No layouts found for count:', n);
            this._refreshLeftPanel();
            return;
        }
        this.setLayout(layouts[0].id);
    },
    setLayout(id) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        
        Store.pushUndo();
        page.layoutId = id; 
        delete page.panelOverrides;
        
        const tmpl = LayoutEngine.get(id, page.images || []);
        if (tmpl && tmpl.panels && !tmpl.isDynamic) {
            const needed = tmpl.panels.length;
            const oldImages = page.images ? [...page.images] : [];
            const realCount = oldImages.filter(img => img && img.src).length;
            
            // Build new images array preserving existing by index
            const newImages = [];
            for (let i = 0; i < needed; i++) {
                if (i < oldImages.length && oldImages[i] && oldImages[i].src) {
                    newImages.push(oldImages[i]); // preserve image + transform
                } else {
                    newImages.push(null); // empty slot
                }
            }
            page.images = newImages;
            page.plannedCount = needed;
            
            // Warn if images were dropped
            const droppedCount = realCount - newImages.filter(img => img && img.src).length;
            if (droppedCount > 0) {
                Toast.show(`${droppedCount} imagem(ns) não coube(ram) no novo layout`, 'warning');
            }
        } else if (tmpl && tmpl.isDynamic) {
            // Dynamic layouts: ensure images array exists
            if (!page.images) page.images = [];
            page.plannedCount = page.images.filter(img => img && img.src).length || 1;
        }
        
        // Clamp selectedSlot to new panel count
        const panelCount = tmpl?.panels?.length || (page.images ? page.images.filter(i=>i&&i.src).length : 0) || 1;
        const curSlot = Store.get('selectedSlot');
        if (curSlot >= panelCount) {
            Store.set({ selectedSlot: -1 });
        }
        
        Store.set({ currentProject: p }); 
        Store.save();
        
        Toast.show(`Layout "${tmpl?.name || id}" — ${tmpl?.isDynamic ? 'dinâmico' : panelCount + ' painéis'}`);
        this.resetPasteIndex();
        
        // Re-render everything properly
        this._refreshLeftPanel();
        renderCanvas(); 
        renderRightPanel();
    },
    
    _refreshLeftPanel() {
        const leftEl = document.getElementById('left-panel');
        if (!leftEl) return;
        const isCollapsed = leftEl.classList.contains('collapsed');
        const toggleBtnHTML = `<button class="sidebar-toggle sidebar-toggle-left" onclick="App.toggleLeft()">${Store.get('leftPanelOpen') ? '‹' : '›'}</button>`;
        leftEl.innerHTML = renderLeftPanel() + toggleBtnHTML;
    },

    // ── Gutter Drag — disabled (panelOverrides removed) ──
    // Gutter handles now show tooltip only; no drag resize
    startGutterDrag() { /* no-op — gutter drag disabled */ },

    // Reset layout to template defaults (clears any residual overrides)
    resetPanelOverrides() {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndo();
        delete page.panelOverrides;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
        Toast.show(t('toast.layoutReset'));
    },

    // ══════════════════════════════════════════════════════════════
    // LAYOUT EDITOR — Create and edit custom layouts (v2 overhaul)
    // ══════════════════════════════════════════════════════════════

    // --- Grid presets: cols × rows → panels ---
    _leGridPresets: {
        '2x1': { cols: 2, rows: 1 },
        '1x2': { cols: 1, rows: 2 },
        '2x2': { cols: 2, rows: 2 },
        '3x1': { cols: 3, rows: 1 },
        '3x2': { cols: 3, rows: 2 },
        '3x3': { cols: 3, rows: 3 },
    },

    _leGenerateGrid(cols, rows) {
        const G = 12;
        const _d = getProjectDims();
        const CW = _d.contentW, CH = _d.contentH;
        const pw = Math.floor((CW - G * (cols - 1)) / cols);
        const ph = Math.floor((CH - G * (rows - 1)) / rows);
        const panels = [];
        let id = 1;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * (pw + G);
                const y = r * (ph + G);
                const w = (c === cols - 1) ? CW - x : pw;
                const h = (r === rows - 1) ? CH - y : ph;
                panels.push({ id: id, x, y, w, h, order: id });
                id++;
            }
        }
        return panels;
    },

    // Show onboarding modal with 6 grid preset buttons + live preview
    showLayoutEditorModal(existingId = null) {
        const p = Store.get('currentProject');
        if (!p) return;

        // If editing existing, skip modal and go straight to editor
        if (existingId && p.customLayouts) {
            const existing = p.customLayouts.find(c => c.id === existingId);
            if (existing) {
                this._leStartEditor(JSON.parse(JSON.stringify(existing.panels)), existingId);
                return;
            }
        }

        // Build preset SVG previews
        const presetSVGs = {};
        Object.entries(this._leGridPresets).forEach(([key, { cols, rows }]) => {
            const panels = this._leGenerateGrid(cols, rows);
            const _d = getProjectDims();
            const sx = 60 / _d.contentW, sy = 86 / _d.contentH;
            const rects = panels.map((p, i) => {
                const fills = ['#5b8def','#e8625c','#50c878','#f5a623','#9b59b6','#1abc9c','#e74c8b','#34495e','#f39c12'];
                return `<rect x="${(p.x*sx+1).toFixed(1)}" y="${(p.y*sy+1).toFixed(1)}" width="${(p.w*sx-2).toFixed(1)}" height="${(p.h*sy-2).toFixed(1)}" rx="2" fill="${fills[i%fills.length]}" stroke="#333" stroke-width="1"/>`;
            }).join('');
            presetSVGs[key] = `<svg width="60" height="86" viewBox="0 0 60 86"><rect width="60" height="86" fill="#f0f0f0" rx="3"/>${rects}</svg>`;
        });

        const modal = document.createElement('div');
        modal.id = 'layout-editor-modal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
        modal.innerHTML = `
            <div style="background:var(--surface);border-radius:14px;padding:24px;width:420px;box-shadow:0 12px 48px rgba(0,0,0,0.35);">
                <h3 style="margin:0 0 4px;color:var(--text);font-size:17px;font-weight:700;">Criar Novo Layout</h3>
                <p style="margin:0 0 18px;color:var(--text2);font-size:12px;">Escolha como comecar:</p>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
                    ${Object.entries(this._leGridPresets).map(([key, {cols, rows}]) => {
                        const label = key.replace('x','x');
                        const count = cols * rows;
                        return `<button class="le-preset-btn" data-preset="${key}" onclick="App._leSelectPreset('${key}')" style="border:2px solid var(--border);border-radius:10px;background:var(--surface2);cursor:pointer;padding:10px 6px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all 0.15s;" onmouseenter="this.style.borderColor='var(--accent)';this.style.transform='scale(1.04)'" onmouseleave="this.style.borderColor=this.dataset.selected?'var(--accent)':'var(--border)';this.style.transform='scale(1)'">
                            ${presetSVGs[key]}
                            <span style="font-size:13px;font-weight:700;color:var(--text);">${label}</span>
                            <span style="font-size:10px;color:var(--text3);">${count} paineis</span>
                        </button>`;
                    }).join('')}
                </div>
                <div id="le-modal-preview" style="text-align:center;min-height:30px;margin-bottom:16px;"></div>
                <div style="display:flex;gap:8px;">
                    <button onclick="App._leCloseModal()" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);cursor:pointer;font-size:13px;">Cancelar</button>
                    <button id="le-modal-start-btn" onclick="App._leConfirmModal()" style="flex:1;padding:10px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:700;opacity:0.5;pointer-events:none;">Comecar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this._leModalSelectedPreset = null;
    },

    _leSelectPreset(key) {
        this._leModalSelectedPreset = key;
        // Highlight selected button
        document.querySelectorAll('.le-preset-btn').forEach(btn => {
            const isSel = btn.dataset.preset === key;
            btn.style.borderColor = isSel ? 'var(--accent)' : 'var(--border)';
            btn.style.background = isSel ? 'rgba(107,114,128,0.12)' : 'var(--surface2)';
            btn.dataset.selected = isSel ? '1' : '';
        });
        // Enable start button
        const startBtn = document.getElementById('le-modal-start-btn');
        if (startBtn) { startBtn.style.opacity = '1'; startBtn.style.pointerEvents = 'auto'; }
        // Show preview text
        const preview = document.getElementById('le-modal-preview');
        const { cols, rows } = this._leGridPresets[key];
        if (preview) preview.innerHTML = `<span style="font-size:11px;color:var(--accent);font-weight:600;">${cols}x${rows} = ${cols*rows} paineis prontos para editar</span>`;
    },

    _leCloseModal() {
        const modal = document.getElementById('layout-editor-modal');
        if (modal) modal.remove();
        this._leModalSelectedPreset = null;
    },

    _leConfirmModal() {
        const key = this._leModalSelectedPreset;
        if (!key) return;
        const { cols, rows } = this._leGridPresets[key];
        const panels = this._leGenerateGrid(cols, rows);
        this._leCloseModal();
        this._leStartEditor(panels, null);
    },

    // Alias for sidebar button
    enterLayoutEditor(existingId = null) {
        this.showLayoutEditorModal(existingId);
    },

    _leStartEditor(panels, editingId) {
        // Attach keyboard handler
        if (!this._leKeyHandler) {
            this._leKeyHandler = (e) => this._leHandleKey(e);
        }
        document.addEventListener('keydown', this._leKeyHandler);

        Store.set({
            layoutEditorActive: true,
            layoutEditorPanels: panels,
            layoutEditorEditingId: editingId,
            layoutEditorSelectedPanel: 0,
            layoutEditorSnap: true,
            layoutEditorUndoStack: [],
            layoutEditorRedoStack: [],
        });
        renderCanvas();
        this._refreshLeftPanel();
        Toast.show(editingId ? 'Editando layout — clique nos paineis para editar' : 'Editor de layout ativo — arraste e redimensione os paineis');
    },

    exitLayoutEditor(save = false) {
        if (save) {
            this._showSaveLayoutModal();
        } else {
            // Detach keyboard handler
            if (this._leKeyHandler) document.removeEventListener('keydown', this._leKeyHandler);
            Store.set({
                layoutEditorActive: false,
                layoutEditorPanels: [],
                layoutEditorEditingId: null,
                layoutEditorSelectedPanel: -1,
                layoutEditorUndoStack: [],
                layoutEditorRedoStack: [],
            });
            renderCanvas();
            this._refreshLeftPanel();
        }
    },

    // --- Editor undo/redo (isolated from main app) ---
    _lePushUndo() {
        const panels = Store.get('layoutEditorPanels');
        const stack = [...Store.get('layoutEditorUndoStack'), JSON.stringify(panels)].slice(-30);
        Store.set({ layoutEditorUndoStack: stack, layoutEditorRedoStack: [] });
    },

    _leUndo() {
        const stack = [...Store.get('layoutEditorUndoStack')];
        if (!stack.length) return;
        const redo = [...Store.get('layoutEditorRedoStack'), JSON.stringify(Store.get('layoutEditorPanels'))];
        const prev = JSON.parse(stack.pop());
        Store.set({ layoutEditorPanels: prev, layoutEditorUndoStack: stack, layoutEditorRedoStack: redo,
            layoutEditorSelectedPanel: Math.min(Store.get('layoutEditorSelectedPanel'), prev.length - 1) });
        renderCanvas();
        this._refreshLeftPanel();
    },

    _leRedo() {
        const stack = [...Store.get('layoutEditorRedoStack')];
        if (!stack.length) return;
        const undo = [...Store.get('layoutEditorUndoStack'), JSON.stringify(Store.get('layoutEditorPanels'))];
        const next = JSON.parse(stack.pop());
        Store.set({ layoutEditorPanels: next, layoutEditorUndoStack: undo, layoutEditorRedoStack: stack,
            layoutEditorSelectedPanel: Math.min(Store.get('layoutEditorSelectedPanel'), next.length - 1) });
        renderCanvas();
        this._refreshLeftPanel();
    },

    toggleLayoutEditorSnap() {
        const current = Store.get('layoutEditorSnap');
        Store.set({ layoutEditorSnap: !current });
        renderCanvas();
    },

    // --- Panel operations ---
    layoutEditorAddPanel() {
        this._lePushUndo();
        const panels = [...Store.get('layoutEditorPanels')];
        if (panels.length >= 9) { Toast.show(t('toast.maxPanels')); return; }
        const newId = Math.max(0, ...panels.map(p => p.id)) + 1;
        const _d = getProjectDims();
        panels.push({ id: newId, x: Math.round(_d.contentW * 0.34), y: Math.round(_d.contentH * 0.38), w: Math.round(_d.contentW * 0.32), h: Math.round(_d.contentH * 0.24), order: panels.length + 1 });
        Store.set({ layoutEditorPanels: panels, layoutEditorSelectedPanel: panels.length - 1 });
        renderCanvas(); this._refreshLeftPanel();
    },

    layoutEditorDeletePanel(index) {
        const panels = [...Store.get('layoutEditorPanels')];
        if (panels.length <= 1) { Toast.show(t('toast.minPanels')); return; }
        this._lePushUndo();
        panels.splice(index, 1);
        panels.forEach((p, i) => p.order = i + 1);
        Store.set({ layoutEditorPanels: panels, layoutEditorSelectedPanel: Math.min(index, panels.length - 1) });
        renderCanvas(); this._refreshLeftPanel();
    },

    layoutEditorSelectPanel(index) {
        Store.set({ layoutEditorSelectedPanel: index });
        renderCanvas(); this._refreshLeftPanel();
    },

    // --- Split panel ---
    layoutEditorSplitH(index) {
        const panels = [...Store.get('layoutEditorPanels')];
        if (index < 0 || index >= panels.length) return;
        if (panels.length >= 9) { Toast.show(t('toast.maxPanels')); return; }
        const p = panels[index];
        if (p.h < 120) { Toast.show(t('toast.panelTooSmall')); return; }
        this._lePushUndo();
        const G = 12;
        const halfH = Math.floor((p.h - G) / 2);
        const newId = Math.max(0, ...panels.map(q => q.id)) + 1;
        panels[index] = { ...p, h: halfH };
        const newPanel = { id: newId, x: p.x, y: p.y + halfH + G, w: p.w, h: p.h - halfH - G, order: panels.length + 1 };
        panels.splice(index + 1, 0, newPanel);
        panels.forEach((q, i) => q.order = i + 1);
        Store.set({ layoutEditorPanels: panels, layoutEditorSelectedPanel: index });
        renderCanvas(); this._refreshLeftPanel();
    },

    layoutEditorSplitV(index) {
        const panels = [...Store.get('layoutEditorPanels')];
        if (index < 0 || index >= panels.length) return;
        if (panels.length >= 9) { Toast.show(t('toast.maxPanels')); return; }
        const p = panels[index];
        if (p.w < 160) { Toast.show(t('toast.panelTooSmall')); return; }
        this._lePushUndo();
        const G = 12;
        const halfW = Math.floor((p.w - G) / 2);
        const newId = Math.max(0, ...panels.map(q => q.id)) + 1;
        panels[index] = { ...p, w: halfW };
        const newPanel = { id: newId, x: p.x + halfW + G, y: p.y, w: p.w - halfW - G, h: p.h, order: panels.length + 1 };
        panels.splice(index + 1, 0, newPanel);
        panels.forEach((q, i) => q.order = i + 1);
        Store.set({ layoutEditorPanels: panels, layoutEditorSelectedPanel: index });
        renderCanvas(); this._refreshLeftPanel();
    },

    layoutEditorDuplicate(index) {
        const panels = [...Store.get('layoutEditorPanels')];
        if (index < 0 || index >= panels.length) return;
        if (panels.length >= 9) { Toast.show(t('toast.maxPanels')); return; }
        this._lePushUndo();
        const p = panels[index];
        const newId = Math.max(0, ...panels.map(q => q.id)) + 1;
        const _d = getProjectDims();
        const offsetX = Math.min(20, _d.contentW - p.x - p.w);
        const offsetY = Math.min(20, _d.contentH - p.y - p.h);
        const dup = { id: newId, x: p.x + offsetX, y: p.y + offsetY, w: p.w, h: p.h, order: panels.length + 1 };
        panels.push(dup);
        panels.forEach((q, i) => q.order = i + 1);
        Store.set({ layoutEditorPanels: panels, layoutEditorSelectedPanel: panels.length - 1 });
        renderCanvas(); this._refreshLeftPanel();
    },

    // --- Apply grid preset from toolbar ---
    layoutEditorApplyGrid(key) {
        const preset = this._leGridPresets[key];
        if (!preset) return;
        this._lePushUndo();
        const panels = this._leGenerateGrid(preset.cols, preset.rows);
        Store.set({ layoutEditorPanels: panels, layoutEditorSelectedPanel: 0 });
        renderCanvas(); this._refreshLeftPanel();
    },

    // --- Numeric input update (clamped to canvas) ---
    layoutEditorSetPanelProp(index, prop, value) {
        const panels = [...Store.get('layoutEditorPanels')];
        if (index < 0 || index >= panels.length) return;
        this._lePushUndo();
        const p = { ...panels[index] };
        let v = parseInt(value) || 0;

        const _d = getProjectDims();
        if (prop === 'x') { v = Math.max(0, Math.min(v, _d.contentW - p.w)); p.x = v; }
        else if (prop === 'y') { v = Math.max(0, Math.min(v, _d.contentH - p.h)); p.y = v; }
        else if (prop === 'w') { v = Math.max(80, Math.min(v, _d.contentW - p.x)); p.w = v; }
        else if (prop === 'h') { v = Math.max(60, Math.min(v, _d.contentH - p.y)); p.h = v; }

        panels[index] = p;
        Store.set({ layoutEditorPanels: panels });
        renderCanvas(); this._refreshLeftPanel();
    },

    // --- Keyboard shortcuts (editor-only) ---
    _leHandleKey(e) {
        if (!Store.get('layoutEditorActive')) return;
        // Don't capture when typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const sel = Store.get('layoutEditorSelectedPanel');
        const panels = Store.get('layoutEditorPanels');

        // Ctrl+Z / Ctrl+Shift+Z
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this._leUndo(); return; }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); this._leRedo(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); this._leRedo(); return; }
        // Ctrl+D duplicate
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); if (sel >= 0) this.layoutEditorDuplicate(sel); return; }
        // Delete / Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); if (sel >= 0) this.layoutEditorDeletePanel(sel); return; }
        // H = split horizontal, V = split vertical
        if (e.key === 'h' || e.key === 'H') { e.preventDefault(); if (sel >= 0) this.layoutEditorSplitH(sel); return; }
        if (e.key === 'v' || e.key === 'V') { e.preventDefault(); if (sel >= 0) this.layoutEditorSplitV(sel); return; }
        // Arrow keys: nudge
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key) && sel >= 0 && sel < panels.length) {
            e.preventDefault();
            this._lePushUndo();
            const step = e.shiftKey ? 10 : 1;
            const updated = [...panels];
            const p = { ...updated[sel] };
            const _d = getProjectDims();
            if (e.key === 'ArrowLeft') p.x = Math.max(0, p.x - step);
            if (e.key === 'ArrowRight') p.x = Math.min(_d.contentW - p.w, p.x + step);
            if (e.key === 'ArrowUp') p.y = Math.max(0, p.y - step);
            if (e.key === 'ArrowDown') p.y = Math.min(_d.contentH - p.h, p.y + step);
            updated[sel] = p;
            Store.set({ layoutEditorPanels: updated });
            renderCanvas();
            return;
        }
        // Escape = exit (cancel)
        if (e.key === 'Escape') { e.preventDefault(); this.exitLayoutEditor(false); return; }
        // Enter = save
        if (e.key === 'Enter' && !e.ctrlKey) { e.preventDefault(); this.exitLayoutEditor(true); return; }
    },

    // --- Snap helpers ---
    _getSnapPoints(panels, excludeIndex) {
        const _d = getProjectDims();
        const points = { x: [0, Math.round(_d.contentW / 2), _d.contentW], y: [0, Math.round(_d.contentH / 2), _d.contentH] };
        panels.forEach((p, i) => {
            if (i === excludeIndex) return;
            points.x.push(p.x, p.x + p.w / 2, p.x + p.w);
            points.y.push(p.y, p.y + p.h / 2, p.y + p.h);
        });
        return points;
    },

    _findSnap(value, snapPoints, tolerance = 8) {
        for (const sp of snapPoints) {
            if (Math.abs(value - sp) <= tolerance) return { snapped: true, value: sp, delta: sp - value };
        }
        return { snapped: false, value, delta: 0 };
    },

    // --- Drag move ---
    startLayoutPanelDrag(e, panelIndex) {
        e.preventDefault(); e.stopPropagation();
        const panels = Store.get('layoutEditorPanels');
        const panel = panels[panelIndex];
        if (!panel) return;
        this._lePushUndo();
        Store.set({ layoutEditorSelectedPanel: panelIndex });
        const startX = e.clientX, startY = e.clientY;
        const origX = panel.x, origY = panel.y;
        const zoom = Store.get('zoom');
        const snapEnabled = Store.get('layoutEditorSnap');
        const snapPoints = this._getSnapPoints(panels, panelIndex);

        const move = (ev) => {
            let newX = origX + (ev.clientX - startX) / zoom;
            let newY = origY + (ev.clientY - startY) / zoom;
            if (snapEnabled) {
                const sx = this._findSnap(newX, snapPoints.x), sxr = this._findSnap(newX + panel.w, snapPoints.x), sxc = this._findSnap(newX + panel.w/2, snapPoints.x);
                if (sx.snapped) newX = sx.value; else if (sxr.snapped) newX = sxr.value - panel.w; else if (sxc.snapped) newX = sxc.value - panel.w/2;
                const sy = this._findSnap(newY, snapPoints.y), syb = this._findSnap(newY + panel.h, snapPoints.y), syc = this._findSnap(newY + panel.h/2, snapPoints.y);
                if (sy.snapped) newY = sy.value; else if (syb.snapped) newY = syb.value - panel.h; else if (syc.snapped) newY = syc.value - panel.h/2;
            }
            const _d = getProjectDims();
            newX = Math.max(0, Math.min(newX, _d.contentW - panel.w));
            newY = Math.max(0, Math.min(newY, _d.contentH - panel.h));
            const updated = [...panels]; updated[panelIndex] = { ...panel, x: Math.round(newX), y: Math.round(newY) };
            Store.set({ layoutEditorPanels: updated });
            this._showDimensionTooltip(updated[panelIndex], ev.clientX, ev.clientY, 'move');
            renderCanvas();
        };
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); this._hideDimensionTooltip(); };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    },

    // --- Drag resize ---
    startLayoutPanelResize(e, panelIndex, handle) {
        e.preventDefault(); e.stopPropagation();
        const panels = Store.get('layoutEditorPanels');
        const panel = panels[panelIndex];
        if (!panel) return;
        this._lePushUndo();
        Store.set({ layoutEditorSelectedPanel: panelIndex });
        const startX = e.clientX, startY = e.clientY;
        const origX = panel.x, origY = panel.y, origW = panel.w, origH = panel.h;
        const zoom = Store.get('zoom');
        const snapEnabled = Store.get('layoutEditorSnap');
        const snapPoints = this._getSnapPoints(panels, panelIndex);

        const move = (ev) => {
            const dx = (ev.clientX - startX) / zoom, dy = (ev.clientY - startY) / zoom;
            let newX = origX, newY = origY, newW = origW, newH = origH;
            if (handle.includes('e')) newW = origW + dx;
            if (handle.includes('w')) { newX = origX + dx; newW = origW - dx; }
            if (handle.includes('s')) newH = origH + dy;
            if (handle.includes('n')) { newY = origY + dy; newH = origH - dy; }
            if (snapEnabled) {
                if (handle.includes('e')) { const s = this._findSnap(newX+newW, snapPoints.x); if (s.snapped) newW = s.value - newX; }
                if (handle.includes('w')) { const s = this._findSnap(newX, snapPoints.x); if (s.snapped) { newW += newX - s.value; newX = s.value; } }
                if (handle.includes('s')) { const s = this._findSnap(newY+newH, snapPoints.y); if (s.snapped) newH = s.value - newY; }
                if (handle.includes('n')) { const s = this._findSnap(newY, snapPoints.y); if (s.snapped) { newH += newY - s.value; newY = s.value; } }
            }
            if (newW < 80) { if (handle.includes('w')) newX = origX + origW - 80; newW = 80; }
            if (newH < 60) { if (handle.includes('n')) newY = origY + origH - 60; newH = 60; }
            newX = Math.max(0, newX); newY = Math.max(0, newY);
            const _d = getProjectDims();
            if (newX + newW > _d.contentW) newW = _d.contentW - newX;
            if (newY + newH > _d.contentH) newH = _d.contentH - newY;
            const updated = [...panels]; updated[panelIndex] = { ...panel, x: Math.round(newX), y: Math.round(newY), w: Math.round(newW), h: Math.round(newH) };
            Store.set({ layoutEditorPanels: updated });
            this._showDimensionTooltip(updated[panelIndex], ev.clientX, ev.clientY, 'resize');
            renderCanvas();
        };
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); this._hideDimensionTooltip(); this._refreshLeftPanel(); };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    },

    _showDimensionTooltip(panel, mouseX, mouseY, mode) {
        let tt = document.getElementById('layout-dim-tooltip');
        if (!tt) { tt = document.createElement('div'); tt.id = 'layout-dim-tooltip'; tt.style.cssText = 'position:fixed;background:rgba(0,0,0,0.85);color:#fff;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;pointer-events:none;z-index:9999;font-family:monospace;'; document.body.appendChild(tt); }
        tt.textContent = mode === 'move' ? `(${panel.x}, ${panel.y})` : `${panel.w} x ${panel.h}`;
        tt.style.left = (mouseX + 15) + 'px'; tt.style.top = (mouseY - 30) + 'px'; tt.style.display = 'block';
    },
    _hideDimensionTooltip() { const tt = document.getElementById('layout-dim-tooltip'); if (tt) tt.style.display = 'none'; },

    // --- Context menu for panels in editor ---
    showLayoutEditorContextMenu(e, index) {
        e.preventDefault(); e.stopPropagation();
        Store.set({ layoutEditorSelectedPanel: index });
        const panels = Store.get('layoutEditorPanels');
        const canSplit = panels.length < 9;
        const items = [];
        if (canSplit) {
            items.push({ label: '─ Dividir Horizontal', action: `App.layoutEditorSplitH(${index})` });
            items.push({ label: '│ Dividir Vertical', action: `App.layoutEditorSplitV(${index})` });
            items.push({ label: '⊞ Duplicar Painel', action: `App.layoutEditorDuplicate(${index})` });
        }
        if (panels.length > 1) {
            items.push({ label: '🗑 Deletar Painel', danger: true, action: `App.layoutEditorDeletePanel(${index})` });
        }
        renderContextMenu(e.clientX, e.clientY, items);
    },

    // --- Save/load ---
    _showSaveLayoutModal() {
        const panels = Store.get('layoutEditorPanels');
        const editingId = Store.get('layoutEditorEditingId');
        const p = Store.get('currentProject');
        let existingName = '';
        if (editingId && p.customLayouts) { const ex = p.customLayouts.find(c => c.id === editingId); if (ex) existingName = ex.name; }
        const defaultName = existingName || `Meu Layout ${(p.customLayouts?.length || 0) + 1}`;
        const thumbnail = generateLayoutThumbnail(panels);

        const modal = document.createElement('div');
        modal.id = 'save-layout-modal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
        modal.innerHTML = `
            <div style="background:var(--surface);border-radius:12px;padding:24px;width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
                <h3 style="margin:0 0 16px;color:var(--text);font-size:16px;">Salvar Layout</h3>
                <div style="margin-bottom:12px;">
                    <label style="display:block;color:var(--text2);font-size:11px;margin-bottom:4px;">Nome:</label>
                    <input type="text" id="layout-name-input" value="${defaultName}" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:13px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:16px;text-align:center;">
                    <label style="display:block;color:var(--text2);font-size:11px;margin-bottom:8px;">Preview (${panels.length} paineis):</label>
                    <img src="${thumbnail}" style="width:84px;height:120px;border:1px solid var(--border);border-radius:4px;">
                </div>
                <div style="display:flex;gap:8px;">
                    <button onclick="App._cancelSaveLayout()" style="flex:1;padding:10px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);cursor:pointer;">Cancelar</button>
                    <button onclick="App._confirmSaveLayout()" style="flex:1;padding:10px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-weight:600;">Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const input = document.getElementById('layout-name-input');
        input.focus(); input.select();
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._confirmSaveLayout(); if (e.key === 'Escape') this._cancelSaveLayout(); });
    },

    _cancelSaveLayout() { const modal = document.getElementById('save-layout-modal'); if (modal) modal.remove(); },

    _confirmSaveLayout() {
        const input = document.getElementById('layout-name-input');
        const name = input?.value.trim() || 'Meu Layout';
        const panels = Store.get('layoutEditorPanels');
        const editingId = Store.get('layoutEditorEditingId');
        const p = Store.get('currentProject');
        if (!p.customLayouts) p.customLayouts = [];
        const thumbnail = generateLayoutThumbnail(panels);
        const layoutData = { id: editingId || ('custom-' + genId()), name, createdAt: Date.now(), count: panels.length, thumbnail, panels: JSON.parse(JSON.stringify(panels)) };
        if (editingId) {
            const idx = p.customLayouts.findIndex(c => c.id === editingId);
            if (idx >= 0) { p.customLayouts[idx] = layoutData; Toast.show(`Layout "${name}" atualizado`); }
        } else {
            p.customLayouts.push(layoutData);
            Toast.show(`Layout "${name}" salvo com ${panels.length} paineis`);
        }
        Store.set({ currentProject: p }); Store.save();
        this._cancelSaveLayout();
        // Detach keyboard handler
        if (this._leKeyHandler) document.removeEventListener('keydown', this._leKeyHandler);
        Store.set({ layoutEditorActive: false, layoutEditorPanels: [], layoutEditorEditingId: null, layoutEditorSelectedPanel: -1, layoutEditorUndoStack: [], layoutEditorRedoStack: [] });
        renderCanvas(); this._refreshLeftPanel();
    },

    deleteCustomLayout(layoutId) {
        const p = Store.get('currentProject');
        if (!p || !p.customLayouts) return;
        const layout = p.customLayouts.find(c => c.id === layoutId);
        if (!layout) return;
        Toast.showAction(`Deletar "${layout.name}"?`, [
            { label: 'Cancelar', action: '' },
            { label: 'Deletar', danger: true, action: `App._confirmDeleteCustomLayout('${layoutId}')` }
        ]);
    },
    _confirmDeleteCustomLayout(layoutId) {
        const p = Store.get('currentProject');
        if (!p || !p.customLayouts) return;
        p.customLayouts = p.customLayouts.filter(c => c.id !== layoutId);
        if (p.favoriteLayoutId === layoutId) p.favoriteLayoutId = null;
        Store.set({ currentProject: p }); Store.save(); App._refreshLeftPanel();
        Toast.show(t('toast.layoutDeleted'));
    },

    setFavoriteLayout(layoutId) {
        const p = Store.get('currentProject');
        if (!p) return;
        if (p.favoriteLayoutId === layoutId) { p.favoriteLayoutId = null; Toast.show(t('toast.defaultLayoutRemoved')); }
        else { p.favoriteLayoutId = layoutId; Toast.show(t('toast.defaultLayoutSet')); }
        Store.set({ currentProject: p }); Store.save(); this._refreshLeftPanel();
    },

    // ── Image Carousel Reorder ──
    imgCarouselDragStart(e, index) {
        e.dataTransfer.setData('text/plain', `carousel:${index}`);
        e.dataTransfer.effectAllowed = 'move';
    },
    imgCarouselDrop(e, toIndex) {
        e.preventDefault(); e.stopPropagation();
        const d = e.dataTransfer.getData('text/plain');
        if (!d.startsWith('carousel:')) return;
        const fromIndex = parseInt(d.split(':')[1]);
        if (fromIndex === toIndex) return;
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.images[fromIndex]) return;
        Store.pushUndo();
        const [moved] = page.images.splice(fromIndex, 1);
        page.images.splice(toIndex, 0, moved);
        Store.set({ currentProject: p, selectedSlot: toIndex }); Store.save();
        Toast.show(t('toast.imageReordered'));
    },

    // ══════════════════════════════════════════════════════════════
    // VIEWPORT SYSTEM — Centralized zoom/pan state + GPU transform
    // ══════════════════════════════════════════════════════════════
    _viewport: {
        x: 0, y: 0, scale: 1,
        MIN_SCALE: 0.25, MAX_SCALE: 4,
        isPanning: false,
        panStartX: 0, panStartY: 0,
        panStartVX: 0, panStartVY: 0,
        mode: 'select' // 'select' | 'pan'
    },
    _spacePressed: false,

    // Compatibility alias — cover/export code reads panOffset
    get panOffset() { return { x: this._viewport.x, y: this._viewport.y }; },

    _applyViewportTransform() {
        const wrapper = document.getElementById('canvas-scroll');
        if (!wrapper) return;
        const vp = this._viewport;
        wrapper.style.transform = `translate(${vp.x}px, ${vp.y}px) scale(${vp.scale})`;
        wrapper.style.transformOrigin = '0 0';
        // Sync Store.zoom for code that reads it (ui render, export, etc.)
        Store._s.zoom = vp.scale;
    },

    _clampViewport() {
        const vp = this._viewport;
        const area = document.getElementById('canvas-area');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        const dim = this._getCanvasDimensions();
        const contentW = dim.w * vp.scale;
        const contentH = dim.h * vp.scale;
        
        // Mobile: keep at least 50% of canvas visible; Desktop: 100px margin
        const margin = this.isMobile() 
            ? Math.max(contentW * 0.5, contentH * 0.5) 
            : 100;

        // If content is smaller than viewport width, keep it centered
        if (contentW <= rect.width) {
            vp.x = (rect.width - contentW) / 2;
        } else {
            const minX = -(contentW - margin);
            const maxX = rect.width - margin;
            vp.x = Math.max(minX, Math.min(maxX, vp.x));
        }

        // If content is smaller than viewport height, keep it centered
        if (contentH <= rect.height) {
            vp.y = (rect.height - contentH) / 2;
        } else {
            const minY = -(contentH - margin);
            const maxY = rect.height - margin;
            vp.y = Math.max(minY, Math.min(maxY, vp.y));
        }
    },

    _centerViewport() {
        const vp = this._viewport;
        const area = document.getElementById('canvas-area');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        const dim = this._getCanvasDimensions();
        const contentW = dim.w * vp.scale;
        const contentH = dim.h * vp.scale;
        vp.x = (rect.width - contentW) / 2;
        vp.y = (rect.height - contentH) / 2;
    },

    // ── Zoom ──
    zoomIn() {
        const vp = this._viewport;
        const area = document.getElementById('canvas-area');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        const cx = rect.width / 2, cy = rect.height / 2;
        const newScale = Math.min(vp.scale + 0.1, vp.MAX_SCALE);
        vp.x = cx - (cx - vp.x) * (newScale / vp.scale);
        vp.y = cy - (cy - vp.y) * (newScale / vp.scale);
        vp.scale = newScale;
        this._clampViewport();
        this._applyViewportTransform();
        this._updateZoomDisplay();
    },
    zoomOut() {
        const vp = this._viewport;
        const area = document.getElementById('canvas-area');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        const cx = rect.width / 2, cy = rect.height / 2;
        const newScale = Math.max(vp.scale - 0.1, vp.MIN_SCALE);
        vp.x = cx - (cx - vp.x) * (newScale / vp.scale);
        vp.y = cy - (cy - vp.y) * (newScale / vp.scale);
        vp.scale = newScale;
        this._clampViewport();
        this._applyViewportTransform();
        this._updateZoomDisplay();
    },
    _getCanvasDimensions() {
        const d = getProjectDims();
        return { w: d.canvasW, h: d.canvasH };
    },
    zoomFit() {
        const area = document.getElementById('canvas-area');
        if (!area) return;
        const vp = this._viewport;
        const r = area.getBoundingClientRect();
        const dim = this._getCanvasDimensions();
        const mobile = this.isMobile();
        const pad = mobile ? 16 : 64;
        const fitW = (r.width - pad) / dim.w, fitH = (r.height - pad) / dim.h;
        if (mobile) {
            // Mobile: always fit width so each format fills screen width and looks distinct
            // Vertical = tall, Widescreen = short/wide, Square = square, Portrait = medium
            vp.scale = Math.min(fitW, 1);
        } else {
            vp.scale = Math.min(fitW, fitH, 1);
        }
        this._centerViewport();
        this._applyViewportTransform();
        this._updateZoomDisplay();
    },
    zoomReset() {
        const vp = this._viewport;
        vp.scale = 1;
        this._centerViewport();
        this._applyViewportTransform();
        this._updateZoomDisplay();
    },

    // ── Wheel zoom (zoom-at-cursor) ──
    _handleWheel(e) {
        e.preventDefault();
        const vp = this._viewport;
        const area = document.getElementById('canvas-area');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        const newScale = Math.max(vp.MIN_SCALE, Math.min(vp.MAX_SCALE, vp.scale + delta));
        if (newScale === vp.scale) return;

        // Zoom-at-cursor formula: keeps pixel under cursor fixed
        vp.x = mouseX - (mouseX - vp.x) * (newScale / vp.scale);
        vp.y = mouseY - (mouseY - vp.y) * (newScale / vp.scale);
        vp.scale = newScale;
        this._clampViewport();
        this._applyViewportTransform();
        this._updateZoomDisplay();
    },

    // ── Pan ──
    togglePanMode() {
        const vp = this._viewport;
        vp.mode = vp.mode === 'pan' ? 'select' : 'pan';
        Store.set({ panMode: vp.mode === 'pan' });
        this._updatePanCursor();
        this._updateZoomDisplay();
    },

    _updatePanCursor() {
        const canvas = document.getElementById('canvas-area');
        if (!canvas) return;
        const vp = this._viewport;
        if (vp.isPanning) {
            canvas.classList.add('panning');
            canvas.classList.remove('pan-active');
        } else if (this._spacePressed || vp.mode === 'pan') {
            canvas.classList.add('pan-active');
            canvas.classList.remove('panning');
        } else {
            canvas.classList.remove('pan-active', 'panning');
        }
        // pan-mode class for CSS overlay hiding
        if (vp.mode === 'pan' || vp.isPanning) {
            canvas.classList.add('pan-mode');
        } else {
            canvas.classList.remove('pan-mode');
        }
    },

    _startPan(e) {
        const vp = this._viewport;
        e.preventDefault();
        vp.isPanning = true;
        vp.panStartX = e.clientX;
        vp.panStartY = e.clientY;
        vp.panStartVX = vp.x;
        vp.panStartVY = vp.y;
        this._updatePanCursor();

        const move = (ev) => {
            const dx = ev.clientX - vp.panStartX;
            const dy = ev.clientY - vp.panStartY;
            vp.x = vp.panStartVX + dx;
            vp.y = vp.panStartVY + dy;
            this._clampViewport();
            this._applyViewportTransform();
        };

        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            vp.isPanning = false;
            this._updatePanCursor();
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        return true;
    },

    handleCanvasAreaMouseDown(e) {
        const vp = this._viewport;
        // Middle mouse button — always pan
        if (e.button === 1) {
            e.preventDefault();
            return this._startPan(e);
        }
        // Left click when space pressed or pan mode
        if (e.button === 0 && (this._spacePressed || vp.mode === 'pan')) {
            return this._startPan(e);
        }
        // Left click on empty canvas area when zoomed — pan
        if (e.button === 0 && vp.scale > 1) {
            const t = e.target;
            if (t.id === 'canvas-area' || t.id === 'canvas-scroll' || t.classList.contains('bento-frame')) {
                return this._startPan(e);
            }
        }
        return false;
    },

    resetPan() {
        const vp = this._viewport;
        vp.x = 0; vp.y = 0;
        this._centerViewport();
        this._applyViewportTransform();
        // Compat: also reset Store panOffset
        Store._s.panOffset = { x: 0, y: 0 };
    },

    _updateZoomDisplay() {
        const el = document.querySelector('.zoom-pct');
        if (el) el.textContent = Math.round(this._viewport.scale * 100) + '%';
    },

    _initViewportEvents() {
        const area = document.getElementById('canvas-area');
        if (!area || area._viewportBound) return;
        area._viewportBound = true;
        // Wheel with passive:false to allow preventDefault
        area.addEventListener('wheel', (e) => this._handleWheel(e), { passive: false });

        // ── Touch events for mobile pan + pinch-to-zoom ──
        let touchState = { type: null, startX: 0, startY: 0, startVX: 0, startVY: 0, startDist: 0, startScale: 0, centerX: 0, centerY: 0, startTime: 0 };

        area.addEventListener('touchstart', (e) => {
            const vp = this._viewport;
            if (e.touches.length === 2) {
                // Pinch-to-zoom
                e.preventDefault();
                const t0 = e.touches[0], t1 = e.touches[1];
                const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
                const rect = area.getBoundingClientRect();
                touchState = {
                    type: 'pinch',
                    startDist: dist,
                    startScale: vp.scale,
                    centerX: ((t0.clientX + t1.clientX) / 2) - rect.left,
                    centerY: ((t0.clientY + t1.clientY) / 2) - rect.top,
                    startVX: vp.x,
                    startVY: vp.y,
                    startX: 0, startY: 0, startTime: Date.now()
                };
            } else if (e.touches.length === 1) {
                const t = e.target;
                const isCanvasBg = (t.id === 'canvas-area' || t.id === 'canvas-scroll' || t.classList.contains('bento-frame'));
                const isPanMode = vp.mode === 'pan';
                // Check if crop mode touch on a panel
                if (this._cropMode && this._cropMode.active) {
                    // Let crop mode handle it via startImagePanTouch
                    return;
                }
                if (isPanMode || isCanvasBg) {
                    touchState = {
                        type: 'pan',
                        startX: e.touches[0].clientX,
                        startY: e.touches[0].clientY,
                        startVX: vp.x,
                        startVY: vp.y,
                        startDist: 0, startScale: 0, centerX: 0, centerY: 0,
                        startTime: Date.now()
                    };
                    vp.isPanning = true;
                    this._updatePanCursor();
                }
            }
        }, { passive: false });

        area.addEventListener('touchmove', (e) => {
            const vp = this._viewport;
            if (touchState.type === 'pinch' && e.touches.length >= 2) {
                e.preventDefault();
                const t0 = e.touches[0], t1 = e.touches[1];
                const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
                const ratio = dist / touchState.startDist;
                const newScale = Math.max(vp.MIN_SCALE, Math.min(vp.MAX_SCALE, touchState.startScale * ratio));
                // Zoom at center point between fingers
                vp.x = touchState.centerX - (touchState.centerX - touchState.startVX) * (newScale / touchState.startScale);
                vp.y = touchState.centerY - (touchState.centerY - touchState.startVY) * (newScale / touchState.startScale);
                vp.scale = newScale;
                this._clampViewport();
                this._applyViewportTransform();
                this._updateZoomDisplay();
            } else if (touchState.type === 'pan' && e.touches.length === 1) {
                e.preventDefault();
                const dx = e.touches[0].clientX - touchState.startX;
                const dy = e.touches[0].clientY - touchState.startY;
                vp.x = touchState.startVX + dx;
                vp.y = touchState.startVY + dy;
                this._clampViewport();
                this._applyViewportTransform();
            }
        }, { passive: false });

        area.addEventListener('touchend', (e) => {
            if (touchState.type === 'pan' && e.touches.length === 0) {
                const vp = this._viewport;
                vp.isPanning = false;
                this._updatePanCursor();
                // ── Swipe page navigation detection ──
                // Only when NOT in pan mode and swipe is fast + long enough
                if (vp.mode !== 'pan' && e.changedTouches.length === 1) {
                    const endX = e.changedTouches[0].clientX;
                    const dx = endX - touchState.startX;
                    const elapsed = (Date.now() - touchState.startTime) / 1000; // seconds
                    const velocity = Math.abs(dx) / Math.max(elapsed, 0.01);
                    const screenW = window.innerWidth;
                    if (velocity > 500 && Math.abs(dx) > screenW * 0.3) {
                        const p = Store.get('currentProject');
                        const idx = Store.get('activePageIndex');
                        if (dx > 0 && idx > 0) {
                            this.setActivePage(idx - 1);
                            renderCanvas(); renderRightPanel();
                        } else if (dx < 0 && p && idx < p.pages.length - 1) {
                            this.setActivePage(idx + 1);
                            renderCanvas(); renderRightPanel();
                        }
                    }
                }
                touchState.type = null;
                return;
            }
            if (touchState.type === 'pinch') {
                const vp = this._viewport;
                vp.isPanning = false;
                this._updatePanCursor();
            }
            if (e.touches.length === 0) {
                touchState.type = null;
            } else if (e.touches.length === 1 && touchState.type === 'pinch') {
                // Went from pinch to single finger — switch to pan
                const vp = this._viewport;
                touchState = {
                    type: 'pan',
                    startX: e.touches[0].clientX,
                    startY: e.touches[0].clientY,
                    startVX: vp.x,
                    startVY: vp.y,
                    startDist: 0, startScale: 0, centerX: 0, centerY: 0,
                    startTime: Date.now()
                };
                vp.isPanning = true;
            }
        }, { passive: false });

        // Initial fit
        this.zoomFit();
    },

    // ── Guides ──
    toggleGuides() { Store.set({ showGuides: !Store.get('showGuides') }); },

    // ── Multi-Language ──
    setActiveLanguage(lang) {
        const p = Store.get('currentProject');
        if (!p) return;
        p.activeLanguage = lang;
        Store.set({ currentProject: p });
        Store.save();
        
        // Re-render entire editor to update toolbar language buttons
        document.getElementById('app').innerHTML = renderEditor();
        renderPageList();
        renderCanvas();
        renderRightPanel();
        renderTimeline();
        
        // Show language activation message
        const langInfo = window.I18n?.languages[lang] || { flag: '', name: lang };
        Toast.show(`${langInfo.flag} ${langInfo.name} ativo`, 'info', 1500);
    },
    toggleActiveLanguage() {
        const p = Store.get('currentProject');
        if (!p) return;
        const current = p.activeLanguage || 'pt-BR';
        this.setActiveLanguage(current === 'pt-BR' ? 'en' : 'pt-BR');
    },

    // ── Text/Balloons ──
    selectElement(type, id) { Store.set({ selectedElement: { type, id }, selectedSlot: -1 }); },
    updateTextContent(id, c) { const page = Store.getActivePage(); if (!page) return; const t = page.texts.find(t => t.id === id); if (t) { t.content = c; Store.save(); } },
    changeTextType(id, type) { const p = Store.get('currentProject'), page = Store.getActivePage(); if (!page) return; const t = page.texts.find(t => t.id === id); if (!t) return; Store.pushUndo(); t.type = type; Store.set({ currentProject: p }); Store.save(); },
    updateTextStyle(id, prop, val) { const p = Store.get('currentProject'), page = Store.getActivePage(); if (!page) return; const t = page.texts.find(t => t.id === id); if (!t) return; t.style[prop] = val; Store.set({ currentProject: p }); Store.save(); },
    setTailDirection(id, d) { const p = Store.get('currentProject'), page = Store.getActivePage(); if (!page) return; const t = page.texts.find(t => t.id === id); if (!t) return; Store.pushUndo(); t.tailDirection = d; Store.set({ currentProject: p }); Store.save(); },
    deleteText(id) { const p = Store.get('currentProject'), page = Store.getActivePage(); if (!page) return; Store.pushUndo(); page.texts = page.texts.filter(t => t.id !== id); Store.set({ currentProject: p, selectedElement: null }); Store.save(); },
    startDragBalloon(e, id) {
        if (e.target.contentEditable === 'true') return; e.preventDefault();
        const page = Store.getActivePage(); if (!page) return; const txt = page.texts.find(t => t.id === id); if (!txt) return;
        const sx = e.clientX, sy = e.clientY, ox = txt.position.x, oy = txt.position.y;
        const move = ev => { txt.position.x = ox + (ev.clientX - sx) / Store.get('zoom'); txt.position.y = oy + (ev.clientY - sy) / Store.get('zoom'); renderCanvas(); };
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); Store.save(); };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    },
    // Balloon drag by index (used by new renderBalloons)
    startBalloonDrag(e, index) {
        const page = Store.getActivePage(); if (!page || !page.texts[index]) return;
        const balloon = page.texts[index];
        if (balloon.locked) return;
        const fromEditable = !!(e.target && e.target.closest && e.target.closest('[contenteditable="true"]'));
        if (!fromEditable) e.preventDefault();
        const sx = e.clientX, sy = e.clientY;
        const ox = balloon.x || 100, oy = balloon.y || 100;
        const wrapper = (e.target?.closest ? e.target.closest('.balloon-css') : null) || document.querySelector(`[data-balloon-idx="${index}"]`) || null;
        const threshold = 4;
        let dragging = false;
        Store.set({ selectedElement: { type: 'balloon', index } });
        
        const move = ev => {
            if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) < threshold) return;
            if (!dragging) {
                dragging = true;
                Store.setSilent({ isDraggingBalloon: true });
                document.body.style.userSelect = 'none';
            }
            balloon.x = ox + (ev.clientX - sx) / Store.get('zoom');
            balloon.y = oy + (ev.clientY - sy) / Store.get('zoom');
            if (wrapper) {
                wrapper.style.left = `${balloon.x}px`;
                wrapper.style.top = `${balloon.y}px`;
            } else {
                renderCanvas();
            }
        };
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            Store.setSilent({ isDraggingBalloon: false });
            document.body.style.userSelect = '';
            if (dragging) {
                // Clamp balloon so at least 30px stays visible
                const margin = 30;
                const dims = getProjectDims();
                const pageW = dims.contentW, pageH = dims.contentH;
                balloon.x = Math.max(-balloon.w + margin, Math.min(pageW - margin, balloon.x));
                balloon.y = Math.max(-balloon.h + margin, Math.min(pageH - margin, balloon.y));
                if (balloon.type === 'narration') {
                    this._autoSnapNarrationToPanel(index);
                }
                Store.save();
                renderCanvas();
            }
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    },
    selectBalloon(index) {
        Store.set({ selectedElement: { type: 'balloon', index }, selectedSlot: -1 });
        renderRightPanel();
        // Don't re-render canvas if any contenteditable is focused (would destroy focus)
        const activeEl = document.activeElement;
        if (!(activeEl && (activeEl.isContentEditable || activeEl.tagName === 'TEXTAREA'))) {
            renderCanvas();
        }
    },
    selectPrevBalloon() {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const prev = sel.index - 1;
        if (prev >= 0) this.selectBalloon(prev);
    },
    selectNextBalloon() {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts) return;
        const next = sel.index + 1;
        if (next < page.texts.length) this.selectBalloon(next);
    },
    handleCanvasPageClick(e) {
        if (this._placementMode) {
            if (this._handlePlacementClick(e)) return;
        }
        this.deselectAll();
    },
    deselectAll() {
        const se = Store.get('selectedElement');
        const ss = Store.get('selectedSlot');
        // Only act if something is actually selected — avoids unnecessary re-renders
        if (se !== null || (ss != null && ss >= 0)) {
            // Blur any focused contenteditable first to save changes
            if (document.activeElement && document.activeElement.isContentEditable) {
                document.activeElement.blur();
            }
            Store.set({ selectedElement: null, selectedSlot: -1 });
            renderCanvas();
            renderRightPanel();
        }
    },
    setBalloonCornerRadius(radius) {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const balloon = page.texts[sel.index];
        balloon.cornerRadius = radius;
        const valEl = document.getElementById('val-corner-radius');
        if (valEl) valEl.textContent = radius + 'px';
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            wrapper.style.setProperty('--b-radius', radius + 'px');
        }
        Store.save();
    },
    setBalloonBg(color) {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const balloon = page.texts[sel.index];
        balloon.bgColor = color;
        
        // Auto-contraste: calcular se cor é escura
        const isDark = this._isColorDark(color);
        balloon.textColor = isDark ? '#ffffff' : '#1a1a1a';
        
        document.querySelectorAll('.ccs-btn').forEach(btn => {
            btn.classList.toggle('active', btn.style.background === color || btn.style.backgroundColor === color);
        });
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            wrapper.style.setProperty('--b-bg', color);
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) textEl.style.color = balloon.textColor;
            
            // Shout: also update SVG fill
            if (balloon.type === 'shout') {
                const svgLayer = wrapper.querySelector('.shout-svg-bg');
                if (svgLayer && typeof BalloonSVGRenderer !== 'undefined') {
                    svgLayer.innerHTML = BalloonSVGRenderer.shout(balloon.w, balloon.h || 120, balloon.direction || 's', { fill: color, stroke: balloon.strokeColor || '#1a1a1a', strokeWidth: 2.5 });
                }
            }
        }
        Store.save();
        renderRightPanel();
    },
    setBalloonTextColor(color) {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const balloon = page.texts[sel.index];
        balloon.textColor = color;
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) textEl.style.color = color;
        }
        Store.save();
        renderRightPanel();
    },
    editBgCustomColor(index, btn) {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = ColorPresets.getBgCustom()[index] || '#ffffff';
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        document.body.appendChild(input);
        input.addEventListener('input', (e) => {
            const color = e.target.value;
            ColorPresets.setBgCustom(index, color);
            if (btn) btn.style.setProperty('--sw', color);
            this.setBalloonBg(color);
        });
        input.addEventListener('change', () => {
            input.remove();
            renderRightPanel();
        });
        input.click();
    },
    editTextCustomColor(index, btn) {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = ColorPresets.getTextCustom()[index] || '#000000';
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        document.body.appendChild(input);
        input.addEventListener('input', (e) => {
            const color = e.target.value;
            ColorPresets.setTextCustom(index, color);
            if (btn) btn.style.setProperty('--sw', color);
            this.setBalloonTextColor(color);
        });
        input.addEventListener('change', () => {
            input.remove();
            renderRightPanel();
        });
        input.click();
    },
    setBalloonPositionMode(mode) {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const balloon = page.texts[sel.index];
        if (balloon.type !== 'narration') return;
        
        balloon.positionMode = mode;
        
        if (mode === 'free') {
            const panel = this._findPanelForBalloon(balloon);
            if (panel && (!balloon.w || balloon.w === panel.w)) balloon.w = 220;
        }
        
        this._autoSnapNarrationToPanel(sel.index);
        Store.save();
        renderCanvas();
        renderRightPanel();
    },
    _isColorDark(hex) {
        if (!hex || hex.length < 6) return false;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        // Fórmula de luminância relativa
        return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
    },
    setSFXRotation(degrees) {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const balloon = page.texts[sel.index];
        if (balloon.type !== 'sfx') return;
        
        balloon.rotation = degrees;
        document.getElementById('val-sfx-rotation').textContent = degrees + '°';
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            wrapper.style.transform = `rotate(${degrees}deg)`;
        }
        Store.save();
    },
    setBalloonLineHeight(value) {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const balloon = page.texts[sel.index];
        
        balloon.lineHeight = value;
        const valEl = document.getElementById('val-line-height');
        if (valEl) valEl.textContent = value.toFixed(2);
        
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) textEl.style.lineHeight = value;
        }
        Store.save();
    },
    setBalloonLetterSpacing(value) {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const balloon = page.texts[sel.index];
        
        balloon.letterSpacing = value;
        const valEl = document.getElementById('val-letter-spacing');
        if (valEl) valEl.textContent = value + '%';
        
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) textEl.style.letterSpacing = (value / 100) + 'em';
        }
        Store.save();
    },
    // ── Text Formatting Toggles ──
    toggleBalloonBold() {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const b = page.texts[sel.index];
        b.bold = !b.bold;
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) textEl.style.fontWeight = b.bold ? '700' : '400';
        }
        Store.save();
        renderRightPanel();
    },
    toggleBalloonItalic() {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const b = page.texts[sel.index];
        b.italic = !b.italic;
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) textEl.style.fontStyle = b.italic ? 'italic' : 'normal';
        }
        Store.save();
        renderRightPanel();
    },
    toggleBalloonUnderline() {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const b = page.texts[sel.index];
        b.underline = !b.underline;
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) textEl.style.textDecoration = b.underline ? 'underline' : 'none';
        }
        Store.save();
        renderRightPanel();
    },
    setBalloonTextAlign(align) {
        const sel = Store.get('selectedElement');
        if (!sel || sel.type !== 'balloon') return;
        const page = Store.getActivePage();
        if (!page || !page.texts[sel.index]) return;
        const b = page.texts[sel.index];
        b.textAlign = align;
        const wrapper = document.querySelector(`[data-balloon-idx="${sel.index}"]`);
        if (wrapper) {
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) textEl.style.textAlign = align;
        }
        Store.save();
        renderRightPanel();
    },
    saveBalloonText(index, text) {
        const page = Store.getActivePage(); if (!page || !page.texts[index]) return;
        const p = Store.get('currentProject');
        const balloon = page.texts[index];
        const lang = p?.activeLanguage || 'pt-BR';
        
        // Multi-language support: update text for active language
        if (typeof balloon.text === 'string') {
            balloon.text = { 'pt-BR': balloon.text, 'en': '' };
        }
        const oldText = MultiLang.get(balloon.text, lang);
        if (oldText === text) return;
        
        balloon.text = MultiLang.set(balloon.text, lang, text);
        balloon.manualSize = false; // Reset — text change = auto-resize
        this._recalcBalloonSize(balloon);
        
        Store.save(); // Salva sem engatilhar render via set
        // Removido renderCanvas() aqui para não perder foco
    },
    
    // Debounced balloon save for live typing — CSS-first: no resize needed, height:auto
    _balloonSaveTimeout: null,
    debouncedBalloonResize(index, text) {
        // CSS-first: height is auto, no DOM resize needed for CSS types.
        // Only shout needs SVG update after text changes.
        clearTimeout(this._balloonSaveTimeout);
        this._balloonSaveTimeout = setTimeout(() => {
            const page = Store.getActivePage();
            const p = Store.get('currentProject');
            if (!page || !page.texts[index]) return;
            const balloon = page.texts[index];
            const lang = p?.activeLanguage || 'pt-BR';
            
            // Multi-language support
            if (typeof balloon.text === 'string') {
                balloon.text = { 'pt-BR': balloon.text, 'en': '' };
            }
            balloon.text = MultiLang.set(balloon.text, lang, text);
            
            // Shout: update SVG to match new auto-height
            if (balloon.type === 'shout') {
                this._updateShoutSvg(index);
            }
            Store.save();
        }, 300);
    },
    startBalloonResize(e, index, corner) {
        e.preventDefault();
        const page = Store.getActivePage(); if (!page || !page.texts[index]) return;
        const balloon = page.texts[index];
        const startX = e.clientX, startY = e.clientY;
        const origW = balloon.w || 180, origH = balloon.h || 100;
        const origX = balloon.x || 100, origY = balloon.y || 100;
        const zoom = Store.get('zoom');
        const MIN_W = 60;
        const MIN_H = 60;
        const wrapper = document.querySelector(`[data-balloon-idx="${index}"]`);
        const isShout = balloon.type === 'shout';
        const isSfx = balloon.type === 'sfx';
        const origFontSize = balloon.fontSize || (isSfx ? 48 : 14);
        
        Store.pushUndo();
        Store.setSilent({ isResizingBalloon: true });
        balloon.manualSize = true;
        
        const move = (ev) => {
            const dx = (ev.clientX - startX) / zoom;
            const dy = (ev.clientY - startY) / zoom;
            
            // CSS types: only resize width. Shout: resize both. SFX: scale font-size.
            if (corner === 'se') {
                balloon.w = Math.max(MIN_W, origW + dx);
                if (isShout) balloon.h = Math.max(MIN_H, origH + dy);
                if (isSfx) {
                    const scaleFactor = Math.max(MIN_W, origW + dx) / origW;
                    balloon.fontSize = Math.round(Math.max(12, Math.min(200, origFontSize * scaleFactor)));
                }
            } else if (corner === 'sw') {
                const newW = Math.max(MIN_W, origW - dx);
                balloon.x = origX + (origW - newW);
                balloon.w = newW;
                if (isShout) balloon.h = Math.max(MIN_H, origH + dy);
                if (isSfx) {
                    const scaleFactor = newW / origW;
                    balloon.fontSize = Math.round(Math.max(12, Math.min(200, origFontSize * scaleFactor)));
                }
            } else if (corner === 'ne') {
                balloon.w = Math.max(MIN_W, origW + dx);
                if (isShout) {
                    const newH = Math.max(MIN_H, origH - dy);
                    balloon.y = origY + (origH - newH);
                    balloon.h = newH;
                }
                if (isSfx) {
                    const scaleFactor = Math.max(MIN_W, origW + dx) / origW;
                    balloon.fontSize = Math.round(Math.max(12, Math.min(200, origFontSize * scaleFactor)));
                }
            } else if (corner === 'nw') {
                const newW = Math.max(MIN_W, origW - dx);
                balloon.x = origX + (origW - newW);
                balloon.w = newW;
                if (isShout) {
                    const newH = Math.max(MIN_H, origH - dy);
                    balloon.y = origY + (origH - newH);
                    balloon.h = newH;
                }
                if (isSfx) {
                    const scaleFactor = newW / origW;
                    balloon.fontSize = Math.round(Math.max(12, Math.min(200, origFontSize * scaleFactor)));
                }
            }

            if (wrapper) {
                wrapper.style.left = `${balloon.x || 0}px`;
                wrapper.style.top = `${balloon.y || 0}px`;
                wrapper.style.width = `${balloon.w || 0}px`;
                // Shout: update SVG with new dimensions
                if (isShout) {
                    const svgLayer = wrapper.querySelector('.shout-svg-bg');
                    if (svgLayer && typeof BalloonSVGRenderer !== 'undefined') {
                        svgLayer.innerHTML = BalloonSVGRenderer.shout(balloon.w, balloon.h || 120, balloon.direction || 's', { fill: balloon.bgColor || '#fffde7', stroke: balloon.strokeColor || '#1a1a1a', strokeWidth: 2.5 });
                    }
                }
            }
        };
        
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            Store.setSilent({ isResizingBalloon: false });
            if (balloon.type === 'narration') this._autoSnapNarrationToPanel(index);
            // For shout, capture final height from DOM
            if (isShout && wrapper) {
                balloon.h = wrapper.offsetHeight;
            }
            Store.save();
            renderCanvas();
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    },
    _recalcBalloonSize(balloon) {
        if (!balloon) return;
        const type = balloon.type || 'speech';
        const manuallyResized = balloon.manualSize === true;
        if (manuallyResized) return;

        // CSS-first: height is auto for all types except shout.
        // We only need to set initial w for new balloons (not override existing).
        // Shout still needs h for SVG sizing.
        if (type === 'shout') {
            // Shout: use TextMeasurer if available for initial sizing
            if (typeof TextMeasurer !== 'undefined' && TextMeasurer.calcBalloonSize) {
                const text = balloon.text || '';
                const fontSize = balloon.fontSize || 16;
                const fontId = balloon.font || 'comic';
                const { w, h } = TextMeasurer.calcBalloonSize(text, fontSize, fontId, type);
                balloon.w = w;
                balloon.h = h;
            }
            return;
        }

        // CSS types: just ensure reasonable w if not set. Height is auto via CSS.
        if (!balloon.w || balloon.w < 60) {
            const defaultWidths = { speech: 180, thought: 180, whisper: 160, narration: 220, sfx: 150 };
            balloon.w = defaultWidths[type] || 180;
        }
    },
    _findPanelForBalloon(balloon) {
        const p = Store.get('currentProject');
        const page = Store.getActivePage();
        if (!p || !page || !balloon) return null;
        const layoutId = page.layoutId || LayoutEngine.getDefaultForCount(page.images?.length || 1);
        const tmpl = LayoutEngine.get(layoutId, page.images || [], p);
        if (!tmpl?.panels?.length) return null;
        const _dims = getProjectDims();
        const pageH = _dims.contentH;
        const textBelowH = page.showTextBelow ? Math.min(page.narrativeHeight || 120, Math.round(pageH * 0.4)) : 0;
        const panelZoneH = pageH - textBelowH;
        const scaleY = panelZoneH / (Math.max(...tmpl.panels.map(pp => pp.y + pp.h)) || 1);
        const cx = (balloon.x || 0) + (balloon.w || 0) / 2;
        const cy = (balloon.y || 0) + (balloon.h || 0) / 2;
        for (let i = 0; i < tmpl.panels.length; i++) {
            const panel = tmpl.panels[i];
            const px = Math.round(panel.x);
            const py = Math.round(panel.y * scaleY);
            const pw = Math.round(panel.w);
            const ph = Math.round(panel.h * scaleY);
            if (cx >= px && cx <= px + pw && cy >= py && cy <= py + ph) {
                return { x: px, y: py, w: pw, h: ph, index: i };
            }
        }
        return null;
    },
    _autoSnapNarrationToPanel(index) {
        const page = Store.getActivePage();
        if (!page || !page.texts[index]) return;
        const balloon = page.texts[index];
        if (balloon.type !== 'narration') return;
        const panel = this._findPanelForBalloon(balloon);
        if (!panel) return;
        const mode = balloon.positionMode || 'free';
        const domEl = document.querySelector(`[data-balloon-idx="${index}"]`);
        const actualH = domEl ? domEl.offsetHeight : (balloon.h || 60);
        
        // Get page dimensions for full-width snap
        const proj = Store.get('currentProject');
        const pageW = proj?.format === '16:9' ? 1920 : proj?.format === '9:16' ? 1080 : 1920;

        if (mode === 'top' || mode === 'bottom') {
            // Full-width snap: use entire page width
            balloon.x = 0;
            balloon.w = pageW;
            balloon.snapPosition = mode;
            balloon.y = mode === 'top'
                ? 0
                : (proj?.format === '16:9' ? 1080 : proj?.format === '9:16' ? 1920 : 1080) - actualH;
        } else {
            const margin = 10;
            balloon.x = panel.x + margin;
            balloon.w = Math.max(120, panel.w - margin * 2);
            const centerY = (balloon.y || 0) + actualH / 2;
            const panelMid = panel.y + panel.h / 2;
            const snap = centerY <= panelMid ? 'top' : 'bottom';
            balloon.snapPosition = snap;
            balloon.y = snap === 'top'
                ? panel.y + margin
                : panel.y + panel.h - actualH - margin;
        }
    },
    // ── Click-to-place balloon mode ──
    _placementMode: null, // { type: 'speech'|'thought'|etc } or null
    _placementListener: null,

    startBalloonPlacement(type = 'speech') {
        if (this._placementMode) this.cancelPlacement();
        this._placementMode = { type };
        
        // FIX: Close mobile drawer so user can click on canvas
        if (this.isMobile()) {
            this.closeMobileSidebar();
        }
        
        const area = document.getElementById('canvas-area');
        if (area) area.classList.add('placement-active');
        // Highlight the active balloon button
        document.querySelectorAll('.balloon-toolbox button').forEach(b => b.classList.remove('placement-highlight'));
        const activeBtn = document.querySelector(`.balloon-toolbox button[data-balloon-type="${type}"]`);
        if (activeBtn) activeBtn.classList.add('placement-highlight');
        const labels = { speech:'Fala', thought:'Pensamento', shout:'Grito', whisper:'Sussurro', narration:'Narração', sfx:'SFX' };
        Toast.show(`Clique no canvas para posicionar: ${labels[type] || type}`, 'info', 2500);
        // Capture-phase listener: fires before stopPropagation in panels
        this._placementListener = (e) => {
            const canvasPage = document.getElementById('canvas-page');
            if (!canvasPage) return;
            // Only handle clicks inside the canvas-page area
            const rect = canvasPage.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
                this.cancelPlacement();
                return;
            }
            e.stopPropagation();
            e.preventDefault();
            const vp = this._viewport;
            const x = (e.clientX - rect.left) / vp.scale;
            const y = (e.clientY - rect.top) / vp.scale;
            const placedType = this._placementMode.type;
            this.cancelPlacement();
            this.addBalloonAtPosition(placedType, x, y);
        };
        document.addEventListener('click', this._placementListener, true);
    },

    cancelPlacement() {
        this._placementMode = null;
        const area = document.getElementById('canvas-area');
        if (area) area.classList.remove('placement-active');
        document.querySelectorAll('.balloon-toolbox button.placement-highlight').forEach(b => b.classList.remove('placement-highlight'));
        if (this._placementListener) {
            document.removeEventListener('click', this._placementListener, true);
            this._placementListener = null;
        }
    },

    addBalloonAtPosition(type, x, y) {
        const p = Store.get('currentProject'), page = Store.getActivePage(); if (!p || !page) return;
        if (!page.texts) page.texts = [];
        if (page.texts.length >= 30) { Toast.show(t('toast.maxBalloonsReached'), 2500); return; }
        Store.pushUndo();
        const typeDefaults = {
            speech: { fontSize: 15, font: 'comic', direction: 's' },
            thought: { fontSize: 15, font: 'comic', direction: 's' },
            shout: { fontSize: 20, font: 'comic', direction: 's' },
            whisper: { fontSize: 12, font: 'comic', direction: 's' },
            narration: { fontSize: 13, font: 'serif', direction: 'center' },
            sfx: { fontSize: 42, font: 'comic', direction: 'center' }
        };
        const def = typeDefaults[type] || typeDefaults.speech;
        const w = type === 'narration' ? 220 : (type === 'sfx' ? 120 : 120);
        const h = type === 'narration' ? 60 : (type === 'shout' ? 80 : 70);
        const draft = {
            type, x: x - w / 2, y: y - h / 2, w, h,
            text: type === 'sfx' ? 'BOOM!' : '',
            direction: def.direction, font: def.font, fontSize: def.fontSize,
            manualSize: false, bold: false, italic: false, underline: false, textAlign: 'center'
        };
        if (type === 'narration') { draft.bgColor = '#fffde7'; draft.cornerRadius = 4; draft.direction = 'none'; }
        if (type === 'sfx') draft.sfxPreset = 'boom';
        this._recalcBalloonSize(draft);
        page.texts.push({ ...draft });
        const newIndex = page.texts.length - 1;
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: newIndex } });
        Store.save();
        Toast.show(t('toast.balloonPositioned'));
        renderCanvas(); renderRightPanel();
        this._focusBalloonText(newIndex);
    },

    addBalloonToPage(type = 'speech') {
        const p = Store.get('currentProject'), page = Store.getActivePage(); if (!p || !page) return;
        
        // Matéria context guard
        const isMateria = page?.type === 'materia' || page?.isMateria === true;
        const BLOCKED_IN_MATERIA = ['thought', 'shout', 'sfx'];
        if (isMateria && BLOCKED_IN_MATERIA.includes(type)) {
            const labels = { thought: 'Pensamento', shout: 'Grito', sfx: 'SFX/Onomatopeia' };
            Toast.show(t('toast.balloonNotForMateria', { type: labels[type] || type }), 3500);
            return;
        }
        
        // Stress guard: max 30 balloons per page
        if (!page.texts) page.texts = [];
        if (page.texts.length >= 30) {
            Toast.show(t('toast.maxBalloonsReached'), 2500);
            return;
        }
        
        Store.pushUndo();
        const typeDefaults = {
            speech: { fontSize: 15, font: 'comic', direction: 's' },
            thought: { fontSize: 15, font: 'comic', direction: 's' },
            shout: { fontSize: 20, font: 'comic', direction: 's' },
            whisper: { fontSize: 12, font: 'comic', direction: 's' },
            narration: { fontSize: 13, font: 'serif', direction: 'center' },
            sfx: { fontSize: 42, font: 'comic', direction: 'center' }
        };
        const def = typeDefaults[type] || typeDefaults.speech;
        // Smart positioning: distribute balloons across canvas based on existing count
        const existingCount = page.texts.length;
        const canvasW = p.width || 1080;
        const canvasH = p.height || 1920;
        const cols = 3;
        const rows = Math.ceil(30 / cols);
        const cellW = canvasW / cols;
        const cellH = canvasH / rows;
        const col = existingCount % cols;
        const row = Math.floor(existingCount / cols) % rows;
        const baseX = col * cellW + cellW * 0.3 + Math.random() * cellW * 0.4;
        const baseY = row * cellH + cellH * 0.3 + Math.random() * cellH * 0.4;
        
        const draft = {
            type,
            x: baseX,
            y: baseY,
            w: type === 'narration' ? 220 : (type === 'sfx' ? 120 : 120),
            h: type === 'narration' ? 60 : (type === 'shout' ? 80 : 70),
            text: type === 'sfx' ? 'BOOM!' : '',
            direction: def.direction,
            font: def.font,
            fontSize: def.fontSize,
            manualSize: false,
            bold: false,
            italic: false,
            underline: false,
            textAlign: 'center'
        };
        if (type === 'narration') {
            draft.bgColor = '#fffde7';
            draft.cornerRadius = 4;
            draft.direction = 'none';
        }
        if (type === 'sfx') draft.sfxPreset = 'boom';
        this._recalcBalloonSize(draft);
        page.texts.push({
            ...draft
        });
        const newIndex = page.texts.length - 1;
        if (type === 'narration') this._autoSnapNarrationToPanel(newIndex);
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: newIndex } }); 
        Store.save();
        Toast.show(t('toast.balloonAdded'));
        renderCanvas();
        renderRightPanel();
        
        // Auto-focus the new balloon after DOM is ready
        this._focusBalloonText(newIndex);
    },
    
    // Helper: Focus balloon text and place cursor at end
    _focusBalloonText(index) {
        requestAnimationFrame(() => {
            const textEl = document.querySelector(`[data-balloon-index="${index}"]`);
            if (textEl) {
                textEl.contentEditable = 'true';
                textEl.focus();
                this._setCursorAtEnd(textEl);
            }
        });
    },
    
    // Helper: Move cursor to end of contenteditable
    _setCursorAtEnd(el) {
        if (!el) return;
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false); // false = collapse to end
        sel.removeAllRanges();
        sel.addRange(range);
    },

    // CSS-first: Enter edit mode on double-click
    editBalloonCss(index) {
        const wrapper = document.querySelector(`[data-balloon-idx="${index}"]`);
        if (!wrapper) return;
        const textEl = wrapper.querySelector('.balloon-text-css');
        if (!textEl) return;
        textEl.contentEditable = 'true';
        textEl.style.pointerEvents = 'auto';
        textEl.focus();
        this._setCursorAtEnd(textEl);
        this.selectBalloon(index);
    },

    // CSS-first: Save text on blur, exit edit mode
    saveBalloonTextCss(index, text) {
        const page = Store.getActivePage();
        if (!page || !page.texts[index]) return;
        const balloon = page.texts[index];
        const oldText = balloon.text || '';
        balloon.text = text;
        // Exit edit mode
        const wrapper = document.querySelector(`[data-balloon-idx="${index}"]`);
        if (wrapper) {
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) {
                textEl.contentEditable = 'false';
                textEl.style.pointerEvents = '';
            }
        }
        if (oldText !== text) Store.save();
    },

    // CSS-first: Update shout SVG after text changes height (with save)
    _updateShoutSvg(index) {
        const page = Store.getActivePage();
        if (!page || !page.texts[index]) return;
        const balloon = page.texts[index];
        if (balloon.type !== 'shout') return;
        const wrapper = document.querySelector(`[data-balloon-idx="${index}"]`);
        if (!wrapper) return;
        const newW = wrapper.offsetWidth;
        const newH = wrapper.offsetHeight;
        balloon.w = newW;
        balloon.h = newH;
        const svgLayer = wrapper.querySelector('.shout-svg-bg');
        if (svgLayer && typeof BalloonSVGRenderer !== 'undefined') {
            const dir = balloon.direction || 's';
            const bg = balloon.bgColor || '#fffde7';
            const stroke = balloon.strokeColor || '#1a1a1a';
            svgLayer.innerHTML = BalloonSVGRenderer.shout(newW, newH, dir, { fill: bg === '#ffffff' ? '#fffde7' : bg, stroke, strokeWidth: 2.5 });
        }
        Store.save();
    },
    
    // Live SVG update during typing (no save, called on oninput)
    _updateShoutSvgLive(index) {
        const page = Store.getActivePage();
        if (!page || !page.texts[index]) return;
        const balloon = page.texts[index];
        if (balloon.type !== 'shout') return;
        const wrapper = document.querySelector(`[data-balloon-idx="${index}"]`);
        if (!wrapper) return;
        const newW = wrapper.offsetWidth;
        const newH = wrapper.offsetHeight;
        const svgLayer = wrapper.querySelector('.shout-svg-bg');
        if (svgLayer && typeof BalloonSVGRenderer !== 'undefined') {
            const dir = balloon.direction || 's';
            const bg = balloon.bgColor || '#fffde7';
            const stroke = balloon.strokeColor || '#1a1a1a';
            svgLayer.innerHTML = BalloonSVGRenderer.shout(newW, newH, dir, { fill: bg === '#ffffff' ? '#fffde7' : bg, stroke, strokeWidth: 2.5 });
        }
    },
    
    // Add balloon centered on a specific panel
    addBalloonToPanel(slotIndex, type = 'speech') {
        const p = Store.get('currentProject'), page = Store.getActivePage(); 
        if (!p || !page) return;
        
        // Get panel bounds to center the balloon
        const layoutId = page.layoutId || LayoutEngine.getDefaultForCount(page.images?.length || 1);
        const tmpl = LayoutEngine.get(layoutId, page.images || []);
        if (!tmpl || !tmpl.panels || !tmpl.panels[slotIndex]) {
            this.addBalloonToPage(type);
            return;
        }
        
        const panel = tmpl.panels[slotIndex];
        const _dims2 = getProjectDims();
        const pageH = _dims2.contentH;
        const textBelowH = page.showTextBelow ? Math.min(page.narrativeHeight || 120, Math.round(pageH * 0.4)) : 0;
        const panelZoneH = pageH - textBelowH;
        const scaleY = panelZoneH / (Math.max(...tmpl.panels.map(p => p.y + p.h)) || 1);
        
        const px = Math.round(panel.x);
        const py = Math.round(panel.y * scaleY);
        const pw = Math.round(panel.w);
        const ph = Math.round(panel.h * scaleY);
        
        const balloonW = type === 'narration' ? Math.max(140, pw - 20) : 180;
        const balloonH = type === 'narration' ? 60 : 100;
        
        // Narration boxes snap to top by default, others center
        let bx, by;
        if (type === 'narration') {
            bx = px + 10; // Snap to left with margin
            by = py + 10; // Snap to top with margin
        } else {
            bx = px + (pw - balloonW) / 2;
            by = py + (ph - balloonH) / 2;
        }
        
        Store.pushUndo();
        if (!page.texts) page.texts = [];
        const balloonData = {
            type,
            x: Math.max(10, bx),
            y: Math.max(10, by),
            w: balloonW,
            h: balloonH,
            text: '',
            direction: type === 'narration' ? 'none' : 's',
            font: type === 'narration' ? 'serif' : 'comic',
            fontSize: type === 'narration' ? 13 : 15,
            manualSize: false,
            snapPosition: type === 'narration' ? 'top' : null
        };
        if (type === 'narration') {
            balloonData.bgColor = '#fffde7';
            balloonData.cornerRadius = 4;
        }
        page.texts.push(balloonData);
        const newIndex = page.texts.length - 1;
        this._recalcBalloonSize(page.texts[newIndex]);
        if (type === 'narration') this._autoSnapNarrationToPanel(newIndex);
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: newIndex } }); 
        Store.save();
        Toast.show('Balão adicionado no painel ' + (slotIndex + 1));
        renderCanvas();
        renderRightPanel();
        
        // Auto-focus the new balloon after DOM is ready
        this._focusBalloonText(newIndex);
    },
    addStickerImage(src) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndo();
        if (!page.stickers) page.stickers = [];
        page.stickers.push({
            src,
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 200,
            w: 120, h: 120,
            rotation: 0,
            opacity: 1
        });
        Store.set({ currentProject: p });
        Store.save();
        Toast.show(t('toast.stickerAdded'));
        renderCanvas(); renderRightPanel();
    },
    uploadSticker() {
        const input = document.getElementById('sticker-picker-hidden');
        if (!input) return;
        input.value = '';
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            const lib = Store.get('stickerLibrary') || [];
            let loaded = 0;
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    lib.push(ev.target.result);
                    loaded++;
                    if (loaded === files.length) {
                        Store.set({ stickerLibrary: lib });
                        Toast.show(`${loaded} sticker(s) adicionado(s)`);
                        renderRightPanel();
                    }
                };
                reader.readAsDataURL(file);
            });
        };
        input.click();
    },
    removeStickerFromLibrary(index) {
        const lib = Store.get('stickerLibrary') || [];
        lib.splice(index, 1);
        Store.set({ stickerLibrary: lib });
        renderRightPanel();
    },
    
    // ═══════════════════════════════════════════════════════════════
    // AUDIO SYSTEM - HQ Movie
    // ═══════════════════════════════════════════════════════════════
    
    _validateAudioFile(file) {
        if (!file) return false;
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
        // Also check extension as backup
        const ext = file.name.split('.').pop().toLowerCase();
        const validExts = ['mp3', 'wav', 'ogg'];
        
        if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
            Toast.show(t('toast.invalidAudioFormat'), 'error');
            return false;
        }
        if (file.size > 15 * 1024 * 1024) { 
             Toast.show(t('toast.audioTooLarge'), 'warning');
             return false;
        }
        return true;
    },

    uploadBackgroundMusic() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/mp3,audio/wav,audio/mpeg,audio/ogg,.mp3,.wav,.ogg';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!this._validateAudioFile(file)) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const p = Store.get('currentProject');
                if (!p) return;
                AudioManager.setBackgroundMusic(p, ev.target.result);
                Toast.show(t('toast.bgMusicLoaded'), 'success');
                renderRightPanel();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },
    
    async toggleBackgroundMusic() {
        const p = Store.get('currentProject');
        if (!p || !p.videoAudio?.background?.file) return;
        const bg = p.videoAudio.background;
        const playing = await AudioManager.playAudio('background', bg.file, {
            volume: bg.volume,
            loop: bg.loop,
            onEnded: () => renderRightPanel()
        });
        renderRightPanel();
    },
    
    removeBackgroundMusic() {
        const p = Store.get('currentProject');
        if (!p || !p.videoAudio) return;
        AudioManager.stopAudio('background');
        p.videoAudio.background.file = null;
        Store.save();
        Toast.show(t('toast.musicRemoved'));
        renderRightPanel();
    },
    
    setBackgroundVolume(volume) {
        const p = Store.get('currentProject');
        if (!p) return;
        AudioManager.setBackgroundVolume(p, volume);
        renderRightPanel();
    },
    
    toggleBackgroundLoop(loop) {
        const p = Store.get('currentProject');
        if (!p || !p.videoAudio) return;
        p.videoAudio.background.loop = loop;
        Store.save();
        renderRightPanel();
    },
    
    uploadPageNarration() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/mp3,audio/wav,audio/mpeg,audio/ogg,.mp3,.wav,.ogg';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!this._validateAudioFile(file)) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const p = Store.get('currentProject');
                const page = Store.getActivePage();
                if (!p || !page) return;
                AudioManager.setPageNarration(p, page.id, ev.target.result);
                await AudioManager.updateNarrationDuration(p, page.id);
                Toast.show(t('toast.narrationLoaded'), 'success');
                renderRightPanel();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },
    
    async togglePageNarration() {
        const p = Store.get('currentProject');
        const page = Store.getActivePage();
        if (!p || !page) return;
        const narration = AudioManager.getPageNarration(p, page.id);
        if (!narration || !narration.file) return;
        await AudioManager.playAudio('narration-' + page.id, narration.file, {
            volume: narration.volume || 0.8,
            onEnded: () => renderRightPanel()
        });
        renderRightPanel();
    },
    
    removePageNarration() {
        const p = Store.get('currentProject');
        const page = Store.getActivePage();
        if (!p || !page) return;
        AudioManager.stopAudio('narration-' + page.id);
        AudioManager.removePageNarration(p, page.id);
        // Reset duration to default when audio removed
        page.duration = 2.5;
        page.durationLocked = false;
        Toast.show(t('toast.narrationRemoved'));
        Store.save();
        renderRightPanel();
        renderTimeline();
    },
    
    setNarrationVolume(volume) {
        const p = Store.get('currentProject');
        const page = Store.getActivePage();
        if (!p || !page) return;
        AudioManager.setNarrationVolume(p, page.id, volume);
        renderRightPanel();
    },
    
    // Language-specific narration upload
    uploadNarrationLang(lang) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/mp3,audio/wav,audio/mpeg,audio/ogg,.mp3,.wav,.ogg';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!this._validateAudioFile(file)) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const p = Store.get('currentProject');
                const page = Store.getActivePage();
                if (!p || !page) return;
                
                // Initialize narration object if needed
                if (!page.narration) page.narration = {};
                if (!page.narration[lang]) page.narration[lang] = {};
                
                page.narration[lang].file = ev.target.result;
                
                // Get audio duration
                const audio = new Audio(ev.target.result);
                audio.onloadedmetadata = () => {
                    page.narration[lang].duration = audio.duration;
                    page.narration[lang].volume = 0.8;
                    Store.save();
                    Toast.show(`Narração ${lang === 'pt-BR' ? 'PT-BR' : 'EN'} carregada (${audio.duration.toFixed(1)}s)`, 'success');
                    renderRightPanel();
                };
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },
    
    playNarrationLang(lang) {
        const page = Store.getActivePage();
        if (!page || !page.narration || !page.narration[lang] || !page.narration[lang].file) return;
        
        const audio = new Audio(page.narration[lang].file);
        audio.volume = page.narration[lang].volume || 0.8;
        audio.play();
        Toast.show(`Tocando narração ${lang === 'pt-BR' ? 'PT-BR' : 'EN'}...`, 'info', 2000);
    },
    
    removeNarrationLang(lang) {
        const p = Store.get('currentProject');
        const page = Store.getActivePage();
        if (!p || !page) return;
        
        if (page.narration && page.narration[lang]) {
            delete page.narration[lang];
        }
        
        Toast.show(`Narration ${lang} removed`);
        Store.save();
        renderRightPanel();
    },
    
    // ═══════════════════════════════════════════════════════════════
    // Microphone Recording
    // ═══════════════════════════════════════════════════════════════
    
    _recordingLang: null,
    _audioStream: null,
    _mediaRecorder: null,
    _audioChunks: [],
    _recordedAudioBlob: null,
    _recordingStartTime: null,
    _recordingTimer: null,
    _recordingTimeout: null,
    _audioContext: null,
    _analyser: null,
    _micLevelRAF: null,
    _previewAudio: null,
    
    // ═══════════════════════════════════════════════════════════════
    // Excalidraw Integration
    // ═══════════════════════════════════════════════════════════════
    _excalidrawAPI: null,
    _excalidrawRoot: null,

    openExcalidraw() {
        this._blurActive();
        if (this.isMobile()) this.closeMobileSidebar();
        this.openExcalidrawModal();
    },

    openExcalidrawModal() {
        const modal = document.getElementById('excalidraw-modal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        
        // Initialize Excalidraw if not already done
        if (!this._excalidrawRoot && window.React && window.ReactDOM && window.ExcalidrawLib) {
            const container = document.getElementById('excalidraw-container');
            if (container) {
                this._excalidrawRoot = ReactDOM.createRoot(container);
                
                const ExcalidrawWrapper = () => {
                    return React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(ExcalidrawLib.Excalidraw, {
                            excalidrawAPI: (api) => {
                                this._excalidrawAPI = api;
                            },
                            initialData: {
                                appState: {
                                    viewBackgroundColor: "#ffffff",
                                    currentItemFontFamily: 1 // Virgil
                                }
                            }
                        })
                    );
                };
                
                this._excalidrawRoot.render(React.createElement(ExcalidrawWrapper));
            }
        } else if (this._excalidrawAPI) {
            // Reset state if opening again
            this._excalidrawAPI.resetScene();
        }
    },

    closeExcalidrawModal() {
        const modal = document.getElementById('excalidraw-modal');
        if (modal) modal.style.display = 'none';
    },

    setExcalidrawPreset(ratio) {
        if (!this._excalidrawAPI) return;
        
        let width, height;
        if (ratio === '9:16') {
            width = 1080; height = 1920;
        } else if (ratio === '16:9') {
            width = 1920; height = 1080;
        } else if (ratio === '1:1') {
            width = 1080; height = 1080;
        } else {
            return;
        }

        // Create a dashed rectangle as a guide
        const guideRect = {
            id: 'guide_' + Date.now(),
            type: 'rectangle',
            x: 0,
            y: 0,
            width: width,
            height: height,
            strokeColor: '#6b7280',
            backgroundColor: 'transparent',
            fillStyle: 'hachure',
            strokeWidth: 2,
            strokeStyle: 'dashed',
            roughness: 0,
            opacity: 50,
            groupIds: [],
            strokeSharpness: 'sharp',
            boundElements: [],
            updated: Date.now(),
            link: null,
            locked: true // Lock the guide so it's not accidentally moved
        };

        const currentElements = this._excalidrawAPI.getSceneElements().filter(el => !el.id.startsWith('guide_'));
        
        this._excalidrawAPI.updateScene({
            elements: [guideRect, ...currentElements],
            appState: {
                viewBackgroundColor: "#ffffff",
            }
        });
        
        // Scroll to center the guide
        this._excalidrawAPI.scrollToContent(guideRect, { fitToViewport: true });
    },

    async saveExcalidrawArt() {
        if (!this._excalidrawAPI) return;
        
        const elements = this._excalidrawAPI.getSceneElements();
        if (!elements || elements.length === 0) {
            this.closeExcalidrawModal();
            return;
        }

        try {
            const canvas = await ExcalidrawLib.exportToCanvas({
                elements,
                appState: {
                    ...this._excalidrawAPI.getAppState(),
                    exportBackground: false // transparent
                },
                files: this._excalidrawAPI.getFiles(),
                exportPadding: 20
            });

            const dataURL = canvas.toDataURL('image/png');
            
            // Generate a unique ID for the image
            const imgId = 'exc_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            
            // Add to library
            Library.add(dataURL, imgId, 'Excalidraw');
            
            // Select empty slot or active slot
            const p = Store.get('currentProject');
            const page = Store.getActivePage();
            let targetSlot = Store.get('selectedSlot');
            
            // Se nenhum slot estiver selecionado ou se o projeto configurado para auto-paste
            if (p.settings && p.settings.autoPastePage) {
                this.addPage();
                targetSlot = 0;
            } else if (targetSlot < 0) {
                // Find first empty slot
                targetSlot = 0;
                if (page && page.images) {
                    const emptyIdx = page.images.findIndex(img => !img || !img.src);
                    if (emptyIdx >= 0) targetSlot = emptyIdx;
                }
            }
            
            Store.set({ selectedSlot: targetSlot });
            this.insertLibraryImage(dataURL);
            
            this.closeExcalidrawModal();
            Toast.show(t('toast.artSaved'), 'success');
            
        } catch (err) {
            console.error("Excalidraw export error:", err);
            Toast.show(t('toast.artSaveError'), 'error');
        }
    },
    
    openRecordingModal(lang) {
        // Validar HTTPS (MediaRecorder precisa de conexão segura)
        if (location.protocol !== 'https:' && 
            location.hostname !== 'localhost' && 
            location.hostname !== '127.0.0.1') {
            console.error('MediaRecorder requires HTTPS in production');
            Toast.show('Warning: Audio recording only works on HTTPS or localhost.', 'error');
            return;
        }
        
        // Verificar suporte do navegador
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            Toast.show('Warning: Your browser does not support audio recording. Use Chrome, Safari or Edge.', 'error');
            return;
        }
        
        this._recordingLang = lang;
        const pageIdx = Store.get('activePageIndex') + 1;
        
        // Update modal title
        document.getElementById('rec-modal-title').textContent = `Record Narration - Page ${pageIdx} (${lang})`;
        
        // Reset UI state
        this._updateRecordingUI('ready');
        document.getElementById('rec-timer').textContent = '00:00';
        document.getElementById('mic-level-bar').style.width = '0%';
        
        // Show modal
        document.getElementById('recording-modal').classList.add('active');
    },
    
    closeRecordingModal() {
        // Stop recording if active
        if (this._mediaRecorder && this._mediaRecorder.state === 'recording') {
            this._mediaRecorder.stop();
        }
        
        // Limpar timeout de 5 minutos ao fechar modal
        if (this._recordingTimeout) {
            clearTimeout(this._recordingTimeout);
            this._recordingTimeout = null;
        }
        
        // Stop audio stream
        if (this._audioStream) {
            this._audioStream.getTracks().forEach(track => track.stop());
            this._audioStream = null;
        }
        
        // Stop preview audio
        if (this._previewAudio) {
            this._previewAudio.pause();
            this._previewAudio = null;
        }
        
        // Clear timer
        if (this._recordingTimer) {
            clearInterval(this._recordingTimer);
            this._recordingTimer = null;
        }
        
        // Cancel mic level animation
        if (this._micLevelRAF) {
            cancelAnimationFrame(this._micLevelRAF);
            this._micLevelRAF = null;
        }
        
        // Close audio context
        if (this._audioContext) {
            this._audioContext.close();
            this._audioContext = null;
        }
        
        // Reset state
        this._recordingLang = null;
        this._recordedAudioBlob = null;
        this._audioChunks = [];
        
        // Hide modal
        document.getElementById('recording-modal').classList.remove('active');
    },
    
    async startMicrophoneRecording() {
        try {
            // Request microphone permission
            this._audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Testar formatos em ordem de qualidade/compatibilidade
            const formats = [
                'audio/webm;codecs=opus',  // Melhor qualidade - iPhone iOS 14.5+, Chrome, Firefox
                'audio/mp4',               // Fallback iPhone iOS 14.3-14.4
                'audio/webm',              // Fallback Android antigo
                'audio/wav'                // Último recurso (desktop)
            ];
            
            let mimeType = 'audio/webm'; // Default seguro
            for (const format of formats) {
                if (MediaRecorder.isTypeSupported(format)) {
                    mimeType = format;
                    break;
                }
            }
            
            // Create MediaRecorder
            this._mediaRecorder = new MediaRecorder(this._audioStream, {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            });
            
            // Collect audio chunks
            this._audioChunks = [];
            this._mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this._audioChunks.push(event.data);
                }
            };
            
            // On stop: create final Blob
            this._mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this._audioChunks, { type: mimeType });
                this._recordedAudioBlob = audioBlob;
                this._updateRecordingUI('stopped');
                
                // Stop mic level animation
                if (this._micLevelRAF) {
                    cancelAnimationFrame(this._micLevelRAF);
                    this._micLevelRAF = null;
                }
            };
            
            // Start recording
            this._mediaRecorder.start();
            this._recordingStartTime = Date.now();
            this._updateRecordingUI('recording');
            
            // Update timer every 100ms with remaining time indicator
            const MAX_RECORDING_SECONDS = 300; // 5 minutos
            this._recordingTimer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this._recordingStartTime) / 1000);
                const remaining = Math.max(0, MAX_RECORDING_SECONDS - elapsed);
                
                const elapsedMin = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const elapsedSec = (elapsed % 60).toString().padStart(2, '0');
                const remainMin = Math.floor(remaining / 60);
                const remainSec = (remaining % 60).toString().padStart(2, '0');
                
                const timer = document.getElementById('rec-timer');
                timer.textContent = `${elapsedMin}:${elapsedSec} / ${remainMin}:${remainSec}`;
                
                // Mudar cor quando <30s restantes
                if (remaining < 30 && remaining > 0) {
                    timer.style.color = '#ff4444';
                } else {
                    timer.style.color = '';
                }
            }, 100);
            
            // Timeout de segurança: 5 minutos máximo (previne crash em mobile)
            const MAX_RECORDING_TIME = MAX_RECORDING_SECONDS * 1000;
            this._recordingTimeout = setTimeout(() => {
                if (this._mediaRecorder?.state === 'recording') {
                    console.warn('⏱️ Gravação atingiu 5 minutos - salvando automaticamente');
                    
                    // Parar gravação
                    this.stopMicrophoneRecording();
                    
                    // Auto-salvar após 500ms (aguarda onstop processar)
                    setTimeout(() => {
                        if (this._recordedAudioBlob) {
                            this.saveRecordedAudio();
                            Toast.show('⏱️ Gravação máxima: 5 minutos. Áudio salvo automaticamente.', 'warning', 5000);
                        }
                    }, 500);
                }
            }, MAX_RECORDING_TIME);
            
            // Setup mic level visualization
            this._setupMicLevelVisualization();
            
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                Toast.show('Microphone permission denied. Enable it in browser settings.', 'error');
            } else {
                Toast.show('Error accessing microphone: ' + error.message, 'error');
            }
            console.error('Recording error:', error);
        }
    },
    
    _setupMicLevelVisualization() {
        try {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this._analyser = this._audioContext.createAnalyser();
            const microphone = this._audioContext.createMediaStreamSource(this._audioStream);
            microphone.connect(this._analyser);
            this._analyser.fftSize = 256;
            
            const dataArray = new Uint8Array(this._analyser.frequencyBinCount);
            const levelBar = document.getElementById('mic-level-bar');
            
            const updateLevel = () => {
                if (!this._mediaRecorder || this._mediaRecorder.state !== 'recording') return;
                
                this._analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                const percentage = Math.min(100, (average / 128) * 100);
                
                levelBar.style.width = percentage + '%';
                levelBar.classList.toggle('hot', percentage > 80);
                
                this._micLevelRAF = requestAnimationFrame(updateLevel);
            };
            
            updateLevel();
        } catch (e) {
            console.warn('Could not setup mic level visualization:', e);
        }
    },
    
    stopMicrophoneRecording() {
        if (this._mediaRecorder && this._mediaRecorder.state === 'recording') {
            this._mediaRecorder.stop();
            
            // Stop stream
            if (this._audioStream) {
                this._audioStream.getTracks().forEach(track => track.stop());
            }
            
            // Stop timer
            if (this._recordingTimer) {
                clearInterval(this._recordingTimer);
                this._recordingTimer = null;
            }
            
            // Limpar timeout se parar manualmente
            if (this._recordingTimeout) {
                clearTimeout(this._recordingTimeout);
                this._recordingTimeout = null;
            }
        }
    },
    
    playRecordedAudio() {
        if (!this._recordedAudioBlob) return;
        
        // Stop if already playing
        if (this._previewAudio) {
            this._previewAudio.pause();
            this._previewAudio = null;
            this._updateRecordingUI('stopped');
            return;
        }
        
        const audioURL = URL.createObjectURL(this._recordedAudioBlob);
        this._previewAudio = new Audio(audioURL);
        this._previewAudio.play();
        
        this._previewAudio.onended = () => {
            this._previewAudio = null;
            this._updateRecordingUI('stopped');
        };
        
        this._updateRecordingUI('playing');
    },
    
    saveRecordedAudio() {
        if (!this._recordedAudioBlob || !this._recordingLang) return;
        
        const lang = this._recordingLang;
        
        // Convert Blob to Data URL
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataURL = reader.result;
            
            const p = Store.get('currentProject');
            const page = Store.getActivePage();
            if (!p || !page) return;
            
            // Initialize narration object if needed
            if (!page.narration) page.narration = {};
            if (!page.narration[lang]) page.narration[lang] = {};
            
            page.narration[lang].file = dataURL;
            
            // Get audio duration
            const audio = new Audio(dataURL);
            audio.onloadedmetadata = () => {
                page.narration[lang].duration = audio.duration;
                page.narration[lang].volume = 0.8;
                Store.save();
                Toast.show(`Narration ${lang} recorded and saved! (${audio.duration.toFixed(1)}s)`, 'success');
                renderRightPanel();
            };
            
            this.closeRecordingModal();
        };
        
        reader.readAsDataURL(this._recordedAudioBlob);
    },
    
    _updateRecordingUI(state) {
        const btnRecord = document.getElementById('rec-btn-record');
        const btnStop = document.getElementById('rec-btn-stop');
        const btnPlay = document.getElementById('rec-btn-play');
        const btnSave = document.getElementById('rec-btn-save');
        const statusText = document.getElementById('rec-status-text');
        const timer = document.getElementById('rec-timer');
        
        switch (state) {
            case 'ready':
                btnRecord.disabled = false;
                btnStop.disabled = true;
                btnPlay.disabled = true;
                btnSave.disabled = true;
                statusText.textContent = 'Ready to record';
                statusText.classList.remove('recording');
                timer.classList.remove('recording');
                break;
            case 'recording':
                btnRecord.disabled = true;
                btnStop.disabled = false;
                btnPlay.disabled = true;
                btnSave.disabled = true;
                statusText.textContent = '● Recording...';
                statusText.classList.add('recording');
                timer.classList.add('recording');
                break;
            case 'stopped':
                btnRecord.disabled = false;
                btnStop.disabled = true;
                btnPlay.disabled = false;
                btnSave.disabled = false;
                statusText.textContent = 'Recording complete';
                statusText.classList.remove('recording');
                timer.classList.remove('recording');
                btnPlay.innerHTML = '▶️ Play';
                break;
            case 'playing':
                btnRecord.disabled = true;
                btnStop.disabled = true;
                btnPlay.disabled = false;
                btnSave.disabled = true;
                statusText.textContent = 'Playing preview...';
                btnPlay.innerHTML = '⏹️ Stop';
                break;
        }
    },
    
    setPageDuration(duration) {
        const page = Store.getActivePage();
        if (!page) return;
        // Block manual edit if audio locks duration
        if (page.durationLocked) {
            Toast.show(t('toast.durationLockedByAudio'), 'warning');
            return;
        }
        page.duration = Math.max(0.5, Math.min(15, Math.round(duration * 2) / 2)); // 0.5-15s, step 0.5
        Store.save();
        renderRightPanel();
        renderTimeline();
    },
    
    // Inline duration edit from timeline click
    timelineEditDuration(pageIdx) {
        const p = Store.get('currentProject');
        if (!p || !p.pages[pageIdx]) return;
        const page = p.pages[pageIdx];
        if (page.durationLocked) {
            Toast.show(t('toast.durationLockedByAudio'), 'warning');
            return;
        }
        const current = page.duration || 2.5;
        const input = prompt(`Duração da página ${pageIdx + 1} (0.5-15 segundos):`, current);
        if (input === null) return;
        const val = parseFloat(input);
        if (isNaN(val)) return;
        page.duration = Math.max(0.5, Math.min(15, Math.round(val * 2) / 2));
        Store.save();
        renderTimeline();
        renderRightPanel();
    },
    
    // Inline duration edit (double-click on badge in timeline)
    timelineEditDurationInline(pageIdx, event) {
        const p = Store.get('currentProject');
        if (!p || !p.pages[pageIdx]) return;
        const page = p.pages[pageIdx];
        if (page.durationLocked) return;
        const badge = event.target;
        const current = page.duration || 2.5;
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'tl-dur-inline-input';
        input.value = current;
        input.min = 0.5; input.max = 15; input.step = 0.5;
        badge.style.display = 'none';
        badge.parentElement.appendChild(input);
        input.focus();
        input.select();
        const finish = () => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) {
                page.duration = Math.max(0.5, Math.min(15, Math.round(val * 2) / 2));
                Store.save();
            }
            input.remove();
            badge.style.display = '';
            renderTimeline();
        };
        input.onblur = finish;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') { input.value = current; input.blur(); }
        };
    },

    // Toggle Ken Burns on/off from timeline badge click
    toggleKenBurns(pageIdx) {
        const p = Store.get('currentProject');
        if (!p || !p.pages[pageIdx]) return;
        const page = p.pages[pageIdx];
        if (page.kenBurns && page.kenBurns !== 'none' && page.kenBurns !== 'static') {
            page.kenBurns = 'none';
            Toast.show(t('toast.kenBurnsDisabled'), 'info');
        } else {
            page.kenBurns = 'zoom-in';
            Toast.show(t('toast.kenBurnsZoomIn'), 'success');
        }
        Store.save();
        renderTimeline();
        renderRightPanel();
    },

    /* ═══════════════════════════════════════════════════════════════
       SLIDESHOW MODE - Multiple Images per Page (Universal)
       Works on ANY page, not just slideshow layout
       ═══════════════════════════════════════════════════════════════ */

    // Active slide index for canvas preview
    _activeSlidePreview: 0,

    // Check if page has slides enabled
    hasSlidesEnabled(page) {
        return page && page.slides && page.slides.length > 0;
    },

    // Navigate slide preview on canvas
    prevSlidePreview() {
        const page = Store.getActivePage();
        if (!page || !page.slides || page.slides.length <= 1) return;
        this._activeSlidePreview = (this._activeSlidePreview - 1 + page.slides.length) % page.slides.length;
        renderCanvas();
        renderRightPanel();
    },

    nextSlidePreview() {
        const page = Store.getActivePage();
        if (!page || !page.slides || page.slides.length <= 1) return;
        this._activeSlidePreview = (this._activeSlidePreview + 1) % page.slides.length;
        renderCanvas();
        renderRightPanel();
    },

    setSlidePreview(index) {
        const page = Store.getActivePage();
        if (!page || !page.slides) return;
        if (index < 0 || index >= page.slides.length) return;
        this._activeSlidePreview = index;
        renderCanvas();
        renderRightPanel();
    },

    // Enable slides mode on any page
    enableSlidesMode() {
        const page = Store.getActivePage();
        if (!page) return;
        
        if (!page.slides) page.slides = [];
        
        // Convert existing images to slides if any
        if (page.images && page.images.length > 0 && page.slides.length === 0) {
            const equalDuration = (page.duration || 2.5) / page.images.length;
            page.slides = page.images.map((img, i) => ({
                id: genId(),
                image: img.src,
                duration: Math.max(0.5, equalDuration),
                kenBurns: page.kenBurns || 'zoom-in',
                transition: i === 0 ? 'cut' : 'crossfade',
                transitionDuration: 0.3,
                panX: img.panX || 0,
                panY: img.panY || 0,
                zoom: img.zoom || 1.0
            }));
            Toast.show('Imagens convertidas para slides!', 'success');
        }
        
        Store.save();
        renderRightPanel();
        renderCanvas();
    },

    // Open slide picker modal (multi-select from library)
    addSlideFromLibrary() {
        const page = Store.getActivePage();
        if (!page) return;
        
        const proj = Store.get('currentProject');
        const library = proj.library || [];
        
        if (library.length === 0) {
            Toast.show(t('toast.libraryEmpty'), 'warning');
            return;
        }
        
        this.openSlidePicker();
    },

    // Slide picker modal state
    _slidePickerSelected: new Set(),

    openSlidePicker() {
        const proj = Store.get('currentProject');
        const library = proj.library || [];
        if (library.length === 0) return;

        this._slidePickerSelected = new Set();

        const overlay = document.createElement('div');
        overlay.className = 'slide-picker-overlay';
        overlay.id = 'slide-picker-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) this.closeSlidePicker(); };

        const grid = library.map((entry, i) => {
            const escapedSrc = (entry.src || '').replace(/"/g, '&quot;');
            return `<div class="slide-picker-item" data-picker-idx="${i}" data-picker-src="${escapedSrc}" onclick="App.toggleSlidePickerItem(${i})"><img src="${entry.src}" alt="Foto ${i + 1}"></div>`;
        }).join('');

        overlay.innerHTML = `
            <div class="slide-picker-modal">
                <div class="slide-picker-header">
                    <span style="font-size:20px;">📷</span>
                    <h3>Selecionar fotos para sequência</h3>
                    <button onclick="App.closeSlidePicker()" style="background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;padding:4px;">✕</button>
                </div>
                <div class="slide-picker-grid" id="slide-picker-grid">${grid}</div>
                <div class="slide-picker-footer">
                    <span id="slide-picker-count" style="flex:1;font-size:11px;color:var(--text3);align-self:center;">0 selecionadas</span>
                    <button onclick="App.closeSlidePicker()" style="background:var(--surface2);border:1px solid var(--border);color:var(--text2);">Cancelar</button>
                    <button onclick="App.confirmSlidePicker()" id="slide-picker-confirm" style="background:var(--accent);border:1px solid var(--accent);color:#fff;">Adicionar 0 fotos</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);
    },

    toggleSlidePickerItem(index) {
        if (this._slidePickerSelected.has(index)) {
            this._slidePickerSelected.delete(index);
        } else {
            this._slidePickerSelected.add(index);
        }

        // Update visual state
        const items = document.querySelectorAll('.slide-picker-item');
        items.forEach((item, i) => {
            item.classList.toggle('selected', this._slidePickerSelected.has(i));
        });

        const count = this._slidePickerSelected.size;
        const countEl = document.getElementById('slide-picker-count');
        const confirmEl = document.getElementById('slide-picker-confirm');
        if (countEl) countEl.textContent = `${count} selecionada${count !== 1 ? 's' : ''}`;
        if (confirmEl) {
            confirmEl.textContent = `Adicionar ${count} foto${count !== 1 ? 's' : ''}`;
            confirmEl.style.opacity = count > 0 ? '1' : '0.5';
        }
    },

    confirmSlidePicker() {
        const proj = Store.get('currentProject');
        const library = proj.library || [];
        const selected = [...this._slidePickerSelected].sort((a, b) => a - b);

        if (selected.length === 0) {
            Toast.show('Selecione ao menos uma foto', 'warning');
            return;
        }

        selected.forEach(idx => {
            if (library[idx]) {
                this.addSlide(library[idx].src);
            }
        });

        this.closeSlidePicker();
        Toast.show(`${selected.length} foto${selected.length > 1 ? 's adicionadas' : ' adicionada'} à sequência`, 'success');
    },

    closeSlidePicker() {
        const overlay = document.getElementById('slide-picker-overlay');
        if (overlay) overlay.remove();
        this._slidePickerSelected = new Set();
    },

    // Add slide with image (works on ANY page)
    addSlide(imageSrc, duration = null) {
        const page = Store.getActivePage();
        if (!page) return;
        
        if (!page.slides) page.slides = [];
        
        // Auto-expand page duration to fit new slide (min 2s per slide)
        const MIN_SLIDE_DURATION = 2;
        const newCount = page.slides.length + 1;
        const minTotalNeeded = newCount * MIN_SLIDE_DURATION;
        if ((page.duration || 2.5) < minTotalNeeded) {
            page.duration = minTotalNeeded;
        }
        
        // Redistribute time equally among all slides (including new one)
        const equalDuration = Math.round((page.duration / newCount) * 10) / 10;
        
        const newSlide = {
            id: genId(),
            image: imageSrc,
            duration: duration || equalDuration,
            kenBurns: page.kenBurns || 'zoom-in',
            transition: page.slides.length === 0 ? 'cut' : 'crossfade',
            transitionDuration: 0.3,
            panX: 0,
            panY: 0,
            zoom: 1.0
        };
        
        page.slides.push(newSlide);
        
        // Redistribute all slides equally when no explicit duration given
        if (!duration) {
            const eq = Math.round((page.duration / page.slides.length) * 10) / 10;
            page.slides.forEach(s => { s.duration = eq; });
        }
        
        Store.save();
        renderRightPanel();
        renderCanvas();
        Toast.show(t('toast.slideAdded'), 'success');
    },

    // Remove slide by index (works on ANY page)
    removeSlide(index) {
        const page = Store.getActivePage();
        if (!page || !page.slides) return;
        
        if (index < 0 || index >= page.slides.length) return;
        
        // Prevent deleting last slide
        if (page.slides.length <= 1) {
            Toast.show(t('toast.minOneSlide'), 'warning');
            return;
        }
        
        // Confirm if more than 2 slides
        if (page.slides.length > 2) {
            if (!confirm(t('confirm.removeSlide', { number: index + 1 }))) return;
        }
        
        page.slides.splice(index, 1);
        
        Store.save();
        renderRightPanel();
        renderCanvas();
        Toast.show(t('toast.slideRemoved'), 'info');
    },

    // Update slide duration (works on ANY page)
    updateSlideDuration(index, duration) {
        const page = Store.getActivePage();
        if (!page || !page.slides) return;
        
        if (index < 0 || index >= page.slides.length) return;
        
        page.slides[index].duration = Math.max(0.5, duration);
        
        Store.save();
        renderRightPanel();
    },

    // Update slide Ken Burns effect (works on ANY page)
    updateSlideKenBurns(index, preset) {
        const page = Store.getActivePage();
        if (!page || !page.slides) return;
        
        if (index < 0 || index >= page.slides.length) return;
        
        page.slides[index].kenBurns = preset;
        
        Store.save();
        renderCanvas();
    },

    // Update slide transition (works on ANY page)
    updateSlideTransition(index, transition) {
        const page = Store.getActivePage();
        if (!page || !page.slides) return;
        
        if (index < 0 || index >= page.slides.length) return;
        
        page.slides[index].transition = transition;
        
        Store.save();
    },

    // Divide slides equally (works on ANY page)
    divideSlidesEqually() {
        const page = Store.getActivePage();
        if (!page || !page.slides) return;
        
        if (page.slides.length === 0) {
            Toast.show(t('toast.addSlidesFirst'), 'warning');
            return;
        }
        
        const equalDuration = page.duration / page.slides.length;
        page.slides.forEach(slide => {
            slide.duration = Math.round(equalDuration * 10) / 10; // 1 decimal
        });
        
        Store.save();
        renderRightPanel();
        Toast.show(`Slides divididos igualmente: ${equalDuration.toFixed(1)}s cada`, 'success');
    },

    // Drag & Drop handlers
    _slideDragIndex: null,
    
    handleSlideDragStart(event, index) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', index.toString());
        event.target.classList.add('dragging');
        this._slideDragIndex = index;
    },

    handleSlideDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        const target = event.currentTarget;
        if (!target || !target.classList.contains('slideshow-slide-item')) return;
        
        // Calculate if drop should be before or after this card
        const rect = target.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dropBefore = event.clientY < midY;
        
        // Remove existing indicators
        document.querySelectorAll('.slideshow-drop-indicator').forEach(el => el.remove());
        document.querySelectorAll('.slideshow-slide-item').forEach(item => {
            item.classList.remove('drop-target');
        });
        
        // Create drop indicator line
        const indicator = document.createElement('div');
        indicator.className = 'slideshow-drop-indicator';
        
        if (dropBefore) {
            target.parentNode.insertBefore(indicator, target);
            target.dataset.dropPosition = 'before';
        } else {
            target.parentNode.insertBefore(indicator, target.nextSibling);
            target.dataset.dropPosition = 'after';
        }
        
        target.classList.add('drop-target');
    },

    handleSlideDragLeave(event) {
        // Only remove if leaving the slides container entirely
        const relatedTarget = event.relatedTarget;
        if (relatedTarget && relatedTarget.closest('.slideshow-slide-item')) return;
        
        event.currentTarget.classList.remove('drop-target');
        delete event.currentTarget.dataset.dropPosition;
    },

    handleSlideDrop(event, toIndex) {
        event.preventDefault();
        const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
        
        // Check if dropping before or after
        const target = event.currentTarget;
        const dropBefore = target.dataset.dropPosition === 'before';
        
        // Cleanup
        this._cleanupSlideDrag();
        
        if (fromIndex === toIndex) return;
        
        // Adjust toIndex based on drop position
        let finalIndex = toIndex;
        if (!dropBefore && fromIndex < toIndex) {
            // Dropping after, and coming from before - no adjustment needed
        } else if (dropBefore && fromIndex > toIndex) {
            // Dropping before, and coming from after - no adjustment needed
        } else if (!dropBefore) {
            finalIndex = toIndex + 1;
        }
        
        // Clamp to valid range
        const page = Store.getActivePage();
        if (page && page.slides) {
            finalIndex = Math.min(finalIndex, page.slides.length - 1);
        }
        
        this.reorderSlides(fromIndex, finalIndex);
    },

    handleSlideDragEnd(event) {
        this._cleanupSlideDrag();
    },
    
    _cleanupSlideDrag() {
        // Remove all drag states
        document.querySelectorAll('.slideshow-slide-item').forEach(item => {
            item.classList.remove('dragging', 'drop-target');
            delete item.dataset.dropPosition;
        });
        // Remove drop indicators
        document.querySelectorAll('.slideshow-drop-indicator').forEach(el => el.remove());
        this._slideDragIndex = null;
    },

    // Keyboard navigation for slides (WCAG 2.2 compliant)
    handleSlideKeyboard(event) {
        const target = event.target.closest('.slideshow-slide-item');
        if (!target) return;
        
        const index = parseInt(target.dataset.slideIndex);
        if (isNaN(index)) return;
        
        const page = Store.getActivePage();
        if (!page || !page.slides) return;
        
        const slides = document.querySelectorAll('.slideshow-slide-item');
        const lastIndex = page.slides.length - 1;
        
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                event.preventDefault();
                if (event.ctrlKey || event.metaKey) {
                    // Ctrl+Arrow: reorder slide up
                    if (index > 0) {
                        this.reorderSlides(index, index - 1);
                        setTimeout(() => slides[index - 1]?.focus(), 50);
                    }
                } else {
                    // Navigate to previous slide
                    if (index > 0) slides[index - 1]?.focus();
                }
                break;
                
            case 'ArrowDown':
            case 'ArrowRight':
                event.preventDefault();
                if (event.ctrlKey || event.metaKey) {
                    // Ctrl+Arrow: reorder slide down
                    if (index < lastIndex) {
                        this.reorderSlides(index, index + 1);
                        setTimeout(() => slides[index + 1]?.focus(), 50);
                    }
                } else {
                    // Navigate to next slide
                    if (index < lastIndex) slides[index + 1]?.focus();
                }
                break;
                
            case 'Delete':
            case 'Backspace':
                event.preventDefault();
                this.removeSlide(index);
                // Focus previous or next slide after deletion
                setTimeout(() => {
                    const newSlides = document.querySelectorAll('.slideshow-slide-item');
                    const focusIndex = Math.min(index, newSlides.length - 1);
                    newSlides[focusIndex]?.focus();
                }, 50);
                break;
                
            case 'Enter':
            case ' ':
                event.preventDefault();
                // Focus the duration input for editing
                const durationInput = target.querySelector('.slideshow-control-input');
                if (durationInput) {
                    durationInput.focus();
                    durationInput.select();
                }
                break;
                
            case 'Home':
                event.preventDefault();
                slides[0]?.focus();
                break;
                
            case 'End':
                event.preventDefault();
                slides[lastIndex]?.focus();
                break;
        }
    },

    // Reorder slides (works on ANY page)
    reorderSlides(fromIndex, toIndex) {
        const page = Store.getActivePage();
        if (!page || !page.slides) return;
        
        if (fromIndex < 0 || fromIndex >= page.slides.length) return;
        if (toIndex < 0 || toIndex >= page.slides.length) return;
        
        const [movedSlide] = page.slides.splice(fromIndex, 1);
        page.slides.splice(toIndex, 0, movedSlide);
        
        Store.save();
        renderRightPanel();
        renderCanvas();
    },

    // Quick transition edit - Opens Tooltip (not modal)
    quickEditTransition(pageIdx, event) {
        const p = Store.get('currentProject');
        if (!p || !p.pages[pageIdx]) return;
        
        // Close any existing tooltip
        this.closeTransitionTooltip();
        
        const page = p.pages[pageIdx];
        const currentTransition = page.transition || 'cut';
        const currentDuration = page.transitionDuration || 0.5;
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'transition-tooltip';
        tooltip.className = 'transition-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: #2d3748;
            border: 1px solid #4a5568;
            border-radius: 6px;
            padding: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            min-width: 140px;
        `;
        
        // Determine which option is selected
        const isNone = currentTransition === 'none' || currentTransition === 'cut';
        const isFade03 = currentTransition === 'fade' && currentDuration <= 0.35;
        const isFade05 = currentTransition === 'fade' && currentDuration > 0.35 && currentDuration <= 0.75;
        const isFade10 = currentTransition === 'fade' && currentDuration > 0.75;
        
        tooltip.innerHTML = `
            <div style="font-size:10px;color:#a0aec0;padding:4px 8px;border-bottom:1px solid #4a5568;margin-bottom:4px;">Transição</div>
            <button onclick="App.setTransitionFromTooltip(${pageIdx}, 'none')" style="width:100%;padding:8px 12px;background:${isNone ? '#00d4ff' : 'transparent'};border:none;color:${isNone ? '#000' : '#fff'};text-align:left;cursor:pointer;border-radius:4px;font-size:13px;font-weight:${isNone ? 'bold' : 'normal'};transition:background 0.15s;" onmouseover="if(!this.style.fontWeight || this.style.fontWeight==='normal')this.style.background='#4a5568'" onmouseout="if(!this.style.fontWeight || this.style.fontWeight==='normal')this.style.background='transparent'">Nenhuma</button>
            <button onclick="App.setTransitionFromTooltip(${pageIdx}, 'fade', 0.3)" style="width:100%;padding:8px 12px;background:${isFade03 ? '#00d4ff' : 'transparent'};border:none;color:${isFade03 ? '#000' : '#fff'};text-align:left;cursor:pointer;border-radius:4px;font-size:13px;font-weight:${isFade03 ? 'bold' : 'normal'};transition:background 0.15s;" onmouseover="if(!this.style.fontWeight || this.style.fontWeight==='normal')this.style.background='#4a5568'" onmouseout="if(!this.style.fontWeight || this.style.fontWeight==='normal')this.style.background='transparent'">Fade 0.3s</button>
            <button onclick="App.setTransitionFromTooltip(${pageIdx}, 'fade', 0.5)" style="width:100%;padding:8px 12px;background:${isFade05 ? '#00d4ff' : 'transparent'};border:none;color:${isFade05 ? '#000' : '#fff'};text-align:left;cursor:pointer;border-radius:4px;font-size:13px;font-weight:${isFade05 ? 'bold' : 'normal'};transition:background 0.15s;" onmouseover="if(!this.style.fontWeight || this.style.fontWeight==='normal')this.style.background='#4a5568'" onmouseout="if(!this.style.fontWeight || this.style.fontWeight==='normal')this.style.background='transparent'">Fade 0.5s</button>
            <button onclick="App.setTransitionFromTooltip(${pageIdx}, 'fade', 1.0)" style="width:100%;padding:8px 12px;background:${isFade10 ? '#00d4ff' : 'transparent'};border:none;color:${isFade10 ? '#000' : '#fff'};text-align:left;cursor:pointer;border-radius:4px;font-size:13px;font-weight:${isFade10 ? 'bold' : 'normal'};transition:background 0.15s;" onmouseover="if(!this.style.fontWeight || this.style.fontWeight==='normal')this.style.background='#4a5568'" onmouseout="if(!this.style.fontWeight || this.style.fontWeight==='normal')this.style.background='transparent'">Fade 1.0s</button>
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip above the clicked element
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Center horizontally on the target
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        // Position above the target with 8px gap
        let top = rect.top - tooltipRect.height - 8;
        
        // Keep within viewport
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) left = window.innerWidth - tooltipRect.width - 8;
        if (top < 8) top = rect.bottom + 8; // If no room above, show below
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!tooltip.contains(e.target)) {
                    this.closeTransitionTooltip();
                }
            }, { once: true });
        }, 0);
    },

    closeTransitionModal() {
        const modal = document.getElementById('transition-modal');
        if (modal) modal.style.display = 'none';
        this._transitionModalPageIdx = null;
    },

    closeTransitionTooltip() {
        const tooltip = document.getElementById('transition-tooltip');
        if (tooltip) tooltip.remove();
    },

    setTransitionFromTooltip(pageIdx, type, duration) {
        const p = Store.get('currentProject');
        if (!p || !p.pages[pageIdx]) return;
        
        Store.pushUndo();
        const page = p.pages[pageIdx];
        
        if (type === 'none') {
            page.transition = 'cut';
            delete page.transitionDuration;
        } else if (type === 'fade') {
            page.transition = 'fade';
            page.transitionDuration = duration || 0.5;
        }
        
        Store.save();
        this.closeTransitionTooltip();
        renderTimeline();
        
        const label = type === 'none' ? 'Nenhuma' : `Fade ${duration}s`;
        Toast.show(`Transição: ${label}`, 'success', 2000);
    },

    updateTransitionModalSelection(labelEl) {
        const modal = document.getElementById('transition-modal');
        if (!modal) return;
        modal.querySelectorAll('.radio-option').forEach(el => el.classList.remove('selected'));
        labelEl.classList.add('selected');
    },

    applyTransition() {
        if (this._transitionModalPageIdx === null) return;
        
        const modal = document.getElementById('transition-modal');
        const selected = modal.querySelector('input[name="transition"]:checked');
        if (!selected) return;
        
        const val = selected.value;
        const pageIdx = this._transitionModalPageIdx;
        const p = Store.get('currentProject');
        const page = p.pages[pageIdx];
        
        if (val === 'cut') {
            page.transition = 'cut';
        } else if (val.startsWith('fade-')) {
            page.transition = 'fade';
            const dur = parseFloat(val.split('-')[1]);
            // We might want to store transition duration per page if supported, 
            // otherwise update global project setting or handle it in exporter.
            // video-exporter.js uses `page.transition === 'fade' ? 0.5 : 0` currently by default 
            // but we can update it to respect a project setting or page setting if we add it.
            // For now, let's assume we want to support variable duration.
            // But checking video-exporter.js:
            // `const transitionDuration = transition === 'fade' ? 0.5 : 0;` 
            // It seems hardcoded. We should probably update exporter to look for a property.
            // Let's modify project structure slightly to store it? 
            // Or just update the global preference if that's what the user wants?
            // The modal implies specific durations. 
            // Let's update `project.timeline.transitionDuration` if it's a global setting, 
            // or we need to add `page.transitionDuration`.
            // Let's assume global for consistency for now, OR add it to page object which is better.
            
            // To make it work immediately without changing exporter too much (unless we did),
            // we should check if exporter supports `page.transitionDuration`.
            // Looking at the exporter code I read earlier:
            // `const transitionDuration = transition === 'fade' ? 0.5 : 0; // 0.5s para fade`
            // It IS hardcoded. I should probably update the exporter too to read `page.transitionDuration`.
            // But for now, let's just save it to page.
            
            // Wait, I can't easily change exporter in this step without reading it again or guessing.
            // Actually I viewed exporter earlier. Line 322:
            // `const transitionDuration = transition === 'fade' ? 0.5 : 0;`
            // I should update exporter to `const transitionDuration = (transition === 'fade') ? (page.transitionDuration || 0.5) : 0;`
            
            page.transitionDuration = dur;
        }
        
        Store.save();
        this.closeTransitionModal();
        renderTimeline();
    },

    timelineEditDurationInline(pageIdx, event) {
        const target = event.target;
        const p = Store.get('currentProject');
        if (!p || !p.pages[pageIdx]) return;
        
        const currentDur = p.pages[pageIdx].duration || 4;
        
        // Create input
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'duration-input-inline';
        input.value = currentDur;
        input.step = 0.1;
        input.min = 0.1;
        
        // Replace text
        target.style.display = 'none';
        target.parentNode.insertBefore(input, target);
        input.focus();
        input.select();
        
        const save = () => {
            let val = parseFloat(input.value);
            if (isNaN(val) || val < 0.1) val = 0.1;
            p.pages[pageIdx].duration = val;
            Store.save();
            renderTimeline(); // Re-render to show text again
        };
        
        const cancel = () => {
            input.remove();
            target.style.display = '';
        };
        
        input.onblur = save;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Triggers save
            } else if (e.key === 'Escape') {
                cancel();
            }
            e.stopPropagation();
        };
        input.onclick = (e) => e.stopPropagation();
        input.ondblclick = (e) => e.stopPropagation();
    },

    setPageKenBurns(presetId) {
        const page = Store.getActivePage();
        if (!page) return;
        page.kenBurns = presetId;
        Store.save();
        renderTimeline();
        renderRightPanel();
    },
    
    setPageTransition(transition) {
        const page = Store.getActivePage();
        if (!page) return;
        page.transition = transition;
        Store.save();
        renderTimeline();
        renderRightPanel();
    },
    
    // ═══════════════════════════════════════════════════════════════
    // AUDIO SPLIT EDITOR - Split-view inside canvas-area
    // Canvas 45% top · Audio Timeline 55% bottom (Premiere/DaVinci)
    // ═══════════════════════════════════════════════════════════════
    
    _audioSplitEditorOpen: false,
    _audioSplitPlayheadInterval: null,
    _audioSplitSnap: false,
    
    openAudioSplitEditor(lang = null) {
        const proj = Store.get('currentProject');
        if (!proj) return;
        
        // Safety: if flag says open but DOM is gone, reset the flag
        if (this._audioSplitEditorOpen) {
            const existingPanel = document.getElementById('ast-panel-container');
            if (!existingPanel) {
                // Panel was removed externally (e.g. full re-render) — reset state
                this._audioSplitEditorOpen = false;
                this._stopPlayheadUpdater();
            } else {
                return; // Already truly open
            }
        }
        
        const activeLang = lang || proj.activeLanguage || 'pt-BR';
        AudioSplitter.initDraft(activeLang);
        
        // Inject timeline panel into canvas-area (split view)
        const canvasArea = document.querySelector('.canvas-area');
        if (!canvasArea) return;
        
        this._audioSplitEditorOpen = true;
        canvasArea.classList.add('ast-active');
        
        const panel = document.createElement('div');
        panel.id = 'ast-panel-container';
        panel.innerHTML = renderAudioSplitTimeline();
        canvasArea.appendChild(panel);
    },
    
    closeAudioSplitEditor() {
        try {
            AudioSplitter.stopPreview();
            AudioSplitter.clearDraft();
            this._stopPlayheadUpdater();
            
            // Remove panel and restore canvas-area
            const canvasArea = document.querySelector('.canvas-area');
            if (canvasArea) canvasArea.classList.remove('ast-active');
            
            const panel = document.getElementById('ast-panel-container');
            if (panel) panel.remove();
            
            renderRightPanel();
            renderTimeline();
        } catch (e) {
            console.warn('closeAudioSplitEditor error:', e);
        } finally {
            // Always reset flag so editor can be reopened
            this._audioSplitEditorOpen = false;
        }
    },
    
    setAudioSplitLang(lang) {
        const draft = AudioSplitter.getDraft();
        if (draft) draft.lang = lang;
    },
    
    toggleAudioSplitSnap() {
        this._audioSplitSnap = !this._audioSplitSnap;
        this._refreshAudioSplitPanel();
    },
    
    selectAudioSplitSegment(index) {
        AudioSplitter.setSelectedSegment(index);
        const segs = AudioSplitter.getSegments();
        if (segs[index]) {
            AudioSplitter.seekPreview(segs[index].start);
            this._updateAudioSplitPlayhead();
        }
        // Sync main editor page selection (lightweight)
        if (index >= 0 && index < (Store.get('currentProject')?.pages?.length || 0)) {
            Store.set('activePageIndex', index);
            renderPageList();
            renderCanvas();
            renderRightPanel();
        }
        this._refreshAudioSplitPanel();
    },
    
    playAudioSplitSegment(index) {
        AudioSplitter.setSelectedSegment(index);
        AudioSplitter.playSegmentPreview(index);
        this._startPlayheadUpdater();
        this._refreshAudioSplitPanel();
    },
    
    setAudioSplitSegmentMeta(index, key, value) {
        AudioSplitter.setSegmentMeta(index, key, value);
    },
    
    toggleAudioSplitSegmentIgnore(index) {
        const meta = AudioSplitter.getSegmentMeta(index);
        AudioSplitter.setSegmentMeta(index, 'ignored', !meta.ignored);
        this._refreshAudioSplitPanel();
    },
    
    addAudioSplitCut(timeSec) {
        if (AudioSplitter.addBoundary(timeSec)) {
            const segs = AudioSplitter.getSegments();
            Toast.show(`Corte adicionado → ${segs.length} segmentos`, 'success', 1500);
            this._refreshAudioSplitPanel();
        }
    },
    
    removeAudioSplitCut(index) {
        if (AudioSplitter.removeBoundary(index)) {
            const segs = AudioSplitter.getSegments();
            Toast.show(`Corte removido → ${segs.length} segmentos`, 'info', 1500);
            this._refreshAudioSplitPanel();
        }
    },
    
    handleWaveformClick(e) {
        const canvas = document.getElementById('audio-split-waveform');
        if (!canvas) return;
        const draft = AudioSplitter.getDraft();
        if (!draft || !draft.sourceDuration) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        const timeSec = pct * draft.sourceDuration;
        this.addAudioSplitCut(timeSec);
    },
    
    uploadAudioSplitSource() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/mp3,audio/wav,audio/mpeg,.mp3,.wav';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            Toast.show(t('toast.loadingAudio'), 'info', 2000);
            
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const dataUrl = ev.target.result;
                const info = await AudioSplitter.loadSourceAudio(dataUrl);
                
                if (info) {
                    const proj = Store.get('currentProject');
                    const pageCount = proj?.pages?.length || 1;
                    AudioSplitter.buildEqualBoundaries(pageCount);
                    
                    Toast.show(`Áudio carregado: ${info.duration.toFixed(1)}s`, 'success');
                    this._refreshAudioSplitPanel();
                } else {
                    Toast.show(t('toast.audioLoadError'), 'error');
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },
    
    resetAudioSplitBoundaries() {
        const proj = Store.get('currentProject');
        const pageCount = proj?.pages?.length || 1;
        AudioSplitter.buildEqualBoundaries(pageCount);
        Toast.show(t('toast.divisionsEqualized'), 'info', 1500);
        this._refreshAudioSplitPanel();
    },
    
    undoAudioSplit() {
        if (AudioSplitter.undo()) {
            Toast.show(t('toast.undone'), 'info', 1000);
            this._refreshAudioSplitPanel();
        }
    },
    
    toggleAudioSplitPreview() {
        if (AudioSplitter.isPreviewPlaying()) {
            AudioSplitter.pausePreview();
            this._stopPlayheadUpdater();
        } else {
            AudioSplitter.playPreview(AudioSplitter.getPreviewTime());
            this._startPlayheadUpdater();
        }
        const btn = document.querySelector('.ast-play-btn');
        if (btn) {
            const playing = AudioSplitter.isPreviewPlaying();
            btn.textContent = playing ? '⏸' : '▶';
            btn.classList.toggle('playing', playing);
        }
    },
    
    stopAudioSplitPreview() {
        AudioSplitter.stopPreview();
        this._stopPlayheadUpdater();
        this._updateAudioSplitPlayhead();
        const btn = document.querySelector('.ast-play-btn');
        if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
    },
    
    seekAudioSplitPreview(time) {
        AudioSplitter.seekPreview(time);
        this._updateAudioSplitPlayhead();
    },
    
    _startPlayheadUpdater() {
        if (this._audioSplitPlayheadInterval) return;
        this._audioSplitPlayheadInterval = setInterval(() => {
            this._updateAudioSplitPlayhead();
            // Auto-highlight thumbnail + waveform segment during playback
            const time = AudioSplitter.getPreviewTime();
            const activeIdx = AudioSplitter.getActiveSegmentAtTime(time);
            if (activeIdx >= 0 && activeIdx !== AudioSplitter.getSelectedSegment()) {
                AudioSplitter.setSelectedSegment(activeIdx);
                // Update thumbnail highlights
                const thumbs = document.querySelectorAll('.ast-thumb');
                thumbs.forEach((t, i) => {
                    t.classList.toggle('selected', i === activeIdx);
                });
            }
        }, 40);
    },
    
    _stopPlayheadUpdater() {
        if (this._audioSplitPlayheadInterval) {
            clearInterval(this._audioSplitPlayheadInterval);
            this._audioSplitPlayheadInterval = null;
        }
    },
    
    _updateAudioSplitPlayhead() {
        const playhead = document.getElementById('audio-split-playhead');
        const seekSlider = document.getElementById('audio-split-seek');
        const timeLabel = document.getElementById('audio-split-time-label');
        const draft = AudioSplitter.getDraft();
        
        if (!playhead || !draft) return;
        
        const currentTime = AudioSplitter.getPreviewTime();
        const duration = draft.sourceDuration || 1;
        const pct = (currentTime / duration) * 100;
        
        playhead.style.left = pct + '%';
        if (seekSlider) seekSlider.value = Math.round(currentTime * 100);
        if (timeLabel) {
            const fmtTime = (s) => { const m=Math.floor(s/60); const sec=Math.floor(s%60); const ms=Math.floor((s%1)*10); return `${m}:${sec.toString().padStart(2,'0')}.${ms}`; };
            timeLabel.textContent = `${fmtTime(currentTime)} / ${fmtTime(duration)}`;
        }
        
        // Check if playback ended
        if (!AudioSplitter.isPreviewPlaying() && this._audioSplitPlayheadInterval) {
            this._stopPlayheadUpdater();
            const btn = document.querySelector('.ast-play-btn');
            if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
        }
    },
    
    async applyAudioSplitToPages() {
        const proj = Store.get('currentProject');
        if (!proj) return;
        
        Toast.show(t('toast.processingAudio'), 'info', 3000);
        
        const result = await AudioSplitter.applyToProject(proj);
        
        if (result.success) {
            const created = result.pagesCreated ? ` (${result.pagesCreated} páginas criadas)` : '';
            Toast.show(`✅ ${result.segmentCount} narrações aplicadas a ${result.segmentCount} páginas${created}!`, 'success');
            this.closeAudioSplitEditor();
            // Full render to show new pages
            App.render();
        } else {
            Toast.show(`Erro: ${result.error}`, 'error');
        }
    },
    
    _refreshAudioSplitPanel() {
        const container = document.getElementById('ast-panel-container');
        if (container) {
            container.innerHTML = renderAudioSplitTimeline();
            requestAnimationFrame(() => { drawAudioSplitWaveform(); });
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // TIMELINE PLAYER - Preview with Ken Burns + Audio Sync
    // ═══════════════════════════════════════════════════════════════
    
    _playerRAF: null,
    _playerStartTime: 0,
    _playerPageStartTime: 0,
    _transitionActive: false,
    _transitionStartTime: 0,
    _transitionDuration: 500, // ms
    
    playPreviewInCanvas() {
        this.timelineTogglePlay();
    },

    timelineTogglePlay() {
        const player = Store.get('timelinePlayer') || {};
        if (player.playing) {
            this._timelineStop();
        } else {
            this._timelinePlay();
        }
    },
    
    _timelinePlay() {
        const proj = Store.get('currentProject');
        if (!proj || !proj.pages || proj.pages.length === 0) return;
        
        const startIdx = Store.get('activePageIndex') || 0;
        
        Store.setSilent({ timelinePlayer: {
            playing: true,
            pageIndex: startIdx,
            pageProgress: 0
        }});
        
        this._playerStartTime = performance.now();
        this._playerPageStartTime = performance.now();
        
        // Start background music if available
        if (proj.videoAudio?.background?.file) {
            const bg = proj.videoAudio.background;
            AudioManager.playAudio('background', bg.file, {
                volume: bg.volume,
                loop: bg.loop
            });
        }
        
        // Start narration for current page
        this._playPageNarration(proj, startIdx);
        
        // Switch to the playing page (silent to avoid full re-render)
        Store.setSilent({ activePageIndex: startIdx, coverActive: false, backCoverActive: false, selectedElement: null, selectedSlot: -1 });
        renderCanvas();
        renderTimeline();
        
        // Start animation loop (after render so canvas-page exists)
        requestAnimationFrame(() => this._playerTick());
    },
    
    _timelineStop() {
        if (this._playerRAF) {
            cancelAnimationFrame(this._playerRAF);
            this._playerRAF = null;
        }
        
        AudioManager.stopAll();
        
        Store.setSilent({ timelinePlayer: {
            playing: false,
            pageIndex: -1,
            pageProgress: 0
        }});
        
        // Remove Ken Burns transform
        this._removeKenBurnsTransform();
        
        renderTimeline();
        renderCanvas();
    },
    
    _playerTick() {
        const player = Store.get('timelinePlayer');
        if (!player || !player.playing) return;
        
        const proj = Store.get('currentProject');
        if (!proj || !proj.pages) { this._timelineStop(); return; }
        
        const pages = proj.pages;
        const pageIdx = player.pageIndex;
        if (pageIdx >= pages.length) {
            // Finished all pages
            this._timelineStop();
            return;
        }
        
        const page = pages[pageIdx];
        const pageDur = (page.duration || 4) * 1000; // ms
        const elapsed = performance.now() - this._playerPageStartTime;
        const progress = Math.min(1, elapsed / pageDur);
        
        // Update player state (silent to avoid full re-render)
        Store.setSilent({ timelinePlayer: {
            playing: true,
            pageIndex: pageIdx,
            pageProgress: progress
        }});
        
        // Apply Ken Burns transform to canvas
        this._applyKenBurnsTransform(page.kenBurns || 'zoom-in', progress);
        
        // Apply transition fade-out near end of page
        const transition = page.transition || 'fade';
        const transThreshold = 0.88;
        if (progress > transThreshold && pageIdx < pages.length - 1 && transition !== 'cut') {
            const tProg = (progress - transThreshold) / (1 - transThreshold);
            this._applyTransitionOverlay(transition, tProg, 'out');
        } else if (progress <= transThreshold) {
            this._removeTransitionOverlay();
        }
        
        // Apply transition fade-in at start of page (from previous page switch)
        if (this._transitionActive) {
            const tElapsed = performance.now() - this._transitionStartTime;
            const tDur = this._transitionDuration;
            if (tElapsed < tDur) {
                const tProg = 1 - (tElapsed / tDur);
                this._applyTransitionOverlay(this._transitionType || 'fade', tProg, 'in');
            } else {
                this._transitionActive = false;
                this._removeTransitionOverlay();
            }
        }
        
        // Update timeline progress bar only (lightweight)
        this._updateTimelineProgress(pageIdx, progress);
        
        if (progress >= 1) {
            // Move to next page
            const nextIdx = pageIdx + 1;
            if (nextIdx >= pages.length) {
                this._removeTransitionOverlay();
                this._timelineStop();
                return;
            }
            
            this._playerPageStartTime = performance.now();
            this._transitionActive = true;
            this._transitionStartTime = performance.now();
            this._transitionType = page.transition || 'fade';
            
            Store.setSilent({ timelinePlayer: {
                playing: true,
                pageIndex: nextIdx,
                pageProgress: 0
            }});
            
            // Switch page (silent to avoid full re-render losing transforms)
            Store.setSilent({ activePageIndex: nextIdx, coverActive: false, backCoverActive: false, selectedElement: null, selectedSlot: -1 });
            renderCanvas();
            
            // Start narration for new page
            this._playPageNarration(proj, nextIdx);
            
            renderTimeline();
        }
        
        this._playerRAF = requestAnimationFrame(() => this._playerTick());
    },
    
    _playPageNarration(proj, pageIdx) {
        // Stop previous narration
        Object.keys(AudioManager._sources).forEach(id => {
            if (id.startsWith('narration-')) AudioManager.stopAudio(id);
        });
        
        const page = proj.pages[pageIdx];
        if (!page) return;
        
        const narration = AudioManager.getPageNarration(proj, page.id);
        if (narration && narration.file) {
            AudioManager.playAudio('narration-' + page.id, narration.file, {
                volume: narration.volume || 0.8
            });
        }
    },
    
    _applyKenBurnsTransform(presetId, progress) {
        const motionLayer = document.getElementById('canvas-motion-layer');
        if (!motionLayer) return;
        
        const transform = KenBurns.getTransformCSS(presetId, progress);
        if (transform === 'none') {
            motionLayer.style.transform = '';
            return;
        }
        
        motionLayer.style.transformOrigin = 'center center';
        motionLayer.style.transform = transform;
        motionLayer.style.transition = 'none';
    },
    
    _removeKenBurnsTransform() {
        const motionLayer = document.getElementById('canvas-motion-layer');
        if (!motionLayer) return;
        motionLayer.style.transform = '';
        motionLayer.style.transition = '';
        motionLayer.style.transformOrigin = '';
    },
    
    _applyTransitionOverlay(type, tProgress, direction) {
        let overlay = document.getElementById('transition-overlay');
        const canvasArea = document.getElementById('canvas-area');
        if (!canvasArea) return;
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'transition-overlay';
            overlay.className = 'transition-overlay';
            canvasArea.appendChild(overlay);
        }
        
        const t = Math.max(0, Math.min(1, tProgress));
        
        if (type === 'fade') {
            overlay.style.background = '#000';
            overlay.style.opacity = t * 0.85;
        } else if (type === 'slide') {
            overlay.style.background = '#000';
            overlay.style.opacity = direction === 'out' ? t * 0.4 : t * 0.4;
        } else if (type === 'zoom') {
            overlay.style.background = '#000';
            overlay.style.opacity = t * 0.6;
        }
    },
    
    _removeTransitionOverlay() {
        const overlay = document.getElementById('transition-overlay');
        if (overlay) overlay.remove();
    },
    
    _updateTimelineProgress(pageIdx, progress) {
        const bars = document.querySelectorAll('.timeline-page-bar');
        const pages = document.querySelectorAll('.timeline-page');
        
        pages.forEach((el, i) => {
            el.classList.toggle('playing-now', i === pageIdx);
        });
        
        bars.forEach((bar, i) => {
            if (i === pageIdx) {
                bar.style.width = (progress * 100) + '%';
            } else if (i < pageIdx) {
                bar.style.width = '100%';
            } else {
                bar.style.width = '0%';
            }
        });
        
        // Update time display
        const timeEl = document.querySelector('.timeline-time');
        if (timeEl) {
            const proj = Store.get('currentProject');
            if (proj && proj.pages) {
                let current = 0;
                let total = 0;
                proj.pages.forEach((pg, i) => {
                    const dur = pg.duration || 4;
                    total += dur;
                    if (i < pageIdx) current += dur;
                    if (i === pageIdx) current += dur * progress;
                });
                const fmtTime = (s) => {
                    const m = Math.floor(s / 60);
                    const sec = Math.floor(s % 60);
                    return m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
                };
                timeEl.textContent = fmtTime(current) + ' / ' + fmtTime(total);
            }
        }
        
        // Update scrubber
        const scrubber = document.querySelector('.timeline-scrubber');
        if (scrubber) {
            const proj = Store.get('currentProject');
            if (proj && proj.pages) {
                let current = 0;
                proj.pages.forEach((pg, i) => {
                    const dur = pg.duration || 4;
                    if (i < pageIdx) current += dur;
                    if (i === pageIdx) current += dur * progress;
                });
                scrubber.value = Math.round(current * 10);
            }
        }
    },
    
    timelineClickPage(index) {
        const player = Store.get('timelinePlayer') || {};
        if (player.playing) {
            this._timelineStop();
        }
        this.setActivePage(index);
        renderTimeline();
    },
    
    timelineScrub(timeInSeconds, totalDuration) {
        const proj = Store.get('currentProject');
        if (!proj || !proj.pages) return;
        
        let accumulated = 0;
        for (let i = 0; i < proj.pages.length; i++) {
            const dur = proj.pages[i].duration || 4;
            if (accumulated + dur > timeInSeconds) {
                this.setActivePage(i);
                renderTimeline();
                return;
            }
            accumulated += dur;
        }
    },
    
    selectSticker(index) {
        Store.set({ selectedElement: { type: 'sticker', index }, selectedSlot: -1 });
        this.closeBalloonTooltip();
        renderCanvas(); renderRightPanel();
    },
    startStickerDrag(e, index) {
        e.preventDefault(); e.stopPropagation();
        const page = Store.getActivePage(); if (!page || !page.stickers || !page.stickers[index]) return;
        const stk = page.stickers[index];
        const canvasEl = document.getElementById('canvas-page');
        if (!canvasEl) return;
        const zoom = Store.get('zoom');
        const startX = e.clientX, startY = e.clientY;
        const origX = stk.x, origY = stk.y;
        let dragged = false;
        // Select sticker immediately
        Store._s.selectedElement = { type: 'sticker', index };
        Store._s.selectedSlot = -1;
        const move = (ev) => {
            dragged = true;
            stk.x = origX + (ev.clientX - startX) / zoom;
            stk.y = origY + (ev.clientY - startY) / zoom;
            renderCanvas();
        };
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            Store.save();
            if (!dragged) {
                // It was a click, not drag — show tooltip
                this._showStickerTooltip(index);
            }
            renderRightPanel();
        };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    },
    _showStickerTooltip(index) {
        this.closeStickerTooltip();
        this.closeBalloonTooltip();
        const page = Store.getActivePage();
        if (!page || !page.stickers || !page.stickers[index]) return;
        const stk = page.stickers[index];
        const canvasArea = document.getElementById('canvas-area');
        const canvasPage = document.getElementById('canvas-page');
        if (!canvasArea || !canvasPage) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'floating-tooltip';
        tooltip.id = 'sticker-tooltip';
        tooltip.onclick = e => e.stopPropagation();

        const opacity = stk.opacity != null ? stk.opacity : 1;
        const rotation = stk.rotation || 0;

        tooltip.innerHTML = `
            <div class="ft-header">
                <span class="ft-title">Sticker</span>
                <button class="ft-close" onclick="App.closeStickerTooltip()">✕</button>
            </div>
            <div class="ft-row">
                <span class="ft-label">${Math.round(opacity*100)}%</span>
                <input type="range" min="0.1" max="1" step="0.05" value="${opacity}" oninput="this.previousElementSibling.textContent=Math.round(this.value*100)+'%';App._stickerTooltipChange(${index},'opacity',parseFloat(this.value))">
            </div>
            <div class="ft-row">
                <span class="ft-label">${rotation}°</span>
                <input type="range" min="-180" max="180" value="${rotation}" oninput="this.previousElementSibling.textContent=this.value+'°';App._stickerTooltipChange(${index},'rotation',parseInt(this.value))">
            </div>
            <div class="ft-row">
                <span class="ft-label">Tam.</span>
                <input type="number" value="${Math.round(stk.w)}" min="20" oninput="App._stickerTooltipChange(${index},'w',parseInt(this.value));App._stickerTooltipChange(${index},'h',parseInt(this.value))" style="width:60px;">
                <span style="font-size:10px;color:var(--text3);">px</span>
            </div>
            <div class="ft-actions">
                <button onclick="App.addStickerImage(Store.getActivePage().stickers[${index}].src);App.closeStickerTooltip()">Duplicar</button>
                <button class="danger" onclick="App.deleteSticker(${index});App.closeStickerTooltip()">Remover</button>
            </div>`;

        canvasArea.appendChild(tooltip);

        // Position near the sticker
        const stickerEls = canvasPage.querySelectorAll('.sticker-wrapper');
        const stickerEl = stickerEls[index];
        if (stickerEl) {
            const areaRect = canvasArea.getBoundingClientRect();
            const sRect = stickerEl.getBoundingClientRect();
            let left = sRect.left - areaRect.left + sRect.width / 2 - 130;
            let top = sRect.bottom - areaRect.top + 10;
            const tRect = tooltip.getBoundingClientRect();
            if (top + tRect.height > areaRect.height) {
                top = sRect.top - areaRect.top - tRect.height - 10;
                tooltip.classList.add('arrow-bottom');
            }
            if (left < 4) left = 4;
            if (left + tRect.width > areaRect.width - 4) left = areaRect.width - tRect.width - 4;
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        }
    },
    _stickerTooltipChange(index, prop, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.stickers || !page.stickers[index]) return;
        page.stickers[index][prop] = value;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    closeStickerTooltip() {
        const t = document.getElementById('sticker-tooltip');
        if (t) t.remove();
    },
    startStickerResize(e, index) {
        e.preventDefault(); e.stopPropagation();
        const page = Store.getActivePage(); if (!page || !page.stickers || !page.stickers[index]) return;
        const stk = page.stickers[index];
        const zoom = Store.get('zoom');
        const startX = e.clientX, startY = e.clientY;
        const origW = stk.w, origH = stk.h;
        const aspect = origW / origH;
        const move = (ev) => {
            const dw = (ev.clientX - startX) / zoom;
            stk.w = Math.max(30, origW + dw);
            stk.h = stk.w / aspect;
            renderCanvas();
        };
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); Store.save(); };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    },
    deleteSticker(index) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.stickers) return;
        Store.pushUndo();
        page.stickers.splice(index, 1);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    duplicateBalloon(index) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        const newBalloon = JSON.parse(JSON.stringify(page.texts[index]));
        newBalloon.x += 20;
        newBalloon.y += 20;
        page.texts.push(newBalloon);
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: page.texts.length - 1 } });
        Store.save();
        Toast.show(t('toast.balloonDuplicated'));
    },
    deleteBalloon(index) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        page.texts.splice(index, 1);
        Store.set({ currentProject: p, selectedElement: null }); Store.save();
    },
    changeBalloonType(index, type) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        
        // Matéria guard for type changes
        const isMateria = page?.type === 'materia' || page?.isMateria === true;
        if (isMateria && ['thought', 'shout', 'sfx'].includes(type)) {
            const labels = { thought: 'Pensamento', shout: 'Grito', sfx: 'SFX/Onomatopeia' };
            Toast.show(t('toast.balloonNotForMateria', { type: labels[type] || type }), 2500);
            return;
        }
        
        Store.pushUndo();
        const b = page.texts[index];
        const oldText = b.text;
        b.type = type;
        b.text = oldText;
        b.manualSize = false;
        if (!b.font) b.font = type === 'narration' ? 'serif' : 'comic';
        if (!b.fontSize) {
            const defaults = { speech: 15, thought: 15, shout: 20, whisper: 12, narration: 13, sfx: 42 };
            b.fontSize = defaults[type] || 15;
        }
        if (type === 'sfx' && !b.sfxPreset) b.sfxPreset = 'boom';
        if (type === 'narration') {
            if (!b.bgColor) b.bgColor = '#fffde7';
            if (b.cornerRadius === undefined) b.cornerRadius = 4;
            b.direction = 'none';
        }
        this._recalcBalloonSize(b);
        // Enforce minimum sizes per type
        const minSizes = { speech: { w: 120, h: 70 }, thought: { w: 130, h: 80 }, shout: { w: 140, h: 80 }, whisper: { w: 110, h: 70 }, narration: { w: 160, h: 50 }, sfx: { w: 80, h: 50 } };
        const mins = minSizes[type] || minSizes.speech;
        b.w = Math.max(b.w, mins.w);
        b.h = Math.max(b.h, mins.h);
        if (type === 'narration') this._autoSnapNarrationToPanel(index);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    changeBalloonFontSize(index, size) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        page.texts[index].fontSize = parseInt(size, 10);
        page.texts[index].manualSize = false;
        this._recalcBalloonSize(page.texts[index]);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    changeBalloonFont(index, font) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        page.texts[index].font = font;
        page.texts[index].manualSize = false;
        this._recalcBalloonSize(page.texts[index]);

        const family = FontUtils.family(font);

        // Real-time preview: update sidebar font preview
        const preview = document.getElementById(`font-preview-${index}`);
        if (preview) preview.style.fontFamily = family;

        // Real-time: update balloon text in canvas without full re-render
        const wrapper = document.querySelector(`[data-balloon-idx="${index}"]`);
        if (wrapper) {
            const textEl = wrapper.querySelector('.balloon-text-css');
            if (textEl) textEl.style.fontFamily = family;
        }

        Store.setSilent({ currentProject: p }); Store.save();
        renderRightPanel();
    },
    changeBalloonDirection(index, direction) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        const b = page.texts[index];
        b.direction = direction;
        
        // Update tdg-btn active states
        document.querySelectorAll('.tdg-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.dir === direction);
        });
        
        // CSS-first: update data-tail attribute (CSS handles the rest)
        const wrapper = document.querySelector(`[data-balloon-idx="${index}"]`);
        if (wrapper) {
            wrapper.dataset.tail = direction;
            // Shout: also update SVG
            if (b.type === 'shout') {
                const svgLayer = wrapper.querySelector('.shout-svg-bg');
                if (svgLayer && typeof BalloonSVGRenderer !== 'undefined') {
                    svgLayer.innerHTML = BalloonSVGRenderer.shout(b.w, b.h || 120, direction, { fill: b.bgColor || '#fffde7', stroke: b.strokeColor || '#1a1a1a', strokeWidth: 2.5 });
                }
            }
        }
        
        Store.set({ currentProject: p }); Store.save();
    },
    changeBalloonBgColor(index, color) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        page.texts[index].bgColor = color;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    changeBalloonTextColor(index, color) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        page.texts[index].textColor = color;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    showDirectionPicker(e, index) {
        e.preventDefault();
        e.stopPropagation();
        const page = Store.getActivePage();
        if (!page || !page.texts[index]) return;
        const currentDir = page.texts[index].direction || 's';
        
        const dirs = [
            { key: 'nw', label: '↖', row: 0, col: 0 },
            { key: 'n', label: '↑', row: 0, col: 1 },
            { key: 'ne', label: '↗', row: 0, col: 2 },
            { key: 'w', label: '←', row: 1, col: 0 },
            { key: 'center', label: '●', row: 1, col: 1 },
            { key: 'e', label: '→', row: 1, col: 2 },
            { key: 'sw', label: '↙', row: 2, col: 0 },
            { key: 's', label: '↓', row: 2, col: 1 },
            { key: 'se', label: '↘', row: 2, col: 2 },
        ];
        
        const pickerHTML = `
            <div class="direction-picker" style="display:grid; grid-template-columns:repeat(3,32px); gap:4px;">
                ${dirs.map(d => `
                    <button onclick="App.changeBalloonDirection(${index},'${d.key}');closeContextMenu();" 
                        style="width:32px; height:32px; border:1px solid ${d.key === currentDir ? 'var(--accent)' : 'var(--border)'}; 
                        border-radius:6px; background:${d.key === currentDir ? 'var(--accent-glow)' : 'var(--surface2)'}; 
                        color:${d.key === currentDir ? 'var(--accent)' : 'var(--text2)'}; cursor:pointer; font-size:14px;">
                        ${d.label}
                    </button>
                `).join('')}
            </div>
        `;
        
        renderContextMenu(e.clientX, e.clientY, [
            { html: pickerHTML }
        ]);
    },
    editBalloon(index) {
        // Delegate to CSS-first edit method
        this.editBalloonCss(index);
    },
    _showBalloonTooltip(index) {
        this.closeBalloonTooltip();
        const page = Store.getActivePage();
        const proj = Store.get('currentProject');
        if (!page || !page.texts[index]) return;
        const balloon = page.texts[index];
        const canvasPage = document.getElementById('canvas-page');
        if (!canvasPage) return;
        const zoom = Store.get('zoom');
        const activeLang = proj?.activeLanguage || 'pt-BR';
        const balloonText = MultiLang.get(balloon.text, activeLang);

        const _h7 = c => { if (!c || c === 'transparent') return '#ffffff'; if (/^#[0-9a-f]{6}$/i.test(c)) return c; if (/^#[0-9a-f]{3}$/i.test(c)) return '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]; return '#ffffff'; };
        const bgColor = _h7(balloon.bgColor);
        const txtColor = balloon.textColor ? _h7(balloon.textColor) : (balloon.type === 'sfx' ? '#ff3333' : '#1a1a1a');
        const showDir = balloon.type !== 'narration' && balloon.type !== 'sfx';
        const opacity = balloon.opacity != null ? balloon.opacity : 1;
        const curDir = balloon.direction || 's';
        const types = ['speech','thought','shout','whisper','narration','sfx'];
        const typeLabels = { speech:'Fala', thought:'Pensamento', shout:'Grito', whisper:'Sussurro', narration:'Narração', sfx:'SFX' };
        const fonts = ['comic','marker','serif','sans'];
        const fontLabels = { comic:'Comic', marker:'Marker', serif:'Serif', sans:'Sans' };
        const dirs = [
            { key:'nw', label:'↖' }, { key:'n', label:'↑' }, { key:'ne', label:'↗' },
            { key:'w', label:'←' }, { key:'center', label:'●' }, { key:'e', label:'→' },
            { key:'sw', label:'↙' }, { key:'s', label:'↓' }, { key:'se', label:'↘' }
        ];

        const tooltip = document.createElement('div');
        tooltip.className = 'floating-tooltip';
        tooltip.id = 'balloon-tooltip';
        tooltip.onclick = e => e.stopPropagation();

        tooltip.innerHTML = `
            <div class="ft-header">
                <span class="ft-title">Edit Balloon #${index + 1}</span>
                <button class="ft-close" onclick="App.closeBalloonTooltip()" title="Fechar (Esc)">✕</button>
            </div>
            <div class="ft-text-area">
                <textarea id="balloon-text-input" placeholder="Digite o texto do balão..." oninput="App._tooltipChangeText(${index},this.value)" onkeydown="if(event.key==='Escape'){App.closeBalloonTooltip();event.stopPropagation();}">${S(balloonText || '')}</textarea>
            </div>
            <div class="ft-row">
                <span class="ft-label">Tipo</span>
                <select onchange="App._tooltipChange(${index},'type',this.value)">
                    ${types.map(t => `<option value="${t}" ${balloon.type===t?'selected':''}>${typeLabels[t]}</option>`).join('')}
                </select>
                <span class="ft-label" style="min-width:36px;">Fonte</span>
                <select onchange="App._tooltipChange(${index},'font',this.value)">
                    ${fonts.map(f => `<option value="${f}" ${balloon.font===f?'selected':''}>${fontLabels[f]}</option>`).join('')}
                </select>
            </div>
            <div class="ft-row">
                <span class="ft-label">${balloon.fontSize||14}px</span>
                <input type="range" min="8" max="72" value="${balloon.fontSize||14}" oninput="this.previousElementSibling.textContent=this.value+'px';App._tooltipChange(${index},'fontSize',parseInt(this.value))">
                <input type="color" value="${bgColor}" onchange="App._tooltipChange(${index},'bgColor',this.value)" title="Fundo">
                <input type="color" value="${txtColor}" onchange="App._tooltipChange(${index},'textColor',this.value)" title="Texto">
            </div>
            <div class="ft-row">
                <span class="ft-label">${Math.round(opacity*100)}%</span>
                <input type="range" min="0.1" max="1" step="0.05" value="${opacity}" oninput="this.previousElementSibling.textContent=Math.round(this.value*100)+'%';App._tooltipChange(${index},'opacity',parseFloat(this.value))">
            </div>
            ${showDir ? `<div class="ft-dir-grid">
                ${dirs.map(d => `<button class="${d.key===curDir?'active':''}" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active');App._tooltipChange(${index},'direction','${d.key}')">${d.label}</button>`).join('')}
            </div>` : ''}
            <div class="ft-actions">
                <button onclick="App.duplicateBalloon(${index});App.closeBalloonTooltip()">⧉ Duplicar</button>
                <button onclick="App.toggleBalloonLock(${index});App.closeBalloonTooltip()">${balloon.locked ? '🔓 Destravar' : '🔒 Travar'}</button>
                <button class="danger" onclick="App.deleteBalloon(${index});App.closeBalloonTooltip()">🗑 Remover</button>
            </div>`;
        
        // Auto-focus the text input after adding to DOM
        setTimeout(() => {
            const textInput = document.getElementById('balloon-text-input');
            if (textInput) {
                textInput.focus();
                textInput.setSelectionRange(textInput.value.length, textInput.value.length);
            }
        }, 50);

        // Position near the balloon element
        const canvasArea = document.getElementById('canvas-area');
        if (!canvasArea) return;
        canvasArea.appendChild(tooltip);

        // Calculate position relative to canvas-area
        const balloonEl = canvasPage.querySelector(`[data-balloon-idx="${index}"]`);
        if (balloonEl) {
            const areaRect = canvasArea.getBoundingClientRect();
            const bRect = balloonEl.getBoundingClientRect();
            let left = bRect.left - areaRect.left + bRect.width / 2 - 130;
            let top = bRect.bottom - areaRect.top + 10;
            // Keep within viewport
            const tRect = tooltip.getBoundingClientRect();
            if (top + tRect.height > areaRect.height) {
                top = bRect.top - areaRect.top - tRect.height - 10;
                tooltip.classList.add('arrow-bottom');
            }
            if (left < 4) left = 4;
            if (left + tRect.width > areaRect.width - 4) left = areaRect.width - tRect.width - 4;
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        } else {
            tooltip.style.left = '50%';
            tooltip.style.top = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
        }
    },
    _tooltipChange(index, prop, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        page.texts[index][prop] = value;
        if (prop === 'fontSize') page.texts[index][prop] = parseInt(value, 10);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
        // Re-show tooltip for type change (direction grid visibility)
        if (prop === 'type') this._showBalloonTooltip(index);
    },
    _tooltipChangeText(index, value) {
        // Real-time text update without pushUndo on every keystroke
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        const balloon = page.texts[index];
        const activeLang = p.activeLanguage || 'pt-BR';
        
        // Multi-language support
        if (typeof balloon.text === 'string') {
            balloon.text = { 'pt-BR': balloon.text, 'en': '' };
        }
        balloon.text = MultiLang.set(balloon.text, activeLang, value);
        
        Store.set({ currentProject: p });
        // Update the balloon text on canvas in real-time
        const balloonTextEl = document.querySelector(`[data-balloon-idx="${index}"] .balloon-text-css`);
        if (balloonTextEl) balloonTextEl.textContent = value;
        // Debounce save
        clearTimeout(this._textSaveTimeout);
        this._textSaveTimeout = setTimeout(() => Store.save(), 500);
    },
    closeBalloonTooltip() {
        const t = document.getElementById('balloon-tooltip');
        if (t) t.remove();
    },
    // ── Z-Order Controls ──
    bringBalloonForward(index) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index] || index >= page.texts.length - 1) return;
        Store.pushUndo();
        [page.texts[index], page.texts[index + 1]] = [page.texts[index + 1], page.texts[index]];
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: index + 1 } }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    sendBalloonBackward(index) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index] || index <= 0) return;
        Store.pushUndo();
        [page.texts[index], page.texts[index - 1]] = [page.texts[index - 1], page.texts[index]];
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: index - 1 } }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    bringBalloonToFront(index) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index] || index >= page.texts.length - 1) return;
        Store.pushUndo();
        const balloon = page.texts.splice(index, 1)[0];
        page.texts.push(balloon);
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: page.texts.length - 1 } }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    sendBalloonToBack(index) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index] || index <= 0) return;
        Store.pushUndo();
        const balloon = page.texts.splice(index, 1)[0];
        page.texts.unshift(balloon);
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: 0 } }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    // ── Opacity ──
    changeBalloonOpacity(index, opacity) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        page.texts[index].opacity = parseFloat(opacity);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    // ── Line Height ──
    changeBalloonLineHeight(index, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        page.texts[index].lineHeight = parseFloat(value);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    // ── Letter Spacing ──
    changeBalloonLetterSpacing(index, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        page.texts[index].letterSpacing = parseFloat(value);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    // ── Lock ──
    toggleBalloonLock(index) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        page.texts[index].locked = !page.texts[index].locked;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
        Toast.show(page.texts[index].locked ? 'Balão travado' : 'Balão destravado');
    },
    // ── Narration Snap (top/bottom toggle) ──
    toggleNarrationSnap(index, panelIndex = null) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        const balloon = page.texts[index];
        if (balloon.type !== 'narration') return;
        
        // Get panel bounds for snap calculation
        const layoutId = page.layoutId || LayoutEngine.getDefaultForCount(page.images?.length || 1);
        const tmpl = LayoutEngine.get(layoutId, page.images || [], p);
        if (!tmpl || !tmpl.panels) return;
        
        // Find which panel the balloon is currently in (by position)
        const _dims3 = getProjectDims();
        const pageH = _dims3.contentH;
        const textBelowH = page.showTextBelow ? Math.min(page.narrativeHeight || 120, Math.round(pageH * 0.4)) : 0;
        const panelZoneH = pageH - textBelowH;
        const scaleY = panelZoneH / (Math.max(...tmpl.panels.map(p => p.y + p.h)) || 1);
        
        let targetPanel = null;
        for (let i = 0; i < tmpl.panels.length; i++) {
            const panel = tmpl.panels[i];
            const px = Math.round(panel.x);
            const py = Math.round(panel.y * scaleY);
            const pw = Math.round(panel.w);
            const ph = Math.round(panel.h * scaleY);
            if (balloon.x >= px - 10 && balloon.x <= px + pw + 10 &&
                balloon.y >= py - 10 && balloon.y <= py + ph + 10) {
                targetPanel = { x: px, y: py, w: pw, h: ph };
                break;
            }
        }
        
        if (!targetPanel) return;
        
        Store.pushUndo();
        const margin = 10;
        const currentSnap = balloon.snapPosition || 'top';
        const newSnap = currentSnap === 'top' ? 'bottom' : 'top';
        
        balloon.snapPosition = newSnap;
        balloon.x = targetPanel.x + margin;
        balloon.w = targetPanel.w - margin * 2;
        
        if (newSnap === 'top') {
            balloon.y = targetPanel.y + margin;
        } else {
            balloon.y = targetPanel.y + targetPanel.h - balloon.h - margin;
        }
        
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
        Toast.show(newSnap === 'top' ? 'Narração no topo' : 'Narração na base');
    },
    // ── Position/Size numeric ──
    setBalloonPosition(index, axis, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        page.texts[index][axis] = parseInt(value, 10);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    setBalloonSize(index, dim, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        Store.pushUndo();
        page.texts[index][dim] = Math.max(dim === 'w' ? 40 : 30, parseInt(value, 10));
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    // ── Page Background Color ──
    setPageBgColor(color) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndo();
        page.bgColor = color;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    // ── Panel Border Controls ──
    setPanelBorderWidth(value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        page.panelBorderWidth = parseInt(value, 10);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    setPanelBorderColor(color) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        page.panelBorderColor = color;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    setGutterSize(value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        page.gutterSize = parseInt(value, 10);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas();
    },
    setPanelRadius(value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        page.panelRadius = parseInt(value, 10);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    // ── Balloon Style Presets ──
    _balloonPresets: JSON.parse(localStorage.getItem('balloonPresets') || '[]'),
    saveBalloonPreset(index) {
        const page = Store.getActivePage();
        if (!page || !page.texts[index]) return;
        const b = page.texts[index];
        const preset = {
            name: `Preset ${this._balloonPresets.length + 1}`,
            type: b.type, font: b.font, fontSize: b.fontSize,
            bgColor: b.bgColor || '#ffffff', textColor: b.textColor || '#1a1a1a',
            opacity: b.opacity != null ? b.opacity : 1
        };
        this._balloonPresets.push(preset);
        localStorage.setItem('balloonPresets', JSON.stringify(this._balloonPresets));
        Toast.show(t('toast.presetSaved'));
        renderRightPanel();
    },
    applyBalloonPreset(index, presetIdx) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        const preset = this._balloonPresets[presetIdx];
        if (!preset) return;
        Store.pushUndo();
        const b = page.texts[index];
        b.type = preset.type; b.font = preset.font; b.fontSize = preset.fontSize;
        b.bgColor = preset.bgColor; b.textColor = preset.textColor;
        b.opacity = preset.opacity;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
        Toast.show(`Preset "${preset.name}" aplicado`);
    },
    deleteBalloonPreset(presetIdx) {
        this._balloonPresets.splice(presetIdx, 1);
        localStorage.setItem('balloonPresets', JSON.stringify(this._balloonPresets));
        Toast.show(t('toast.presetRemoved'));
        renderRightPanel();
    },
    // ── Bleed/Safe Zone ──
    toggleBleedGuides() {
        Store.set({ showBleed: !Store.get('showBleed') });
        renderCanvas();
    },
    // ── Reading Order ──
    toggleReadingOrder() {
        Store.set({ showReadingOrder: !Store.get('showReadingOrder') });
        renderCanvas();
    },
    toggleTextBelow() { 
        const p = Store.get('currentProject'), page = Store.getActivePage(); 
        if (!p || !page) return; 
        Store.pushUndo(); 
        page.showTextBelow = !page.showTextBelow; 
        if (page.showTextBelow && !page.narrativeHeight) page.narrativeHeight = 120;
        Store.set({ currentProject: p }); Store.save(); 
    },
    setTextPosition(position) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        const fmt = p.videoFormat || 'vertical';
        // Warn if unsafe
        if (typeof SafeZones !== 'undefined' && SafeZones.isUnsafe(fmt, position)) {
            const msg = i18n.getLocale() === 'pt-BR'
                ? 'Posicao inferior em videos verticais sera coberta pela interface do TikTok, Reels e Shorts.\n\nSeu texto pode ficar invisivel.\n\nRecomendado: usar posicao "Topo".\n\nUsar posicao inferior mesmo assim?'
                : 'Bottom position on vertical videos will be covered by TikTok, Reels, and Shorts UI elements.\n\nYour text may not be visible.\n\nRecommended: use "Top" position.\n\nUse bottom position anyway?';
            if (!confirm(msg)) return;
        }
        Store.pushUndo();
        if (!page.narrativeStyle) page.narrativeStyle = {};
        page.narrativeStyle.position = position;
        Store.set({ currentProject: p }); Store.save();
        renderRightPanel();
        renderCanvas();
    },
    applyTextPositionToAll(position) {
        const p = Store.get('currentProject');
        if (!p) return;
        const fmt = p.videoFormat || 'vertical';
        if (typeof SafeZones !== 'undefined' && SafeZones.isUnsafe(fmt, position)) {
            const msg = i18n.getLocale() === 'pt-BR'
                ? 'Posicao inferior em videos verticais sera coberta pela interface do TikTok/Reels/Shorts.\n\nAplicar a todas as paginas mesmo assim?'
                : 'Bottom position on vertical videos will be covered by TikTok/Reels/Shorts UI.\n\nApply to all pages anyway?';
            if (!confirm(msg)) return;
        }
        Store.pushUndo();
        p.pages.forEach(pg => {
            if (!pg.narrativeStyle) pg.narrativeStyle = {};
            pg.narrativeStyle.position = position;
        });
        Store.set({ currentProject: p }); Store.save();
        if (typeof Toast !== 'undefined') Toast.show(t('toast.presetApplied', { name: position }), 'success');
        renderRightPanel();
        renderCanvas();
    },
     _narrativeSaveTimeout: null,
    _narrativeMeasureEl: null,
    _narrativePreviewTimeout: null,
    _lastNarrativeMinWarnKey: null,
    updateNarrative(text) { 
        const p = Store.get('currentProject');
        const page = Store.getActivePage(); 
        if (!page) return; 
        const activeLang = p?.activeLanguage || 'pt-BR';
        
        if (typeof page.narrative === 'string') {
            page.narrative = { 'pt-BR': page.narrative, 'en': '' };
        }
        page.narrative = MultiLang.set(page.narrative, activeLang, text);
        Store.setSilent({ currentProject: p });
        this._scheduleNarrativePreviewRefresh(text);
        clearTimeout(this._narrativeSaveTimeout);
        this._narrativeSaveTimeout = setTimeout(() => {
            Store.save();
        }, 500);
    },
    _ensureNarrativeSettings(project) {
        if (!project) return { heightLocked: false, fontSizeLocked: false, overflow: 'shrink', minFontSize: 12, warnOnMin: false };
        if (!project.narrativeSettings) project.narrativeSettings = {};
        if (project.narrativeSettings.heightLocked === undefined) project.narrativeSettings.heightLocked = false;
        if (project.narrativeSettings.fontSizeLocked === undefined) project.narrativeSettings.fontSizeLocked = false;
        if (!project.narrativeSettings.overflow) project.narrativeSettings.overflow = 'shrink';
        if (project.narrativeSettings.minFontSize == null) project.narrativeSettings.minFontSize = 12;
        if (project.narrativeSettings.warnOnMin == null) project.narrativeSettings.warnOnMin = false;
        return project.narrativeSettings;
    },
    _getNarrativePlaceholder(lang) {
        return lang === 'pt-BR' ? 'Escreva a narrativa aqui...' : 'Write narration here...';
    },
    _getNarrativeMeasureDiv() {
        if (this._narrativeMeasureEl && this._narrativeMeasureEl.isConnected) return this._narrativeMeasureEl;
        const div = document.createElement('div');
        div.id = 'narrative-measure-box';
        div.style.cssText = 'position:absolute;left:-99999px;top:-99999px;visibility:hidden;pointer-events:none;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;padding:0;margin:0;';
        document.body.appendChild(div);
        this._narrativeMeasureEl = div;
        return div;
    },
    _setNarrativeMeasureStyle(div, style, width, size) {
        div.style.width = width + 'px';
        div.style.fontFamily = FontUtils.family(style.font || 'serif');
        div.style.fontSize = size + 'px';
        div.style.lineHeight = String(style.leading || 1.4);
        div.style.fontWeight = style.bold ? '700' : '400';
        div.style.fontStyle = style.italic ? 'italic' : 'normal';
        div.style.textDecoration = style.underline ? 'underline' : 'none';
        div.style.letterSpacing = style.letterSpacing ? style.letterSpacing + 'px' : 'normal';
        div.style.textAlign = style.align || 'justify';
    },
    _measureNarrativeContentHeight(text, style, width, size) {
        const div = this._getNarrativeMeasureDiv();
        this._setNarrativeMeasureStyle(div, style, width, size);
        div.textContent = text && text.length ? text : ' ';
        return Math.ceil(div.scrollHeight);
    },
    _truncateNarrativeTextToFit(text, style, width, maxHeight, size) {
        const source = (text || '').trim();
        if (!source) return '';
        const measure = (candidate) => this._measureNarrativeContentHeight(candidate, style, width, size);
        if (measure(source) <= maxHeight) return source;
        let low = 0;
        let high = source.length;
        let best = '...';
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = source.slice(0, mid).trimEnd() + '...';
            if (measure(candidate) <= maxHeight) {
                best = candidate;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return best;
    },
    getNarrativeLayoutInfo(pageOverride = null, projectOverride = null, textOverride = null) {
        const project = projectOverride || Store.get('currentProject');
        const page = pageOverride || Store.getActivePage();
        const settings = this._ensureNarrativeSettings(project);
        const activeLang = project?.activeLanguage || 'pt-BR';
        const style = {
            font: 'serif',
            size: 48,
            align: 'justify',
            color: '#ffffff',
            textColor: '#ffffff',
            leading: 1.4,
            bold: false,
            italic: false,
            underline: false,
            ...(page?.narrativeStyle || {})
        };
        const dims = getProjectDims(project);
        const height = Math.max(40, Math.min(page?.narrativeHeight || 120, Math.round(dims.contentH * 0.4)));
        const paddingX = 24;
        const paddingY = 16;
        const usableWidth = Math.max(120, dims.contentW - paddingX * 2);
        const usableHeight = Math.max(8, height - paddingY * 2);
        const text = textOverride != null
            ? textOverride
            : (page ? MultiLang.get(page.narrative, activeLang) : '');
        const baseSize = Math.max(12, Math.min(250, parseInt(style.size, 10) || 48));
        if (!text || !text.trim()) {
            return {
                text: '',
                placeholder: this._getNarrativePlaceholder(activeLang),
                style,
                settings,
                height,
                baseSize,
                finalSize: baseSize,
                fits: true,
                isEmpty: true,
                truncated: false,
                minReached: false,
                lineClamp: 0,
                requiredHeight: height,
                status: 'empty',
                statusColor: '#94a3b8',
                statusLabel: activeLang === 'pt-BR' ? 'Aguardando texto' : 'Waiting for text'
            };
        }
        const baseHeight = this._measureNarrativeContentHeight(text, style, usableWidth, baseSize);
        const overflowMode = settings.overflow || 'shrink';
        const minSize = Math.max(8, Math.min(100, parseInt(settings.minFontSize, 10) || 12));
        let finalSize = baseSize;
        let truncated = false;
        let lineClamp = 0;
        let minReached = false;
        let status = 'fit';
        if (overflowMode === 'shrink' && baseHeight > usableHeight) {
            while (finalSize > minSize && this._measureNarrativeContentHeight(text, style, usableWidth, finalSize) > usableHeight) {
                finalSize -= 1;
            }
            minReached = finalSize === minSize;
            if (this._measureNarrativeContentHeight(text, style, usableWidth, finalSize) > usableHeight) {
                truncated = true;
                lineClamp = Math.max(1, Math.floor(usableHeight / (finalSize * (style.leading || 1.4))));
                status = 'warn';
            } else if (finalSize < baseSize) {
                status = 'shrink';
            }
        } else if (overflowMode === 'truncate' && baseHeight > usableHeight) {
            truncated = true;
            lineClamp = Math.max(1, Math.floor(usableHeight / (baseSize * (style.leading || 1.4))));
            status = 'truncate';
        } else if (overflowMode === 'warn' && baseHeight > usableHeight) {
            status = 'warn';
        }
        const requiredHeight = Math.ceil(baseHeight + paddingY * 2);
        let statusLabel = '✓ Texto cabe';
        let statusColor = '#22c55e';
        if (status === 'shrink') {
            statusLabel = `↓ Fonte reduzida para ${finalSize}px`;
            statusColor = '#f59e0b';
        } else if (status === 'truncate') {
            statusLabel = 'Warning: Text truncated with ...';
            statusColor = '#ef4444';
        } else if (status === 'warn') {
            statusLabel = `Warning: Text too long - ${requiredHeight}px required`;
            statusColor = '#ef4444';
        }
        return {
            text,
            placeholder: this._getNarrativePlaceholder(activeLang),
            style,
            settings,
            height,
            usableHeight,
            usableWidth,
            baseSize,
            finalSize,
            fits: status !== 'warn',
            isEmpty: false,
            truncated,
            minReached,
            lineClamp,
            requiredHeight,
            status,
            statusColor,
            statusLabel,
            truncatedText: truncated ? this._truncateNarrativeTextToFit(text, style, usableWidth, usableHeight, finalSize) : text
        };
    },
    _refreshNarrativePreview(textOverride = null) {
        const info = this.getNarrativeLayoutInfo(null, null, textOverride);
        const fontSummary = info.baseSize === info.finalSize ? `${info.baseSize}px` : `${info.baseSize}px → ${info.finalSize}px`;
        document.querySelectorAll('[data-narr-preview-height]').forEach(el => {
            el.textContent = `${info.height}px`;
        });
        document.querySelectorAll('[data-narr-preview-font]').forEach(el => {
            el.textContent = fontSummary;
        });
        document.querySelectorAll('[data-narr-preview-status]').forEach(el => {
            el.textContent = info.statusLabel;
            el.style.color = info.statusColor;
        });
    },
    _scheduleNarrativePreviewRefresh(textOverride = null) {
        clearTimeout(this._narrativePreviewTimeout);
        this._narrativePreviewTimeout = setTimeout(() => {
            this.applyNarrativeAutoFit(textOverride);
            this._refreshNarrativePreview(textOverride);
        }, 150);
    },
    applyNarrativeAutoFit(textOverride = null) {
        const p = Store.get('currentProject');
        const page = Store.getActivePage();
        if (!p || !page || !page.showTextBelow) return null;
        const contentEl = document.querySelector('.text-below-content');
        const info = this.getNarrativeLayoutInfo(page, p, textOverride);
        if (!contentEl) return info;
        const style = info.style;
        contentEl.setAttribute('placeholder', info.placeholder);
        contentEl.style.fontFamily = FontUtils.family(style.font || 'serif');
        contentEl.style.fontSize = `${info.finalSize}px`;
        contentEl.style.lineHeight = String(style.leading || 1.4);
        contentEl.style.textAlign = style.align || 'justify';
        contentEl.style.fontWeight = style.bold ? '700' : '400';
        contentEl.style.fontStyle = style.italic ? 'italic' : 'normal';
        contentEl.style.textDecoration = style.underline ? 'underline' : 'none';
        contentEl.style.color = style.textColor || style.color || '#ffffff';
        contentEl.style.display = info.truncated ? '-webkit-box' : 'block';
        contentEl.style.webkitBoxOrient = info.truncated ? 'vertical' : 'unset';
        contentEl.style.webkitLineClamp = info.truncated ? String(info.lineClamp || 1) : 'unset';
        contentEl.style.overflowY = info.status === 'warn' ? 'auto' : 'hidden';
        contentEl.dataset.narrStatus = info.status;
        if (info.minReached && info.settings.warnOnMin && info.text.trim()) {
            const warnKey = `${page.id}|${info.text.length}|${info.finalSize}|${info.requiredHeight}`;
            if (warnKey !== this._lastNarrativeMinWarnKey) {
                this._lastNarrativeMinWarnKey = warnKey;
                Toast.show(`Texto muito longo - fonte reduzida ao mínimo (${info.finalSize}px)`, 'warning', 2500);
            }
        } else {
            this._lastNarrativeMinWarnKey = null;
        }
        this._refreshNarrativePreview(textOverride);
        return info;
    },
    
    // ── Narrative Mode & Segments ──
    setNarrativeMode(mode) {
        const p = Store.get('currentProject');
        if (!p) return;
        p.narrativeMode = mode;
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
        Toast.show(`Modo narrativo: ${mode === 'per-page' ? 'Por Página' : mode === 'continuous-track' ? 'Track Contínuo' : 'Híbrido'}`, 'info');
    },
    setNarrativePosition(position) {
        const p = Store.get('currentProject');
        if (!p) return;
        p.narrativePosition = position;
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },
    addNarrativeSegment(startPage = null, endPage = null) {
        const p = Store.get('currentProject');
        if (!p) return;
        const pageCount = p.pages.length;
        const start = startPage ?? Store.get('activePageIndex') ?? 0;
        const end = endPage ?? Math.min(start + 2, pageCount - 1);
        
        const segment = NarrativeSegments.create(start, end);
        p.narrativeSegments = p.narrativeSegments || [];
        p.narrativeSegments.push(segment);
        NarrativeSegments.updatePageRefs(p);
        
        Store.set({ currentProject: p });
        Store.save();
        renderRightPanel();
        Toast.show(`Segmento criado: páginas ${start + 1}-${end + 1}`, 'success');
    },
    updateNarrativeSegment(segmentId, prop, value) {
        const p = Store.get('currentProject');
        if (!p || !p.narrativeSegments) return;
        const seg = p.narrativeSegments.find(s => s.id === segmentId);
        if (!seg) return;
        
        if (prop === 'text') {
            const lang = p.activeLanguage || 'pt-BR';
            seg.text = MultiLang.set(seg.text, lang, value);
        } else if (prop === 'pageRange') {
            seg.pageRange = value;
            NarrativeSegments.updatePageRefs(p);
        } else {
            seg[prop] = value;
        }
        
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
    },
    deleteNarrativeSegment(segmentId) {
        const p = Store.get('currentProject');
        if (!p || !p.narrativeSegments) return;
        p.narrativeSegments = p.narrativeSegments.filter(s => s.id !== segmentId);
        NarrativeSegments.updatePageRefs(p);
        Store.set({ currentProject: p });
        Store.save();
        renderRightPanel();
        Toast.show(t('toast.segmentRemoved'), 'info');
    },
    autoSplitNarrativeSegments(pagesPerSegment = 3) {
        const p = Store.get('currentProject');
        if (!p) return;
        if (!confirm(t('confirm.autoSplit', { count: pagesPerSegment }))) return;
        
        p.narrativeSegments = NarrativeSegments.autoSplit(p, pagesPerSegment);
        NarrativeSegments.updatePageRefs(p);
        Store.set({ currentProject: p });
        Store.save();
        renderRightPanel();
        Toast.show(`${p.narrativeSegments.length} segmentos criados`, 'success');
    },
    validateNarrativeGaps() {
        const p = Store.get('currentProject');
        if (!p) return [];
        
        const gaps = NarrativeSegments.findGaps(p);
        if (gaps.length > 0) {
            const gapStr = gaps.length <= 5 
                ? gaps.map(g => g + 1).join(', ')
                : `${gaps.slice(0, 5).map(g => g + 1).join(', ')}... (+${gaps.length - 5})`;
            Toast.show(`Warning: Pages without segment: ${gapStr}`, 'warning', 4000);
        } else {
            Toast.show(t('toast.allPagesHaveSegments'), 'success');
        }
        return gaps;
    },
    validateTranslations() {
        const p = Store.get('currentProject');
        if (!p) return [];
        
        const missing = MultiLang.validate(p);
        if (missing.length > 0) {
            const byLang = { 'pt-BR': 0, 'en': 0 };
            missing.forEach(m => byLang[m.lang]++);
            Toast.show(`Warning: Missing translations: PT-BR(${byLang['pt-BR']}) EN(${byLang['en']})`, 'warning', 4000);
        } else {
            Toast.show(t('toast.allTranslationsComplete'), 'success');
        }
        return missing;
    },
    
    // ── Dual Track (Bilingual) Controls ──
    setNarrativeDisplay(mode) {
        const p = Store.get('currentProject');
        if (!p) return;
        p.narrativeDisplay = mode; // 'single' | 'dual'
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
        const label = mode === 'dual' ? 'Dual Track (PT + EN)' : 'Idioma único';
        Toast.show(`Exibição: ${label}`, 'info');
    },
    setNarrativeOrder(order) {
        const p = Store.get('currentProject');
        if (!p) return;
        p.narrativeOrder = order; // 'pt-first' | 'en-first'
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },
    setNarrativeDualSpacing(px) {
        const p = Store.get('currentProject');
        if (!p) return;
        p.narrativeDualSpacing = Math.max(0, Math.min(24, parseInt(px, 10) || 4));
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
    },
    updateNarrativeLang(lang, text) {
        const p = Store.get('currentProject');
        const page = Store.getActivePage();
        if (!page || !p) return;
        if (typeof page.narrative === 'string') {
            page.narrative = { 'pt-BR': page.narrative, 'en': '' };
        }
        page.narrative = MultiLang.set(page.narrative, lang, text);
        Store.setSilent({ currentProject: p });
        this._scheduleNarrativePreviewRefresh(text);
        clearTimeout(this._narrativeSaveTimeout);
        this._narrativeSaveTimeout = setTimeout(() => {
            Store.save();
        }, 500);
    },
    // Bulk import translation: paste EN text to match existing PT pages (or vice versa)
    bulkImportTranslation(lang, bulkText) {
        const p = Store.get('currentProject');
        if (!p) return;
        const lines = bulkText.split(/\n\n+/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) { Toast.show(t('toast.noTextFound'), 'warning'); return; }
        const count = Math.min(lines.length, p.pages.length);
        Store.pushUndo();
        for (let i = 0; i < count; i++) {
            const page = p.pages[i];
            if (typeof page.narrative === 'string') {
                page.narrative = { 'pt-BR': page.narrative, 'en': '' };
            }
            page.narrative = MultiLang.set(page.narrative, lang, lines[i]);
        }
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
        Toast.show(`${count} páginas atualizadas com tradução ${lang}${lines.length > count ? ` (${lines.length - count} linhas ignoradas)` : ''}`, 'success');
    },
    showBulkTranslationModal(lang = 'en') {
        const p = Store.get('currentProject');
        if (!p) return;
        const targetLabel = lang === 'en' ? 'English' : 'PT-BR';
        const sourceLabel = lang === 'en' ? 'PT-BR' : 'English';
        const pageCount = p.pages.length;
        const html = `
            <div style="display:flex;flex-direction:column;gap:12px;max-width:480px;">
                <h3 style="margin:0;color:#e2e8f0;font-size:16px;">Importar tradução ${targetLabel}</h3>
                <p style="margin:0;color:#94a3b8;font-size:12px;">Cole o texto traduzido abaixo. Separe cada página com uma linha em branco.<br>
                Páginas no projeto: <strong>${pageCount}</strong> (com texto ${sourceLabel})</p>
                <textarea id="bulk-translation-input" rows="12" placeholder="Página 1 tradução...\n\nPágina 2 tradução...\n\nPágina 3 tradução..." 
                    style="width:100%;padding:12px;border-radius:6px;border:1px solid #4a5568;background:#1a1a2e;color:#e2e8f0;font-size:13px;font-family:inherit;resize:vertical;"></textarea>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button onclick="this.closest('.modal-overlay')?.remove()" style="padding:8px 16px;border-radius:6px;border:1px solid #4a5568;background:transparent;color:#a0aec0;cursor:pointer;">Cancelar</button>
                    <button onclick="App.bulkImportTranslation('${lang}', document.getElementById('bulk-translation-input').value); this.closest('.modal-overlay')?.remove()" 
                        style="padding:8px 16px;border-radius:6px;border:none;background:#3182ce;color:#fff;font-weight:600;cursor:pointer;">Importar ${targetLabel}</button>
                </div>
            </div>`;
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        const content = document.createElement('div');
        content.style.cssText = 'background:#1e1e2e;border-radius:12px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid #333;';
        content.innerHTML = html;
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('bulk-translation-input')?.focus(), 100);
    },

    setNarrativeHeight(h) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        const settings = this._ensureNarrativeSettings(p);
        const maxH = Math.round(getProjectDims().contentH * 0.4);
        const nextHeight = Math.max(0, Math.min(parseInt(h, 10) || 0, maxH));
        if (settings.heightLocked) {
            p.pages.forEach(pg => {
                pg.narrativeHeight = nextHeight;
                pg.showTextBelow = nextHeight > 0;
            });
        } else {
            page.narrativeHeight = nextHeight;
            if (page.narrativeHeight <= 0) { page.showTextBelow = false; page.narrativeHeight = 0; }
            if (page.narrativeHeight > 0) page.showTextBelow = true;
        }
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    startNarrativeDrag(e) {
        e.preventDefault(); e.stopPropagation();
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        if (this._ensureNarrativeSettings(p).heightLocked) {
            Toast.show(t('toast.heightLocked'), 'info');
            return;
        }
        const zoom = Store.get('zoom') || 1;
        const startY = e.clientY;
        const startH = page.narrativeHeight || 120;
        const pageH = getProjectDims().contentH;
        const maxH = Math.round(pageH * 0.4);
        const SNAP_POINTS = [0, 60, 90, 120, 160, 200, 280];
        
        Store.pushUndo();
        document.body.style.cursor = 'ns-resize';
        
        // Tooltip
        let tooltip = document.getElementById('narr-tooltip');
        if (!tooltip) { 
            tooltip = document.createElement('div'); 
            tooltip.id = 'narr-tooltip'; 
            tooltip.style.cssText = 'position:fixed;z-index:9999;background:#000;color:#0ff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.5);border:1px solid rgba(78,205,196,0.3);'; 
            document.body.appendChild(tooltip); 
        }
        tooltip.textContent = `${startH}px`;
        
        const move = (ev) => {
            // deltaY positivo = arrastar para BAIXO = AUMENTAR narrativa
            // deltaY negativo = arrastar para CIMA = DIMINUIR narrativa
            const deltaY = (ev.clientY - startY) / zoom;
            let newH = Math.round(startH + deltaY);
            
            // Limites
            newH = Math.max(0, Math.min(newH, maxH));
            
            // Snap a pontos próximos (± 12px)
            const snap = SNAP_POINTS.find(s => Math.abs(newH - s) < 12);
            if (snap !== undefined) newH = snap;
            
            // Se chegou a 0, desativa narrativa
            if (newH === 0) {
                page.showTextBelow = false;
            } else if (!page.showTextBelow) {
                page.showTextBelow = true;
            }
            
            page.narrativeHeight = newH;
            
            // Tooltip
            tooltip.textContent = newH === 0 ? 'Desativado' : `${newH}px`;
            tooltip.style.left = (ev.clientX + 16) + 'px';
            tooltip.style.top = (ev.clientY - 30) + 'px';
            tooltip.style.display = 'block';
            
            Store.set({ currentProject: p });
            renderCanvas();
        };
        
        const up = () => {
            document.body.style.cursor = '';
            const tt = document.getElementById('narr-tooltip');
            if (tt) tt.remove();
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            Store.save(); 
            renderCanvas();
            renderRightPanel();
        };
        
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    },
    applyNarrativeToAll() {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        const h = page.narrativeHeight || 120;
        const style = page.narrativeStyle ? JSON.parse(JSON.stringify(page.narrativeStyle)) : { align: 'justify', font: 'serif', size: 48, leading: 1.4 };
        const show = !!page.showTextBelow;
        this._ensureNarrativeSettings(p);
        
        if (!confirm(t('confirm.applyNarrativeSettings', { height: h, pages: p.pages.length }))) return;
        
        Store.pushUndo();
        p.pages.forEach(pg => { 
            pg.narrativeHeight = h; 
            pg.showTextBelow = show;
            pg.narrativeStyle = JSON.parse(JSON.stringify(style));
        });
        
        Store.set({ currentProject: p }); Store.save();
        Toast.show(`Configurações de narrativa aplicadas a ${p.pages.length} páginas`, 'success');
        renderCanvas(); renderRightPanel();
    },
    setNarrativeLock(type, locked = null) {
        const p = Store.get('currentProject');
        if (!p) return;
        const settings = this._ensureNarrativeSettings(p);
        const page = Store.getActivePage();
        
        if (type === 'height') {
            const nextLocked = locked == null ? !settings.heightLocked : !!locked;
            settings.heightLocked = nextLocked;
            if (nextLocked && page) {
                const h = page.narrativeHeight || 120;
                p.pages.forEach(pg => { pg.narrativeHeight = h; pg.showTextBelow = h > 0; });
                Toast.show(`Altura travada em ${h}px`, 'success');
            } else {
                Toast.show(t('toast.heightUnlocked'), 'info');
            }
        } else if (type === 'fontSize') {
            const nextLocked = locked == null ? !settings.fontSizeLocked : !!locked;
            settings.fontSizeLocked = nextLocked;
            if (nextLocked && page) {
                const size = page.narrativeStyle?.size || 48;
                p.pages.forEach(pg => {
                    if (!pg.narrativeStyle) pg.narrativeStyle = { align: 'justify', font: 'serif', size: 48, leading: 1.4 };
                    pg.narrativeStyle.size = size;
                });
                Toast.show(`Fonte travada em ${size}px`, 'success');
            } else {
                Toast.show(t('toast.fontUnlocked'), 'info');
            }
        }
        
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    toggleNarrativeLock(type) {
        this.setNarrativeLock(type);
    },
    setNarrativeAutoFit(overflowMode) {
        const p = Store.get('currentProject');
        if (!p) return;
        const settings = this._ensureNarrativeSettings(p);
        settings.overflow = overflowMode;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    setNarrativeMinFont(minSize) {
        const p = Store.get('currentProject');
        if (!p) return;
        const settings = this._ensureNarrativeSettings(p);
        settings.minFontSize = Math.max(8, Math.min(100, parseInt(minSize, 10) || 12));
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    setNarrativeWarnOnMin(warn) {
        const p = Store.get('currentProject');
        if (!p) return;
        const settings = this._ensureNarrativeSettings(p);
        settings.warnOnMin = !!warn;
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    setNarrativeStyle(prop, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        const settings = this._ensureNarrativeSettings(p);
        if (!page.narrativeStyle) page.narrativeStyle = { align: 'justify', font: 'serif', size: 48, color: '#ffffff', textColor: '#ffffff', leading: 1.4, strokeEnabled: false, strokeColor: '#000000', strokeWidth: 3 };
        let nextValue = value;
        if (prop === 'size') nextValue = Math.max(12, Math.min(250, parseInt(value, 10) || 48));
        if (prop === 'leading') nextValue = Math.max(0.8, Math.min(3, parseFloat(value) || 1.4));
        page.narrativeStyle[prop] = nextValue;
        
        if (settings.fontSizeLocked && prop === 'size') {
            p.pages.forEach(pg => {
                if (!pg.narrativeStyle) pg.narrativeStyle = { align: 'justify', font: 'serif', size: 48, leading: 1.4 };
                pg.narrativeStyle.size = nextValue;
            });
        }
        
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    applyNarrativePreset(preset) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        if (!page.narrativeStyle) page.narrativeStyle = {};
        
        if (preset === 'classic') {
            // Estilo Clássico: amarelo com contorno preto, sem fundo
            Object.assign(page.narrativeStyle, {
                color: '#FFD700',
                strokeEnabled: true,
                strokeColor: '#000000',
                strokeWidth: 3,
                bgOpacity: 0,
                bold: true
            });
            Toast.show('Estilo Clássico aplicado', 'success');
        }
        
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },
    toggleTimeline() {
        const tl = document.getElementById('timeline-bar');
        if (tl) {
            Store.setSilent({ timelineCollapsed: !Store.get('timelineCollapsed') });
            tl.classList.toggle('collapsed', Store.get('timelineCollapsed'));
        } else {
            Store.set({ timelineCollapsed: !Store.get('timelineCollapsed') });
        }
    },
    toggleSidebarSection(section) {
        const collapsed = Store.get('sidebarCollapsed') || {};
        // Advanced sections start collapsed by default to reduce first-load noise
        const defaultCollapsedSections = new Set(['stickers', 'leftMateria', 'visualEffects', 'layers', 'audio', 'shortcuts']);
        const defaultState = defaultCollapsedSections.has(section);
        const current = collapsed[section] !== undefined ? collapsed[section] : defaultState;
        collapsed[section] = !current;
        Store.set({ sidebarCollapsed: collapsed });
        renderRightPanel();
    },
    toggleNarrSection(section) {
        // Accordion toggle for narrative controls subsections
        const narrAccordion = Store.get('narrAccordion') || { basicText: true, advancedLayout: false, position: true, bilingual: false };
        narrAccordion[section] = !narrAccordion[section];
        Store.set({ narrAccordion });
        // Save to localStorage for persistence
        try { localStorage.setItem('hqm_narr_accordion', JSON.stringify(narrAccordion)); } catch(e) {}
        renderRightPanel();
    },
    restoreNarrAccordion() {
        // Restore accordion states from localStorage on app init
        try {
            const saved = localStorage.getItem('hqm_narr_accordion');
            if (saved) {
                const states = JSON.parse(saved);
                Store.set({ narrAccordion: { basicText: true, advancedLayout: false, position: true, bilingual: false, ...states } });
            }
        } catch(e) {}
    },
    toggleVariations(collapse) {
        const collapsed = Store.get('sidebarCollapsed') || {};
        const isExpanded = collapsed.variationsExpanded === true;
        const shouldExpand = (collapse !== undefined) ? !collapse : !isExpanded;
        collapsed.variationsExpanded = shouldExpand;
        Store._s.sidebarCollapsed = collapsed;
        this._refreshLeftPanel();
    },
    addSfxToPage() {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        
        // Matéria context guard
        const isMateria = page?.type === 'materia' || page?.isMateria === true;
        if (isMateria) {
            Toast.show(t('toast.sfxNotForMateria'), 3500);
            return;
        }
        
        if (!page.texts) page.texts = [];
        if (page.texts.length >= 30) {
            Toast.show(t('toast.maxBalloonsReached'), 2500);
            return;
        }
        
        Store.pushUndo();
        const sfx = { 
            type: 'sfx', 
            x: 150 + Math.random() * 100, 
            y: 150 + Math.random() * 100, 
            w: 160, h: 80, 
            text: 'BOOM!', 
            direction: 'center', 
            font: 'comic',
            fontSize: 42,
            sfxPreset: 'boom',
            manualSize: false
        };
        this._recalcBalloonSize(sfx);
        page.texts.push(sfx);
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: page.texts.length - 1 } }); 
        Store.save();
        Toast.show(t('toast.sfxAdded'));
        renderCanvas();
        renderRightPanel();
    },
    applySfxPreset(index, presetId) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !page.texts[index]) return;
        const b = page.texts[index];
        if (b.type !== 'sfx') return;
        const preset = (window.SFX_PRESETS || {})[presetId];
        if (!preset) return;
        Store.pushUndo();
        b.sfxPreset = presetId;
        b.font = preset.font || b.font || 'comic';
        b.fontSize = preset.fontSize || b.fontSize || 42;
        b.textColor = preset.color || b.textColor || '#ff6600';
        b.sfxStroke = preset.stroke || '#000000';
        b.sfxStrokeWidth = preset.strokeWidth ?? 3;
        b.sfxRotate = preset.rotate ?? 0;
        b.sfxSkewX = preset.skewX ?? 0;
        b.sfxLetterSpacing = preset.letterSpacing ?? 2;
        b.sfxShadow = preset.shadow || '3px 3px 0 #000';
        b.manualSize = false;
        this._recalcBalloonSize(b);
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },

    // ── Panels ──
    toggleLeft() { Store.set({ leftPanelOpen: !Store.get('leftPanelOpen') }); },
    toggleRight() { Store.set({ rightPanelOpen: !Store.get('rightPanelOpen') }); },
    
    // ── Mobile Sidebar Toggle ──
    isMobile() { return window.innerWidth <= 768; },
    
    _openMobileSidebar() {
        const sidebar = document.querySelector('.right-panel');
        const backdrop = document.querySelector('.mobile-backdrop');
        if (!sidebar || !backdrop) return;
        sidebar.classList.add('mobile-open');
        backdrop.classList.add('visible');
    },
    
    scrollMobileDrawerTo(targetId) {
        if (!targetId) return;
        const content = document.getElementById('right-panel-content');
        if (!content) return;
        content.scrollTop = 0;
        const target = content.querySelector('#' + targetId);
        if (target && typeof target.scrollIntoView === 'function') {
            requestAnimationFrame(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    },
    
    openMobileWorkflow(step) {
        if (!this.isMobile()) return;
        const page = Store.getActivePage();
        const selectedEl = Store.get('selectedElement');
        
        if (step === 'preview') {
            this.closeMobileSidebar();
            this.toggleFullscreenPreview();
            return;
        }
        if (step === 'export') {
            this.closeMobileSidebar();
            this.openExportPage();
            return;
        }
        
        let drawerContent = 'properties';
        let anchorId = '';
        
        if (step === 'media') {
            drawerContent = 'tools';
            anchorId = 'mobile-anchor-pages';
        } else if (step === 'text') {
            const hasSelectedBalloon = selectedEl && selectedEl.type === 'balloon';
            if (hasSelectedBalloon || page?.showTextBelow) {
                drawerContent = 'properties';
                anchorId = hasSelectedBalloon ? 'mobile-anchor-selected-text' : 'mobile-anchor-narrative';
            } else {
                drawerContent = 'tools';
                anchorId = 'mobile-anchor-texttools';
            }
        } else if (step === 'timing') {
            drawerContent = 'properties';
            anchorId = 'mobile-anchor-duration';
        }
        
        Store.set({ mobileWorkflowStep: step, mobileDrawerContent: drawerContent });
        requestAnimationFrame(() => {
            this._openMobileSidebar();
            requestAnimationFrame(() => this.scrollMobileDrawerTo(anchorId));
        });
    },
    
    toggleMobileSidebar() {
        const sidebar = document.querySelector('.right-panel');
        const backdrop = document.querySelector('.mobile-backdrop');
        if (!sidebar || !backdrop) return;
        
        const isOpen = sidebar.classList.contains('mobile-open');
        if (isOpen) {
            sidebar.classList.remove('mobile-open');
            backdrop.classList.remove('visible');
        } else {
            sidebar.classList.add('mobile-open');
            backdrop.classList.add('visible');
        }
    },
    
    closeMobileSidebar() {
        const sidebar = document.querySelector('.right-panel');
        const backdrop = document.querySelector('.mobile-backdrop');
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (backdrop) backdrop.classList.remove('visible');
    },
    
    // ── Click outside to deselect ──
    handleCanvasAreaClick(e) {
        // Only deselect if clicking directly on canvas-area or canvas-scroll (not on panels/balloons/etc)
        const target = e.target;
        const isCanvasArea = target.id === 'canvas-area' || target.id === 'canvas-scroll';
        const isBentoFrame = target.classList.contains('bento-frame') || target.id === 'canvas-page';
        if (isCanvasArea || isBentoFrame) {
            const hasSelection = Store.get('selectedSlot') >= 0 || Store.get('selectedElement');
            if (hasSelection) {
                this.deselectAll();
            }
        }
    },

    // ── Page Context Menu ──
    showPageContextMenu(e, i) {
        const p = Store.get('currentProject'); if (!p) return;
        const x = e.clientX, y = e.clientY;
        const items = [
            { label: 'Duplicar página', icon: Icons.copy, action: `App.duplicatePage(${i})` },
        ];
        if (i > 0) items.push({ label: 'Mover p/ cima', icon: Icons.zoomIn, action: `App.movePage(${i},-1)` });
        if (i < p.pages.length - 1) items.push({ label: 'Mover p/ baixo', icon: Icons.zoomOut, action: `App.movePage(${i},1)` });
        if (p.pages.length > 1) {
            items.push({ separator: true });
            items.push({ label: 'Excluir página', icon: Icons.trash, action: `App.deletePage(${i})`, danger: true });
        }
        renderContextMenu(x, y, items);
    },
    movePage(i, dir) {
        const p = Store.get('currentProject'); if (!p) return;
        const ni = i + dir;
        if (ni < 0 || ni >= p.pages.length) return;
        Store.pushUndo();
        [p.pages[i], p.pages[ni]] = [p.pages[ni], p.pages[i]];
        Store.set({ currentProject: p, activePageIndex: ni }); Store.save();
        if (typeof renderPageCarousel === 'function') renderPageCarousel();
        Toast.show(`Página movida`);
    },

    // ── Context Menu ──
    showContextMenu(e, type, id) {
        const x = e.clientX, y = e.clientY;
        
        // Empty panel context menu
        if (type === 'empty-panel') {
            const slot = id;
            App.selectSlot(slot);
            renderContextMenu(x, y, [
                { label: '📁 Upload imagem', icon: Icons.upload, action: `App.triggerImageUpload(${slot})` },
                { label: '📋 Colar imagem (Ctrl+V)', icon: Icons.upload, action: `App._pasteToSlot(${slot})` },
                { label: '🔗 Inserir URL', action: `App.promptImageUrl()` },
                { separator: true },
                { label: '💬 Adicionar balão', action: `App.addBalloonToPanel(${slot},'speech')` },
                { label: '💭 Adicionar pensamento', action: `App.addBalloonToPanel(${slot},'thought')` },
                { label: 'Adicionar narração', action: `App.addBalloonToPanel(${slot},'narration')` },
            ]);
            return;
        }
        
        if (type === 'image') {
            const slot = id;
            App.selectSlot(slot);
            renderContextMenu(x, y, [
                { label: 'Editar imagem', action: `App.enterCropMode(${slot})` },
                { label: '⊞ Encaixar imagem', icon: Icons.zoomFit, action: `App.fitImageToPanel(${slot})` },
                { label: '⊕ Centralizar', icon: Icons.zoomFit, action: `App.centerImage(${slot})` },
                { label: '↺ Resetar posição', icon: Icons.zoomFit, action: `App.resetImageTransform(${slot})` },
                { separator: true },
                { label: '↔ Espelhar Horizontal', icon: Icons.flipH, action: `App.flipImage(${slot},'flipH')` },
                { label: '↕ Espelhar Vertical', icon: Icons.flipV, action: `App.flipImage(${slot},'flipV')` },
                { label: '⊡ Alternar Ajuste (Inteira/Preencher)', action: `App.toggleImageFit(${slot})` },
                { separator: true },
                { label: '🔄 Substituir imagem', icon: Icons.upload, action: `App.triggerImageUpload(${slot})` },
                { label: '📋 Colar imagem aqui', icon: Icons.upload, action: `App._pasteToSlot(${slot})` },
                { separator: true },
                { label: '💬 Adicionar balão', action: `App.addBalloonToPanel(${slot},'speech')` },
                { label: 'Recordatório (topo)', action: `App.addRecordatorio(${slot},'top')` },
                { label: 'Recordatório (base)', action: `App.addRecordatorio(${slot},'bottom')` },
                { separator: true },
                { label: '🗑 Remover imagem', icon: Icons.trash, action: `App.removeImage(${slot})`, danger: true },
            ]);
        } else if (type === 'text') {
            App.selectElement('text', id);
            const types = [
                { label: 'Fala', action: `App.changeTextType('${id}','speech')` },
                { label: 'Pensamento', action: `App.changeTextType('${id}','thought')` },
                { label: 'Grito', action: `App.changeTextType('${id}','shout')` },
                { label: 'Narração', action: `App.changeTextType('${id}','narration')` },
            ];
            renderContextMenu(x, y, [
                ...types,
                { separator: true },
                { label: 'Duplicar', icon: Icons.copy, action: `App.duplicateTextById('${id}')` },
                { label: 'Remover', icon: Icons.trash, action: `App.deleteText('${id}')`, danger: true },
            ]);
        } else if (type === 'sticker') {
            const index = id;
            renderContextMenu(x, y, [
                { label: 'Duplicar sticker', icon: Icons.copy, action: `App.addStickerImage(Store.getActivePage().stickers[${index}].src)` },
                { separator: true },
                { label: 'Remover', icon: Icons.trash, action: `App.deleteSticker(${index})`, danger: true },
            ]);
        } else if (type === 'balloon') {
            const index = id;
            const page = Store.getActivePage();
            const balloon = page?.texts?.[index];
            if (!balloon) return;
            const bType = balloon.type;
            const currentDir = balloon.direction || 's';
            const dirLabels = { n:'↑', s:'↓', e:'→', w:'←', ne:'↗', nw:'↖', se:'↘', sw:'↙', center:'●', none:'⊘' };
            
            // Context menu tipo-aware
            const menuItems = [
                { label: 'Editar texto', icon: Icons.text, action: `App.editBalloon(${index})` },
                { separator: true },
            ];
            
            // Direção da cauda — apenas para speech, thought, whisper (não para narration, sfx, shout)
            if (!['narration', 'sfx', 'shout'].includes(bType)) {
                menuItems.push(
                    { label: `Direção da cauda (${dirLabels[currentDir] || '?'})`, submenu: [
                        { label: '↖ Noroeste', action: `App.changeBalloonDirection(${index},'nw')` },
                        { label: '↑ Norte', action: `App.changeBalloonDirection(${index},'n')` },
                        { label: '↗ Nordeste', action: `App.changeBalloonDirection(${index},'ne')` },
                        { label: '← Oeste', action: `App.changeBalloonDirection(${index},'w')` },
                        { label: '● Centro', action: `App.changeBalloonDirection(${index},'center')` },
                        { label: '→ Leste', action: `App.changeBalloonDirection(${index},'e')` },
                        { label: '↙ Sudoeste', action: `App.changeBalloonDirection(${index},'sw')` },
                        { label: '↓ Sul', action: `App.changeBalloonDirection(${index},'s')` },
                        { label: '↘ Sudeste', action: `App.changeBalloonDirection(${index},'se')` },
                    ]},
                    { separator: true }
                );
            }
            
            // Posição — apenas para narration
            if (bType === 'narration') {
                const posMode = balloon.positionMode || 'free';
                menuItems.push(
                    { label: `Posição: ${posMode === 'free' ? 'Livre' : posMode === 'top' ? 'Topo' : 'Base'}`, submenu: [
                        { label: '⬜ Livre', action: `App.setBalloonPositionMode('free')` },
                        { label: '↑ Topo (full-width)', action: `App.setBalloonPositionMode('top')` },
                        { label: '↓ Base (full-width)', action: `App.setBalloonPositionMode('bottom')` },
                    ]},
                    { separator: true }
                );
            }
            
            // Tipo
            menuItems.push(
                { label: 'Tipo: Fala', action: `App.changeBalloonType(${index},'speech')` },
                { label: 'Tipo: Pensamento', action: `App.changeBalloonType(${index},'thought')` },
                { label: 'Tipo: Grito', action: `App.changeBalloonType(${index},'shout')` },
                { label: 'Tipo: Sussurro', action: `App.changeBalloonType(${index},'whisper')` },
                { label: 'Tipo: Narração', action: `App.changeBalloonType(${index},'narration')` },
                { label: 'Tipo: SFX', action: `App.changeBalloonType(${index},'sfx')` },
                { separator: true },
                { label: 'Duplicar', icon: Icons.copy, action: `App.duplicateBalloon(${index})` },
                { label: `${balloon.locked ? 'Destravar' : 'Travar'}`, action: `App.toggleBalloonLock(${index})` },
                { separator: true },
                { label: 'Remover', icon: Icons.trash, action: `App.deleteBalloon(${index})`, danger: true }
            );
            
            renderContextMenu(x, y, menuItems);
        }
    },
    duplicateTextById(id) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        const txt = page.texts.find(t => t.id === id);
        if (!txt) return;
        Store.pushUndo();
        const clone = JSON.parse(JSON.stringify(txt));
        clone.id = genId();
        if (clone.position) {
            clone.position = { x: txt.position.x + 20, y: txt.position.y + 20 };
        } else {
            clone.x = (clone.x || 100) + 20;
            clone.y = (clone.y || 100) + 20;
        }
        page.texts.push(clone);
        Store.set({ currentProject: p, selectedElement: { type: 'text', id: clone.id } }); Store.save();
        Toast.show(t('toast.balloonDuplicated'));
    },
    // Paste from clipboard to selected slot or next empty
    pasteFromClipboard() {
        const selectedSlot = Store.get('selectedSlot');
        if (selectedSlot >= 0) {
            this._pasteToSlot(selectedSlot);
        } else {
            // Trigger paste event programmatically - user must have copied something
            Toast.show('Use Ctrl+V para colar imagem', 'info');
        }
    },
    
    _pasteToSlot(slot) {
        // Read clipboard and paste into specific slot
        if (navigator.clipboard && navigator.clipboard.read) {
            navigator.clipboard.read().then(items => {
                for (const item of items) {
                    const imgType = item.types.find(t => t.startsWith('image/'));
                    if (imgType) {
                        item.getType(imgType).then(blob => {
                            const r = new FileReader();
                            r.onload = () => this._replaceImageInSlot(slot, r.result);
                            r.readAsDataURL(blob);
                        });
                        return;
                    }
                }
                Toast.show('Nada para colar', 'error');
            }).catch(() => Toast.show('Sem permissão de clipboard', 'error'));
        }
    },
    _replaceImageInSlot(slot, src) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndo();
        const pageIdx = Store.get('activePageIndex');
        // Save old image to library before replacing
        if (page.images[slot] && page.images[slot].src) {
            if (!Library.findBySrc(p, page.images[slot].src)) {
                Library.add(p, page.images[slot].src, 'replaced', pageIdx);
            }
        }
        if (page.images[slot]) {
            page.images[slot].src = src;
            page.images[slot].transform = { scale: 1, x: 0, y: 0 };
        } else {
            while (page.images.length <= slot) page.images.push(null);
            page.images[slot] = { id: genId(), src, filters: { brightness: 100, contrast: 100 } };
        }
        // Add new image to library too
        if (!Library.findBySrc(p, src)) Library.add(p, src, 'upload', pageIdx);
        Store.set({ currentProject: p }); Store.save();
        renderCanvas(); renderRightPanel();
    },

    // ── Drag Counter (prevents flicker on child elements) ──
    _panelDragEnter(el) {
        const c = (parseInt(el.dataset.dragCount) || 0) + 1;
        el.dataset.dragCount = c;
        el.classList.add('drop-active');
    },
    _panelDragLeave(el) {
        const c = (parseInt(el.dataset.dragCount) || 1) - 1;
        el.dataset.dragCount = c;
        if (c <= 0) {
            el.dataset.dragCount = 0;
            el.classList.remove('drop-active');
        }
    },
    _panelDragDrop(el) {
        el.dataset.dragCount = 0;
        el.classList.remove('drop-active');
    },

    // ── Drop ──
    handleDrop(e) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length) { files.forEach(f => { if (!f.type.startsWith('image/')) return; const r = new FileReader(); r.onload = () => this._addImage(r.result); r.readAsDataURL(f); }); return; }
        const url = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain') || '';
        if (url && typeof url === 'string' && url.length > 5) this._addImage(url);
    },
    handleSlotDrop(e, slot) {
        e.preventDefault(); e.stopPropagation();
        
        // Check if it's a library image drop (from drag)
        const data = e.dataTransfer?.getData('text/plain') || '';
        if (data.startsWith('libimg:')) {
            const src = data.substring(7); // Remove 'libimg:' prefix
            this._replaceImageInSlot(slot, src);
            Toast.show(`Imagem inserida no quadro ${slot + 1}`);
            return;
        }
        
        // Handle file drops
        const files = Array.from(e.dataTransfer?.files || []);
        if (!files.length) {
            // Check for URL drops
            const url = e.dataTransfer?.getData('text/uri-list') || '';
            if (url && typeof url === 'string' && url.length > 5) {
                this._replaceImageInSlot(slot, url);
                Toast.show(`Imagem da URL inserida no quadro ${slot + 1}`);
            }
            return;
        }
        
        const f = files[0]; 
        if (!f.type.startsWith('image/')) {
            Toast.show('Apenas imagens são aceitas (JPG, PNG, GIF, WebP)', 'error');
            return;
        }
        if (f.size > 50 * 1024 * 1024) {
            Toast.show('Imagem excede limite seguro do navegador (50MB)', 'warning');
            return;
        }
        const r = new FileReader(); 
        r.onload = () => {
            if (f.size > 2 * 1024 * 1024) {
                // Large image dropped, resize it first
                this._resizeImageIfNeeded(r.result, (resized) => {
                    this._replaceImageInSlot(slot, resized);
                    Toast.show(`Imagem inserida no quadro ${slot + 1}`);
                });
            } else {
                this._replaceImageInSlot(slot, r.result);
                Toast.show(`Imagem inserida no quadro ${slot + 1}`);
            }
        }; 
        r.readAsDataURL(f);
    },

    // ── Colors ──
    setDefaultColor(k, v) { const p = Store.get('currentProject'); if (!p) return; p.settings.colorPalette[k] = v; Store.set({ currentProject: p }); Store.save(); },

    // ── Undo/Redo ──
    undo() { Store.undo(); },
    redo() { Store.redo(); },

    // ── Clipboard for balloons ──
    _clipboardBalloon: null,
    
    copyBalloon() {
        const sel = Store.get('selectedElement');
        const page = Store.getActivePage();
        if (!sel || sel.type !== 'balloon' || !page || !page.texts[sel.index]) return;
        this._clipboardBalloon = JSON.parse(JSON.stringify(page.texts[sel.index]));
        Toast.show('Balão copiado');
    },
    
    pasteBalloon() {
        if (!this._clipboardBalloon) return;
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndo();
        const newBalloon = JSON.parse(JSON.stringify(this._clipboardBalloon));
        newBalloon.x += 20;
        newBalloon.y += 20;
        if (!page.texts) page.texts = [];
        page.texts.push(newBalloon);
        Store.set({ currentProject: p, selectedElement: { type: 'balloon', index: page.texts.length - 1 } });
        Store.save();
        Toast.show('Balão colado');
    },

    // ── Key Bindings ──
    // Helper: checks DOM state to determine if user is editing text
    _isEditingText(event) {
        // Check 1: Target is editable
        if (event.target.matches && event.target.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]), textarea, [contenteditable="true"]')) {
            return true;
        }
        // Check 2: activeElement is editable
        const active = document.activeElement;
        if (active) {
            const tag = active.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
            if (active.contentEditable === 'true' || active.isContentEditable === true) return true;
        }
        // Check 3: Parent chain has editable ancestor
        if (event.target.closest && event.target.closest('[contenteditable="true"]')) return true;
        // Check 4: DOM query fallback
        const focused = document.querySelector('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):focus, textarea:focus, [contenteditable="true"]:focus');
        return focused !== null;
    },
    _bindKeys() {
        // CAPTURE PHASE: intercepts events BEFORE they reach target elements
        document.addEventListener('keydown', e => {
            if (Store.get('view') !== 'editor') return;
            
            // GUARD: If user is editing text, DO NOT process ANY shortcuts
            if (this._isEditingText(e)) return;
            
            // ── Ctrl/Cmd shortcuts (safe — require modifier key) ──
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') { e.preventDefault(); Store.save(); Toast.show('Projeto salvo', 'success'); }
                if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
                if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); this.redo(); }
                if (e.key === 'c') { const sel = Store.get('selectedElement'); if (sel && sel.type === 'balloon') { e.preventDefault(); this.copyBalloon(); } }
                if (e.key === 'v') { /* paste handled elsewhere */ }
                if (e.key === 'd') { e.preventDefault(); const idx = Store.get('activePageIndex'); this.duplicatePage(idx); }
                if (e.key === '/') { e.preventDefault(); this.showShortcutsHelp(); }
                if (e.key === 't' || e.key === 'T') { e.preventDefault(); this.toggleActiveLanguage(); } // Toggle language PT↔EN
                return;
            }
            
            // ── Non-character shortcuts (safe — not letters) ──
            if (e.key === 'Delete' || e.key === 'Backspace') { 
                const s = Store.get('selectedElement'), sl = Store.get('selectedSlot'); 
                if (s && s.type === 'balloon') { e.preventDefault(); this.closeBalloonTooltip(); this.deleteBalloon(s.index); }
                else if (s && s.type === 'sticker') { e.preventDefault(); this.closeStickerTooltip(); this.deleteSticker(s.index); }
                else if (s && s.type === 'text') { e.preventDefault(); this.deleteText(s.id); } 
                else if (sl >= 0) { e.preventDefault(); this.removeImage(sl); } 
            }
            if (e.key === 'Escape') { 
                if (this._placementMode) { this.cancelPlacement(); return; }
                if (this._cropMode.active) { this.exitCropMode(); return; }
                if (this._replaceTargetMode) { this._exitReplaceTargetMode(); return; } 
                if (Store.get('coverActive') || Store.get('backCoverActive')) { this.setActivePage(0); return; } 
                // Clear any stuck drag-over states (canvas verde fix)
                document.querySelectorAll('.drop-active').forEach(el => {
                    el.classList.remove('drop-active');
                    el.dataset.dragCount = 0;
                });
                this.closeBalloonTooltip(); this.closeStickerTooltip(); this.deselectAll(); this.closeModal(); 
            }
            if (e.key === 'ArrowLeft') { e.preventDefault(); const i = Store.get('activePageIndex'); if (i > 0) this.setActivePage(i - 1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); const p = Store.get('currentProject'), i = Store.get('activePageIndex'); if (p && i < p.pages.length - 1) this.setActivePage(i + 1); }
            
            // Space = Play/Pause Preview (replaced Pan)
            if (e.code === 'Space' && !e.repeat) { 
                e.preventDefault(); 
                this.playPreviewInCanvas(); 
            }
            
            // ── Single-key shortcuts REMOVED: t, f, h, ?, +, -, 0 ──
            // These caused critical conflicts with text input.
            // Actions are accessible via toolbar buttons and Ctrl+ combos.
        }, { capture: true });
        
        // Space key release listener removed (Space is now Play/Pause)
    },

    // ── Global Text Input Guard (Layer 1 defense-in-depth) ──
    // Catches keydown on ALL text inputs/textareas/contenteditable via delegation
    // Prevents shortcut handlers from ever seeing these events
    _bindTextInputGuard() {
        document.addEventListener('keydown', e => {
            const t = e.target;
            if (!t) return;
            const tag = t.tagName;
            // Text inputs (exclude checkbox, radio, range, color)
            if (tag === 'INPUT') {
                const type = (t.getAttribute('type') || 'text').toLowerCase();
                if (type !== 'checkbox' && type !== 'radio' && type !== 'range' && type !== 'color') {
                    e.stopImmediatePropagation();
                    return;
                }
            }
            // Textareas
            if (tag === 'TEXTAREA') {
                e.stopImmediatePropagation();
                return;
            }
            // Contenteditable elements or children of contenteditable
            if (t.isContentEditable || (t.closest && t.closest('[contenteditable="true"]'))) {
                e.stopImmediatePropagation();
                return;
            }
        }, { capture: true }); // Must be capture to run before _bindKeys handler
    },

    // ── Paste System (complete rewrite per directive) ──
    _pasteQueue: [],
    _pasteProcessing: false,
    _pasteTargetIndex: 0, // Avança automaticamente entre painéis

    resetPasteIndex() {
        this._pasteTargetIndex = 0;
    },

    getNextEmptyPanelIndex(page, panelCount) {
        // Começa pelo _pasteTargetIndex para não repetir
        for (let i = this._pasteTargetIndex; i < panelCount; i++) {
            const img = page.images?.[i];
            if (!img || !img.src) {
                this._pasteTargetIndex = i + 1; // próxima vez começa do índice seguinte
                return i;
            }
        }
        // Todos os painéis cheios
        return -1;
    },

    _bindPaste() {
        document.addEventListener('paste', e => {
            if (Store.get('view') !== 'editor') return;

            // Situation 10: If focus is on input/textarea/contenteditable, let default behavior
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.contentEditable === 'true') {
                return; // default paste in text fields
            }

            const items = Array.from(e.clipboardData?.items || []);
            
            // Situation 7/8: No items or no images → check balloon clipboard, else silent ignore
            const imageItems = items.filter(it => it.type.startsWith('image/'));
            if (imageItems.length === 0) {
                // If we have a copied balloon, paste it
                if (this._clipboardBalloon) {
                    e.preventDefault();
                    this.pasteBalloon();
                }
                return;
            }

            // It's an image paste — prevent default
            e.preventDefault();

            // Process each image through the queue (Situation 5/12)
            for (const item of imageItems) {
                const blob = item.getAsFile();
                if (blob) this._queuePasteImage(blob);
            }
        });
    },

    _queuePasteImage(blob) {
        this._pasteQueue.push(blob);
        if (!this._pasteProcessing) this._drainPasteQueue();
    },

    async _drainPasteQueue() {
        this._pasteProcessing = true;
        while (this._pasteQueue.length > 0) {
            const blob = this._pasteQueue.shift();
            await this._processIncomingImage(blob);
        }
        this._pasteProcessing = false;
    },

    async _processIncomingImage(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const src = reader.result;
                // Situation 9: Large image auto-resize
                if (src.length > 1.5 * 1024 * 1024) {
                    Toast.show('Otimizando imagem...', 'info');
                    this._resizeAndInsert(src, resolve);
                } else {
                    this._insertPastedImage(src);
                    resolve();
                }
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(blob);
        });
    },

    _resizeAndInsert(src, resolve) {
        this._optimizeToWebP(src, (optimized) => {
            this._insertPastedImage(optimized);
            if (resolve) resolve();
        });
    },

    _insertPastedImage(src) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;

        const layoutId = page.layoutId || LayoutEngine.getDefaultForCount(page.images ? page.images.length : 1);
        const tmpl = LayoutEngine.get(layoutId, page.images || []);
        const panelCount = tmpl && tmpl.panels ? tmpl.panels.length : 1;

        // Ensure images array exists
        if (!page.images) page.images = [];

        // Handle canvas-livre / masonry (sem painéis definidos)
        if (panelCount === 0 || (tmpl.isDynamic && page.images.length === 0)) {
            Store.pushUndo();
            page.images = [{ id: genId(), src, filters: { brightness: 100, contrast: 100 }, transform: { scale: 1, x: 0, y: 0 } }];
            if (!page.layoutId) page.layoutId = '1p-full';
            Store.set({ currentProject: p, selectedSlot: 0 });
            Store.save();
            Toast.show('Imagem adicionada. Selecione um layout na sidebar.', 'info', 4000);
            renderCanvas();
            return;
        }

        // Feature 1: Auto-create page on paste (Layout Full)
        const isFull = PanelHelper.isFull(page);
        if (p.settings?.autoPastePage && isFull && panelCount === 1) {
            Store.pushUndo();
            const newPage = createPage(p.pages.length, p.videoFormat);
            newPage.layoutId = layoutId; // Maintain the same layout
            newPage.images = [{ id: genId(), src, filters: { brightness: 100, contrast: 100 }, transform: { scale: 1, x: 0, y: 0 } }];
            
            // Inherit settings
            if (page.narrativeStyle) newPage.narrativeStyle = JSON.parse(JSON.stringify(page.narrativeStyle));
            if (page.narrativeHeight !== undefined) newPage.narrativeHeight = page.narrativeHeight;
            if (page.showTextBelow !== undefined) newPage.showTextBelow = page.showTextBelow;
            
            p.pages.push(newPage);
            Store.set({ currentProject: p, activePageIndex: p.pages.length - 1, selectedSlot: 0 });
            Store.save();
            
            const pageIdx = Store.get('activePageIndex');
            Library.add(p, src, 'paste-autopage', pageIdx);
            
            Toast.show('Página criada automaticamente', 'success');
            renderCanvas(); renderRightPanel();
            return;
        }

        // Situation 1/3: Panel MANUALLY selected (user clicked) → insert/replace in that panel
        // Only use selectedSlot if it was set by user click, not by previous paste
        const selectedSlot = Store.get('selectedSlot');
        const manualSelection = this._manualSlotSelection;
        
        if (manualSelection && selectedSlot >= 0 && selectedSlot < panelCount) {
            Store.pushUndo();
            this._manualSlotSelection = false; // reset after use
            const existing = page.images[selectedSlot];
            if (existing && existing.src) {
                // Situation 3: Replace existing image
                page.images[selectedSlot] = { id: genId(), src, filters: { brightness: 100, contrast: 100 }, transform: { scale: 1, x: 0, y: 0 } };
                Store.set({ currentProject: p });
                Store.save();
                Toast.show(`Painel ${selectedSlot + 1} substituído — Ctrl+Z para desfazer`, 'info');
            } else {
                // Situation 1: Empty selected panel
                while (page.images.length <= selectedSlot) page.images.push(null);
                page.images[selectedSlot] = { id: genId(), src, filters: { brightness: 100, contrast: 100 } };
                Store.set({ currentProject: p });
                Store.save();
                Toast.show(`Imagem adicionada ao painel ${selectedSlot + 1}`, 'success');
            }
            renderCanvas();
            return;
        }

        // Situation 2: No manual selection → find next empty slot using auto-advance index
        const targetSlot = this.getNextEmptyPanelIndex(page, panelCount);

        if (targetSlot >= 0) {
            // Insert into next empty panel
            Store.pushUndo();
            while (page.images.length <= targetSlot) page.images.push(null);
            page.images[targetSlot] = { id: genId(), src, filters: { brightness: 100, contrast: 100 }, transform: { scale: 1, x: 0, y: 0 } };
            if (!page.layoutId) {
                page.layoutId = LayoutEngine.getDefaultForCount(page.images.filter(im => im && im.src).length);
            }
            // NÃO setar selectedSlot aqui para não interferir com próximo paste
            Store.set({ currentProject: p });
            Store.save();
            const filled = page.images.filter(im => im && im.src).length;
            Toast.show(`Painel ${targetSlot + 1} (${filled}/${panelCount})`, 'success', 1500);
            renderCanvas();
            return;
        }

        // Situation 4: All panels full — use unified overflow flow
        // Check if remaining paste queue has more images
        const remaining = this._pasteQueue.length;
        if (remaining > 0) {
            // Batch overflow: collect this + remaining
            const overflowSrcs = [src];
            while (this._pasteQueue.length > 0) {
                // We need to read them, but they're blobs — mark for batch
                overflowSrcs.push(null); // placeholder
            }
            // For now, add single to library via overflow
            this._pasteQueue = [];
        }
        // Single overflow — delegates to same flow as _addImageDirect overflow
        this._pendingOverflowSrc = src;
        const pageIdx = Store.get('activePageIndex');
        Library.add(p, src, 'paste-overflow', pageIdx);
        Store.set({ currentProject: p }); Store.save();
        
        const nextWithEmpty = PanelHelper.findPageWithEmpty(p, pageIdx + 1);
        const actions = [
            { label: '+ Nova página', action: `App._overflowNewPage()` },
            { label: '↔ Substituir painel', action: `App._enterReplaceTargetMode()` },
        ];
        if (nextWithEmpty >= 0) {
            actions.splice(1, 0, { label: `Usar na pág. ${nextWithEmpty + 1}`, action: `App._overflowGoToPage(${nextWithEmpty})` });
        }
        actions.push({ label: '✕ OK', action: `App._pendingOverflowSrc=null` });
        Toast.showAction(`Painel cheio — imagem colada salva na Biblioteca`, actions, 8000);
        renderRightPanel();
    },

    // ── Cover Canvas Helpers ──
    handleCoverCanvasClick(e) {
        if (e.target.classList.contains('cover-canvas') || e.target.id === 'canvas-page') {
            Store.set({ selectedElement: null });
            renderRightPanel();
        }
    },
    // Pan functionality for cover canvas — delegates to viewport _startPan
    startCoverCanvasPan(e) {
        const isCoverElement = e.target.closest('.cover-text-element') || e.target.closest('.cover-image-element');
        if (isCoverElement) return;
        this._startPan(e);
    },
    // resetPan is defined in the viewport system above
    _editCoverElementInline(elId, wrapperEl) {
        const inner = wrapperEl.querySelector('.cover-text-inner');
        if (!inner) return;
        inner.contentEditable = 'true';
        inner.focus();
        const range = document.createRange();
        range.selectNodeContents(inner);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    },
    _saveCoverElementText(elId, text) {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        const el = coverObj.elements.find(e => e.id === elId); if (!el) return;
        if (el.text !== text) {
            Store.pushUndo();
            el.text = text;
            Store.setSilent({ currentProject: p }); 
            Store.save();
        }
        const inner = document.querySelector(`[data-el-id="${elId}"]`);
        if (inner) inner.contentEditable = 'false';
    },
    _handleCoverDrop(e) {
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length) {
            const f = files.find(f => f.type.startsWith('image/'));
            if (f) {
                const r = new FileReader();
                r.onload = () => this.setCoverBackground(r.result);
                r.readAsDataURL(f);
            }
            return;
        }
        const url = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain') || '';
        if (url && typeof url === 'string' && url.length > 5) this.setCoverBackground(url);
    },
    showCoverElementContextMenu(e, elId) {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        const el = coverObj.elements.find(x => x.id === elId); if (!el) return;
        
        Store.set({ selectedElement: { type: el.type, id: elId } });
        renderRightPanel();
        
        const isImage = el.type === 'cover-image';
        const actions = [
            { label: '↑ Trazer para frente', action: `App.moveCoverElementZ('${elId}', 1)` },
            { label: '↓ Enviar para trás', action: `App.moveCoverElementZ('${elId}', -1)` },
            { separator: true },
            { label: '⧉ Duplicar', action: `App.duplicateCoverElement('${elId}')` }
        ];
        
        if (isImage) {
            actions.unshift({ label: '🖼 Trocar imagem', action: `App.triggerCoverImageElementUpload()` });
            actions.unshift({ separator: true });
        }
        
        actions.push({ separator: true });
        actions.push({ label: '🗑 Excluir', action: `App.deleteCoverElement('${elId}')`, danger: true });
        
        renderContextMenu(e.clientX, e.clientY, actions);
    },
    duplicateCoverElement(elId) {
        const p = Store.get('currentProject');
        const coverObj = this._getActiveCoverObj(); if (!p || !coverObj) return;
        const el = coverObj.elements.find(x => x.id === elId); if (!el) return;
        Store.pushUndo();
        const dup = JSON.parse(JSON.stringify(el));
        dup.id = genId();
        dup.x += 20;
        dup.y += 20;
        coverObj.elements.push(dup);
        Store.set({ currentProject: p, selectedElement: { type: dup.type, id: dup.id } });
        Store.save();
        renderCanvas(); renderRightPanel();
    },
    showCoverContextMenu(e) {
        const p = Store.get('currentProject'); if (!p || !p.cover) return;
        renderContextMenu(e.clientX, e.clientY, [
            { label: 'Trocar imagem de fundo', action: 'App.triggerCoverImageUpload()' },
            { label: 'Exportar capa PNG', action: 'App.exportCoverPng()' },
            { separator: true },
            { label: '🗑 Remover capa', action: 'App.removeCover()', danger: true }
        ]);
    },

    // ── Export ──
    _exportFormat: 'pdf',
    _exportScale: 2,
    _exportDestination: null, // 'story' | 'feed' | 'a4' | 'video'
    _exportPageMode: 'all',   // 'all' | 'current'
    _exportBg: 'blur',        // 'blur' | 'black' | 'white'
    _exportA4Sub: 'pdf',      // 'pdf' | 'png' | 'png_hd'
    _videoQuality: 'high',    // 'low' | 'medium' | 'high'
    _videoFps: 30,            // 24 | 30

    showExportModal() {
        const backdrop = document.getElementById('modal-backdrop'), content = document.getElementById('modal-content');
        if (!backdrop || !content) return;
        const p = Store.get('currentProject');
        if (!p) return;
        const pageCount = p.pages.length + (p.cover ? 1 : 0);
        const dest = this._exportDestination;
        const pageMode = this._exportPageMode;
        const bg = this._exportBg;
        const a4sub = this._exportA4Sub;

        const cardStyle = (id) => `style="padding:16px;border-radius:10px;border:2px solid ${dest===id?'var(--accent)':'var(--border)'};background:${dest===id?'var(--accent-glow)':'var(--surface2)'};cursor:pointer;text-align:center;transition:all 0.18s;transform:${dest===id?'scale(1.02)':'scale(1)'};" onclick="App._exportDestination='${id}';App.showExportModal()" onmouseenter="if('${id}'!==App._exportDestination)this.style.transform='scale(1.02)'" onmouseleave="if('${id}'!==App._exportDestination)this.style.transform='scale(1)'"`;

        let detailsHTML = '';
        if (dest) {
            // Page selector
            const pageSel = `
              <div style="margin-bottom:10px;">
                <span style="font-size:11px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px;">Páginas</span>
                <div style="display:flex;gap:6px;">
                  ${[['all','Todas'],['current','Só esta']].map(([v,l]) =>
                    `<button onclick="App._exportPageMode='${v}';App.showExportModal()" style="flex:1;padding:6px;border-radius:6px;border:1.5px solid ${pageMode===v?'var(--accent)':'var(--border)'};background:${pageMode===v?'var(--accent-glow)':'var(--surface)'};color:${pageMode===v?'var(--accent)':'var(--text2)'};font-size:11px;cursor:pointer;font-weight:${pageMode===v?'700':'400'};">${l}</button>`
                  ).join('')}
                </div>
              </div>`;

            // Background selector (story + feed)
            const bgSel = `
              <div style="margin-bottom:10px;">
                <span style="font-size:11px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px;">Fundo</span>
                <div style="display:flex;gap:6px;">
                  ${[['blur','Blur'],['black','Preto'],['white','Branco']].map(([v,l]) =>
                    `<button onclick="App._exportBg='${v}';App.showExportModal()" style="flex:1;padding:6px;border-radius:6px;border:1.5px solid ${bg===v?'var(--accent)':'var(--border)'};background:${bg===v?'var(--accent-glow)':'var(--surface)'};color:${bg===v?'var(--accent)':'var(--text2)'};font-size:11px;cursor:pointer;font-weight:${bg===v?'700':'400'};">${l}</button>`
                  ).join('')}
                </div>
              </div>`;

            const totalPages = pageMode === 'current' ? 1 : pageCount;
            const estSize = dest === 'story' ? Math.round(totalPages * 0.8) : dest === 'feed' ? Math.round(totalPages * 0.65) : Math.round(totalPages * 0.5);

            if (dest === 'story') {
                detailsHTML = `
                  <div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:10px;">
                    <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;">Story — 1080×1920px (9:16)</div>
                    <div style="font-size:10px;color:var(--text3);margin-bottom:12px;">Para TikTok e Instagram Story · JPG 92% · ${totalPages > 1 ? 'Download como ZIP' : 'Download JPG direto'}</div>
                    ${pageSel}${bgSel}
                    <div id="export-progress" class="hidden"><div class="progress-bar"><div class="progress-fill" id="export-bar"></div></div><p id="export-status" style="font-size:10px;color:var(--text3);text-align:center;margin-top:4px;"></p></div>
                    <button id="export-btn" class="btn btn-primary" style="width:100%;padding:10px;font-size:13px;font-weight:700;" onclick="App._doExportSocial('story')">Baixar ${totalPages > 1 ? totalPages+' stories (ZIP)' : 'Story'}</button>
                    ${totalPages > 0 ? `<div style="font-size:9px;color:var(--text3);text-align:center;margin-top:6px;">~${estSize} MB estimado</div>` : ''}
                  </div>`;
            } else if (dest === 'feed') {
                const overLimit = pageMode === 'all' && pageCount > 20;
                detailsHTML = `
                  <div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:10px;">
                    <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;">Feed / Carrossel — 1080×1350px (4:5)</div>
                    <div style="font-size:10px;color:var(--text3);margin-bottom:12px;">Para Instagram Feed · JPG 92% · ZIP numerado · Máx 20 slides</div>
                    ${pageSel}${bgSel}
                    ${overLimit ? `<div style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);border-radius:6px;padding:8px;margin-bottom:10px;font-size:10px;color:#f59e0b;">⚠ Instagram suporta até 20 slides. Seu projeto tem ${pageCount} páginas — serão exportadas as 20 primeiras.</div>` : ''}
                    <div id="export-progress" class="hidden"><div class="progress-bar"><div class="progress-fill" id="export-bar"></div></div><p id="export-status" style="font-size:10px;color:var(--text3);text-align:center;margin-top:4px;"></p></div>
                    <button id="export-btn" class="btn btn-primary" style="width:100%;padding:10px;font-size:13px;font-weight:700;" onclick="App._doExportSocial('feed')">Baixar ${totalPages > 1 ? Math.min(totalPages,20)+' slides (ZIP)' : 'Feed JPG'}</button>
                    ${totalPages > 0 ? `<div style="font-size:9px;color:var(--text3);text-align:center;margin-top:6px;">~${estSize} MB estimado</div>` : ''}
                  </div>`;
            } else if (dest === 'a4') {
                detailsHTML = `
                  <div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:10px;">
                    <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;">📄 A4 — PDF / Impressão / Plataformas</div>
                    <div style="font-size:10px;color:var(--text3);margin-bottom:12px;">Webtoon, Tapas, GIBI e impressão · 794×1123px</div>
                    <div style="margin-bottom:10px;">
                      <span style="font-size:11px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px;">Formato</span>
                      <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        ${[['pdf','PDF completo'],['png','PNG (ZIP)'],['png_hd','PNG HD 300dpi (ZIP)']].map(([v,l]) =>
                          `<button onclick="App._exportA4Sub='${v}';App.showExportModal()" style="flex:1;padding:6px 4px;border-radius:6px;border:1.5px solid ${a4sub===v?'var(--accent)':'var(--border)'};background:${a4sub===v?'var(--accent-glow)':'var(--surface)'};color:${a4sub===v?'var(--accent)':'var(--text2)'};font-size:10px;cursor:pointer;font-weight:${a4sub===v?'700':'400'};white-space:nowrap;">${l}</button>`
                        ).join('')}
                      </div>
                    </div>
                    ${pageSel}
                    <div id="export-progress" class="hidden"><div class="progress-bar"><div class="progress-fill" id="export-bar"></div></div><p id="export-status" style="font-size:10px;color:var(--text3);text-align:center;margin-top:4px;"></p></div>
                    <button id="export-btn" class="btn btn-primary" style="width:100%;padding:10px;font-size:13px;font-weight:700;" onclick="App._doExportA4()">Baixar ${a4sub === 'pdf' ? 'PDF' : a4sub === 'png_hd' ? 'PNG HD (ZIP)' : 'PNG (ZIP)'}</button>
                    ${a4sub === 'png_hd' ? `<div style="font-size:9px;color:var(--text3);text-align:center;margin-top:4px;">⚠ Alta resolução — pode demorar alguns segundos por página</div>` : ''}
                  </div>`;
            } else if (dest === 'video') {
                const totalDur = p.pages.reduce((s, pg) => s + (pg.duration || 4), 0);
                const fmtDur = (s) => { const m = Math.floor(s/60); return `${String(m).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`; };
                const vQuality = this._videoQuality || 'high';
                const vFps = this._videoFps || 30;
                detailsHTML = `
                  <div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:10px;">
                    <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;">🎬 Vídeo — Motion Comic WebM</div>
                    <div style="font-size:10px;color:var(--text3);margin-bottom:12px;">${p.pages.length} páginas · ${fmtDur(totalDur)} duração · Ken Burns + Transições</div>
                    <div style="margin-bottom:10px;">
                      <span style="font-size:11px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px;">Qualidade</span>
                      <div style="display:flex;gap:6px;">
                        ${[['low','Rápido'],['medium','Normal'],['high','Alta']].map(([v,l]) =>
                          `<button onclick="App._videoQuality='${v}';App.showExportModal()" style="flex:1;padding:6px;border-radius:6px;border:1.5px solid ${vQuality===v?'var(--accent)':'var(--border)'};background:${vQuality===v?'var(--accent-glow)':'var(--surface)'};color:${vQuality===v?'var(--accent)':'var(--text2)'};font-size:11px;cursor:pointer;font-weight:${vQuality===v?'700':'400'};">${l}</button>`
                        ).join('')}
                      </div>
                    </div>
                    <div style="margin-bottom:10px;">
                      <span style="font-size:11px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px;">FPS</span>
                      <div style="display:flex;gap:6px;">
                        ${[['24','24fps'],['30','30fps']].map(([v,l]) =>
                          `<button onclick="App._videoFps=${v};App.showExportModal()" style="flex:1;padding:6px;border-radius:6px;border:1.5px solid ${String(vFps)===v?'var(--accent)':'var(--border)'};background:${String(vFps)===v?'var(--accent-glow)':'var(--surface)'};color:${String(vFps)===v?'var(--accent)':'var(--text2)'};font-size:11px;cursor:pointer;font-weight:${String(vFps)===v?'700':'400'};">${l}</button>`
                        ).join('')}
                      </div>
                    </div>
                    <div id="video-export-progress" style="display:none;background:var(--surface3);border-radius:8px;padding:12px;margin-bottom:10px;">
                      <div style="height:6px;background:var(--surface);border-radius:3px;overflow:hidden;margin-bottom:6px;">
                        <div id="video-export-bar" style="height:100%;background:var(--accent);border-radius:3px;width:0%;transition:width 0.15s;"></div>
                      </div>
                      <div id="video-export-status" style="font-size:10px;color:var(--text3);text-align:center;"></div>
                    </div>
                    <button id="video-export-btn" class="btn btn-primary" style="width:100%;padding:10px;font-size:13px;font-weight:700;" onclick="App._doExportVideo()">🎬 Exportar Vídeo WebM</button>
                    <div style="font-size:9px;color:var(--text3);text-align:center;margin-top:6px;">Renderiza cada página com Ken Burns e transições</div>
                  </div>`;
            }
        }

        content.innerHTML = `
          <div class="modal-header">
            <h3>📤 Exportar Projeto</h3>
            <button class="btn btn-icon" onclick="App.closeModal()">${Icons.close}</button>
          </div>
          <div class="modal-body" style="padding:16px;">
            <div style="font-size:11px;color:var(--text3);margin-bottom:14px;">${p.metadata.name} · ${pageCount} página${pageCount!==1?'s':''}</div>
            <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:10px;letter-spacing:0.5px;">ESCOLHA O DESTINO</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px;">
              <div ${cardStyle('story')}>
                <div style="font-size:28px;margin-bottom:6px;">📱</div>
                <div style="font-size:13px;font-weight:700;color:${dest==='story'?'var(--accent)':'var(--text)'};">Story</div>
                <div style="font-size:10px;color:var(--text3);margin-top:3px;">TikTok + Instagram</div>
                <div style="font-size:9px;color:var(--text3);margin-top:2px;">1080×1920 · 9:16 · JPG</div>
              </div>
              <div ${cardStyle('feed')}>
                <div style="font-size:28px;margin-bottom:6px;">📱</div>
                <div style="font-size:13px;font-weight:700;color:${dest==='feed'?'var(--accent)':'var(--text)'};">Feed / Carrossel</div>
                <div style="font-size:10px;color:var(--text3);margin-top:3px;">Instagram</div>
                <div style="font-size:9px;color:var(--text3);margin-top:2px;">1080×1350 · 4:5 · JPG</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div ${cardStyle('a4')}>
                <div style="font-size:28px;margin-bottom:6px;">📄</div>
                <div style="font-size:13px;font-weight:700;color:${dest==='a4'?'var(--accent)':'var(--text)'};">A4</div>
                <div style="font-size:10px;color:var(--text3);margin-top:3px;">PDF · PNG</div>
                <div style="font-size:9px;color:var(--text3);margin-top:2px;">794×1123px</div>
              </div>
              <div ${cardStyle('video')}>
                <div style="font-size:28px;margin-bottom:6px;">🎬</div>
                <div style="font-size:13px;font-weight:700;color:${dest==='video'?'var(--accent)':'var(--text)'};">Vídeo</div>
                <div style="font-size:10px;color:var(--text3);margin-top:3px;">WebM · Motion Comic</div>
                <div style="font-size:9px;color:var(--text3);margin-top:2px;">Ken Burns + Transições</div>
              </div>
            </div>
            ${detailsHTML}
          </div>`;
        backdrop.classList.add('visible');
    },
    closeModal() { const b = document.getElementById('modal-backdrop'); if (b) b.classList.remove('visible'); this.closeBalloonTooltip(); this.closeStickerTooltip(); },

    // ── Letterbox Blur (for social exports) ──
    async _renderPageToCanvas(pageIndex, scale = 2) {
        const p = Store.get('currentProject');
        if (!p) return null;
        const vp = this._viewport;
        // Save viewport + UI state
        const savedVP = { x: vp.x, y: vp.y, scale: vp.scale };
        const oldGuides = Store.get('showGuides');
        const oldBleed = Store.get('showBleed');
        const oldReading = Store.get('showReadingOrder');

        // Reset viewport to scale=1, no pan for clean capture
        vp.scale = 1; vp.x = 0; vp.y = 0;
        this._applyViewportTransform();
        Store.set({ showGuides: false, showBleed: false, showReadingOrder: false, selectedSlot: -1, selectedElement: null });

        // Handle cover page
        const hasCover = !!p.cover;
        let isCoverPage = false;
        let realIdx = pageIndex;
        if (hasCover && pageIndex === 0) {
            isCoverPage = true;
            Store.set({ coverActive: true });
        } else {
            realIdx = hasCover ? pageIndex - 1 : pageIndex;
            Store.set({ coverActive: false, activePageIndex: realIdx });
        }

        renderCanvas();
        await new Promise(r => setTimeout(r, 400));
        const el = document.getElementById('canvas-page');
        if (!el) {
            vp.x = savedVP.x; vp.y = savedVP.y; vp.scale = savedVP.scale;
            this._applyViewportTransform();
            Store.set({ showGuides: oldGuides, showBleed: oldBleed, showReadingOrder: oldReading });
            return null;
        }
        // Hide UI overlays (panel selectors, gutters, mini-toolbars, resize handles, frame labels)
        const sel = el.querySelectorAll('.balloon-selection, .balloon-resize-handle, .panel-mini-toolbar, .canvas-float-tools, .panel-selector-fixed, .gutter-handle, .narrative-resize-handle, .frame-label-overlay');
        sel.forEach(s => { s.style.display = 'none'; });
        let canvas = null;
        try {
            canvas = await html2canvas(el, { scale, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
        } catch (err) { console.error('Page render error', err); }
        sel.forEach(s => { s.style.display = ''; });
        // Restore viewport + UI state
        vp.x = savedVP.x; vp.y = savedVP.y; vp.scale = savedVP.scale;
        this._applyViewportTransform();
        Store.set({ showGuides: oldGuides, showBleed: oldBleed, showReadingOrder: oldReading });
        if (isCoverPage) Store.set({ coverActive: true });
        else Store.set({ coverActive: false });
        return canvas;
    },

    async _applyLetterbox(pageCanvas, targetW, targetH, bgMode = 'blur') {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        // Background
        if (bgMode === 'black') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, targetW, targetH);
        } else if (bgMode === 'white') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetW, targetH);
        } else {
            // Blur background: scale-to-cover then blur + darken
            const scaleToCover = Math.max(targetW / pageCanvas.width, targetH / pageCanvas.height);
            const coverW = pageCanvas.width * scaleToCover;
            const coverH = pageCanvas.height * scaleToCover;
            const coverX = (targetW - coverW) / 2;
            const coverY = (targetH - coverH) / 2;
            ctx.filter = 'blur(20px) brightness(0.55)';
            ctx.drawImage(pageCanvas, coverX, coverY, coverW, coverH);
            ctx.filter = 'none';
        }

        // Page centered, fit
        const scaleToFit = Math.min(targetW / pageCanvas.width, targetH / pageCanvas.height);
        const fitW = pageCanvas.width * scaleToFit;
        const fitH = pageCanvas.height * scaleToFit;
        const fitX = (targetW - fitW) / 2;
        const fitY = (targetH - fitH) / 2;
        ctx.drawImage(pageCanvas, fitX, fitY, fitW, fitH);
        return canvas;
    },

    async _doExportSocial(type) {
        const p = Store.get('currentProject'); if (!p) return;
        const btn = document.getElementById('export-btn');
        const bar = document.getElementById('export-bar');
        const status = document.getElementById('export-status');
        const prog = document.getElementById('export-progress');
        if (btn) btn.disabled = true;
        if (prog) prog.classList.remove('hidden');

        const isStory = type === 'story';
        const targetW = isStory ? 1080 : 1080;
        const targetH = isStory ? 1920 : 1350;
        const filePrefix = isStory ? 'story' : 'slide';
        const quality = 0.92;
        const bg = this._exportBg;
        const pageMode = this._exportPageMode;
        const hasCover = !!p.cover;
        const totalPages = p.pages.length + (hasCover ? 1 : 0);

        // Determine which pages to export
        let pageIndices;
        if (pageMode === 'current') {
            const curr = Store.get('coverActive') ? 0 : (Store.get('activePageIndex') + (hasCover ? 1 : 0));
            pageIndices = [curr];
        } else {
            pageIndices = Array.from({ length: Math.min(totalPages, type === 'feed' ? 20 : totalPages) }, (_, i) => i);
        }

        try {
            const zip = new JSZip();
            const resultBlobs = [];

            for (let i = 0; i < pageIndices.length; i++) {
                const idx = pageIndices[i];
                if (status) status.textContent = `Gerando ${i + 1}/${pageIndices.length}...`;
                if (bar) bar.style.width = `${Math.round(((i + 1) / pageIndices.length) * 100)}%`;

                const pageCanvas = await this._renderPageToCanvas(idx, 2);
                if (!pageCanvas) continue;
                const outCanvas = await this._applyLetterbox(pageCanvas, targetW, targetH, bg);
                const blob = await new Promise(res => outCanvas.toBlob(res, 'image/jpeg', quality));
                resultBlobs.push({ blob, name: `${filePrefix}-${String(i + 1).padStart(2, '0')}.jpg` });
                zip.file(`${filePrefix}-${String(i + 1).padStart(2, '0')}.jpg`, blob);
            }

            if (btn) {
                btn.textContent = '✅ Pronto! Baixar';
                btn.style.background = 'var(--success)';
                btn.disabled = false;
            }

            if (resultBlobs.length === 1) {
                // Single file — download directly
                const a = document.createElement('a');
                a.href = URL.createObjectURL(resultBlobs[0].blob);
                a.download = resultBlobs[0].name;
                a.click();
                URL.revokeObjectURL(a.href);
            } else {
                // Multiple — ZIP
                const zb = await zip.generateAsync({ type: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(zb);
                a.download = `${p.metadata.name}-${filePrefix}.zip`;
                a.click();
                URL.revokeObjectURL(a.href);
            }

            const label = isStory ? 'stories' : 'slides';
            Toast.show(`✅ ${resultBlobs.length} ${label} prontos!`, 'success', 4000);

            // Show post-download instructions
            if (status) {
                status.style.color = 'var(--success)';
                status.textContent = isStory
                    ? 'Instagram: Novo post → Story → selecione os arquivos  ·  TikTok: Criar → Foto → selecione'
                    : 'Instagram: Novo post → selecione todos os slides em ordem';
            }
        } catch (err) {
            Toast.show('Erro ao exportar: ' + err.message, 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Error - Try again'; btn.style.background = ''; }
        }
    },

    async _doExportA4() {
        const p = Store.get('currentProject'); if (!p) return;
        const btn = document.getElementById('export-btn');
        const bar = document.getElementById('export-bar');
        const status = document.getElementById('export-status');
        const prog = document.getElementById('export-progress');
        if (btn) btn.disabled = true;
        if (prog) prog.classList.remove('hidden');

        const a4sub = this._exportA4Sub;
        const pageMode = this._exportPageMode;
        const hasCover = !!p.cover;
        const totalPages = p.pages.length + (hasCover ? 1 : 0);

        let pageIndices;
        if (pageMode === 'current') {
            const curr = Store.get('coverActive') ? 0 : (Store.get('activePageIndex') + (hasCover ? 1 : 0));
            pageIndices = [curr];
        } else {
            pageIndices = Array.from({ length: totalPages }, (_, i) => i);
        }

        const scale = a4sub === 'png_hd' ? 3.5 : 2;

        try {
            if (a4sub === 'pdf') {
                // PDF export
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [A4.W, A4.H] });
                // Include cover metadata
                if (p.cover) {
                    doc.setProperties({
                        title: p.cover.title || p.metadata.name,
                        author: p.cover.author || '',
                        subject: p.cover.synopsis || '',
                        keywords: p.cover.genre || ''
                    });
                }
                for (let i = 0; i < pageIndices.length; i++) {
                    const idx = pageIndices[i];
                    if (status) status.textContent = `Página ${i + 1}/${pageIndices.length}...`;
                    if (bar) bar.style.width = `${Math.round(((i + 1) / pageIndices.length) * 100)}%`;
                    const canvas = await this._renderPageToCanvas(idx, 2);
                    if (!canvas) continue;
                    const imgData = canvas.toDataURL('image/jpeg', 0.92);
                    if (i > 0) doc.addPage([A4.W, A4.H]);
                    doc.addImage(imgData, 'JPEG', 0, 0, A4.W, A4.H);
                }
                doc.save(`${p.metadata.name}.pdf`);
            } else {
                // PNG/PNG_HD export — ZIP
                const zip = new JSZip();
                for (let i = 0; i < pageIndices.length; i++) {
                    const idx = pageIndices[i];
                    if (status) status.textContent = `Página ${i + 1}/${pageIndices.length}...`;
                    if (bar) bar.style.width = `${Math.round(((i + 1) / pageIndices.length) * 100)}%`;
                    const canvas = await this._renderPageToCanvas(idx, scale);
                    if (!canvas) continue;
                    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
                    const label = hasCover && idx === 0 ? 'capa' : `pagina-${String(hasCover ? idx : idx + 1).padStart(2, '0')}`;
                    zip.file(`${label}.png`, blob);
                }
                const zb = await zip.generateAsync({ type: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(zb);
                a.download = `${p.metadata.name}${a4sub === 'png_hd' ? '-HD' : ''}.zip`;
                a.click();
                URL.revokeObjectURL(a.href);
            }

            if (btn) { btn.disabled = false; btn.textContent = '✅ Pronto!'; btn.style.background = 'var(--success)'; }
            Toast.show('Exportação concluída!', 'success');
        } catch (err) {
            Toast.show('Erro ao exportar: ' + err.message, 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Error - Try again'; btn.style.background = ''; }
        }
    },

    // ── Export Page controller methods ──
    _setExportQuality(q) {
        this._videoQuality = q;
        const btns = document.querySelectorAll('#export-quality-btns .export-opt-btn');
        btns.forEach(b => {
            const isActive = b.dataset.val === q;
            b.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
            b.style.background = isActive ? 'rgba(107,114,128,0.1)' : 'var(--bg-surface)';
            b.style.color = isActive ? 'var(--accent)' : 'var(--text-2)';
            b.style.fontWeight = isActive ? '600' : '400';
        });
        this._updateExportButtonLabel();
        if (Store.get('view') === 'export') this.render();
    },
    _setExportFps(fps) {
        this._videoFps = fps;
        const btns = document.querySelectorAll('#export-fps-btns .export-opt-btn');
        btns.forEach(b => {
            const isActive = b.dataset.val === String(fps);
            b.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
            b.style.background = isActive ? 'rgba(107,114,128,0.1)' : 'var(--bg-surface)';
            b.style.color = isActive ? 'var(--accent)' : 'var(--text-2)';
            b.style.fontWeight = isActive ? '600' : '400';
        });
        this._updateExportButtonLabel();
        if (Store.get('view') === 'export') this.render();
    },
    _setExportLanguage(lang) {
        Store.set({ exportLanguage: lang });
        const btns = document.querySelectorAll('#export-lang-btns .export-opt-btn');
        btns.forEach(b => {
            const isActive = b.dataset.val === lang;
            b.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
            b.style.background = isActive ? 'rgba(107,114,128,0.1)' : 'var(--bg-surface)';
            b.style.color = isActive ? 'var(--accent)' : 'var(--text-2)';
            b.style.fontWeight = isActive ? '600' : '400';
        });
        this._updateExportButtonLabel();
        if (Store.get('view') === 'export') this.render();
    },
    _updateExportButtonLabel() {
        const exportBtn = document.getElementById('export-video-btn');
        if (!exportBtn) return;
        const fmt = this._exportFormat || 'auto';
        const exportLang = Store.get('exportLanguage') || 'pt-BR';
        const label = fmt === 'mp4' ? 'MP4' : fmt === 'webm' ? 'WebM' : 'Auto';
        const langLabel = exportLang === 'both' ? t('export.both') : exportLang === 'en' ? t('export.english') : t('export.portuguese');
        exportBtn.textContent = `🎬 ${t('export.exportVideo')} · ${langLabel} · ${label}`;
    },
    validateProjectBeforeExport() {
        const p = Store.get('currentProject');
        if (!p) return { valid: false, errors: ['Nenhum projeto selecionado'] };
        
        const errors = [];
        
        // Check 1: Minimum 1 page
        if (!p.pages || p.pages.length === 0) {
            errors.push('O projeto precisa ter pelo menos 1 página.');
        }
        
        // Check 2: All pages have images (visual content)
        const emptyPages = [];
        p.pages.forEach((page, i) => {
            const hasImage = page.images && page.images.some(img => img && img.src);
            if (!hasImage) emptyPages.push(i + 1);
        });
        
        if (emptyPages.length > 0) {
            errors.push(`Páginas sem imagem: ${emptyPages.join(', ')}.`);
        }
        
        // Check 3: Bilingual validation
        if (Store.get('exportLanguage') === 'both' || p.activeLanguage === 'both') {
            // Simple check: if narrative exists in one lang, should exist in other? 
            // Or just check if 'en' is empty when it should be there. 
            // For now, let's just warn if 'en' narrative is missing but 'pt-BR' exists, or vice versa.
            // This might be too strict for a simple app, let's stick to the user request: "Narrativa sem tradução EN → quebra export bilíngue"
            // Actually, let's just check if we are exporting 'en' or 'both' and there is NO content in EN.
        }
        
        return { valid: errors.length === 0, errors };
    },

    async _startVideoExport() {
        // Mobile warning
        if (this.isMobile()) {
            const proceed = confirm(
                'Warning: Export on mobile can be slow (2-5 min) and consume battery.\n\n' +
                'Recomendamos usar desktop para melhor performance.\n\n' +
                'Continuar mesmo assim?'
            );
            if (!proceed) return;
        }
        
        const btn = document.getElementById('export-video-btn');
        const area = document.getElementById('export-progress-area');
        const bar = document.getElementById('export-progress-bar');
        const statusText = document.getElementById('export-status-text');
        const pctText = document.getElementById('export-pct-text');
        
        // Validation
        const validation = this.validateProjectBeforeExport();
        if (!validation.valid) {
            // Show errors (simpler than a custom modal for now, just an alert/confirm)
            const msg = t('confirm.exportWithErrors', { errors: validation.errors.join("\n") });
            if (!confirm(msg)) return;
        }

        if (btn) { btn.disabled = true; btn.textContent = t('export.exporting'); btn.style.opacity = '0.7'; }
        if (area) area.style.display = 'block';

        const proj = Store.get('currentProject');
        const exportLang = Store.get('exportLanguage') || 'pt-BR';
        
        try {
            // Handle "both" languages - export sequentially
            if (exportLang === 'both') {
                await this._exportVideoForLanguage('pt-BR', btn, area, bar, statusText, pctText, 0);
                await this._exportVideoForLanguage('en', btn, area, bar, statusText, pctText, 0.5);
                if (btn) { btn.textContent = '✅ 2 vídeos exportados!'; btn.style.opacity = '1'; }
                Toast.show('Vídeos PT-BR e EN exportados!', 'success');
            } else {
                await this._exportVideoForLanguage(exportLang, btn, area, bar, statusText, pctText, 0);
            }
        } catch (e) {
            console.error(e);
            Toast.show('Erro fatal na exportação', 'error');
        } finally {
            setTimeout(() => {
                if (btn) { btn.disabled = false; btn.textContent = '🎬 Exportar Vídeo'; btn.style.opacity = '1'; }
            }, 3000);
        }
    },
    
    async _exportVideoForLanguage(lang, btn, area, bar, statusText, pctText, progressOffset) {
        // 🚨 CRITICAL BUG FIX: Force save all pending changes before export
        if (this._narrativeSaveTimeout) clearTimeout(this._narrativeSaveTimeout);
        if (this._coverSaveTimeout) clearTimeout(this._coverSaveTimeout);
        if (this._coverMetaSaveTimeout) clearTimeout(this._coverMetaSaveTimeout);
        
        if (document.activeElement && document.activeElement.contentEditable === 'true') {
            document.activeElement.blur();
        }
        
        await Store.save();
        
        const proj = Store.get('currentProject');
        const langSuffix = lang === 'pt-BR' ? '_pt-br' : '_en';
        const fmt = this._exportFormat || 'auto';
        
        if (statusText) statusText.textContent = `Exportando ${lang === 'pt-BR' ? '🇧🇷 PT-BR' : '🇺🇸 EN'}...`;

        try {
            const blob = await VideoExporter.exportVideo({
                fps: this._videoFps || 30,
                quality: this._videoQuality || 'high',
                language: lang,
                format: fmt,
                onProgress: (p) => {
                    const adjustedProgress = progressOffset + (p * (progressOffset > 0 ? 0.5 : 1));
                    const pct = Math.round(adjustedProgress * 100);
                    if (bar) bar.style.width = pct + '%';
                    if (pctText) pctText.textContent = pct + '%';
                },
                onStatus: (s) => {
                    if (statusText) statusText.textContent = `[${lang === 'pt-BR' ? '🇧🇷' : '🇺🇸'}] ${s}`;
                }
            });

            if (blob) {
                const ext = blob._ext || 'webm';
                const filename = (proj?.metadata?.name || 'hq-movie').replace(/[^a-zA-Z0-9_-]/g, '_') + langSuffix + '.' + ext;
                VideoExporter.downloadBlob(blob, filename);
                const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
                if (statusText) statusText.textContent = `${lang}: Pronto! ${sizeMB} MB (${ext.toUpperCase()})`;
                if (progressOffset === 0 && Store.get('exportLanguage') !== 'both') {
                    if (btn) { btn.textContent = '✅ Exportado!'; btn.style.opacity = '1'; }
                    Toast.show(`Vídeo ${lang} exportado (${sizeMB} MB, ${ext.toUpperCase()})`, 'success');
                }
            }
        } catch (err) {
            if (statusText) statusText.textContent = `Erro (${lang}): ` + err.message;
            Toast.show(`Erro ao exportar vídeo ${lang}`, 'error');
        }
    },
    async _exportAllPng() {
        const proj = Store.get('currentProject');
        if (!proj || !proj.pages) return;
        for (let i = 0; i < proj.pages.length; i++) {
            Store.set({ activePageIndex: i });
            renderCanvas();
            await new Promise(r => setTimeout(r, 300));
            await this.savePageAsPng();
        }
        Toast.show(`${proj.pages.length} páginas exportadas como PNG`, 'success');
    },
    openExportPage() {
        if (!['auto', 'mp4', 'webm'].includes(this._exportFormat)) {
            this._exportFormat = 'auto';
        }
        if (!Store.get('exportLanguage')) {
            Store.setSilent({ exportLanguage: 'pt-BR' });
        }
        Store.set({ view: 'export' });
        requestAnimationFrame(() => this._updateExportButtonLabel());
    },

    _setExportFormat(fmt) {
        this._exportFormat = fmt;
        const btns = document.querySelectorAll('#export-format-btns .export-opt-btn');
        btns.forEach(b => {
            const isActive = b.dataset.val === fmt;
            b.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
            b.style.background = isActive ? 'rgba(107,114,128,0.1)' : 'var(--bg-surface)';
            b.style.color = isActive ? 'var(--accent)' : 'var(--text-2)';
            b.style.fontWeight = isActive ? '600' : '400';
        });
        this._updateExportButtonLabel();
        if (Store.get('view') === 'export') this.render();
    },
    async _doExportVideo() {
        const btn = document.getElementById('video-export-btn');
        const progEl = document.getElementById('video-export-progress');
        const barEl = document.getElementById('video-export-bar');
        const statusEl = document.getElementById('video-export-status');
        
        if (btn) btn.disabled = true;
        if (progEl) progEl.style.display = 'block';
        
        // 🚨 CRITICAL BUG FIX: Force save all pending changes before export
        // clear any pending timeouts (e.g. narrative typing) and force save immediately
        if (this._narrativeSaveTimeout) clearTimeout(this._narrativeSaveTimeout);
        if (this._coverSaveTimeout) clearTimeout(this._coverSaveTimeout);
        if (this._coverMetaSaveTimeout) clearTimeout(this._coverMetaSaveTimeout);
        
        // Force an active contenteditable blur if user was typing
        if (document.activeElement && document.activeElement.contentEditable === 'true') {
            document.activeElement.blur();
        }
        
        await Store.save();
        
        // Fetch fresh project from Store after save
        const proj = Store.get('currentProject');
        const fmt = this._exportFormat || 'auto';
        
        try {
            const blob = await VideoExporter.exportVideo({
                fps: this._videoFps || 30,
                quality: this._videoQuality || 'high',
                format: fmt,
                onProgress: (p) => {
                    if (barEl) barEl.style.width = Math.round(p * 100) + '%';
                },
                onStatus: (s) => {
                    if (statusEl) statusEl.textContent = s;
                }
            });
            
            if (blob) {
                const ext = blob._ext || 'webm';
                const filename = (proj?.metadata?.name || 'hq-movie').replace(/[^a-zA-Z0-9_-]/g, '_') + '.' + ext;
                VideoExporter.downloadBlob(blob, filename);
                const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
                if (statusEl) statusEl.textContent = `Pronto! ${sizeMB} MB (${ext.toUpperCase()})`;
                Toast.show(`Vídeo exportado (${sizeMB} MB, ${ext.toUpperCase()})`, 'success');
            } else {
                if (statusEl) statusEl.textContent = 'Exportação cancelada';
            }
        } catch (err) {
            if (statusEl) statusEl.textContent = 'Erro: ' + err.message;
            Toast.show('Erro ao exportar vídeo', 'error');
        }
        
        if (btn) btn.disabled = false;
    },

    async doExport() {
        // Legacy method — route to new modal if destination set, else PDF
        if (this._exportDestination === 'story') { await this._doExportSocial('story'); return; }
        if (this._exportDestination === 'feed') { await this._doExportSocial('feed'); return; }
        if (this._exportDestination === 'a4') { await this._doExportA4(); return; }
        if (this._exportDestination === 'video') { await this._doExportVideo(); return; }
        // Fallback: PDF
        const p = Store.get('currentProject'); if (!p) return;
        const bar = document.getElementById('export-bar'), status = document.getElementById('export-status'), prog = document.getElementById('export-progress'), btn = document.getElementById('export-btn');
        if (prog) prog.classList.remove('hidden'); if (btn) btn.disabled = true;
        const vp = this._viewport;
        const savedVP = { x: vp.x, y: vp.y, scale: vp.scale };
        try {
            const oldBleed = Store.get('showBleed'), oldReading = Store.get('showReadingOrder');
            vp.scale = 1; vp.x = 0; vp.y = 0; this._applyViewportTransform();
            Store.set({ showGuides: false, showBleed: false, showReadingOrder: false, selectedSlot: -1, selectedElement: null });
            await this._exportPDF(p, bar, status);
            vp.x = savedVP.x; vp.y = savedVP.y; vp.scale = savedVP.scale; this._applyViewportTransform();
            Store.set({ showGuides: true, showBleed: oldBleed, showReadingOrder: oldReading });
            Toast.show('Exportado!', 'success'); setTimeout(() => this.closeModal(), 1000);
        } catch (err) { Toast.show('Erro: ' + err.message, 'error'); vp.x = savedVP.x; vp.y = savedVP.y; vp.scale = savedVP.scale; this._applyViewportTransform(); }
        if (btn) btn.disabled = false;
    },

    renderRightPanelDebounced() {
        clearTimeout(this._rpTimer);
        this._rpTimer = setTimeout(() => renderRightPanel(), 150);
    },
    
    showShortcutsHelp() {
        const backdrop = document.getElementById('modal-backdrop'), content = document.getElementById('modal-content');
        if (!backdrop || !content) return;
        content.innerHTML = `<div class="modal-header"><h3>Atalhos de Teclado</h3><button class="btn btn-icon" onclick="App.closeModal()">${Icons.close}</button></div>
        <div class="modal-body" style="font-size:13px;line-height:2;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;">
            <div><kbd>Ctrl+S</kbd> Salvar</div>
            <div><kbd>Ctrl+Z</kbd> Desfazer</div>
            <div><kbd>Ctrl+Y</kbd> Refazer</div>
            <div><kbd>Ctrl+D</kbd> Duplicar página</div>
            <div><kbd>Ctrl+V</kbd> Colar imagem</div>
            <div><kbd>Ctrl+/</kbd> Este painel</div>
            <div><kbd>Ctrl+T</kbd> Alternar idioma 🇧🇷↔🇺🇸</div>
            <div><kbd>Del</kbd> Remover seleção</div>
            <div><kbd>Esc</kbd> Desselecionar / Fechar</div>
            <div><kbd>←</kbd> Página anterior</div>
            <div><kbd>→</kbd> Próxima página</div>
            <div><kbd>Space</kbd> Modo pan (segurar)</div>
          </div>
          <div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border);color:var(--text3);font-size:11px;">
            Nos quadros: <b>Arraste</b> p/ mover imagem • <b>Scroll</b> p/ zoom • <b>Clique direito</b> p/ opções<br>
            Multi-idioma: use o seletor na toolbar ou <kbd>Ctrl+T</kbd> para alternar PT↔EN
          </div>
        </div>`;
        backdrop.classList.add('visible');
    },

    toggleFullscreenPreview() {
        const existing = document.getElementById('fullscreen-preview');
        if (existing) { existing.remove(); return; }
        const el = document.getElementById('canvas-page');
        if (!el) return;
        const overlay = document.createElement('div');
        overlay.id = 'fullscreen-preview';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#111;display:flex;align-items:center;justify-content:center;cursor:pointer;';
        overlay.tabIndex = 0;
        const closePreview = () => overlay.remove();
        overlay.onclick = () => closePreview();
        overlay.onkeydown = (event) => {
            const key = (event.key || '').toLowerCase();
            if (key === 'escape' || key === 'f') {
                event.preventDefault();
                closePreview();
            }
        };
        const clone = el.cloneNode(true);
        clone.style.transform = 'none';
        clone.style.position = 'relative';
        clone.style.left = 'auto';
        clone.style.top = 'auto';
        const vw = window.innerWidth * 0.9, vh = window.innerHeight * 0.9;
        const pw = el.offsetWidth, ph = el.offsetHeight;
        const s = Math.min(vw / pw, vh / ph);
        clone.style.transform = `scale(${s})`;
        clone.style.transformOrigin = 'center center';
        const ft = clone.querySelector('.canvas-float-tools');
        if (ft) ft.remove();
        clone.querySelectorAll('[style*="pointer-events:none"]').forEach(e => { if (e.textContent.match(/^\d+$/)) e.style.display = 'none'; });
        const frame = document.createElement('div');
        frame.className = 'fullscreen-preview-frame';
        frame.onclick = (event) => event.stopPropagation();
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'fullscreen-preview-close';
        closeBtn.textContent = typeof t === 'function' ? t('common.close') : 'Close';
        closeBtn.onclick = (event) => {
            event.stopPropagation();
            closePreview();
        };
        const hint = document.createElement('div');
        hint.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);color:#888;font-size:12px;pointer-events:none;';
        hint.textContent = this.isMobile() ? '' : 'Clique ou pressione F para sair • ← → para navegar';
        frame.appendChild(closeBtn);
        frame.appendChild(clone);
        overlay.appendChild(frame);
        if (hint.textContent) overlay.appendChild(hint);
        document.body.appendChild(overlay);
        overlay.focus();
    },
    async doExport() {
        const p = Store.get('currentProject'); if (!p) return;
        const bar = document.getElementById('export-bar'), status = document.getElementById('export-status'), prog = document.getElementById('export-progress'), btn = document.getElementById('export-btn');
        if (prog) prog.classList.remove('hidden'); if (btn) btn.disabled = true;
        const vp = this._viewport;
        const savedVP = { x: vp.x, y: vp.y, scale: vp.scale };
        try {
            const oldBleed = Store.get('showBleed'), oldReading = Store.get('showReadingOrder');
            vp.scale = 1; vp.x = 0; vp.y = 0; this._applyViewportTransform();
            Store.set({ showGuides: false, showBleed: false, showReadingOrder: false, selectedSlot: -1, selectedElement: null });
            if (this._exportFormat === 'pdf') await this._exportPDF(p, bar, status);
            else if (this._exportFormat === 'png' || this._exportFormat === 'jpg') await this._exportImages(p, this._exportFormat, bar, status);
            else if (this._exportFormat === 'html') await this._exportHTML(p, bar, status);
            else if (this._exportFormat === 'video') await this._exportVideo(p, bar, status);
            vp.x = savedVP.x; vp.y = savedVP.y; vp.scale = savedVP.scale; this._applyViewportTransform();
            Store.set({ showGuides: true, showBleed: oldBleed, showReadingOrder: oldReading });

            if (this._exportFormat !== 'video') {
                Toast.show('Exportado!', 'success'); setTimeout(() => this.closeModal(), 1000);
            }
        } catch (err) { Toast.show('Erro: ' + err.message, 'error'); vp.x = savedVP.x; vp.y = savedVP.y; vp.scale = savedVP.scale; this._applyViewportTransform(); }
        if (btn) btn.disabled = false;
    },
    async _exportPDF(project, bar, status) {
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [A4.W, A4.H] });
        
        for (let i = 0; i < project.pages.length; i++) {
            if (status) status.textContent = `Pagina ${i + 1}/${project.pages.length}...`;
            if (bar) bar.style.width = `${((i + 1) / project.pages.length) * 100}%`;
            Store.set({ activePageIndex: i }); 
            renderCanvas(); 
            await new Promise(r => setTimeout(r, 400));
            
            const el = document.getElementById('canvas-page');
            if (!el) continue;
            
            // Hide floating tools and selection UI for clean export
            const floatTools = el.querySelector('.canvas-float-tools');
            const floatProps = el.querySelector('.floating-props-toolbar');
            const selections = el.querySelectorAll('.balloon-selection, .balloon-resize-handle, .panel-mini-toolbar, .panel-selector-fixed, .gutter-handle, .narrative-resize-handle');
            if (floatTools) floatTools.style.display = 'none';
            if (floatProps) floatProps.style.display = 'none';
            selections.forEach(s => s.style.display = 'none');
            
            try {
                const canvas = await html2canvas(el, { scale: this._exportScale || 2, useCORS: true, allowTaint: true, backgroundColor: '#fff' });
                const imgData = canvas.toDataURL('image/jpeg', 0.92);
                if (i > 0) doc.addPage([A4.W, A4.H]);
                // Canvas already includes margins, so place at 0,0 filling full page
                doc.addImage(imgData, 'JPEG', 0, 0, A4.W, A4.H);
            } catch (err) {
                console.error('Error rendering page', i, err);
            }
            
            if (floatTools) floatTools.style.display = '';
            if (floatProps) floatProps.style.display = '';
            selections.forEach(s => s.style.display = '');
        }
        doc.save(`${project.metadata.name}.pdf`);
    },
    async _exportImages(project, fmt, bar, status) {
        const zip = new JSZip();
        for (let i = 0; i < project.pages.length; i++) {
            if (status) status.textContent = `Pagina ${i + 1}/${project.pages.length}...`;
            if (bar) bar.style.width = `${((i + 1) / project.pages.length) * 100}%`;
            Store.set({ activePageIndex: i }); renderCanvas(); await new Promise(r => setTimeout(r, 300));
            const el = document.getElementById('canvas-page');
            const ft = el ? el.querySelector('.canvas-float-tools') : null;
            if (ft) ft.style.display = 'none';
            if (el) { const c = await html2canvas(el, { scale: this._exportScale || 2, useCORS: true, backgroundColor: '#fff' }); const b = await new Promise(r => c.toBlob(r, fmt === 'png' ? 'image/png' : 'image/jpeg', 0.92)); zip.file(`pagina-${String(i + 1).padStart(3, '0')}.${fmt}`, b); }
            if (ft) ft.style.display = '';
        }
        const zb = await zip.generateAsync({ type: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(zb); a.download = `${project.metadata.name}.zip`; a.click(); URL.revokeObjectURL(a.href);
    },
    async _exportHTML(project, bar, status) {
        let pages = '';
        for (let i = 0; i < project.pages.length; i++) {
            if (status) status.textContent = `Pagina ${i + 1}/${project.pages.length}...`;
            if (bar) bar.style.width = `${((i + 1) / project.pages.length) * 100}%`;
            Store.set({ activePageIndex: i }); renderCanvas(); await new Promise(r => setTimeout(r, 300));
            const el = document.getElementById('canvas-page');
            if (el) { const c = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: '#fff' }); const u = c.toDataURL('image/jpeg', 0.85); pages += `<div class="pg" ${i > 0 ? 'style="display:none"' : ''}data-p="${i}"><img src="${u}" style="max-width:100%;height:auto"></div>`; }
        }
        const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${project.metadata.name}</title><style>*{margin:0;box-sizing:border-box}body{font-family:sans-serif;background:#111;display:flex;justify-content:center;min-height:100vh;padding:20px}.pg{max-width:800px}.nav{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:8px;background:rgba(0,0,0,.8);padding:8px 16px;border-radius:99px}.nav button{border:none;background:#333;color:#fff;padding:6px 16px;border-radius:6px;cursor:pointer}.cnt{position:fixed;bottom:60px;left:50%;transform:translateX(-50%);color:#888;font-size:12px}</style></head><body>${pages}<div class="nav"><button onclick="go(-1)">Anterior</button><button onclick="go(1)">Proxima</button></div><div class="cnt" id="c">1 / ${project.pages.length}</div><script>let c=0;const ps=document.querySelectorAll('.pg');function go(d){ps[c].style.display='none';c=Math.max(0,Math.min(ps.length-1,c+d));ps[c].style.display='';document.getElementById('c').textContent=(c+1)+' / '+ps.length;}</script></body></html>`;
        const b = new Blob([html], { type: 'text/html' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${project.metadata.name}.html`; a.click(); URL.revokeObjectURL(a.href);
    },
    async _exportVideo(project, bar, status) {
        if (status) status.textContent = 'Renderizando Video...';
        if (bar) bar.style.width = '10%';
        const canvas = document.createElement('canvas');
        canvas.width = 1200; // Output resolution HD
        canvas.height = Math.round(1200 / A4.RATIO);
        const ctx = canvas.getContext('2d');
        const stream = canvas.captureStream(30);

        let audioCtx, dest, source;
        if (project.settings.audio) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                dest = audioCtx.createMediaStreamDestination();
                stream.addTrack(dest.stream.getAudioTracks()[0]);
                const a = new Audio(project.settings.audio.data);
                source = audioCtx.createMediaElementSource(a);
                source.connect(dest);
                source.connect(audioCtx.destination); // to hear while recording
                a.play();
            } catch (e) { console.warn("Audio failure for video", e); }
        }

        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];
        recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        recorder.onstop = () => {
            const b = new Blob(chunks, { type: 'video/webm' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${project.metadata.name}.webm`; a.click(); URL.revokeObjectURL(a.href);
            Toast.show('Video Exportado!', 'success');
            App.closeModal();
        };
        recorder.start();

        const durationPerPage = project.settings.audio?.durationPerPage || 3;
        const totalDuration = project.pages.length * durationPerPage;
        const fps = 30;

        for (let i = 0; i < project.pages.length; i++) {
            Store.set({ activePageIndex: i }); renderCanvas(); await new Promise(r => setTimeout(r, 400));
            const el = document.getElementById('canvas-page');
            const pageCanvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: '#fff' });

            // Draw page repeatedly for duration
            for (let f = 0; f < durationPerPage * fps; f++) {
                ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                // Scale to fit
                const sc = Math.min(canvas.width / pageCanvas.width, canvas.height / pageCanvas.height);
                const dw = pageCanvas.width * sc, dh = pageCanvas.height * sc;
                const dx = (canvas.width - dw) / 2, dy = (canvas.height - dh) / 2;
                ctx.drawImage(pageCanvas, dx, dy, dw, dh);

                if (bar) bar.style.width = `${Math.round(((i * fps * durationPerPage + f) / (totalDuration * fps)) * 100)}%`;
                if (status) status.textContent = `Video: Pagina ${i + 1}/${project.pages.length}...`;
                await new Promise(r => setTimeout(r, 1000 / fps));
            }
        }
        recorder.stop();
        if (audioCtx) audioCtx.close();
    },

    // ═══════════════════════════════════════════════════════════════
    // VISUAL EFFECTS SYSTEM — Per-image canvas-based effects
    // ═══════════════════════════════════════════════════════════════

    async selectEffect(effectName) {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        if (!page?.images?.[slot]?.src) return;
        Store.pushUndo();
        const img = page.images[slot];
        const intensity = img.effect?.intensity ?? 0.6;
        Toast.show('Aplicando efeito...');
        await applyEffect(img, effectName, intensity);
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },

    async setEffectIntensity(intensity) {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        const img = page?.images?.[slot];
        if (!img?.effect?.name) return;
        await applyEffect(img, img.effect.name, intensity);
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },

    async setHalftoneMode(colorMode) {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        const img = page?.images?.[slot];
        if (!img?.effect || img.effect.name !== 'halftone') return;
        img.effect.colorMode = colorMode;
        Toast.show('Aplicando efeito...');
        await applyEffect(img, 'halftone', img.effect.intensity, img.effect);
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },

    async setVintageMode(mode) {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        const img = page?.images?.[slot];
        if (!img?.effect || img.effect.name !== 'vintage') return;
        img.effect.vintageMode = mode;
        Toast.show('Aplicando efeito...');
        await applyEffect(img, 'vintage', img.effect.intensity, img.effect);
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },

    async setVHSMode(mode) {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        const img = page?.images?.[slot];
        if (!img?.effect || img.effect.name !== 'vhs') return;
        img.effect.vhsMode = mode;
        Toast.show('Aplicando efeito...');
        await applyEffect(img, 'vhs', img.effect.intensity, img.effect);
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },

    async setVintageColor(prop, color) {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        const img = page?.images?.[slot];
        if (!img?.effect || img.effect.name !== 'vintage' || img.effect.vintageMode !== 'sepia') return;
        img.effect[prop] = color;
        await applyEffect(img, 'vintage', img.effect.intensity, img.effect);
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },

    async setVintageVignetteIntensity(val) {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        const img = page?.images?.[slot];
        if (!img?.effect || img.effect.name !== 'vintage' || img.effect.vintageMode !== 'sepia') return;
        img.effect.vignetteIntensity = val;
        await applyEffect(img, 'vintage', img.effect.intensity, img.effect);
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },

    async setRisoColor(which, color) {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        const img = page?.images?.[slot];
        if (!img?.effect || img.effect.name !== 'vintage' || img.effect.vintageMode !== 'risograph') return;
        if (which === 1) img.effect.riso1 = color;
        else img.effect.riso2 = color;
        await applyEffect(img, 'vintage', img.effect.intensity, img.effect);
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
    },

    resetEffect() {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        const img = page?.images?.[slot];
        if (!img) return;
        Store.pushUndo();
        img.src = img.srcOriginal || img.src;
        img.effect = null;
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        renderRightPanel();
        Toast.show('Efeito removido');
    },

    async applyEffectToAll() {
        const p = Store.get('currentProject');
        const slot = Store.get('selectedSlot');
        const page = Store.getActivePage();
        const img = page?.images?.[slot];
        if (!img?.effect?.name) return;
        Store.pushUndo();
        const { name, intensity } = img.effect;
        const opts = { ...img.effect };
        let count = 0;
        for (const pg of p.pages) {
            for (const image of (pg.images || [])) {
                if (image?.src) {
                    await applyEffect(image, name, intensity, opts);
                    count++;
                }
            }
        }
        Store.set({ currentProject: p });
        Store.save();
        renderCanvas();
        Toast.show(`Efeito aplicado em ${count} painéis`, 'success');
    },

    // ═══════════════════════════════════════════════════════════════
    // TEXT SYSTEM — Floating Toolbar + Contextual Sidebar
    // ═══════════════════════════════════════════════════════════════

    _activeTextZone: null,    // { element, zoneType, pageId }
    _toolbarHideTimer: null,

    showFloatingTextToolbar(zoneElement, zoneType) {
        const toolbar = document.getElementById('floating-text-toolbar');
        if (!toolbar || !zoneElement) return;

        this._activeTextZone = { element: zoneElement, zoneType };

        // Position dynamically above the element
        const updatePosition = () => {
            if (!this._activeTextZone) return;
            const rect = zoneElement.getBoundingClientRect();
            const toolbarRect = toolbar.getBoundingClientRect();
            const toolbarW = toolbarRect.width || 360;
            const toolbarH = toolbarRect.height || 120;
            let left = rect.left + (rect.width - toolbarW) / 2;
            let top = rect.top - toolbarH - 12;

            // Keep within viewport
            left = Math.max(8, Math.min(left, window.innerWidth - toolbarW - 8));
            if (top < 8) top = rect.bottom + 8;

            toolbar.style.left = left + 'px';
            toolbar.style.top = top + 'px';
        };

        updatePosition();
        toolbar.classList.add('visible');

        // Update position on scroll/resize
        if (this._toolbarPositionHandler) {
            window.removeEventListener('scroll', this._toolbarPositionHandler, true);
            window.removeEventListener('resize', this._toolbarPositionHandler);
        }
        this._toolbarPositionHandler = updatePosition;
        window.addEventListener('scroll', this._toolbarPositionHandler, { capture: true, passive: true });
        window.addEventListener('resize', this._toolbarPositionHandler, { passive: true });

        // Populate toolbar with current values
        this._syncToolbarValues(zoneType);

        // Mark zone as selected
        document.querySelectorAll('.text-zone-selected').forEach(el => el.classList.remove('text-zone-selected'));
        zoneElement.classList.add('text-zone-selected');
    },

    hideFloatingTextToolbar() {
        const toolbar = document.getElementById('floating-text-toolbar');
        if (toolbar) {
            toolbar.classList.remove('visible');
        }
        // Clean up listeners
        if (this._toolbarPositionHandler) {
            window.removeEventListener('scroll', this._toolbarPositionHandler, true);
            window.removeEventListener('resize', this._toolbarPositionHandler);
            this._toolbarPositionHandler = null;
        }
        document.querySelectorAll('.text-zone-selected').forEach(el => el.classList.remove('text-zone-selected'));
        this._activeTextZone = null;
    },

    _syncToolbarValues(zoneType) {
        const page = Store.getActivePage();
        if (!page) return;

        let style;
        if (zoneType === 'narrativa') {
            style = page.narrativeStyle || { font: 'serif', size: 48, align: 'justify', color: '#ffffff', textColor: '#ffffff' };
        } else {
            const zones = page.materiaZones || {};
            const zone = zones[zoneType] || {};
            style = zone.style || { font: 'serif', size: 48, align: 'left', color: '#222222' };
        }

        const toolbar = document.getElementById('floating-text-toolbar');
        if (!toolbar) return;

        const fontSel = toolbar.querySelector('[data-ft="font"]');
        if (fontSel) fontSel.value = style.font || 'serif';

        const sizeSel = toolbar.querySelector('[data-ft="size"]');
        const sizeSlider = toolbar.querySelector('[data-ft="size-slider"]');
        if (sizeSel) {
            const currentSize = Math.max(12, Math.min(250, parseInt(style.size, 10) || 48));
            sizeSel.value = currentSize;
            sizeSel.setAttribute('value', currentSize);
            if (sizeSlider) {
                sizeSlider.value = currentSize;
                sizeSlider.setAttribute('value', currentSize);
            }
        }

        const boldBtn = toolbar.querySelector('[data-ft="bold"]');
        if (boldBtn) boldBtn.classList.toggle('active', !!style.bold);

        const italicBtn = toolbar.querySelector('[data-ft="italic"]');
        if (italicBtn) italicBtn.classList.toggle('active', !!style.italic);

        const underlineBtn = toolbar.querySelector('[data-ft="underline"]');
        if (underlineBtn) underlineBtn.classList.toggle('active', !!style.underline);

        toolbar.querySelectorAll('[data-ft-align]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ftAlign === (style.align || 'left'));
        });

    },

    // Called by floating toolbar controls
    ftSetFont(value) {
        this._applyTextStyle('font', value);
    },
    ftSetSize(value) {
        const nextValue = Math.max(12, Math.min(250, parseInt(value, 10) || 48));
        this._applyTextStyle('size', nextValue);
    },
    ftSyncSizeFromSlider(value) {
        const toolbar = document.getElementById('floating-text-toolbar');
        const numberInput = toolbar?.querySelector('[data-ft="size"]');
        if (numberInput) numberInput.value = value;
        this.ftSetSize(value);
    },
    ftSyncSizeFromInput(value) {
        const nextValue = Math.max(12, Math.min(250, parseInt(value, 10) || 48));
        const toolbar = document.getElementById('floating-text-toolbar');
        const slider = toolbar?.querySelector('[data-ft="size-slider"]');
        if (slider) slider.value = nextValue;
        this.ftSetSize(nextValue);
    },
    ftToggleBold() {
        const zone = this._activeTextZone;
        if (!zone) return;
        const style = this._getActiveZoneStyle();
        this._applyTextStyle('bold', !style.bold);
    },
    ftToggleItalic() {
        const zone = this._activeTextZone;
        if (!zone) return;
        const style = this._getActiveZoneStyle();
        this._applyTextStyle('italic', !style.italic);
    },
    ftToggleUnderline() {
        const zone = this._activeTextZone;
        if (!zone) return;
        const style = this._getActiveZoneStyle();
        this._applyTextStyle('underline', !style.underline);
    },
    ftSetAlign(value) {
        this._applyTextStyle('align', value);
    },
    ftSetColor(value) {
        this._applyTextStyle('color', value);
    },

    _getActiveZoneStyle() {
        const page = Store.getActivePage();
        if (!page || !this._activeTextZone) return {};
        const zoneType = this._activeTextZone.zoneType;

        if (zoneType === 'narrativa') {
            return page.narrativeStyle || { font: 'serif', size: 48, align: 'justify', color: '#ffffff', textColor: '#ffffff', leading: 1.4 };
        }
        const zones = page.materiaZones || {};
        const zone = zones[zoneType] || {};
        return zone.style || { font: 'serif', size: 16, align: 'left', color: '#222222' };
    },

    _applyTextStyle(property, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page || !this._activeTextZone) return;

        const zoneType = this._activeTextZone.zoneType;
        if (zoneType.startsWith('materia-')) {
            Store.pushUndoSilent();
        } else {
            Store.pushUndo();
        }

        if (zoneType === 'narrativa') {
            const settings = this._ensureNarrativeSettings(p);
            if (!page.narrativeStyle) page.narrativeStyle = { font: 'serif', size: 48, align: 'justify', color: '#ffffff', textColor: '#ffffff', leading: 1.4 };
            let nextValue = value;
            if (property === 'size') nextValue = Math.max(12, Math.min(250, parseInt(value, 10) || 48));
            if (property === 'leading') nextValue = Math.max(0.8, Math.min(3, parseFloat(value) || 1.4));
            page.narrativeStyle[property] = nextValue;
            if (property === 'color') page.narrativeStyle.textColor = nextValue;
            if (settings.fontSizeLocked && property === 'size') {
                p.pages.forEach(pg => {
                    if (!pg.narrativeStyle) pg.narrativeStyle = { font: 'serif', size: 48, align: 'justify', color: '#ffffff', textColor: '#ffffff', leading: 1.4 };
                    pg.narrativeStyle.size = nextValue;
                });
            }
        } else {
            if (!page.materiaZones) page.materiaZones = {};
            if (!page.materiaZones[zoneType]) page.materiaZones[zoneType] = { style: {} };
            if (!page.materiaZones[zoneType].style) page.materiaZones[zoneType].style = {};
            page.materiaZones[zoneType].style[property] = value;
        }

        Store.setSilent({ currentProject: p }); Store.save();

        // Apply directly to DOM when possible to preserve focus
        const el = this._activeTextZone?.element;
        if (el && el.isConnected && zoneType.startsWith('materia-')) {
            const fullStyle = page.materiaZones[zoneType].style;
            this._applyMateriaInlineStyle(el, zoneType, fullStyle);
        } else {
            renderCanvas();
            this._reacquireTextZone(zoneType);
        }

        this._syncToolbarValues(zoneType);
        if (zoneType.startsWith('materia-')) {
            this._refreshMateriaSidebar(zoneType);
        } else {
            this.showTextContextPanel(zoneType);
        }
    },

    // ── Contextual Sidebar Panel ──
    showTextContextPanel(zoneType) {
        const el = document.getElementById('right-panel-content');
        if (!el) return;

        // Store active text zone type — use setSilent to avoid triggering render() which destroys DOM/focus
        Store.setSilent({ activeTextZone: zoneType });

        let panelHtml = '';
        if (zoneType === 'narrativa') {
            panelHtml = renderTextNarrativaPanel();
        } else if (zoneType.startsWith('materia-')) {
            panelHtml = renderTextMateriaPanel(zoneType);
        }

        // Find or create the text panel container at the top of right panel
        let container = el.querySelector('#sidebar-text-context');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sidebar-text-context';
            // Insert after the scrollable div's opening
            const scrollDiv = el.querySelector('div');
            if (scrollDiv) {
                scrollDiv.insertBefore(container, scrollDiv.firstChild);
            } else {
                el.insertBefore(container, el.firstChild);
            }
        }
        container.innerHTML = panelHtml;
    },

    hideTextContextPanel() {
        Store.setSilent({ activeTextZone: null });
        this._activeTextZone = null;
        const container = document.getElementById('sidebar-text-context');
        if (container) container.innerHTML = '';
    },

    // ── Narrativa Style Methods (used by sidebar panels) ──
    setNarrativaFont(value) { this.setNarrativeStyle('font', value); },
    setNarrativaSize(value) { this.setNarrativeStyle('size', value); },
    setNarrativaAlign(value) { this.setNarrativeStyle('align', value); },
    setNarrativaColor(value) { this.setNarrativeStyle('color', value); },
    setNarrativaLeading(value) { this.setNarrativeStyle('leading', value); },
    setNarrativaHeight(h) { this.setNarrativeHeight(h); },
    toggleNarrativaStyle(prop) {
        const page = Store.getActivePage();
        if (!page) return;
        const style = page.narrativeStyle || {};
        this.setNarrativeStyle(prop, !style[prop]);
    },
    _applyNarrativaStyle(property, value) {
        this.setNarrativeStyle(property, value);
    },
    applyNarrativaToAll() {
        this.applyNarrativeToAll();
    },

    // ── Matéria Style Methods (used by sidebar panels) ──
    setMateriaFont(zoneType, value) { this._applyMateriaStyle(zoneType, 'font', value); },
    setMateriaSize(zoneType, value) { this._applyMateriaStyle(zoneType, 'size', parseInt(value)); },
    setMateriaWeight(zoneType, value) { this._applyMateriaStyle(zoneType, 'weight', parseInt(value)); },
    setMateriaUppercase(zoneType, value) { this._applyMateriaStyle(zoneType, 'uppercase', value); },
    setMateriaColumns(zoneType, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndoSilent();
        if (!page.materiaZones) page.materiaZones = {};
        if (!page.materiaZones[zoneType]) page.materiaZones[zoneType] = {};
        page.materiaZones[zoneType].columns = value;
        Store.setSilent({ currentProject: p }); Store.save();
        renderCanvas();
        this._reacquireTextZone(zoneType);
        this._refreshMateriaSidebar(zoneType);
    },
    setMateriaColumnGap(zoneType, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndoSilent();
        if (!page.materiaZones) page.materiaZones = {};
        if (!page.materiaZones[zoneType]) page.materiaZones[zoneType] = {};
        page.materiaZones[zoneType].columnGap = value;
        Store.setSilent({ currentProject: p }); Store.save();
        // Apply directly to DOM
        const el = document.querySelector('[data-materia-col^="col_"]');
        if (el) el.style.columnGap = value + 'px';
    },
    setMateriaDropCap(zoneType, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndoSilent();
        if (!page.materiaZones) page.materiaZones = {};
        if (!page.materiaZones[zoneType]) page.materiaZones[zoneType] = {};
        page.materiaZones[zoneType].dropCap = value;
        Store.setSilent({ currentProject: p }); Store.save();
        renderCanvas();
        this._reacquireTextZone(zoneType);
        this._refreshMateriaSidebar(zoneType);
    },
    setMateriaIndent(zoneType, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndoSilent();
        if (!page.materiaZones) page.materiaZones = {};
        if (!page.materiaZones[zoneType]) page.materiaZones[zoneType] = {};
        page.materiaZones[zoneType].indent = value;
        Store.setSilent({ currentProject: p }); Store.save();
        renderCanvas();
        this._reacquireTextZone(zoneType);
        this._refreshMateriaSidebar(zoneType);
    },
    setMateriaLeading(zoneType, value) { this._applyMateriaStyle(zoneType, 'leading', value); },
    setMateriaColor(zoneType, value) { this._applyMateriaStyle(zoneType, 'color', value); },
    setMateriaAlign(zoneType, value) { this._applyMateriaStyle(zoneType, 'align', value); },

    _applyMateriaStyle(zoneType, property, value) {
        const p = Store.get('currentProject'), page = Store.getActivePage();
        if (!p || !page) return;
        Store.pushUndoSilent();
        if (!page.materiaZones) page.materiaZones = {};
        if (!page.materiaZones[zoneType]) page.materiaZones[zoneType] = { style: {} };
        if (!page.materiaZones[zoneType].style) page.materiaZones[zoneType].style = {};
        page.materiaZones[zoneType].style[property] = value;
        Store.setSilent({ currentProject: p }); Store.save();

        // Apply style directly to the active element if possible (avoids full re-render flicker)
        const el = this._activeTextZone?.element;
        if (el && el.isConnected) {
            const fullStyle = page.materiaZones[zoneType].style;
            this._applyMateriaInlineStyle(el, zoneType, fullStyle);
        } else {
            renderCanvas();
            this._reacquireTextZone(zoneType);
        }

        this._refreshMateriaSidebar(zoneType);
    },

    _applyMateriaInlineStyle(el, zoneType, style) {
        if (!el || !style) return;
        const fontMap = { serif: "'Lora','Georgia',serif", sans: "'Inter','Instrument Sans',sans-serif", comic: "'Bangers',cursive", display: "'Playfair Display',serif", mono: "'Courier New',monospace", marker: "'Permanent Marker',cursive" };
        if (style.font) el.style.fontFamily = fontMap[style.font] || fontMap.serif;
        if (style.size) el.style.fontSize = style.size + 'px';
        if (style.weight && zoneType === 'materia-titulo') el.style.fontWeight = style.weight;
        if (style.color) el.style.color = style.color;
        if (style.align) el.style.textAlign = style.align;
        if (style.leading) el.style.lineHeight = String(style.leading);
        if (style.uppercase !== undefined) el.style.textTransform = style.uppercase ? 'uppercase' : 'none';
        if (style.letterSpacing) el.style.letterSpacing = style.letterSpacing;
    },

    _reacquireTextZone(zoneType) {
        let newEl = null;
        if (zoneType === 'materia-titulo') {
            newEl = document.querySelector('[data-materia-title]');
        } else if (zoneType === 'materia-subtitulo') {
            newEl = document.querySelector('[data-materia-col="subtitulo"]');
        } else if (zoneType === 'materia-coluna') {
            newEl = document.querySelector('[data-materia-col^="col_"]');
        } else if (zoneType === 'materia-legenda') {
            newEl = document.querySelector('[data-materia-col^="caption_"]');
        } else if (zoneType === 'narrativa') {
            newEl = document.querySelector('.text-below-content');
        }
        if (newEl && this._activeTextZone) {
            this._activeTextZone.element = newEl;
            newEl.classList.add('text-zone-selected');
        }
    },

    _refreshMateriaSidebar(zoneType) {
        const rpContent = document.getElementById('right-panel-content');
        if (!rpContent) return;
        let container = rpContent.querySelector('#sidebar-text-context');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sidebar-text-context';
            const scrollDiv = rpContent.querySelector('div');
            if (scrollDiv) {
                scrollDiv.insertBefore(container, scrollDiv.firstChild);
            } else {
                rpContent.insertBefore(container, rpContent.firstChild);
            }
        }
        container.innerHTML = renderTextMateriaPanel(zoneType);
        if (this._activeTextZone?.zoneType === zoneType) {
            this._syncToolbarValues(zoneType);
        }
        this._materiaSidebarProtectUntil = Date.now() + 100;
    },

    // ── Text Zone Click Handler (called from canvas) ──
    handleTextZoneClick(element, zoneType) {
        // Show floating toolbar
        this.showFloatingTextToolbar(element, zoneType);
        // Show contextual sidebar panel
        this.showTextContextPanel(zoneType);
    },

    // ── Click outside handler ──
    handleCanvasBackgroundClick() {
        if (this._activeTextZone) {
            this.hideFloatingTextToolbar();
            this.hideTextContextPanel();
        }
    },

    // ═══════════════════════════════════════════════════════════
    //  BULK TEXT IMPORT
    // ═══════════════════════════════════════════════════════════

    _bulkTextSegments: [],

    showBulkTextModal() {
        const container = document.createElement('div');
        container.id = 'bulk-text-modal-root';
        container.innerHTML = renderBulkTextModal();
        document.body.appendChild(container);
    },

    closeBulkTextModal() {
        const root = document.getElementById('bulk-text-modal-root');
        if (root) root.remove();
        this._bulkTextSegments = [];
    },

    _bulkTextPreview() {
        const textarea = document.getElementById('bulk-text-input');
        const feedbackEl = document.getElementById('bulk-text-feedback');
        const previewEl = document.getElementById('bulk-text-preview');
        const statsEl = document.getElementById('bulk-text-stats-text');
        const warningsEl = document.getElementById('bulk-text-warnings');
        const btn = document.getElementById('bulk-text-create-btn');
        const bilingualHelp = document.getElementById('bulk-text-bilingual-help');
        if (!textarea) return;

        // Detect selected language mode
        const langRadio = document.querySelector('input[name="bulk-text-lang"]:checked');
        const langMode = langRadio ? langRadio.value : 'single-pt';
        const isBilingual = langMode === 'bilingual';
        this._bulkTextLangMode = langMode;

        // Show/hide bilingual help
        if (bilingualHelp) bilingualHelp.style.display = isBilingual ? 'block' : 'none';

        // Update placeholder
        if (isBilingual) {
            textarea.placeholder = 'PT: Era uma vez um herói...\nEN: Once upon a time a hero...\n\nPT: Ele viajou pelo mundo.\nEN: He traveled the world.';
        } else {
            textarea.placeholder = 'Cole seu texto aqui...\n\nSepare cada parte com uma linha em branco.\nCada bloco de texto vira uma página.';
        }

        const text = textarea.value.trim();
        const MAX = BulkTextImporter.MAX_CHARS_PER_PAGE;

        // ── STATE 1: Empty ──
        if (!text) {
            if (feedbackEl) {
                feedbackEl.className = 'bulk-feedback bulk-feedback-empty';
                feedbackEl.innerHTML = `<span class="bulk-feedback-icon">${Icons.info}</span><span>Separe cada parte com uma <strong>linha em branco</strong> entre elas</span>`;
            }
            if (previewEl) previewEl.innerHTML = `<div class="bulk-preview-empty"><div style="font-size:32px;opacity:0.3;margin-bottom:8px;">${Icons.file}</div><div style="font-size:12px;color:var(--text4);">As páginas detectadas aparecerão aqui</div></div>`;
            if (statsEl) statsEl.textContent = 'Nenhuma página detectada';
            if (warningsEl) warningsEl.style.display = 'none';
            if (btn) { btn.disabled = true; btn.textContent = 'Criar 0 Páginas'; }
            this._bulkTextSegments = [];
            this._bulkTextBilingual = false;
            return;
        }

        let segments;
        let totalWords, totalChars;
        const warnings = [];

        if (isBilingual) {
            // ── BILINGUAL MODE ──
            segments = BulkTextImporter.parseBilingual(text);
            this._bulkTextSegments = segments;
            this._bulkTextBilingual = true;
            totalWords = segments.reduce((s, seg) => s + seg.wordCount, 0);
            totalChars = segments.reduce((s, seg) => s + seg.charCount, 0);

            // Auto-detect if text has PT:/EN: markers
            const hasMarkers = BulkTextImporter.detectBilingual(text);
            if (!hasMarkers) {
                warnings.push('Não detectei marcadores PT:/EN: — use "PT: texto" e "EN: text" no início das linhas');
            }
            segments.forEach((seg, i) => {
                if (!seg.pt) warnings.push(`Página ${i + 1}: sem texto PT-BR`);
                if (!seg.en) warnings.push(`Página ${i + 1}: sem texto EN`);
            });

            if (feedbackEl) {
                if (hasMarkers && segments.length > 0) {
                    feedbackEl.className = 'bulk-feedback bulk-feedback-ok';
                    feedbackEl.innerHTML = `<span class="bulk-feedback-icon">${Icons.check}</span><span>🌐 Bilíngue OK — ${segments.length} páginas (PT+EN)</span>`;
                } else {
                    feedbackEl.className = 'bulk-feedback bulk-feedback-warn';
                    feedbackEl.innerHTML = `<span class="bulk-feedback-icon">${Icons.alert}</span><span>Use formato: PT: texto...<br>EN: translation...</span>`;
                }
            }

            // ── Bilingual Preview cards ──
            if (previewEl) {
                previewEl.innerHTML = segments.map(seg => {
                    const ptTrunc = seg.pt.length > 60 ? seg.pt.substring(0, 60) + '...' : seg.pt;
                    const enTrunc = seg.en.length > 60 ? seg.en.substring(0, 60) + '...' : seg.en;
                    const hasBoth = seg.pt && seg.en;
                    const statusClass = hasBoth ? '' : 'bulk-card-warn';
                    return `
                    <div class="bulk-preview-card ${statusClass}">
                        <div class="bulk-card-header">
                            <span class="bulk-card-num">${seg.index + 1}</span>
                            <span class="bulk-card-chars" style="color:#00d4ff;">🌐 ${seg.charCount} chars</span>
                        </div>
                        <div class="bulk-card-text" style="font-size:10px;">
                            <div style="color:#00d4ff;font-weight:600;margin-bottom:2px;">PT: ${(ptTrunc || '—').replace(/</g, '&lt;')}</div>
                            <div style="color:#a0aec0;opacity:0.8;">EN: ${(enTrunc || '—').replace(/</g, '&lt;')}</div>
                        </div>
                    </div>`;
                }).join('');
            }
        } else {
            // ── SINGLE LANGUAGE MODE (existing logic) ──
            this._bulkTextBilingual = false;

            // Check if text has paragraph breaks
            const hasBreaks = /\n\s*\n/.test(textarea.value) || textarea.value.includes(BulkTextImporter.PAGE_BREAK_MARKER);
            const rawParagraphs = textarea.value.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);

            if (!hasBreaks && rawParagraphs.length === 1) {
                if (feedbackEl) {
                    feedbackEl.className = 'bulk-feedback bulk-feedback-warn';
                    feedbackEl.innerHTML = `<span class="bulk-feedback-icon">${Icons.alert}</span><span>Bloco contínuo detectado. Adicione <strong>linhas vazias</strong> entre as partes para criar múltiplas páginas.</span>`;
                }
            } else {
                if (feedbackEl) {
                    feedbackEl.className = 'bulk-feedback bulk-feedback-ok';
                    feedbackEl.innerHTML = `<span class="bulk-feedback-icon">${Icons.check}</span><span>Formatação OK — ${rawParagraphs.length} blocos detectados</span>`;
                }
            }

            segments = BulkTextImporter.parse(text);
            this._bulkTextSegments = segments;
            totalWords = segments.reduce((s, seg) => s + seg.wordCount, 0);
            totalChars = segments.reduce((s, seg) => s + seg.charCount, 0);

            rawParagraphs.forEach((p, i) => {
                if (p.length > MAX) {
                    const splitCount = Math.ceil(p.length / MAX);
                    warnings.push(`Bloco ${i + 1} (${p.length} chars) será dividido em ${splitCount} páginas`);
                }
            });
            segments.forEach((seg, i) => {
                if (seg.charCount < 10) warnings.push(`Página ${i + 1} muito curta (${seg.charCount} chars)`);
            });

            // ── Preview cards (single lang) ──
            if (previewEl) {
                previewEl.innerHTML = segments.map(seg => {
                    const isLong = seg.charCount > MAX;
                    const isShort = seg.charCount < 10;
                    const statusClass = isLong ? 'bulk-card-warn' : isShort ? 'bulk-card-short' : '';
                    const charBar = Math.min(100, Math.round((seg.charCount / MAX) * 100));
                    const truncText = seg.text.length > 90 ? seg.text.substring(0, 90) + '...' : seg.text;
                    return `
                    <div class="bulk-preview-card ${statusClass}">
                        <div class="bulk-card-header">
                            <span class="bulk-card-num">${seg.index + 1}</span>
                            <span class="bulk-card-chars">${seg.charCount} chars</span>
                        </div>
                        <div class="bulk-card-text">${truncText.replace(/</g, '&lt;')}</div>
                        <div class="bulk-card-bar"><div class="bulk-card-bar-fill" style="width:${charBar}%;"></div></div>
                    </div>`;
                }).join('');
            }
        }

        // ── Stats bar (shared) ──
        if (statsEl) {
            const modeLabel = isBilingual ? ' (bilíngue)' : '';
            statsEl.textContent = `${segments.length} ${segments.length === 1 ? 'página' : 'páginas'}${modeLabel} · ${totalWords} palavras · ${totalChars} chars`;
        }

        // ── Warnings (shared) ──
        if (warningsEl) {
            if (warnings.length > 0) {
                warningsEl.style.display = 'block';
                warningsEl.innerHTML = warnings.map(w => `<div class="bulk-warning-item">${Icons.alert} ${w}</div>`).join('');
            } else {
                warningsEl.style.display = 'none';
            }
        }

        // ── Button (shared) ──
        if (btn) {
            btn.disabled = segments.length === 0;
            btn.textContent = isBilingual ? `Criar ${segments.length} Páginas (PT+EN)` : `Criar ${segments.length} Páginas`;
        }
    },

    _bulkTextInsertBreak() {
        const textarea = document.getElementById('bulk-text-input');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(textarea.selectionEnd);
        const marker = '\n\n━━━━━━━━━━━━━━━━━━━━\n\n';
        textarea.value = before + marker + after;
        textarea.selectionStart = textarea.selectionEnd = start + marker.length;
        textarea.focus();
        this._bulkTextPreview();
    },

    _bulkTextFillExample() {
        const textarea = document.getElementById('bulk-text-input');
        if (!textarea) return;
        const isBilingual = this._bulkTextLangMode === 'bilingual';
        if (isBilingual) {
            textarea.value = `PT: Era uma vez um herói corajoso que vivia em terras distantes.\nEN: Once upon a time a brave hero lived in distant lands.\n\nPT: Ele viajou pelo mundo em busca de aventura.\nEN: He traveled the world in search of adventure.\n\nPT: Encontrou um dragão feroz que guardava um tesouro milenar.\nEN: He found a fierce dragon guarding an ancient treasure.\n\nPT: Eles se tornaram amigos e dividiram o tesouro.\nEN: They became friends and shared the treasure.`;
        } else {
            textarea.value = `Era uma vez um herói corajoso que vivia em terras distantes.\n\nEle viajou pelo mundo em busca de aventura e significado para sua jornada.\n\nEncontrou um dragão feroz que guardava um tesouro milenar na caverna.\n\nFinal alternativo: eles se tornaram amigos e dividiram o tesouro.`;
        }
        this._bulkTextPreview();
    },

    executeBulkTextImport() {
        if (!this._bulkTextSegments || this._bulkTextSegments.length === 0) return;

        const formatEl = document.getElementById('bulk-text-format');
        const durationEl = document.getElementById('bulk-text-duration');
        const showTextEl = document.getElementById('bulk-text-show');

        const videoFormat = formatEl ? formatEl.value : 'vertical';
        const duration = durationEl ? parseInt(durationEl.value) : 4;
        const showTextBelow = showTextEl ? showTextEl.value === 'true' : true;
        const isBilingual = this._bulkTextBilingual || false;
        const langMode = this._bulkTextLangMode || 'single-pt';

        // Create project
        const p = createVideoProject('Script Import', videoFormat);
        p.pages = []; // Remove default page, we'll create from segments

        // Set active language for single-language modes
        if (langMode === 'single-en') p.activeLanguage = 'en';
        else p.activeLanguage = 'pt-BR';

        const count = BulkTextImporter.createPages(p, this._bulkTextSegments, {
            duration,
            showTextBelow,
            bilingual: isBilingual
        });

        // Save to DB and open
        db.projects.put(p).then(() => {
            Store.loadProjects().then(() => {
                Store.set({
                    view: 'editor',
                    currentProject: p,
                    activePageIndex: 0,
                    selectedElement: null,
                    selectedSlot: -1,
                    undoStack: [],
                    redoStack: []
                });
                this.closeBulkTextModal();
                const biLabel = isBilingual ? ' (PT+EN bilíngue 🌐)' : '';
                Toast.show(`${count} páginas criadas${biLabel}! Adicione imagens e ajuste cada página.`, 'success', 4000);
            });
        });
    },

    // ═══════════════════════════════════════════════════════════
    //  BULK AUDIO IMPORT
    // ═══════════════════════════════════════════════════════════

    _bulkAudioMode: 'silence',

    showBulkAudioModal() {
        BulkAudioImporter.clear();
        const container = document.createElement('div');
        container.id = 'bulk-audio-modal-root';
        container.innerHTML = renderBulkAudioModal();
        document.body.appendChild(container);

        // Setup drag & drop on upload area + subtitle mode toggle
        setTimeout(() => {
            const uploadArea = document.getElementById('bulk-audio-upload-area');
            if (uploadArea) {
                uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--accent)'; });
                uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = 'var(--border)'; });
                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadArea.style.borderColor = 'var(--border)';
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('audio/')) {
                        this._processBulkAudioFile(file);
                    }
                });
            }
            const subtitleSel = document.getElementById('bulk-audio-subtitle-mode');
            const dualHint = document.getElementById('bulk-audio-dual-hint');
            if (subtitleSel && dualHint) {
                subtitleSel.addEventListener('change', () => {
                    dualHint.style.display = subtitleSel.value === 'dual' ? 'block' : 'none';
                });
            }
        }, 100);
    },

    closeBulkAudioModal() {
        const root = document.getElementById('bulk-audio-modal-root');
        if (root) root.remove();
        BulkAudioImporter.clear();
    },

    handleBulkAudioFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        this._processBulkAudioFile(file);
    },

    async _processBulkAudioFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            const uploadArea = document.getElementById('bulk-audio-upload-area');
            const loadedArea = document.getElementById('bulk-audio-loaded');
            const infoEl = document.getElementById('bulk-audio-info');

            if (uploadArea) uploadArea.style.display = 'none';
            if (loadedArea) loadedArea.style.display = 'block';
            if (infoEl) infoEl.textContent = `Carregando ${file.name}...`;

            const info = await BulkAudioImporter.loadAudio(dataUrl);
            if (!info) {
                if (infoEl) infoEl.textContent = 'Erro ao carregar áudio.';
                Toast.show(t('toast.audioLoadError'), 'error');
                return;
            }

            if (infoEl) {
                infoEl.innerHTML = `<span style="display:inline-flex;vertical-align:middle;">${Icons.headphones}</span> <strong>${file.name}</strong> · ${BulkAudioImporter.formatTime(info.duration)} · ${info.sampleRate}Hz · ${info.channels}ch`;
            }

            // Auto-detect silence
            this.bulkAudioRedetect();
        };
        reader.readAsDataURL(file);
    },

    bulkAudioSplitMode(mode) {
        this._bulkAudioMode = mode;
        // Update buttons
        document.querySelectorAll('.bulk-split-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        // Show/hide options
        const silenceOpts = document.getElementById('bulk-audio-silence-opts');
        const durationOpts = document.getElementById('bulk-audio-duration-opts');
        const manualHint = document.getElementById('bulk-audio-manual-hint');
        if (silenceOpts) silenceOpts.style.display = mode === 'silence' ? 'flex' : 'none';
        if (durationOpts) durationOpts.style.display = mode === 'duration' ? 'flex' : 'none';
        if (manualHint) manualHint.style.display = mode === 'manual' ? 'flex' : 'none';

        if (mode === 'silence') this.bulkAudioRedetect();
        else if (mode === 'duration') this.bulkAudioResplit();
        else drawBulkAudioWaveform(); // manual mode - just redraw
    },

    bulkAudioRedetect() {
        const minSilenceEl = document.getElementById('bulk-audio-min-silence');
        const thresholdEl = document.getElementById('bulk-audio-threshold');
        const minSilenceMs = minSilenceEl ? parseInt(minSilenceEl.value) : 500;
        const threshold = thresholdEl ? parseFloat(thresholdEl.value) : 0.03;

        BulkAudioImporter.detectSilence({ threshold, minSilenceMs });
        drawBulkAudioWaveform();
    },

    bulkAudioResplit() {
        const durationEl = document.getElementById('bulk-audio-seg-duration');
        const dur = durationEl ? parseInt(durationEl.value) : 5;
        BulkAudioImporter.splitByDuration(dur);

        // Show duration calculation
        const calcEl = document.getElementById('bulk-audio-dur-calc');
        const buffer = BulkAudioImporter.getBuffer();
        if (calcEl && buffer) {
            const totalDur = buffer.duration;
            const pageCount = Math.ceil(totalDur / dur);
            const remainder = totalDur % dur;
            let calc = `${BulkAudioImporter.formatTime(totalDur)} total ÷ ${dur}s = ${pageCount} páginas`;
            if (remainder > 0 && remainder < dur) {
                calc += ` · Última: ${remainder.toFixed(1)}s`;
            }
            calcEl.textContent = calc;
        }

        drawBulkAudioWaveform();
    },

    handleBulkAudioWaveformClick(event) {
        if (this._bulkAudioMode !== 'manual') return;
        const canvas = document.getElementById('bulk-audio-waveform');
        if (!canvas) return;
        const buffer = BulkAudioImporter.getBuffer();
        if (!buffer) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const pct = x / rect.width;
        const timeSec = pct * buffer.duration;

        BulkAudioImporter.addBoundary(timeSec);
        drawBulkAudioWaveform();
    },

    removeBulkAudioBoundary(index) {
        BulkAudioImporter.removeBoundary(index);
        drawBulkAudioWaveform();
    },

    _bulkAudioPlayer: null,

    playBulkAudioSegment(index) {
        // Stop previous
        if (this._bulkAudioPlayer) {
            this._bulkAudioPlayer.pause();
            this._bulkAudioPlayer = null;
        }
        const segments = BulkAudioImporter.getSegments();
        if (!segments || !segments[index]) return;
        const seg = segments[index];
        const buffer = BulkAudioImporter.getBuffer();
        if (!buffer) return;

        // Use AudioContext to play a slice
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0, seg.start, seg.end - seg.start);

        // Auto-stop after segment duration
        const dur = (seg.end - seg.start) * 1000;
        const stopTimer = setTimeout(() => { ctx.close(); }, dur + 100);
        this._bulkAudioPlayer = { pause: () => { source.stop(); clearTimeout(stopTimer); ctx.close(); } };

        // Update button UI
        document.querySelectorAll('.bulk-seg-play-btn').forEach(b => b.classList.remove('playing'));
        const btn = document.querySelector(`.bulk-seg-play-btn[data-seg="${index}"]`);
        if (btn) btn.classList.add('playing');
        setTimeout(() => {
            if (btn) btn.classList.remove('playing');
            this._bulkAudioPlayer = null;
        }, dur);
    },

    executeBulkAudioImport() {
        const segments = BulkAudioImporter.getSegments();
        if (!segments || segments.length === 0) return;

        const formatEl = document.getElementById('bulk-audio-format');
        const subtitleEl = document.getElementById('bulk-audio-subtitle-mode');
        const videoFormat = formatEl ? formatEl.value : 'vertical';
        const subtitleMode = subtitleEl ? subtitleEl.value : 'single-pt';

        // Create project
        const p = createVideoProject('Audio Import', videoFormat);
        p.pages = []; // Remove default page

        // Set language based on subtitle mode
        if (subtitleMode === 'single-en') p.activeLanguage = 'en';
        else p.activeLanguage = 'pt-BR';

        // Enable dual mode if bilingual selected
        if (subtitleMode === 'dual') {
            p.narrativeDisplay = 'dual';
            p.narrativeOrder = 'pt-first';
        }

        const count = BulkAudioImporter.createPages(p, {});

        // For dual mode, enable showTextBelow on all pages
        if (subtitleMode === 'dual') {
            p.pages.forEach(page => { page.showTextBelow = true; });
        }

        // Save to DB and open
        db.projects.put(p).then(() => {
            Store.loadProjects().then(() => {
                Store.set({
                    view: 'editor',
                    currentProject: p,
                    activePageIndex: 0,
                    selectedElement: null,
                    selectedSlot: -1,
                    undoStack: [],
                    redoStack: []
                });
                this.closeBulkAudioModal();
                const biLabel = subtitleMode === 'dual' ? ' (Dual PT+EN 🌐)' : '';
                Toast.show(`${count} páginas criadas${biLabel}! Adicione imagens e ajuste cada página.`, 'success', 4000);
            });
        });
    },

    // ═══════════════════════════════════════════════════════════
    //  EXPORT MODE SELECTOR
    // ═══════════════════════════════════════════════════════════

    showExportModeSelector() {
        const container = document.createElement('div');
        container.id = 'export-mode-modal-root';
        container.innerHTML = renderExportModeSelector();
        document.body.appendChild(container);
    },

    closeExportModeSelector() {
        const root = document.getElementById('export-mode-modal-root');
        if (root) root.remove();
    },

    selectExportMode(presetId) {
        const proj = Store.get('currentProject');
        if (!proj) return;

        const preset = ExportPresets.get(presetId);
        if (!preset) return;

        // Show warnings if any
        const warnings = ExportPresets.getWarnings(proj, presetId);
        if (warnings.length > 0) {
            const warningsEl = document.getElementById('export-mode-warnings');
            if (warningsEl) {
                warningsEl.innerHTML = warnings.map(w => `<div style="padding:4px 0;">Warning: ${w.message}</div>`).join('');
            }
        }

        // Save preset to project
        ExportPresets.saveToProject(proj, presetId);

        // Set the export override dimensions (used by VideoExporter)
        this._exportModeOverride = {
            presetId,
            width: preset.width,
            height: preset.height,
            narrativePosition: preset.narrativePosition,
            narrativeFontScale: preset.narrativeFontScale
        };

        Store.set({ currentProject: proj });
        Store.save();
        this.closeExportModeSelector();

        // Navigate to export page
        Store.set({ view: 'export' });
        Toast.show(`Modo de export: ${preset.label} (${preset.width}×${preset.height})`, 'success');
    },

    // ═══════════════════════════════════════════════════════════
    //  ASSET EXPORT (ZIP)
    // ═══════════════════════════════════════════════════════════

    _updateAssetSummary() {
        const el = document.getElementById('asset-export-summary');
        if (!el) return;
        const p = Store.get('currentProject');
        if (!p) { el.textContent = 'Nenhum projeto aberto.'; return; }

        const summary = AssetExporter.getSummary(p);
        const parts = [];
        if (summary.imageCount > 0) parts.push(`🖼️ ${summary.imageCount} imagens`);
        if (summary.narrationCount > 0) parts.push(`🎤 ${summary.narrationCount} áudios`);
        if (summary.hasBackgroundMusic) parts.push(`🎶 música de fundo`);
        parts.push(`📄 ${summary.pageCount} páginas`);

        el.innerHTML = `${parts.join(' · ')}<br><span style="font-size:10px;color:var(--text-3);">Tamanho estimado: ~${summary.estimatedSizeMB} MB</span>`;
    },

    _setAssetPreset(preset) {
        const presets = {
            lightweight: { images: true, narration: false, bgmusic: false, project: false, readme: false },
            complete:    { images: true, narration: true,  bgmusic: true,  project: true,  readme: true },
            edit:        { images: true, narration: true,  bgmusic: true,  project: false, readme: true }
        };
        const cfg = presets[preset] || presets.complete;

        const ids = { images: 'asset-chk-images', narration: 'asset-chk-narration', bgmusic: 'asset-chk-bgmusic', project: 'asset-chk-project', readme: 'asset-chk-readme' };
        Object.entries(ids).forEach(([key, id]) => {
            const el = document.getElementById(id);
            if (el) el.checked = cfg[key];
        });

        // Update button styling
        document.querySelectorAll('.asset-preset-btn').forEach(btn => {
            const isActive = btn.dataset.preset === preset;
            btn.style.borderColor = isActive ? 'rgba(245,158,11,0.5)' : 'var(--border)';
            btn.style.background = isActive ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface)';
            btn.style.color = isActive ? '#f59e0b' : 'var(--text-2)';
            btn.style.fontWeight = isActive ? '600' : '400';
        });
    },

    async _startAssetExport() {
        const p = Store.get('currentProject');
        if (!p) return;

        const btn = document.getElementById('asset-export-btn');
        const progressArea = document.getElementById('asset-export-progress');
        const statusText = document.getElementById('asset-status-text');
        const pctText = document.getElementById('asset-pct-text');
        const progressBar = document.getElementById('asset-progress-bar');

        // Read checkbox state
        const includeImages = document.getElementById('asset-chk-images')?.checked ?? true;
        const includeNarration = document.getElementById('asset-chk-narration')?.checked ?? true;
        const includeBackgroundMusic = document.getElementById('asset-chk-bgmusic')?.checked ?? true;
        const includeProjectFile = document.getElementById('asset-chk-project')?.checked ?? true;
        const includeReadmeAndMeta = document.getElementById('asset-chk-readme')?.checked ?? true;

        // Disable button and show progress
        if (btn) { btn.disabled = true; btn.textContent = 'Gerando ZIP...'; btn.style.opacity = '0.6'; }
        if (progressArea) progressArea.style.display = 'block';

        try {
            const blob = await AssetExporter.exportAssets(p, {
                includeImages,
                includeNarration,
                includeBackgroundMusic,
                includeProjectFile,
                includeReadme: includeReadmeAndMeta,
                includeMetadata: includeReadmeAndMeta,
                onProgress: (pct) => {
                    if (progressBar) progressBar.style.width = pct + '%';
                    if (pctText) pctText.textContent = pct + '%';
                    if (statusText) {
                        if (pct < 80) statusText.textContent = 'Coletando assets...';
                        else if (pct < 100) statusText.textContent = 'Compactando ZIP...';
                        else statusText.textContent = 'Concluído!';
                    }
                }
            });

            // Trigger download
            const cleanName = (p.metadata?.name || 'projeto').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cleanName}_assets.zip`;
            a.click();
            URL.revokeObjectURL(url);

            Toast.show('Assets exportados com sucesso!', 'success');
        } catch (e) {
            console.error('Asset export error:', e);
            Toast.show('Erro ao exportar assets: ' + e.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '📦 Exportar Assets (ZIP)'; btn.style.opacity = '1'; }
            setTimeout(() => { if (progressArea) progressArea.style.display = 'none'; }, 3000);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());

// Export to window for global access
window.App = App;

// Global click handler to dismiss floating toolbar
document.addEventListener('click', (e) => {
    if (!App._activeTextZone) return;
    if (App._materiaSidebarProtectUntil && Date.now() < App._materiaSidebarProtectUntil) return;
    if (!e.target.isConnected) return;
    const toolbar = document.getElementById('floating-text-toolbar');
    const clickedToolbar = toolbar && toolbar.contains(e.target);
    const clickedTextZone = e.target.closest('.text-below-content, .materia-text-zone');
    const clickedSidebarTextPanel = e.target.closest('#sidebar-text-context, #panel-text-materia, #panel-text-narrativa, .sidebar-text-panel');
    if (!clickedToolbar && !clickedTextZone && !clickedSidebarTextPanel) {
        App.hideFloatingTextToolbar();
        App.hideTextContextPanel();
    }
});
