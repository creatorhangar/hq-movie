/* ═══════════════════════════════════════════════════════════════
   SLIDESHOW AUDIO SYNC - Auto-sync logic, modals, and preview
   ═══════════════════════════════════════════════════════════════ */

// Slideshow Audio Sync Manager
const SlideshowAudioSync = {
    
    // Detect conflicts between audio duration and slides
    detectConflict(page) {
        if (!page.slides || page.slides.length === 0) {
            return { type: 'no-slides', severity: 'error' };
        }
        
        if (!page.slideshowAudio || !page.slideshowAudio.file) {
            return { type: 'no-audio', severity: 'info' };
        }
        
        const audioSec = page.slideshowAudio.duration;
        const slideCount = page.slides.length;
        const totalSlideSec = page.slides.reduce((sum, s) => sum + (s.duration || 0), 0);
        
        // Edge cases
        if (slideCount > 50) {
            return { type: 'too-many-slides', severity: 'error', slideCount };
        }
        
        if (audioSec > 300) { // 5 minutes
            return { type: 'audio-too-long', severity: 'warning', audioSec };
        }
        
        // Perfect sync (within 1s tolerance)
        if (Math.abs(audioSec - totalSlideSec) <= 1) {
            return { type: 'perfect', severity: 'success', audioSec, totalSlideSec };
        }
        
        // Audio longer than slides
        if (audioSec > totalSlideSec + 1) {
            const diff = audioSec - totalSlideSec;
            const suggestedPerSlide = audioSec / slideCount;
            
            // Extreme case: very few slides for long audio
            if (suggestedPerSlide > 20) {
                return { 
                    type: 'audio-much-longer', 
                    severity: 'warning', 
                    audioSec, 
                    totalSlideSec, 
                    diff,
                    slideCount,
                    suggestedPerSlide: Math.round(suggestedPerSlide * 10) / 10
                };
            }
            
            return { 
                type: 'audio-longer', 
                severity: 'warning', 
                audioSec, 
                totalSlideSec, 
                diff,
                slideCount 
            };
        }
        
        // Slides longer than audio
        if (totalSlideSec > audioSec + 1) {
            const diff = totalSlideSec - audioSec;
            const avgPerSlide = totalSlideSec / slideCount;
            
            // Too many slides for short audio
            if (avgPerSlide < 1.5) {
                return { 
                    type: 'too-many-slides-short-audio', 
                    severity: 'warning', 
                    audioSec, 
                    totalSlideSec, 
                    diff,
                    slideCount,
                    avgPerSlide: Math.round(avgPerSlide * 10) / 10
                };
            }
            
            return { 
                type: 'slides-longer', 
                severity: 'warning', 
                audioSec, 
                totalSlideSec, 
                diff,
                slideCount 
            };
        }
        
        return { type: 'unknown', severity: 'info' };
    },
    
    // Apply sync mode to slides
    applySync(page, mode, options = {}) {
        if (!page.slides || page.slides.length === 0) return false;
        if (!page.slideshowAudio || !page.slideshowAudio.file) return false;
        
        const audioSec = page.slideshowAudio.duration;
        const slideCount = page.slides.length;
        
        switch (mode) {
            case 'loop':
                // Loop slides to fill audio duration
                const perSlide = options.perSlideDuration || 5;
                page.slides.forEach(s => { s.duration = perSlide; });
                page.slideshowAudio.syncMode = 'loop';
                page.slideshowAudio.perSlideDuration = perSlide;
                break;
                
            case 'distribute':
                // Distribute audio time equally among slides
                const equalDuration = Math.round((audioSec / slideCount) * 10) / 10;
                page.slides.forEach(s => { s.duration = equalDuration; });
                page.slideshowAudio.syncMode = 'distribute';
                break;
                
            case 'kenburns':
                // Use slow Ken Burns with equal distribution
                const kbDuration = Math.round((audioSec / slideCount) * 10) / 10;
                page.slides.forEach(s => { 
                    s.duration = kbDuration;
                    s.kenBurns = 'drift'; // Slow drift effect
                });
                page.slideshowAudio.syncMode = 'kenburns';
                break;
                
            case 'cut-slides':
                // Reduce number of slides to fit audio
                const targetCount = Math.floor(audioSec / 3); // 3s per slide
                if (targetCount < slideCount) {
                    page.slides = page.slides.slice(0, targetCount);
                    const newDuration = Math.round((audioSec / targetCount) * 10) / 10;
                    page.slides.forEach(s => { s.duration = newDuration; });
                }
                page.slideshowAudio.syncMode = 'auto';
                break;
                
            case 'manual':
                page.slideshowAudio.syncMode = 'manual';
                break;
                
            default:
                return false;
        }
        
        // Update page duration to match total slides duration
        const totalSlidesDuration = page.slides.reduce((sum, s) => sum + (s.duration || 2), 0);
        page.duration = totalSlidesDuration;
        
        return true;
    },
    
    // Get recommended sync mode based on conflict
    getRecommendation(conflict) {
        switch (conflict.type) {
            case 'audio-much-longer':
                return 'loop'; // Best for very long audio
            case 'audio-longer':
                return conflict.diff < 10 ? 'distribute' : 'loop';
            case 'too-many-slides-short-audio':
                return 'cut-slides';
            case 'slides-longer':
                return 'distribute'; // Shorten each slide
            default:
                return 'auto';
        }
    }
};

