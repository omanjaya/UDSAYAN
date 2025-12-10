#!/bin/bash

# UD Project - Docker Setup Script
# This script sets up and runs the Docker containers

set -e

echo "🐳 UD Project - Docker Setup"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
echo qq | sudo -S docker compose down 2>/dev/null || true

# Remove old images (optional)
read -p "Do you want to remove old images? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing old images..."
    echo qq | sudo -S docker compose down --rmi all 2>/dev/null || true
fi

# Build and start containers
echo ""
echo "🔨 Building Docker images..."
echo qq | sudo -S docker compose build

echo ""
echo "🚀 Starting containers..."
echo qq | sudo -S docker compose up -d

# Show status
echo ""
echo "✅ Docker setup complete!"
echo ""
echo "📊 Container Status:"
echo qq | sudo -S docker compose ps

echo ""
echo "📝 Useful commands:"
echo "  View logs:        docker compose logs -f"
echo "  Stop containers:  docker compose down"
echo "  Restart:          docker compose restart"
echo "  Shell access:     docker compose exec ud-app sh"
echo ""
echo "🌐 Application is running at: http://localhost:3020"
