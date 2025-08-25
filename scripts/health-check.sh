#!/bin/bash

# Health check script for Pokedex application

set -e

echo "🏥 Running health checks for Pokedex application..."

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    local max_attempts=5
    local attempt=1

    echo "🔍 Checking $service_name health..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            echo "✅ $service_name is healthy"
            return 0
        else
            echo "⏳ $service_name health check attempt $attempt/$max_attempts failed"
            sleep 2
            attempt=$((attempt + 1))
        fi
    done
    
    echo "❌ $service_name is unhealthy after $max_attempts attempts"
    return 1
}

# Check if Docker Compose is running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Docker Compose services are not running"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Set default ports
HTTP_PORT=${HTTP_PORT:-80}
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Check individual services
echo ""
echo "🔍 Checking individual services..."

# Check Nginx
check_service_health "Nginx" "http://localhost:$HTTP_PORT/health"

# Check Backend API
check_service_health "Backend API" "http://localhost:$BACKEND_PORT/api/health"

# Check Frontend (if running in development mode)
if [ "$NODE_ENV" != "production" ]; then
    check_service_health "Frontend" "http://localhost:$FRONTEND_PORT"
fi

# Check Redis
echo "🔍 Checking Redis..."
if docker-compose exec redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is unhealthy"
    exit 1
fi

# Check Docker container status
echo ""
echo "📊 Docker container status:"
docker-compose ps

# Check resource usage
echo ""
echo "💾 Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Check logs for errors (last 50 lines)
echo ""
echo "📝 Recent error logs:"
docker-compose logs --tail=50 | grep -i error || echo "No recent errors found"

echo ""
echo "🎉 Health check completed!"
echo ""
echo "📱 Application endpoints:"
echo "   Main application: http://localhost:$HTTP_PORT"
echo "   API health: http://localhost:$HTTP_PORT/api/health"
echo "   Nginx health: http://localhost:$HTTP_PORT/health"
echo ""