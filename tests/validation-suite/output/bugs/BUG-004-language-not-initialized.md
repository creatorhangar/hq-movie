### BUG #4: activeLanguage Não Inicializado ao Criar Projeto

**Severidade:** ● Médio

**Onde:** Dashboard > Novo Projeto > Editor

**Passos para Reproduzir:**
1. Clicar "Novo Projeto"
2. Selecionar formato
3. No console: `Store.get('currentProject').activeLanguage` → `undefined`

**Esperado:**
`activeLanguage` deveria ser `'pt-BR'` (default)

**Atual:**
`undefined` — a migration em `controller.js:344` só roda quando projeto é reaberto,
não quando é criado pela primeira vez

**Impacto:**
- Balloon text não é salvo como multi-lang (fica como string simples)
- Ctrl+T language toggle não funciona até migration rodar
- Export pode usar idioma errado

**Fix Sugerido:**
Adicionar `activeLanguage: 'pt-BR'` no objeto de criação de projeto.

**Prioridade:** Média — afeta workflow bilíngue
