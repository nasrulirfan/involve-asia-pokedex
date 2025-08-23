# Pokédex Application

A full-stack Pokédex application built with Laravel backend and Next.js frontend, containerized with Docker.

## Architecture

- **Backend**: Laravel API that aggregates data from PokeAPI
- **Frontend**: Next.js application with TypeScript and Tailwind CSS
- **Cache**: Redis for API response caching
- **Proxy**: Nginx reverse proxy for routing and load balancing

## Prerequisites

- Docker and Docker Compose installed
- Git for version control

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Copy environment configuration**
   ```bash
   cp .env.example .env
   ```

3. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Nginx Proxy: http://localhost (routes to appropriate services)

## Development Commands

### Start all services
```bash
docker-compose up -d
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop all services
```bash
docker-compose down
```

### Rebuild containers
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Execute commands in containers
```bash
# Laravel backend
docker-compose exec backend php artisan --version
docker-compose exec backend composer install

# Next.js frontend
docker-compose exec frontend npm install
docker-compose exec frontend npm run build
```

## Production Deployment

1. **Set production environment variables in `.env`**
   ```bash
   APP_ENV=production
   APP_DEBUG=false
   NODE_ENV=production
   ```

2. **Deploy with production configuration**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Project Structure

```
pokedex-app/
├── backend/                 # Laravel API application
├── frontend/                # Next.js frontend application
├── nginx/                   # Nginx reverse proxy configuration
│   ├── conf.d/             # Nginx configuration files
│   └── ssl/                # SSL certificates directory
├── docker-compose.yml      # Main Docker Compose configuration
├── docker-compose.override.yml  # Development overrides
├── docker-compose.prod.yml # Production configuration
├── .env                    # Environment variables
└── README.md              # This file
```

## Environment Variables

Key environment variables in `.env`:

- `APP_ENV`: Application environment (local/production)
- `APP_DEBUG`: Enable debug mode (true/false)
- `NODE_ENV`: Node.js environment (development/production)
- `REDIS_PASSWORD`: Redis authentication password
- `NEXT_PUBLIC_API_URL`: Frontend API endpoint URL

## Container Services

### Backend (Laravel)
- **Port**: 8000 (development), 9000 (production with PHP-FPM)
- **Dependencies**: Redis for caching
- **Health Check**: Available at `/api/health`

### Frontend (Next.js)
- **Port**: 3000
- **Dependencies**: Backend API
- **Hot Reload**: Enabled in development mode

### Redis Cache
- **Port**: 6379 (development only)
- **Persistence**: Data persisted in Docker volume
- **Authentication**: Password protected

### Nginx Proxy
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Routing**: 
  - `/api/*` → Backend service
  - `/*` → Frontend service
- **Features**: Gzip compression, security headers, static file caching

## Troubleshooting

### Container won't start
```bash
# Check container logs
docker-compose logs [service-name]

# Rebuild containers
docker-compose build --no-cache
```

### Port conflicts
```bash
# Check what's using the port
lsof -i :3000
lsof -i :8000

# Change ports in .env file
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

### Permission issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER ./backend
sudo chown -R $USER:$USER ./frontend
```

## Next Steps

After the Docker setup is complete:

1. Initialize the Laravel backend (Task 2)
2. Set up the Next.js frontend (Task 6)
3. Implement the PokeAPI client and caching (Task 3)
4. Build the frontend components (Tasks 7-17)