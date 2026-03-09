# CURSOR AI - PROMPT PARA DESENVOLVIMENTO DO COMIC CREATOR APP

## 🚨 LEIA PRIMEIRO: CORREÇÕES CRÍTICAS

**ATENÇÃO:** Antes de implementar QUALQUER funcionalidade, leia o arquivo `CRITICAL-ADDENDUM.md` que contém correções obrigatórias para problemas graves identificados:

1. **Canvas A4 Fixo** (794x1123px) - Não implementar canvas flutuante
2. **Layouts Matemáticos Pré-Definidos** - Não usar layouts genéricos
3. **Sistema de Grid de 3 Colunas** - Base para todos os painéis
4. **Ordem de Leitura em Z** - Numeração clara dos painéis

**PRIORIDADE MÁXIMA:** Implementar canvas A4 fixo + sistema de layouts primeiro, antes de qualquer outra funcionalidade.

---

## CONTEXTO DO PROJETO

Você é um desenvolvedor sênior especializado em PWAs e aplicações criativas. Sua tarefa é criar um **app completo e funcional** de criação de histórias em quadrinhos/contos visuais, seguindo rigorosamente as especificações dos arquivos:
- `comic-creator-blueprint.md` (blueprint funcional geral)
- `CRITICAL-ADDENDUM.md` (correções obrigatórias - PRIORIDADE)

---

## REFERÊNCIAS VISUAIS OBRIGATÓRIAS

### Imagens de Referência Fornecidas

**IMPORTANTE:** O usuário forneceu 2 imagens de referência que DEVEM ser seguidas:

1. **Referência 1** (`1772198942390_image.png`): 
   - 15 layouts diferentes de páginas de quadrinhos
   - Variação de 3-6 painéis por página
   - Painéis de tamanhos variados (não todos iguais)
   - Alguns layouts com painéis inclinados/diagonais
   - Hierarquia visual clara (painéis maiores para momentos chave)

2. **Referência 2** (`1772198980235_image.png`):
   - "Kirby Layouts" - sistema clássico de composição
   - Setas vermelhas mostram ordem de leitura em Z
   - Variação de 3 a 9 painéis
   - Grid de 3 colunas como base
   - Painéis ocupam 1, 2 ou 3 colunas de largura

**MANDATÓRIO:** Os layouts programados no `CRITICAL-ADDENDUM.md` seguem exatamente esses princípios. Não invente layouts diferentes.

---

## STACK TÉCNICA RECOMENDADA

### Frontend Framework
- **React 18+** com TypeScript
- **Vite** como bundler (rápido, otimizado para PWA)

### UI & Styling
- **Tailwind CSS** para design system responsivo
- **Framer Motion** para micro-interações e animações
- **Radix UI** ou **Headless UI** para componentes acessíveis (modals, dropdowns, tooltips)

### State Management
- **Zustand** para estado global (leve e simples)
- **React Context** para estado local de componentes

### Armazenamento Offline
- **IndexedDB** via **Dexie.js** (wrapper moderno e tipo-safe)
- **LocalStorage** para preferências do usuário

### Canvas & Manipulação de Imagens
- **Fabric.js** ou **Konva.js** para canvas interativo (drag & drop, resize, seleção)
- **html2canvas** ou **dom-to-image** para exportação de páginas como imagens

### Exportação
- **jsPDF** para exportação PDF
- **FFmpeg.wasm** para exportação de vídeos MP4 (processamento no navegador)
- **JSZip** para exportação de múltiplas imagens

### PWA & Service Worker
- **Workbox** para estratégia de cache
- **Web App Manifest** configurado

### Gestos Mobile
- **@use-gesture/react** para gestos touch (pinch, swipe, drag)

### Áudio
- **Web Audio API** nativa para reprodução e sincronização
- **WaveSurfer.js** (opcional) para visualização de waveform na timeline

---

## ESTRUTURA DE PASTAS RECOMENDADA

