---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
![The San Juan Mountains are beautiful](/assets/images/san-juan-mountains.jpg "San Juan Mountains")
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
        "img",
        {
          "src": "/assets/images/san-juan-mountains.jpg",
          "title": "San Juan Mountains",
          "alt": "The San Juan Mountains are beautiful"
        }
      ]
    ]
  ]
}
```

## HTML

```html
<p><img src="/assets/images/san-juan-mountains.jpg" title="San Juan Mountains" alt="The San Juan Mountains are beautiful" /></p>
```

## Markdown

```md
![The San Juan Mountains are beautiful](/assets/images/san-juan-mountains.jpg "San Juan Mountains")
```
