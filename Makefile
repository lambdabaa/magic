export PATH := $(shell npm bin):$(PATH)

JS = $(shell find src/ -name "*.js")
BUILD = $(patsubst src/%.js, build/%.js, $(JS))

.PHONY: all
all: $(BUILD)

.PHONY: clean
clean:
	rm -rf build

build/%.js: src/%.js
	@mkdir -p "$(@D)"
	babel $< -o $@
