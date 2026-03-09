# Comic Creator App - Documentação Completa

## ✅ Estado Atual do App (Atualização recente)

O app está funcional como editor de quadrinhos offline-first, com foco em criação rápida, controle de layout e exportação.

### Últimas implementações concluídas

- **Edição de balões via tooltip flutuante no canvas** (substituindo fluxo de edição em modal fullscreen).
- **Controles imediatos no tooltip de balão**:
  - tipo
  - fonte
  - tamanho
  - cores de fundo/texto
  - opacidade
  - direção da cauda (quando aplicável)
  - ações rápidas (duplicar, travar/destravar, remover)
- **Edição de stickers via tooltip flutuante**:
  - opacidade
  - rotação
  - tamanho
  - duplicar/remover
- **Seleção visual de stickers no canvas** com destaque e handle de resize.
- **Painel direito com propriedades de sticker** quando um sticker está selecionado.
- **Padronização tipográfica da UI** (labels e seções mais consistentes, legibilidade melhor).
- **Melhorias de UX de interação**:
  - `Esc` fecha tooltips/deseleciona
  - `Delete/Backspace` remove elemento selecionado (incluindo sticker)

---

## 🚀 Como o app está hoje

### Módulos principais

1. **Projetos e Páginas**
   - criar, carregar, renomear e excluir projeto
   - adicionar, duplicar, mover e remover páginas
   - timeline e navegação rápida

2. **Layouts de quadrinhos**
   - múltiplos layouts por quantidade de quadros
   - aplicação de layout por página
   - visualização de ordem de leitura

3. **Imagens nos quadros**
   - upload local e inserção por URL
   - pan/zoom por quadro
   - brilho/contraste e flip
   - substituir/remover imagem

4. **Balões de texto**
   - tipos: fala, pensamento, grito, sussurro, narração, SFX
   - edição inline + controles avançados
   - presets de estilo (salvar/aplicar/remover)
   - z-order (frente/trás)
   - lock/unlock

5. **Stickers**
   - biblioteca de stickers
   - inserir, arrastar e redimensionar
   - rotação/opacidade/tamanho
   - remover e duplicar

6. **Narrativa e página**
   - texto narrativo abaixo da página
   - alinhamento/fonte/tamanho
   - cor de fundo da página
   - borda/gutter/cantos dos painéis
   - guias de bleed

7. **Exportação**
   - PDF
   - PNG/JPG
   - HTML
   - vídeo
   - opções de escala (incluindo presets de qualidade)

8. **Produtividade**
   - undo/redo
   - atalhos de teclado
   - clipboard (copy/paste de balões e imagem por paste)
   - contexto por menu de clique direito

---

## 📌 Stack e estrutura atual

- **Frontend:** HTML + CSS + JavaScript vanilla
- **Persistência local:** IndexedDB / localStorage
- **Export:** html2canvas + jsPDF
- **Arquivos centrais do app:**
  - `index.html`
  - `styles.css`
  - `controller.js`
  - `ui.js`
  - `app.js`
  - `sw.js` (PWA/offline)

---

## 🛠️ Rodando o projeto localmente

Na pasta do projeto, suba um servidor estático. Exemplo:

```bash
python3 -m http.server 8080
```

Depois abra:

```text
http://localhost:8080
```

---

## 🎯 Próximo bloco recomendado

Implementar o **Sistema de Efeitos Visuais** (screentones, ink bleed, paper texture, grain, CMYK) com:

- escopo por página/global
- presets
- preview em tempo real com debounce
- integração com undo/redo

---

## 📁 Arquivos Incluídos

### 1. **CRITICAL-ADDENDUM.md** ⚠️ PRIORIDADE MÁXIMA
Correções obrigatórias para problemas graves identificados:
- Canvas A4 fixo (794x1123px) 
- Sistema de layouts matemáticos pré-definidos
- Grid de 3 colunas
- Área útil com margens de segurança
- Layouts para 3, 4, 5 e 6 painéis (com código completo)

**🚨 LEIA ESTE ARQUIVO PRIMEIRO**

### 2. **cursor-prompt.md**
Prompt completo para o Cursor IDE com:
- Stack técnica recomendada
- Estrutura de pastas
- Instruções de desenvolvimento por fases
- Exemplos de código
- Checklist de validação
- Troubleshooting

### 3. **comic-creator-blueprint.md**
Blueprint funcional geral com:
- Arquitetura funcional completa
- Fluxos de trabalho
- Estrutura de dados
- Design system
- Especificações de UX/UI

### 4. **reference-layouts-varied.png**
Imagem de referência com 15 exemplos de layouts diferentes (3-6 painéis)

### 5. **reference-kirby-layouts.png**
Imagem "Kirby Layouts" mostrando ordem de leitura em Z (3-9 painéis)

---

## 🚀 Como Usar no Cursor IDE

### Opção 1: Prompt Completo (Recomendado)

1. Crie uma pasta vazia para o projeto
2. Coloque os 5 arquivos dentro da pasta
3. Abra a pasta no Cursor IDE
4. Abra o chat do Cursor (Ctrl+L ou Cmd+L)
5. Digite:

