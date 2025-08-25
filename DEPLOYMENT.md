# Pokedex Application Deployment Guide

This guide provides comprehensive instructions for deploying the Pokedex application in both development and production environments using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [SSL Configuration](#ssl-configuration)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Backup and Restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- At least 2GB of available RAM
- At least 5GB of available disk space

### System Requirements

| Component | Development | Production |
|-----------|-------------|------------|
| CPU | 2 cores | 4+ cores |
| RAM | 2GB | 4GB+ |
| Disk | 5GB | 10GB+ |
| Network | Any | HTTPS capable |

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd pokedex-app
   ```

2. **Run development deployment:**
   ```bash
   ./scripts/deploy-dev.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - Nginx Proxy: http://localhost

## Development Deployment

### Automatic Deployment

Use the provided script for easy development setup:

```bash
./scripts/deploy-dev.sh
```

### Manual Deployment

1. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Build and start services:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. **Initialize Laravel:**
   ```bash
   docker-compose exec backend php artisan key:generate
   docker-compose exec backend php artisan config:cache
   ```

### Development Features

- **Hot Reload**: Frontend and backend support hot reloading
- **Debug Mode**: Detailed error messages and logging
- **Port Exposure**: All services expose their ports for direct access
- **Volume Mounts**: Source code is mounted for live editing

## Production Deployment

### Automatic Deployment

1. **Configure production environment:**
   ```bash
   cp .env.production .env.production
   # Edit .env.production with your production settings
   ```

2. **Run production deployment:**
   ```bash
   ./scripts/deploy-prod.sh
   ```

### Manual Production Deployment

1. **Prepare production environment:**
   ```bash
   cp .env.production .env
   ```

2. **Deploy with production overrides:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **Optimize Laravel for production:**
   ```bash
   docker-compose exec backend php artisan config:cache
   docker-compose exec backend php artisan route:cache
   docker-compose exec backend php artisan view:cache
   ```

### Production Features

- **Optimized Images**: Multi-stage builds for smaller images
- **Security**: Non-root users, minimal attack surface
- **Performance**: Optimized configurations and caching
- **Resource Limits**: Memory and CPU limits for stability
- **Health Checks**: Automatic health monitoring
- **SSL/TLS**: HTTPS encryption support

## Environment Configuration

### Development Environment (.env)

```bash
# Application
APP_ENV=local
APP_DEBUG=true
NODE_ENV=development

# URLs
APP_URL=http://localhost
NEXT_PUBLIC_API_URL=http://localhost/api

# Ports
HTTP_PORT=80
HTTPS_PORT=443
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Security
REDIS_PASSWORD=pokedex_redis_pass
```

### Production Environment (.env.production)

```bash
# Application
APP_ENV=production
APP_DEBUG=false
NODE_ENV=production

# URLs (update with your domain)
APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Security (use strong passwords)
REDIS_PASSWORD=your-secure-redis-password
APP_KEY=base64:your-production-app-key

# Performance
LOG_LEVEL=warning
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

## SSL Configuration

### Development SSL

The application automatically generates self-signed certificates for development:

```bash
# Certificates are created automatically in nginx/ssl/
# - cert.pem (certificate)
# - key.pem (private key)
```

### Production SSL

For production, replace the self-signed certificates with proper SSL certificates:

1. **Using Let's Encrypt:**
   ```bash
   # Install certbot
   sudo apt-get install certbot

   # Generate certificates
   sudo certbot certonly --standalone -d your-domain.com

   # Copy certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

2. **Using custom certificates:**
   ```bash
   # Copy your certificates to nginx/ssl/
   cp your-certificate.pem nginx/ssl/cert.pem
   cp your-private-key.pem nginx/ssl/key.pem
   ```

3. **Update nginx configuration:**
   ```nginx
   # Uncomment HTTPS server block in nginx/conf.d/default.conf
   # Update server_name with your domain
   ```

## Monitoring and Health Checks

### Health Check Script

Run comprehensive health checks:

```bash
./scripts/health-check.sh
```

### Manual Health Checks

1. **Service Status:**
   ```bash
   docker-compose ps
   ```

2. **Application Health:**
   ```bash
   curl http://localhost/health
   curl http://localhost/api/health
   ```

3. **Resource Usage:**
   ```bash
   docker stats
   ```

4. **Logs:**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f backend
   ```

### Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/health` | Nginx health | `healthy` |
| `/api/health` | Backend API health | JSON status |

## Backup and Restore

### Automatic Backup

Run the backup script:

```bash
./scripts/backup.sh
```

### Manual Backup

1. **Backup Redis data:**
   ```bash
   docker-compose exec redis redis-cli BGSAVE
   docker cp $(docker-compose ps -q redis):/data/dump.rdb ./backup/
   ```

2. **Backup Laravel storage:**
   ```bash
   docker cp $(docker-compose ps -q backend):/var/www/storage ./backup/
   ```

3. **Backup database:**
   ```bash
   docker cp $(docker-compose ps -q backend):/var/www/database/database.sqlite ./backup/
   ```

### Restore Process

1. **Stop services:**
   ```bash
   docker-compose down
   ```

2. **Restore data:**
   ```bash
   # Extract backup
   tar -xzf backups/pokedex_backup_TIMESTAMP.tar.gz

   # Restore Redis
   docker cp backup/redis_dump.rdb $(docker-compose ps -q redis):/data/

   # Restore Laravel storage
   docker cp backup/laravel_storage $(docker-compose ps -q backend):/var/www/storage
   ```

3. **Restart services:**
   ```bash
   docker-compose up -d
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check port usage
   lsof -i :80
   lsof -i :443

   # Change ports in .env
   HTTP_PORT=8080
   HTTPS_PORT=8443
   ```

2. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x scripts/*.sh
   ```

3. **Memory issues:**
   ```bash
   # Check available memory
   free -h

   # Increase Docker memory limit
   # Docker Desktop: Settings > Resources > Memory
   ```

4. **SSL certificate issues:**
   ```bash
   # Regenerate self-signed certificates
   docker-compose exec nginx openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/nginx/ssl/key.pem \
     -out /etc/nginx/ssl/cert.pem \
     -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
   ```

### Service-Specific Issues

#### Backend Issues

```bash
# Check Laravel logs
docker-compose logs backend

# Access backend container
docker-compose exec backend bash

# Clear Laravel cache
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:clear
```

#### Frontend Issues

```bash
# Check Next.js logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build --no-cache frontend

# Access frontend container
docker-compose exec frontend sh
```

#### Redis Issues

```bash
# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

#### Nginx Issues

```bash
# Check Nginx logs
docker-compose logs nginx

# Test Nginx configuration
docker-compose exec nginx nginx -t

# Reload Nginx configuration
docker-compose exec nginx nginx -s reload
```

### Performance Optimization

1. **Enable production optimizations:**
   ```bash
   # Use production Docker Compose
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Monitor resource usage:**
   ```bash
   # Real-time monitoring
   docker stats

   # Check disk usage
   docker system df
   ```

3. **Clean up unused resources:**
   ```bash
   # Remove unused images
   docker image prune -f

   # Remove unused volumes
   docker volume prune -f

   # Full system cleanup
   docker system prune -a -f
   ```

## Security Considerations

### Production Security Checklist

- [ ] Use strong, unique passwords for all services
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Update default secrets and keys
- [ ] Restrict network access to necessary ports only
- [ ] Enable firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Implement backup strategy
- [ ] Use non-root users in containers
- [ ] Enable Docker security scanning

### Network Security

```bash
# Firewall configuration (Ubuntu/Debian)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # Block direct frontend access
sudo ufw deny 8000/tcp  # Block direct backend access
sudo ufw deny 6379/tcp  # Block direct Redis access
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Check application health
   - Review logs for errors
   - Monitor resource usage

2. **Monthly:**
   - Update Docker images
   - Backup application data
   - Review security logs

3. **Quarterly:**
   - Update SSL certificates
   - Security audit
   - Performance review

### Getting Help

1. **Check logs first:**
   ```bash
   ./scripts/health-check.sh
   docker-compose logs
   ```

2. **Common commands:**
   ```bash
   # Restart all services
   docker-compose restart

   # Rebuild and restart
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d

   # Clean slate restart
   docker-compose down -v
   docker system prune -f
   docker-compose up -d
   ```

3. **Contact information:**
   - Create an issue in the project repository
   - Check the project documentation
   - Review Docker and service logs

---

For more detailed information about specific components, refer to the individual service documentation in their respective directories.