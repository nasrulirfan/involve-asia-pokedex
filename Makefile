# Pokedex Application Makefile
# Provides convenient commands for Docker operations

.PHONY: help dev prod build up down restart logs health backup clean

# Default target
help: ## Show this help message
	@echo "Pokedex Application - Docker Management"
	@echo "======================================"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# Development commands
dev: ## Start development environment
	@echo "🚀 Starting development environment..."
	@./scripts/deploy-dev.sh

dev-build: ## Build and start development environment
	@echo "🔨 Building and starting development environment..."
	@docker-compose build --no-cache
	@docker-compose up -d

dev-logs: ## Show development logs
	@docker-compose logs -f

# Production commands
prod: ## Start production environment
	@echo "🚀 Starting production environment..."
	@./scripts/deploy-prod.sh

prod-build: ## Build and start production environment
	@echo "🔨 Building and starting production environment..."
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-logs: ## Show production logs
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# General Docker commands
build: ## Build all Docker images
	@echo "🔨 Building Docker images..."
	@docker-compose build

up: ## Start all services
	@echo "🏃 Starting services..."
	@docker-compose up -d

down: ## Stop all services
	@echo "🛑 Stopping services..."
	@docker-compose down

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	@docker-compose restart

stop: ## Stop all services without removing containers
	@echo "⏸️  Stopping services..."
	@docker-compose stop

start: ## Start stopped services
	@echo "▶️  Starting services..."
	@docker-compose start

# Service-specific commands
backend-shell: ## Access backend container shell
	@docker-compose exec backend bash

frontend-shell: ## Access frontend container shell
	@docker-compose exec frontend sh

redis-cli: ## Access Redis CLI
	@docker-compose exec redis redis-cli

nginx-shell: ## Access Nginx container shell
	@docker-compose exec nginx sh

# Logs and monitoring
logs: ## Show logs for all services
	@docker-compose logs -f

logs-backend: ## Show backend logs
	@docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	@docker-compose logs -f frontend

logs-redis: ## Show Redis logs
	@docker-compose logs -f redis

logs-nginx: ## Show Nginx logs
	@docker-compose logs -f nginx

status: ## Show service status
	@echo "📊 Service Status:"
	@docker-compose ps

health: ## Run health checks
	@echo "🏥 Running health checks..."
	@./scripts/health-check.sh

# Maintenance commands
backup: ## Create application backup
	@echo "💾 Creating backup..."
	@./scripts/backup.sh

clean: ## Clean up Docker resources
	@echo "🧹 Cleaning up Docker resources..."
	@docker-compose down -v
	@docker system prune -f
	@docker volume prune -f

clean-all: ## Clean up all Docker resources (including images)
	@echo "🧹 Cleaning up all Docker resources..."
	@docker-compose down -v
	@docker system prune -a -f
	@docker volume prune -f

# Laravel-specific commands
laravel-key: ## Generate Laravel application key
	@echo "🔑 Generating Laravel application key..."
	@docker-compose exec backend php artisan key:generate --force

laravel-cache: ## Clear and rebuild Laravel cache
	@echo "🗄️  Rebuilding Laravel cache..."
	@docker-compose exec backend php artisan config:cache
	@docker-compose exec backend php artisan route:cache
	@docker-compose exec backend php artisan view:cache

laravel-clear: ## Clear all Laravel caches
	@echo "🧹 Clearing Laravel caches..."
	@docker-compose exec backend php artisan cache:clear
	@docker-compose exec backend php artisan config:clear
	@docker-compose exec backend php artisan route:clear
	@docker-compose exec backend php artisan view:clear

# Database commands
db-migrate: ## Run Laravel migrations
	@echo "🗃️  Running database migrations..."
	@docker-compose exec backend php artisan migrate

db-seed: ## Seed the database
	@echo "🌱 Seeding database..."
	@docker-compose exec backend php artisan db:seed

db-fresh: ## Fresh database with migrations and seeding
	@echo "🔄 Creating fresh database..."
	@docker-compose exec backend php artisan migrate:fresh --seed



# Development utilities
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	@docker-compose exec backend composer install
	@docker-compose exec frontend npm install

update: ## Update dependencies
	@echo "🔄 Updating dependencies..."
	@docker-compose exec backend composer update
	@docker-compose exec frontend npm update

# Environment setup
setup-dev: ## Setup development environment
	@echo "⚙️  Setting up development environment..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "📝 Created .env file"; fi
	@make dev-build
	@make laravel-key
	@make laravel-cache
	@echo "✅ Development environment ready!"

setup-prod: ## Setup production environment
	@echo "⚙️  Setting up production environment..."
	@if [ ! -f .env ]; then cp .env.production .env; echo "📝 Created .env file from production template"; fi
	@make prod-build
	@make laravel-cache
	@echo "✅ Production environment ready!"

# SSL certificate management
ssl-generate: ## Generate self-signed SSL certificates
	@echo "🔒 Generating self-signed SSL certificates..."
	@mkdir -p nginx/ssl
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/key.pem \
		-out nginx/ssl/cert.pem \
		-subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
	@echo "✅ SSL certificates generated in nginx/ssl/"

# Performance and monitoring
stats: ## Show Docker resource usage
	@echo "📊 Docker Resource Usage:"
	@docker stats --no-stream

disk-usage: ## Show Docker disk usage
	@echo "💾 Docker Disk Usage:"
	@docker system df

# Quick commands for common workflows
quick-dev: setup-dev ## Quick development setup (alias for setup-dev)

quick-prod: setup-prod ## Quick production setup (alias for setup-prod)

reset: ## Reset everything (clean and rebuild)
	@echo "🔄 Resetting everything..."
	@make clean
	@make build
	@make up
	@make laravel-key
	@make laravel-cache
	@echo "✅ Reset complete!"

# Information commands
info: ## Show application information
	@echo "ℹ️  Pokedex Application Information"
	@echo "=================================="
	@echo ""
	@echo "🌐 URLs:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend API: http://localhost:8000"
	@echo "  Nginx Proxy: http://localhost"
	@echo "  HTTPS: https://localhost"
	@echo ""
	@echo "🔧 Services:"
	@make status
	@echo ""
	@echo "📊 Resource Usage:"
	@make stats

version: ## Show version information
	@echo "🏷️  Version Information"
	@echo "======================"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker-compose --version)"
	@echo ""
	@echo "Application Services:"
	@echo "- PHP: $$(docker-compose exec backend php --version | head -1)"
	@echo "- Node.js: $$(docker-compose exec frontend node --version)"
	@echo "- Redis: $$(docker-compose exec redis redis-server --version)"
	@echo "- Nginx: $$(docker-compose exec nginx nginx -v 2>&1)"