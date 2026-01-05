# The Last of 9s

Performance engineering longreads built on MkDocs Material and GitHub Pages.

## ✨ Features

- 🎨 **Custom Landing** - Excalidraw-inspired visuals with a subtle reliability backdrop
- 🌓 **Adaptive Theme** - Automatically follows system preferences (light/dark mode) with manual toggle
- 📱 **Mobile-First** - Optimized for all devices
- 📑 **Table of Contents** - Automatic navigation through article headings with scroll tracking
- 🔍 **Search** - Full-text search with suggestions
- 💻 **Code Highlighting** - Syntax highlighting with copy button
- 📊 **Tables** - Responsive tables with horizontal scroll on mobile
- 🚀 **Fast** - Static site generation with instant navigation and prefetch
- 🌐 **Bilingual** - English-first with a Russian mirror
- 🎯 **Admonitions** - Beautiful callouts for notes, warnings, and tips
- 📈 **Dashboards** - Grafana dashboards section for observability

## Structure

```
.
├── mkdocs.yml           # MkDocs configuration
├── Makefile             # Build automation
├── docs/
│   ├── index.md         # Landing page
│   ├── start-here.md    # Reader guide
│   ├── dashboards.md    # Grafana dashboards hub
│   ├── about.md         # About page
│   ├── _includes/       # Generated landing snippets
│   ├── ru/              # Russian pages and articles
│   │   ├── home.md
│   │   ├── start-here.md
│   │   ├── dashboards.md
│   │   ├── about.md
│   │   └── index.md
│   └── en/              # English articles
│       └── index.md
├── tools/
│   └── indexgen/        # Go-based index generator
│       ├── go.mod
│       └── main.go
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions CI/CD
└── requirements.txt     # Python dependencies
```

## Local Development

### Prerequisites

- Go 1.22+
- Python 3.11+
- Make

### Setup

```bash
# Create venv (recommended) and install Python dependencies
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# Install Go dependencies
cd tools/indexgen && go mod download && cd ../..
```

### Commands

```bash
# Serve production-like build (base path /The-Last-of-9s/)
make serve

# Live reload dev server (base path differs from production)
make serve-dev

# Build static site
make build

# Generate index only
make generate

# Create a new article
make new LANG=en TITLE="Post title" SLUG=post-title

# Fast rebuild for local checks
make build-fast

# Clean build artifacts (use before a full rebuild if needed)
make clean
```

Note: `make` uses `./venv/bin/python` if it exists, otherwise it falls back to `python3` from PATH.

## Writing Articles

Create a new markdown file in `docs/ru/` or `docs/en/` with front matter:

```markdown
---
title: Your Article Title
date: 2025-01-12
description: Brief description of the article
tags: [tag1, tag2, tag3]
---

# Your Article Title

Content goes here...
```

Language index pages and the landing "latest" blocks are generated from article front matter.

## Deployment

Push to `main` branch, and GitHub Actions will automatically:
1. Generate the index page
2. Build the site with MkDocs
3. Deploy to GitHub Pages

## License

MIT
