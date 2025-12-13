package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

type FrontMatter struct {
	Title       string    `yaml:"title"`
	Date        time.Time `yaml:"date"`
	Description string    `yaml:"description"`
	Tags        []string  `yaml:"tags"`
}

type Article struct {
	Lang  string
	Path  string
	Front FrontMatter
}

func parseFile(path string) (*FrontMatter, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	parts := strings.SplitN(string(data), "---", 3)
	if len(parts) < 3 {
		return nil, fmt.Errorf("no front matter in %s", path)
	}

	var fm FrontMatter
	if err := yaml.Unmarshal([]byte(parts[1]), &fm); err != nil {
		return nil, err
	}

	return &fm, nil
}

func main() {
	base := "../../docs"
	langs := []string{"ru", "en"}

	var articles []Article

	for _, lang := range langs {
		root := filepath.Join(base, lang)
		_ = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() || !strings.HasSuffix(path, ".md") {
				return nil
			}
			if info.Name() == "index.md" {
				return nil
			}

			fm, err := parseFile(path)
			if err != nil {
				return nil
			}

			articles = append(articles, Article{
				Lang:  lang,
				Path:  filepath.ToSlash(strings.TrimPrefix(path, base+"/")),
				Front: *fm,
			})
			return nil
		})
	}

	sort.Slice(articles, func(i, j int) bool {
		return articles[i].Front.Date.After(articles[j].Front.Date)
	})

	var out []string
	out = append(out,
		"# Blog",
		"",
		"## Latest posts",
		"",
		"| Date | Title | Description | Lang |",
		"|------|-------|-------------|------|",
	)

	for _, a := range articles {
		out = append(out, fmt.Sprintf(
			"| %s | [%s](%s) | %s | %s |",
			a.Front.Date.Format("2006-01-02"),
			a.Front.Title,
			a.Path,
			a.Front.Description,
			strings.ToUpper(a.Lang),
		))
	}

	err := os.WriteFile(filepath.Join(base, "index.md"),
		[]byte(strings.Join(out, "\n")),
		0644,
	)
	if err != nil {
		panic(err)
	}
}

