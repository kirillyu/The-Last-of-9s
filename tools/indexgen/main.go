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

	// Собираем статьи по языкам
	articlesByLang := make(map[string][]Article)

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

			// Относительный путь от языковой директории
			relPath := strings.TrimPrefix(path, filepath.Join(base, lang)+"/")

			articlesByLang[lang] = append(articlesByLang[lang], Article{
				Lang:  lang,
				Path:  relPath,
				Front: *fm,
			})
			return nil
		})
	}

	// Генерируем index.md для каждого языка
	for _, lang := range langs {
		articles := articlesByLang[lang]
		
		// Сортируем по дате
		sort.Slice(articles, func(i, j int) bool {
			return articles[i].Front.Date.After(articles[j].Front.Date)
		})

		var out []string
		
		if lang == "ru" {
			out = append(out,
				"# Русские статьи",
				"",
				"Все статьи на русском языке о производительности, профилировании и системной инженерии.",
				"",
				"## Последние публикации",
				"",
			)
		} else {
			out = append(out,
				"# English Articles",
				"",
				"All articles in English about performance, profiling, and system engineering.",
				"",
				"## Latest Posts",
				"",
			)
		}

		if len(articles) == 0 {
			if lang == "ru" {
				out = append(out, "*Статьи скоро появятся...*")
			} else {
				out = append(out, "*Articles coming soon...*")
			}
		} else {
			out = append(out,
				"| Date | Title | Description |",
				"|------|-------|-------------|",
			)
			
			for _, a := range articles {
				out = append(out, fmt.Sprintf(
					"| %s | [%s](%s) | %s |",
					a.Front.Date.Format("2006-01-02"),
					a.Front.Title,
					a.Path,
					a.Front.Description,
				))
			}
		}

		err := os.WriteFile(
			filepath.Join(base, lang, "index.md"),
			[]byte(strings.Join(out, "\n")),
			0644,
		)
		if err != nil {
			panic(err)
		}
	}
}

