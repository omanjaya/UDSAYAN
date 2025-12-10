# Deployment Guide - Mitra Usaha POS

## Prerequisites
- Node.js 20+
- Git
- VPS atau server dengan port 3000 terbuka

---

## Option 1: Deploy Manual (Recommended untuk VPS)

### 1. Clone Repository
```bash
git clone https://github.com/omanjaya/UDSAYAN.git
cd UDSAYAN
```

### 2. Setup Environment
```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env sesuai kebutuhan
nano .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database
```bash
# Generate Prisma Client
npm run db:generate

# Push schema ke database (akan buat file dev.db otomatis)
npm run db:push

# Optional: Seed data awal (jika ada)
# npm run db:seed
```

### 5. Build Production
```bash
npm run build
```

### 6. Start Production Server
```bash
npm start
```

Aplikasi akan jalan di http://localhost:3000

---

## Option 2: Deploy dengan Docker

### 1. Clone Repository
```bash
git clone https://github.com/omanjaya/UDSAYAN.git
cd UDSAYAN
```

### 2. Build dan Run
```bash
docker compose up -d
```

Aplikasi akan jalan di http://localhost:3020

### Management Commands
```bash
# Stop container
docker compose down

# View logs
docker compose logs -f

# Restart
docker compose restart
```

---

## Option 3: Deploy dengan PM2 (Production)

### 1-4. Sama seperti Option 1

### 5. Install PM2
```bash
npm install -g pm2
```

### 6. Start dengan PM2
```bash
# Build dulu
npm run build

# Start dengan PM2
pm2 start npm --name "ud-pos" -- start

# Save PM2 config
pm2 save

# Setup auto-start on reboot
pm2 startup
```

### PM2 Management
```bash
# Status
pm2 status

# Logs
pm2 logs ud-pos

# Restart
pm2 restart ud-pos

# Stop
pm2 stop ud-pos
```

---

## Akses Aplikasi

Setelah deploy, buka browser:
- **Local:** http://localhost:3000
- **VPS:** http://YOUR_VPS_IP:3000

---

## SECURITY WARNING ⚠️

**PENTING:** Aplikasi ini **TIDAK ADA AUTENTIKASI**.

Pastikan:
1. ✅ Deploy di **private network** saja, ATAU
2. ✅ Setup **firewall** untuk block akses dari luar, ATAU
3. ✅ Setup **reverse proxy** (Nginx) dengan basic auth, ATAU
4. ✅ Gunakan **VPN** untuk akses

**JANGAN** expose langsung ke internet!

---

## Troubleshooting

### Error: Prisma Client not generated
```bash
npm run db:generate
```

### Error: Database file not found
```bash
# Pastikan .env sudah benar
cat .env

# Push schema
npm run db:push
```

### Port 3000 sudah dipakai
Edit di `.env`:
```
PORT=3001
```

### Database corrupt
```bash
# Backup dulu (jika ada data)
cp prisma/dev.db prisma/dev.db.backup

# Hapus dan recreate
rm prisma/dev.db
npm run db:push
```

---

## Monitoring

### Check Database
```bash
npm run db:studio
```
Buka http://localhost:5555

### Check Logs (PM2)
```bash
pm2 logs ud-pos
```

### Check Logs (Docker)
```bash
docker compose logs -f
```

---

## Backup Database

### SQLite Backup
```bash
# Backup
cp prisma/dev.db backups/dev.db.$(date +%Y%m%d_%H%M%S)

# Restore
cp backups/dev.db.20250610_120000 prisma/dev.db
```

### Automated Backup (Cron)
```bash
# Edit crontab
crontab -e

# Tambahkan (backup setiap hari jam 2 pagi)
0 2 * * * cp /path/to/UDSAYAN/prisma/dev.db /path/to/backups/dev.db.$(date +\%Y\%m\%d)
```

---

## Upgrade ke PostgreSQL (Optional)

Untuk production dengan >5 users, disarankan pakai PostgreSQL:

1. Install PostgreSQL
2. Buat database baru
3. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
4. Update `.env`:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/udpos"
```
5. Migrate:
```bash
npm run db:push
```

---

## Support

Jika ada masalah, check:
- Logs aplikasi
- Database connection
- Port availability
- Firewall rules
