package main

import (
	"fmt"
	"html"
	"math"
	"os"
	"path"
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
	Block       int       `yaml:"block"`
}

type Article struct {
	Lang        string
	Path        string
	Front       FrontMatter
	ReadMinutes int
}

type SiteConfig struct {
	SiteName        string `yaml:"site_name"`
	SiteDescription string `yaml:"site_description"`
	SiteURL         string `yaml:"site_url"`
}

func parseFile(path string) (*FrontMatter, string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, "", err
	}

	parts := strings.SplitN(string(data), "---", 3)
	if len(parts) < 3 {
		return nil, "", fmt.Errorf("no front matter in %s", path)
	}

	var fm FrontMatter
	if err := yaml.Unmarshal([]byte(parts[1]), &fm); err != nil {
		return nil, "", err
	}

	return &fm, parts[2], nil
}

func readSiteConfig(path string) SiteConfig {
	data, err := os.ReadFile(path)
	if err != nil {
		return SiteConfig{}
	}

	var cfg SiteConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return SiteConfig{}
	}
	return cfg
}

func ensureTrailingSlash(value string) string {
	if value == "" {
		return ""
	}
	if strings.HasSuffix(value, "/") {
		return value
	}
	return value + "/"
}

func estimateReadMinutes(content string) int {
	words := len(strings.Fields(content))
	if words == 0 {
		return 1
	}
	minutes := int(math.Ceil(float64(words) / 220.0))
	if minutes < 1 {
		return 1
	}
	return minutes
}

func readLabel(lang string, minutes int) string {
	if lang == "ru" {
		if minutes >= 20 {
			return "20+ мин чтения"
		}
		return fmt.Sprintf("%d мин чтения", minutes)
	}
	if minutes >= 20 {
		return "20+ min read"
	}
	if minutes == 1 {
		return "1 min read"
	}
	return fmt.Sprintf("%d min read", minutes)
}

func ctaLabel(lang string) string {
	if lang == "ru" {
		return "Читать ->"
	}
	return "Read ->"
}

func renderTags(tags []string) string {
	if len(tags) == 0 {
		return ""
	}

	var parts []string
	for _, tag := range tags {
		parts = append(parts, fmt.Sprintf("<span class=\"tag\">%s</span>", html.EscapeString(tag)))
	}
	return fmt.Sprintf("<div class=\"post-tags\">%s</div>", strings.Join(parts, ""))
}

func renderCard(a Article, prefix string) []string {
	meta := ""
	if a.Front.Block > 0 {
		if a.Lang == "ru" {
			meta = fmt.Sprintf("Блок %d · %s", a.Front.Block, readLabel(a.Lang, a.ReadMinutes))
		} else {
			meta = fmt.Sprintf("Block %d · %s", a.Front.Block, readLabel(a.Lang, a.ReadMinutes))
		}
	} else if !a.Front.Date.IsZero() {
		meta = fmt.Sprintf("%s · %s", a.Front.Date.Format("2006-01-02"), readLabel(a.Lang, a.ReadMinutes))
	} else {
		meta = readLabel(a.Lang, a.ReadMinutes)
	}
	title := html.EscapeString(a.Front.Title)
	description := html.EscapeString(a.Front.Description)
	tags := renderTags(a.Front.Tags)
	cta := ctaLabel(a.Lang)
	link := path.Join(prefix, a.Path)
	link = strings.TrimSuffix(link, ".md") + ".html"

	out := []string{
		"  <article class=\"post-card\">",
		fmt.Sprintf("    <div class=\"post-meta\">%s</div>", meta),
		fmt.Sprintf("    <h3><a href=\"%s\">%s</a></h3>", link, title),
	}

	if description != "" {
		out = append(out, fmt.Sprintf("    <p class=\"post-desc\">%s</p>", description))
	}

	if tags != "" {
		out = append(out, fmt.Sprintf("    %s", tags))
	}

	out = append(out, fmt.Sprintf("    <a class=\"post-link\" href=\"%s\">%s</a>", link, cta))
	out = append(out, "  </article>")

	return out
}

