---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
Here [link](https://example.com){bool} [link](https://example.com){#id1} [link](https://example.com){.class1} [link](https://example.com){attr="value"}
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
        "a",
        {
          "href": "https://example.com",
          ":bool": "true"
        },
        "link"
      ],
      " ",
      [
        "a",
        {
          "href": "https://example.com",
          "id": "id1"
        },
        "link"
      ],
      " ",
      [
        "a",
        {
          "href": "https://example.com",
          "class": "class1"
        },
        "link"
      ],
      " ",
      [
        "a",
        {
          "href": "https://example.com",
          "attr": "value"
        },
        "link"
      ]
    ]
  ]
}
```

## HTML

```html
<p>Here <a href="https://example.com" bool>link</a> <a href="https://example.com" id="id1">link</a> <a href="https://example.com" class="class1">link</a> <a href="https://example.com" attr="value">link</a></p>
```

## Markdown

```md
Here [link](https://example.com){bool} [link](https://example.com){#id1} [link](https://example.com){.class1} [link](https://example.com){attr="value"}
```
