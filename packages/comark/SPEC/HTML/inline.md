## Input

```md
<Hello>Hello **World**</Hello>
```

## AST

```json
{
  "frontmatter": {},
  "meta": {},
  "nodes": [
    [
        "Hello",
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
<Hello>
  Hello <strong>World</strong>
</Hello>
```

## Markdown

```md
<Hello>
Hello **World**
</Hello>
```
