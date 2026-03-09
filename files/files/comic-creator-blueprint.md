# Comic Creator App - Blueprint Completo

## Visão Geral do Projeto

**App PWA offline-first** para criação rápida de histórias em quadrinhos, contos ilustrados e ebooks visuais com imagens geradas no Perchance (ou qualquer fonte), balões de texto customizáveis, layouts adaptativos e integração de áudio MP3 local para exportação.

### Objetivos Principais
- Velocidade: colar imagem → adicionar texto → próxima página em <10 segundos
- Simplicidade: máximo 3 cliques para tarefas comuns
- Poder: layouts automáticos inteligentes, múltiplos formatos de exportação
- Offline-first: todo o trabalho salvo localmente, sem dependência de servidor

---

## 1. ARQUITETURA FUNCIONAL

### 1.1 Fluxo de Trabalho do Usuário

#### A. Criação de Projeto
1. Novo Projeto: Nome, tipo (quadrinhos/conto/storyboard)
2. Configurações Globais:
   - Orientação predominante das imagens (portrait/landscape/quadrado)
   - Estilo padrão de texto (balões/caixas inferiores/sobreposição)
   - Paleta de cores para balões/caixas

#### B. Adição de Conteúdo (Página por Página)

**Inserir Imagem:**
- Colar URL do Perchance ou upload local (Ctrl+V)
- Arrastar imagens dentro do canvas para reposicionar
- Sistema detecta orientação e sugere layout otimizado

**Adicionar Texto:**
- **Modo Balão**: Clica na imagem → cria balão SVG personalizável (fala, pensamento, grito, narração)
- **Modo Caixa Fixa**: Retângulos fixos nos cantos (superior/inferior) com fundo translúcido
- **Modo Legenda Inferior**: Texto sempre embaixo de todas as imagens da página (sem balões)
- Sistema ajusta automaticamente tamanho da fonte e quebra de linha

**Layout Automático:**
- **Bento Grid**: Encaixa imagens em grid responsivo sem cortes
- **Masonry**: Empilha imagens respeitando proporções originais
- **Canvas Livre**: Usuário posiciona manualmente com snap-to-grid
- **Opção de Forçar Enquadramento**: Centraliza/escala imagem dentro de moldura predefinida

#### C. Integração de Áudio (Opcional)

1. **Upload de MP3 Local**: Arrasta arquivo para projeto
2. **Sincronização Simples**:
   - Por Página: Define tempo de exibição de cada página (3s, 5s, 10s)
   - Timeline Visual: Barra de tempo mostra onde cada página inicia/termina no áudio
   - Marcadores Manuais: Clica na timeline para marcar transições
3. **Preview**: Reproduz áudio + sequência de imagens sincronizada

### 1.2 Gerenciamento de Balões de Texto

| Tipo | Comportamento | Uso |
|------|--------------|-----|
| **Fala** | Balão oval com "rabinho" apontável | Diálogos padrão |
| **Pensamento** | Balão com nuvens | Pensamentos de personagens |
| **Grito/Ênfase** | Balão pontiagudo | Gritos, sons |
| **Narração** | Caixa retangular sem "rabinho" | Narrador |
| **Caixa Fixa** | Retângulo no canto (não se move) | Legendas |
| **Legenda Inferior** | Texto centralizado abaixo | Contos |

**Propriedades Customizáveis:**
- Cor de fundo, borda
- Fonte, tamanho, cor do texto
- Posição do "rabinho" (balões)
- Opacidade (caixas fixas)

### 1.3 Sistema de Layout Adaptativo

**Regras de Ajuste Automático:**
1. **1 Imagem/Página**: Fullscreen com texto inferior OU balões flutuantes
2. **2-3 Imagens/Página**: Grid 2x1 ou 3x1 (vertical)
3. **4+ Imagens/Página**: Bento Grid 2x2 ou Masonry
4. **Detecção de Texto**: Se página usa "legenda inferior", reserva 15-20% da altura

**Controles Manuais:**
- Toggle "Proteger Enquadramento" (evita cortes em rostos)
- Slider de espaçamento entre imagens
- Botão "Reorganizar" (testa layouts alternativos)

---

