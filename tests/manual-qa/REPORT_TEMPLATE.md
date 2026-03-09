📋 DIRETRIZ COMPLETA: TESTE CRÍTICO DO HQ MOVIE
Para: Cursor AI
Objetivo: Testar app como usuário real, encontrar bugs, comparar com concorrentes, identificar melhorias
Método: Testes exploratórios manuais no navegador real
Duração: 2-3 horas de testes intensivos

🎯 REGRAS DE OURO

USAR O NAVEGADOR REAL - Não use Playwright/APIs, abra http://localhost:8082 no Chrome/Firefox
AGIR COMO USUÁRIO FRUSTRADO - Clique rápido, cancele ações, tente quebrar
SCREENSHOTS OBRIGATÓRIOS - Cada bug encontrado = print da tela
COMPARAR COM CONCORRENTES - Canva, Adobe Express, CapCut, Clipchamp
SEM ADICIONAR FEATURES NOVAS - Só melhorar o que já existe


📊 ESTRUTURA DO TESTE
FASE 1: Testes de Stress (UI/Interação)      [45min]
FASE 2: Testes de Workflow (Fluxos Completos) [60min]
FASE 3: Comparação com Concorrentes           [30min]
FASE 4: Relatório Final com Melhorias         [15min]

🔥 FASE 1: TESTES DE STRESS (45 min)
1.1 Teste de Clicks Duplos/Triplos
Objetivo: Ver se clicar 2-3 vezes rápido quebra algo
□ Dashboard: Clicar "Novo Projeto" 3 vezes rápido
  Esperado: Abre apenas 1 modal
  Bug?: Múltiplos modais? Erro no console?
  
□ Formato: Clicar "Vertical" + "Widescreen" alternando rápido (5x)
  Esperado: Só o último clicado fica selecionado
  Bug?: Ambos ficam selecionados? Preview quebra?

□ Editor: Clicar painel 1 → painel 2 → painel 1 (rápido, 10x)
  Esperado: Seleção muda suavemente
  Bug?: Borda de seleção duplica? Layout quebra?

□ Balão: Clicar "Fala" 5 vezes seguidas sem clicar no canvas
  Esperado: Toast "Clique no canvas" aparece 1 vez
  Bug?: 5 toasts empilhados? App trava?

□ Timeline: Adicionar página → deletar → adicionar → deletar (10x)
  Esperado: Funciona sempre
  Bug?: Timeline some? Páginas fantasma?
COMO TESTAR:

Abra DevTools (F12) → aba Console
Execute cada teste
Se aparecer ERRO vermelho → screenshot + copiar erro
Se comportamento estranho → screenshot + descrever


1.2 Teste de Ações Simultâneas
Objetivo: Clicar em 2 coisas ao mesmo tempo
□ Clicar painel 1 + sidebar "Fala" simultaneamente
  Bug?: Balão vai pro painel errado? Nada acontece?

□ Arrastar imagem pro painel + clicar "Zoom In" antes de soltar
  Bug?: Imagem não carrega? Animação não aplica?

□ Digitar texto balão PT-BR + trocar idioma pra EN no meio
  Bug?: Texto desaparece? Salva no idioma errado?

□ Preview rodando + clicar "Exportar"
  Bug?: Dois processos simultâneos? App trava?

□ Upload de áudio + deletar página que tem o áudio
  Bug?: Referência quebra? Console error?

1.3 Teste de Edição Rápida (Race Conditions)
Objetivo: Fazer mudanças antes da anterior terminar
□ Mudar duração da página de 4s → 6s → 2s → 8s (rápido)
  Bug?: Valor fica incorreto? Preview dessincroniza?

□ Adicionar 10 balões em 5 segundos (click spamming)
  Bug?: Alguns não aparecem? Balões sobrepostos?

□ Digitar texto narrativo PT-BR (50 chars) + apagar tudo + digitar EN (40 chars) em 3 segundos
  Bug?: Contador de caracteres errado? Warning não atualiza?

