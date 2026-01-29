---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
Here `code`{bool} `code`{#id1} `code`{.class1} `code`{attr="value"}
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
        "code",
        {
          ":bool": "true"
        },
        "code"
      ],
      " ",
      [
        "code",
        {
          "id": "id1"
        },
        "code"
      ],
      " ",
      [
        "code",
        {
          "class": "class1"
        },
        "code"
      ],
      " ",
      [
        "code",
        {
          "attr": "value"
        },
        "code"
      ]
    ]
  ]
}
```

## HTML

```html
<p>Here <code bool>code</code> <code id="id1">code</code> <code class="class1">code</code> <code attr="value">code</code></p>
```

## Markdown

```md
Here `code`{bool} `code`{#id1} `code`{.class1} `code`{attr="value"}
```
