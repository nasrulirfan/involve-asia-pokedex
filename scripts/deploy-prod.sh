#!/bin/bash

# Production deployment script for Pokedex application

set -e

echo "🚀 Starting production deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if production environment file exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found. Please create it with production configuration."
    exit 1
fi

# Copy production environment
echo "📝 Using production environment configuration..."
cp .env.production .env

# Load environment variables
source .env

# Validate required production variables
required_vars=("APP_KEY" "REDIS_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set in .env.production"
        exit 1
    fi
done

# Build production images
echo "🔨 Building production Docker images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Start production services
echo "🏃 Starting production services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=300
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps | grep -q "healthy"; then
        echo "✅ Services are healthy!"
        break
    fi
    
    if [ $counter -eq $timeout ]; then
        echo "❌ Services failed to become healthy within $timeout seconds"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs
        exit 1
    fi
    
    echo "⏳ Waiting for services... ($counter/$timeout)"
    sleep 5
    counter=$((counter + 5))
done

# Run Laravel production setup
echo "🔧 Setting up Laravel for production..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend php artisan config:cache
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend php artisan route:cache
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend php artisan view:cache

# Clean up unused Docker resources
echo "🧹 Cleaning up unused Docker resources..."
docker system prune -f

# Show service status
echo "📊 Service Status:"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo "🎉 Production deployment completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "   HTTPS: https://localhost:${HTTPS_PORT:-443}"
echo "   HTTP: http://localhost:${HTTP_PORT:-80} (redirects to HTTPS)"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart"
echo ""
echo "⚠️  Important production notes:"
echo "   - Update SSL certificates in nginx/ssl/ directory"
echo "   - Configure proper domain name in nginx configuration"
echo "   - Set up proper backup strategy for Redis data"
echo "   - Monitor application logs and performance"
echo ""