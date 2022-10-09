compile: 
	wasm-pack build --target web

dev:
	cd www
	npm run build
	npm run dev