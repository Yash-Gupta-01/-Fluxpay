.PHONY: help build run test migrate-up migrate-down sqlc clean docker-up docker-down load-test load-report

help:
	@echo "Fluxpay Go Backend - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make run            - Run with hot reload (air)"
	@echo "  make build          - Build the binary"
	@echo "  make test           - Run tests"
	@echo "  make test-verbose   - Run tests with verbose output"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo ""
	@echo "Database:"
	@echo "  make migrate-up     - Run all pending migrations"
	@echo "  make migrate-down   - Rollback the last migration"
	@echo "  make migrate-force  - Force migration to a specific version"
	@echo "  make sqlc           - Generate sqlc Go code from SQL queries"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      - Start all services (docker-compose)"
	@echo "  make docker-down    - Stop all services"
	@echo "  make docker-logs    - View logs from all services"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          - Clean build artifacts and temp files"
	@echo "  make fmt            - Format code with gofmt"
	@echo "  make lint           - Run golangci-lint"
	@echo "  make load-test      - Run Artillery load test and save JSON output"
	@echo "  make load-report    - Generate HTML report from load test output"

# Go build and run
build:
	go build -o bin/fluxpay-go ./cmd/server

run:
	@which air > /dev/null || (echo "Installing air..." && go install github.com/cosmtrek/air@latest)
	air

run-prod: build
	./bin/fluxpay-go

# Testing
test:
	go test ./...

test-verbose:
	go test -v ./...

test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Database
migrate-up:
	@which migrate > /dev/null || (echo "Installing golang-migrate..." && go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest)
	migrate -path internal/db/migrations -database "postgres://postgres:password@localhost:5432/fluxpay?sslmode=disable" up

migrate-down:
	@which migrate > /dev/null || (echo "Installing golang-migrate..." && go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest)
	migrate -path internal/db/migrations -database "postgres://postgres:password@localhost:5432/fluxpay?sslmode=disable" down

migrate-force:
	@which migrate > /dev/null || (echo "Installing golang-migrate..." && go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest)
	@read -p "Enter version number: " version; \
	migrate -path internal/db/migrations -database "postgres://postgres:password@localhost:5432/fluxpay?sslmode=disable" force $$version

# Code generation
sqlc:
	@which sqlc > /dev/null || (echo "Installing sqlc..." && go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest)
	sqlc generate

# Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-build:
	docker-compose build

# Code formatting and linting
fmt:
	gofmt -s -w .

lint:
	@which golangci-lint > /dev/null || (echo "Installing golangci-lint..." && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
	golangci-lint run ./...

# Load testing
load-test:
	npx artillery run load-tests/artillery-config.yml --output artillery-report.json

load-report:
	npx artillery report artillery-report.json --output artillery-report.html

# Clean
clean:
	rm -f bin/fluxpay-go
	rm -f coverage.out coverage.html
	go clean -testcache

# Install dependencies
deps:
	go mod download
	go mod tidy

# Development setup
setup: deps
	@echo "Installing tools..."
	go install github.com/cosmtrek/air@latest
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "Setup complete! Run 'make docker-up' to start services, then 'make run' to start the server."
