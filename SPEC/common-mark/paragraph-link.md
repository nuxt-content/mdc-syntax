---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
[Nuxt](https://nuxt.com)
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
        "a",
        {
          "href": "https://nuxt.com"
        },
        "Nuxt"
      ]
    ]
  ]
}
```

## HTML

```html
<p><a href="https://nuxt.com">Nuxt</a></p>
```

## Markdown

```md
[Nuxt](https://nuxt.com)
```
