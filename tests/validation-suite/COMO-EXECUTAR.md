# 🚀 Como Executar a Validação Completa

## Passo 1: Gerar Projetos de Teste

Os 28 projetos já foram gerados. Verifique em:
```
tests/validation-suite/projects/
```

Se precisar regenerar:
```bash
cd tests/validation-suite/scripts
node generate-scenarios.js
```

---

## Passo 2: Iniciar o Servidor Local

O HQ Movie precisa rodar em um servidor HTTP. Use um dos métodos:

### Opção A: Python
```bash
cd /home/tiago/CascadeProjects/HQ/hq-movie
python3 -m http.server 8080
```

### Opção B: Node.js (npx)
```bash
cd /home/tiago/CascadeProjects/HQ/hq-movie
npx serve -p 8080
```

### Opção C: Live Server (VS Code)
- Instale a extensão "Live Server"
- Clique com botão direito em `index.html`
- Selecione "Open with Live Server"

---

## Passo 3: Abrir o Validation Runner

1. Acesse no navegador:
   ```
   http://localhost:8080/tests/validation-suite/scripts/validation-runner.html
   ```

2. Você verá a interface com:
   - **Status Panel** - Contadores de testes
   - **Format Tabs** - Alternar entre formatos
   - **Scenario Grid** - 7 cenários por formato
   - **Log Panel** - Histórico de execução

---

## Passo 4: Executar os Testes

### Testar Tudo (Recomendado)
1. Clique em **▶ Executar Todos (28)**
2. Aguarde a execução (2-5 minutos)
3. Observe o progresso na barra

### Testar por Formato
1. Selecione o formato na aba (Vertical, Widescreen, etc.)
2. Clique em **🎯 Testar Formato Atual (7)**

### Testar Cenário Específico
1. Clique em um card de cenário para selecioná-lo
2. Clique em **📄 Testar Selecionado**

---

## Passo 5: Analisar Resultados

### Durante a Execução
- Cards ficam **amarelos** durante execução
- Cards ficam **verdes** quando passam
- Cards ficam **vermelhos** quando falham
- O vídeo gerado aparece no card

### Após Conclusão
1. Clique em **📊 Exportar Relatório**
2. Revise o JSON com resultados
3. Clique em **⬇ Download JSON** para salvar

### Métricas a Verificar
- ✅ **28/28** testes passaram
- ✅ **Canvas correto** para cada formato
- ✅ **Balões renderizam** corretamente
- ✅ **Animações aplicadas** (Ken Burns)
- ✅ **Export completo** sem crash
- ✅ **Vídeo reproduz** no browser

---

## Passo 6: Documentar Bugs (se houver)

Se algum teste falhar:

1. Anote o cenário que falhou
2. Verifique a mensagem de erro no Log
3. Abra o console do browser (F12) para mais detalhes
4. Documente em `VALIDATION-CHECKLIST.md`

---

## 🎯 Critérios de Sucesso

| Critério | Meta |
|----------|------|
| Testes passando | 28/28 (100%) |
| Export sem crash | 100% |
| Tempo médio export | < 2min |
| Tamanho médio arquivo | < 1MB/s de vídeo |
| Bugs críticos | 0 |

---

## 📂 Estrutura de Saída Esperada

```
output/
├── vertical/
│   ├── SIMPLE-VERTICAL.webm (4s, ~2MB)
│   ├── NARRATIVE-VERTICAL.webm (15s, ~8MB)
│   ├── ACTION-VERTICAL.webm (25s, ~15MB)
│   ├── DIALOGUE-VERTICAL.webm (24s, ~12MB)
│   ├── EPIC-VERTICAL.webm (34s, ~20MB)
│   ├── MINIMAL-VERTICAL.webm (16s, ~8MB)
│   └── COMPLETE-VERTICAL.webm (46s, ~30MB)
├── widescreen/
│   └── ... (7 vídeos)
├── square/
│   └── ... (7 vídeos)
└── portrait/
    └── ... (7 vídeos)
```

---

## ❓ Troubleshooting

### Erro: "Project not found"
- Verifique se os projetos foram gerados
- Execute `node generate-scenarios.js`

### Erro: "Export crashed"
- Reduza a qualidade do vídeo
- Feche outras abas do browser
- Aumente memória disponível

### Vídeo não reproduz
- Verifique se o codec VP9 é suportado
- Tente em Chrome/Edge (melhor suporte WebM)

### Testes muito lentos
- Feche outros programas
- Use Chrome em modo "Performance"
- Teste em máquina mais potente

---

*Última atualização: 2026-03-05*
