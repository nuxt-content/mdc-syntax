---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
Here [link]{bool} [link]{#id1} [link]{.class1} [link]{attr="value"}
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
        "span",
        {
          ":bool": "true"
        },
        "link"
      ],
      " ",
      [
        "span",
        {
          "id": "id1"
        },
        "link"
      ],
      " ",
      [
        "span",
        {
          "class": "class1"
        },
        "link"
      ],
      " ",
      [
        "span",
        {
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
<p>Here <span bool>link</span> <span id="id1">link</span> <span class="class1">link</span> <span attr="value">link</span></p>
```

## Markdown

```md
Here [link]{bool} [link]{#id1} [link]{.class1} [link]{attr="value"}
```
