# HQ Movie Architecture

O HQ Movie foi projetado para ser uma aplicação **Vanilla JS (sem frameworks)** focada na estabilidade e reprodutibilidade (Launch & Leave). Não há necessidade de build steps complexos como Webpack ou Vite.

## Camadas da Aplicação

### 1. Estado Global (\`app.js\`)
Todo o estado reativo da aplicação vive no objeto `Store`.
- **`Store`**: Um gerenciador de estado customizado que usa o padrão Pub/Sub. Quando o estado muda via `Store.set()`, ele notifica os listeners (principalmente `App.render()`).
- **Dexie.js (`db`)**: Banco de dados IndexedDB wrapper, usado para persistir os projetos localmente. O estado da aplicação atual (`Store.currentProject`) é salvo no Dexie a cada alteração.

### 2. Controlador Principal (\`controller.js\`)
O objeto `App` orquestra a lógica de negócios.
- **Event Handlers**: Funções chamadas diretamente pela UI (ex: `App.openProject()`, `App.addCover()`).
- **Operações Críticas**: Interações com o DOM físico, drag and drop e manipulação do Canvas.

### 3. Interface do Usuário (\`ui.js\`)
Toda a renderização de UI é feita por **Template Strings literais**.
- Em vez de React, o `app` possui funções como `renderDashboard()`, `renderEditor()`, `renderSidebar()`, que geram HTML em formato de string.
- O DOM principal (`#app`) é reescrito a cada mudança de estado. Isso simplifica a gestão do estado mas requer atenção com inputs nativos, cujos estados de *foco* ou *cursor* devem ser cuidadosamente restaurados.

### 4. Layouts Dinâmicos (\`layouts.js\` & \`layouts-video.js\`)
Definição estrutural dos quadros das HQs.
- **`layouts.js`**: Usado historicamente para os layouts A4/A5 estáticos originais.
- **`layouts-video.js`**: Introduzido para os formatos verticais focados em redes sociais (TikTok/Reels). Utiliza um sistema de coordenadas escaláveis e posições relativas.

### 5. Exportação de Vídeo (\`video-exporter.js\`)
O motor que converte as páginas DOM do HQ Movie em vídeos renderizados frame-a-frame usando MediaRecorder e HTML5 Canvas.
- Orquestra a captura da página (`html2canvas` ou APIs nativas de canvas).
- Faz o blending (mistura) dos áudios (narração, fundo) via Web Audio API.

## Padrões de Sobrevivência (Launch & Leave)
1. **Zero Node.js na Prod**: O app não requer `npm run build`. Modificou um arquivo? Apenas dê refresh na página. O Node só existe no projeto para eventuais scripts de dev/testes, o app principal roda direto pelo navegador.
2. **Vendoring**: Bibliotecas externas (como `JSZip` e `html2canvas`) estão embutidas fisicamente em `vendor/` para não dependermos de CDNs que podem falhar ou desaparecer no futuro.
3. **Modo Offline**: Todo o aplicativo e assets são cacheados pelo `sw.js` (Service Worker).
