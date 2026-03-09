# Guia do Sistema i18n - HQ Movie

## 📋 Visão Geral

O HQ Movie agora possui um sistema de internacionalização (i18n) robusto e expansível que separa:

1. **Idioma da Interface (UI)** - Textos dos botões, menus, mensagens (futuro)
2. **Idioma do Conteúdo** - Textos dos balões, narrativas, legendas do projeto

## 🌍 Idiomas Suportados

Atualmente configurados (prontos para expansão):
- 🇧🇷 **Português (pt-BR)** - Padrão
- 🇺🇸 **English (en)**
- 🇪🇸 **Español (es)** - Estrutura pronta
- 🇫🇷 **Français (fr)** - Estrutura pronta

## 🔧 Como Funciona

### Mudança de Idioma do Conteúdo

No editor, use os botões na toolbar:
- **🇧🇷 PT** - Ativa português para edição
- **🇺🇸 EN** - Ativa inglês para edição
- **Ctrl+T** - Alterna entre idiomas

Quando você muda o idioma:
1. A toolbar é re-renderizada mostrando o idioma ativo
2. O canvas atualiza mostrando textos no idioma selecionado
3. O painel direito atualiza os campos de edição
4. Uma mensagem toast confirma a mudança

### Sistema MultiLang (Conteúdo)

Todos os textos do projeto são armazenados como objetos multi-idioma:

```javascript
// Exemplo de texto de balão
balloon.text = {
  'pt-BR': 'Olá, mundo!',
  'en': 'Hello, world!',
  'es': 'Hola, mundo!',
  'fr': 'Bonjour, monde!'
}

// Obter texto no idioma ativo
const text = MultiLang.get(balloon.text, project.activeLanguage);
```

### Sistema I18n (Interface)

Para textos da interface (botões, menus, mensagens):

```javascript
// Obter tradução
const text = I18n.t('toolbar.export'); // "Exportar" ou "Export"

// Com variáveis
const msg = I18n.tf('message.hello', null, { name: 'João' });
```

## 🚀 Como Adicionar Novo Idioma

### 1. Registrar o Idioma

Edite `i18n.js`:

```javascript
I18n.addLanguage('de', 'Deutsch', '🇩🇪', 'DE');
```

### 2. Adicionar Traduções da Interface

Em `i18n.js`, adicione traduções no objeto `translations`:

```javascript
'toolbar.export': { 
  'pt-BR': 'Exportar', 
  'en': 'Export', 
  'es': 'Exportar', 
  'fr': 'Exporter',
  'de': 'Exportieren'  // Nova tradução
}
```

### 3. Atualizar UI para Mostrar Novo Idioma

Edite `ui.js` na função `renderEditor()` para adicionar botão:

```javascript
<button onclick="App.setActiveLanguage('de')" 
        title="Deutsch (Ctrl+T)" 
        class="lang-btn ${p.activeLanguage === 'de' ? 'active' : ''}" 
        style="...">🇩🇪 DE</button>
```

### 4. Atualizar MultiLang

Edite `app.js` para incluir novo idioma no objeto vazio:

```javascript
empty() {
  return { 'pt-BR': '', 'en': '', 'es': '', 'fr': '', 'de': '' };
}
```

## 📝 Boas Práticas

### Para Desenvolvedores

1. **Sempre use MultiLang** para textos de conteúdo (balões, narrativas)
2. **Use I18n.t()** para textos de interface (futuro)
3. **Teste em todos os idiomas** antes de commit
4. **Mantenha fallback** para pt-BR sempre

### Para Usuários

1. **Crie conteúdo em um idioma primeiro** (ex: PT)
2. **Use o seletor de idioma** para alternar e adicionar traduções
3. **Exporte vídeos separados** para cada idioma
4. **Valide traduções** antes de exportar

## 🔍 Arquivos Modificados

- **`i18n.js`** - Sistema de internacionalização (NOVO)
- **`controller.js`** - Função `setActiveLanguage()` corrigida
- **`index.html`** - Script i18n.js adicionado
- **`sw.js`** - Cache atualizado com i18n.js
- **`app.js`** - MultiLang já existente
- **`ui.js`** - Botões de idioma na toolbar

## 🐛 Troubleshooting

### Idioma não muda ao clicar
- ✅ **CORRIGIDO**: `setActiveLanguage()` agora re-renderiza toda a interface

### Texto não aparece em outro idioma
- Verifique se o texto foi traduzido para aquele idioma
- Use `MultiLang.validate(project)` para encontrar traduções faltando

### Botão não destaca idioma ativo
- ✅ **CORRIGIDO**: Toolbar é re-renderizada ao mudar idioma

## 🎯 Próximos Passos (Futuro)

1. Migrar textos da interface para usar I18n.t()
2. Adicionar validador de traduções na UI
3. Importar/exportar traduções em CSV
4. Auto-tradução com APIs (opcional)
5. Adicionar mais idiomas conforme demanda

---

**Versão**: 1.0  
**Data**: 2026-03-08  
**Status**: ✅ Sistema funcional e expansível
