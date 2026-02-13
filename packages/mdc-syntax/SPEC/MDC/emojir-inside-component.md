---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
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
      [
        "p",
        {},
        "✅ Successfully deployed! 🚀"
      ]
    ],
    [
      "alert",
      { "type": "warning" },
      [
        "p",
        {},
        "⚠️ Please backup your data before proceeding"
      ]
    ]
  ]
}
```

## HTML

```html
<alert type="success">
  <p>✅ Successfully deployed! 🚀</p>
</alert>
<alert type="warning">
  <p>⚠️ Please backup your data before proceeding</p>
</alert>
```

## Markdown

```md
::alert{type="success"}
✅ Successfully deployed! 🚀
::

::alert{type="warning"}
⚠️ Please backup your data before proceeding
::
```
