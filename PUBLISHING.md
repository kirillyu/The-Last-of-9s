# Publishing Workflow

This guide describes how to publish new articles to valid `en` and `ru` locales.

## 1. Scaffold
Create the file structure using the helper script. This ensures consistent naming.

```bash
python3 tools/new_post.py "My Article Title"
```
*Optionally, provide `--slug my-custom-slug`.*

This will create:
- `docs/en/YYYY-MM-DD-my-article-title.md`
- `docs/ru/YYYY-MM-DD-my-article-title.md`

## 2. Write
Edit the generated files.
- **Frontmatter**: Fill in `description` and `tags`.
- **Content**: Write your article. Ensure `ru` content is translated if desired.
    - *Note: If you delete the `ru` file, the language switcher will just disappear for that page.*

## 3. Generate Index
Update the `blog.md` listings and RSS feeds.

```bash
make generate
```

## 4. Preview
Run the local dev server to verify everything links correctly.

```bash
make serve
```

## 5. Publish
Commit and push to GitHub. The CI/CD pipeline (GitHub Actions) handles the rest.
