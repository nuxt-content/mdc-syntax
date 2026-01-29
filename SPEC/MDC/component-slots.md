---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
::component
#first
First Paragraph

#second
Second Paragraph
::
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
        "template",
        {
          "name": "first"
        },
        [
          "p",
          {},
          "First Paragraph"
        ]
      ],
      [
        "template",
        {
          "name": "second"
        },
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
  <template name="first">
    <p>First Paragraph</p>
  </template>
  <template name="second">
    <p>Second Paragraph</p>
  </template>
</component>
```

## Markdown

```md
::component
#first
First Paragraph

#second
Second Paragraph
::
```
