---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
***Both***
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
        "em",
        {},
        [
          "strong",
          {},
          "Both"
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<p><em><strong>Both</strong></em></p>
```

## Markdown

```md
***Both***
```
