---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
options:
  autoUnwrap: true
---

## Input

```md
::alert{type="success"}
:white_check_mark: Successfully deployed! :rocket:
::

::alert{type="warning"}
:warning: Please backup your data before proceeding
::
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "alert",
      { "type": "success" },
      "✅ Successfully deployed! 🚀"
    ],
    [
      "alert",
      { "type": "warning" },
      "⚠️ Please backup your data before proceeding"
    ]
  ]
}
```

## HTML

```html
<alert type="success">
  ✅ Successfully deployed! 🚀
</alert>
<alert type="warning">
  ⚠️ Please backup your data before proceeding
</alert>
```

## Markdown

```md
:alert[✅ Successfully deployed! 🚀]{type="success"}

:alert[⚠️ Please backup your data before proceeding]{type="warning"}
```