## 2. ESTRUTURA DE DADOS

### 2.1 Modelo de Dados do Projeto

```typescript
interface Project {
  metadata: {
    id: string;
    name: string;
    type: 'comic' | 'story' | 'storyboard';
    createdAt: number;
    updatedAt: number;
  };
  
  settings: {
    defaultOrientation: 'portrait' | 'landscape' | 'square';
    defaultBalloonStyle: 'speech' | 'thought' | 'fixedBox' | 'captionBelow';
    colorPalette: {
      balloonBg: string;
      balloonBorder: string;
      textColor: string;
    };
  };
  
  pages: Page[];
  audio?: AudioData;
}

interface Page {
  id: string;
  order: number;
  images: Image[];
  texts: TextElement[];
  layout: 'bentoGrid' | 'masonry' | 'freeCanvas';
  durationSeconds?: number; // para sincronização com áudio
}

interface Image {
  id: string;
  src: string; // URL ou blob URL
  position: { x: number; y: number; width: number; height: number };
  orientation: 'portrait' | 'landscape' | 'square';
  filters?: {
    brightness: number;
    contrast: number;
  };
  lockAspectRatio: boolean;
  protectFraming: boolean;
}

interface TextElement {
  id: string;
  type: 'speech' | 'thought' | 'shout' | 'narration' | 'fixedBox' | 'captionBelow';
  content: string;
  position: { x: number; y: number }; // não aplicável para captionBelow
  style: {
    font: string;
    fontSize: number;
    color: string;
    backgroundColor: string;
    borderColor: string;
    opacity: number;
  };
  tailDirection?: 'nw' | 'n' | 'ne' | 'w' | 'center' | 'e' | 'sw' | 's' | 'se';
}

interface AudioData {
  file: Blob;
  markers: AudioMarker[];
}

interface AudioMarker {
  pageId: string;
  timeSeconds: number;
}
```

---

## 3. ARQUITETURA UX/UI

### 3.1 Layout Desktop (3 Painéis)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TOOLBAR SUPERIOR                              │
│  Logo │ Nome Projeto │ [Undo/Redo] [Preview] [Export] [Settings]   │
├──────────┬──────────────────────────────────────────────┬───────────┤
│          │                                              │           │
│  PAINEL  │            CANVAS CENTRAL                    │  PAINEL   │
│ ESQUERDO │         (Página Ativa)                       │  DIREITO  │
│          │                                              │           │
│  240px   │              Expansível                      │   320px   │
│          │                                              │           │
├──────────┴──────────────────────────────────────────────┴───────────┤
│                    TIMELINE/ÁUDIO (Opcional)                         │
│                         60px altura                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Layout Mobile (Portrait)

```
┌──────────────────────┐
│   TOP BAR (56px)     │
│  ☰  Projeto  [...] │
├──────────────────────┤
│                      │
│      CANVAS          │
│    (Fullscreen)      │
│                      │
│      Touch Zone      │
│                      │
├──────────────────────┤
│  BOTTOM SHEET        │
│  [Arraste p/ cima]   │
│  • • •               │
└──────────────────────┘
```

### 3.3 Painel Esquerdo - Biblioteca & Navegação

**Desktop (240px, Colapsável):**
- Lista de páginas com miniaturas (drag & drop para reordenar)
- Botão "+ Nova Página"
- Ferramentas rápidas:
  - ○ Imagem (Ctrl+V)
  - ○ Texto (T)
  - ○ Balão (B)
  - ○ Layout (L)

**Mobile - Bottom Sheet (Swipe up):**
- Carrossel horizontal de páginas
- Botões: [+ Nova] [Duplicar] [Apagar]

### 3.4 Canvas Central - Zona de Criação

**Estados:**

1. **Vazio**: 
   - Ícone central "📷 Cole uma imagem"
   - Botões [Colar] [Upload]

2. **Com Imagem(ns)**:
   - Drag & drop para reposicionar
   - Clique para selecionar
   - Double-click para adicionar balão
   - Bounding boxes com handles de redimensionamento

3. **Editando Texto**:
   - Inline editing com cursor piscando
   - Toolbar flutuante: [B I U] [Align] [Size] [Color]
   - Auto-resize do balão conforme texto