```
comic-creator-app/
├── public/
│   ├── manifest.json
│   ├── sw.js (service worker)
│   └── icons/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Toolbar.tsx
│   │   │   ├── LeftPanel.tsx
│   │   │   ├── Canvas.tsx
│   │   │   ├── RightPanel.tsx
│   │   │   └── Timeline.tsx
│   │   ├── canvas/
│   │   │   ├── CanvasImage.tsx
│   │   │   ├── TextBalloon.tsx
│   │   │   ├── Caption.tsx
│   │   │   └── BalloonEditor.tsx
│   │   ├── pages/
│   │   │   ├── PageThumbnail.tsx
│   │   │   ├── PageList.tsx
│   │   │   └── PageManager.tsx
│   │   ├── export/
│   │   │   ├── ExportModal.tsx
│   │   │   ├── PDFExporter.tsx
│   │   │   ├── VideoExporter.tsx
│   │   │   └── ImageExporter.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Dropdown.tsx
│   │       ├── ColorPicker.tsx
│   │       └── Toast.tsx
│   ├── hooks/
│   │   ├── useProject.ts
│   │   ├── useCanvas.ts
│   │   ├── useUndo.ts
│   │   ├── useGestures.ts
│   │   └── useExport.ts
│   ├── stores/
│   │   ├── projectStore.ts
│   │   ├── uiStore.ts
│   │   └── audioStore.ts
│   ├── lib/
│   │   ├── db.ts (Dexie schema)
│   │   ├── canvas-utils.ts
│   │   ├── export-utils.ts
│   │   ├── layout-engine.ts (Bento Grid, Masonry)
│   │   └── svg-balloons.ts (geração de SVG de balões)
│   ├── types/
│   │   ├── project.ts
│   │   ├── page.ts
│   │   ├── image.ts
│   │   └── text.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── design-tokens.css (cores, espaçamentos)
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## INSTRUÇÕES DE DESENVOLVIMENTO

### FASE 1: SETUP INICIAL + CANVAS A4 FIXO (Prioridade Alta)

**ORDEM DE IMPLEMENTAÇÃO CRÍTICA:**

1. **Inicializar Projeto:**
   ```bash
   npm create vite@latest comic-creator-app -- --template react-ts
   cd comic-creator-app
   npm install
   ```

2. **Instalar Dependências:**
   ```bash
   # UI & Styling
   npm install tailwindcss postcss autoprefixer
   npm install framer-motion
   npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs

   # State & Storage
   npm install zustand
   npm install dexie dexie-react-hooks

   # Canvas (ATENÇÃO: usar Konva, não Fabric)
   npm install konva react-konva

   # Export
   npm install jspdf html2canvas jszip

   # PWA
   npm install workbox-window
   npm install vite-plugin-pwa -D

   # Utils
   npm install @use-gesture/react
   npm install react-dropzone
   npm install uuid
   npm install clsx
   ```

3. **Configurar Tailwind:**
   - Executar `npx tailwindcss init -p`
   - Configurar `tailwind.config.js` com design tokens do blueprint
   - Importar no `src/styles/globals.css`

4. **🚨 IMPLEMENTAR CANVAS A4 FIXO (PRIMEIRA FUNCIONALIDADE):**
   
   **Criar arquivo `src/lib/canvas-config.ts`:**
   ```typescript
   // COPIAR EXATAMENTE DO CRITICAL-ADDENDUM.md
   export const CANVAS_CONFIG = {
     width: 794,
     height: 1123,
     margins: { top: 60, bottom: 60, left: 40, right: 40 },
     contentArea: { x: 40, y: 60, width: 714, height: 1003 },
     grid: { columns: 3, gutter: 12, columnWidth: 226 }
   };
   ```
   
   **Criar componente `src/components/canvas/A4Canvas.tsx`:**
   ```typescript
   // COPIAR IMPLEMENTAÇÃO DO CRITICAL-ADDENDUM.md
   // Canvas com dimensões FIXAS, não flutuante
   // Incluir guias de margem (linhas tracejadas azuis)
   ```
   
   **VALIDAR:**
   - Canvas tem EXATAMENTE 794x1123px
   - Margens visíveis em linhas tracejadas
   - Canvas centralizado na tela
   - Zoom funciona (50%-200%)

5. **🚨 IMPLEMENTAR SISTEMA DE LAYOUTS MATEMÁTICOS:**
   
   **Criar arquivo `src/lib/panel-layouts.ts`:**
   ```typescript
   // COPIAR TODO O CÓDIGO DO CRITICAL-ADDENDUM.md
   // Layouts para 3, 4, 5 e 6 painéis
   // Cada um com NO MÍNIMO 3 variações
   ```
   
   **VALIDAR:**
   - Layouts calculados corretamente
   - Painéis respeitam grid de 3 colunas
   - Cada layout tem ordem de leitura (propriedade 'order')

6. **Configurar PWA (Vite):**
   - Adicionar `vite-plugin-pwa` no `vite.config.ts`
   - Configurar manifest.json com ícones, cores, nome do app
   - Estratégia de cache: cache-first para app shell

7. **Setup do IndexedDB (Dexie):**
   ```typescript
   // src/lib/db.ts
   import Dexie, { Table } from 'dexie';
   import { Project, Page } from '../types';

   class ComicCreatorDB extends Dexie {
     projects!: Table<Project>;
     
     constructor() {
       super('ComicCreatorDB');
       this.version(1).stores({
         projects: '++id, name, createdAt, updatedAt'
       });
     }
   }

   export const db = new ComicCreatorDB();
   ```

### FASE 2: CORE FUNCIONAL (MVP) - COM LAYOUTS CORRETOS

**Prioridades:**

1. **State Management (Zustand):**
   - Store de projeto (`projectStore.ts`):
     - Estado atual do projeto (metadata, pages)
     - **IMPORTANTE:** Páginas agora têm `layout: Layout` e `panels: Panel[]`
     - Ações: createProject, addPage, deletePage, updatePage
     - **Nova ação:** `changePageLayout(pageId, newLayout)` para trocar layout
     - Persistência automática no IndexedDB a cada mudança
   
   - Store de UI (`uiStore.ts`):
     - Página ativa
     - **Painel selecionado** (não "elemento selecionado")
     - Painéis colapsados/expandidos
     - Zoom do canvas

2. **Layout Principal (App.tsx):**
   - Implementar estrutura de 3 painéis (desktop)
   - Canvas central FIXO em 794x1123px
   - Responsividade: breakpoints no Tailwind
   - Mobile: Bottom sheet com Framer Motion (drag gesture)

3. **Painel Esquerdo (LeftPanel.tsx):**
   - Lista de páginas com miniaturas (react-dnd para reordenação)
   - **Miniatura mostra layout da página** (versão pequena dos painéis)
   - Botão "+ Nova Página"
   - Ferramentas rápidas (ícones com tooltips)

4. **Canvas Central (Canvas.tsx):**
   - **OBRIGATÓRIO:** Usar componente `<A4Canvas>` criado na Fase 1
   - Renderizar painéis baseado no layout da página atual:
     ```typescript
     const currentLayout = getLayoutForPanelCount(page.images.length, page.layoutIndex);
     
     return (
       <A4Canvas>
         {currentLayout.panels.map(panel => (
           <Panel 
             key={panel.id}
             panel={panel}
             image={page.images[panel.order - 1]}
             selected={selectedPanel?.id === panel.id}
             onSelect={() => selectPanel(panel)}
           />
         ))}
       </A4Canvas>
     );
     ```
   - **NUNCA** usar posicionamento manual na primeira versão
   - **SEMPRE** usar layouts pré-definidos
   - Drag & drop de imagens externas (react-dropzone)
   - Colar imagem (Ctrl+V): listener de clipboard

5. **Componente de Painel (`components/canvas/Panel.tsx`):**
   - **COPIAR IMPLEMENTAÇÃO DO CRITICAL-ADDENDUM.md**
   - Mostra número de ordem (1, 2, 3...) no canto superior esquerdo
   - Border azul quando selecionado
   - Placeholder quando sem imagem
   - Image com `object-fit: cover` quando tem imagem

6. **Painel Direito (RightPanel.tsx):**
   - Contextual:
     - `<PageProperties />` se nada selecionado
       - **INCLUIR:** `<LayoutSelector />` para trocar layout
     - `<ImageProperties />` se painel com imagem selecionado
     - `<TextProperties />` se texto selecionado (Fase 3)
   - Inputs controlados (onChange atualiza store)

7. **🚨 SELETOR DE LAYOUTS (`components/layout/LayoutSelector.tsx`):**
   - **COPIAR IMPLEMENTAÇÃO DO CRITICAL-ADDENDUM.md**
   - Grid 2x2 de opções de layout
   - Miniatura de cada layout disponível
   - Botão "⟲ Próximo Layout" para ciclar rapidamente
   - Apenas layouts compatíveis com número de imagens atual

8. **Adicionar Imagens - Fluxo Correto:**
   ```typescript
   const handleAddImages = (newImages: string[]) => {
     const totalImages = currentPage.images.length + newImages.length;
     
     // Seleciona layout padrão para quantidade total
     const layout = getLayoutForPanelCount(totalImages, 0);
     
     if (!layout) {
       alert(`Máximo de 9 painéis por página. Você tem ${totalImages}.`);
       return;
     }
     
     updatePage({
       ...currentPage,
       images: [...currentPage.images, ...newImages],
       layout: layout.id,
       layoutIndex: 0
     });
   };
   ```

9. **Exportação PDF (básica):**
   - `<ExportModal />` com opções:
     - Formato: PDF
     - Resolução: dropdown (72dpi, 150dpi, 300dpi)
   - Usa jsPDF:
     - **Captura canvas A4 como está** (794x1123px)
     - Converte para imagem (html2canvas)
     - Adiciona ao PDF na proporção A4
     - Download automático

**VALIDAÇÃO DA FASE 2:**
- [ ] Canvas sempre 794x1123px
- [ ] Adicionar 3 imagens → Layout automático aplicado
- [ ] Trocar layout → Painéis reorganizam mantendo imagens
- [ ] Números de ordem visíveis em cada painel
- [ ] Margens de segurança visíveis
- [ ] Exportar PDF → gera arquivo A4 correto

### FASE 3: REFINAMENTO

1. **Histórico de Undo/Redo:**
   - Hook `useUndo`:
     - Stack de estados do projeto (limite 50)
     - Atalhos Ctrl+Z / Ctrl+Shift+Z
     - Botões no toolbar

2. **Todos os Tipos de Balões:**
   - `lib/svg-balloons.ts`:
     - Funções para gerar SVG de cada tipo:
       - `generateSpeechBalloon()`
       - `generateThoughtBalloon()`
       - `generateShoutBalloon()`
       - etc.
     - Parâmetros: posição, tamanho, tailDirection

3. **Customização de Cores/Fontes:**
   - Color picker (Radix UI ou react-color)
   - Font dropdown (Google Fonts API)
   - Aplicado em tempo real no canvas

4. **Layouts Alternativos:**
   - Implementar algoritmo Masonry
   - Canvas Livre: desabilita auto-layout, permite posicionamento manual
   - Toggle no painel direito ou toolbar

5. **Exportar Imagens (PNG/JPG):**
   - Usa html2canvas para cada página
   - Opção de baixar ZIP (JSZip) com todas as páginas

6. **Gestos Mobile:**
   - `@use-gesture/react`:
     - usePinch para zoom no canvas
     - useSwipe para navegar páginas
     - useLongPress para menu contextual

### FASE 4: RECURSOS AVANÇADOS

1. **Integração de Áudio:**
   - Upload de MP3 (input file)
   - Salvar como Blob no IndexedDB
   - Timeline component:
     - Waveform visual (opcional: WaveSurfer.js)
     - Marcadores arrastáveis (indicam início de cada página)
     - Play/Pause com Web Audio API
   - Sincronização:
     - Calcula duração de cada página baseado em marcadores
     - Preview: reproduz áudio e avança páginas automaticamente

2. **Exportar Vídeo MP4:**
   - FFmpeg.wasm:
     - Carrega biblioteca no navegador
     - Renderiza cada página como imagem (canvas → PNG)
     - Cria vídeo com duração baseada na timeline
     - Adiciona áudio MP3
     - Codifica como H.264
     - Download do arquivo .mp4
   - Progress bar em tempo real
   - Processamento em Web Worker (não trava UI)

3. **Exportar HTML Interativo:**
   - Gera arquivo HTML standalone:
     - Embarca CSS inline
     - JavaScript para navegação (setas, swipe)
     - Áudio em <audio> tag com controles
     - Funciona offline (tudo embarcado no HTML)
   - Download como .html

4. **Dark Mode:**
   - Toggle no settings
   - Usa Tailwind dark: classes
   - Salva preferência no LocalStorage
   - Transição suave (300ms)

5. **Templates Pré-criados:**
   - Array de templates no código:
     - Quadrinhos 4 painéis
     - Conto ilustrado 2 imagens
     - Storyboard horizontal
   - Modal ao criar novo projeto: "Começar do zero" ou "Usar template"

---

## TESTES & QUALIDADE

### Testes Unitários (Opcional mas Recomendado)
- Vitest para lógica de negócio:
  - `layout-engine.test.ts`
  - `svg-balloons.test.ts`
  - Stores do Zustand

### Testes E2E (Opcional)
- Playwright:
  - Criar projeto
  - Adicionar página
  - Colar imagem
  - Adicionar texto
  - Exportar PDF

### Checklist de Qualidade
- [ ] TypeScript sem erros (strict mode)
- [ ] Lighthouse score >90 (Performance, Accessibility, PWA)
- [ ] Funciona offline após primeiro carregamento
- [ ] Responsivo em mobile (testado em iOS/Android)
- [ ] Navegação por teclado (tab order correto)
- [ ] ARIA labels em elementos interativos
- [ ] Contraste de cores WCAG AA

---

## INSTRUÇÕES ESPECÍFICAS PARA O CURSOR AI

### Abordagem de Desenvolvimento

1. **Leia primeiro o `comic-creator-blueprint.md` COMPLETO**
   - Entenda cada seção antes de começar a programar
   - Priorize as funcionalidades listadas no MVP

2. **Desenvolvimento Incremental:**
   - Comece pelo setup (Fase 1)
   - Teste cada funcionalidade antes de avançar
   - Não implemente tudo de uma vez

3. **Código Limpo:**
   - TypeScript strict mode
   - Componentes pequenos e reutilizáveis
   - Extrair lógica complexa para hooks/utils
   - Comentários apenas onde necessário

4. **Commits Semânticos:**
   - `feat: adiciona painel esquerdo com lista de páginas`
   - `fix: corrige bug de drag & drop no mobile`
   - `refactor: extrai lógica de layout para lib/layout-engine`

5. **Performance:**
   - Lazy load de componentes pesados (React.lazy)
   - Memoização (useMemo, useCallback) onde apropriado
   - Virtualização para lista de páginas (>50 páginas)

6. **Tratamento de Erros:**
   - Try/catch em operações async (IndexedDB, exports)
   - Toast notifications para feedback de erro
   - Fallbacks para funcionalidades não suportadas

### Perguntas a Fazer Durante o Desenvolvimento

- Este componente precisa mesmo de estado local ou deveria estar no store global?
- Esta animação melhora a UX ou é apenas decorativa?
- Este código está legível para outro desenvolvedor?
- Esta funcionalidade funciona bem no mobile?
- Este export é performático para projetos grandes (100+ páginas)?

---

## EXEMPLO DE CÓDIGO INICIAL

### src/types/project.ts
```typescript
export type Orientation = 'portrait' | 'landscape' | 'square';
export type BalloonType = 'speech' | 'thought' | 'shout' | 'narration' | 'fixedBox' | 'captionBelow';
export type LayoutType = 'bentoGrid' | 'masonry' | 'freeCanvas';

