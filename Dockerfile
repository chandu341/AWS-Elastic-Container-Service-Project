# Use Nginx on Alpine, configured to run as a non-root user.
FROM nginxinc/nginx-unprivileged:alpine

# Set Nginx's default directory for static website files.
WORKDIR /usr/share/nginx/html

# Copy the application files and make the nginx user their owner.
COPY --chown=nginx:nginx index.html style.css script.js ./

# Document the port Nginx listens on inside the container.
EXPOSE 8080

# Check the local page with wget without downloading it. Run every 30 seconds,
# allow 5 seconds for startup, use a 3-second timeout, and mark unhealthy after
# three consecutive failures.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
