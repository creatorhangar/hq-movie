# HQ Movie Data Model

Este documento explica como um "Projeto" é estruturado em JSON e armazenado no IndexedDB (Dexie).

## Entidade Principal: `Project`
A estrutura raiz salva no banco de dados.

```typescript
type Project = {
    id: string;              // UUID gerado (ex: "17094012345")
    videoFormat: string;     // Formato ("vertical", "square", "horizontal")
    videoAudio: {            // Configuração global de áudio de fundo
        background: { file: string | null, volume: number, loop: boolean }
    };
    metadata: {
        name: string;        // Nome do projeto
        createdAt: number;   // Timestamp UNIX
        updatedAt: number;   // Timestamp UNIX
    };
    pages: Page[];           // O array principal que contém cada cena/página
};
```

## A Entidade `Page`
Cada item na timeline (quadro visível na parte inferior da tela) é uma "página". Apesar do nome herdado de quadrinhos impressos, no contexto do HQ Movie, pense em uma página como uma **cena de vídeo**.

```typescript
type Page = {
    layoutId: string;        // Referência a um layout do layouts-video.js
    duration: number;        // Duração da cena em segundos (ex: 4)
    transition: string;      // Transição de entrada ("fade", "cut")
    kenBurns: string;        // Movimento de câmera ("zoom-in", "pan-left")
    
    // Imagens carregadas para os slots (painéis) do layout
    images: Array<{
        src: string;         // Base64 ou URL da imagem local
        panX: number;        // Ajuste manual de posição X do usuário
        panY: number;        // Ajuste manual de posição Y do usuário
        zoom: number;        // Zoom manual do usuário no painel
    }>;
    
    // Configuração de balões de texto / diálogos
    balloons: Array<{
        id: string;
        text: string;
        x: number;           // Posição percentual X (0-100)
        y: number;           // Posição percentual Y (0-100)
        tailDir: string;     // Direção do "rabicho" do balão
    }>;
    
    // Configuração de texto de narração (Narrative box)
    narrativeText: string;
    showTextBelow: boolean;  // Se a narração deve aparecer abaixo da tela (estilo legenda)
    narrativeStyle: {
        font: string;
        size: number;
        color: string;
        bg: string;          // Cor de fundo
    };
    
    // Áudio específico desta cena (ex: narração gravada)
    audio: {
        file: string | null; // Audio Base64 gerado pelo ElevenLabs/Gravador
        volume: number;
    } | null;
};
```

## Ciclo de Vida do Dado

1. Quando o usuário clica em "Novo Projeto", um template vazio (`Project`) é gerado na RAM (no `Store._s.currentProject`).
2. Qualquer ação do usuário (como adicionar imagem, alterar duração, digitar texto) modifica o JSON em memória e aciona a função `Store.save()`.
3. A função `Store.save()` persiste o JSON modificado de volta para o IndexedDB usando o `.put()`.
4. Devido ao "Launch & Leave", implementamos a função de exportar esse JSON gigantesco para um arquivo ZIP (`.hq`). Se o IndexedDB morrer, o usuário basta subir o arquivo físico.