// Slideshow Preview Manager
const SlideshowPreview = {
    playing: false,
    currentTime: 0,
    currentSlideIndex: 0,
    audioSource: null,
    startTimestamp: 0,
    rafId: null,
    audioContext: null,
    gainNode: null,
    
    async play(page) {
        if (!page.slides || page.slides.length === 0) return false;
        if (!page.slideshowAudio || !page.slideshowAudio.file) {
            // Play without audio
            return this.playVisualOnly(page);
        }
        
        // Stop if already playing
        if (this.playing) {
            this.stop();
            return false;
        }
        
        try {
            // Load and play audio
            this.audioContext = AudioManager.getContext();
            const buffer = await AudioManager.loadAudioBuffer(page.slideshowAudio.file);
            
            this.audioSource = this.audioContext.createBufferSource();
            this.gainNode = this.audioContext.createGain();
            
            this.audioSource.buffer = buffer;
            this.audioSource.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = page.slideshowAudio.volume || 0.8;
            
            this.audioSource.onended = () => {
                this.stop();
            };
            
            this.audioSource.start(0, this.currentTime);
            this.startTimestamp = Date.now() - (this.currentTime * 1000);
            this.playing = true;
            
            // Start animation loop
            this.updateLoop(page);
            
            return true;
        } catch (err) {
            console.error('Slideshow preview error:', err);
            return false;
        }
    },
    
    playVisualOnly(page) {
        this.playing = true;
        this.startTimestamp = Date.now() - (this.currentTime * 1000);
        this.updateLoop(page);
        return true;
    },
    
    pause() {
        if (!this.playing) return;
        
        if (this.audioSource) {
            try {
                this.audioSource.stop();
            } catch (e) {}
            this.audioSource = null;
        }
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        this.playing = false;
    },
    
    stop() {
        this.pause();
        this.currentTime = 0;
        this.currentSlideIndex = 0;
        
        if (typeof renderCanvas === 'function') {
            renderCanvas();
        }
        if (typeof renderRightPanel === 'function') {
            renderRightPanel();
        }
    },
    
    seek(time, page) {
        const wasPlaying = this.playing;
        
        if (this.playing) {
            this.pause();
        }
        
        this.currentTime = Math.max(0, time);
        
        // Calculate which slide should be showing
        let accumulatedTime = 0;
        for (let i = 0; i < page.slides.length; i++) {
            const slideDuration = page.slides[i].duration || 0;
            if (this.currentTime < accumulatedTime + slideDuration) {
                this.currentSlideIndex = i;
                break;
            }
            accumulatedTime += slideDuration;
        }
        
        if (wasPlaying) {
            this.play(page);
        } else {
            if (typeof App !== 'undefined' && App.setSlidePreview) {
                App.setSlidePreview(this.currentSlideIndex);
            }
        }
    },
    
    updateLoop(page) {
        if (!this.playing) return;
        
        // Update current time
        this.currentTime = (Date.now() - this.startTimestamp) / 1000;
        
        // Calculate which slide should be showing
        let accumulatedTime = 0;
        let newSlideIndex = 0;
        
        for (let i = 0; i < page.slides.length; i++) {
            const slideDuration = page.slides[i].duration || 0;
            if (this.currentTime < accumulatedTime + slideDuration) {
                newSlideIndex = i;
                break;
            }
            accumulatedTime += slideDuration;
        }
        
        // Update canvas if slide changed
        if (newSlideIndex !== this.currentSlideIndex) {
            this.currentSlideIndex = newSlideIndex;
            if (typeof App !== 'undefined' && App.setSlidePreview) {
                App.setSlidePreview(newSlideIndex);
            }
        }
        
        // Update UI
        if (typeof renderRightPanel === 'function') {
            const scrubber = document.getElementById('slideshow-preview-scrubber');
            const timeDisplay = document.getElementById('slideshow-preview-time');
            
            if (scrubber) {
                const totalDuration = page.slideshowAudio?.duration || page.slides.reduce((s, sl) => s + (sl.duration || 0), 0);
                scrubber.value = this.currentTime;
                scrubber.max = totalDuration;
            }
            
            if (timeDisplay) {
                const totalDuration = page.slideshowAudio?.duration || page.slides.reduce((s, sl) => s + (sl.duration || 0), 0);
                const currentMin = Math.floor(this.currentTime / 60);
                const currentSec = Math.floor(this.currentTime % 60);
                const totalMin = Math.floor(totalDuration / 60);
                const totalSec = Math.floor(totalDuration % 60);
                timeDisplay.textContent = `${currentMin}:${currentSec.toString().padStart(2, '0')} / ${totalMin}:${totalSec.toString().padStart(2, '0')}`;
            }
        }
        
        // Check if finished
        const totalDuration = page.slideshowAudio?.duration || page.slides.reduce((s, sl) => s + (sl.duration || 0), 0);
        if (this.currentTime >= totalDuration) {
            this.stop();
            return;
        }
        
        // Continue loop
        this.rafId = requestAnimationFrame(() => this.updateLoop(page));
    }
};

// Export to global scope
if (typeof window !== 'undefined') {
    window.SlideshowAudioSync = SlideshowAudioSync;
    window.SlideshowPreview = SlideshowPreview;
}
