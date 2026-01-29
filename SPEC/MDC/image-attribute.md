---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
Here ![alt](https://example.com/image.jpg){bool} ![alt](https://example.com/image.jpg){#id1} ![alt](https://example.com/image.jpg){.class1} ![alt](https://example.com/image.jpg){attr="value"}
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "p",
      {},
      "Here ",
      [
        "img",
        {
          "src": "https://example.com/image.jpg",
          "alt": "alt",
          ":bool": "true"
        }
      ],
      " ",
      [
        "img",
        {
          "src": "https://example.com/image.jpg",
          "alt": "alt",
          "id": "id1"
        }
      ],
      " ",
      [
        "img",
        {
          "src": "https://example.com/image.jpg",
          "alt": "alt",
          "class": "class1"
        }
      ],
      " ",
      [
        "img",
        {
          "src": "https://example.com/image.jpg",
          "alt": "alt",
          "attr": "value"
        }
      ]
    ]
  ]
}
```

## HTML

```html
<p>Here <img src="https://example.com/image.jpg" alt="alt" bool /> <img src="https://example.com/image.jpg" alt="alt" id="id1" /> <img src="https://example.com/image.jpg" alt="alt" class="class1" /> <img src="https://example.com/image.jpg" alt="alt" attr="value" /></p>
```

## Markdown

```md
Here ![alt](https://example.com/image.jpg){bool} ![alt](https://example.com/image.jpg){#id1} ![alt](https://example.com/image.jpg){.class1} ![alt](https://example.com/image.jpg){attr="value"}
```
