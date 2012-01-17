.PHONY: clean

test: staged
	node ./test/file.js
staged: 
	cp -R test/proof/* test/staging/	
	touch staged
clean:
	rm -rf test/staging/*
	rm staged
