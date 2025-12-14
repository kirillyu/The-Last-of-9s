---
title: Example Article - Welcome
date: 2025-12-13
description: Example article to demonstrate blog structure
tags: [welcome, example, tutorial]
---

# Example Article - Welcome

This is an example article to demonstrate how your blog works with automatic table of contents navigation.

## Article Structure

Each article should contain:

1. **Front matter** in YAML format with fields:
   - `title` - article title
   - `date` - publication date (YYYY-MM-DD)
   - `description` - brief description
   - `tags` - list of tags

2. **Content** in Markdown format

### Subheadings

Navigation is automatically built from H2 (##) and H3 (###) level headers.

#### Nested Headers

Even H4 (####) headers can be used for structuring.

## Formatting Examples

### Code Example

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Blog!")
}
```

### Tables

| Metric  | Value    | Description |
|---------|----------|-------------|
| CPU     | 45%      | CPU load |
| Memory  | 2.1 GB   | Memory usage |
| Disk I/O| 120 MB/s | Write speed |

### Admonitions

!!! note "Note"
    This is important information for the reader.

!!! warning "Warning"
    Be careful with this operation!

!!! tip "Tip"
    Use keyboard shortcuts for quick navigation.

## Adaptive Theme

The theme **automatically detects** your operating system settings:

- 🌞 If you have light mode in system → light theme on blog
- 🌙 If you have dark mode in system → dark theme on blog
- 🔄 You can manually toggle by clicking the icon in the top right corner

## Article Navigation

On the right side, you'll see a **Table of Contents** with automatic navigation through all headers of this article. The active section is highlighted as you scroll.

## Next Steps

You can:

- Delete this article
- Add your articles to `docs/ru/` or `docs/en/`
- Run `make serve` for local preview
- Commit changes for automatic publication

### Useful Links

- [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)
- [Markdown Guide](https://www.markdownguide.org/)

## Conclusion

Now your blog is ready for adding technical articles with convenient navigation!

