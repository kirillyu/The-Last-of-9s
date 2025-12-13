.PHONY: all generate build serve clean

all: build

generate:
	cd tools/indexgen && go run main.go

build: generate
	mkdocs build

serve: generate
	mkdocs serve

clean:
	rm -rf site

