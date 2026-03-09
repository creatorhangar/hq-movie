# Plano "Launch & Leave" (Lançar e Esquecer) para o HQ Movie

O conceito de **"Launch & Leave"** significa que o aplicativo deve ser tão robusto, autossuficiente e bem documentado que possa operar por meses ou anos sem manutenção ativa. Se um desenvolvedor precisar voltar ao projeto no futuro, o ambiente deve ser facilmente reproduzível e o código deve ser à prova de deterioração ("bit rot").

Este documento detalha o plano para atingir esse estado ideal para o HQ Movie.

---

## 1. Arquitetura "Zero Manutenção"

### 1.1 Eliminação de Dependências Externas Frágeis (Vendoring)
Atualmente, o HQ Movie depende de bibliotecas via CDN (`unpkg.com`, `cdnjs.cloudflare.com`) no `index.html`:
- Dexie.js
- jsPDF
- html2canvas
- JSZip

**Problema:** CDNs podem ficar offline, mudar URLs, ou versões antigas podem ser descontinuadas. Fontes do Google Fonts também podem sofrer alterações.
**Solução (Vendoring):**
- Baixar fisicamente todas as bibliotecas de terceiros (JS e CSS).
- Colocar em uma pasta `vendor/` ou `lib/` no repositório.
- Atualizar o `index.html` para apontar para os arquivos locais.
- Fazer o download das fontes essenciais (ou usar web safe fonts como fallback primário) para garantir que o layout não quebre se o Google Fonts cair ou o usuário estiver 100% offline.

### 1.2 Modo Offline Genuíno e PWA
- Garantir que o `sw.js` (Service Worker) faça cache de **todos** os assets estáticos, incluindo os novos arquivos no `vendor/` e fontes locais.
- Testar o aplicativo com o Wi-Fi desligado, do carregamento inicial até a exportação final do vídeo. O app deve funcionar como um software desktop instalado.

### 1.3 Isolamento do Ambiente de Exportação de Vídeo
A exportação de vídeo (provavelmente usando FFmpeg via WebAssembly ou APIs nativas) é a parte mais complexa e suscetível a quebras de browser (ex: atualizações de políticas de segurança do Chrome).
- **Garantia de Headers COOP/COEP:** Garantir que o ambiente de dev/produção sempre sirva os headers de isolamento `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp` para que o `SharedArrayBuffer` (necessário para o FFmpeg.wasm ter alta performance) nunca pare de funcionar silenciosamente.
- O script atual `serve-nocache.py` já deve fazer isso (ou precisa ser validado para garantir que faça).

---

## 2. Código e Estado à Prova de Falhas

### 2.1 Gestão de Estado (Dexie.js)
- O Dexie.js (IndexedDB) é o coração do estado.
- **Estratégia de Migração de Schema:** Se houver atualizações futuras, garantir que o schema do Dexie versionado (`db.version(1)...`) tenha tratamento para upgrades silenciosos, evitando que projetos antigos fiquem inacessíveis se o schema mudar num update.
- **Exportação/Importação de Projetos em JSON/ZIP:** Se o IndexedDB corromper, o usuário perde tudo. Criar (se não existir) ou consolidar uma função robusta de "Exportar Projeto (Arquivo `.hq` ou `.zip` com imagens e JSON)" e "Importar Projeto". Isso tira a responsabilidade exclusiva do IndexedDB e dá controle ao usuário.

### 2.2 Tratamento de Erros Silenciosos e Recuperação
- Se uma imagem for deletada acidentalmente do banco, o app não deve quebrar a renderização da timeline. Deve exibir um placeholder (ex: "Imagem não encontrada").
- Envolver blocos críticos (`requestAnimationFrame`, exportação de áudio/vídeo) em `try/catch` robustos que mostrem alertas amigáveis na UI, em vez de apenas logs no console, para que o usuário (e o futuro desenvolvedor) saiba exatamente o que falhou sem abrir o DevTools.

---

