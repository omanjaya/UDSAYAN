# Cloudflare Tunnel Setup Guide - UD Project

## 📋 Overview
Cloudflare Tunnel memberikan akses aman ke aplikasi lokal Anda melalui internet dengan SSL gratis, tanpa perlu buka port router.

## 🚀 Quick Start

### Option 1: Quick Tunnel (Paling Mudah - Tidak Perlu Domain)

```bash
./cloudflare-quick.sh
```

**Kelebihan:**
- ✅ Tidak perlu domain
- ✅ SSL/HTTPS otomatis
- ✅ Langsung jalan
- ✅ Tidak ada landing page seperti ngrok

**Kekurangan:**
- ⚠️ URL berubah setiap restart
- ⚠️ Harus tetap berjalan di foreground (tidak bisa background)

### Option 2: Named Tunnel (Recommended untuk Production)

**Keuntungan:**
- ✅ URL tetap (tidak berubah)
- ✅ Bisa jalan di background
- ✅ Bisa pakai domain custom
- ✅ SSL gratis dari Cloudflare
- ✅ DDoS protection
- ✅ Unlimited bandwidth

**Langkah-langkah:**

#### 1. Setup Tunnel (Pertama Kali)
```bash
./cloudflare-setup.sh
```

Script ini akan:
- Login ke Cloudflare (browser akan terbuka)
- Membuat tunnel bernama "ud-tunnel"
- Generate credentials

#### 2. Pilih salah satu:

**A. Tanpa Domain Custom (Pakai trycloudflare.com)**
Jalankan quick tunnel seperti Option 1

**B. Dengan Domain Custom**

Edit konfigurasi:
```bash
nano ~/.cloudflared/config.yml
```

Ubah `YOUR_DOMAIN_HERE` menjadi subdomain Anda, contoh:
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/omanjaya/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: ud.yourdomain.com
    service: http://localhost:3020
  - service: http_status:404
```

Setup DNS di Cloudflare:
```bash
cloudflared tunnel route dns ud-tunnel ud.yourdomain.com
```

#### 3. Start Tunnel
```bash
./cloudflare-start.sh
```

## 📊 Management Commands

### Check Status
```bash
cloudflared tunnel list
```

### Stop Tunnel
```bash
./cloudflare-stop.sh
```

### View Logs
```bash
tail -f tmp/cloudflare.log
```

### Restart Tunnel
```bash
./cloudflare-stop.sh
./cloudflare-start.sh
```

## 🌐 Perbandingan dengan Ngrok

| Feature | Ngrok (Free) | Cloudflare Tunnel |
|---------|-------------|-------------------|
| SSL/HTTPS | ✅ | ✅ |
| Domain Custom | ❌ | ✅ |
| URL Tetap | ❌ | ✅ (named tunnel) |
| Bandwidth | Terbatas | Unlimited |
| Landing Page | Ada | Tidak ada |
| DDoS Protection | Terbatas | ✅ |
| Harga | Gratis | Gratis |

## 🔧 Troubleshooting

### "Failed to authenticate"
Jalankan ulang:
```bash
cloudflared tunnel login
```

### "Tunnel already exists"
Cek daftar tunnel:
```bash
cloudflared tunnel list
```

Delete tunnel lama (jika perlu):
```bash
cloudflared tunnel delete ud-tunnel
```

### "Connection refused"
Pastikan Docker container berjalan:
```bash
docker compose ps
```

### Melihat semua tunnel yang ada
```bash
cloudflared tunnel list
```

### Delete tunnel
```bash
cloudflared tunnel delete TUNNEL_NAME
```

## 📝 Files Location

**Cloudflare Config:**
- `~/.cloudflared/config.yml` - Konfigurasi tunnel
- `~/.cloudflared/*.json` - Credentials file
- `~/.cloudflared/cert.pem` - Certificate (after login)

**Project Scripts:**
- `/home/omanjaya/Project/UD/cloudflare-setup.sh` - Setup awal
- `/home/omanjaya/Project/UD/cloudflare-quick.sh` - Quick tunnel
- `/home/omanjaya/Project/UD/cloudflare-start.sh` - Start named tunnel
- `/home/omanjaya/Project/UD/cloudflare-stop.sh` - Stop tunnel

**Logs:**
- `/home/omanjaya/Project/UD/tmp/cloudflare.log` - Tunnel logs
- `/home/omanjaya/Project/UD/tmp/cloudflare.pid` - Process ID

## 💡 Tips

1. **Untuk Testing/Demo:**
   - Gunakan Quick Tunnel (`./cloudflare-quick.sh`)
   - Tidak perlu setup domain

2. **Untuk Production:**
   - Gunakan Named Tunnel dengan domain custom
   - Tambahkan domain di Cloudflare Dashboard terlebih dahulu
   - Setup DNS routing

3. **Security:**
   - Cloudflare otomatis memberikan DDoS protection
   - Traffic terenkripsi end-to-end
   - Bisa tambahkan Cloudflare Access untuk authentication

4. **Multiple Services:**
   Edit `~/.cloudflared/config.yml` untuk routing multiple services:
   ```yaml
   ingress:
     - hostname: app.yourdomain.com
       service: http://localhost:3020
     - hostname: api.yourdomain.com
       service: http://localhost:8080
     - service: http_status:404
   ```

## 🔄 Auto-Start on Boot

Untuk auto-start saat boot:
```bash
sudo cloudflared service install
```

## 📞 Resources

- Cloudflare Tunnel Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Cloudflare Dashboard: https://dash.cloudflare.com
- Zero Trust Dashboard: https://one.dash.cloudflare.com

## 🆚 Kapan Pakai Apa?

**Pakai Ngrok jika:**
- Hanya untuk testing cepat
- Tidak masalah dengan landing page
- Tidak perlu URL tetap

**Pakai Cloudflare Quick Tunnel jika:**
- Testing/demo
- Tidak punya domain
- Tidak mau landing page ngrok

**Pakai Cloudflare Named Tunnel jika:**
- Production use
- Punya domain custom
- Butuh URL tetap
- Butuh bandwidth unlimited
- Butuh DDoS protection
