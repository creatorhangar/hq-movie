/* ═══════════════════════════════════════════════════════════════
   HQ MOVIE — Onboarding System
   Simple guided tour for first-time users
   ═══════════════════════════════════════════════════════════════ */

const Onboarding = {
    _step: 0,
    _active: false,
    
    init() {
        // Clean up any stuck highlights from previous sessions
        document.querySelectorAll('.ob-highlight').forEach(e => e.classList.remove('ob-highlight'));
        document.querySelectorAll('.onboarding-tooltip').forEach(e => e.remove());
        
        // Check if already completed
        if (!localStorage.getItem('hq_onboarding_v1')) {
            this._active = true;
            this._step = 0;
            console.log('🔰 Onboarding initialized');
        }
    },

    // Called by App.render()
    check(view) {
        if (!this._active) return;
        
        // Delay slightly to ensure DOM is ready
        setTimeout(() => {
            this._checkView(view);
        }, 500);
    },

    _checkView(view) {
        // Dashboard: Point to New Project
        if (view === 'dashboard') {
            const btn = document.querySelector('.btn-primary');
            if (btn) this.showTooltipElement(btn, 'Bem-vindo ao HQ Movie!', 'Comece criando seu primeiro projeto aqui.', 'bottom', () => {
                this.clear(); // User will click the button naturally
            });
        }
        
        // Format Selector: Point to Vertical
        if (view === 'format-selector') {
            this.clear();
            const card = document.querySelector('.format-card'); // First one
            if (card) this.showTooltipElement(card, 'Escolha o Formato', 'Vertical é perfeito para Shorts, Reels e TikTok.', 'bottom', () => {
                this.clear();
            });
        }

        // Editor: Run the main tour
        if (view === 'editor' && this._step < 2) {
            this._step = 2; // Mark as entered editor
            this.runEditorTour();
        }
    },

    runEditorTour() {
        // Define editor steps
        const steps = [
            {
                sel: '#canvas-area',
                title: '1. O Palco',
                text: 'Aqui é onde a mágica acontece. Arraste imagens para cá ou cole (Ctrl+V) para criar páginas.',
                pos: 'center'
            },
            {
                sel: '.left-panel',
                title: '2. Ferramentas',
                text: 'Use balões de fala, layouts e stickers deste painel para dar vida à história.',
                pos: 'right'
            },
            {
                sel: '#timeline-bar',
                title: '3. Timeline de Vídeo',
                text: 'Ajuste a duração de cada página e visualize o fluxo do vídeo.',
                pos: 'top'
            },
            {
                sel: '.toolbar-right .btn-primary',
                title: '4. Exportar',
                text: 'Quando terminar, clique aqui para gerar seu vídeo WebM ou exportar imagens.',
                pos: 'bottom-left'
            }
        ];
        
        this.showStep(steps, 0);
    },

    showStep(steps, index) {
        if (index >= steps.length) {
            this.complete();
            return;
        }
        
        const s = steps[index];
        const el = document.querySelector(s.sel);
        
        if (!el || el.offsetParent === null) {
            // Element not visible, skip
            this.showStep(steps, index + 1);
            return;
        }

        // Scroll into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        this.showTooltipElement(el, s.title, s.text, s.pos, () => {
            this.showStep(steps, index + 1);
        }, true); // true = isTour step (has Next button)
    },

    showTooltipElement(el, title, text, pos, onNext, isTour = false) {
        this.clear();

        const rect = el.getBoundingClientRect();
        
        // Highlight effect (box-shadow hack)
        el.classList.add('ob-highlight');
        
        const tip = document.createElement('div');
        tip.className = 'onboarding-tooltip';
        tip.innerHTML = `
            <h3>${title}</h3>
            <p>${text}</p>
            <div class="ob-actions">
                ${isTour ? '<button class="ob-skip" onclick="Onboarding.complete()">Pular Tour</button>' : ''}
                <button class="ob-next" id="ob-next-btn">${isTour ? 'Próximo →' : 'Entendi'}</button>
            </div>
        `;
        
        document.body.appendChild(tip);
        
        // Positioning
        const tipRect = tip.getBoundingClientRect();
        let top, left;

        if (pos === 'bottom') {
            top = rect.bottom + 15;
            left = rect.left + (rect.width / 2) - (tipRect.width / 2);
        } else if (pos === 'top') {
            top = rect.top - tipRect.height - 15;
            left = rect.left + (rect.width / 2) - (tipRect.width / 2);
        } else if (pos === 'right') {
            top = rect.top + (rect.height / 2) - (tipRect.height / 2);
            left = rect.right + 15;
        } else if (pos === 'bottom-left') {
            top = rect.bottom + 15;
            left = rect.right - tipRect.width;
        } else if (pos === 'center') {
            top = rect.top + (rect.height / 2) - (tipRect.height / 2);
            left = rect.left + (rect.width / 2) - (tipRect.width / 2);
        } else {
            // Default bottom
            top = rect.bottom + 15;
            left = rect.left;
        }

        // Viewport constraints
        if (left < 10) left = 10;
        if (left + tipRect.width > window.innerWidth - 10) left = window.innerWidth - tipRect.width - 10;
        if (top < 10) top = 10;
        if (top + tipRect.height > window.innerHeight - 10) top = window.innerHeight - tipRect.height - 10;

        tip.style.top = `${top}px`;
        tip.style.left = `${left}px`;
        
        // Animate in
        requestAnimationFrame(() => tip.classList.add('visible'));

        // Next handler
        document.getElementById('ob-next-btn').onclick = (e) => {
            e.stopPropagation();
            el.classList.remove('ob-highlight');
            onNext();
        };
    },

    clear() {
        document.querySelectorAll('.onboarding-tooltip').forEach(e => e.remove());
        document.querySelectorAll('.ob-highlight').forEach(e => e.classList.remove('ob-highlight'));
    },

    complete() {
        this._active = false;
        this.clear();
        localStorage.setItem('hq_onboarding_v1', 'true');
        Toast.show('Tour concluído! Se precisar de ajuda, clique no "?" na barra superior.', 'success');
    }
};

// Inject Styles
const style = document.createElement('style');
style.textContent = `
.onboarding-tooltip {
    position: fixed;
    z-index: 10000;
    background: var(--surface-1, #1e1e1e);
    border: 1px solid var(--accent, #14b8a6);
    border-radius: 12px;
    padding: 16px;
    width: 280px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    pointer-events: none;
    color: var(--text-1, #fff);
}
.onboarding-tooltip.visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}
.onboarding-tooltip h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: var(--accent, #14b8a6);
}
.onboarding-tooltip p {
    margin: 0 0 16px 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-2, #ccc);
}
.ob-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
.ob-next {
    background: var(--accent, #14b8a6);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}
.ob-skip {
    background: transparent;
    color: var(--text-3, #888);
    border: none;
    padding: 6px;
    font-size: 12px;
    cursor: pointer;
}
.ob-skip:hover { color: var(--text-1, #fff); }

/* Highlight Effect - no full-screen overlay, just subtle highlight */
.ob-highlight {
    position: relative;
    z-index: 100;
    box-shadow: 0 0 0 4px var(--accent, #14b8a6) !important;
    transition: box-shadow 0.3s ease;
}
`;
document.head.appendChild(style);