□ Aplicar Ken Burns: Zoom In → Pan → Zoom Out → Static → Flutuação (rápido)
  Bug?: Ícone não atualiza? Exportação usa animação errada?

□ Upload imagem grande (5MB) + trocar de página antes de carregar
  Bug?: Imagem carrega na página errada? Upload cancela?

1.4 Teste de Tamanhos Extremos
Objetivo: Usar valores fora do comum
□ Balão com 1 caractere: "A"
  Bug?: Balão muito pequeno? Texto corta?

□ Balão com 500 caracteres (copiar Lorem Ipsum)
  Bug?: Balão gigante cobre tela? Texto sai fora?

□ Narrativa com 1000 caracteres
  Bug?: Textarea quebra? Warning funciona?

□ Projeto com 20 páginas (máximo)
  Bug?: Timeline quebra? Scroll funciona?

□ Página com 10 balões sobrepostos no mesmo local
  Bug?: Impossível clicar em um específico? Performance ruim?

□ Upload de imagem 10MB (alta resolução)
  Bug?: App trava? Demora muito? Erro de memória?

□ Upload de áudio 5 minutos (música completa)
  Bug?: Duração da página trava? Preview não toca?

1.5 Teste de Navegação Caótica
Objetivo: Navegar sem ordem lógica
□ Abrir editor → voltar pro dashboard → criar novo projeto (sem salvar)
  Bug?: Projeto anterior perdido sem aviso?

□ Criar projeto → adicionar 3 páginas → voltar pra página 1 → deletar página 2 → ir pra página 3
  Bug?: Índices quebram? Página errada aparece?

□ Estar editando balão PT-BR → trocar pra EN → voltar pra PT-BR → trocar de página
  Bug?: Texto não salva? Cursor fica preso?

□ Preview rodando → clicar em página diferente no meio
  Bug?: Preview continua? Para corretamente?

□ Export iniciado → clicar "Voltar" antes de terminar
  Bug?: Export continua em background? Modal não fecha?

1.6 Teste de Responsividade (Zoom/Resize)
Objetivo: Ver se layout quebra com tamanhos diferentes
□ Zoom 50% (Ctrl + -)
  Bug?: Canvas muito pequeno? Sidebar sobrepõe?

□ Zoom 200% (Ctrl + +)
  Bug?: Scroll horizontal aparece? Botões cortados?

□ Redimensionar janela pra 800x600 (pequeno)
  Bug?: Layout quebra? Timeline desaparece?

□ Redimensionar pra 3840x2160 (4K)
  Bug?: Canvas minúsculo no centro? UI mal aproveitada?

□ Alternar entre fullscreen (F11) e normal
  Bug?: Canvas não redimensiona? Preview quebra?

1.7 Teste de Dados Inválidos
Objetivo: Tentar quebrar com inputs ruins
□ Colar emoji no balão: "😀🎉💥"
  Bug?: Renderiza? Font suporta? Export funciona?

□ Colar HTML no balão: "<b>Teste</b>"
  Bug?: HTML executa? Texto literal aparece?

□ Textarea narrativa: colar 10.000 caracteres
  Bug?: App trava? Scroll infinito?

□ Upload de arquivo .txt como imagem
  Bug?: Erro claro? Crash?

□ Upload de .mp4 como áudio
  Bug?: Aceita? Erro? Toca?

□ Duração da página: digitar "-5" ou "abc"
  Bug?: Aceita negativo? Crash? Validação funciona?

🎬 FASE 2: TESTES DE WORKFLOW (60 min)
2.1 Workflow Completo: Story Instagram (15min)
Objetivo: Criar 1 vídeo vertical do zero até export
PASSO A PASSO:
1. Dashboard → Novo Projeto → Vertical
2. Página 1:
   - Layout: Full
   - Upload imagem (foto qualquer)
   - Adicionar balão "Fala": "Olá! Bem-vindo!"
   - Traduzir EN: "Hello! Welcome!"
   - Ken Burns: Zoom In
   - Duração: 4s
   
