---
timeout:
  parse: 200ms
  html: 5ms
  markdown: 5ms
options:
  highlight: true
---

## Input

```md
```go {1,3,5-7,10}
package main

import "fmt"

func main() {
    fmt.Println("Line 6")
    fmt.Println("Line 7")
    fmt.Println("Line 8")
    fmt.Println("Line 9")
    fmt.Println("Line 10")
}
```
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "pre",
      {
        "language": "go",
        "highlights": [
          1,
          3,
          5,
          6,
          7,
          10
        ],
        "class": "shiki github-dark",
        "tabindex": "0",
        "style": "background-color:#24292e;color:#e1e4e8"
      },
      [
        "code",
        {
          "class": "language-go"
        },
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#F97583"
            },
            "package"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            " "
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "main"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          }
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#F97583"
            },
            "import"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            " "
          ],
          [
            "span",
            {
              "style": "color:#9ECBFF"
            },
            "\""
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "fmt"
          ],
          [
            "span",
            {
              "style": "color:#9ECBFF"
            },
            "\""
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          }
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#F97583"
            },
            "func"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            " "
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "main"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "() {"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "    fmt."
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "Println"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "("
          ],
          [
            "span",
            {
              "style": "color:#9ECBFF"
            },
            "\"Line 6\""
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ")"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "    fmt."
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "Println"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "("
          ],
          [
            "span",
            {
              "style": "color:#9ECBFF"
            },
            "\"Line 7\""
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ")"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "    fmt."
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "Println"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "("
          ],
          [
            "span",
            {
              "style": "color:#9ECBFF"
            },
            "\"Line 8\""
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ")"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "    fmt."
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "Println"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "("
          ],
          [
            "span",
            {
              "style": "color:#9ECBFF"
            },
            "\"Line 9\""
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ")"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "    fmt."
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "Println"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "("
          ],
          [
            "span",
            {
              "style": "color:#9ECBFF"
            },
            "\"Line 10\""
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ")"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "}"
          ]
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="go" highlights="[1,3,5,6,7,10]" class="shiki github-dark" tabindex="0" style="background-color:#24292e;color:#e1e4e8"><code class="language-go"><span class="line"><span style="color:#F97583">package</span><span style="color:#E1E4E8"> </span><span style="color:#B392F0">main</span></span>
<span class="line"></span>
<span class="line"><span style="color:#F97583">import</span><span style="color:#E1E4E8"> </span><span style="color:#9ECBFF">"</span><span style="color:#B392F0">fmt</span><span style="color:#9ECBFF">"</span></span>
<span class="line"></span>
<span class="line"><span style="color:#F97583">func</span><span style="color:#E1E4E8"> </span><span style="color:#B392F0">main</span><span style="color:#E1E4E8">() {</span></span>
<span class="line"><span style="color:#E1E4E8">    fmt.</span><span style="color:#B392F0">Println</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"Line 6"</span><span style="color:#E1E4E8">)</span></span>
<span class="line"><span style="color:#E1E4E8">    fmt.</span><span style="color:#B392F0">Println</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"Line 7"</span><span style="color:#E1E4E8">)</span></span>
<span class="line"><span style="color:#E1E4E8">    fmt.</span><span style="color:#B392F0">Println</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"Line 8"</span><span style="color:#E1E4E8">)</span></span>
<span class="line"><span style="color:#E1E4E8">    fmt.</span><span style="color:#B392F0">Println</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"Line 9"</span><span style="color:#E1E4E8">)</span></span>
<span class="line"><span style="color:#E1E4E8">    fmt.</span><span style="color:#B392F0">Println</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"Line 10"</span><span style="color:#E1E4E8">)</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></code></pre>
```

## Markdown

```md
```go {1,3,5-7,10}
package main

import "fmt"

func main() {
    fmt.Println("Line 6")
    fmt.Println("Line 7")
    fmt.Println("Line 8")
    fmt.Println("Line 9")
    fmt.Println("Line 10")
}
```
```
