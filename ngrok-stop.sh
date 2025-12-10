#!/bin/bash

# UD Project - Stop Ngrok Tunnel Script

NGROK_PID_FILE="/home/omanjaya/Project/UD/tmp/ngrok.pid"
NGROK_URL_FILE="/home/omanjaya/Project/UD/tmp/ngrok-url.txt"

echo "🛑 Stopping ngrok tunnel..."

if [ -f "$NGROK_PID_FILE" ]; then
    NGROK_PID=$(cat "$NGROK_PID_FILE")
    
    if ps -p "$NGROK_PID" > /dev/null 2>&1; then
        kill "$NGROK_PID"
        rm -f "$NGROK_PID_FILE"
        rm -f "$NGROK_URL_FILE"
        echo "✅ Ngrok stopped (PID: $NGROK_PID)"
    else
        echo "⚠️  Ngrok process not found (PID: $NGROK_PID)"
        rm -f "$NGROK_PID_FILE"
        rm -f "$NGROK_URL_FILE"
    fi
else
    echo "⚠️  Ngrok is not running"
fi
