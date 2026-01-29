---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
[![An old rock in the desert](/assets/images/shiprock.jpg "Shiprock, New Mexico by Beau Rogers")](/link)
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
          "href": "/link"
        },
        [
          "img",
          {
            "src": "/assets/images/shiprock.jpg",
            "title": "Shiprock, New Mexico by Beau Rogers",
            "alt": "An old rock in the desert"
          }
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<p><a href="/link"><img src="/assets/images/shiprock.jpg" title="Shiprock, New Mexico by Beau Rogers" alt="An old rock in the desert" /></a></p>
```

## Markdown

```md
[![An old rock in the desert](/assets/images/shiprock.jpg "Shiprock, New Mexico by Beau Rogers")](/link)
```