export interface Project {
  id: string;
  metadata: {
    name: string;
    type: 'comic' | 'story' | 'storyboard';
    createdAt: number;
    updatedAt: number;
  };
  settings: {
    defaultOrientation: Orientation;
    defaultBalloonStyle: BalloonType;
    colorPalette: {
      balloonBg: string;
      balloonBorder: string;
      textColor: string;
    };
  };
  pages: Page[];
  audio?: AudioData;
}

export interface Page {
  id: string;
  order: number;
  images: ImageElement[];
  texts: TextElement[];
  layout: LayoutType;
  durationSeconds?: number;
}

export interface ImageElement {
  id: string;
  src: string;
  position: { x: number; y: number; width: number; height: number };
  orientation: Orientation;
  filters?: {
    brightness: number;
    contrast: number;
  };
  lockAspectRatio: boolean;
  protectFraming: boolean;
}

export interface TextElement {
  id: string;
  type: BalloonType;
  content: string;
  position: { x: number; y: number };
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

export interface AudioData {
  file: Blob;
  markers: AudioMarker[];
}

export interface AudioMarker {
  pageId: string;
  timeSeconds: number;
}
```

### src/stores/projectStore.ts
```typescript
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db';
import { Project, Page, ImageElement, TextElement } from '../types/project';

interface ProjectState {
  currentProject: Project | null;
  