3. Página 2:
   - Layout: Duo (2 painéis)
   - Upload 2 imagens
   - Adicionar 2 balões "Pensamento"
   - Ken Burns: Pan Right
   - Duração: 5s
   
4. Narrativa:
   - Modo: Track Contínuo
   - Posição: Bottom
   - PT-BR: "Uma aventura incrível está começando..."
   - EN: "An incredible adventure is beginning..."
   
5. Áudio:
   - Música de fundo: (se tiver test-audio/)
   - Narração PT pág 1: (se tiver)
   
6. Preview:
   - Clicar Play
   - Assistir completo (2 páginas)
   - Verificar: música toca? Texto aparece? Animações suaves?
   
7. Export PT-BR:
   - Qualidade: Média
   - FPS: 30
   - Exportar
   - Aguardar download
   
8. Assistir no VLC:
   - Aspect ratio 9:16?
   - Texto legível (56px)?
   - Stroke visível?
   - Áudio sincronizado?

CHECKLIST DE BUGS:
□ Imagem carregou no painel errado?
□ Balão não apareceu ao clicar?
□ Texto narrativo não apareceu no preview?
□ Preview travou?
□ Export falhou?
□ Vídeo corrompido?
□ Texto ilegível (ainda 15px)?
□ Áudio dessincronizado?
SCREENSHOT: A cada etapa (1-8), tirar print

2.2 Workflow Stress: 10 Páginas com Tudo (20min)
Objetivo: Testar limites do app
CRIAR PROJETO:
- Formato: Widescreen (YouTube)
- 10 páginas
- Cada página:
  * Layout diferente (Full, Duo, Trio, Grid, etc)
  * 1-2 imagens
  * 3-5 balões (mix de tipos)
  * Ken Burns (variar)
  * Duração: 4-6s
  
- Música de fundo: (se tiver)
- Narrativa: Track contínuo com 3 segmentos

TESTAR:
□ App não trava ao adicionar página 10?
□ Timeline rola corretamente?
□ Navegar entre páginas rápido funciona?
□ Preview completo (40-60s) não trava?
□ Export completa em <5min?
□ Vídeo final <100MB?
□ VLC reproduz sem lag?

BUGS ESPERADOS:
- Performance ruim com 10 páginas?
- Memória estoura?
- Export trava em 50%?
- Vídeo final tem glitches?

2.3 Workflow Multi-Idioma: Export Ambos (15min)
Objetivo: Testar export PT-BR + EN simultaneamente
CRIAR PROJETO:
- Formato: Square (Instagram)
- 3 páginas
- TODOS os textos preenchidos:
  * 6 balões (3 PT + 3 EN)
  * Narrativa (PT + EN)
  * Narração (se tiver áudio PT e EN)

EXPORT:
□ Idioma: "Ambos"
□ Clicar Exportar
□ Aguardar 2 downloads:
  - projeto_pt-br.webm
  - projeto_en.webm

VALIDAR:
□ 2 arquivos baixados?
□ Tamanhos similares?
□ Abrir ambos no VLC lado a lado
□ PT tem texto/áudio em português?
□ EN tem texto/áudio em inglês?
□ Música de fundo idêntica?
□ Animações idênticas?

BUGS:
- Só 1 arquivo baixa?
- Textos misturados (PT com balões EN)?
- Áudio errado?

2.4 Workflow Edge Case: Sem Imagens (10min)
Objetivo: Ver o que acontece se não adicionar imagens
CRIAR PROJETO:
- Formato: Vertical
- 2 páginas
- NÃO adicionar imagens em nenhum painel
- Apenas:
  * Balões de texto
  * Narrativa
  * Música de fundo

PERGUNTAS:
□ Preview mostra o quê? Painéis vazios/pretos?
□ Export funciona?
□ Vídeo final tem frames pretos?
□ Texto aparece sobre fundo preto?

MELHORIAS SUGERIDAS:
- Avisar usuário: "Página 1 sem imagem"
- Permitir cor de fundo customizada?
- Gerar gradiente automático?

