#!/bin/bash

# UD Project - Cloudflare Tunnel Setup Script

set -e

echo "☁️  UD Project - Cloudflare Tunnel Setup"
echo "========================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ Cloudflared is not installed."
    echo "Installing cloudflared..."
    cd /tmp
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    echo qq | sudo -S dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
    echo "✅ Cloudflared installed!"
    echo ""
fi

echo "📋 Step 1: Authenticate with Cloudflare"
echo "----------------------------------------"
echo "A browser window will open for you to login to Cloudflare."
echo "Please authorize cloudflared to access your account."
echo ""
read -p "Press Enter to continue..."

cloudflared tunnel login

echo ""
echo "✅ Authentication successful!"
echo ""

echo "📋 Step 2: Create Tunnel"
echo "------------------------"
echo "Creating tunnel named 'ud-tunnel'..."
echo ""

# Check if tunnel already exists
if cloudflared tunnel list | grep -q "ud-tunnel"; then
    echo "⚠️  Tunnel 'ud-tunnel' already exists."
    TUNNEL_ID=$(cloudflared tunnel list | grep "ud-tunnel" | awk '{print $1}')
    echo "Using existing tunnel ID: $TUNNEL_ID"
else
    cloudflared tunnel create ud-tunnel
    TUNNEL_ID=$(cloudflared tunnel list | grep "ud-tunnel" | awk '{print $1}')
    echo "✅ Tunnel created with ID: $TUNNEL_ID"
fi

echo ""
echo "📋 Step 3: Configure Tunnel"
echo "---------------------------"

# Create config directory if not exists
mkdir -p /home/omanjaya/.cloudflared

# Create tunnel configuration
cat > /home/omanjaya/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_ID
credentials-file: /home/omanjaya/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: YOUR_DOMAIN_HERE
    service: http://localhost:3020
  - service: http_status:404
EOF

echo "✅ Configuration file created at: /home/omanjaya/.cloudflared/config.yml"
echo ""

echo "📋 Step 4: Setup DNS"
echo "--------------------"
echo ""
echo "⚠️  IMPORTANT: You need to configure your domain!"
echo ""
echo "Option 1 (Recommended): Use Cloudflare Quick Tunnel (No domain needed)"
echo "   Run: ./cloudflare-quick.sh"
echo ""
echo "Option 2: Use your own domain"
echo "   1. Edit config: nano /home/omanjaya/.cloudflared/config.yml"
echo "   2. Replace 'YOUR_DOMAIN_HERE' with your domain (e.g., ud.yourdomain.com)"
echo "   3. Run: cloudflared tunnel route dns ud-tunnel YOUR_DOMAIN"
echo "   4. Start tunnel: ./cloudflare-start.sh"
echo ""
echo "📝 Tunnel ID saved to: /home/omanjaya/Project/UD/tmp/cloudflare-tunnel-id.txt"
echo "$TUNNEL_ID" > /home/omanjaya/Project/UD/tmp/cloudflare-tunnel-id.txt

echo ""
echo "✅ Setup complete!"
