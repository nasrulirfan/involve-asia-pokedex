# Docker Configuration Guide

This document provides detailed information about the Docker configuration for the Pokedex application.

## Architecture Overview

The application uses a multi-container Docker setup with the following services:

```
┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Next.js       │
│   (Port 80/443) │◄──►│   Frontend      │
└─────────────────┘    │   (Port 3000)   │
         │              └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Laravel       │    │   Redis Cache   │
│   Backend       │◄──►│   (Port 6379)   │
│   (Port 8000)   │    └─────────────────┘
└─────────────────┘
```

## Service Details

### 1. Backend Service (Laravel)

**Image:** Custom PHP 8.2 Alpine-based image
**Purpose:** Laravel API backend with PokeAPI integration

#### Dockerfile Features:
- Multi-stage build (development/production)
- PHP 8.2 with required extensions
- Composer for dependency management
- Non-root user for security
- Health checks
- Supervisor for production process management

#### Key Extensions:
- `pdo_mysql` - Database connectivity
- `redis` - Cache integration
- `gd` - Image processing
- `zip` - Archive handling
- `bcmath` - Precision mathematics

#### Environment Variables:
```bash
APP_ENV=local|production
APP_DEBUG=true|false
APP_KEY=base64:...
CACHE_DRIVER=redis
REDIS_HOST=redis
REDIS_PASSWORD=...
```

### 2. Frontend Service (Next.js)

**Image:** Node.js 18 Alpine-based image
**Purpose:** Next.js React frontend application

#### Dockerfile Features:
- Multi-stage build for optimization
- Development and production targets
- Non-root user (nextjs:nodejs)
- Optimized for Next.js standalone output
- Health checks
- Telemetry disabled

#### Build Stages:
1. **deps** - Install production dependencies
2. **development** - Development environment with hot reload
3. **builder** - Build the application
4. **production** - Optimized production runtime

#### Environment Variables:
```bash
NODE_ENV=development|production
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_TELEMETRY_DISABLED=1
```

### 3. Redis Service

**Image:** Redis 7 Alpine
**Purpose:** Caching layer for API responses and sessions

#### Configuration:
- Persistent storage with AOF
- Password authentication
- Memory optimization (LRU eviction)
- Health checks

#### Production Settings:
```bash
--maxmemory 128mb
--maxmemory-policy allkeys-lru
--save 900 1
--save 300 10
--save 60 10000
```

### 4. Nginx Service

**Image:** Nginx Alpine with custom configuration
**Purpose:** Reverse proxy, SSL termination, static file serving

#### Features:
- HTTP/2 support
- SSL/TLS termination
- Gzip compression
- Security headers
- Rate limiting
- Health checks
- WebSocket support for development

#### Security Headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HTTPS only)
- `Content-Security-Policy`

## Docker Compose Configuration

### Base Configuration (docker-compose.yml)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      target: ${BUILD_TARGET:-development}
    restart: unless-stopped
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      target: ${NODE_ENV:-development}
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 3s
      retries: 5

  nginx:
    build:
      context: ./nginx
    restart: unless-stopped
    ports:
      - "${HTTP_PORT:-80}:80"
      - "${HTTPS_PORT:-443}:443"
    depends_on:
      backend:
        condition: service_healthy
      frontend:
        condition: service_healthy
```

### Development Overrides (docker-compose.override.yml)

```yaml
version: '3.8'

services:
  backend:
    ports:
      - "${BACKEND_PORT:-8000}:8000"
    volumes:
      - ./backend:/var/www
      - backend_vendor:/var/www/vendor

  frontend:
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules

  redis:
    ports:
      - "${REDIS_PORT:-6379}:6379"
```

### Production Overrides (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  backend:
    build:
      target: production
    volumes:
      - ./backend/storage:/var/www/storage
    deploy:
      resources:
        limits:
          memory: 512M

  frontend:
    build:
      target: production
    volumes: []
    deploy:
      resources:
        limits:
          memory: 256M

  redis:
    ports: []  # No external port exposure
    deploy:
      resources:
        limits:
          memory: 256M
```

## Networking

### Network Configuration

