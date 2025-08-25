#!/bin/bash

# Backup script for Pokedex application

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="pokedex_backup_$TIMESTAMP"

echo "💾 Starting backup process..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup subdirectory
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH"

echo "📁 Backup will be stored in: $BACKUP_PATH"

# Backup Redis data
echo "🔄 Backing up Redis data..."
if docker-compose ps redis | grep -q "Up"; then
    docker-compose exec redis redis-cli BGSAVE
    sleep 5  # Wait for background save to complete
    docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_PATH/redis_dump.rdb"
    echo "✅ Redis data backed up"
else
    echo "⚠️  Redis container is not running, skipping Redis backup"
fi

# Backup Laravel storage and database
echo "🔄 Backing up Laravel application data..."
if docker-compose ps backend | grep -q "Up"; then
    # Backup storage directory
    docker cp $(docker-compose ps -q backend):/var/www/storage "$BACKUP_PATH/laravel_storage"
    
    # Backup SQLite database if it exists
    if docker-compose exec backend test -f database/database.sqlite; then
        docker cp $(docker-compose ps -q backend):/var/www/database/database.sqlite "$BACKUP_PATH/database.sqlite"
        echo "✅ SQLite database backed up"
    fi
    
    echo "✅ Laravel application data backed up"
else
    echo "⚠️  Backend container is not running, skipping Laravel backup"
fi

# Backup configuration files
echo "🔄 Backing up configuration files..."
cp -r ./nginx/conf.d "$BACKUP_PATH/nginx_config"
cp .env "$BACKUP_PATH/env_config" 2>/dev/null || echo "⚠️  .env file not found"
cp docker-compose.yml "$BACKUP_PATH/"
cp docker-compose.prod.yml "$BACKUP_PATH/" 2>/dev/null || echo "⚠️  docker-compose.prod.yml not found"
cp docker-compose.override.yml "$BACKUP_PATH/" 2>/dev/null || echo "⚠️  docker-compose.override.yml not found"
echo "✅ Configuration files backed up"

# Create backup metadata
echo "📝 Creating backup metadata..."
cat > "$BACKUP_PATH/backup_info.txt" << EOF
Pokedex Application Backup
==========================
Backup Date: $(date)
Backup Name: $BACKUP_NAME
Docker Compose Status at backup time:
$(docker-compose ps)

Environment Variables:
$(cat .env 2>/dev/null | grep -v "PASSWORD\|KEY\|SECRET" || echo "No .env file found")

Backup Contents:
- Redis data dump (if available)
- Laravel storage directory (if available)
- SQLite database (if available)
- Nginx configuration
- Docker Compose files
- Environment configuration (passwords excluded)
EOF

echo "✅ Backup metadata created"

# Create compressed archive
echo "🗜️  Creating compressed archive..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
cd - > /dev/null

# Calculate archive size
ARCHIVE_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)

echo ""
echo "🎉 Backup completed successfully!"
echo ""
echo "📊 Backup Details:"
echo "   Archive: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "   Size: $ARCHIVE_SIZE"
echo "   Timestamp: $TIMESTAMP"
echo ""
echo "🔧 To restore from this backup:"
echo "   1. Extract: tar -xzf $BACKUP_DIR/${BACKUP_NAME}.tar.gz -C $BACKUP_DIR"
echo "   2. Follow restore instructions in the backup_info.txt file"
echo ""

# Clean up old backups (keep last 10)
echo "🧹 Cleaning up old backups (keeping last 10)..."
cd "$BACKUP_DIR"
ls -t pokedex_backup_*.tar.gz | tail -n +11 | xargs -r rm
cd - > /dev/null

echo "✅ Backup process completed!"