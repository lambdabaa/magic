export PATH := $(shell npm bin):$(PATH)

CSS = $(shell find style/ -name "*.css")
JS = $(shell find src/ -name "*.js")
BUILD = $(patsubst src/%.js, build/%.js, $(JS))

.PHONY: all
all: $(BUILD) app.js app.css

app.js: $(BUILD)
	browserify build/web/main.js -o $@

app.css: $(CSS)
	cat $^ > $@

.PHONY: clean
clean:
	rm -rf build app.js app.css

build/%.js: src/%.js
	@mkdir -p "$(@D)"
	babel $< -o $@
