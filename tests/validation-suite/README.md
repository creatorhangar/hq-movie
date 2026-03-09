# HQ Movie - Validation Suite 100%

## 📋 Visão Geral

**Objetivo:** Gerar 28 vídeos de teste validando TODAS as funcionalidades do HQ Movie.

```
4 FORMATOS × 7 CENÁRIOS = 28 VÍDEOS
```

### Formatos
| Formato | Dimensões | Uso |
|---------|-----------|-----|
| 📱 Vertical | 1080×1920 (9:16) | Stories, Reels, TikTok |
| 🖥️ Widescreen | 1920×1080 (16:9) | YouTube, TV |
| ⬜ Square | 1080×1080 (1:1) | Instagram Feed |
| 📺 Portrait | 1440×1080 (4:3) | Apresentações |

### Cenários
| # | Cenário | Páginas | Descrição |
|---|---------|---------|-----------|
| 1 | 📄 Simples | 1 | Sem áudio, sem animação |
| 2 | 📖 Narrativa | 3 | Narração, fade |
| 3 | 💥 Ação | 5 | Música, zoom/pan |
| 4 | 💬 Diálogo | 4 | Balões variados |
| 5 | ⚔️ Épico | 6 | Tudo ativado |
| 6 | 🎨 Minimal | 2 | Só imagens, cut |
| 7 | 🏆 Completo | 8 | Stress test |

---

## 🚀 Como Executar

### 1. Gerar Projetos de Teste

```bash
cd tests/validation-suite/scripts
node generate-scenarios.js
```

Isso criará 28 arquivos JSON em `projects/`:
- `simple-vertical.json`
- `simple-widescreen.json`
- `narrative-vertical.json`
- ... (28 total)

### 2. Executar Validação

Abra no navegador:
```
tests/validation-suite/scripts/validation-runner.html
```

Opções disponíveis:
- **▶ Executar Todos (28)** - Roda todos os testes
- **🎯 Testar Formato Atual (7)** - Testa apenas o formato selecionado
- **📄 Testar Selecionado** - Testa um cenário específico
- **📊 Exportar Relatório** - Gera JSON com resultados

---

## 📂 Estrutura de Arquivos

```
validation-suite/
├── README.md
├── projects/                    # 28 projetos JSON
│   ├── simple-vertical.json
│   ├── simple-widescreen.json
│   ├── simple-square.json
│   ├── simple-portrait.json
│   ├── narrative-vertical.json
│   ├── ... (28 total)
│   └── _manifest.json           # Índice de todos os projetos
├── assets/
│   ├── images/
│   │   ├── vertical/           # Imagens 1080×1920
│   │   ├── widescreen/         # Imagens 1920×1080
│   │   ├── square/             # Imagens 1080×1080
│   │   └── portrait/           # Imagens 1440×1080
│   └── audio/
│       ├── narrations/         # Arquivos de narração TTS
│       └── music/              # Músicas de fundo
├── output/
│   ├── vertical/               # Vídeos gerados
│   ├── widescreen/
│   ├── square/
│   └── portrait/
├── reports/                    # Relatórios de validação
└── scripts/
    ├── generate-scenarios.js   # Gerador de projetos
    └── validation-runner.html  # Interface de teste
```

---

## ✅ Critérios de Validação

### Por Vídeo
- [ ] Canvas dimensões corretas
- [ ] Balões renderizam corretamente
- [ ] Animação Ken Burns aplicada
- [ ] Export completa sem crash
- [ ] Vídeo reproduz no browser

### Critérios de Sucesso
- ✅ **28/28 vídeos** gerados sem crash
- ✅ **90%+** qualidade visual boa
- ✅ **90%+** áudio sincronizado
- ✅ **ZERO** bugs críticos
- ✅ **< 2min** tempo médio de export
- ✅ **< 1MB/s** tamanho médio

---

## 📊 Especificação dos Cenários

### Cenário 1: Simples
```yaml
Páginas: 1
Layout: Full (1 painel)
Texto: 1 balão de fala
Áudio: Nenhum
Animação: Estático
Transição: N/A
Duração: 4s
```

### Cenário 2: Narrativa
```yaml
Páginas: 3
Layouts: Full → Duo → Full
Texto: Narrativa + balões
Áudio: Narração por página
Animação: Zoom In → Pan → Zoom Out
Transição: Fade (0.5s)
```

### Cenário 3: Ação
```yaml
Páginas: 5
Layouts: Mix
Texto: 2 SFX por página
Áudio: Música de fundo (loop)
Animação: Variada
Transição: Slide
Duração: 5s/página (25s total)
```

### Cenário 4: Diálogo
```yaml
Páginas: 4
Layouts: Split Screen
Texto: 6-8 balões por página
  - Speech, Thought, Whisper, Shout
Áudio: Nenhum
Animação: Estático
Transição: Cut
Duração: 6s/página
```

### Cenário 5: Épico
```yaml
Páginas: 6
Layouts: Progressão (1→2→3→4→6→1)
Texto: Todos os tipos
Áudio: Música + Narração
Animação: Todas as 7 opções
Transição: Mix
Duração: ~34s
```

### Cenário 6: Minimal
```yaml
Páginas: 2
Layouts: Full
Texto: Nenhum
Áudio: Nenhum
Animação: Zoom In/Out lento
Transição: Cut
Duração: 16s (8s × 2)
```

### Cenário 7: Completo (Stress Test)
```yaml
Páginas: 8
Layouts: Todos diferentes
Texto: 40+ balões, todos os tipos
Áudio: Música + 8 narrações
Animação: Ciclo completo
Transição: Fade
Duração: ~50s
```

---

## 🐛 Bugs Conhecidos

| Bug | Sintoma | Solução |
|-----|---------|---------|
| Áudio Dessincroniza | Narração atrasada | Offset +100ms |
| Transição Glitch | Frame branco | Double-buffer |
| Balões Cortados | Texto overflow | Recalcular dims |
| Export Trava | Progress para 50% | Limpar buffers |
| Fontes Fallback | Comic Sans | Self-host fonts |

---

## 📈 Resultado Esperado

```json
{
  "totalTests": 28,
  "passed": 28,
  "failed": 0,
  "passRate": "100%"
}
```

---

*Última atualização: 2026-03-05*
