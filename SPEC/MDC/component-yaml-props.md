---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
::component
---
attr: value
object-attr:
  key1: value1
  key2: value2
array:
  - item 1
  - item 2
---
First Paragraph

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
      {
        "attr": "value",
        "object-attr": {
          "key1": "value1",
          "key2": "value2"
        },
        "array": [
          "item 1",
          "item 2"
        ]
      },
      [
        "p",
        {},
        "First Paragraph"
      ],
      [
        "p",
        {},
        "Second Paragraph"
      ]
    ]
  ]
}
```

## HTML

```html
<component attr="value" object-attr="{\"key1\":\"value1\",\"key2\":\"value2\"}" array="[\"item 1\",\"item 2\"]">
  <p>First Paragraph</p>
  <p>Second Paragraph</p>
</component>
```

## Markdown

```md
::component
---
attr: value
object-attr:
  key1: value1
  key2: value2
array:
  - item 1
  - item 2
---
First Paragraph

Second Paragraph
::
```
