#!/bin/bash

# UD Project - Stop Cloudflare Tunnel

CLOUDFLARE_PID_FILE="/home/omanjaya/Project/UD/tmp/cloudflare.pid"

echo "🛑 Stopping Cloudflare tunnel..."

if [ -f "$CLOUDFLARE_PID_FILE" ]; then
    CLOUDFLARE_PID=$(cat "$CLOUDFLARE_PID_FILE")
    
    if ps -p "$CLOUDFLARE_PID" > /dev/null 2>&1; then
        kill "$CLOUDFLARE_PID"
        rm -f "$CLOUDFLARE_PID_FILE"
        echo "✅ Cloudflare tunnel stopped (PID: $CLOUDFLARE_PID)"
    else
        echo "⚠️  Cloudflare tunnel process not found (PID: $CLOUDFLARE_PID)"
        rm -f "$CLOUDFLARE_PID_FILE"
    fi
else
    echo "⚠️  Cloudflare tunnel is not running"
fi
