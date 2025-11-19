#!/bin/sh
set -e

if ! command -v envsubst > /dev/null 2>&1; then
    apk add --no-cache gettext
fi

if [ -f /etc/nginx/templates/default.conf.template ]; then
    envsubst '${NGINX_DOMAIN} ${NGINX_SERVER_PORT} ${NGINX_ADMIN_DOMAIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
fi

if [ -f /docker-entrypoint.sh ]; then
    exec /docker-entrypoint.sh nginx -g 'daemon off;'
else
    exec nginx -g 'daemon off;'
fi

