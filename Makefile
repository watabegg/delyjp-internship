up:
	@docker-compose -f docker-compose.yml up --build -d
	@cd ./web
	@npm install
	@npm run dev