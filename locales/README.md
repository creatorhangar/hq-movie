# HQ Movie - Translation Files

This directory contains translation files for the HQ Movie application.

## Structure

```
/locales
├── en.json          ← English (default/primary)
├── pt-BR.json       ← Portuguese (Brazil)
└── README.md        ← This file
```

## File Format

Each translation file is a JSON object with nested keys:

```json
{
  "meta": {
    "language": "English",
    "code": "en",
    "version": "1.0.0"
  },
  
  "common": {
    "add": "Add",
    "delete": "Delete"
  },
  
  "dashboard": {
    "title": "HQ Movie",
    "newProject": "New Project"
  }
}
```

## Usage in Code

```javascript
// Simple translation
t('common.add')  // → "Add" (EN) or "Adicionar" (PT-BR)

// With interpolation
t('toast.projectCreated', { name: 'My Project' })
// → "Project "My Project" created!" (EN)
// → "Projeto "My Project" criado!" (PT-BR)
```

## Adding a New Language

1. Copy `en.json` to `[locale].json` (e.g., `es.json` for Spanish)
2. Translate all values (keep keys unchanged)
3. Update `meta.language` and `meta.code`
4. Test by switching language in the app

## Translation Guidelines

- **Keep keys unchanged** - only translate values
- **Preserve placeholders** - `{{variable}}` must remain exactly as is
- **Maintain tone** - Professional but friendly
- **Test in context** - Verify translations fit in the UI
- **Check plurals** - Some languages have different plural rules

## Key Categories

- `common.*` - Common actions (add, delete, save, etc.)
- `dashboard.*` - Dashboard screen
- `toolbar.*` - Top toolbar
- `sidebar.*` - Left/right panels
- `export.*` - Export page
- `toast.*` - Toast notifications
- `confirm.*` - Confirmation dialogs
- `seo.*` - SEO metadata (title, description)
- `tooltip.*` - Tooltips (title attributes)
- `placeholder.*` - Input placeholders

## Current Status

- ✅ English (en) - Complete (~500 keys)
- ✅ Portuguese (pt-BR) - Complete (~500 keys)
- ⏳ Spanish (es) - Not yet implemented
- ⏳ French (fr) - Not yet implemented

## Notes

- Default language: **English** (for SEO)
- Fallback: Always English if translation missing
- Brand name "HQ Movie" is **not translated**
- Emoji/icons are preserved across languages
