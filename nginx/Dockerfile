# Nginx reverse proxy configuration
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY conf.d/ /etc/nginx/conf.d/

# Copy SSL certificates (if any)
COPY ssl/ /etc/nginx/ssl/

# Create nginx configuration for WebSocket upgrades
RUN echo 'map $http_upgrade $connection_upgrade {' > /etc/nginx/conf.d/websocket.conf && \
    echo '    default upgrade;' >> /etc/nginx/conf.d/websocket.conf && \
    echo '    "" close;' >> /etc/nginx/conf.d/websocket.conf && \
    echo '}' >> /etc/nginx/conf.d/websocket.conf

# Create self-signed SSL certificate for development
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create nginx user and set permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /etc/nginx/ssl && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Create log directory
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Switch to non-root user
USER nginx

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]