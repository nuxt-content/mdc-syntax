---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
# H1

## H2

### H3

#### H4

##### H5

###### H6
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "h1",
      {
        "id": "h1"
      },
      "H1"
    ],
    [
      "h2",
      {
        "id": "h2"
      },
      "H2"
    ],
    [
      "h3",
      {
        "id": "h3"
      },
      "H3"
    ],
    [
      "h4",
      {
        "id": "h4"
      },
      "H4"
    ],
    [
      "h5",
      {
        "id": "h5"
      },
      "H5"
    ],
    [
      "h6",
      {
        "id": "h6"
      },
      "H6"
    ]
  ]
}
```

## HTML

```html
<h1 id="h1">H1</h1>
<h2 id="h2">H2</h2>
<h3 id="h3">H3</h3>
<h4 id="h4">H4</h4>
<h5 id="h5">H5</h5>
<h6 id="h6">H6</h6>
```

## Markdown

```md
# H1

## H2

### H3

#### H4

##### H5

###### H6
```
