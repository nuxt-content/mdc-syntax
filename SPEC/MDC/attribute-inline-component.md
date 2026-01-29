---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
Here :in{bool} :in{#id1} :in{.class1} :in{attr="value"}
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
        "in",
        {
          ":bool": "true"
        }
      ],
      " ",
      [
        "in",
        {
          "id": "id1"
        }
      ],
      " ",
      [
        "in",
        {
          "class": "class1"
        }
      ],
      " ",
      [
        "in",
        {
          "attr": "value"
        }
      ]
    ]
  ]
}
```

## HTML

```html
<p>
  Here <in bool></in> <in id="id1"></in> <in class="class1"></in> <in attr="value"></in>
</p>
```

## Markdown

```md
Here :in{bool} :in{#id1} :in{.class1} :in{attr="value"}
```
