## Input

```md
<h1>Hello **World**</h1>
```

## AST

```json
{
  "frontmatter": {},
  "meta": {},
  "nodes": [
    [
      "h1",
      {
        "$": {
          "html": 1,
          "block": 1
        }
      },
      "Hello ",
      [
        "strong",
        {},
        "World"
      ]
    ]
  ]
}
```

## HTML

```html
<h1>Hello <strong>World</strong></h1>
```

## Markdown

```md
<h1>Hello **World**</h1>
```
