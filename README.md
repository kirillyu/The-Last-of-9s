# The Last of 9s

Hardcore инженерный блог про resiliency, SRE и наблюдаемость.

Сайт статический: `mkdocs-material`, немного своего CSS/JS, без фреймворков.

## Структура

```
.
├── mkdocs.yml            # Конфиг MkDocs
├── Makefile              # Команды сборки/проверок
├── docs/                 # Исходники контента
│   ├── en/               # Английские страницы/статьи (канон)
│   ├── ru/               # Русское зеркало
│   └── assets/           # Статика (стили, скрипты, изображения)
├── tools/
│   └── indexgen/         # Генератор индексов (Go)
├── overrides/            # Оверрайды шаблонов MkDocs
└── requirements.txt      # Python зависимости
```

## Локальный запуск

Требования: Python 3.x, Go, `make`.

Установка зависимостей:

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

Полезные команды:

```bash
# Сборка статики в ./site
make build

# Локальный preview прод-версии (base path как на GitHub Pages)
make serve

# Быстрая проверка ключевых страниц (EN/RU)
make smoke

# Новый пост (шаблон)
make new LANG=en TITLE="Post title" SLUG=post-title
```

## Контент

- Статьи: `docs/en/` и `docs/ru/`
- Ассеты: `docs/assets/`
- Картинки к серии (First Nine): `docs/assets/first-nine/`

## Примечания

- `site/` — артефакты сборки (не коммитятся).
- `dev/` — папка для внутренних заметок/процессов (не коммитится).
