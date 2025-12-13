# The Last of 9s

Performance engineering blog powered by MkDocs and GitHub Pages.

## Structure

```
.
├── mkdocs.yml           # MkDocs configuration
├── Makefile             # Build automation
├── docs/
│   ├── index.md         # Auto-generated main page
│   ├── ru/              # Russian articles
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
# Install Python dependencies
pip install -r requirements.txt

# Install Go dependencies
cd tools/indexgen && go mod download && cd ../..
```

### Commands

```bash
# Generate index and serve locally
make serve

# Build static site
make build

# Generate index only
make generate

# Clean build artifacts
make clean
```

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

The main index page will be automatically generated from all articles, sorted by date.

## Deployment

Push to `main` branch, and GitHub Actions will automatically:
1. Generate the index page
2. Build the site with MkDocs
3. Deploy to GitHub Pages

## License

MIT

