## Input

```md
a ``x`` b
```

## AST

```json
{
  "frontmatter": {},
  "meta": {},
  "nodes": [
    [
      "p",
      {},
      "a ",
      [
        "code",
        {},
        "x"
      ],
      " b"
    ]
  ]
}
```

## HTML

```html
<p>a <code>x</code> b</p>
```

## Markdown

```md
a `x` b
```
