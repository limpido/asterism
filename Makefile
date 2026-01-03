run-backend:
	cd backend && DB_PATH=../data/asterism.db go run cmd/api/main.go

run-frontend:
	cd frontend && npm run dev

# watch-server:
# 	cd server && air