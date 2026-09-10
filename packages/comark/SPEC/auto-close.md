---
# Behavioral SPEC for autoCloseMarkdown (not a parse fixture).
# Exercised by test/auto-close-spec.test.ts — skip the Input/AST/HTML runner.
skip: true
---

# Auto Close Markdown Spec

Self-healing markdown for streaming. Completes incomplete syntax so partial AI output still renders cleanly.

options:
- incompleteLinkPlaceholder: a placeholder for incomplete links (default: `comark:incomplete-link`)
- incompleteImagePlaceholder: a placeholder for incomplete images (default: `comark:incomplete-image`)
- math: auto-close inline `$…$` and block `$$…$$` (default: `false`)
- dropTrailingOpeners: drop a trailing opener after whitespace at EOF (`hello *` → `hello`) so half-typed markers do not flash (default: `false`; enabled when parsing with `streaming: true`)

The parse-level `autoClose` option defaults to `'streaming'`, so `parseMarkdown()` and
`createMarkdownParser()` heal only a parse called with `{ streaming: true }`. `autoClose: true`
heals every parse. Calling `autoCloseMarkdown` directly always heals.


---

## Bold

Closes unclosed `**…**`.

```diff
- Text with **bold
+ Text with **bold**
```

```diff
- **incomplete
+ **incomplete**
```

```diff
- **first** and **second
+ **first** and **second**
```

```diff
- **bold text*
+ **bold text**
```

```diff
- Text with **bold text**
+ Text with **bold text**
```

```diff
- **
+ **
```

---

## Italic (asterisk)

Closes unclosed `*…*`.

```diff
- Text with *italic
+ Text with *italic*
```

```diff
- *incomplete
+ *incomplete*
```

```diff
- **bold** and *italic
+ **bold** and *italic*
```

```diff
- Text ending with *
+ Text ending with *
```

---

## Italic (underscore)

Closes unclosed `_…_` and `__…__`.

```diff
- Text with _italic
+ Text with _italic_
```

```diff
- _incomplete
+ _incomplete_
```

```diff
- Text with __italic
+ Text with __italic__
```

```diff
- __first__ and __second
+ __first__ and __second__
```

```diff
- __bold text_
+ __bold text__
```

Trailing newline still gets closed:

```diff
- Text with _italic\n
+ Text with _italic_\n
```

---

## Bold + italic

Closes unclosed `***…***`.

```diff
- Text with ***bold-italic
+ Text with ***bold-italic***
```

```diff
- ***incomplete
+ ***incomplete***
```

```diff
- ***first*** and ***second
+ ***first*** and ***second***
```

```diff
- *italic* **bold** ***both
+ *italic* **bold** ***both***
```

Does not treat overlapping bold+italic as bold-italic:

```diff
- Combined **bold and *italic*** text
+ Combined **bold and *italic*** text
```

---

## Inline code

Closes unclosed `` `…` ``.

```diff
- Text with `code
+ Text with `code`
```

```diff
- `incomplete
+ `incomplete`
```

```diff
- ```python print("Hello")``
+ ```python print("Hello")```
```

After a finished code fence, still closes later inline code:

```diff
- ```\nblock\n```\n`inline
+ ```\nblock\n```\n`inline`
```

Leaves finished inline code alone:

```diff
- Text with `inline code`
+ Text with `inline code`
```

### Delimiter runs

A span closes on a backtick run of the same length as its opener. A shorter or longer
run inside the span is literal content, so a finished multi-backtick span is left alone
even when text follows it.

```diff
- a ``x`` b
+ a ``x`` b
```

```diff
- `` a _b ``
+ `` a _b ``
```

```diff
- ``{ modelValue: _Number<T> }`` and more
+ ``{ modelValue: _Number<T> }`` and more
```

```diff
- ``Use `code` in your Markdown file.``
+ ``Use `code` in your Markdown file.``
```

An unclosed run is closed with a run of its own length, and markers opened inside it
still close inside:

```diff
- use ``a _b`` then _c
+ use ``a _b`` then _c_
```

