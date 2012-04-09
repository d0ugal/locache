.PHONY : clean build-min docs

VERSION = $(shell cat version.txt)

build: | clean build-min docs

build-min:
	@echo "Creating minified version."
	@mkdir -p ./build
	@echo "Marking version ${VERSION}"
	@cat locache.js | sed 's/VERSION-PLACEHOLDER/${VERSION}/' > ./build/locache.js
	@jsmin < ./build/locache.js > ./build/locache.min.js

docs:
	@echo "Creating docs"
	@docco ./build/locache.js

clean:
	@rm -rf ./build