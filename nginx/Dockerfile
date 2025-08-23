# Nginx reverse proxy configuration
FROM nginx:alpine

# Copy custom nginx configuration
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Copy SSL certificates (if any)
COPY ssl/ /etc/nginx/ssl/

# Create nginx user and set permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]