```diff
- `a`` b
+ `a`` b`
```

```diff
- ``a` b
+ ``a` b``
```

A run of three or more mid-line is fence-shaped, not an inline span, and stays literal.

---

## Strikethrough

Closes unclosed `~~…~~`.

```diff
- Text with ~~strike
+ Text with ~~strike~~
```

```diff
- ~~incomplete
+ ~~incomplete~~
```

```diff
- ~~first~~ and ~~second
+ ~~first~~ and ~~second~~
```

Half-closed closing marker:

```diff
- ~~strike text~
+ ~~strike text~~
```

---

## Single tilde escape

Escapes a lone `~` between word characters so it is not read as strikethrough.

```diff
- 20~25°C
+ 20\~25°C
```

```diff
- foo~bar
+ foo\~bar
```

```diff
- 20~25 and ~~strike
+ 20\~25 and ~~strike~~
```

Leaves intentional strikethrough alone:

```diff
- ~~strikethrough~~
+ ~~strikethrough~~
```

Does not escape edge/space cases:

```diff
- ~hello
+ ~hello
```

```diff
- hello~
+ hello~
```

```diff
- hello ~ world
+ hello ~ world
```

Does not escape open/close cases:

```diff
- H~2~o
+ H~2~o
```

---

## Links (default protocol mode)

Incomplete links become a safe placeholder URL.

```diff
- Text with [incomplete link
+ Text with [incomplete link](comark:incomplete-link)
```

```diff
- Visit [our site](https://exa
+ Visit [our site](comark:incomplete-link)
```

```diff
- [outer [nested] text](incomplete
+ [outer [nested] text](comark:incomplete-link)
```

```diff
- Text [outer [inner
+ Text [outer [inner](comark:incomplete-link)
```

Leaves finished links alone:

```diff
- Text with [complete link](url)
+ Text with [complete link](url)
```

---

## Links (text-only mode)

Incomplete links become plain text (no link markup).

```diff
- Text with [incomplete link
+ Text with incomplete link
```

```diff
- Visit [our site](https://exa
+ Visit our site
```

```diff
- [outer [nested] text](incomplete
+ outer [nested] text
```

```diff
- Check out [this lin
+ Check out this lin
```

Finished links stay links:

```diff
- Text with [complete link](url)
+ Text with [complete link](url)
```

---

## Images

Incomplete images become a loading placeholder.

```diff
- Text with ![incomplete image
+ Text with ![incomplete image](comark:incomplete-image)
```

```diff
- Text with ![incomplete image]
+ Text with ![incomplete image](comark:incomplete-image)
```

```diff
- ![partial
+ ![partial](comark:incomplete-image)
```

```diff
- ![logo](./assets/log
+ ![logo](comark:incomplete-image)
```

```diff
- Text ![outer [inner]
+ Text ![outer [inner]](comark:incomplete-image)
```

Still uses image placeholder even in link text-only mode:

```diff
- Text ![alt](http://partial
+ Text ![alt](comark:incomplete-image)
```

Leaves finished images alone:

```diff
- Text with ![alt text](image.png)
+ Text with ![alt text](image.png)
```

---

## Block math (KaTeX)

Closes unclosed `$$…$$` when `math: true`.

```diff
- Text with $$formula
+ Text with $$formula$$
```

```diff
- $$incomplete
+ $$incomplete$$
```

```diff
- $$first$$ and $$second
+ $$first$$ and $$second$$
```

```diff
- $$formula$
+ $$formula$$
```

Multiline:

```diff
- $$\nx = 1\ny = 2
+ $$\nx = 1\ny = 2\n$$
```

---

## Inline math

Closes unclosed `$…$` when `math: true` (default off for bare `autoCloseMarkdown`; on via `parseMarkdown`).

```diff
- Text with $formula
+ Text with $formula$
```

```diff
- $first$ and $second
+ $first$ and $second$
```

```diff
- $$block$$ and $inline
+ $$block$$ and $inline$
```

Default (`math` unset / `false`) leaves math alone:

```diff
- Text with $formula
+ Text with $formula
```

---

## Incomplete HTML tags

Strips a partial HTML tag at the end so it never flashes raw markup.

```diff
- Hello <div
+ Hello
```

```diff
- Hello </div
+ Hello
```

```diff
- Hello <div class="foo
+ Hello
```

```diff
- <div>content</di
+ <div>content
```

```diff
- <div>Hello</div> <span
+ <div>Hello</div>
```

Keeps real comparisons and finished tags:

```diff
- 3 < 5
+ 3 < 5
```

```diff
- Hello <div>
+ Hello <div>
```

```diff
- <div>content</div>
+ <div>content</div>
```

---

## Comparison operators in lists

Escapes `>` that would otherwise become a blockquote inside a list item.

```diff
- - > 25: rich
+ - \> 25: rich
```

```diff
- * > 25: rich
+ * \> 25: rich
```

```diff
- 1. > 25: rich
+ 1. \> 25: rich
```

```diff
- - >= 10: high
+ - \>= 10: high
```

```diff
- - > $100: expensive
+ - \> $100: expensive
```

Leaves real blockquotes and non-numeric quote lists alone:

```diff
- > Some blockquote
+ > Some blockquote
```

```diff
- - > Some quoted text
+ - > Some quoted text
```

---

## Setext heading guard

Stops a lone `-` / `=` under text from turning the previous line into a heading while a list is still streaming in.

(`​` = zero-width space)

```diff
- here is a list\n-
+ here is a list\n-​
```

```diff
- Some text\n--
+ Some text\n--​
```

```diff
- Some text\n=
+ Some text\n=​
```

```diff
- Some text\n==
+ Some text\n==​
```

Leaves valid rules / finished setext alone:

```diff
- Some text\n---
+ Some text\n---
```

```diff
- Heading\n===
+ Heading\n===
```

```diff
- here is a list\n- list item 1
+ here is a list\n- list item 1
```

---

## Leave list markers alone

List bullets are not treated as emphasis openers.

```diff
- * Item 1\n* Item 2\n* Item 3
+ * Item 1\n* Item 2\n* Item 3
```

```diff
- - **
+ - **
```

```diff
- - __
+ - __
```

```diff
- - ***
+ - ***
```

```diff
- - Item 1\n- Item 2 with **bol
+ - Item 1\n- Item 2 with **bol**
```

A space after the opener is not emphasis (`** something` is not bold):

```diff
- - ** text after
+ - ** text after
```

---

## Leave code fences alone

Fenced code is left as-is (including markers that look like bold/links/math inside).

```diff
- ```javascript\nconst x = 5;
+ ```javascript\nconst x = 5;
```

```diff
- ```\ncode block with `backtick\n```
+ ```\ncode block with `backtick\n```
```

```diff
- ```\nconst arr = [1, 2, 3];\nconsole.log(arr[0]);\n```
+ ```\nconst arr = [1, 2, 3];\nconsole.log(arr[0]);\n```
```

Emphasis after a closed fence still completes:

```diff
- ```css\ncode here\n```\n\n**incomplete bold
+ ```css\ncode here\n```\n\n**incomplete bold**
```

Mermaid `[*]` is not treated as italic:

```diff
- ```mermaid\nstateDiagram-v2\n    [*] --> Idle\n```
+ ```mermaid\nstateDiagram-v2\n    [*] --> Idle\n```
```

---

## Leave horizontal rules alone

```diff
- ---
+ ---
```

```diff
- ***
+ ***
```

```diff
- ___
+ ___
```

```diff
- Text before\n***\nText after
+ Text before\n***\nText after
```

```diff
- Some text\n\n---
+ Some text\n\n---
```

---

## Word-internal markers stay literal

Asterisks / underscores inside identifiers are not emphasis.

```diff
- hello*world
+ hello*world
```

```diff
- 234234*123
+ 234234*123
```

```diff
- hello_world
+ hello_world
```

```diff
- user_name
+ user_name
```

```diff
- MAX_VALUE
+ MAX_VALUE
```

```diff
- 1_000_000
+ 1_000_000
```

```diff
- The variable_name is _important
+ The variable_name is _important_
```

Space-flanked `*` is treated as multiply, not italic:

```diff
- 3 + 2 - 5 * 0 = ?
+ 3 + 2 - 5 * 0 = ?
```

```diff
- 5 * 0 and *italic
+ 5 * 0 and *italic*
```

---

## Multiple openers on one line

Two closers for the same marker emitted back-to-back would merge into a different
marker, so each run of same-marker closers collapses to one. `a _b and _c` used to
heal to `a _b and _c__`, which nests an em inside an em.

```diff
- a _b and _c
+ a _b and _c_
```

```diff
- a __b and __c
+ a __b and __c__
```

```diff
- a ~~b and ~~c
+ a ~~b and ~~c~~
```

```diff
- *a *b *c
+ *a *b *c*
```

Markers of different families still nest, so non-adjacent repeats are left alone:

```diff
- _a **b _c
+ _a **b _c_**_
```

```diff
- a _b and __c
+ a _b and __c___
```

---

## Math protects inner markers

Underscores and asterisks inside math are not italic/bold.

```diff
- $$x_1 + y_2 = z_3$$
+ $$x_1 + y_2 = z_3$$
```

```diff
- $$formula_
+ $$formula_$$
```

```diff
- $$\mathbf{w}^{*}$$
+ $$\mathbf{w}^{*}$$
```

```diff
- Start *italic with $$x^{*}$$
+ Start *italic with $$x^{*}$$*
```

LaTeX `\(...\)` / `\[...\]` also protect subscripts:

```diff
- Inline math \(x_1\) and _ordinary italic
+ Inline math \(x_1\) and _ordinary italic_
```

---

## Nested / mixed formatting

Handlers run in a fixed order; nested incomplete markers close cleanly.

```diff
- **bold and *italic
+ **bold and *italic*
```

```diff
- *italic with **bold
+ *italic with **bold***
```

```diff
- **bold with `code
+ **bold with `code**`
```

```diff
- ~~strike with **bold
+ ~~strike with **bold**~~
```

```diff
- combined **_bold and italic
+ combined **_bold and italic_**
```

```diff
- _italic and **bold
+ _italic and **bold**_
```

Links win over formatting completion:

```diff
- Text with [link and **bold
+ Text with [link and **bold](comark:incomplete-link)
```

---

## Emphasis markers stay put inside code / escapes

```diff
- `**bold`
+ `**bold`
```

```diff
- `*italic`
+ `*italic`
```

```diff
- `code` **bold
+ `code` **bold**
```

```diff
- \`not code\` **bold
+ \`not code\` **bold**
```

```diff
- \*escaped asterisk and *italic
+ \*escaped asterisk and *italic*
```

```diff
- \_escaped\_ and _unescaped
+ \_escaped\_ and _unescaped_
```

---

## Trailing whitespace cleanup

A single trailing space is dropped; a double space (markdown hard break) is kept.

```diff
- hello 
+ hello
```

```diff
- hello  
+ hello  
```

```diff
- **bold 
+ **bold**
```

---

## Leave finished / empty cases alone

```diff
- This is plain text without any markdown
+ This is plain text without any markdown
```

```diff
- *
+ *
```

```diff
- **
+ **
```

```diff
- `
+ `
```

```diff
- ~~
+ ~~
```

```diff
- ****
+ ****
```

---

## Streaming chunks (progressive)

Same content as it grows, still heal at every step.

**Bold:**

```diff
- Here is a **bold
+ Here is a **bold**
```

```diff
- Here is a **bold statement
+ Here is a **bold statement**
```

```diff
- Here is a **bold statement** about `code
+ Here is a **bold statement** about `code`
```

**Bold-italic:**

```diff
- This is ***very
+ This is ***very***
```

```diff
- This is ***very important
+ This is ***very important***
```

**Link (protocol):**

```diff
- Check out [this lin
+ Check out [this lin](comark:incomplete-link)
```

```diff
- [Click here](https://
+ [Click here](comark:incomplete-link)
```

**Link (text-only):**

```diff
- Check out [this lin
+ Check out this lin
```

**Inside headings / quotes / tables:**

```diff
- # Main Title\n## Subtitle with **emph
+ # Main Title\n## Subtitle with **emph**
```

```diff
- > Quote with **bold
+ > Quote with **bold**
```

```diff
- | Col1 | Col2 |\n|------|------|\n| **dat
+ | Col1 | Col2 |\n|------|------|\n| **dat**
```

**Task lists:**

```diff
- - [ ] **todo
+ - [ ] **todo**
```

```diff
- - [x] ~~done
+ - [x] ~~done~~
```

---

## Trailing openers (`dropTrailingOpeners: true`)

Drop a trailing opener (`* _ $ : [ { !`) after whitespace at EOF so a half-typed marker does not flash. Attached markers (`**bold`, `$x`) still auto-close. Enabled automatically when parsing with `streaming: true`.

```diff
- hello *
+ hello
```

```diff
- hello **
+ hello
```

```diff
- hello ***
+ hello
```

```diff
- hello _
+ hello
```

```diff
- hello __
+ hello
```

```diff
- hello $
+ hello
```

```diff
- hello $$
+ hello
```

```diff
- hello :
+ hello
```

```diff
- hello [
+ hello
```

```diff
- hello [[
+ hello
```

```diff
- hello {
+ hello
```

An earlier space-separated `*` cannot become syntax (it is already followed by space), so only the last opener is dropped:

```diff
- hello * *
+ hello *
```

Attached incomplete syntax is still closed:

```diff
- hello **bold
+ hello **bold**
```
