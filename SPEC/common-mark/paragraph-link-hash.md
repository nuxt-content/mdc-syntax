---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
[Nuxt](#nuxt)
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
          "href": "#nuxt"
        },
        "Nuxt"
      ]
    ]
  ]
}
```

## HTML

```html
<p><a href="#nuxt">Nuxt</a></p>
```

## Markdown

```md
[Nuxt](#nuxt)
```
