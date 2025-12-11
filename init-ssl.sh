#!/bin/bash

# SSL Initialization Script for udsayan.manufac.id
# Run this script once to obtain SSL certificates

DOMAIN="udsayan.manufac.id"
EMAIL="admin@manufac.id"  # Change this to your email

echo "=== SSL Initialization for $DOMAIN ==="

# Step 1: Use initial config (HTTP only)
echo "[1/5] Setting up initial HTTP config..."
cd /root/project/UDSAYAN
mv nginx/conf.d/default.conf nginx/conf.d/default-ssl.conf.bak 2>/dev/null || true
cp nginx/conf.d/default-init.conf nginx/conf.d/default.conf

# Step 2: Build and start containers
echo "[2/5] Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build ud-app nginx

# Wait for containers to be ready
echo "[3/5] Waiting for containers to start..."
sleep 10

# Step 3: Obtain SSL certificate
echo "[4/5] Obtaining SSL certificate..."
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Step 4: Switch to SSL config
echo "[5/5] Switching to SSL config..."
mv nginx/conf.d/default-ssl.conf.bak nginx/conf.d/default.conf

# Restart nginx to apply SSL config
docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "=== Done! ==="
echo "Your site should now be available at https://$DOMAIN"
echo ""
echo "To check status: docker compose -f docker-compose.prod.yml ps"
echo "To view logs: docker compose -f docker-compose.prod.yml logs -f"
