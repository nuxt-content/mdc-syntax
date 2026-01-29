---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
**[Nuxt](https://nuxt.com)**
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
        [
          "a",
          {
            "href": "https://nuxt.com"
          },
          "Nuxt"
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<p><strong><a href="https://nuxt.com">Nuxt</a></strong></p>
```

## Markdown

```md
**[Nuxt](https://nuxt.com)**
```
