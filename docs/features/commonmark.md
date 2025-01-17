# CommonMark

This page provides an overview of the types of block and inline markup features supported by CommonMark and MyST, with pointers to additional content of interest. For full details on all the nuance of these features, please look at the [CommonMark Spec documentation](https://spec.commonmark.org/).

MyST (Markedly Structured Text) was designed to make it easier to create publishable computational documents written with Markdown notation. It is a superset of [CommonMark Markdown](https://commonmark.org/) and draws heavy inspiration from [RMarkdown](https://rmarkdown.rstudio.com/) syntax. In addition to CommonMark, MyST also implements and extends [mdast](https://github.com/syntax-tree/mdast), which is a standard abstract syntax tree for Markdown. `mdast` is part of the [unifiedjs](https://unifiedjs.com) community and has [many utilities](https://unifiedjs.com/explore/keyword/mdast/) for exporting and transforming your content.

## Block Markup

### Headings

Markdown syntax denotes headers starting with between 1 to 6 `#`.
For example, a level 3 header looks like:

```{raw} html
<myst-demo>
### Heading Level 3

Try changing the number of `#`s to change the `depth`.
</myst-demo>
```

An alternative syntax (called setext) is also supported for level 1 and 2 headers,
by underlining using multiple `===` or `---`. For example:

```{raw} html
<myst-demo>
Heading 1
=========

Heading 2
---------
</myst-demo>
```

```{seealso}
Reference headings by preceding headers with a `(label)=`. See [](./references.md)!
```

### Lists

Bullet points:

```{raw} html
<myst-demo>
- headings
- lists
  - bullets
  - numbers
- code blocks
</myst-demo>
```

Numbered items:

```{raw} html
<myst-demo>
1. quotes
2. breaks
3. links
</myst-demo>
```

### Code

Code blocks are enclosed in 3 or more `` ` `` or `~` with an optional language name.

````{raw} html
<myst-demo>
```python
print('this is python')
```
</myst-demo>
````

Indented paragraphs are also treated as literal text. This may be used for code or other preformatted text.

```{raw} html
<myst-demo>
Some JSON:

    {
      'literal': '*text*'
    }
</myst-demo>
```

```{seealso}
Create code-blocks with additional highlighting using the `code-block` directive. See more here!
```

% TODO: provide a link!
% TODO: myst: implement code-block

### Quotes

Quote blocks are prepended with `>`:

```{raw} html
<myst-demo>
> Super profound quote
</myst-demo>
```

### Thematic Break

Create a horizontal line in the output

```{raw} html
<myst-demo>
Section 1

---

Section 2
</myst-demo>
```

```{seealso}
Thematic breaks should not be confused with MyST [block syntax](./blocks.md),
which is used to structurally seperate content.
```

### Link Definitions

Links may be defined outside of text with a reference target (no spaces) and an optional title.

```{raw} html
<myst-demo>
[This is a link defined elsewhere!][key]

[key]: https://www.google.com 'a title'
</myst-demo>
```

```{seealso}
These can be used in [](inline-links) and are similar to [](./references.md) in MyST.
This syntax is also similar to [](./footnotes.md).
```

### Paragraph

Any text that does not belong to another block is simply a paragraph:

```{raw} html
<myst-demo>
any _text_
</myst-demo>
```

### Valid HTML

Any valid HTML may also be included in a MyST document and rendered to HTML. However, you must set the option `allowDangerousHtml: true` in the MyST parser.

## Inline Markup

(inline-links)=

### Inline links

Auto-link where link itself is shown in final output:

```{raw} html
<myst-demo>
Search engine: <https://www.google.com>
</myst-demo>
```

Link with alternative text and optional title:

```{raw} html
<myst-demo>
[search engine](https://www.google.com "Google")
</myst-demo>
```

```{seealso}
[](./references.md) provides other ways to reference inline content.
```

### Inline images

Link to an image can be done similar to other inline links, or you may use HTML syntax to include image size, etc.

```{raw} html
<myst-demo>
![alt](https://source.unsplash.com/random/500x200/?fruit "title")
</myst-demo>
```

```{seealso}
[](./figures.md) provides other ways to size, label, and caption images.
```

### Text formatting

Standard inline formatting including bold, italic, code, as well as escaped symbols and line breaks:

```{raw} html
<myst-demo>
**strong**, _emphasis_, `literal text`, \*escaped symbols\*, a hard\
break
</myst-demo>
```

```{seealso}
[](./basic.md) provides other roles for subscript, superscript, abbeviations, and other text formating.
```
