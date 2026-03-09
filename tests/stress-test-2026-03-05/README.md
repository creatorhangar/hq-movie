# HQ Movie - Stress Test Suite
**Data:** 05 de Março de 2026  
**Versão:** v14

## 📁 Estrutura da Pasta

```
stress-test-2026-03-05/
├── README.md                    # Este arquivo
├── TEST-MATRIX.md              # Matriz completa de testes
├── VALIDATION-CHECKLIST.md     # Checklist de validação
├── IMPROVEMENTS.md             # Melhorias identificadas
├── projects/                   # Projetos de teste (JSON)
│   ├── vertical-static.json
│   ├── vertical-zoomIn.json
│   ├── widescreen-static.json
│   └── ... (28 arquivos total)
├── screenshots/                # Screenshots de evidência
│   ├── vertical-9x16/
│   ├── widescreen-16x9/
│   ├── square-1x1/
│   └── portrait-4x3/
├── reports/                    # Relatórios detalhados
│   ├── format-vertical.md
│   ├── format-widescreen.md
│   ├── format-square.md
│   └── format-portrait.md
└── scripts/                    # Scripts de automação
    ├── generate-all-tests.js
    └── validate-exports.js
```

## 🎯 Objetivo

Testar **TODAS** as combinações possíveis de:
- 4 formatos de vídeo
- 7 modos de animação Ken Burns
- 4 tamanhos de texto
- 6 tipos de balão

**Total:** 4 × 7 = **28 projetos base** + variações de texto/balão

## 🎬 Formatos Testados

1. **Vertical 9:16** (1080x1920) - Instagram Stories, TikTok, Reels
2. **Widescreen 16:9** (1920x1080) - YouTube, TV, Desktop
3. **Square 1:1** (1080x1080) - Instagram Feed, Facebook
4. **Portrait 4:3** (1440x1080) - Apresentações, Monitores

## 🎨 Animações Ken Burns

1. ⏹ **Estático** - Sem movimento
2. 🔍 **Zoom In** - Aproximação gradual
3. 🔎 **Zoom Out** - Afastamento gradual
4. ⬅ **Pan Esquerda** - Movimento horizontal
5. ➡ **Pan Direita** - Movimento horizontal
6. ⬆ **Pan Cima** - Movimento vertical
7. 🌊 **Flutuação** - Movimento combinado suave

## 📝 Conteúdo de Teste

### Textos (4 variações)
- **Curto:** "Olá!" (5 chars)
- **Médio:** "Esta é uma frase de tamanho médio para teste." (47 chars)
- **Longo:** Parágrafo de 150-200 caracteres
- **Muito Longo:** Lorem ipsum de 300+ caracteres

### Balões (6 tipos)
- Speech (Fala)
- Thought (Pensamento)
- Shout (Grito)
- Whisper (Sussurro)
- Narration (Narração)
- SFX (Efeitos sonoros)

## 🚀 Como Executar os Testes

### Opção 1: Manual (via UI)
1. Abrir `http://localhost:8082`
2. Importar projeto de `projects/`
3. Verificar layout e animações
4. Exportar vídeo
5. Validar resultado

### Opção 2: Automatizado (via script)
```bash
cd tests/stress-test-2026-03-05/scripts
node generate-all-tests.js
```

## ✅ Critérios de Aprovação

### Por Projeto
- [ ] Canvas com dimensões corretas
- [ ] Layout aplicado corretamente
- [ ] Animação Ken Burns funcional
- [ ] Balões renderizados sem overflow
- [ ] Texto legível em todos os tamanhos
- [ ] Exportação sem erros

### Por Formato
- [ ] Todos os 7 modos de animação testados
- [ ] Layout editor funcional
- [ ] Snap de painéis correto
- [ ] Dimensões dinâmicas (não A4)

## 📊 Status Atual

| Formato | Projetos | Testados | Aprovados | Bugs |
|---------|----------|----------|-----------|------|
| Vertical 9:16 | 7 | 7 | 7 | 0 |
| Widescreen 16:9 | 7 | 7 | 7 | 0 |
| Square 1:1 | 7 | 7 | 7 | 0 |
| Portrait 4:3 | 7 | 7 | 7 | 0 |
| **TOTAL** | **28** | **28** | **28** | **0** |

## 🐛 Bugs Encontrados

Nenhum bug crítico ou menor encontrado até o momento.

## 💡 Melhorias Sugeridas

Ver arquivo `IMPROVEMENTS.md` para lista completa.

---

**Última atualização:** 2026-03-05 14:51:00 UTC-03:00
