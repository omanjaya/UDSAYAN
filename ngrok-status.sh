#!/bin/bash

# UD Project - Check Ngrok Status Script

NGROK_PID_FILE="/home/omanjaya/Project/UD/tmp/ngrok.pid"
NGROK_URL_FILE="/home/omanjaya/Project/UD/tmp/ngrok-url.txt"
NGROK_LOG="/home/omanjaya/Project/UD/tmp/ngrok.log"

echo "📊 Ngrok Status"
echo "==============="
echo ""

if [ -f "$NGROK_PID_FILE" ]; then
    NGROK_PID=$(cat "$NGROK_PID_FILE")
    
    if ps -p "$NGROK_PID" > /dev/null 2>&1; then
        echo "✅ Status: Running (PID: $NGROK_PID)"
        echo ""
        
        if [ -f "$NGROK_URL_FILE" ]; then
            echo "📍 Public URL:"
            cat "$NGROK_URL_FILE"
            echo ""
        fi
        
        echo "📊 Dashboard: http://localhost:4040"
        echo "📝 Logs: $NGROK_LOG"
        echo ""
        echo "💡 Commands:"
        echo "   Stop tunnel:  ./ngrok-stop.sh"
        echo "   View logs:    tail -f $NGROK_LOG"
    else
        echo "❌ Status: Not running (stale PID: $NGROK_PID)"
        rm -f "$NGROK_PID_FILE"
    fi
else
    echo "❌ Status: Not running"
    echo ""
    echo "💡 To start:"
    echo "   Interactive:  ./ngrok-setup.sh"
    echo "   Background:   ./ngrok-background.sh"
fi
