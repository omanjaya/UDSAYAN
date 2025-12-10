#!/bin/bash

# UD Project - Ngrok Background Service Script
# This script runs ngrok in background and saves the public URL

set -e

NGROK_LOG="/home/omanjaya/Project/UD/tmp/ngrok.log"
NGROK_URL_FILE="/home/omanjaya/Project/UD/tmp/ngrok-url.txt"
NGROK_PID_FILE="/home/omanjaya/Project/UD/tmp/ngrok.pid"

# Create tmp directory if not exists
mkdir -p /home/omanjaya/Project/UD/tmp

echo "🌐 Starting ngrok tunnel in background..."

# Check if ngrok is already running
if [ -f "$NGROK_PID_FILE" ]; then
    OLD_PID=$(cat "$NGROK_PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Ngrok is already running (PID: $OLD_PID)"
        echo ""
        if [ -f "$NGROK_URL_FILE" ]; then
            echo "📍 Current public URL:"
            cat "$NGROK_URL_FILE"
        fi
        exit 0
    else
        rm -f "$NGROK_PID_FILE"
    fi
fi

# Start ngrok in background
nohup ngrok http 3020 --log=stdout > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!
echo $NGROK_PID > "$NGROK_PID_FILE"

echo "✅ Ngrok started (PID: $NGROK_PID)"
echo "⏳ Waiting for tunnel to establish..."
sleep 3

# Get public URL from ngrok API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://.*' | head -1)

if [ -n "$NGROK_URL" ]; then
    echo "$NGROK_URL" > "$NGROK_URL_FILE"
    echo ""
    echo "✅ Ngrok tunnel established!"
    echo ""
    echo "📍 Public URL: $NGROK_URL"
    echo "📊 Ngrok Dashboard: http://localhost:4040"
    echo "📝 Logs: $NGROK_LOG"
    echo ""
    echo "To stop ngrok: kill $NGROK_PID"
    echo "Or run: kill \$(cat $NGROK_PID_FILE)"
else
    echo "❌ Failed to get ngrok URL. Check logs at: $NGROK_LOG"
    echo ""
    echo "Common issues:"
    echo "1. Authtoken not configured - run: ngrok config add-authtoken YOUR_TOKEN"
    echo "2. Port 3020 not accessible"
    echo "3. Network connectivity issues"
    exit 1
fi
