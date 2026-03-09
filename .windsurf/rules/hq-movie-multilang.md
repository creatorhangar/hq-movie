---
description: Adicionar ou modificar componentes bilíngues (PT-BR + EN) seguindo padrão do HQ Movie
triggers:
  - adicionar balão
  - criar narrativa
  - texto bilíngue
  - multi-idioma
  - balloon
  - multilang
---

# HQ Movie: Multi-Language Component

Use esta skill quando criar/editar balões, narrativa, ou qualquer texto visível ao usuário.

## Inputs Necessários

- **Tipo de componente:** balão, narrativa, título
- **Texto PT-BR:** Texto em português brasileiro
- **Texto EN:** Texto em inglês (será solicitado se vazio)

## Estrutura de Dados Padrão

```javascript
content: {
  'pt-BR': 'Texto em português',
  'en': 'Text in English'
}
```

## Steps de Implementação

1. **Verificar MultiLang helper** em `app.js`:
   - `MultiLang.get(content, lang)` - obtém texto do idioma
   - `MultiLang.set(content, lang, text)` - define texto
   - `MultiLang.validate(content)` - valida ambos idiomas preenchidos

2. **UI Requirements:**
   - Mostrar 2 textareas lado a lado (PT-BR + EN)
   - Labels com flags: 🇧🇷 Português | 🇺🇸 English
   - Sync opcional (copiar de um para outro como base)

3. **Handlers em controller.js:**
   - Salvar conteúdo bilíngue no objeto
   - Validar antes de salvar
   - Trigger re-render ao trocar idioma

4. **Teste de troca de idioma:**
   ```javascript
   Store.set('activeLanguage', 'en');
   // UI deve atualizar automaticamente
   ```

## Acceptance Criteria

- [ ] Texto salvo em ambos idiomas no objeto
- [ ] Troca de idioma funciona sem perda de dados
- [ ] UI clara com indicadores visuais (flags ou labels)
- [ ] Validação alerta se um idioma estiver vazio

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `ui.js` | Rendering do componente bilíngue |
| `controller.js` | Handlers de input de texto |
| `app.js` | MultiLang helper (se necessário) |

## Exemplo de Uso

```javascript
// Criar balão bilíngue
const balloon = {
  id: generateId(),
  type: 'speech',
  content: {
    'pt-BR': 'Olá, mundo!',
    'en': 'Hello, world!'
  },
  position: { x: 100, y: 100 },
  style: 'normal'
};

// Obter texto no idioma ativo
const text = MultiLang.get(balloon.content, Store.get('activeLanguage'));
```

## Validação

```javascript
// Validar conteúdo bilíngue
if (!MultiLang.validate(balloon.content)) {
  showWarning('Preencha texto em ambos idiomas');
}
```
