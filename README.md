# HQ Movie

**Crie motion comics profissionais em minutos. Sem curva de aprendizado, sem assinaturas, sem BS.**

🎬 **[Demo Online](https://app.creatorhangar.com)** | 📖 **[Documentação](COMO-USAR.txt)** | 🚀 **[Launch & Leave Philosophy](LAUNCH-AND-LEAVE.md)**

---

## 🎯 O que é HQ Movie?

HQ Movie transforma imagens estáticas + áudio em motion comics e vídeos narrativos para redes sociais (TikTok, Reels, YouTube Shorts).

**Features principais:**
- ✅ 34 layouts prontos (vertical/horizontal/quadrado)
- ✅ Ken Burns effect (zoom/pan cinematográfico)
- ✅ Balões de fala estilo quadrinhos
- ✅ Narração sincronizada por página
- ✅ Dual-track bilíngue (PT-BR + EN)
- ✅ Exportação MP4/WebM
- ✅ **Funciona 100% offline**

---

## 🚀 Quick Start

### Desenvolvimento Local

```bash
python3 serve-nocache.py
```

Acesse: `http://localhost:8082`

### Produção (Cloudflare Pages / Netlify)

O projeto é **estático** (Vanilla JS). Basta fazer deploy da pasta raiz.

**Requisito crítico:** Configure os headers COOP/COEP (arquivo `_headers` já incluído).

---

## 📚 Documentação

- **[Como Usar](COMO-USAR.txt)** - Guia do usuário (PT-BR + EN)
- **[Arquitetura](ARCHITECTURE.md)** - Como o código funciona
- **[Modelo de Dados](DATA_MODEL.md)** - Estrutura de projetos
- **[Deploy](HOW_TO_DEPLOY.md)** - Instruções de deploy
- **[Launch & Leave](LAUNCH-AND-LEAVE.md)** - Filosofia do projeto

---

## 🛠️ Stack Técnica

- **Zero frameworks** - Vanilla JS puro
- **Zero build steps** - Edite e recarregue
- **Zero dependências externas** - Tudo em `vendor/`
- **Offline-first** - Service Worker + IndexedDB
- **Launch & Leave** - Funciona para sempre

---

## 📦 Estrutura do Projeto

```
hq-movie/
├── index.html          # Entry point
├── app.js              # Estado global (Store, Dexie)
├── controller.js       # Lógica de negócios (App)
├── ui.js               # Renderização (templates)
├── video-exporter.js   # Exportação de vídeo
├── layouts-video.js    # Layouts para vídeo
├── styles-v3.css       # Estilos
├── sw.js               # Service Worker
├── vendor/             # Bibliotecas vendored
│   ├── dexie.min.js
│   ├── html2canvas.min.js
│   ├── jspdf.umd.min.js
│   └── jszip.min.js
└── _headers            # Headers COOP/COEP
```

---

## 🧪 Testes

```bash
# Testes automatizados (Puppeteer)
cd tests/manual-qa
node test-persona.js

# Stress test
cd tests/stress-test-2026-03-05
cat README.md
```

---

## 📄 Licença

Proprietary - CreatorHangar © 2026

---

## 🤝 Suporte

- **Email:** support@creatorhangar.com
- **Docs:** [COMO-USAR.txt](COMO-USAR.txt)
- **Issues:** Use o sistema de suporte (em breve)

---

**Feito com ❤️ por [CreatorHangar](https://creatorhangar.com)**
