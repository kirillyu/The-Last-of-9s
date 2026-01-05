#!/usr/bin/env python3
import argparse
import datetime
import os
import re
import sys

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

TEMPLATE = """---
title: "{title}"
date: {date}
description: ""
tags: []
---

# {title}

TODO: Write content here.
"""

def main():
    parser = argparse.ArgumentParser(description="Scaffold a new blog post.")
    parser.add_argument("title", help="Title of the post")
    parser.add_argument("--slug", help="Custom slug (optional)")
    args = parser.parse_args()

    title = args.title
    slug = args.slug or slugify(title)
    today = datetime.date.today().isoformat()
    
    filename = f"{today}-{slug}.md"
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs_dir = os.path.join(base_dir, "docs")
    
    paths = {
        "en": os.path.join(docs_dir, "en", filename),
        "ru": os.path.join(docs_dir, "ru", filename),
    }

    print(f"Creating post: {title}")
    print(f"Date: {today}")
    print(f"Slug: {slug}")
    print("-" * 40)

    for lang, path in paths.items():
        if os.path.exists(path):
            print(f"[SKIP] {lang}: File already exists -> {path}")
            continue
        
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(TEMPLATE.format(title=title, date=today))
            print(f"[OK]   {lang}: Created -> {path}")
        except Exception as e:
            print(f"[ERR]  {lang}: Failed to create {path}: {e}")
            sys.exit(1)

    print("-" * 40)
    print("Next steps:")
    print("1. Edit the markdown files found above.")
    print("2. Run 'make generate' to update the blog index.")
    print("3. Run 'make serve' to preview.")

if __name__ == "__main__":
    main()
