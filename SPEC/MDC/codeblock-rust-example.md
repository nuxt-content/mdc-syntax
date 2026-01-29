---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
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
        ]
      },
      [
        "code",
        {
          "class": "language-rust"
        },
        "fn main() {\n    let x = 5;\n    let y = 10;\n    println!(\"Sum: {}\", x + y);\n}"
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="rust" filename="main.rs" highlights="[1,2,3,4]"><code class="language-rust">fn main() {
    let x = 5;
    let y = 10;
    println!("Sum: {}", x + y);
}</code></pre>
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
