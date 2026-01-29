---
timeout:
  parse: 50ms
  html: 5ms
  markdown: 5ms
options:
  highlight: true
---

## Input

```md
```rust [main.rs] {1-4}
fn main() {
    let x = 5;
    let y = 10;
    println!("Sum: {}", x + y);
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
        "language": "rust",
        "filename": "main.rs",
        "highlights": [
          1,
          2,
          3,
          4
        ],
        "class": "shiki github-dark",
        "tabindex": "0",
        "style": "background-color:#24292e;color:#e1e4e8"
      },
      [
        "code",
        {
          "class": "language-rust"
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
            "fn"
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
            "    "
          ],
          [
            "span",
            {
              "style": "color:#F97583"
            },
            "let"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            " x "
          ],
          [
            "span",
            {
              "style": "color:#F97583"
            },
            "="
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
              "style": "color:#79B8FF"
            },
            "5"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ";"
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
            "    "
          ],
          [
            "span",
            {
              "style": "color:#F97583"
            },
            "let"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            " y "
          ],
          [
            "span",
            {
              "style": "color:#F97583"
            },
            "="
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
              "style": "color:#79B8FF"
            },
            "10"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ";"
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
            "    "
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "println!"
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
            "\"Sum: {}\""
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ", x "
          ],
          [
            "span",
            {
              "style": "color:#F97583"
            },
            "+"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            " y);"
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
<pre language="rust" filename="main.rs" highlights="[1,2,3,4]" class="shiki github-dark" tabindex="0" style="background-color:#24292e;color:#e1e4e8"><code class="language-rust"><span class="line"><span style="color:#F97583">fn</span><span style="color:#E1E4E8"> </span><span style="color:#B392F0">main</span><span style="color:#E1E4E8">() {</span></span>
<span class="line"><span style="color:#E1E4E8">    </span><span style="color:#F97583">let</span><span style="color:#E1E4E8"> x </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">5</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#E1E4E8">    </span><span style="color:#F97583">let</span><span style="color:#E1E4E8"> y </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">10</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#E1E4E8">    </span><span style="color:#B392F0">println!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"Sum: {}"</span><span style="color:#E1E4E8">, x </span><span style="color:#F97583">+</span><span style="color:#E1E4E8"> y);</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></code></pre>
```

## Markdown

```md
```rust [main.rs] {1-4}
fn main() {
    let x = 5;
    let y = 10;
    println!("Sum: {}", x + y);
}
```
```