```yaml
networks:
  pokedex_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Service Communication

| From | To | Port | Purpose |
|------|----|----- |---------|
| Nginx | Frontend | 3000 | Proxy web requests |
| Nginx | Backend | 8000 | Proxy API requests |
| Backend | Redis | 6379 | Cache operations |
| Frontend | Backend | 8000 | API calls (dev only) |

### Port Mapping

| Service | Internal Port | External Port (Dev) | External Port (Prod) |
|---------|---------------|---------------------|----------------------|
| Nginx | 80, 443 | 80, 443 | 80, 443 |
| Backend | 8000 | 8000 | - |
| Frontend | 3000 | 3000 | - |
| Redis | 6379 | 6379 | - |

## Volume Management

### Named Volumes

```yaml
volumes:
  redis_data:          # Redis persistent data
  backend_vendor:      # Composer dependencies
  frontend_node_modules: # NPM dependencies
  frontend_next:       # Next.js build cache
  nginx_logs:          # Nginx access/error logs
```

### Volume Purposes

1. **redis_data**: Persists Redis data across container restarts
2. **backend_vendor**: Caches Composer dependencies for faster builds
3. **frontend_node_modules**: Caches NPM dependencies
4. **frontend_next**: Caches Next.js build artifacts
5. **nginx_logs**: Stores Nginx logs for analysis

## Health Checks

### Backend Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1
```

### Frontend Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1
```

### Redis Health Check

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
  interval: 30s
  timeout: 3s
  retries: 5
  start_period: 30s
```

### Nginx Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1
```

## Security Features

### Container Security

1. **Non-root users**: All services run as non-root users
2. **Minimal base images**: Alpine Linux for smaller attack surface
3. **Read-only filesystems**: Where possible
4. **Resource limits**: Memory and CPU constraints
5. **Network isolation**: Services communicate only as needed

### Image Security

1. **Multi-stage builds**: Reduce final image size
2. **Dependency scanning**: Regular security updates
3. **Minimal packages**: Only install required packages
4. **Security patches**: Regular base image updates

### Runtime Security

1. **Health checks**: Automatic failure detection
2. **Restart policies**: Automatic recovery
3. **Log monitoring**: Security event tracking
4. **Access controls**: Network and file permissions

## Performance Optimization

### Build Optimization

1. **Layer caching**: Optimize Dockerfile layer order
2. **Multi-stage builds**: Separate build and runtime environments
3. **Dependency caching**: Cache package installations
4. **Build contexts**: Minimize build context size

### Runtime Optimization

1. **Resource limits**: Prevent resource exhaustion
2. **Connection pooling**: Efficient database connections
3. **Caching strategies**: Redis for API responses
4. **Compression**: Gzip for static assets

### Development Optimization

1. **Volume mounts**: Live code reloading
2. **Hot reload**: Automatic browser refresh
3. **Parallel builds**: Build services concurrently
4. **Incremental builds**: Only rebuild changed layers

## Monitoring and Logging

### Log Configuration

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Log Locations

| Service | Log Location | Purpose |
|---------|--------------|---------|
| Backend | `/var/www/storage/logs/laravel.log` | Application logs |
| Frontend | Container stdout | Next.js logs |
| Redis | Container stdout | Redis operations |
| Nginx | `/var/log/nginx/` | Access/error logs |

### Monitoring Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Monitor resource usage
docker stats

# Check container health
docker-compose ps
```

## Troubleshooting

### Common Issues

1. **Build failures**: Check Dockerfile syntax and dependencies
2. **Port conflicts**: Verify port availability
3. **Permission issues**: Check file ownership and permissions
4. **Memory issues**: Monitor resource usage
5. **Network issues**: Verify service connectivity

### Debug Commands

```bash
# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# Check container logs
docker-compose logs --tail=100 backend

# Inspect container configuration
docker inspect $(docker-compose ps -q backend)

# Test network connectivity
docker-compose exec backend ping frontend
```

### Performance Issues

```bash
# Monitor resource usage
docker stats --no-stream

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -f
```

## Best Practices

### Development

1. Use volume mounts for live code editing
2. Enable debug mode for detailed error messages
3. Expose service ports for direct access
4. Use development-specific configurations

### Production

1. Use multi-stage builds for optimized images
2. Implement proper health checks
3. Set resource limits
4. Use secrets management
5. Enable SSL/TLS
6. Monitor logs and metrics
7. Implement backup strategies

### Security

1. Run containers as non-root users
2. Use minimal base images
3. Regularly update dependencies
4. Implement network segmentation
5. Use secrets for sensitive data
6. Enable security scanning
7. Monitor for vulnerabilities

### Maintenance

1. Regular image updates
2. Log rotation and cleanup
3. Volume backup strategies
4. Performance monitoring
5. Security audits
6. Documentation updates

---

This Docker configuration provides a robust, scalable, and secure foundation for the Pokedex application, suitable for both development and production environments.