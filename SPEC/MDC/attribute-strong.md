---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
Here **strong**{bool} **strong**{#id1} **strong**{.class1} **strong**{attr="value"}
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
        "strong",
        {
          ":bool": "true"
        },
        "strong"
      ],
      " ",
      [
        "strong",
        {
          "id": "id1"
        },
        "strong"
      ],
      " ",
      [
        "strong",
        {
          "class": "class1"
        },
        "strong"
      ],
      " ",
      [
        "strong",
        {
          "attr": "value"
        },
        "strong"
      ]
    ]
  ]
}
```

## HTML

```html
<p>Here <strong bool>strong</strong> <strong id="id1">strong</strong> <strong class="class1">strong</strong> <strong attr="value">strong</strong></p>
```

## Markdown

```md
Here **strong**{bool} **strong**{#id1} **strong**{.class1} **strong**{attr="value"}
```
