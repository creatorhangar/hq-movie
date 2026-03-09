### BUG #5: Ctrl+T Abre Nova Aba do Browser em vez de Trocar Idioma

**Severidade:** ○ Médio

**Onde:** Editor > Atalho de teclado Ctrl+T

**Passos para Reproduzir:**
1. Abrir editor com projeto
2. Pressionar Ctrl+T
3. Nova aba do browser abre

**Esperado:**
Idioma deveria alternar entre PT-BR e EN (conforme controller.js:5284)

**Atual:**
O browser intercepta Ctrl+T antes do handler JavaScript.
O `e.preventDefault()` no controller.js:5284 pode não estar sendo chamado
porque o evento é capturado pelo browser primeiro.

**Análise:**
```js
// controller.js:5284
if (e.key === 't' || e.key === 'T') { 
  e.preventDefault(); 
  this.toggleActiveLanguage(); 
}
```
O `preventDefault()` pode não funcionar para Ctrl+T em todos os browsers,
pois é um atalho nativo do browser (abrir nova aba).

**Fix Sugerido:**
Usar atalho diferente (ex: Ctrl+L para Language, ou Alt+T)

**Prioridade:** Média — impede troca rápida de idioma via teclado
