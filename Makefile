.PHONY: clean test

test: staged
	mocha ./test/file.js --reporter spec
staged: 
	cp -R test/proof/* test/staging/	
	touch staged
clean:
	rm -rf test/staging/*
	rm staged