```
Leia os arquivos na seguinte ordem:
1. CRITICAL-ADDENDUM.md (prioridade máxima)
2. cursor-prompt.md
3. comic-creator-blueprint.md

Depois de ler, implemente o app começando pela Fase 1 do cursor-prompt.md, 
garantindo que o canvas A4 fixo e o sistema de layouts sejam implementados 
ANTES de qualquer outra funcionalidade.

Use as imagens de referência (reference-*.png) como guia visual para os layouts.
```

### Opção 2: Prompt Direto (Sem Arquivos)

Se preferir não usar arquivos, cole TODO o conteúdo de `cursor-prompt.md` diretamente no chat do Cursor.

---

## ⚠️ PONTOS CRÍTICOS

### 1. Canvas A4 Fixo
- **Dimensões:** 794px x 1123px (NUNCA mudar)
- **Não** usar canvas flutuante/responsivo
- **Sempre** visível e centralizado

### 2. Layouts Pré-Definidos
- **Usar APENAS** os layouts do `CRITICAL-ADDENDUM.md`
- **Não** calcular layouts genericamente "na hora"
- **Mínimo** 3 variações por quantidade de painéis

### 3. Grid de 3 Colunas
- Base para todos os painéis
- Largura da coluna: 226px
- Gutter: 12px
- Painéis ocupam 1, 2 ou 3 colunas

### 4. Ordem de Leitura
- Sempre em Z (esquerda → direita, cima → baixo)
- Números visíveis em cada painel
- Propriedade `order` define sequência

---

## 📋 Checklist de Validação

Antes de considerar implementado:

### Canvas
- [ ] Dimensões fixas 794x1123px
- [ ] Margens de segurança visíveis (linhas tracejadas)
- [ ] Centralizado na tela
- [ ] Zoom funciona (50%-200%)

### Layouts
- [ ] Layouts de 3 painéis funcionando (3 variações)
- [ ] Layouts de 4 painéis funcionando (3 variações)
- [ ] Layouts de 5 painéis funcionando (3 variações)
- [ ] Layouts de 6 painéis funcionando (3 variações)
- [ ] Seletor de layouts no painel direito
- [ ] Trocar layout mantém imagens

### Funcionalidade
- [ ] Adicionar imagens (colar ou upload)
- [ ] Números de ordem visíveis
- [ ] Exportar PDF (A4)
- [ ] Salvar projeto (IndexedDB)

---

## 🐛 Problemas Comuns

### "Canvas está responsivo/flutuante"
**Solução:** Use `style={{ width: '794px', height: '1123px' }}`, não classes do Tailwind.

### "Layouts estão todos iguais"
**Solução:** Implemente os layouts exatos do `CRITICAL-ADDENDUM.md`, não invente.

### "Painéis não respeitam grid"
**Solução:** Larguras devem ser múltiplos de (226 + 12): 226px, 464px ou 714px.

### "Imagens deformadas"
**Solução:** Use `object-fit: cover` em todas as imagens.

---

## 📊 Ordem de Implementação

### Fase 1: Canvas + Layouts (OBRIGATÓRIO)
1. Canvas A4 fixo
2. Sistema de layouts pré-definidos
3. Componente de painel individual
4. Seletor de layouts

**⏱️ Tempo estimado:** 4-6 horas

### Fase 2: Core Funcional
1. State management (Zustand)
2. Adicionar/remover imagens
3. Trocar layouts
4. Exportar PDF básico

**⏱️ Tempo estimado:** 6-8 horas

### Fase 3: Refinamento
1. Balões de texto
2. Customização de cores/fontes
3. Histórico de undo/redo
4. Gestos mobile

**⏱️ Tempo estimado:** 8-10 horas

---

## 💡 Dicas para o Cursor

1. **Desenvolvimento incremental:** Peça uma fase de cada vez
   ```
   "Implemente apenas a Fase 1 (Canvas A4 + Layouts) por completo"
   ```

2. **Validação constante:** Peça para testar após cada funcionalidade
   ```
   "Agora teste se o canvas está exatamente 794x1123px"
   ```

3. **Correções específicas:** Se algo não funcionar, seja específico
   ```
   "O layout de 5 painéis está genérico. Use o layout '5p-classic' do CRITICAL-ADDENDUM.md"
   ```

4. **Use os exemplos:** O CRITICAL-ADDENDUM tem código completo pronto para copiar

---

## 🎯 Objetivo Final

Um app PWA offline-first que permite:
- Criar páginas de quadrinhos com layouts profissionais
- Adicionar imagens rapidamente (colar ou arrastar)
- Trocar entre layouts pré-definidos
- Visualizar em canvas A4 real (o que você vê é o que será exportado)
- Exportar em PDF, imagens ou vídeo

**Foco:** Velocidade de criação sem sacrificar qualidade visual.

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o `CRITICAL-ADDENDUM.md` primeiro
2. Consulte a seção de Troubleshooting do `cursor-prompt.md`
3. Valide contra as imagens de referência

---

**Boa criação! 🎨✨**
