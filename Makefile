srcdir = lib/

modules =   ${srcdir}copyright.js\
			${srcdir}prefix.js\
			${srcdir}model.js\
			${srcdir}collection.js\
			${srcdir}sync.js\
			${srcdir}suffix.js

dist/backbone.iobind.js: ${modules}
	cat > $@ $^

serve:
	@node example/app.js

docs: clean-docs
	@./node_modules/.bin/codex build docs \
		--out docs/out
	@./node_modules/.bin/codex serve \
		--out docs/out --static /backbone.iobind

clean-docs:
	@rm -rf docs/out

test: all
	@./node_modules/.bin/mocha \
		--reporter spec

.PHONY: all serve clean-docs docs
