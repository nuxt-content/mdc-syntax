---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
:::component
First Paragraph

  ::child
  Second Paragraph
  ::
:::
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "component",
      {},
      [
        "p",
        {},
        "First Paragraph"
      ],
      [
        "child",
        {},
        [
          "p",
          {},
          "Second Paragraph"
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<component>
  <p>First Paragraph</p>
  <child>
    <p>Second Paragraph</p>
  </child>
</component>
```

## Markdown

```md
::component
First Paragraph

  :::child
  Second Paragraph
  :::
::
```
