---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
**This is a simple paragraph**
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "p",
      {},
      [
        "strong",
        {},
        "This is a simple paragraph"
      ]
    ]
  ]
}
```

## HTML

```html
<p><strong>This is a simple paragraph</strong></p>
```

## Markdown

```md
**This is a simple paragraph**
```