🏆 FASE 3: COMPARAÇÃO COM CONCORRENTES (30 min)
3.1 Canva (Referência de UX)
Abrir: https://www.canva.com/create/videos/
COMPARAR:
FeatureCanvaHQ MovieWinnerNotasCriar projeto2 clicks? clicks?Contar clicks do zero até editorUpload imagemDrag & drop diretoClick no painel??Qual mais rápido?Adicionar texto1 click2 clicks (tipo + canvas)?HQ tem mais tipos de balãoPreviewInstantâneo? segundos?Medir tempo de carregamentoExport30s média? segundos?Medir tempo projeto de 3 páginasTamanho fonte padrão48px56pxHQ Movie!HQ já está melhor
IDENTIFICAR MELHORIAS:
□ Canva tem drag & drop de imagens direto pra canvas
  → HQ poderia ter isso? (não precisa implementar, só anotar)

□ Canva mostra duração total do vídeo em tempo real
  → HQ mostra? Se não, seria útil?

□ Canva tem undo/redo (Ctrl+Z)
  → HQ tem? TESTAR: fazer mudança + Ctrl+Z

□ Canva salva automaticamente a cada 30s
  → HQ salva quando? Testar: fechar aba sem salvar, reabrir

□ Canva tem templates prontos
  → HQ tem? (não tem, mas não é o foco)

3.2 CapCut (Referência de Vídeo)
Abrir: https://www.capcut.com/
COMPARAR:
FeatureCapCutHQ MovieMelhor?Animações20+ tipos7 Ken BurnsCapCut ganhaTransições15+ tiposFade/CutCapCut ganhaÁudio duckingAutomáticoImplementado?Testar!Multi-idiomaNão temTEM!HQ GANHA!Narrative trackNão tem específicoTEM!HQ GANHA!
TESTAR ÁUDIO DUCKING NO HQ:
1. Adicionar música de fundo (volume 60%)
2. Adicionar narração em 1 página
3. Preview
4. VALIDAR: Música abaixa quando narração toca?
   □ SIM → Feature funciona! ✅
   □ NÃO → Bug crítico, música cobre narração ❌

3.3 Adobe Express (Referência Premium)
Abrir: https://www.adobe.com/express/
FOCAR EM: Qualidade de export
TESTAR NO HQ MOVIE:
1. Criar projeto simples (1 página, 1 imagem, 1 balão)
2. Exportar em 3 qualidades:
   - Baixa
   - Média
   - Alta
3. Comparar tamanhos de arquivo:
   - Baixa: ? MB
   - Média: ? MB
   - Alta: ? MB
4. Assistir no VLC:
   □ Baixa: Pixelizado? Balão legível?
   □ Média: Qualidade OK?
   □ Alta: Perfeito?

REFERÊNCIA ADOBE EXPRESS:
- 1min de vídeo 1080p = ~15-20MB (média)
- HQ Movie está nessa faixa?

📝 FASE 4: RELATÓRIO FINAL (15 min)
Estrutura do Relatório
markdown# RELATÓRIO DE TESTES - HQ MOVIE

**Data:** [hoje]
**Testador:** Cursor AI
**Duração:** 2h30min
**Navegador:** Chrome/Firefox [versão]

---

## 📊 RESUMO EXECUTIVO

- **Bugs Críticos:** X (impedem uso)
- **Bugs Médios:** Y (afetam UX)
- **Bugs Baixos:** Z (cosméticos)
- **Melhorias Sugeridas:** W
- **Comparação Concorrentes:** [HQ ganha em A, B | Perde em C, D]

---

## 🐛 BUGS ENCONTRADOS

### CRÍTICO #1: [Título]
**Severidade:** 🔴 Crítico
**Onde:** Editor > Balão
**Passos:**
1. ...
2. ...
**Esperado:** X
**Atual:** Y
**Screenshot:** bug-001.png
**Console Error:**
```
[cole erro se houver]
```

