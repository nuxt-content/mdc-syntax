---
timeout:
  parse: 500ms
  html: 5ms
  markdown: 5ms
options:
  highlight:
    themes:
      light: 'github-dark'
---

## Input

```md
Use `Ref<HTMLInputElement | null>`{lang="ts-type"} with `<UButton />`{lang="vue-html"}.
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
      "Use ",
      [
        "code",
        {
          "lang": "ts-type",
          "class": "shiki shiki-themes github-dark dark:github-dark"
        },
        [
          "span",
          {
            "style": "color:#B392F0"
          },
          "Ref"
        ],
        [
          "span",
          {
            "style": "color:#E1E4E8"
          },
          "<"
        ],
        [
          "span",
          {
            "style": "color:#B392F0"
          },
          "HTMLInputElement"
        ],
        [
          "span",
          {
            "style": "color:#F97583"
          },
          " |"
        ],
        [
          "span",
          {
            "style": "color:#79B8FF"
          },
          " null"
        ],
        [
          "span",
          {
            "style": "color:#E1E4E8"
          },
          ">"
        ]
      ],
      " with ",
      [
        "code",
        {
          "lang": "vue-html",
          "class": "shiki shiki-themes github-dark dark:github-dark"
        },
        [
          "span",
          {
            "style": "color:#E1E4E8"
          },
          "<"
        ],
        [
          "span",
          {
            "style": "color:#85E89D"
          },
          "UButton"
        ],
        [
          "span",
          {
            "style": "color:#E1E4E8"
          },
          " />"
        ]
      ],
      "."
    ]
  ]
}
```

## HTML

```html
<p>Use <code lang="ts-type" class="shiki shiki-themes github-dark dark:github-dark"><span style="color:#B392F0">Ref</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">HTMLInputElement</span><span style="color:#F97583"> |</span><span style="color:#79B8FF"> null</span><span style="color:#E1E4E8">&gt;</span></code> with <code lang="vue-html" class="shiki shiki-themes github-dark dark:github-dark"><span style="color:#E1E4E8">&lt;</span><span style="color:#85E89D">UButton</span><span style="color:#E1E4E8"> /&gt;</span></code>.</p>
```

## Markdown

```md
Use `Ref<HTMLInputElement | null>`{lang="ts-type"} with `<UButton />`{lang="vue-html"}.
```
