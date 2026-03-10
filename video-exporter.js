/**
 * VideoExporter - Exportação de vídeo MP4/WebM com Ken Burns
 * HQ Movie v15 — MP4 (H.264) support
 */

class VideoExporter {
    constructor(project, options = {}) {
        this.project = project;
        this.canvas = null;
        this.ctx = null;
        this.mediaRecorder = null;
        this.chunks = [];
        this.fps = options.fps || 30;
        this.quality = options.quality || 'high';
        this.language = options.language || project.activeLanguage || 'pt-BR';
        this.format = options.format || 'auto'; // 'mp4', 'webm', or 'auto'
        this.resolution = options.resolution || '1080p'; // '1080p' or '4k'
        this.onProgress = options.onProgress || null;
        this.onStatus = options.onStatus || null;
        this._resolvedMimeType = null; // set during export
    }

    /**
     * Detect best available codec based on user preference.
     * Returns { mimeType, extension, label } or null if nothing supported.
     */
    static detectCodec(preferredFormat = 'auto') {
        const codecs = [
            { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4', label: 'MP4 (H.264+AAC)', family: 'mp4' },
            { mime: 'video/mp4;codecs=avc1.42E01E',            ext: 'mp4', label: 'MP4 (H.264)',     family: 'mp4' },
            { mime: 'video/webm;codecs=vp9,opus',              ext: 'webm', label: 'WebM (VP9+Opus)', family: 'webm' },
            { mime: 'video/webm;codecs=vp8,opus',              ext: 'webm', label: 'WebM (VP8+Opus)', family: 'webm' },
            { mime: 'video/webm;codecs=vp9',                   ext: 'webm', label: 'WebM (VP9)',      family: 'webm' },
            { mime: 'video/webm;codecs=vp8',                   ext: 'webm', label: 'WebM (VP8)',      family: 'webm' },
            { mime: 'video/webm',                              ext: 'webm', label: 'WebM',            family: 'webm' }
        ];

        // If user picked a specific format, try that family first
        let ordered = codecs;
        if (preferredFormat === 'mp4') {
            ordered = codecs.filter(c => c.family === 'mp4').concat(codecs.filter(c => c.family !== 'mp4'));
        } else if (preferredFormat === 'webm') {
            ordered = codecs.filter(c => c.family === 'webm').concat(codecs.filter(c => c.family !== 'webm'));
        }
        // 'auto' = default order (MP4 first for max compatibility)

        for (const c of ordered) {
            try {
                if (MediaRecorder.isTypeSupported(c.mime)) {
                    return { mimeType: c.mime, extension: c.ext, label: c.label, family: c.family };
                }
            } catch (e) { /* ignore */ }
        }
        return null; // nothing supported — will use browser default
    }

    /**
     * Get all supported format families for UI display.
     * Returns array of { family, label, supported }
     */
    static getSupportedFormats() {
        const mp4 = VideoExporter.detectCodec('mp4');
        const webm = VideoExporter.detectCodec('webm');
        const results = [];
        if (mp4 && mp4.family === 'mp4') results.push({ family: 'mp4', label: 'MP4 (compatível com tudo)', supported: true });
        else results.push({ family: 'mp4', label: 'MP4 (não suportado neste browser)', supported: false });
        if (webm && webm.family === 'webm') results.push({ family: 'webm', label: 'WebM (menor tamanho)', supported: true });
        else results.push({ family: 'webm', label: 'WebM (não suportado)', supported: false });
        return results;
    }

    async export() {
        try {
            if (this.onStatus) this.onStatus('Carregando fontes...');
            
            // Preload all fonts before rendering to avoid blank text
            try {
                await document.fonts.ready;
                
                // Preload ALL fonts from APP_FONTS for consistency
                if (typeof APP_FONTS !== 'undefined') {
                    const fontFamilies = Object.values(APP_FONTS).map(f => {
                        // Extract first font name from family string (e.g., "'Lora', Georgia, serif" -> "Lora")
                        const match = f.family.match(/['"]([^'"]+)['"]/);
                        return match ? match[1] : null;
                    }).filter(Boolean);
                    
                    await Promise.all(fontFamilies.map(font => 
                        document.fonts.load(`16px "${font}"`).catch(() => {
                            console.warn(`[VideoExport] Could not load font: ${font}`);
                        })
                    ));
                } else {
                    // Fallback if APP_FONTS not available
                    const fallbackFonts = ['Lora', 'Inter', 'Bangers', 'Comic Neue', 'Patrick Hand', 'Georgia', 'Arial'];
                    await Promise.all(fallbackFonts.map(font => 
                        document.fonts.load(`16px "${font}"`).catch(() => {})
                    ));
                }
            } catch (e) {
                console.warn('[VideoExport] Font preload warning:', e);
            }
            
            if (this.onStatus) this.onStatus('Preparando canvas...');
            
            // Criar canvas offscreen com suporte a 4K e HiDPI
            const dims = getProjectDims(this.project);
            
            // Determinar resolução base
            let baseWidth = dims.canvasW;
            let baseHeight = dims.canvasH;
            
            // Aplicar escala 4K se solicitado
            if (this.resolution === '4k') {
                // Escalar proporcionalmente para 4K (mantendo aspect ratio)
                const scale4k = 2160 / baseHeight; // 4K = 3840x2160
                baseWidth = Math.round(baseWidth * scale4k);
                baseHeight = 2160;
                if (this.onStatus) this.onStatus('Preparando canvas 4K (pode ser lento)...');
            }
            
            // Aplicar HiDPI scaling para qualidade máxima
            const dpr = window.devicePixelRatio || 1;
            
            this.canvas = document.createElement('canvas');
            this.canvas.width = baseWidth * dpr;
            this.canvas.height = baseHeight * dpr;
            this.canvas.style.width = baseWidth + 'px';
            this.canvas.style.height = baseHeight + 'px';
            this.canvas.style.position = 'fixed';
            this.canvas.style.left = '-9999px';
            this.canvas.style.visibility = 'hidden';
            document.body.appendChild(this.canvas);
            
            this.ctx = this.canvas.getContext('2d', {
                alpha: false, // Performance boost
                desynchronized: true // Better performance
            });
            
            // Escalar contexto para HiDPI
            this.ctx.scale(dpr, dpr);
            
            // Configurar qualidade máxima de renderização
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            
            // Armazenar dimensões lógicas (sem DPR) para cálculos
            this._logicalWidth = baseWidth;
            this._logicalHeight = baseHeight;

            if (this.onStatus) this.onStatus('Configurando áudio e vídeo...');
            
            // 1. Capturar stream visual
            const videoStream = this.canvas.captureStream(0); // 0 = manual frame requests
            this.videoTrack = videoStream.getVideoTracks()[0];
            
            // 3. Configurar Mixagem de Áudio
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            
            // Garantir que AudioContext está rodando (necessário em alguns browsers)
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }
            
            const dest = this.audioCtx.createMediaStreamDestination();
            
            // Carregar todos os assets de áudio primeiro para evitar drift de sincronia
            if (this.onStatus) this.onStatus('Carregando áudio...');
            
            const audioTasks = [];
            let bgMusicBuffer = null;
            let bgMusicVol = 0.6;
            
            // 3a. Carregar Música de Fundo
            const bgData = this.project.backgroundMusic || this.project.videoAudio?.background;
            if (bgData && bgData.file) {
                bgMusicVol = bgData.volume !== undefined ? bgData.volume : 0.6;
                if (bgMusicVol > 1) bgMusicVol = bgMusicVol / 100;
                
                audioTasks.push(async () => {
                    try {
                        bgMusicBuffer = await this._loadAudio(bgData.file);
                    } catch (e) {
                        console.warn('Falha ao carregar música de fundo', e);
                    }
                });
            }

            // 3b. Preparar Narrações (Identificar e carregar)
            const narrationEvents = []; // { buffer, startTime, volume }
            const lang = this.language;
            const narrativeMode = this.project.narrativeMode || 'per-page';
            
            if (narrativeMode === 'continuous-track' && this.project.narrativeSegments) {
                // Modo Faixa Contínua
                for (const seg of this.project.narrativeSegments) {
                    const narration = seg.narration ? seg.narration[lang] : null;
                    if (narration && narration.file) {
                        const startPageIdx = seg.pageRange ? seg.pageRange[0] : 0;
                        const startTime = this._getPageStartTime(startPageIdx);
                        const vol = narration.volume !== undefined ? narration.volume : 1.0; // Default narration louder
                        
                        audioTasks.push(async () => {
                            try {
                                const buf = await this._loadAudio(narration.file);
                                narrationEvents.push({
                                    buffer: buf,
                                    startTime: startTime,
                                    volume: vol > 1 ? vol / 100 : vol
                                });
                            } catch (e) {
                                console.warn(`Falha ao carregar narração segmento ${seg.id}`, e);
                            }
                        });
                    }
                }
            } else {
                // Modo Por Página
                for (let i = 0; i < this.project.pages.length; i++) {
                    const page = this.project.pages[i];
                    let narration = null;
                    if (page.narration && page.narration[lang] && page.narration[lang].file) {
                        narration = page.narration[lang];
                    } else if (this.project.videoAudio?.pages) {
                        const pAudio = this.project.videoAudio.pages.find(pa => pa.pageId === page.id);
                        if (pAudio && pAudio.narration) {
                             if (pAudio.narration[lang]?.file) narration = pAudio.narration[lang];
                             else if (pAudio.narration.file) narration = pAudio.narration;
                        }
                    }
                    
                    if (narration && narration.file) {
                        const startTime = this._getPageStartTime(i);
                        const vol = narration.volume !== undefined ? narration.volume : 1.0;
                        
                        audioTasks.push(async () => {
                            try {
                                const buf = await this._loadAudio(narration.file);
                                narrationEvents.push({
                                    buffer: buf,
                                    startTime: startTime,
                                    volume: vol > 1 ? vol / 100 : vol
                                });
                            } catch (e) {
                                console.warn(`Falha ao carregar narração página ${i}`, e);
                            }
                        });
                    }
                }
            }
            
            // Executar todos os carregamentos
            await Promise.all(audioTasks.map(task => task()));
            
            // 4. Agendar Áudios (Scheduling)
            // Definir um tempo âncora no futuro próximo para iniciar tudo sincronizado
            // Pequeno buffer (50ms) para garantir que o AudioContext esteja pronto, sem desync perceptível
            const startTimeAnchor = this.audioCtx.currentTime + 0.05;
            
            // Configurar Background Music Node
            let bgMusicNode = null;
            if (bgMusicBuffer) {
                const source = this.audioCtx.createBufferSource();
                source.buffer = bgMusicBuffer;
                source.loop = bgData.loop !== false;
                
                const gainNode = this.audioCtx.createGain();
                gainNode.gain.value = bgMusicVol;
                
                source.connect(gainNode);
                gainNode.connect(dest);
                
                source.start(startTimeAnchor);
                bgMusicNode = { source, gain: gainNode, baseVolume: bgMusicVol };
            }
            
            // Configurar Ducking Params
            const ducking = this.project.videoAudio?.ducking || { enabled: true, level: 0.2, fadeMs: 500 };
            const duckingLevel = ducking.level !== undefined ? ducking.level : 0.2;
            const fadeTime = (ducking.fadeMs || 500) / 1000;
            
            // Agendar Narrações
            const duckingIntervals = [];

            for (const event of narrationEvents) {
                const source = this.audioCtx.createBufferSource();
                source.buffer = event.buffer;
                
                const gainNode = this.audioCtx.createGain();
                gainNode.gain.value = event.volume;
                
                source.connect(gainNode);
                gainNode.connect(dest);
                
                const playTime = startTimeAnchor + event.startTime;
                source.start(playTime);
                
                // Coletar intervalo para ducking
                if (bgMusicNode && ducking.enabled !== false) {
                    duckingIntervals.push({
                        start: playTime,
                        end: playTime + event.buffer.duration
                    });
                }
            }
            
            // Aplicar Ducking Otimizado (Merge Intervals)
            if (bgMusicNode && ducking.enabled !== false && duckingIntervals.length > 0) {
                const mergedIntervals = this._mergeDuckingIntervals(duckingIntervals);
                for (const interval of mergedIntervals) {
                    this._applyDuckingToNode(bgMusicNode, interval.start, interval.end - interval.start, duckingLevel, fadeTime);
                }
            }
            
            // 4b. Ensure audio track is always active (silent carrier)
            // Some browsers (Brave/Chrome) drop empty audio tracks
            const silentOsc = this.audioCtx.createOscillator();
            const silentGain = this.audioCtx.createGain();
            silentGain.gain.value = 0; // completely silent
            silentOsc.connect(silentGain);
            silentGain.connect(dest);
            silentOsc.start(startTimeAnchor);
            this._silentOsc = silentOsc;
            
            // 5. Combinar vídeo + áudio
            const combinedStream = new MediaStream([
                ...videoStream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]);
            
            // Configurar MediaRecorder
            // Bitrates ajustados para resolução (4K precisa de ~3x mais bitrate)
            const bitrates = {
                '1080p': { low: 2500000, medium: 5000000, high: 8000000 },
                '4k': { low: 8000000, medium: 15000000, high: 25000000 }
            };
            
            const resBitrates = bitrates[this.resolution] || bitrates['1080p'];
            
            // Detect best codec based on user format preference
            const detected = VideoExporter.detectCodec(this.format);
            let options = {
                videoBitsPerSecond: resBitrates[this.quality] || resBitrates.high,
                audioBitsPerSecond: 128000
            };
            
            if (detected) {
                options.mimeType = detected.mimeType;
                this._resolvedMimeType = detected.mimeType;
                this._resolvedExtension = detected.extension;
            } else {
                console.warn('[VideoExport] Nenhum codec detectado, usando default do browser');
                this._resolvedMimeType = null;
                this._resolvedExtension = 'webm'; // safe fallback
            }

            this.mediaRecorder = new MediaRecorder(combinedStream, options);

            this.chunks = [];
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.chunks.push(e.data);
            };

            // Iniciar gravação (timeslice 1s para captura confiável)
            this.mediaRecorder.start(1000);

            // Renderizar cada página com transições
            const totalPages = this.project.pages.length;
            for (let i = 0; i < totalPages; i++) {
                const page = this.project.pages[i];
                const nextPage = i < totalPages - 1 ? this.project.pages[i + 1] : null;
                if (this.onStatus) this.onStatus(`Renderizando página ${i + 1}/${totalPages}...`);
                if (this.onProgress) this.onProgress(i / totalPages);
                
                // Renderiza página principal
                const transition = page.transition || 'cut';
                // Use page-specific transition duration if set, otherwise default to 0.5s for fade
                const transitionDuration = transition === 'fade' ? (page.transitionDuration || 0.5) : 0;
                const mainDuration = (page.duration || 4) - transitionDuration;
                
                await this.renderPage(page, mainDuration, i);
                
                // Renderiza transição fade se necessário
                if (transition === 'fade' && nextPage) {
                    await this.renderFadeTransition(page, nextPage, transitionDuration, i);
                }
            }

            if (this.onStatus) this.onStatus('Finalizando vídeo...');
            if (this.onProgress) this.onProgress(0.95);
            
            // Finalizar
            const blob = await this.finalize();
            
            // Cleanup
            if (this._silentOsc) { try { this._silentOsc.stop(); } catch(e) {} }
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            if (this.audioCtx) {
                setTimeout(() => {
                    this.audioCtx.close();
                    this.audioCtx = null;
                }, 500);
            }
            
            if (this.onProgress) this.onProgress(1.0);
            if (this.onStatus) this.onStatus('Concluído!');
            
            return blob;

        } catch (error) {
            console.error('Erro ao exportar vídeo:', error);
            if (this.onStatus) this.onStatus('Erro: ' + error.message);
            if (this.audioCtx) this.audioCtx.close();
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            throw error;
        }
    }

    _loadAudio(url) {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this.audioCtx.decodeAudioData(arrayBuffer))
                .then(audioBuffer => resolve(audioBuffer))
                .catch(error => reject(error));
        });
    }

    _getPageStartTime(pageIndex) {
        let startTime = 0;
        // Safety check to avoid crash if pageIndex is out of bounds
        const pages = this.project.pages || [];
        const limit = Math.min(pageIndex, pages.length);
        
        for (let i = 0; i < limit; i++) {
            const p = pages[i];
            startTime += (p && p.duration ? p.duration : 4);
        }
        return startTime;
    }

    _mergeDuckingIntervals(intervals) {
        if (!intervals || intervals.length === 0) return [];
        
        // Sort by start time
        intervals.sort((a, b) => a.start - b.start);
        
        const merged = [intervals[0]];
        
        for (let i = 1; i < intervals.length; i++) {
            const current = intervals[i];
            const last = merged[merged.length - 1];
            
            // Merge if overlapping or very close (gap < 0.5s) to avoid pumping
            if (current.start <= last.end + 0.5) { 
                last.end = Math.max(last.end, current.end);
            } else {
                merged.push(current);
            }
        }
        
        return merged;
    }

    _applyDuckingToNode(bgMusicNode, startAbsTime, duration, duckingLevel, fadeTime) {
        if (!bgMusicNode || !bgMusicNode.gain) return;

        const gain = bgMusicNode.gain.gain;
        const baseVol = bgMusicNode.baseVolume;
        const duckVol = baseVol * duckingLevel;
        
        // Adjust fade time for very short segments to avoid ramp overlap
        let actualFade = fadeTime;
        if (duration < fadeTime * 2) {
            actualFade = duration / 2;
        }
        
        // Start Ducking: Ramp down
        try {
            gain.setValueAtTime(baseVol, startAbsTime);
            gain.linearRampToValueAtTime(duckVol, startAbsTime + actualFade);
            
            // End Ducking: Ramp up
            const endAbsTime = startAbsTime + duration;
            gain.setValueAtTime(duckVol, endAbsTime - actualFade);
            gain.linearRampToValueAtTime(baseVol, endAbsTime);
        } catch (e) {
            console.warn('Erro ao aplicar ducking:', e);
        }
    }

    // Narrative font presets per video format
    static NARRATIVE_PRESETS = {
        vertical:   { fontSize: 56, maxChars: 84,  maxLines: 3, strokeWidth: 3, trackHeight: 220, padding: 40 },
        widescreen: { fontSize: 42, maxChars: 126, maxLines: 3, strokeWidth: 2, trackHeight: 160, padding: 50 },
        square:     { fontSize: 40, maxChars: 90,  maxLines: 3, strokeWidth: 3, trackHeight: 180, padding: 40 },
        portrait:   { fontSize: 40, maxChars: 105, maxLines: 3, strokeWidth: 3, trackHeight: 160, padding: 40 }
    };

    getNarrativePreset() {
        const fmt = this.project.videoFormat || 'vertical';
        return VideoExporter.NARRATIVE_PRESETS[fmt] || VideoExporter.NARRATIVE_PRESETS.vertical;
    }

    async renderPage(page, durationSeconds, pageIndex = 0) {
        // Check if this is a slideshow page
        if (page.layoutId === 'slideshow' && page.slides && page.slides.length > 0) {
            return await this.renderSlideshowPage(page, durationSeconds, pageIndex);
        }
        
        const totalFrames = Math.floor(durationSeconds * this.fps);
        const kenBurns = page.kenBurns || 'none';
        const narrativeMode = this.project.narrativeMode || 'per-page';
        const narrativePosition = this.project.narrativePosition || 'bottom';

        // Preload image if exists
        let preloadedImg = null;
        if (page.images && page.images.length > 0 && page.images[0] && page.images[0].src) {
            const imgSrc = page.images[0].src;
            preloadedImg = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    resolve(img);
                };
                img.onerror = (e) => {
                    console.error(`[VideoExport] Image load FAILED:`, e);
                    resolve(null);
                };
                img.src = imgSrc;
            });
        }

        for (let frame = 0; frame < totalFrames; frame++) {
            const progress = frame / totalFrames; // 0.0 → 1.0

            // Limpar canvas
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this._logicalWidth, this._logicalHeight);

            // Aplicar Ken Burns
            this.ctx.save();
            this.applyKenBurns(kenBurns, progress);

            // Renderizar imagem (se houver) — cover fit (sem esticar)
            if (preloadedImg) {
                this._drawImageCover(preloadedImg, this._logicalWidth, this._logicalHeight);
            }

            this.ctx.restore();

            // Renderizar balões (sem animação) - using active language
            this.drawBalloons(page.texts || [], this.language);

            // Renderizar narrative track (se modo continuous-track ou híbrido)
            if (narrativeMode === 'continuous-track' || narrativeMode === 'hybrid') {
                this.drawNarrativeTrack(pageIndex, narrativePosition, progress);
            } else if (page.showTextBelow && page.narrative) {
                // Per-page mode: render page narrative
                this.drawPageNarrative(page, narrativePosition);
            }

            // Force frame capture for MediaRecorder
            if (this.videoTrack && typeof this.videoTrack.requestFrame === 'function') {
                this.videoTrack.requestFrame();
            }

            // Aguardar próximo frame
            await this.waitFrame();
        }
    }

    async renderFadeTransition(fromPage, toPage, durationSeconds, pageIndex) {
        const totalFrames = Math.floor(durationSeconds * this.fps);
        if (totalFrames <= 0) return;

        // Preload next page image
        let nextImg = null;
        if (toPage.images && toPage.images.length > 0 && toPage.images[0] && toPage.images[0].src) {
            nextImg = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = toPage.images[0].src;
            });
        }

        // Preload current page image
        let currentImg = null;
        if (fromPage.images && fromPage.images.length > 0 && fromPage.images[0] && fromPage.images[0].src) {
            currentImg = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = fromPage.images[0].src;
            });
        }

        for (let frame = 0; frame < totalFrames; frame++) {
            const progress = frame / totalFrames; // 0.0 → 1.0 (fade progress)

            // DO NOT Clear canvas during fade (causes black flash)
            // Instead, draw images on top of each other with alpha blending

            // Draw current page (fading out)
            if (currentImg) {
                // If we have a next image, we keep current fully visible at bottom 
                // and fade next image on top (classic cross-dissolve)
                // OR fade out current while fading in next.
                // Best results for "fade": 
                // 1. Draw current image (opacity 1.0 -> 0.0)
                // 2. Draw next image on top (opacity 0.0 -> 1.0)
                
                // Clear with black first to ensure no artifacts
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, 0, this._logicalWidth, this._logicalHeight);

                this.ctx.globalAlpha = 1.0 - progress;
                this._drawImageCover(currentImg, this._logicalWidth, this._logicalHeight);
            } else {
                // If no current image, just clear black
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, 0, this._logicalWidth, this._logicalHeight);
            }

            // Draw next page (fading in)
            if (nextImg) {
                this.ctx.globalAlpha = progress;
                this._drawImageCover(nextImg, this._logicalWidth, this._logicalHeight);
            }

            this.ctx.globalAlpha = 1.0;

            // Force frame capture
            if (this.videoTrack && typeof this.videoTrack.requestFrame === 'function') {
                this.videoTrack.requestFrame();
            }

            await this.waitFrame();
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       SLIDESHOW MODE - Render multiple slides with transitions
       ═══════════════════════════════════════════════════════════════ */

    async renderSlideshowPage(page, durationSeconds, pageIndex = 0) {
        const slides = page.slides || [];
        if (slides.length === 0) return;

        const narrativeMode = this.project.narrativeMode || 'per-page';
        const narrativePosition = this.project.narrativePosition || 'bottom';

        // OPTIMIZATION: Preload ALL slide images first
        if (this.onStatus) this.onStatus(`Carregando ${slides.length} slides...`);
        const preloadedSlides = await Promise.all(
            slides.map(async (slide, i) => {
                const img = await new Promise((resolve) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = (e) => {
                        console.error(`[VideoExport] Slide ${i + 1} load FAILED:`, e);
                        resolve(null);
                    };
                    image.src = slide.image;
                });
                return { ...slide, imgElement: img };
            })
        );

        // Render each slide
        let renderedFrames = 0;
        const totalDuration = slides.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalFrames = Math.floor(totalDuration * this.fps);

        for (let slideIdx = 0; slideIdx < preloadedSlides.length; slideIdx++) {
            const slide = preloadedSlides[slideIdx];
            const nextSlide = slideIdx < preloadedSlides.length - 1 ? preloadedSlides[slideIdx + 1] : null;
            const slideDuration = slide.duration || 4;
            const slideFrames = Math.floor(slideDuration * this.fps);
            const kenBurns = slide.kenBurns || 'none';
            const transition = slide.transition || 'cut';
            const transitionDuration = slide.transitionDuration || 0.5;
            const transitionFrames = Math.floor(transitionDuration * this.fps);

            // Calculate when transition starts (last N frames of slide)
            const transitionStartFrame = slideFrames - transitionFrames;

            for (let frame = 0; frame < slideFrames; frame++) {
                const slideProgress = frame / slideFrames;

                // Clear canvas
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(0, 0, this._logicalWidth, this._logicalHeight);

                // Check if we're in transition zone
                const inTransition = nextSlide && transition !== 'cut' && frame >= transitionStartFrame;

                if (inTransition) {
                    // Render transition between current and next slide
                    const transitionProgress = (frame - transitionStartFrame) / transitionFrames;
                    await this.renderSlideTransition(slide, nextSlide, transitionProgress, transition, kenBurns, slideProgress);
                } else {
                    // Render current slide normally
                    this.ctx.save();
                    this.applyKenBurns(kenBurns, slideProgress);
                    if (slide.imgElement) {
                        this._drawImageCover(slide.imgElement, this._logicalWidth, this._logicalHeight);
                    }
                    this.ctx.restore();
                }

                // Render balloons (if any)
                this.drawBalloons(page.texts || [], this.language);

                // Render narrative
                if (narrativeMode === 'continuous-track' || narrativeMode === 'hybrid') {
                    this.drawNarrativeTrack(pageIndex, narrativePosition, slideProgress);
                } else if (page.showTextBelow && page.narrative) {
                    this.drawPageNarrative(page, narrativePosition);
                }

                // Force frame capture
                if (this.videoTrack && typeof this.videoTrack.requestFrame === 'function') {
                    this.videoTrack.requestFrame();
                }

                // Update progress
                renderedFrames++;
                if (this.onProgress && totalFrames > 0) {
                    this.onProgress(renderedFrames / totalFrames);
                }

                await this.waitFrame();
            }
        }
    }

    async renderSlideTransition(currentSlide, nextSlide, progress, transitionType, kenBurns, slideProgress) {
        if (transitionType === 'crossfade') {
            // Crossfade: blend current and next slide
            this.ctx.save();
            
            // Draw current slide with fading opacity
            this.ctx.globalAlpha = 1 - progress;
            this.applyKenBurns(kenBurns, slideProgress);
            if (currentSlide.imgElement) {
                this._drawImageCover(currentSlide.imgElement, this._logicalWidth, this._logicalHeight);
            }
            this.ctx.restore();

            // Draw next slide with increasing opacity
            this.ctx.save();
            this.ctx.globalAlpha = progress;
            const nextKenBurns = nextSlide.kenBurns || 'none';
            this.applyKenBurns(nextKenBurns, 0); // Start of next slide animation
            if (nextSlide.imgElement) {
                this._drawImageCover(nextSlide.imgElement, this._logicalWidth, this._logicalHeight);
            }
            this.ctx.restore();

            this.ctx.globalAlpha = 1; // Reset
        } else if (transitionType === 'fade-black') {
            // Fade to black, then fade in next slide
            const halfProgress = progress * 2;
            
            if (halfProgress < 1) {
                // Fade current slide to black
                this.ctx.save();
                this.ctx.globalAlpha = 1 - halfProgress;
                this.applyKenBurns(kenBurns, slideProgress);
                if (currentSlide.imgElement) {
                    this._drawImageCover(currentSlide.imgElement, this._logicalWidth, this._logicalHeight);
                }
                this.ctx.restore();
            } else {
                // Fade in next slide from black
                this.ctx.save();
                this.ctx.globalAlpha = halfProgress - 1;
                const nextKenBurns = nextSlide.kenBurns || 'none';
                this.applyKenBurns(nextKenBurns, 0);
                if (nextSlide.imgElement) {
                    this._drawImageCover(nextSlide.imgElement, this._logicalWidth, this._logicalHeight);
                }
                this.ctx.restore();
            }

            this.ctx.globalAlpha = 1; // Reset
        }
    }
    
    _narrativeBgRgba(style) {
        const bgHex = (style.bgColor && style.bgColor.startsWith('#')) ? style.bgColor : '#000000';
        const r = parseInt(bgHex.slice(1,3),16)||0, g = parseInt(bgHex.slice(3,5),16)||0, b = parseInt(bgHex.slice(5,7),16)||0;
        const opacity = style.bgOpacity != null ? style.bgOpacity : 0.55;
        return `rgba(${r},${g},${b},${opacity})`;
    }

    drawNarrativeTrack(pageIndex, position, progress) {
        const segment = typeof NarrativeSegments !== 'undefined' 
            ? NarrativeSegments.getForPage(this.project, pageIndex)
            : null;
        if (!segment) return;

        const isDual = this.project.narrativeDisplay === 'dual';
        if (isDual) {
            // Dual mode for continuous-track segments
            const ptText = typeof MultiLang !== 'undefined' ? MultiLang.get(segment.text, 'pt-BR') : '';
            const enText = typeof MultiLang !== 'undefined' ? MultiLang.get(segment.text, 'en') : '';
            if (!ptText && !enText) return;
            const dualOrder = this.project.narrativeOrder || 'pt-first';
            const dualSpacing = this.project.narrativeDualSpacing || 4;
            // Reuse _drawDualNarrative with a fake page object
            const fakePage = { narrative: segment.text, narrativeStyle: segment.style || {} };
            this._drawDualNarrative(fakePage, position, dualOrder, dualSpacing);
            return;
        }
        
        const text = typeof MultiLang !== 'undefined'
            ? MultiLang.get(segment.text, this.language)
            : (typeof segment.text === 'string' ? segment.text : segment.text?.['pt-BR'] || '');
        
        if (!text) return;
        
        const preset = this.getNarrativePreset();
        const fontSize = preset.fontSize;
        const padding = preset.padding;
        const trackHeight = preset.trackHeight;
        const strokeWidth = preset.strokeWidth;
        const y = position === 'top' ? 0 : this._logicalHeight - trackHeight;
        
        // Use segment style or fallback
        const nStyle = segment.style || {};
        
        // Background — use actual style colors
        this.ctx.fillStyle = this._narrativeBgRgba(nStyle);
        this.ctx.fillRect(0, y, this._logicalWidth, trackHeight);
        
        // Text with stroke for contrast
        const fontFamily = this.getFontFamily(nStyle.font || 'comic');
        this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const textColor = nStyle.color || nStyle.textColor || '#ffffff';
        const lines = this.wrapText(text, this._logicalWidth - padding * 2).slice(0, preset.maxLines);
        const lineHeight = fontSize * 1.3;
        const textY = y + trackHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
        
        lines.forEach((line, i) => {
            const tx = this._logicalWidth / 2;
            const ty = textY + i * lineHeight;
            // Stroke (outline) for readability
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = strokeWidth;
            this.ctx.lineJoin = 'round';
            this.ctx.strokeText(line, tx, ty);
            // Fill with actual text color
            this.ctx.fillStyle = textColor;
            this.ctx.fillText(line, tx, ty);
        });
    }
    
    drawPageNarrative(page, position) {
        const isDual = this.project.narrativeDisplay === 'dual';
        const dualOrder = this.project.narrativeOrder || 'pt-first';
        const dualSpacing = this.project.narrativeDualSpacing || 4;

        if (isDual) {
            this._drawDualNarrative(page, position, dualOrder, dualSpacing);
            return;
        }

        const text = typeof MultiLang !== 'undefined'
            ? MultiLang.get(page.narrative, this.language)
            : (typeof page.narrative === 'string' ? page.narrative : page.narrative?.['pt-BR'] || '');
            
        console.log(`[EXPORT] drawPageNarrative -> text: "${text}"`, page.narrative);
        
        if (!text) return;
        
        const preset = this.getNarrativePreset();
        const padding = preset.padding;
        const strokeWidth = preset.strokeWidth;
        
        // Use actual page narrative style - PRIORITY over preset
        const style = page.narrativeStyle || {};
        
        // Scale user font size to video resolution (editor uses ~800px height, video uses 1080-1920px)
        const editorHeight = 800;
        const videoHeight = this._logicalHeight;
        const scaleFactor = videoHeight / editorHeight;
        const userFontSize = style.size || 48;
        const fontSize = Math.round(userFontSize * scaleFactor * 0.9); // 0.9 for better fit
        
        // Track height based on font size + padding
        const lineHeight = fontSize * (style.leading || 1.3);
        const maxLines = preset.maxLines || 3;
        const trackHeight = Math.round(lineHeight * maxLines + padding * 1.5);
        const y = position === 'top' ? 0 : this._logicalHeight - trackHeight;
        
        // Background — use actual style colors with opacity
        const bgOpacity = style.bgOpacity != null ? style.bgOpacity : 0.55;
        this.ctx.fillStyle = this._narrativeBgRgba({ ...style, bgOpacity });
        this.ctx.fillRect(0, y, this._logicalWidth, trackHeight);
        
        // Text with stroke for contrast
        const fontFamily = this.getFontFamily(style.font || 'serif');
        const fontWeight = style.bold ? 'bold' : 'normal';
        this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = style.align === 'left' ? 'left' : style.align === 'right' ? 'right' : 'center';
        this.ctx.textBaseline = 'middle';
        
        const textColor = style.color || style.textColor || '#ffffff';
        const lines = this.wrapText(text, this._logicalWidth - padding * 2).slice(0, maxLines);
        const textY = y + trackHeight / 2 - ((lines.length * lineHeight) / 2) + (lineHeight / 2);
        
        lines.forEach((line, i) => {
            // Position based on alignment
            let tx = this._logicalWidth / 2;
            if (style.align === 'left') tx = padding;
            else if (style.align === 'right') tx = this._logicalWidth - padding;
            
            const ty = textY + i * lineHeight;
            // Stroke (outline) for readability
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = strokeWidth;
            this.ctx.lineJoin = 'round';
            this.ctx.strokeText(line, tx, ty);
            // Fill with actual text color
            this.ctx.fillStyle = textColor;
            this.ctx.fillText(line, tx, ty);
        });
    }

    _drawDualNarrative(page, position, dualOrder, dualSpacing) {
        const ptText = typeof MultiLang !== 'undefined' ? MultiLang.get(page.narrative, 'pt-BR') : '';
        const enText = typeof MultiLang !== 'undefined' ? MultiLang.get(page.narrative, 'en') : '';
        if (!ptText && !enText) return;

        const topText = dualOrder === 'pt-first' ? ptText : enText;
        const botText = dualOrder === 'pt-first' ? enText : ptText;
        const topLabel = dualOrder === 'pt-first' ? 'PT' : 'EN';
        const botLabel = dualOrder === 'pt-first' ? 'EN' : 'PT';

        const preset = this.getNarrativePreset();
        const style = page.narrativeStyle || {};
        const fontFamily = this.getFontFamily(style.font || 'serif');
        const strokeWidth = preset.strokeWidth;
        const padding = preset.padding;
        const maxWidth = this._logicalWidth - padding * 2;

        // Scale user font size to video resolution
        const editorHeight = 800;
        const videoHeight = this._logicalHeight;
        const scaleFactor = videoHeight / editorHeight;
        const userFontSize = style.size || 48;
        
        // Dual mode uses 70% of scaled font size, auto-shrink if needed
        let fontSize = Math.round(userFontSize * scaleFactor * 0.7);
        const minFontSize = Math.max(16, Math.round(fontSize * 0.5));

        // Auto-fit: shrink font until both texts fit in maxLines each
        const maxLinesEach = Math.min(preset.maxLines, 2);
        while (fontSize > minFontSize) {
            this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
            const topLines = topText ? this.wrapText(topText, maxWidth) : [];
            const botLines = botText ? this.wrapText(botText, maxWidth) : [];
            if (topLines.length <= maxLinesEach && botLines.length <= maxLinesEach) break;
            fontSize -= 1;
        }

        this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
        const topLines = topText ? this.wrapText(topText, maxWidth).slice(0, maxLinesEach) : [];
        const botLines = botText ? this.wrapText(botText, maxWidth).slice(0, maxLinesEach) : [];
        const lineHeight = fontSize * (style.leading || 1.3);
        const topBlockH = topLines.length * lineHeight;
        const botBlockH = botLines.length * lineHeight;
        const totalContentH = topBlockH + dualSpacing + botBlockH + padding * 2;
        const trackHeight = Math.max(preset.trackHeight, totalContentH);

        const y = position === 'top' ? 0 : this._logicalHeight - trackHeight;

        // Background
        this.ctx.fillStyle = this._narrativeBgRgba(style);
        this.ctx.fillRect(0, y, this._logicalWidth, trackHeight);

        // Accent bar
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.fillRect(0, y, 4, trackHeight);

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const textColor = style.color || style.textColor || '#ffffff';
        const cx = this._logicalWidth / 2;

        // Vertical centering of both blocks within track
        const combinedH = topBlockH + dualSpacing + botBlockH;
        const startY = y + (trackHeight - combinedH) / 2;

        // Draw top language block (full opacity)
        this.ctx.globalAlpha = 1.0;
        topLines.forEach((line, i) => {
            const ty = startY + i * lineHeight + lineHeight / 2;
            this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = strokeWidth;
            this.ctx.lineJoin = 'round';
            this.ctx.strokeText(line, cx, ty);
            this.ctx.fillStyle = textColor;
            this.ctx.fillText(line, cx, ty);
        });

        // Draw bottom language block (slightly dimmer)
        this.ctx.globalAlpha = 0.75;
        botLines.forEach((line, i) => {
            const ty = startY + topBlockH + dualSpacing + i * lineHeight + lineHeight / 2;
            this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = strokeWidth;
            this.ctx.lineJoin = 'round';
            this.ctx.strokeText(line, cx, ty);
            this.ctx.fillStyle = textColor;
            this.ctx.fillText(line, cx, ty);
        });

        // CRITICAL: Reset globalAlpha to prevent affecting subsequent renders
        this.ctx.globalAlpha = 1.0;
    }

    applyKenBurns(mode, progress) {
        const w = this._logicalWidth;
        const h = this._logicalHeight;
        // Use KenBurns presets from app.js if available (matches 'zoom-in', 'pan-left' etc)
        if (typeof KenBurns !== 'undefined' && mode !== 'none' && mode !== 'static') {
            const preset = KenBurns.getPreset(mode);
            if (preset && (preset.from.scale !== 1 || preset.from.x !== 0 || preset.from.y !== 0 || preset.to.scale !== 1 || preset.to.x !== 0 || preset.to.y !== 0)) {
                const { scale, x, y } = KenBurns.interpolate(preset, progress);
                this.ctx.translate(w / 2, h / 2);
                this.ctx.scale(scale, scale);
                this.ctx.translate(-w / 2 + (x / 100) * w, -h / 2 + (y / 100) * h);
                return;
            }
        }
        // Fallback for legacy mode names
        switch (mode) {
            case 'zoom-in': case 'zoomIn': {
                const scaleIn = 1 + (progress * 0.2);
                this.ctx.translate(w / 2, h / 2);
                this.ctx.scale(scaleIn, scaleIn);
                this.ctx.translate(-w / 2, -h / 2);
                break;
            }
            case 'zoom-out': case 'zoomOut': {
                const scaleOut = 1.2 - (progress * 0.2);
                this.ctx.translate(w / 2, h / 2);
                this.ctx.scale(scaleOut, scaleOut);
                this.ctx.translate(-w / 2, -h / 2);
                break;
            }
            case 'pan-left': case 'panLeft': {
                const offsetLeft = -progress * w * 0.1;
                this.ctx.translate(offsetLeft, 0);
                break;
            }
            case 'pan-right': case 'panRight': {
                const offsetRight = progress * w * 0.1;
                this.ctx.translate(offsetRight, 0);
                break;
            }
            case 'pan-up': case 'panUp': {
                const offsetUp = -progress * h * 0.1;
                this.ctx.translate(0, offsetUp);
                break;
            }
            case 'drift': case 'float': {
                const floatScale = 1 + (Math.sin(progress * Math.PI) * 0.05);
                const floatX = Math.sin(progress * Math.PI * 2) * w * 0.02;
                const floatY = Math.cos(progress * Math.PI * 2) * h * 0.02;
                this.ctx.translate(w / 2 + floatX, h / 2 + floatY);
                this.ctx.scale(floatScale, floatScale);
                this.ctx.translate(-w / 2, -h / 2);
                break;
            }
            case 'none': case 'static': default:
                break;
        }
    }

    _drawImageCover(img, canvasW, canvasH) {
        const imgRatio = img.width / img.height;
        const canvasRatio = canvasW / canvasH;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgRatio > canvasRatio) {
            // Image wider than canvas — crop sides
            sw = img.height * canvasRatio;
            sx = (img.width - sw) / 2;
        } else {
            // Image taller than canvas — crop top/bottom
            sh = img.width / canvasRatio;
            sy = (img.height - sh) / 2;
        }
        this.ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
    }

    async drawImage(imageData) {
        if (!imageData || !imageData.src) return;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this._drawImageCover(img, this._logicalWidth, this._logicalHeight);
                resolve();
            };
            img.onerror = () => resolve();
            img.src = imageData.src;
        });
    }

    drawBalloons(texts, language = 'pt-BR') {
        texts.forEach(balloon => {
            this.ctx.save();

            const x = balloon.x || 0;
            const y = balloon.y || 0;
            const w = balloon.w || 200;
            const h = balloon.h || 100;
            const type = balloon.type || 'speech';
            const direction = balloon.direction || balloon.tailDirection || 's';
            const bgColor = balloon.bgColor || (type === 'narration' ? '#fffde7' : type === 'shout' ? '#fffde7' : 'rgba(255,255,255,0.95)');
            const textColor = balloon.textColor || balloon.color || (type === 'sfx' ? '#ff3333' : '#1a1a1a');
            const strokeColor = balloon.strokeColor || '#1a1a1a';

            this.ctx.fillStyle = bgColor;
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2.5;
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';

            // Draw balloon based on type
            if (type === 'narration') {
                // Narration box: simple rounded rectangle, no tail
                this._roundRect(x, y, w, h, 4);
                this.ctx.fill();
                this.ctx.stroke();
            } else if (type === 'sfx') {
                // SFX: no background, just text
                // Skip background drawing
            } else if (type === 'shout') {
                // Shout: starburst shape
                this._drawShoutBalloon(x, y, w, h, bgColor, strokeColor);
            } else if (type === 'thought') {
                // Thought: cloud shape with bubble trail
                this._drawThoughtBalloon(x, y, w, h, direction, bgColor, strokeColor);
            } else {
                // Speech/whisper: ellipse with tail
                this._drawSpeechBalloon(x, y, w, h, direction, bgColor, strokeColor, type === 'whisper');
            }

            // Draw text
            const fontWeight = balloon.bold ? 'bold ' : '';
            const fontStyle = balloon.italic ? 'italic ' : '';
            this.ctx.fillStyle = textColor;
            this.ctx.font = `${fontStyle}${fontWeight}${balloon.fontSize || 16}px ${this.getFontFamily(balloon.font)}`;
            this.ctx.textAlign = balloon.textAlign || 'center';
            this.ctx.textBaseline = 'middle';

            const balloonText = typeof MultiLang !== 'undefined' 
                ? MultiLang.get(balloon.text, language) 
                : (typeof balloon.text === 'string' ? balloon.text : balloon.text?.['pt-BR'] || '');

            const lines = this.wrapText(balloonText, w - 24);
            const lineHeight = (balloon.fontSize || 16) * 1.3;
            const startY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2;
            const textX = balloon.textAlign === 'left' ? x + 12 : balloon.textAlign === 'right' ? x + w - 12 : x + w / 2;

            lines.forEach((line, i) => {
                this.ctx.fillText(line, textX, startY + i * lineHeight);
            });

            this.ctx.restore();
        });
    }

    _drawSpeechBalloon(x, y, w, h, direction, fill, stroke, isWhisper = false) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const rx = w / 2 - 4;
        const ry = h / 2 - 4;

        // Draw ellipse body
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = fill;
        this.ctx.fill();
        
        if (isWhisper) {
            this.ctx.setLineDash([6, 4]);
        }
        this.ctx.strokeStyle = stroke;
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw tail if direction is not 'none' or 'center'
        if (direction && direction !== 'none' && direction !== 'center') {
            this._drawBalloonTail(cx, cy, rx, ry, direction, fill, stroke);
        }
    }

    _drawBalloonTail(cx, cy, rx, ry, direction, fill, stroke) {
        // Direction vectors for tail positioning
        const dirMap = {
            n:  { dx: 0, dy: -1 },
            s:  { dx: 0, dy: 1 },
            e:  { dx: 1, dy: 0 },
            w:  { dx: -1, dy: 0 },
            ne: { dx: 0.707, dy: -0.707 },
            nw: { dx: -0.707, dy: -0.707 },
            se: { dx: 0.707, dy: 0.707 },
            sw: { dx: -0.707, dy: 0.707 }
        };

        const dir = dirMap[direction] || dirMap.s;
        const tailLength = Math.min(rx, ry) * 0.5;
        const tailWidth = Math.min(rx, ry) * 0.25;

        // Base point on ellipse edge
        const baseX = cx + dir.dx * rx * 0.85;
        const baseY = cy + dir.dy * ry * 0.85;

        // Tip of tail
        const tipX = cx + dir.dx * (rx + tailLength);
        const tipY = cy + dir.dy * (ry + tailLength);

        // Perpendicular vector for tail width
        const perpX = -dir.dy;
        const perpY = dir.dx;

        // Two base corners of tail
        const base1X = baseX + perpX * tailWidth;
        const base1Y = baseY + perpY * tailWidth;
        const base2X = baseX - perpX * tailWidth;
        const base2Y = baseY - perpY * tailWidth;

        // Draw tail with curved sides
        this.ctx.beginPath();
        this.ctx.moveTo(base1X, base1Y);
        
        // Control point for curve
        const ctrlX = (base1X + tipX) / 2 + perpX * tailWidth * 0.3;
        const ctrlY = (base1Y + tipY) / 2 + perpY * tailWidth * 0.3;
        this.ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
        
        const ctrl2X = (base2X + tipX) / 2 - perpX * tailWidth * 0.3;
        const ctrl2Y = (base2Y + tipY) / 2 - perpY * tailWidth * 0.3;
        this.ctx.quadraticCurveTo(ctrl2X, ctrl2Y, base2X, base2Y);
        
        this.ctx.closePath();
        this.ctx.fillStyle = fill;
        this.ctx.fill();
        this.ctx.strokeStyle = stroke;
        this.ctx.stroke();

        // Redraw ellipse edge to cover tail connection (cleaner look)
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = fill;
        this.ctx.fill();
        this.ctx.stroke();
    }

    _drawThoughtBalloon(x, y, w, h, direction, fill, stroke) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        
        // Draw cloud shape using multiple overlapping circles
        this.ctx.fillStyle = fill;
        this.ctx.strokeStyle = stroke;
        
        const numBumps = 8;
        const cloudRx = w / 2 - 8;
        const cloudRy = h / 2 - 8;
        
        // Draw bumpy cloud
        this.ctx.beginPath();
        for (let i = 0; i < numBumps; i++) {
            const angle = (i / numBumps) * Math.PI * 2;
            const bumpRx = cloudRx * (0.7 + 0.3 * Math.sin(i * 2.7));
            const bumpRy = cloudRy * (0.7 + 0.3 * Math.cos(i * 3.1));
            const bx = cx + Math.cos(angle) * bumpRx;
            const by = cy + Math.sin(angle) * bumpRy;
            const bumpSize = Math.min(cloudRx, cloudRy) * (0.25 + 0.1 * Math.sin(i * 1.3));
            
            if (i === 0) {
                this.ctx.moveTo(bx + bumpSize, by);
            }
            this.ctx.arc(bx, by, bumpSize, 0, Math.PI * 2);
        }
        this.ctx.fill();
        
        // Draw main ellipse
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, cloudRx * 0.75, cloudRy * 0.75, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw bubble trail for thought
        if (direction && direction !== 'none' && direction !== 'center') {
            const dirMap = {
                s: { dx: 0, dy: 1 }, sw: { dx: -0.5, dy: 0.86 }, se: { dx: 0.5, dy: 0.86 },
                n: { dx: 0, dy: -1 }, nw: { dx: -0.5, dy: -0.86 }, ne: { dx: 0.5, dy: -0.86 },
                w: { dx: -1, dy: 0 }, e: { dx: 1, dy: 0 }
            };
            const dir = dirMap[direction] || dirMap.s;
            const bubbles = [
                { r: 12, dist: 1.1 },
                { r: 8, dist: 1.35 },
                { r: 5, dist: 1.55 }
            ];
            bubbles.forEach(b => {
                const bx = cx + dir.dx * cloudRx * b.dist;
                const by = cy + dir.dy * cloudRy * b.dist;
                this.ctx.beginPath();
                this.ctx.arc(bx, by, b.r, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            });
        }
        
        // Stroke the cloud outline
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, cloudRx * 0.85, cloudRy * 0.85, 0, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    _drawShoutBalloon(x, y, w, h, fill, stroke) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const spikes = 16;
        const outerR = Math.min(w, h) / 2 + 15;
        const innerR = Math.min(w, h) / 2 - 5;

        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            const isOuter = i % 2 === 0;
            const jitter = 1 + 0.15 * Math.sin(i * 127.1);
            const r = (isOuter ? outerR : innerR) * jitter;
            const px = cx + Math.cos(angle) * r * (w / Math.min(w, h));
            const py = cy + Math.sin(angle) * r * (h / Math.min(w, h));
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = fill;
        this.ctx.fill();
        this.ctx.strokeStyle = stroke;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    _roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
    }

    getFontFamily(font) {
        // Use APP_FONTS from app.js for consistency with editor
        if (typeof FontUtils !== 'undefined') {
            return FontUtils.family(font);
        }
        
        // Fallback map matching APP_FONTS structure (if FontUtils not loaded)
        const fallbacks = {
            serif: "'Lora', Georgia, serif",
            sans: "'Inter', 'Segoe UI', sans-serif",
            comic: "'Bangers', 'Comic Sans MS', cursive",
            mono: "'JetBrains Mono', monospace",
            display: "'Bebas Neue', 'Impact', sans-serif",
            marker: "'Permanent Marker', cursive",
            bangers: "'Bangers', cursive",
            boogaloo: "'Boogaloo', sans-serif",
            lilita: "'Lilita One', cursive",
            fredoka: "'Fredoka One', cursive",
            righteous: "'Righteous', cursive"
        };
        return fallbacks[font] || "'Lora', Georgia, serif";
    }

    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    waitFrame() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000 / this.fps);
        });
    }

    async finalize() {
        // Wait for last frames to be captured before stopping
        await new Promise(r => setTimeout(r, 500));
        
        // Request final frame capture
        if (this.videoTrack && typeof this.videoTrack.requestFrame === 'function') {
            this.videoTrack.requestFrame();
        }
        
        // Wait a bit more for MediaRecorder to process
        await new Promise(r => setTimeout(r, 300));
        
        return new Promise((resolve, reject) => {
            this.mediaRecorder.onstop = () => {
                const blobType = this._resolvedMimeType || this.mediaRecorder.mimeType || 'video/webm';
                const blob = new Blob(this.chunks, { type: blobType });
                resolve(blob);
            };

            this.mediaRecorder.onerror = (e) => {
                reject(new Error('Erro no MediaRecorder: ' + e.error));
            };

            this.mediaRecorder.stop();
        });
    }

    static async exportProject(project, options = {}) {
        const exporter = new VideoExporter(project, options);
        const blob = await exporter.export();
        
        // Download automático
        const ext = exporter._resolvedExtension || 'webm';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.metadata.name}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);

        return blob;
    }

    static async exportVideo(options = {}) {
        // Get project from Store if not provided
        const project = options.project || (typeof Store !== 'undefined' ? Store.get('currentProject') : null);
        
        if (!project) {
            throw new Error('Nenhum projeto disponível para exportar');
        }

        const exporter = new VideoExporter(project, options);
        const blob = await exporter.export();
        // Attach resolved extension to blob for caller convenience
        blob._ext = exporter._resolvedExtension || 'webm';
        return blob;
    }

    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.VideoExporter = VideoExporter;
}
