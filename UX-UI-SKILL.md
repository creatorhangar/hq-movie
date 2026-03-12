# UX/UI Validation Skill - HQ Movie

Skill de validação para garantir consistência visual, usabilidade e clareza da interface.

---

## 📋 Checklist de Validação

### 1. VALORES PADRÃO
- [ ] Duração padrão de página = **2.5s** (não 4s)
- [ ] Range de duração = **0.5-15s** (não 2-10s)
- [ ] Mínimo para capa = **0.3s**
- [ ] Transição padrão = **0.3s** crossfade

### 2. CONSISTÊNCIA VISUAL
- [ ] Border-radius consistente (4-12px, estilo quadrado)
- [ ] Espaçamentos uniformes (4, 8, 12, 16px)
- [ ] Cores do sistema usadas (--accent, --text, --surface)
- [ ] Touch targets mínimo 44px no mobile

### 3. NOMENCLATURA CLARA
- [ ] "FOTOS EM SEQUÊNCIA" (não "SLIDESHOW")
- [ ] Explicação visual clara de funcionalidades
- [ ] Tooltips em botões de ação
- [ ] Labels em português consistentes

### 4. HIERARQUIA DA SIDEBAR
Ordem por frequência de uso:
1. BIBLIOTECA
2. FOTOS EM SEQUÊNCIA
3. PAGINA
4. DURAÇÃO
5. ANIMAÇÃO
6. TRANSIÇÃO
7. EFEITOS (colapsado)
8. CAMADAS (colapsado)
9. STICKERS (colapsado)
10. AUDIO (colapsado)
11. ATALHOS (colapsado)

### 5. REDUÇÃO DE CLIQUES
- [ ] Dashboard: templates visíveis direto (sem `<details>`)
- [ ] Recent Projects acima do fold
- [ ] Ações principais em 2 cliques máximo
- [ ] Botões de ação proeminentes

### 6. MOBILE
- [ ] Placeholders legíveis (font-size mínimo 14px)
- [ ] Ícones touch-friendly (48px+)
- [ ] Sidebar scroll suave
- [ ] Navegação inferior funcional
- [ ] Sem erros JS no console

### 7. CLAREZA DE SEQUÊNCIA DE FOTOS
- [ ] Seção destacada com borda colorida
- [ ] Explicação inline: "Uma página, várias fotos"
- [ ] Barra de timeline visual mostrando proporções
- [ ] Miniaturas com duração visível
- [ ] Botão "Dividir" proeminente

---

## 🔍 Comandos de Validação

### Grep para valores hardcoded
```bash
grep -rn "|| 4" ui.js controller.js
grep -rn "(2-10)" ui.js
grep -rn ": 4s" ui.js
grep -rn "duration.*4" ui.js controller.js
```

### Teste MCP (Playwright)
1. Navegar para localhost:8082
2. Criar novo projeto
3. Verificar duração = 2.5s
4. Verificar range = (0.5-15)
5. Testar mobile (375x812)
6. Verificar console sem erros

---

## ✅ Correções Aplicadas (Mar 2026)

| Issue | Correção | Arquivo |
|-------|----------|---------|
| Duração padrão 4s → 2.5s | `duration: 2.5` | app.js, controller.js, ui.js |
| Range (2-10) → (0.5-15) | `min="0.5" max="15"` | ui.js |
| SLIDESHOW → FOTOS EM SEQUÊNCIA | Renomeado seção | ui.js |
| Erro `_closeMobileSidebar` | Removido underscore | controller.js |
| Placeholders pequenos | CSS mobile aumentado | styles-v3.css |
| Dashboard `<details>` | Templates diretos | ui.js |
| Timeline cards pequenos | 90x68px | styles-v3.css |

---

## 📸 Screenshots de Referência

- `audit-dashboard-desktop.png` - Dashboard desktop
- `audit-new-project-desktop.png` - Editor com valores corretos
- `audit-new-project-mobile.png` - Mobile view
- `audit-mobile-sidebar.png` - Sidebar mobile
