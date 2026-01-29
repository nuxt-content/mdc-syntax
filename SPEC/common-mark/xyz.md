---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
# Main Title

This is a comprehensive markdown document with **multiple features** and *various* formatting options.

## Section One

Here's a paragraph with a [link to Nuxt](https://nuxt.com) and some `inline code`. You can also find **bold text** and *italic text* together.

### Subsection

> This is a blockquote with important information.
> 
> It can span multiple lines and contain **formatted text**.

#### Nested Heading

Here's an unordered list:

- First item
- Second item with **bold**
- Third item with [a link](https://example.com)
  - Nested item one
  - Nested item two

And here's an ordered list:

1. First numbered item
2. Second numbered item
3. Third numbered item
   - Nested unordered item
   - Another nested item

## Section Two

Here's an image:

![Alt text](/path/to/image.jpg "Image title")

And here's a code block:
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "h1",
      {
        "id": "main-title"
      },
      "Main Title"
    ],
    [
      "p",
      {},
      "This is a comprehensive markdown document with ",
      [
        "strong",
        {},
        "multiple features"
      ],
      " and ",
      [
        "em",
        {},
        "various"
      ],
      " formatting options."
    ],
    [
      "h2",
      {
        "id": "section-one"
      },
      "Section One"
    ],
    [
      "p",
      {},
      "Here's a paragraph with a ",
      [
        "a",
        {
          "href": "https://nuxt.com"
        },
        "link to Nuxt"
      ],
      " and some ",
      [
        "code",
        {},
        "inline code"
      ],
      ". You can also find ",
      [
        "strong",
        {},
        "bold text"
      ],
      " and ",
      [
        "em",
        {},
        "italic text"
      ],
      " together."
    ],
    [
      "h3",
      {
        "id": "subsection"
      },
      "Subsection"
    ],
    [
      "blockquote",
      {},
      [
        "p",
        {},
        "This is a blockquote with important information."
      ],
      [
        "p",
        {},
        "It can span multiple lines and contain ",
        [
          "strong",
          {},
          "formatted text"
        ],
        "."
      ]
    ],
    [
      "h4",
      {
        "id": "nested-heading"
      },
      "Nested Heading"
    ],
    [
      "p",
      {},
      "Here's an unordered list:"
    ],
    [
      "ul",
      {},
      [
        "li",
        {},
        "First item"
      ],
      [
        "li",
        {},
        "Second item with ",
        [
          "strong",
          {},
          "bold"
        ]
      ],
      [
        "li",
        {},
        "Third item with ",
        [
          "a",
          {
            "href": "https://example.com"
          },
          "a link"
        ],
        [
          "ul",
          {},
          [
            "li",
            {},
            "Nested item one"
          ],
          [
            "li",
            {},
            "Nested item two"
          ]
        ]
      ]
    ],
    [
      "p",
      {},
      "And here's an ordered list:"
    ],
    [
      "ol",
      {},
      [
        "li",
        {},
        "First numbered item"
      ],
      [
        "li",
        {},
        "Second numbered item"
      ],
      [
        "li",
        {},
        "Third numbered item",
        [
          "ul",
          {},
          [
            "li",
            {},
            "Nested unordered item"
          ],
          [
            "li",
            {},
            "Another nested item"
          ]
        ]
      ]
    ],
    [
      "h2",
      {
        "id": "section-two"
      },
      "Section Two"
    ],
    [
      "p",
      {},
      "Here's an image:"
    ],
    [
      "p",
      {},
      [
        "img",
        {
          "src": "/path/to/image.jpg",
          "title": "Image title",
          "alt": "Alt text"
        }
      ]
    ],
    [
      "p",
      {},
      "And here's a code block:"
    ]
  ]
}
```

## HTML

```html
<h1 id="main-title">Main Title</h1>
<p>This is a comprehensive markdown document with <strong>multiple features</strong> and <em>various</em> formatting options.</p>
<h2 id="section-one">Section One</h2>
<p>Here's a paragraph with a <a href="https://nuxt.com">link to Nuxt</a> and some <code>inline code</code>. You can also find <strong>bold text</strong> and <em>italic text</em> together.</p>
<h3 id="subsection">Subsection</h3>
<blockquote>
  <p>This is a blockquote with important information.</p>
  <p>It can span multiple lines and contain <strong>formatted text</strong>.</p>
</blockquote>
<h4 id="nested-heading">Nested Heading</h4>
<p>Here's an unordered list:</p>
<ul>
  <li>First item</li>
  <li>Second item with <strong>bold</strong></li>
  <li>
    Third item with <a href="https://example.com">a link</a>
    <ul>
      <li>Nested item one</li>
      <li>Nested item two</li>
    </ul>
  </li>
</ul>
<p>And here's an ordered list:</p>
<ol>
  <li>First numbered item</li>
  <li>Second numbered item</li>
  <li>
    Third numbered item
    <ul>
      <li>Nested unordered item</li>
      <li>Another nested item</li>
    </ul>
  </li>
</ol>
<h2 id="section-two">Section Two</h2>
<p>Here's an image:</p>
<p><img src="/path/to/image.jpg" title="Image title" alt="Alt text" /></p>
<p>And here's a code block:</p>
```

## Markdown

```md
# Main Title

This is a comprehensive markdown document with **multiple features** and *various* formatting options.

## Section One

Here's a paragraph with a [link to Nuxt](https://nuxt.com) and some `inline code`. You can also find **bold text** and *italic text* together.

### Subsection

> This is a blockquote with important information.
> 
> It can span multiple lines and contain **formatted text**.

#### Nested Heading

Here's an unordered list:

- First item
- Second item with **bold**
- Third item with [a link](https://example.com)
  - Nested item one
  - Nested item two

And here's an ordered list:

1. First numbered item
2. Second numbered item
3. Third numbered item
  - Nested unordered item
  - Another nested item

## Section Two

Here's an image:

![Alt text](/path/to/image.jpg "Image title")

And here's a code block:
```