func renderIndex(lang string, articles []Article) []string {
	var out []string

	if lang == "ru" {
		out = append(out,
			"---",
			"title: Блог",
			"robots: noindex, nofollow",
			"hide:",
			"  - toc",
			"---",
			"",
			"# Блог",
			"",
			"Русские лонгриды о производительности, наблюдаемости и надежности.",
			"",
		)
	} else {
		out = append(out,
			"---",
			"title: Blog",
			"robots: noindex, nofollow",
			"hide:",
			"  - toc",
			"---",
			"",
			"# Blog",
			"",
			"Longreads in English on performance, observability, and reliability engineering.",
			"",
		)
	}

	out = append(out, "<div class=\"post-grid\">")

	if len(articles) == 0 {
		if lang == "ru" {
			out = append(out, "  <p class=\"post-desc\">Статьи скоро появятся.</p>")
		} else {
			out = append(out, "  <p class=\"post-desc\">Articles coming soon.</p>")
		}
	} else {
		for _, article := range articles {
			out = append(out, renderCard(article, "")...)
		}
	}

	out = append(out, "</div>")
	return out
}

func renderLatest(lang string, articles []Article) []string {
	var out []string

	headerTitle := "Latest posts"
	if lang == "ru" {
		headerTitle = "Свежие записи"
	}

	out = append(out, "<div class=\"post-slider\">")
	out = append(out, "  <div class=\"post-slider__header\">")
	out = append(out, fmt.Sprintf("    <h3>%s</h3>", headerTitle))
	out = append(out, "    <div class=\"post-slider__controls\">")
	out = append(out, "      <button class=\"slider-btn\" aria-label=\"Previous\" data-post-slider-prev disabled>")
	out = append(out, "        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z\"/></svg>")
	out = append(out, "      </button>")
	out = append(out, "      <button class=\"slider-btn\" aria-label=\"Next\" data-post-slider-next>")
	out = append(out, "        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z\"/></svg>")
	out = append(out, "      </button>")
	out = append(out, "    </div>")
	out = append(out, "  </div>")
	out = append(out, "")
	out = append(out, "  <div class=\"post-grid post-grid--slider\">")

	if len(articles) == 0 {
		if lang == "ru" {
			out = append(out, "    <p class=\"post-desc\">Статьи скоро появятся.</p>")
		} else {
			out = append(out, "    <p class=\"post-desc\">Articles coming soon.</p>")
		}
	} else {
		limit := 5
		if len(articles) < limit {
			limit = len(articles)
		}
		for _, article := range articles[:limit] {
			out = append(out, renderCard(article, latestPrefix(lang))...)
		}
	}

	out = append(out, "  </div>")
	out = append(out, "</div>")

	return out
}

func latestPrefix(lang string) string {
	// Default language (en) is built into the site root, not /en/.
	// Russian is built into /ru/.
	if lang == "ru" {
		return ""
	}
	return ""
}

func langPrefix(lang string) string {
	if lang == "ru" {
		return "../"
	}
	return "en/"
}

func rssFileName(lang string) string {
	if lang == "ru" {
		return "rss-ru.xml"
	}
	return "rss.xml"
}

func rssChannelTitle(cfg SiteConfig, lang string) string {
	title := cfg.SiteName
	if title == "" {
		title = "The Last of 9s"
	}
	if lang == "ru" {
		return fmt.Sprintf("%s (RU)", title)
	}
	return title
}

func rssChannelLink(cfg SiteConfig, lang string) string {
	base := ensureTrailingSlash(cfg.SiteURL)
	if base == "" {
		return ""
	}
	if lang == "ru" {
		return base + "ru/index.html"
	}
	return base + "index.html"
}

func rssArticleURL(cfg SiteConfig, a Article) string {
	base := ensureTrailingSlash(cfg.SiteURL)
	prefix := ""
	if a.Lang == "ru" {
		prefix = "ru/"
	}
	return base + prefix + strings.TrimSuffix(a.Path, ".md") + ".html"
}