## 3. Reprodutibilidade Total do Ambiente (Para o Desenvolvedor)

Quando você voltar daqui a 2 anos, não deve precisar adivinhar qual versão do Node ou qual comando rodar.

### 3.1 Scripts e Ferramentas Standalone
- O projeto atualmente usa `serve-nocache.py`. Isso é excelente porque depende apenas do Python (geralmente pré-instalado).
- Documentar explicitamente no `README.md` o comando exato (`python3 serve-nocache.py`) e a versão mínima do Python.
- Evitar dependência de `npm install` complexos. O fato de ser majoritariamente HTML/JS/CSS puro ("Vanilla") já é um enorme passo para o "Launch & Leave". O repositório atual possui uma pasta `node_modules` e arquivos `package.json`. Se eles forem usados apenas para ferramentas de build (ex: Babel, testes como o Puppeteer/Playwright), isso deve ser isolado. O código de produção (frontend) não deve depender de um step de build frágil para rodar.

### 3.2 Testes Automatizados e QA "Evergreen"
Os testes de QA manual e de estresse (`tests/manual-qa`, `tests/stress-test-2026-03-05`) são valiosos.
- Criar um script unificado (ex: `npm run test:all` ou um script Python simples) que rode os testes críticos (como o Puppeteer).
- Deixar claro como rodar os testes sem configurar ambientes complexos. Se um teste quebrar por versão do Chrome no futuro, documentar como atualizar o Puppeteer.

---

## 4. Documentação "Cápsula do Tempo"

Escrever documentação assumindo que quem vai ler não sabe nada sobre o projeto (provavelmente você com amnésia do projeto).

- **`ARCHITECTURE.md`:** Um documento curto explicando onde as coisas moram. (Ex: "Estado -> `app.js`, UI -> `ui.js`, Exportação -> `video-exporter.js`").
- **`DATA_MODEL.md`:** Como um "Projeto" é estruturado em JSON e salvo no Dexie.
- **`HOW_TO_DEPLOY.md`:** Passos exatos para colocar no ar. (Ex: "Copie todos os arquivos estáticos para um bucket S3/Netlify, assegure os headers COOP/COEP, e pronto").
- Manter o `README.md` simples, apontando para esses documentos detalhados.

---

## 5. A "Skill" Final (Launch & Leave Checklist)

Para implementar e validar este plano, use a checklist abaixo (sua "Skill" de finalização):

### 🛠️ Tarefas de Implementação (A Fazer)
- [ ] **Auditoria de CDNs:** Baixar Dexie, jsPDF, html2canvas, JSZip localmente e atualizar `index.html`.
- [ ] **Auditoria do Service Worker:** Garantir que o `sw.js` faz cache dos novos arquivos locais (fontes e libs).
- [ ] **Validação de Headers COEP/COOP:** Checar se `serve-nocache.py` envia os headers corretos para a exportação de vídeo funcionar localmente sempre.
- [ ] **Sistema de Backup:** Validar/Implementar o "Exportar/Importar Projeto" para um arquivo físico (evitar perda de dados se IndexedDB falhar).
- [ ] **Limpeza de Build:** Se o código final for "Vanilla JS", documentar que não precisa de `npm build` para rodar, apenas servir a pasta raiz.
- [ ] **Redação dos Manuais:** Criar `ARCHITECTURE.md` e `HOW_TO_DEPLOY.md`.

### ✅ Teste Final de Validação ("Simulação de Abandono")
1. Desconecte o computador da internet (Desligar Wi-Fi).
2. Limpe o cache/IndexedDB do navegador.
3. Inicie o servidor local (`python3 serve-nocache.py`).
4. Abra o app, crie um projeto com imagens locais, adicione áudios, use o Splitter de Áudio, crie páginas.
5. Exporte o projeto em Vídeo.
6. Feche o navegador, abra novamente e verifique se o projeto persiste e carrega.
7. Se tudo funcionar sem internet, sem console errors e sem steps de build complexos: **O projeto está pronto para o Launch & Leave.**
