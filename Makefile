.PHONY : clean build-min docs

VERSION = $(shell cat version.txt)
BRANCH = $(shell git branch | grep \* | cut -d' ' -f 2)
build: | build-min docs

build-min:
	@echo "Creating minified version."
	@mkdir -p ./build
	@echo "Marking version ${VERSION}"
	@cat locache.js | sed 's/VERSION-PLACEHOLDER/${VERSION}/' > ./build/locache.${VERSION}.js
	@closure-compiler < ./build/locache.${VERSION}.js > ./build/locache.${VERSION}.min.js
	@cp ./build/locache.${VERSION}.js ./build/locache.js
	@cp ./build/locache.${VERSION}.min.js ./build/locache.min.js

docs:
	@echo "Creating docs"
	@docco ./build/locache.${VERSION}.js
	@cp -f ./docs/locache.${VERSION}.html ./docs/locache.html

update-page:
	@echo "Updating GitHub projct page";
	@git checkout gh-pages;
	@echo "Swiched to branch from ${BRANCH}, merging master";
	@git merge master;
	@git push origin gh-pages;
	@echo "Updated. Switching back to ${BRANCH}";
	@git checkout ${BRANCH};
