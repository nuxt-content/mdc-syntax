## Input

```md
::page-section
---
full-width: true
---
  ::multi-column
  ---
  columns: 3
  ---

    ::container
    ---
    display: "flex"
    ---
    <svg width="10"></svg>
    ::




    ::container
    ---
    display: "flex"
    ---
    <svg width="10"></svg>
    ::




    ::container
    ---
    display: "flex"
    ---
    <svg width="10"></svg>
    ::

    ::container
    ---
    display: "flex"
    ---
    <svg width="10"></svg>
    ::




    ::container
    ---
    display: "flex"
    ---
    <svg width="10"></svg>
    ::
  ::
::
```

## AST

```json
{
  "frontmatter": {},
  "meta": {},
  "nodes": [
    [
      "page-section",
      {
        ":full-width": "true"
      },
      [
        "multi-column",
        {
          ":columns": "3"
        },
        [
          "container",
          {
            "display": "flex"
          },
          [
            "svg",
            {
              "$": {
                "block": 1,
                "html": 1
              },
              "width": "10"
            }
          ]
        ],
        [
          "container",
          {
            "display": "flex"
          },
          [
            "svg",
            {
              "$": {
                "block": 1,
                "html": 1
              },
              "width": "10"
            }
          ]
        ],
        [
          "container",
          {
            "display": "flex"
          },
          [
            "svg",
            {
              "$": {
                "block": 1,
                "html": 1
              },
              "width": "10"
            }
          ]
        ],
        [
          "container",
          {
            "display": "flex"
          },
          [
            "svg",
            {
              "$": {
                "block": 1,
                "html": 1
              },
              "width": "10"
            }
          ]
        ],
        [
          "container",
          {
            "display": "flex"
          },
          [
            "svg",
            {
              "$": {
                "block": 1,
                "html": 1
              },
              "width": "10"
            }
          ]
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<page-section full-width>
  <multi-column columns="3">
    <container display="flex">
      <svg width="10"></svg>
    </container>
    <container display="flex">
      <svg width="10"></svg>
    </container>
    <container display="flex">
      <svg width="10"></svg>
    </container>
    <container display="flex">
      <svg width="10"></svg>
    </container>
    <container display="flex">
      <svg width="10"></svg>
    </container>
  </multi-column>
</page-section>
```

## Markdown

```md
::page-section{full-width}
  :::multi-column{:columns="3"}
    ::::container{display="flex"}
    <svg width="10"></svg>
    ::::

    ::::container{display="flex"}
    <svg width="10"></svg>
    ::::

    ::::container{display="flex"}
    <svg width="10"></svg>
    ::::

    ::::container{display="flex"}
    <svg width="10"></svg>
    ::::

    ::::container{display="flex"}
    <svg width="10"></svg>
    ::::
  :::
::
```
