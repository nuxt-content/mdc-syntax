---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
Hello  
World
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "p",
      {},
      "Hello",
      [
        "br",
        {}
      ],
      "World"
    ]
  ]
}
```

## HTML

```html
<p>Hello<br />World</p>
```

## Markdown

```md
Hello  
World
```
