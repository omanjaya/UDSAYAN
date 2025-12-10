#!/bin/bash

# UD Project - Start Cloudflare Tunnel (Named Tunnel)

CLOUDFLARE_PID_FILE="/home/omanjaya/Project/UD/tmp/cloudflare.pid"
CLOUDFLARE_LOG="/home/omanjaya/Project/UD/tmp/cloudflare.log"

echo "☁️  Starting Cloudflare Tunnel..."

# Create tmp directory if not exists
mkdir -p /home/omanjaya/Project/UD/tmp

# Check if tunnel is already running
if [ -f "$CLOUDFLARE_PID_FILE" ]; then
    OLD_PID=$(cat "$CLOUDFLARE_PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Cloudflare tunnel is already running (PID: $OLD_PID)"
        exit 0
    else
        rm -f "$CLOUDFLARE_PID_FILE"
    fi
fi

# Check if config exists
if [ ! -f "/home/omanjaya/.cloudflared/config.yml" ]; then
    echo "❌ Configuration not found. Run ./cloudflare-setup.sh first"
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

# Start tunnel in background
nohup cloudflared tunnel run ud-tunnel > "$CLOUDFLARE_LOG" 2>&1 &
CLOUDFLARE_PID=$!
echo $CLOUDFLARE_PID > "$CLOUDFLARE_PID_FILE"

sleep 3

if ps -p "$CLOUDFLARE_PID" > /dev/null 2>&1; then
    echo "✅ Cloudflare tunnel started (PID: $CLOUDFLARE_PID)"
    echo "📝 Logs: $CLOUDFLARE_LOG"
    echo ""
    echo "To view logs: tail -f $CLOUDFLARE_LOG"
    echo "To stop: ./cloudflare-stop.sh"
else
    echo "❌ Failed to start tunnel. Check logs: $CLOUDFLARE_LOG"
    rm -f "$CLOUDFLARE_PID_FILE"
    exit 1
fi
