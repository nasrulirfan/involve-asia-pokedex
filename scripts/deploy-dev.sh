#!/bin/bash

# Development deployment script for Pokedex application

set -e

echo "🚀 Starting development deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration before running again."
    exit 1
fi

# Load environment variables
source .env

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🏃 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=300
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        echo "✅ Services are healthy!"
        break
    fi
    
    if [ $counter -eq $timeout ]; then
        echo "❌ Services failed to become healthy within $timeout seconds"
        docker-compose logs
        exit 1
    fi
    
    echo "⏳ Waiting for services... ($counter/$timeout)"
    sleep 5
    counter=$((counter + 5))
done

# Run Laravel setup commands
echo "🔧 Setting up Laravel backend..."
docker-compose exec backend php artisan key:generate --force
docker-compose exec backend php artisan config:cache
docker-compose exec backend php artisan route:cache

# Show service status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 Development deployment completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "   Backend API: http://localhost:${BACKEND_PORT:-8000}"
echo "   Nginx Proxy: http://localhost:${HTTP_PORT:-80}"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo ""