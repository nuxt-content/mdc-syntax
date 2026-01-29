---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
Here *em*{bool} *em*{#id1} *em*{.class1} *em*{attr="value"}
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
        "em",
        {
          ":bool": "true"
        },
        "em"
      ],
      " ",
      [
        "em",
        {
          "id": "id1"
        },
        "em"
      ],
      " ",
      [
        "em",
        {
          "class": "class1"
        },
        "em"
      ],
      " ",
      [
        "em",
        {
          "attr": "value"
        },
        "em"
      ]
    ]
  ]
}
```

## HTML

```html
<p>Here <em bool>em</em> <em id="id1">em</em> <em class="class1">em</em> <em attr="value">em</em></p>
```

## Markdown

```md
Here *em*{bool} *em*{#id1} *em*{.class1} *em*{attr="value"}
```
