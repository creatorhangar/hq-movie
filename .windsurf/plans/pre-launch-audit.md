# Auditoria Pré-Lançamento HQ Movie

## Problemas Críticos Reportados

### 1. ✅ Whisper Tail - Linha Preta Divisória
**Status**: CORRIGIDO
- **Problema**: Linha preta visível na divisão do tail
- **Causa**: Triple box-shadow inset criava linha de separação
- **Fix**: Substituído por `background + box-shadow` simples em todas as 8 direções
- **Código**: `styles-v3.css` L2368-2432

### 2. ⚠️ Modal de Texto - Carrega Oculto Embaixo
**Status**: INVESTIGAR
- **Problema**: Modal carrega em baixo de forma oculta
- **Possível causa**: z-index ou display:none inicial
- **Ação**: Verificar renderização do modal e z-index hierarchy

### 3. 🔴 Botões Não Funcionam
**Status**: CRÍTICO - INVESTIGAR
- **Problema**: Nenhum botão do frontend está respondendo
- **Possível causa**: 
  - Event listeners não anexados
  - Erro JS bloqueando execução
  - Overlay invisível bloqueando cliques
- **Ação**: Verificar console errors, event delegation, z-index

### 4. 🔴 Drag Não Funciona
**Status**: CRÍTICO - INVESTIGAR
- **Problema**: Arrastar não está funcionando
- **Possível causa**: mousedown/mousemove handlers não anexados
- **Ação**: Verificar drag handlers em controller.js

### 5. 📋 Adicionar Página no Carrossel
**Status**: PENDENTE
- **Problema**: Falta botão "+" no carrossel para adicionar página
- **Ação**: Adicionar botão após última página no carrossel

## Plano de Correção

1. Bump versões (whisper fix)
2. Verificar console errors
3. Testar botões básicos (novo projeto, adicionar página)
4. Testar drag (balões, painéis)
5. Fix modal texto z-index
6. Adicionar botão "+" no carrossel
7. Teste completo end-to-end
8. Deploy

## Arquivos a Modificar
- `styles-v3.css` - whisper tail ✅
- `sw.js` + `index.html` - bump versions
- `ui.js` - modal z-index, botão carrossel
- `controller.js` - verificar event listeners