### MÉDIO #2: [Título]
...

---

## ✅ FUNCIONALIDADES VALIDADAS

- [x] Dashboard abre sem erro
- [x] Formato Vertical funciona
- [ ] Balões inserem corretamente ← BUG
- [x] Export PT-BR funciona
- [ ] Export EN funciona ← BUG
- [x] Texto narrativo 56px legível
...

---

## 🏆 COMPARAÇÃO CONCORRENTES

### Canva
- ✅ HQ GANHA: Multi-idioma, Narrative track
- ❌ HQ PERDE: Drag & drop, templates

### CapCut
- ✅ HQ GANHA: Foco em quadrinhos, narrative
- ❌ HQ PERDE: Quantidade de transições/efeitos

### Adobe Express
- ✅ HQ GANHA: Gratuito, sem watermark
- ❌ HQ PERDE: Qualidade de export (?)

---

## 💡 MELHORIAS SUGERIDAS

### Alta Prioridade
1. **Undo/Redo (Ctrl+Z)** - Canva tem, usuários esperam
2. **Autosave a cada 30s** - Evitar perda de trabalho
3. **Drag & drop de imagens** - Mais intuitivo que click

### Média Prioridade
4. **Duração total do vídeo visível** - Ex: "Total: 32s"
5. **Validação antes de export** - "Página 2 sem imagem"
6. **Preview mais rápido** - Carregar em <2s

### Baixa Prioridade
7. **Temas (claro/escuro)** - Conforto visual
8. **Atalhos de teclado** - Del para deletar, Esc para cancelar
9. **Grid/rulers no canvas** - Alinhar elementos

---

## 📸 SCREENSHOTS

Total: X arquivos
- bugs/: [lista]
- workflow/: [lista]
- comparacao/: [lista]

---

## 🎬 VÍDEOS GERADOS

- workflow-story.webm (9:16, 9s, 2.3MB) ✅
- workflow-stress.webm (16:9, 45s, 15MB) ✅
- workflow-multiidioma-pt.webm ❌ Não baixou
- workflow-multiidioma-en.webm ❌ Não baixou

---

## 🎯 RECOMENDAÇÕES

**Bloquear lançamento se:**
- [ ] Balões não inserem
- [ ] Export falha >50% das vezes
- [ ] Vídeos corrompidos

**Pode lançar mas melhorar depois:**
- Undo/redo
- Autosave
- Drag & drop

**Pronto para lançar se:**
- [x] Export PT-BR funciona 100%
- [x] Texto legível (56px)
- [x] ZERO crashes
- [x] Multi-idioma funciona

---

## 📅 PRÓXIMOS PASSOS

1. Corrigir bugs críticos (1-2h)
2. Re-testar workflows (30min)
3. Validar melhorias de UX (1h)
4. Lançamento beta

🚀 COMO EXECUTAR ESTES TESTES
Preparação (5min)
bashcd ~/CascadeProjects/HQ/hq-movie

# 1. Iniciar servidor
python3 -m http.server 8082

# 2. Criar pasta de resultados
mkdir -p tests/manual-qa/{bugs,workflow,comparison}

# 3. Abrir browser
firefox http://localhost:8082
# OU
google-chrome http://localhost:8082

# 4. DevTools aberto (F12)
```

---

### **Durante os Testes**
```
PARA CADA BUG:
1. Screenshot (Print Screen ou F12 > captura)
2. Copiar erro do console (se houver)
3. Anotar passos para reproduzir
4. Salvar em tests/manual-qa/bugs/

PARA CADA WORKFLOW:
1. Seguir passo a passo
2. Screenshot a cada etapa
3. Exportar vídeo
4. Validar no VLC
5. Salvar em tests/manual-qa/workflow/

PARA COMPARAÇÃO:
1. Abrir concorrente em aba separada
2. Fazer mesma tarefa
3. Comparar tempo/clicks
4. Screenshot lado a lado
5. Salvar em tests/manual-qa/comparison/