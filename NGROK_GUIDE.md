# Ngrok Setup Guide - UD Project

## 📋 Overview
Ngrok allows your local application to be accessible from the internet through a secure tunnel.

## 🚀 Quick Start

### 1. Get Ngrok Authtoken (First Time Only)
1. Sign up at https://dashboard.ngrok.com/signup
2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure it:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

### 2. Start Ngrok Tunnel

#### Option A: Interactive Mode (Recommended for testing)
```bash
./ngrok-setup.sh
```
- Shows real-time traffic
- Press Ctrl+C to stop
- Good for debugging

#### Option B: Background Mode (Recommended for production)
```bash
./ngrok-background.sh
```
- Runs in background
- Saves public URL to file
- Auto-starts if not running

## 📊 Management Commands

### Check Status
```bash
./ngrok-status.sh
```
Shows:
- Running status
- Public URL
- PID and logs location

### Stop Tunnel
```bash
./ngrok-stop.sh
```

### View Logs
```bash
tail -f tmp/ngrok.log
```

### Get Current URL
```bash
cat tmp/ngrok-url.txt
```

## 🌐 Access Points

Once ngrok is running:
- **Public URL**: Check with `./ngrok-status.sh` or `cat tmp/ngrok-url.txt`
- **Ngrok Dashboard**: http://localhost:4040
- **Local App**: http://localhost:3020

## 🔧 Troubleshooting

### "Authtoken not configured"
Run:
```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### "Port already in use"
Check if ngrok is already running:
```bash
./ngrok-status.sh
```

### "Failed to get ngrok URL"
1. Check if Docker container is running:
   ```bash
   docker compose ps
   ```
2. Check ngrok logs:
   ```bash
   cat tmp/ngrok.log
   ```

### Restart Everything
```bash
./ngrok-stop.sh
docker compose restart
sleep 5
./ngrok-background.sh
```

## 📝 Files Location

- **Scripts**: `/home/omanjaya/Project/UD/`
  - `ngrok-setup.sh` - Interactive setup
  - `ngrok-background.sh` - Background runner
  - `ngrok-stop.sh` - Stop tunnel
  - `ngrok-status.sh` - Check status

- **Data**: `/home/omanjaya/Project/UD/tmp/`
  - `ngrok.log` - Ngrok logs
  - `ngrok-url.txt` - Current public URL
  - `ngrok.pid` - Process ID

## 💡 Tips

1. **Free Plan Limits**:
   - 1 online tunnel
   - URL changes on restart
   - No custom domains

2. **Keep URL Persistent**:
   - Don't restart ngrok unnecessarily
   - Use background mode for stability

3. **Security**:
   - Don't share your authtoken
   - Monitor traffic via dashboard (localhost:4040)
   - Use HTTPS URL from ngrok

4. **Production Use**:
   - Consider ngrok paid plan for custom domains
   - Or use proper hosting for production apps

## 🔄 Auto-Start on Boot (Optional)

To start ngrok automatically on system boot, create a systemd service or add to startup applications.

## 📞 Support

- Ngrok Docs: https://ngrok.com/docs
- Ngrok Dashboard: https://dashboard.ngrok.com
