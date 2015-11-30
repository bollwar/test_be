test:
	@expresso -I lib --growl test/*.test.js

coverage:
	@expresso -I lib --cov test/*.test.js

lines:
	@ls -1 lib/* | xargs wc -l

docs:
	@dox --title io -r "http://github.com/chriso/io" lib/io.*.js > docs/index.html

.PHONY: test coverage lines docs
