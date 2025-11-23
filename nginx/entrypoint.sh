#!/bin/sh

if ! command -v envsubst > /dev/null 2>&1; then
    apk add --no-cache gettext
fi

if [ -f /etc/nginx/templates/default.conf.template ]; then
    envsubst '${NGINX_BASE_DOMAIN} ${NGINX_SERVER_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
fi

API_CERT="/etc/letsencrypt/live/api.${NGINX_BASE_DOMAIN}/fullchain.pem"
ADMIN_CERT="/etc/letsencrypt/live/admin.${NGINX_BASE_DOMAIN}/fullchain.pem"
MAIN_CERT="/etc/letsencrypt/live/${NGINX_BASE_DOMAIN}/fullchain.pem"

if [ -f "$API_CERT" ] && [ -f "$ADMIN_CERT" ] && [ -f "$MAIN_CERT" ]; then
    if [ -f /etc/nginx/templates/ssl.conf.template ]; then
        echo "SSL certificates found. Generating SSL configuration and enabling HTTPS redirects..."
        envsubst '${NGINX_BASE_DOMAIN} ${NGINX_SERVER_PORT}' < /etc/nginx/templates/ssl.conf.template > /etc/nginx/conf.d/ssl.conf
        
        awk '
        BEGIN { skip_api = 0; skip_admin = 0; skip_main = 0; api_braces = 0; admin_braces = 0; main_braces = 0 }
        /# HTTP_REDIRECT_PLACEHOLDER/ {
            skip_api = 1
            api_braces = 1
            print "        return 301 https://$host$request_uri;"
            next
        }
        skip_api == 1 {
            if (/\{/) api_braces++
            if (/\}/) {
                api_braces--
                if (api_braces == 0) {
                    skip_api = 0
                    print
                }
            }
            next
        }
        /# ADMIN_HTTP_REDIRECT_PLACEHOLDER/ {
            skip_admin = 1
            admin_braces = 1
            print "        return 301 https://$host$request_uri;"
            next
        }
        skip_admin == 1 {
            if (/\{/) admin_braces++
            if (/\}/) {
                admin_braces--
                if (admin_braces == 0) {
                    skip_admin = 0
                    print
                }
            }
            next
        }
        /# MAIN_DOMAIN_HTTP_REDIRECT_PLACEHOLDER/ {
            skip_main = 1
            main_braces = 1
            print "        return 301 https://$host$request_uri;"
            next
        }
        skip_main == 1 {
            if (/\{/) main_braces++
            if (/\}/) {
                main_braces--
                if (main_braces == 0) {
                    skip_main = 0
                    print
                }
            }
            next
        }
        { print }
        ' /etc/nginx/conf.d/default.conf > /tmp/nginx.conf.tmp
        
        if [ $? -eq 0 ]; then
            mv /tmp/nginx.conf.tmp /etc/nginx/conf.d/default.conf
            echo "" >> /etc/nginx/conf.d/default.conf
            echo "include /etc/nginx/conf.d/ssl.conf;" >> /etc/nginx/conf.d/default.conf
            echo "SSL configuration generated and HTTPS redirects enabled."
        else
            echo "Error processing config"
        fi
    fi
else
    echo "SSL certificates not found. Removing SSL configuration if exists..."
    rm -f /etc/nginx/conf.d/ssl.conf
    sed -i '/include \/etc\/nginx\/conf.d\/ssl.conf;/d' /etc/nginx/conf.d/default.conf
    sed -i 's|# HTTP_REDIRECT_PLACEHOLDER||' /etc/nginx/conf.d/default.conf
    sed -i 's|# ADMIN_HTTP_REDIRECT_PLACEHOLDER||' /etc/nginx/conf.d/default.conf
    sed -i 's|# MAIN_DOMAIN_HTTP_REDIRECT_PLACEHOLDER||' /etc/nginx/conf.d/default.conf
    echo "Nginx will work in HTTP-only mode until certificates are obtained."
fi

nginx -t
if [ $? -eq 0 ]; then
    echo "Nginx configuration test passed. Starting nginx..."
    exec nginx -g 'daemon off;'
else
    echo "Nginx configuration test failed!"
    exit 1
fi

