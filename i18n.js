/* ═══════════════════════════════════════════════════════════════
   HQ MOVIE — i18n System v2.0
   Complete internationalization with JSON translation files
   Default: English (EN) | Secondary: Portuguese (PT-BR)
   ═══════════════════════════════════════════════════════════════ */

const i18n = {
  currentLocale: 'en', // Default EN (SEO primary)
  fallbackLocale: 'en',
  translations: {},
  isReady: false,
  _readyPromise: null,
  _readyResolve: null,
  
  async init() {
    // Create promise for other modules to wait on
    this._readyPromise = new Promise(resolve => {
      this._readyResolve = resolve;
    });
    
    // Detect browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const detectedLocale = browserLang.startsWith('pt') ? 'pt-BR' : 'en';
    
    // Load from localStorage if exists
    const savedLocale = localStorage.getItem('hqm_locale');
    this.currentLocale = savedLocale || detectedLocale;
    
    // Load translations
    await this.loadLocale(this.currentLocale);
    if (this.currentLocale !== this.fallbackLocale) {
      await this.loadLocale(this.fallbackLocale);
    }
    
    // Apply to HTML
    document.documentElement.lang = this.currentLocale;
    
    // Mark ready BEFORE updating meta (so t() works)
    this.isReady = true;
    
    // Resolve promise so waiting modules can proceed
    if (this._readyResolve) this._readyResolve();
    
    // Update SEO meta tags
    this.updateMetaTags();
  },
  
  // Wait for i18n to be ready (for other modules)
  async ready() {
    if (this.isReady) return;
    if (this._readyPromise) await this._readyPromise;
  },
  
  async loadLocale(locale) {
    try {
      const response = await fetch(`/locales/${locale}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.translations[locale] = await response.json();
      // Loaded successfully
    } catch (error) {
      console.warn(`[i18n] Failed to load ${locale}:`, error.message);
    }
  },
  
  t(key, params = {}) {
    if (!this.isReady) {
      return key;
    }
    
    const keys = key.split('.');
    let value = this.translations[this.currentLocale];
    
    // Navigate through object
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Fallback to English
    if (!value && this.currentLocale !== this.fallbackLocale) {
      value = this.getFallback(key);
    }
    
    // Return key if not found (dev mode indicator)
    if (!value) {
      console.warn(`[i18n] Missing key: ${key}`);
      return `[${key}]`;
    }
    
    // Interpolation {{variable}}
    if (typeof value === 'string') {
      return value.replace(/{{(\w+)}}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }
    
    return value;
  },
  
  getFallback(key) {
    const keys = key.split('.');
    let value = this.translations[this.fallbackLocale];
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  },
  
  async changeLocale(locale) {
    
    if (!this.translations[locale]) {
      await this.loadLocale(locale);
    }
    
    this.currentLocale = locale;
    localStorage.setItem('hqm_locale', locale);
    document.documentElement.lang = locale;
    
    // Update meta tags
    this.updateMetaTags();
    
    // Update modal texts
    this.updateModalTexts();
    
    // Re-render UI
    if (window.App && window.App.render) {
      window.App.render();
    }
    
    // Show toast
    if (window.Toast) {
      const langName = locale === 'en' ? 'English' : 'Português';
      Toast.show(this.t('toast.languageChanged', { language: langName }), 'success');
    }
    
    // Locale changed successfully
  },
  
  updateMetaTags() {
    // Update title
    const title = this.t('seo.title');
    document.title = title;
    
    // Update description
    const description = this.t('seo.description');
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', description);
    
    // Update OG tags (if they exist)
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', this.t('seo.ogTitle'));
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', this.t('seo.ogDescription'));
    
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      const locale = this.currentLocale === 'pt-BR' ? 'pt_BR' : 'en_US';
      ogLocale.setAttribute('content', locale);
    }
  },
  
  // Helper for pluralization
  plural(key, count, params = {}) {
    const singularKey = `${key}_one`;
    const pluralKey = `${key}_other`;
    const selectedKey = count === 1 ? singularKey : pluralKey;
    return this.t(selectedKey, { ...params, count });
  },
  
  // Get current locale
  getLocale() {
    return this.currentLocale;
  },
  
  // Check if locale is loaded
  isLocaleLoaded(locale) {
    return !!this.translations[locale];
  },
  
  // Update modal texts dynamically (called after locale change)
  updateModalTexts() {
    // Transition Modal
    const transitionTitle = document.getElementById('transition-modal-title');
    if (transitionTitle) transitionTitle.textContent = this.t('modal.transition');
    
    const cutLabel = document.getElementById('transition-cut-label');
    if (cutLabel) cutLabel.textContent = this.t('modal.cutNone');
    
    const fadeDefaultLabel = document.getElementById('transition-fade-default-label');
    if (fadeDefaultLabel) fadeDefaultLabel.textContent = this.t('modal.fadeDefault');
    
    const fadeSlowLabel = document.getElementById('transition-fade-slow-label');
    if (fadeSlowLabel) fadeSlowLabel.textContent = this.t('modal.fadeSlow');
    
    const fadeFastLabel = document.getElementById('transition-fade-fast-label');
    if (fadeFastLabel) fadeFastLabel.textContent = this.t('modal.fadeFast');
    
    const transitionCancelBtn = document.getElementById('transition-cancel-btn');
    if (transitionCancelBtn) transitionCancelBtn.textContent = this.t('modal.cancel');
    
    const transitionApplyBtn = document.getElementById('transition-apply-btn');
    if (transitionApplyBtn) transitionApplyBtn.textContent = this.t('modal.apply');
    
    // Recording Modal
    const recModalTitle = document.getElementById('rec-modal-title');
    if (recModalTitle) recModalTitle.textContent = this.t('recording.title');
    
    const recStatusLabel = document.getElementById('rec-status-label');
    if (recStatusLabel) recStatusLabel.textContent = this.t('recording.status');
    
    const recBtnRecordLabel = document.getElementById('rec-btn-record-label');
    if (recBtnRecordLabel) recBtnRecordLabel.textContent = this.t('recording.record').replace('🔴 ', '');
    
    const recBtnStopLabel = document.getElementById('rec-btn-stop-label');
    if (recBtnStopLabel) recBtnStopLabel.textContent = this.t('recording.stop').replace('⏹️ ', '');
    
    const recBtnPlayLabel = document.getElementById('rec-btn-play-label');
    if (recBtnPlayLabel) recBtnPlayLabel.textContent = this.t('recording.play').replace('▶️ ', '');
    
    const recBtnSaveLabel = document.getElementById('rec-btn-save-label');
    if (recBtnSaveLabel) recBtnSaveLabel.textContent = this.t('recording.save').replace('💾 ', '');
    
    const recCancelBtn = document.getElementById('rec-cancel-btn');
    if (recCancelBtn) recCancelBtn.textContent = this.t('recording.cancel');
    
    // Excalidraw Modal
    const excalidrawTitle = document.getElementById('excalidraw-modal-title');
    if (excalidrawTitle) excalidrawTitle.textContent = this.t('excalidraw.title');
    
    const excalidrawGuidesLabel = document.getElementById('excalidraw-guides-label');
    if (excalidrawGuidesLabel) excalidrawGuidesLabel.textContent = this.t('excalidraw.guides');
    
    const excalidrawCancelBtn = document.getElementById('excalidraw-cancel-btn');
    if (excalidrawCancelBtn) excalidrawCancelBtn.textContent = this.t('excalidraw.cancel');
    
    const excalidrawSaveBtn = document.getElementById('excalidraw-save-btn');
    if (excalidrawSaveBtn) excalidrawSaveBtn.textContent = this.t('excalidraw.save');
    
    // Floating Text Toolbar
    const fttFont = document.getElementById('ftt-label-font');
    if (fttFont) fttFont.textContent = this.t('floatingToolbar.font');
    
    const fttSize = document.getElementById('ftt-label-size');
    if (fttSize) fttSize.textContent = this.t('floatingToolbar.size');
    
    const fttBold = document.getElementById('ftt-btn-bold');
    if (fttBold) fttBold.title = this.t('tooltip.bold');
    
    const fttItalic = document.getElementById('ftt-btn-italic');
    if (fttItalic) fttItalic.title = this.t('tooltip.italic');
    
    const fttUnderline = document.getElementById('ftt-btn-underline');
    if (fttUnderline) fttUnderline.title = this.t('tooltip.underline');
    
    const fttAlignLeft = document.getElementById('ftt-btn-align-left');
    if (fttAlignLeft) fttAlignLeft.title = this.t('tooltip.alignLeft');
    
    const fttAlignCenter = document.getElementById('ftt-btn-align-center');
    if (fttAlignCenter) fttAlignCenter.title = this.t('tooltip.alignCenter');
    
    const fttAlignRight = document.getElementById('ftt-btn-align-right');
    if (fttAlignRight) fttAlignRight.title = this.t('tooltip.alignRight');
    
    const fttAlignJustify = document.getElementById('ftt-btn-align-justify');
    if (fttAlignJustify) fttAlignJustify.title = this.t('tooltip.justify');
  }
};

// Helper global function
window.t = (key, params) => i18n.t(key, params);
window.i18n = i18n;

// Initialize immediately (before other scripts)
i18n.init();
