#!/bin/sh
set -e

if ! command -v envsubst > /dev/null 2>&1; then
    apk add --no-cache gettext
fi

if [ -f /etc/nginx/templates/default.conf.template ]; then
    envsubst '${NGINX_BASE_DOMAIN} ${NGINX_SERVER_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
    
    API_CERT="/etc/letsencrypt/live/api.${NGINX_BASE_DOMAIN}/fullchain.pem"
    ADMIN_CERT="/etc/letsencrypt/live/admin.${NGINX_BASE_DOMAIN}/fullchain.pem"
    
    if [ ! -f "$API_CERT" ] || [ ! -f "$ADMIN_CERT" ]; then
        echo "Warning: SSL certificates not found. Disabling SSL blocks and HTTPS redirects..."
        sed -i '/listen 443 ssl;/d' /etc/nginx/conf.d/default.conf
        sed -i '/http2 on;/d' /etc/nginx/conf.d/default.conf
        sed -i '/ssl_certificate/d' /etc/nginx/conf.d/default.conf
        sed -i '/ssl_certificate_key/d' /etc/nginx/conf.d/default.conf
        sed -i '/ssl_protocols/d' /etc/nginx/conf.d/default.conf
        sed -i '/ssl_ciphers/d' /etc/nginx/conf.d/default.conf
        sed -i '/ssl_prefer_server_ciphers/d' /etc/nginx/conf.d/default.conf
        sed -i '/ssl_session_cache/d' /etc/nginx/conf.d/default.conf
        sed -i '/ssl_session_timeout/d' /etc/nginx/conf.d/default.conf
        sed -i 's/return 301 https:\/\/\$host\$request_uri;/# return 301 https:\/\/$host$request_uri; # Disabled: no SSL certs/' /etc/nginx/conf.d/default.conf
        echo "SSL disabled. Nginx will work in HTTP-only mode until certificates are obtained."
    fi
fi

if [ -f /docker-entrypoint.sh ]; then
    exec /docker-entrypoint.sh nginx -g 'daemon off;'
else
    exec nginx -g 'daemon off;'
fi