  // Actions
  createProject: (name: string, type: Project['metadata']['type']) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  
  addPage: () => void;
  deletePage: (pageId: string) => void;
  reorderPages: (startIndex: number, endIndex: number) => void;
  
  addImage: (pageId: string, src: string, orientation: ImageElement['orientation']) => void;
  updateImage: (pageId: string, imageId: string, updates: Partial<ImageElement>) => void;
  deleteImage: (pageId: string, imageId: string) => void;
  
  addText: (pageId: string, text: Partial<TextElement>) => void;
  updateText: (pageId: string, textId: string, updates: Partial<TextElement>) => void;
  deleteText: (pageId: string, textId: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  
  createProject: async (name, type) => {
    const project: Project = {
      id: uuidv4(),
      metadata: {
        name,
        type,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      settings: {
        defaultOrientation: 'portrait',
        defaultBalloonStyle: 'speech',
        colorPalette: {
          balloonBg: '#FFFFFF',
          balloonBorder: '#000000',
          textColor: '#000000'
        }
      },
      pages: [
        {
          id: uuidv4(),
          order: 0,
          images: [],
          texts: [],
          layout: 'bentoGrid'
        }
      ]
    };
    
    await db.projects.add(project);
    set({ currentProject: project });
  },
  
  loadProject: async (id) => {
    const project = await db.projects.get(id);
    set({ currentProject: project || null });
  },
  
  saveProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    
    currentProject.metadata.updatedAt = Date.now();
    await db.projects.put(currentProject);
  },
  
  addPage: () => {
    set((state) => {
      if (!state.currentProject) return state;
      
      const newPage: Page = {
        id: uuidv4(),
        order: state.currentProject.pages.length,
        images: [],
        texts: [],
        layout: 'bentoGrid'
      };
      
      return {
        currentProject: {
          ...state.currentProject,
          pages: [...state.currentProject.pages, newPage]
        }
      };
    });
    get().saveProject();
  },
  
  deletePage: (pageId) => {
    set((state) => {
      if (!state.currentProject) return state;
      
      return {
        currentProject: {
          ...state.currentProject,
          pages: state.currentProject.pages
            .filter(p => p.id !== pageId)
            .map((p, index) => ({ ...p, order: index }))
        }
      };
    });
    get().saveProject();
  },
  
  // ... outras actions (seguir o mesmo padrão)
}));
```

### src/App.tsx (estrutura básica)
```typescript
import React, { useEffect } from 'react';
import { useProjectStore } from './stores/projectStore';
import Toolbar from './components/layout/Toolbar';
import LeftPanel from './components/layout/LeftPanel';
import Canvas from './components/layout/Canvas';
import RightPanel from './components/layout/RightPanel';

