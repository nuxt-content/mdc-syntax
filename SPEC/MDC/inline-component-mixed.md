---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
[:component[text]{.class}](/link)

**:component[text]{.class}**

*:component[text]{.class}*

[:component[text]{.class}]
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "p",
      {},
      [
        "a",
        {
          "href": "/link"
        },
        [
          "component",
          {
            "class": "class"
          },
          "text"
        ]
      ]
    ],
    [
      "p",
      {},
      [
        "strong",
        {},
        [
          "component",
          {
            "class": "class"
          },
          "text"
        ]
      ]
    ],
    [
      "p",
      {},
      [
        "em",
        {},
        [
          "component",
          {
            "class": "class"
          },
          "text"
        ]
      ]
    ],
    [
      "p",
      {},
      [
        "span",
        {},
        [
          "component",
          {
            "class": "class"
          },
          "text"
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<p><a href="/link">
  <component class="class">
    text
  </component>
</a></p>
<p><strong>
  <component class="class">
    text
  </component>
</strong></p>
<p><em>
  <component class="class">
    text
  </component>
</em></p>
<p><span>
  <component class="class">
    text
  </component>
</span></p>
```

## Markdown

```md
[:component[text]{.class}](/link)

**:component[text]{.class}**

*:component[text]{.class}*

[:component[text]{.class}]
```
