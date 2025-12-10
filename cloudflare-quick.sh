#!/bin/bash

# UD Project - Cloudflare Quick Tunnel (No Domain Required)
# This creates a temporary tunnel with auto-generated URL

set -e

echo "☁️  UD Project - Cloudflare Quick Tunnel"
echo "========================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ Cloudflared is not installed. Run ./cloudflare-setup.sh first"
    exit 1
fi

# Check if Docker container is running
if ! docker ps | grep -q "ud-app"; then
    echo "⚠️  UD container is not running. Starting it first..."
    cd /home/omanjaya/Project/UD
    docker compose up -d
    sleep 5
    echo "✅ Container started!"
    echo ""
fi

echo "🚀 Starting Cloudflare Quick Tunnel..."
echo "This will generate a temporary HTTPS URL (no domain needed)"
echo ""
echo "⚠️  Note: URL will change each restart (use named tunnel for permanent URL)"
echo ""
echo "📝 Press Ctrl+C to stop the tunnel"
echo ""
echo "----------------------------------------"
echo ""

# Start quick tunnel
cloudflared tunnel --url http://localhost:3020