func renderRSS(cfg SiteConfig, lang string, articles []Article) []string {
	title := rssChannelTitle(cfg, lang)
	description := cfg.SiteDescription
	link := rssChannelLink(cfg, lang)

	out := []string{
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
		"<rss version=\"2.0\">",
		"<channel>",
		fmt.Sprintf("<title>%s</title>", html.EscapeString(title)),
	}

	if link != "" {
		out = append(out, fmt.Sprintf("<link>%s</link>", html.EscapeString(link)))
	}
	if description != "" {
		out = append(out, fmt.Sprintf("<description>%s</description>", html.EscapeString(description)))
	}
	out = append(out, fmt.Sprintf("<language>%s</language>", lang))

	limit := 30
	if len(articles) < limit {
		limit = len(articles)
	}
	for _, article := range articles[:limit] {
		itemTitle := html.EscapeString(article.Front.Title)
		itemDesc := html.EscapeString(article.Front.Description)
		itemLink := rssArticleURL(cfg, article)
		itemDate := article.Front.Date.Format(time.RFC1123Z)

		out = append(out, "<item>")
		out = append(out, fmt.Sprintf("<title>%s</title>", itemTitle))
		if itemLink != "" {
			out = append(out, fmt.Sprintf("<link>%s</link>", html.EscapeString(itemLink)))
			out = append(out, fmt.Sprintf("<guid isPermaLink=\"true\">%s</guid>", html.EscapeString(itemLink)))
		}
		if itemDate != "" {
			out = append(out, fmt.Sprintf("<pubDate>%s</pubDate>", itemDate))
		}
		if itemDesc != "" {
			out = append(out, fmt.Sprintf("<description>%s</description>", itemDesc))
		}
		out = append(out, "</item>")
	}

	out = append(out, "</channel>", "</rss>")
	return out
}

func main() {
	base := "../../docs"
	langs := []string{"ru", "en"}
	includesDir := filepath.Join(base, "_includes")
	_ = os.MkdirAll(includesDir, 0755)
	siteCfg := readSiteConfig("../../mkdocs.yml")

	// Собираем статьи по языкам
	articlesByLang := make(map[string][]Article)

	for _, lang := range langs {
		root := filepath.Join(base, lang)
		_ = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() || !strings.HasSuffix(path, ".md") {
				return nil
			}
			// Skip generated and navigation pages (non-articles).
			if info.Name() == "index.md" || info.Name() == "blog.md" || info.Name() == "home.md" {
				return nil
			}

			fm, body, err := parseFile(path)
			if err != nil {
				return nil
			}
			// Include any markdown page with front matter, except explicit non-articles above.
			// Ordering is handled later (block -> date -> stable by path).

			// Относительный путь от языковой директории
			relPath := strings.TrimPrefix(path, filepath.Join(base, lang)+"/")

			articlesByLang[lang] = append(articlesByLang[lang], Article{
				Lang:        lang,
				Path:        relPath,
				Front:       *fm,
				ReadMinutes: estimateReadMinutes(body),
			})
			return nil
		})
	}

	// Генерируем blog.md (листинг статей) для каждого языка.
	for _, lang := range langs {
		articles := articlesByLang[lang]

		// Сортируем: сначала по block (если задан), иначе по date, иначе стабильно по пути.
		sort.Slice(articles, func(i, j int) bool {
			ai, aj := articles[i], articles[j]
			if ai.Front.Block > 0 || aj.Front.Block > 0 {
				// Blocked posts go first, ordered ascending.
				if ai.Front.Block == 0 {
					return false
				}
				if aj.Front.Block == 0 {
					return true
				}
				if ai.Front.Block != aj.Front.Block {
					return ai.Front.Block < aj.Front.Block
				}
				// Tie-breaker: stable by path
				return ai.Path < aj.Path
			}
			if !ai.Front.Date.IsZero() || !aj.Front.Date.IsZero() {
				return ai.Front.Date.After(aj.Front.Date)
			}
			return ai.Path < aj.Path
		})

		out := renderIndex(lang, articles)

		err := os.WriteFile(
			filepath.Join(base, lang, "blog.md"),
			[]byte(strings.Join(out, "\n")),
			0644,
		)
		if err != nil {
			panic(err)
		}

		latest := renderLatest(lang, articles)
		latestPath := filepath.Join(includesDir, fmt.Sprintf("latest-%s.md", lang))
		err = os.WriteFile(latestPath, []byte(strings.Join(latest, "\n")), 0644)
		if err != nil {
			panic(err)
		}

		// RSS disabled (the project doesn't publish feeds for now).
		_ = siteCfg
	}
}
