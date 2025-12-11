#!/bin/bash

# SSL Setup Script for udsayan.manufac.id
# Run this after DNS is pointing to this VPS (72.61.143.6)

DOMAIN="udsayan.manufac.id"
EMAIL="admin@manufac.id"  # Change this to your email
SSL_DIR="/opt/attendancedev/docker/nginx/ssl/udsayan"
CERTBOT_DIR="/opt/attendancedev/certbot"

echo "=== SSL Setup for $DOMAIN ==="

# Check if DNS is correct
echo "[1/4] Checking DNS..."
CURRENT_IP=$(dig +short $DOMAIN | head -1)
VPS_IP="72.61.143.6"

if [ "$CURRENT_IP" != "$VPS_IP" ]; then
    echo "WARNING: DNS for $DOMAIN points to $CURRENT_IP, not $VPS_IP"
    echo "Please update your DNS A record to point to $VPS_IP"
    echo "Then run this script again."
    exit 1
fi

echo "DNS is correctly pointing to $VPS_IP"

# Create directories
echo "[2/4] Creating directories..."
mkdir -p $SSL_DIR
mkdir -p $CERTBOT_DIR/www
mkdir -p $CERTBOT_DIR/conf

# Get SSL certificate using certbot
echo "[3/4] Obtaining SSL certificate..."
docker run --rm \
    -v $CERTBOT_DIR/conf:/etc/letsencrypt \
    -v $CERTBOT_DIR/www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Copy certificates to nginx ssl directory
echo "[4/4] Copying certificates..."
cp $CERTBOT_DIR/conf/live/$DOMAIN/fullchain.pem $SSL_DIR/fullchain.pem
cp $CERTBOT_DIR/conf/live/$DOMAIN/privkey.pem $SSL_DIR/privkey.pem

# Update nginx config to enable HTTPS
echo "Enabling HTTPS in nginx config..."
NGINX_CONF="/opt/attendancedev/docker/nginx/nginx.ssl.conf"

# Uncomment the HTTPS server block
sed -i 's/^    # server {/    server {/g' $NGINX_CONF
sed -i 's/^    #     /        /g' $NGINX_CONF
sed -i 's/^    # }/    }/g' $NGINX_CONF

# Update HTTP to redirect
sed -i 's/# Temporarily proxy to app/# Redirect to HTTPS/g' $NGINX_CONF
sed -i 's/proxy_pass http:\/\/udsayan;/return 301 https:\/\/\$host\$request_uri;/g' $NGINX_CONF

# Reload nginx
docker exec attendancedev-nginx nginx -t && docker exec attendancedev-nginx nginx -s reload

echo ""
echo "=== Done! ==="
echo "Your site should now be available at https://$DOMAIN"
echo ""
echo "To renew certificates, run:"
echo "docker run --rm -v $CERTBOT_DIR/conf:/etc/letsencrypt certbot/certbot renew"
