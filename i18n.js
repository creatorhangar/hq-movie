// ═══════════════════════════════════════════════════════════════
// i18n.js - Sistema de Internacionalização para HQ Movie
// ═══════════════════════════════════════════════════════════════

const I18n = {
  // Idiomas suportados
  languages: {
    'pt-BR': { name: 'Português', flag: '🇧🇷', code: 'PT' },
    'en': { name: 'English', flag: '🇺🇸', code: 'EN' },
    'es': { name: 'Español', flag: '🇪🇸', code: 'ES' },
    'fr': { name: 'Français', flag: '🇫🇷', code: 'FR' }
  },

  // Traduções da interface
  translations: {
    // Toolbar
    'toolbar.home': { 'pt-BR': 'Início', 'en': 'Home', 'es': 'Inicio', 'fr': 'Accueil' },
    'toolbar.undo': { 'pt-BR': 'Desfazer', 'en': 'Undo', 'es': 'Deshacer', 'fr': 'Annuler' },
    'toolbar.redo': { 'pt-BR': 'Refazer', 'en': 'Redo', 'es': 'Rehacer', 'fr': 'Refaire' },
    'toolbar.text': { 'pt-BR': 'Texto', 'en': 'Text', 'es': 'Texto', 'fr': 'Texte' },
    'toolbar.guides': { 'pt-BR': 'Guias', 'en': 'Guides', 'es': 'Guías', 'fr': 'Guides' },
    'toolbar.export': { 'pt-BR': 'Exportar', 'en': 'Export', 'es': 'Exportar', 'fr': 'Exporter' },
    'toolbar.preview': { 'pt-BR': 'Preview tela cheia', 'en': 'Fullscreen preview', 'es': 'Vista previa pantalla completa', 'fr': 'Aperçu plein écran' },
    'toolbar.shortcuts': { 'pt-BR': 'Atalhos', 'en': 'Shortcuts', 'es': 'Atajos', 'fr': 'Raccourcis' },
    'toolbar.tools': { 'pt-BR': 'Ferramentas', 'en': 'Tools', 'es': 'Herramientas', 'fr': 'Outils' },
    'toolbar.properties': { 'pt-BR': 'Propriedades', 'en': 'Properties', 'es': 'Propiedades', 'fr': 'Propriétés' },
    'toolbar.saved': { 'pt-BR': '✓ Salvo', 'en': '✓ Saved', 'es': '✓ Guardado', 'fr': '✓ Enregistré' },
    
    // Dashboard
    'dashboard.recent': { 'pt-BR': 'Projetos Recentes', 'en': 'Recent Projects', 'es': 'Proyectos Recientes', 'fr': 'Projets Récents' },
    'dashboard.delete': { 'pt-BR': 'Apagar', 'en': 'Delete', 'es': 'Eliminar', 'fr': 'Supprimer' },
    'dashboard.pages': { 'pt-BR': 'pag', 'en': 'pgs', 'es': 'pág', 'fr': 'pgs' },
    
    // Toast messages
    'toast.saved': { 'pt-BR': 'Projeto salvo', 'en': 'Project saved', 'es': 'Proyecto guardado', 'fr': 'Projet enregistré' },
    'toast.lang_active': { 
      'pt-BR': '🇧🇷 Português ativo', 
      'en': '🇺🇸 English active', 
      'es': '🇪🇸 Español activo', 
      'fr': '🇫🇷 Français actif' 
    },
    
    // Balloon types
    'balloon.speech': { 'pt-BR': 'Fala', 'en': 'Speech', 'es': 'Habla', 'fr': 'Parole' },
    'balloon.thought': { 'pt-BR': 'Pensamento', 'en': 'Thought', 'es': 'Pensamiento', 'fr': 'Pensée' },
    'balloon.whisper': { 'pt-BR': 'Sussurro', 'en': 'Whisper', 'es': 'Susurro', 'fr': 'Chuchotement' },
    'balloon.shout': { 'pt-BR': 'Grito', 'en': 'Shout', 'es': 'Grito', 'fr': 'Cri' },
    'balloon.sfx': { 'pt-BR': 'Efeito', 'en': 'SFX', 'es': 'Efecto', 'fr': 'Effet' },
    
    // Common actions
    'action.add': { 'pt-BR': 'Adicionar', 'en': 'Add', 'es': 'Añadir', 'fr': 'Ajouter' },
    'action.remove': { 'pt-BR': 'Remover', 'en': 'Remove', 'es': 'Eliminar', 'fr': 'Supprimer' },
    'action.edit': { 'pt-BR': 'Editar', 'en': 'Edit', 'es': 'Editar', 'fr': 'Modifier' },
    'action.duplicate': { 'pt-BR': 'Duplicar', 'en': 'Duplicate', 'es': 'Duplicar', 'fr': 'Dupliquer' },
    'action.cancel': { 'pt-BR': 'Cancelar', 'en': 'Cancel', 'es': 'Cancelar', 'fr': 'Annuler' },
    'action.confirm': { 'pt-BR': 'Confirmar', 'en': 'Confirm', 'es': 'Confirmar', 'fr': 'Confirmer' },
    
    // Timeline
    'timeline.pages': { 'pt-BR': 'Pages', 'en': 'Pages', 'es': 'Páginas', 'fr': 'Pages' },
    'timeline.assets': { 'pt-BR': 'Assets', 'en': 'Assets', 'es': 'Recursos', 'fr': 'Ressources' }
  },

  // Idioma ativo (UI do app, não do conteúdo)
  uiLanguage: 'pt-BR',

  // Obter tradução para chave
  t(key, lang = null) {
    const targetLang = lang || this.uiLanguage;
    const translation = this.translations[key];
    
    if (!translation) {
      console.warn(`[i18n] Missing translation key: ${key}`);
      return key;
    }
    
    return translation[targetLang] || translation['pt-BR'] || key;
  },

  // Obter tradução com interpolação de variáveis
  // Exemplo: I18n.t('message.hello', null, { name: 'João' })
  // Com tradução: "Olá, {name}!" → "Olá, João!"
  tf(key, lang = null, vars = {}) {
    let text = this.t(key, lang);
    Object.keys(vars).forEach(k => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
    });
    return text;
  },

  // Definir idioma da UI
  setUILanguage(lang) {
    if (!this.languages[lang]) {
      console.warn(`[i18n] Unsupported language: ${lang}`);
      return;
    }
    this.uiLanguage = lang;
    localStorage.setItem('hq-movie-ui-lang', lang);
  },

  // Carregar idioma da UI do localStorage
  loadUILanguage() {
    const saved = localStorage.getItem('hq-movie-ui-lang');
    if (saved && this.languages[saved]) {
      this.uiLanguage = saved;
    }
  },

  // Obter lista de idiomas disponíveis
  getAvailableLanguages() {
    return Object.keys(this.languages).map(code => ({
      code,
      ...this.languages[code]
    }));
  },

  // Adicionar novas traduções dinamicamente
  addTranslations(newTranslations) {
    Object.assign(this.translations, newTranslations);
  },

  // Adicionar novo idioma
  addLanguage(code, name, flag, shortCode) {
    this.languages[code] = { name, flag, code: shortCode };
  }
};

// Carregar idioma da UI ao iniciar
I18n.loadUILanguage();

// Exportar globalmente
window.I18n = I18n;
