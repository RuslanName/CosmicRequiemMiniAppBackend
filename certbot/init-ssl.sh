#!/bin/sh

# Script to obtain initial SSL certificates
# Usage: ./init-ssl.sh [email] [domain]

set -e

EMAIL="${1:-your-email@example.com}"
DOMAIN="${2:-kosmo-requiem.ru}"

echo "=========================================="
echo "SSL Certificate Initialization Script"
echo "=========================================="
echo "Email: $EMAIL"
echo "Domain: $DOMAIN"
echo "=========================================="

# Check if certificates already exist
if [ -d "./certbot/conf/live/$DOMAIN" ]; then
    echo "Certificates already exist for $DOMAIN"
    echo "Checking certificate validity..."
    docker compose exec certbot certbot certificates
    exit 0
fi

# Ensure nginx is running
echo "Checking if nginx is running..."
if ! docker compose ps nginx | grep -q "Up"; then
    echo "Starting nginx..."
    docker compose up -d nginx
    echo "Waiting for nginx to be ready..."
    sleep 5
fi

# Create necessary directories
echo "Creating certbot directories..."
mkdir -p ./certbot/www/.well-known/acme-challenge
mkdir -p ./certbot/conf

# Request certificate using webroot method
echo "Requesting SSL certificate for $DOMAIN..."
echo "This will also request certificates for api.$DOMAIN and admin.$DOMAIN"

docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN" \
    -d "api.$DOMAIN" \
    -d "admin.$DOMAIN"

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "✓ SSL certificates obtained successfully!"
    echo "=========================================="
    echo "Restarting nginx to load SSL configuration..."
    docker compose restart nginx
    echo ""
    echo "Certificates are located at:"
    echo "  ./certbot/conf/live/$DOMAIN/"
    echo ""
    echo "You can verify certificates with:"
    echo "  docker compose exec certbot certbot certificates"
else
    echo "=========================================="
    echo "✗ Failed to obtain SSL certificates"
    echo "=========================================="
    echo "Please check:"
    echo "  1. Domain DNS is pointing to this server"
    echo "  2. Port 80 is accessible from the internet"
    echo "  3. Nginx is running and serving /.well-known/acme-challenge/"
    exit 1
fi