function App() {
  const { currentProject, createProject } = useProjectStore();
  
  useEffect(() => {
    // Carregar último projeto ou criar novo
    if (!currentProject) {
      createProject('Novo Projeto', 'comic');
    }
  }, []);
  
  if (!currentProject) {
    return <div>Carregando...</div>;
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: 3 painéis */}
        <div className="hidden lg:flex w-full">
          <LeftPanel />
          <Canvas />
          <RightPanel />
        </div>
        
        {/* Mobile: Canvas + Bottom Sheet */}
        <div className="lg:hidden w-full relative">
          <Canvas />
          {/* BottomSheet component aqui */}
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## RECURSOS ADICIONAIS

### Documentação
- React: https://react.dev
- Tailwind: https://tailwindcss.com
- Konva: https://konvajs.org/docs/react/
- Dexie: https://dexie.org
- FFmpeg.wasm: https://ffmpegwasm.netlify.app

### Design Inspiration
- Canva: https://canva.com (UI de editor)
- Figma: https://figma.com (painéis laterais)
- Notion: https://notion.so (tooltips, micro-interações)

---

## CHECKLIST FINAL

Antes de considerar o app "pronto":

### Core Funcional (MVP)
- [ ] **Canvas A4 fixo implementado** (794x1123px) ⚠️ CRÍTICO
- [ ] **Sistema de layouts pré-definidos funcionando** (3-6 painéis) ⚠️ CRÍTICO
- [ ] Margens de segurança visíveis (linhas tracejadas)
- [ ] Números de ordem de leitura em cada painel
- [ ] Seletor de layouts no painel direito
- [ ] Criar, editar, exportar PDF funciona
- [ ] Funciona offline (PWA instalável)
- [ ] Responsivo (testado em mobile)
- [ ] Sem erros no console
- [ ] Performance aceitável (Lighthouse >80)

### Validação de Layouts
- [ ] Adicionar 3 imagens → Aplica um dos 3 layouts de 3 painéis
- [ ] Adicionar 4 imagens → Aplica um dos 3 layouts de 4 painéis
- [ ] Adicionar 5 imagens → Aplica um dos 3 layouts de 5 painéis
- [ ] Adicionar 6 imagens → Aplica um dos 3 layouts de 6 painéis
- [ ] Trocar layout → Painéis reorganizam sem perder imagens
- [ ] Layout mantém ordem de leitura em Z (1→2→3→...)
- [ ] Painéis respeitam grid de 3 colunas

### Exportação
- [ ] PDF gerado tem dimensões A4
- [ ] Páginas renderizadas corretamente no PDF
- [ ] Resolução selecionável (72/150/300 DPI)

### Documentação
- [ ] README.md com instruções de setup
- [ ] Screenshots do app funcionando
- [ ] Deploy em Vercel/Netlify (opcional)

### Testes de Usabilidade
- [ ] Usuário consegue criar página com 5 imagens em <30 segundos
- [ ] Trocar layout é intuitivo (máx 2 cliques)
- [ ] Canvas sempre visível (não precisa scroll horizontal)
- [ ] Zoom funciona sem bugs (50%-200%)

---

## TROUBLESHOOTING - PROBLEMAS COMUNS

### Problema: Canvas está flutuante/responsivo
**Solução:** Canvas DEVE ter width/height fixos em pixels, não porcentagem ou flex.
```tsx
// ❌ ERRADO
<div className="w-full h-full">

// ✅ CORRETO
<div style={{ width: '794px', height: '1123px' }}>
```

### Problema: Layouts estão todos iguais/genéricos
**Solução:** Usar APENAS os layouts definidos em `panel-layouts.ts`. Não calcular layouts na hora.
```typescript
// ❌ ERRADO
const layout = calculateGenericGrid(imageCount);

// ✅ CORRETO
const layout = getLayoutForPanelCount(imageCount, selectedIndex);
```

### Problema: Painéis não respeitam grid de 3 colunas
**Solução:** Usar apenas larguras múltiplas de `(226 + 12)`:
- 1 coluna: 226px
- 2 colunas: 464px (226 + 12 + 226)
- 3 colunas: 714px (226 + 12 + 226 + 12 + 226)

### Problema: Imagens deformadas nos painéis
**Solução:** Usar `object-fit: cover` sempre:
```tsx
<img 
  src={image} 
  className="w-full h-full object-cover"
  alt="Painel"
/>
```

### Problema: Ordem de leitura errada
**Solução:** Renderizar painéis na ordem da propriedade `panel.order`, não `panel.id`:
```typescript
// ❌ ERRADO
panels.map(panel => ...)

// ✅ CORRETO
[...panels].sort((a, b) => a.order - b.order).map(panel => ...)
```

### Problema: Canvas não centralizado na tela
**Solução:** Wrapper com flex center:
```tsx
<div className="flex items-center justify-center min-h-screen bg-gray-100">
  <A4Canvas>{/* conteúdo */}</A4Canvas>
</div>
```

---

## COMECE AGORA

Execute os seguintes comandos:

```bash
# 1. Criar projeto
npm create vite@latest comic-creator-app -- --template react-ts

# 2. Entrar no diretório
cd comic-creator-app

# 3. Instalar dependências base
npm install tailwindcss postcss autoprefixer zustand dexie dexie-react-hooks konva react-konva framer-motion

# 4. Inicializar Tailwind
npx tailwindcss init -p

# 5. Abrir no Cursor
cursor .
```

Agora implemente seguindo as Fases 1-4 acima, sempre consultando o `comic-creator-blueprint.md` para detalhes de UX/UI.

**Boa sorte! 🚀**
