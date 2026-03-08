all: build

build:
	npx tsc -p tsconfig.json

eslint:
	npx eslint src test 

fix:
	npx eslint src test --fix

test:
	NODE_OPTIONS="$$NODE_OPTIONS --experimental-vm-modules" npx jest -c jest.config.ts --coverage

run:
	node dist/src/visualizer.js

watch:
	npx tsc -w -p tsconfig.json

clean:
	rm -f *~ src/*~ src/*/*~ test/*~ html/*~
	rm -rf dist/*

.PHONY: archive build clean eslint parcel test run watch