**Feedback Visual:**
- Drag & drop: zona de soltar destacada, elemento com opacity 0.8
- Adicionar balão: mini menu contextual
- Seleção: borda azul (#0066FF) 2px

### 3.5 Painel Direito - Propriedades

**Contextual (muda conforme seleção):**

**Nada selecionado:**
- Configurações da página atual
- Layout dropdown
- Duração (se áudio)
- Configurações globais

**Imagem selecionada:**
- Preview pequeno
- Posição & Tamanho (X, Y, W, H)
- ☑ Proteger Enquadramento
- ☐ Travar Proporções
- Filtros (Brilho, Contraste)
- [🗑 Remover]

**Texto/Balão selecionado:**
- Tipo de balão (dropdown)
- Área de texto expandida
- Formatação: [B] [I] [U] [Align]
- Fonte, Tamanho (slider)
- Cores: Texto, Fundo, Borda
- Posição do rabinho (9 botões direcionais)
- [🗑 Remover]

### 3.6 Timeline de Áudio (Opcional, 60px altura)

```
┌─────────────────────────────────────────────────────────┐
│  [▶ Play] ──●────────────────────────────  [2:34/5:00] │
│             ↑                                            │
│          Marcador da página atual                       │
│                                                          │
│  [Pág 1]    [Pág 2]       [Pág 3]      [Pág 4]         │
│  0:00       0:05          0:12         0:18             │
└─────────────────────────────────────────────────────────┘
```

---

## 4. FLUXOS DE INTERAÇÃO DETALHADOS

### 4.1 Criação Rápida: Imagem + Legenda

**Desktop (3 ações):**
1. `Ctrl+V` → Cola imagem (fade-in no canvas)
2. `Enter` → Foco automático em legenda inferior
3. Digita texto → `Enter` salva

**Mobile (4 taps):**
1. Tap [+] → Abre seletor de imagem
2. Seleciona imagem → Aparece no canvas
3. Tap [Texto] → Bottom sheet abre
4. Digita → [✓ Salvar]

### 4.2 Quadrinhos: Múltiplas Imagens + Balões

**Desktop (sequência fluida):**
1. Arrasta 3 imagens do explorador → Canvas
2. Sistema auto-arranja em grid (2x1 vertical)
3. Clica na 1ª imagem → Mini menu ao lado
4. Clica "Balão" → Balão aparece com cursor
5. Digita → `Tab` → Foca próximo balão (auto-criado na 2ª imagem)

**Mobile:**
1. Tap [+] 3x → Adiciona 3 imagens
2. Layout ajusta automaticamente
3. Long press na imagem → Menu contextual
4. Tap [+ Balão] → Bottom sheet de edição

### 4.3 Conto com Texto Predominante

**Modo "Texto-First" (toggle no toolbar):**
- Texto ocupa 60% da página (topo)
- Imagens em grid 2x1 (abaixo, 40%)
- Entrada de texto prioritária (auto-focus)

---

## 5. MICRO-INTERAÇÕES & ANIMAÇÕES

### 5.1 Estados de Botões

```css
Normal:    background: #0066FF, border-radius: 8px
Hover:     background: #0052CC, box-shadow: 0 4px 6px rgba(0,0,0,0.1)
Pressed:   background: #003D99, transform: scale(0.98)
Loading:   spinner + opacity: 0.6
Success:   background: #00CC66, fade out após 2s
```

### 5.2 Transições

**Adicionar Elemento:**
- Fade in (200ms ease-out)
- Scale 0.9 → 1.0
- Bounce sutil no final

**Remover Elemento:**
- Fade out (150ms)
- Scale para 0.95
- Outros elementos reorganizam (300ms ease-in-out)

**Drag & Drop:**
- Opacity: 0.8 durante drag
- Shadow aumenta (0 → 12px blur)
- Feedback haptic no mobile

### 5.3 Feedback Visual Instantâneo

- Undo: Toast "Desfeito" (2s)
- Salvo: Ícone ✓ no toolbar (fade out 1s)
- Erro: Shake animation + borda vermelha

---

## 6. RESPONSIVIDADE

### 6.1 Breakpoints

| Dispositivo       | Largura    | Layout                          |
|-------------------|------------|---------------------------------|
| Mobile Portrait   | <480px     | 1 coluna, bottom sheets         |
| Mobile Landscape  | 481-768px  | 1 coluna compacta               |
| Tablet Portrait   | 769-1024px | 2 colunas (canvas + 1 painel)   |
| Desktop Small     | 1025-1440px| 3 colunas                       |
| Desktop Large     | >1440px    | 3 colunas + espaçamento extra   |

### 6.2 Gestos Mobile

| Gesto                 | Ação                          |
|-----------------------|-------------------------------|
| Tap                   | Seleciona elemento            |
| Double Tap            | Edita texto (se balão)        |
| Long Press            | Menu contextual               |
| Pinch Open/Close      | Zoom (50-200%)                |
| Drag (1 dedo)         | Move elemento                 |
| Swipe Left/Right      | Navega páginas                |
| Swipe Up (2 dedos)    | Desfaz última ação            |

---

## 7. EXPORTAÇÃO

### 7.1 Formatos Suportados

**1. PDF (ebooks/impressão):**
- Uma página por folha
- Resolução: 300 DPI (impressão) / 72 DPI (digital)
- Fontes embarcadas

**2. Imagens (PNG/JPG):**
- Cada página como imagem individual
- Opção de baixar como ZIP
- Resolução customizável

**3. Vídeo MP4 (com áudio):**
- Sequência de páginas com transições (fade/slide)
- Áudio MP3 sincronizado com timeline
- Configurações: FPS (24/30), resolução (720p/1080p), codec H.264
- Processamento no navegador (sem servidor)

**4. HTML Interativo (para web):**
- Navegação página-a-página (setas, swipe)
- Áudio contínuo enquanto usuário avança
- Totalmente offline após carregamento (PWA)

### 7.2 Processo de Exportação

1. Usuário clica [Export]
2. Modal abre com opções:
   - Formato (dropdown)
   - Configurações específicas (resolução, FPS, etc)
   - [Prévia] [Cancelar] [Exportar]
3. Progress bar durante processamento
4. Download automático ou link compartilhável

---

## 8. DESIGN SYSTEM

### 8.1 Paleta de Cores

```
Primary (Ação):     #0066FF  (Azul vibrante)
Secondary (Info):   #6B7280  (Cinza neutro)
Success:            #10B981  (Verde)
Warning:            #F59E0B  (Âmbar)
Error:              #EF4444  (Vermelho)
Background:         #FAFAFA  (Off-white)
Surface:            #FFFFFF  (Branco puro)
Border:             #E5E7EB  (Cinza claro)
Text Primary:       #1A1A1A  (Quase preto)
Text Secondary:     #6B7280  (Cinza)
```

### 8.2 Tipografia

```
Heading 1:  32px, Bold, Inter
Heading 2:  24px, Semibold, Inter
Body:       16px, Regular, Inter
Caption:    14px, Regular, Inter

Balão:      16-20px, Comic Sans MS / Bangers
Legenda:    14-16px, Georgia / Lora
```

### 8.3 Espaçamento (Sistema 8pt)

```
Micro:    4px   (gaps entre ícone e label)
Small:    8px   (padding de botões)
Medium:   16px  (espaçamento entre seções)
Large:    24px  (margins entre blocos)
XLarge:   32px  (separação de painéis)
XXLarge:  48px  (espaçamento de página)
```

### 8.4 Sombras

```
Level 1:  0 1px 3px rgba(0,0,0,0.1)   (Cards)
Level 2:  0 4px 6px rgba(0,0,0,0.1)   (Botões)
Level 3:  0 10px 15px rgba(0,0,0,0.1) (Modals)
Level 4:  0 20px 25px rgba(0,0,0,0.15)(Tooltips)
```

---

## 9. ACESSIBILIDADE (WCAG 2.2 AA)

### 9.1 Contraste de Cores

```
✓ Texto primário: #1A1A1A em #FFFFFF (19.8:1)
✓ Texto secundário: #666666 em #FFFFFF (5.7:1)
✓ Botões: #0066FF em #FFFFFF (4.5:1)
```

### 9.2 Navegação por Teclado

**Tab Order:**
1. Menu Principal
2. Toolbar (Undo → Redo → Preview → Export)
3. Painel Esquerdo (Páginas)
4. Canvas (Elementos)
5. Painel Direito (Propriedades)
6. Timeline

**Atalhos:**
- `Ctrl+V`: Colar imagem
- `T`: Adicionar texto
- `B`: Adicionar balão
- `L`: Trocar layout
- `Ctrl+Z`: Desfazer
- `Ctrl+Shift+Z`: Refazer
- `Espaço`: Play/Pause áudio
- `Setas`: Navegar páginas
- `Esc`: Fechar modal/deselecionar

### 9.3 ARIA & Screen Readers

```html
<button 
  aria-label="Adicionar nova página" 
  aria-describedby="tooltip-new-page">
  + Nova Página
</button>

<div role="img" aria-label="Página 1: 3 imagens">
  [Preview]
</div>
```

---

## 10. ARMAZENAMENTO & OFFLINE

### 10.1 Estratégia de Storage

**IndexedDB:**
- Projetos completos (metadata + páginas)
- Imagens em Blob format
- Áudio em Blob format

**LocalStorage:**
- Preferências do usuário (tema, layout padrão)
- Estado da sessão (última página aberta)

### 10.2 Service Worker (PWA)

**Cache Strategy:**
- App shell: Cache-first
- Imagens do projeto: Cache-first com expiration (30 dias)
- Assets estáticos: Precache na instalação

**Sync de Exportação:**
- Background sync para exportações grandes
- Notificação quando processamento completo

---

## 11. PERFORMANCE

### 11.1 Otimizações

**Renderização:**
- Virtual scrolling para lista de páginas (>50 páginas)
- Lazy loading de imagens (apenas página visível + 2 adjacentes)
- Canvas rendering otimizado (requestAnimationFrame)

**Memória:**
- Limpar blobs de imagens não utilizadas
- Compressão de imagens ao salvar (WebP)
- Limite de histórico de undo (50 ações)

**Exportação:**
- Processamento em Web Worker (não trava UI)
- Streaming de vídeo (chunks de 10 frames)
- Progress feedback em tempo real

---

## 12. SEGURANÇA & PRIVACIDADE

### 12.1 Princípios

- **Dados locais**: Tudo armazenado no dispositivo do usuário
- **Sem rastreamento**: Sem analytics invasivos
- **Sem conta obrigatória**: App funciona offline sem login
- **Exportação transparente**: Usuário controla onde salvar

### 12.2 Permissões

```
Clipboard (Ctrl+V): Solicitada na primeira colagem
File System: Solicitada no primeiro upload/exportação
Notifications: Opcional (para background sync)
```

---

## RESUMO DE PRIORIDADES

### MVP (Fase 1) - Core Funcional
✅ Criar projeto
✅ Adicionar/remover páginas
✅ Colar/upload imagens
✅ Adicionar texto (balões + legenda inferior)
✅ Layout automático (Bento Grid)
✅ Exportar PDF
✅ Storage local (IndexedDB)
✅ Responsive (mobile + desktop)

### Fase 2 - Refinamento
✅ Drag & drop de imagens externas
✅ Todos os tipos de balões (pensamento, grito, etc)
✅ Customização de cores/fontes
✅ Layouts alternativos (Masonry, Canvas Livre)
✅ Exportar imagens (PNG/JPG)
✅ Histórico de undo/redo

### Fase 3 - Recursos Avançados
✅ Integração de áudio + timeline
✅ Exportar vídeo MP4
✅ Exportar HTML interativo
✅ Dark mode
✅ Atalhos de teclado avançados
✅ Templates pré-criados

---

## NOTAS FINAIS

Este blueprint prioriza:
1. **Simplicidade de uso** - interface limpa, poucos cliques
2. **Flexibilidade** - suporta múltiplos estilos (quadrinhos, contos, storyboards)
3. **Performance** - offline-first, otimizado para mobile
4. **Poder** - exportação em múltiplos formatos, layouts inteligentes

O app deve parecer uma ferramenta profissional mas ser acessível para iniciantes. Foco em velocidade de criação sem sacrificar qualidade do output.
