# TESTE MANUAL OBRIGATÓRIO - SEM SCRIPTS

## REGRAS
1. Abrir http://localhost:8082 no Chrome/Firefox
2. NÃO usar Playwright/Puppeteer
3. Usar mouse e teclado como usuário normal
4. Fazer screenshots manualmente (Print Screen)
5. Anotar bugs em texto simples

---

## FASE 1: USO NORMAL (30 MIN)

### Tarefa 1: Criar Projeto Completo
**Tempo máximo:** 15 minutos

1. Dashboard → Novo Projeto → Vertical
2. Adicionar 3 páginas com:
   - Imagens (usar fotos reais da pasta ~/Pictures)
   - Balões PT-BR e EN
   - Narrativa em ambos idiomas
   - Ken Burns em cada página (variar)
3. Adicionar música de fundo (qualquer MP3)
4. Adicionar narração em 1 página
5. Preview completo
6. Exportar PT-BR

**Anotar:**
- Quantos clicks até começar a criar? _____
- Algo que não entendi? _____
- Travou em algum momento? SIM/NÃO
- Preview funcionou? SIM/NÃO
- Export completou? SIM/NÃO
- Vídeo tem áudio? SIM/NÃO

**Screenshot:** Tirar print a cada etapa

---

### Tarefa 2: Tentar Quebrar o App
**Tempo máximo:** 15 minutos

Fazer DE PROPÓSITO:
1. Clicar "Fala" 10 vezes sem clicar no canvas
   - O que aconteceu? _____
   
2. Adicionar página → deletar → adicionar → deletar (5x)
   - Timeline quebrou? SIM/NÃO
   
3. Digitar 500 caracteres na narrativa
   - App avisou? SIM/NÃO
   - Texto ficou legível no export? SIM/NÃO
   
4. Upload de imagem 10MB
   - Quanto tempo demorou? _____
   - Travou? SIM/NÃO
   
5. Trocar de página 10 vezes rápido
   - Algo estranho? _____
   
6. Clicar Export sem adicionar nada (projeto vazio)
   - O que aconteceu? _____

**Screenshot:** Cada bug encontrado

---

## FASE 2: COMPARAÇÃO COM CANVA (20 MIN)

### Setup
1. Abrir Canva em nova aba: https://www.canva.com/create/videos/
2. Manter HQ Movie em outra aba

### Tarefa: Mesmo Projeto nos 2 Apps

**Criar vídeo vertical (9:16) com:**
- 2 páginas
- 2 imagens
- 2 textos
- Música de fundo

**Medir e comparar:**

| Métrica | Canva | HQ Movie | Vencedor |
|---------|-------|----------|----------|
| Tempo até começar criar | ___s | ___s | ____ |
| Clicks para adicionar imagem | ___ | ___ | ____ |
| Clicks para adicionar texto | ___ | ___ | ____ |
| Tempo total de criação | ___min | ___min | ____ |
| Facilidade de uso (1-10) | ___ | ___ | ____ |
| Qualidade do vídeo final | ___ | ___ | ____ |

**Perguntas:**
- O que o Canva faz melhor que HQ Movie? _____
- O que HQ Movie faz melhor que Canva? _____
- Qual usaria no dia a dia? _____

---

## FASE 3: ESTRESSE TOTAL (10 MIN)

**Objetivo:** Fazer o app CRASHAR ou travar

Tentar:
1. Criar projeto com 20 páginas (máximo)
2. Adicionar 50 balões (spam de clicks)
3. Upload de 10 imagens simultaneamente
4. Exportar projeto gigante (20 páginas)
5. Durante export, clicar em tudo (voltar, novo projeto, etc)

**Anotar:**
- Consegui crashar? SIM/NÃO
- Como? _____
- Console mostrou erro? (copiar)
- App recuperou ou precisa recarregar página? _____

---

## RELATÓRIO FINAL (5 MIN)

### Bugs Críticos Encontrados
1. _____
2. _____
3. _____

### Bugs Médios
1. _____
2. _____

### O Que Mais Irritou
_____

### O Que Mais Gostou
_____

### Pronto para Lançar?
SIM / NÃO / TALVEZ

**Se NÃO:** O que DEVE ser corrigido antes? _____

---

## ENTREGÁVEL

Criar arquivo: `tests/manual-qa/REAL-USER-TEST.md` 

Com:
- Respostas a todas perguntas acima
- 10+ screenshots salvos em `tests/manual-qa/screenshots/` 
- Vídeo exportado salvo em `tests/manual-qa/videos/` 
- Console errors (se houver) copiados

**NÃO ACEITAR "teste completo" sem este arquivo preenchido!**
