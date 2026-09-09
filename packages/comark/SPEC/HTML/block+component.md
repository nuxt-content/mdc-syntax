## Input

```md
<Hello>

::component
Default Slot
::

</Hello>
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
      [
        "component",
        {},
        "Default Slot"
      ]
    ]
  ]
}
```

## HTML

```html
<Hello>
  <component>
    Default Slot
  </component>
</Hello>
```

## Markdown

```md
<Hello>
  ::component
  Default Slot
  ::
</Hello>
```
