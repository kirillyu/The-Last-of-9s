.PHONY: all generate build build-fast serve serve-dev clean new smoke

PYTHON ?= python3
VENV_PYTHON := ./venv/bin/python

ifneq ("$(wildcard $(VENV_PYTHON))","")
PYTHON := $(VENV_PYTHON)
endif

MKDOCS := $(PYTHON) -m mkdocs

all: build

generate:
	cd tools/indexgen && go run main.go

build: generate
	$(MKDOCS) build
	@# Material pages in /ru/ may request /ru/sitemap.xml; provide a copy to avoid 404 spam.
	@if [ -f site/sitemap.xml ]; then mkdir -p site/ru && cp -f site/sitemap.xml site/ru/sitemap.xml; fi

build-fast: generate
	$(MKDOCS) build --dirty

PORT ?= 8001
BASE_PATH ?= The-Last-of-9s

serve: build
	@set -e; \
	site_dir="site"; \
	if [ ! -d "$$site_dir" ]; then \
		echo "Missing $$site_dir. Run 'make build' first."; \
		exit 1; \
	fi; \
	tmp_dir=$$(mktemp -d); \
	ln -s "$$PWD/$$site_dir" "$$tmp_dir/$(BASE_PATH)"; \
	echo "Serving http://127.0.0.1:$(PORT)/$(BASE_PATH)/index.html"; \
	trap 'rm -rf "$$tmp_dir"' EXIT; \
	$(PYTHON) -m http.server --directory "$$tmp_dir" $(PORT)

serve-dev: generate
	$(MKDOCS) serve

smoke:
	@set -e; \
	site_dir="site"; \
	if [ ! -d "$$site_dir" ]; then \
		echo "Missing $$site_dir. Run 'make build' first."; \
		exit 1; \
	fi; \
	tmp_dir=$$(mktemp -d); \
	ln -s "$$PWD/$$site_dir" "$$tmp_dir/The-Last-of-9s"; \
	$(PYTHON) -m http.server --directory "$$tmp_dir" 8000 >/dev/null 2>&1 & \
	server_pid=$$!; \
	trap 'kill $$server_pid >/dev/null 2>&1 || true; rm -rf "$$tmp_dir"' EXIT; \
	base="http://127.0.0.1:8000/The-Last-of-9s"; \
	ready=""; \
	for i in 1 2 3 4 5; do \
		code=$$(curl -sS -o /dev/null -w "%{http_code}" "$$base/index.html" || true); \
		if [ "$$code" = "200" ]; then \
			ready="yes"; \
			break; \
		fi; \
		sleep 0.2; \
	done; \
	if [ -z "$$ready" ]; then \
		echo "Server did not start"; \
		exit 1; \
	fi; \
	check() { \
		url="$$1"; \
		code=$$(curl -sS -o /dev/null -w "%{http_code}" "$$url"); \
		if [ "$$code" != "200" ]; then \
			echo "FAIL $$code $$url"; \
			exit 1; \
		fi; \
		echo "OK   $$code $$url"; \
	}; \
	echo "Smoke checking $$base ..."; \
	check "$$base/index.html"; \
	check "$$base/ru/index.html"; \
	echo "All OK"

clean:
	rm -rf site

new:
	@set -e; \
	if [ -z "$(LANG)" ] || [ -z "$(TITLE)" ] || [ -z "$(SLUG)" ]; then \
		echo "Usage: make new LANG=en TITLE='Post title' SLUG=post-title"; \
		exit 1; \
	fi; \
	if [ "$(LANG)" != "en" ] && [ "$(LANG)" != "ru" ]; then \
		echo "LANG must be 'en' or 'ru'"; \
		exit 1; \
	fi; \
	date_stamp=$$(date +%Y-%m-%d); \
	dir="docs/$(LANG)"; \
	path="$$dir/$$date_stamp-$(SLUG).md"; \
	if [ ! -d "$$dir" ]; then \
		echo "Missing directory: $$dir"; \
		exit 1; \
	fi; \
	if [ -e "$$path" ]; then \
		echo "File already exists: $$path"; \
		exit 1; \
	fi; \
	title_escaped=$$(printf "%s" "$(TITLE)" | sed 's/"/\\"/g'); \
	printf -- "---\ntitle: \"%s\"\ndate: %s\ndescription: \"\"\ntags: []\n---\n\n# %s\n\n" "$$title_escaped" "$$date_stamp" "$$title_escaped" > "$$path"; \
	echo "Created $$path"
