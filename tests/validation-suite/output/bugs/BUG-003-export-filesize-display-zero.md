### BUG #3: Export Mostra "0.0 MB" no Tamanho do Arquivo

**Severidade:** ○ Médio

**Onde:** Export > Progress bar após conclusão

**Passos para Reproduzir:**
1. Exportar qualquer vídeo WebM
2. Aguardar conclusão
3. Ver texto de status

**Esperado:**
"Pronto! 0.1 MB" (ou tamanho real)

**Atual:**
"Pronto! 0.0 MB" — arquivo real tem 15.6 KB

**Causa Provável:**
O cálculo `(blob.size / (1024 * 1024)).toFixed(1)` resulta em "0.0" para arquivos < 100KB.
Deveria usar KB para arquivos pequenos ou mostrar ao menos "< 0.1 MB".

**Screenshot:** 09-export-complete.png

**Prioridade:** Baixa — cosmético, não impede uso
