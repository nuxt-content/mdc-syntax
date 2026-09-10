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
A `Bonjour`{lang="fr"} and a `const a = 1`{lang="ts"}.
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
      "A ",
      [
        "code",
        {
          "lang": "fr"
        },
        "Bonjour"
      ],
      " and a ",
      [
        "code",
        {
          "lang": "ts",
          "class": "shiki shiki-themes github-dark dark:github-dark"
        },
        [
          "span",
          {
            "style": "color:#F97583"
          },
          "const"
        ],
        [
          "span",
          {
            "style": "color:#79B8FF"
          },
          " a"
        ],
        [
          "span",
          {
            "style": "color:#F97583"
          },
          " ="
        ],
        [
          "span",
          {
            "style": "color:#79B8FF"
          },
          " 1"
        ]
      ],
      "."
    ]
  ]
}
```

## HTML

```html
<p>A <code lang="fr">Bonjour</code> and a <code lang="ts" class="shiki shiki-themes github-dark dark:github-dark"><span style="color:#F97583">const</span><span style="color:#79B8FF"> a</span><span style="color:#F97583"> =</span><span style="color:#79B8FF"> 1</span></code>.</p>
```

## Markdown

```md
A `Bonjour`{lang="fr"} and a `const a = 1`{lang="ts"}.
```
