---
options:
  highlight: 
    themes:
      light: 'min-light'
      dark: 'nord'
    preStyles: true
---

## Input

```md
::pre{attr="value" .class}
```ts
const variable = "value"
```
::
```

## AST

```json
{
  "frontmatter": {},
  "meta": {},
  "nodes": [
    [
      "pre",
      {
        "language": "ts",
        "attr": "value",
        "class": "shiki shiki-themes min-light nord dark:nord . class",
        "style": "background-color:#ffffff;color:#212121;--shiki-dark-bg:#2e3440;--shiki-dark:#d8dee9"
      },
      [
        "code",
        {
          "class": "language-ts"
        },
        [
          "span",
          {
            "class": "line",
            "style": "display: inline"
          },
          [
            "span",
            {
              "style": "color:#D32F2F;--shiki-dark:#81A1C1"
            },
            "const"
          ],
          [
            "span",
            {
              "style": "color:#1976D2;--shiki-dark:#D8DEE9"
            },
            " variable"
          ],
          [
            "span",
            {
              "style": "color:#D32F2F;--shiki-dark:#81A1C1"
            },
            " ="
          ],
          [
            "span",
            {
              "style": "color:#22863A;--shiki-dark:#ECEFF4"
            },
            " \""
          ],
          [
            "span",
            {
              "style": "color:#22863A;--shiki-dark:#A3BE8C"
            },
            "value"
          ],
          [
            "span",
            {
              "style": "color:#22863A;--shiki-dark:#ECEFF4"
            },
            "\""
          ]
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="ts" attr="value" class="shiki shiki-themes min-light nord dark:nord class" style="background-color:#ffffff;color:#212121;--shiki-dark-bg:#2e3440;--shiki-dark:#d8dee9"><code class="language-ts"><span class="line" style="display: inline"><span style="color:#D32F2F;--shiki-dark:#81A1C1">const</span><span style="color:#1976D2;--shiki-dark:#D8DEE9"> variable</span><span style="color:#D32F2F;--shiki-dark:#81A1C1"> =</span><span style="color:#22863A;--shiki-dark:#ECEFF4"> "</span><span style="color:#22863A;--shiki-dark:#A3BE8C">value</span><span style="color:#22863A;--shiki-dark:#ECEFF4">"</span></span></code></pre>
```

## Markdown

```md
::pre{attr="value" .class}
```ts
const variable = "value"
```
::
```
