# Pokédex Application

A full-stack Pokédex application built with Laravel backend and Next.js frontend, featuring a responsive design with carousel banners, search functionality, and containerized deployment with Docker.

## 🏗️ Architecture

- **Backend**: Laravel 10 API that aggregates data from PokeAPI
- **Frontend**: Next.js 14 application with TypeScript and Tailwind CSS
- **Cache**: Redis 7 for API response caching and session storage
- **Proxy**: Nginx reverse proxy with SSL termination and load balancing
- **Containerization**: Docker with multi-stage builds and health checks

## 🚀 Quick Start

### Using Make (Recommended)

```bash
# Setup development environment (one command)
make setup-dev

**Access the application**
   - **Main App**: http://localhost
   - **Frontend**: http://localhost:3000 (dev only)
   - **Backend API**: http://localhost:8000 (dev only)
```

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)


## 📡 API Documentation

### Base URL
- **Development**: `http://localhost:8000/api`

### Authentication
Currently, the API does not require authentication for Pokemon data endpoints.

### Health Check

#### GET `/health`
Check API service status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000000Z",
  "service": "Pokedex API"
}
```

### Pokemon Endpoints

#### GET `/pokemons`
Retrieve a paginated list of Pokemon with search and filtering capabilities.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 20 | Number of items per page (max: 100) |
| `search` | string | - | Search by Pokemon name |
| `type` | string | - | Filter by Pokemon type |
| `sort` | string | `id` | Sort field (`id`, `name`, `height`, `weight`) |
| `order` | string | `asc` | Sort order (`asc`, `desc`) |

**Example Request:**
```bash
curl "http://localhost:8000/api/pokemons?page=1&limit=20&search=pika&type=electric"
```

**Response:**
```json
{
  "data": [
    {
      "id": 25,
      "name": "pikachu",
      "height": 4,
      "weight": 60,
      "base_experience": 112,
      "types": [
        {
          "slot": 1,
          "type": {
            "name": "electric",
            "url": "https://pokeapi.co/api/v2/type/13/"
          }
        }
      ],
      "sprites": {
        "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
        "front_shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png",
        "other": {
          "official-artwork": {
            "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
          }
        }
      },
      "stats": [
        {
          "base_stat": 35,
          "effort": 0,
          "stat": {
            "name": "hp"
          }
        },
        {
          "base_stat": 55,
          "effort": 0,
          "stat": {
            "name": "attack"
          }
        }
      ],
      "abilities": [
        {
          "ability": {
            "name": "static",
            "url": "https://pokeapi.co/api/v2/ability/9/"
          },
          "is_hidden": false,
          "slot": 1
        }
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 1302,
    "last_page": 66,
    "from": 1,
    "to": 20
  },
  "links": {
    "first": "http://localhost:8000/api/pokemons?page=1",
    "last": "http://localhost:8000/api/pokemons?page=66",
    "prev": null,
    "next": "http://localhost:8000/api/pokemons?page=2"
  }
}
```

#### GET `/pokemons/{id}`
Retrieve detailed information about a specific Pokemon.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Pokemon ID (1-1302) |

**Example Request:**
```bash
curl "http://localhost:8000/api/pokemons/25"
```

**Response:**
```json
{
  "data": {
    "id": 25,
    "name": "pikachu",
    "height": 4,
    "weight": 60,
    "base_experience": 112,
    "types": [...],
    "sprites": {...},
    "stats": [...],
    "abilities": [...],
    "moves": [...],
    "species": {
      "name": "pikachu",
      "url": "https://pokeapi.co/api/v2/pokemon-species/25/"
    }
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid parameter value",
  "details": {
    "limit": ["The limit must be between 1 and 100."]
  }
}
```

#### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Pokemon not found"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retry_after": 60
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### Rate Limiting
- **API Endpoints**: 10 requests per second per IP
- **General Endpoints**: 30 requests per second per IP
- **Headers**: Rate limit information is included in response headers:
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

### Caching
- **Redis Cache**: API responses are cached for 1 hour
- **Cache Headers**: Responses include cache control headers
- **Cache Invalidation**: Cache is automatically invalidated when data changes

### Performance Headers
All API responses include performance monitoring headers:
- `X-Response-Time`: Response time in milliseconds
- `X-Memory-Usage`: Memory usage in MB
- `X-Cache-Status`: Cache hit/miss status

### CORS Configuration
The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:
- **Allowed Origins**: Configurable via `CORS_ALLOWED_ORIGINS` environment variable
- **Allowed Methods**: GET, POST, OPTIONS, PUT, DELETE
- **Allowed Headers**: Content-Type, Authorization, X-Requested-With
- **Credentials**: Supported for authenticated requests

### Testing the API

#### Using cURL
```bash
# Get all Pokemon
curl -X GET "http://localhost:8000/api/pokemons"

# Search for Pokemon
curl -X GET "http://localhost:8000/api/pokemons?search=charizard"

# Get specific Pokemon
curl -X GET "http://localhost:8000/api/pokemons/6"

# Health check
curl -X GET "http://localhost:8000/api/health"
```

## 🎯 Features

### Frontend Features
- 🎠 Auto-rotating carousel banner
- 🔍 Real-time Pokemon search
- 📱 Responsive design with persistent layout
- ♾️ Infinite scroll pagination
- 🎨 Type-based color coding
- ⚡ Optimized performance with caching

### Backend Features
- 🔄 PokeAPI integration with caching
- 📊 Paginated API responses
- 🛡️ Request validation and rate limiting
- 📈 Performance monitoring
- 🔒 Security headers and CORS

### DevOps Features
- 🐳 Multi-stage Docker builds
- 🔄 Health checks and auto-restart
- 📦 Automated deployment scripts
- 💾 Backup and restore utilities
- 📊 Monitoring and logging
- 🔒 SSL/TLS encryption

## 🛠️ Development Commands

### Direct Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose build --no-cache
```

### Service-Specific Commands

```bash
# Access container shells
make backend-shell     # Laravel backend
make frontend-shell    # Next.js frontend
make redis-cli         # Redis CLI
make nginx-shell       # Nginx container

# Laravel commands
make laravel-key       # Generate app key
make laravel-cache     # Rebuild caches
make laravel-clear     # Clear all caches
```

## 🏭 Production Deployment

### Automated Production Setup

```bash
# Copy and edit production environment
cp .env.production .env
# Edit .env with your production settings

# Deploy to production
make prod
```

### Manual Production Deployment

```bash
# Use production Docker Compose configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Optimize Laravel for production
docker-compose exec backend php artisan config:cache
docker-compose exec backend php artisan route:cache
docker-compose exec backend php artisan view:cache
```

### Production Features

- ✅ Multi-stage Docker builds for optimized images
- ✅ Non-root users for security
- ✅ Resource limits and health checks
- ✅ SSL/TLS encryption with automatic certificate generation
- ✅ Gzip compression and security headers
- ✅ Redis persistence and memory optimization
- ✅ Automated backup and monitoring scripts

## 📁 Project Structure

```
pokedex-app/
├── backend/                    # Laravel API application
│   ├── app/                   # Laravel application code
│   ├── Dockerfile             # Multi-stage PHP build
│   └── .dockerignore          # Build optimization
├── frontend/                   # Next.js frontend application
│   ├── src/                   # React components and pages
│   ├── Dockerfile             # Multi-stage Node.js build
│   └── .dockerignore          # Build optimization
├── nginx/                      # Nginx reverse proxy
│   ├── conf.d/                # Nginx configuration
│   ├── ssl/                   # SSL certificates
│   └── Dockerfile             # Nginx with security
├── scripts/                    # Deployment and utility scripts
│   ├── deploy-dev.sh          # Development deployment
│   ├── deploy-prod.sh         # Production deployment
│   ├── health-check.sh        # Health monitoring
│   └── backup.sh              # Backup utility
├── docker-compose.yml          # Base Docker configuration
├── docker-compose.override.yml # Development overrides
├── docker-compose.prod.yml     # Production configuration
├── Makefile                    # Convenience commands
├── DEPLOYMENT.md               # Detailed deployment guide
├── DOCKER.md                   # Docker configuration guide
└── README.md                   # This file
```

## ⚙️ Configuration

### Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `APP_ENV` | `local` | `production` | Application environment |
| `APP_DEBUG` | `true` | `false` | Debug mode |
| `NODE_ENV` | `development` | `production` | Node.js environment |
| `BUILD_TARGET` | `development` | `production` | Docker build target |
| `REDIS_PASSWORD` | `pokedex_redis_pass` | `secure-password` | Redis authentication |
| `NEXT_PUBLIC_API_URL` | `http://localhost/api` | `https://domain.com/api` | Frontend API URL |

### Port Configuration

| Service | Development | Production | Purpose |
|---------|-------------|------------|---------|
| Nginx | 80, 443 | 80, 443 | HTTP/HTTPS proxy |
| Backend | 8000 | - | Laravel API (dev only) |
| Frontend | 3000 | - | Next.js app (dev only) |
| Redis | 6379 | - | Cache (dev only) |

## 🔒 Security Features

- **Container Security**: Non-root users, minimal base images
- **Network Security**: Service isolation, rate limiting
- **SSL/TLS**: Automatic HTTPS with security headers
- **Input Validation**: Request validation and sanitization
- **CORS**: Proper cross-origin resource sharing
- **Health Checks**: Automatic failure detection and recovery

## 📊 Monitoring & Health Checks

### Health Check Endpoints

- **Nginx**: `http://localhost/health`
- **Backend API**: `http://localhost/api/health`
- **Application**: `http://localhost` (frontend)

### Monitoring Commands

```bash
make health            # Comprehensive health check
make status            # Service status
make stats             # Resource usage
docker-compose ps      # Container status
```

## 💾 Backup & Restore

### Automated Backup

```bash
make backup            # Creates timestamped backup
```

### Manual Backup

```bash
./scripts/backup.sh    # Full application backup
```

Backups include:
- Redis data dump
- Laravel storage and database
- Configuration files
- Docker Compose files

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   lsof -i :80
   
   # Change ports in .env
   HTTP_PORT=8080
   HTTPS_PORT=8443
   ```

2. **Permission issues**
   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER .
   chmod +x scripts/*.sh
   ```

3. **Container health issues**
   ```bash
   # Check logs
   make logs
   
   # Restart services
   make restart
   
   # Full reset
   make reset
   ```

4. **SSL certificate issues**
   ```bash
   # Regenerate certificates
   make ssl-generate
   ```

### Debug Commands

```bash
# Service logs
make logs-backend      # Laravel logs
make logs-frontend     # Next.js logs
make logs-nginx        # Nginx logs

# Container access
make backend-shell     # Access Laravel container
make frontend-shell    # Access Next.js container

# Resource monitoring
make stats             # Resource usage
make disk-usage        # Disk usage
```

## 🔧 Backend Setup (Laravel)

### Prerequisites
- PHP 8.2+
- Composer
- Redis (for caching)

### Manual Backend Setup (Without Docker)

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configure environment variables**
   ```bash
   # Edit .env file
   APP_ENV=local
   APP_DEBUG=true
   CACHE_DRIVER=redis
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   POKEAPI_BASE_URL=https://pokeapi.co/api/v2
   ```

5. **Create SQLite database**
   ```bash
   touch database/database.sqlite
   php artisan migrate
   ```

6. **Start development server**
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

### Backend Docker Commands

```bash
# Install dependencies
make backend-shell
composer install

# Laravel Artisan commands
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:cache
docker-compose exec backend php artisan route:list

# Generate application key
docker-compose exec backend php artisan key:generate


```

### Backend Directory Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── PokemonController.php    # Main API controller
│   │   └── Middleware/
│   │       └── ApiLogger.php                # Request logging
│   ├── Services/                            # Business logic
│   └── Models/                              # Eloquent models
├── config/                                  # Configuration files
├── database/
│   ├── migrations/                          # Database migrations
│   └── database.sqlite                      # SQLite database
├── routes/
│   └── api.php                             # API routes
├── storage/                                # File storage and logs

├── composer.json                           # PHP dependencies
├── Dockerfile                              # Docker configuration
└── .env                                    # Environment variables
```

## 🎨 Frontend Setup (Next.js)

### Prerequisites
- Node.js 18+
- npm or yarn

### Manual Frontend Setup (Without Docker)

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment configuration**
   ```bash
   cp .env.local.example .env.local
   ```

4. **Configure environment variables**
   ```bash
   # Edit .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NODE_ENV=development
   ```

5. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   # or
   yarn build
   yarn start
   ```

### Frontend Docker Commands

```bash
# Install dependencies
make frontend-shell
npm install

# Development commands
docker-compose exec frontend npm run dev
docker-compose exec frontend npm run build
docker-compose exec frontend npm run lint


```

### Frontend Directory Structure

```
frontend/
├── src/
│   ├── app/                                # Next.js 14 App Router
│   │   ├── globals.css                     # Global styles
│   │   ├── layout.tsx                      # Root layout
│   │   └── page.tsx                        # Home page
│   ├── components/                         # React components
│   │   ├── pokemon/
│   │   │   ├── SearchBar.tsx              # Search functionality
│   │   │   ├── PokemonCard.tsx            # Pokemon display card
│   │   │   ├── PokemonGrid.tsx            # Grid layout
│   │   │   └── CarouselBanner.tsx         # Rotating banner
│   │   ├── ui/                            # UI components
│   │   └── layout/                        # Layout components
│   ├── hooks/                             # Custom React hooks
│   ├── lib/                               # Utility functions
│   ├── types/                             # TypeScript definitions
│   └── styles/                            # Additional styles
├── public/                                # Static assets
├── next.config.js                         # Next.js configuration
├── tailwind.config.js                     # Tailwind CSS config
├── tsconfig.json                          # TypeScript config
├── package.json                           # Dependencies
├── Dockerfile                             # Docker configuration
└── .env.local                             # Environment variables
```