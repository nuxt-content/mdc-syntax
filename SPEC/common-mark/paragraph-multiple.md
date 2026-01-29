---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
This is a simple paragraph  
And continues in next line

This is another paragraph
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "p",
      {},
      "This is a simple paragraph",
      [
        "br",
        {}
      ],
      "And continues in next line"
    ],
    [
      "p",
      {},
      "This is another paragraph"
    ]
  ]
}
```

## HTML

```html
<p>This is a simple paragraph<br />And continues in next line</p>
<p>This is another paragraph</p>
```

## Markdown

```md
This is a simple paragraph  
And continues in next line

This is another paragraph
```
