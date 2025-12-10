#!/bin/bash

# UD Project - Ngrok Setup Script
# This script configures and starts ngrok tunnel for the application

set -e

echo "🌐 UD Project - Ngrok Setup"
echo "============================"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok is not installed. Please install ngrok first."
    exit 1
fi

# Check if authtoken is configured
if ! ngrok config check &> /dev/null; then
    echo "⚠️  Ngrok authtoken not configured."
    echo ""
    echo "To get your authtoken:"
    echo "1. Sign up at https://dashboard.ngrok.com/signup"
    echo "2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo ""
    read -p "Enter your ngrok authtoken: " NGROK_TOKEN
    
    if [ -z "$NGROK_TOKEN" ]; then
        echo "❌ No authtoken provided. Exiting."
        exit 1
    fi
    
    echo ""
    echo "📝 Configuring ngrok authtoken..."
    ngrok config add-authtoken "$NGROK_TOKEN"
    echo "✅ Authtoken configured!"
    echo ""
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

echo "🚀 Starting ngrok tunnel for port 3020..."
echo ""
echo "📝 Ngrok will create a public URL for your application."
echo "   Press Ctrl+C to stop the tunnel."
echo ""
echo "----------------------------------------"

# Start ngrok tunnel
ngrok http 3020
