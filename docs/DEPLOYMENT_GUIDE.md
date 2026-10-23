# ☁️ Panduan Deployment VPS Produksi & Operasional
### Pondok Pesantren Al-Hamid (Sekolah-Info)

Dokumen ini adalah buku panduan operasional (*production runbook*) lengkap untuk melakukan provisioning server baru, konfigurasi database, deployment aplikasi web & backend, serta prosedur pemeliharaan harian (*safe sync*) di server VPS **Ubuntu 24.04 LTS (IDCloudHost / Cloud Provider)**.

---

## 📋 1. Spesifikasi Server yang Direkomendasikan

| Komponen | Spesifikasi Minimum | Spesifikasi Rekomendasi (500+ Santri) |
|---|---|---|
| **OS** | Ubuntu 22.04 / 24.04 LTS 64-bit | Ubuntu 24.04 LTS 64-bit |
| **CPU** | 2 vCPU Core | 4 vCPU Core |
| **RAM** | 2 GB (dengan 2GB Swap) | 4 GB - 8 GB |
| **Storage** | 20 GB SSD / NVMe | 40 GB+ NVMe SSD |
| **Bandwidth** | 100 Mbps Shared | 1 Gbps Unmetered |
| **Firewall** | Port 22 (SSH), 80 (HTTP), 443 (HTTPS) | UFW Firewall terkonfigurasi |

---

## 🚀 2. Instalasi Otomatis via `setup-vps.sh`

Di repositori ini telah disediakan skrip otomatisasi [`setup-vps.sh`](file:///d:/source/sekolah-info/setup-vps.sh) untuk menginstal Node.js 20 LTS, PostgreSQL, Nginx, PM2, Certbot SSL, Git, dan UFW Firewall dalam satu langkah.

### Langkah Eksekusi di VPS:
1. Masuk ke VPS melalui terminal SSH:
   ```bash
   ssh root@ip_address_vps
   ```
2. Salin atau unduh file `setup-vps.sh` ke direktori home VPS:
   ```bash
   chmod +x setup-vps.sh
   ./setup-vps.sh
   ```
3. Skrip akan menyelesaikan seluruh paket dependensi sistem secara otomatis.

---

## 🗄️ 3. Konfigurasi Database PostgreSQL

Setelah instalasi selesai, buat pengguna dan database PostgreSQL:

```bash
# Masuk ke prompt PostgreSQL
sudo -u postgres psql

# Buat user dan database khusus aplikasi
CREATE DATABASE sekolah_info;
CREATE USER alhamid_admin WITH ENCRYPTED PASSWORD 'PasswordSuperKuatDanAman123!';
GRANT ALL PRIVILEGES ON DATABASE sekolah_info TO alhamid_admin;
ALTER DATABASE sekolah_info OWNER TO alhamid_admin;

# Berikan hak skema di PostgreSQL 15+
\c sekolah_info
GRANT ALL ON SCHEMA public TO alhamid_admin;
\q
```

---

## 📥 4. Kloning Repositori & Persiapan Direktori

Posisikan proyek pada direktori standar `/var/www/sekolah-info`:

```bash
# Kloning repositori
sudo mkdir -p /var/www/sekolah-info
sudo chown -R $USER:$USER /var/www/sekolah-info
git clone https://github.com/rijalumami000-ai/manajemen-administrasi-alhamid.git /var/www/sekolah-info
cd /var/www/sekolah-info

# Install seluruh dependensi
npm install
cd keuangan && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## ⚙️ 5. Konfigurasi Environment (`.env`) Produksi

Buat file `.env` di `/var/www/sekolah-info/.env`:

```bash
nano .env
```

Isi dengan konfigurasi produksi berikut:

```env
# ─── Server Configuration ───────────────────
NODE_ENV=production
PORT=3000

# ─── PostgreSQL Connection ──────────────────
PGHOST=localhost
PGUSER=alhamid_admin
PGPASSWORD=PasswordSuperKuatDanAman123!
PGDATABASE=sekolah_info
PGPORT=5432

# ─── JWT Authentication (WAJIB ACAK & KUAT) ──
# Dibuat via: openssl rand -base64 48
JWT_SECRET=v9xP82mLkQrT4uWzY1aB5cE7dF0gH3jK6nP9sV2xY5zA8cD1fG4hJ7
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# ─── CORS Origins ────────────────────────────
CORS_ORIGINS=https://pesantren-alhamid.com,https://www.pesantren-alhamid.com
```

---

## 🔨 6. Kompilasi & Migrasi Database

Lakukan kompilasi modul TypeScript dan jalankan migrasi master:

```bash
cd /var/www/sekolah-info

# 1. Kompilasi modul keuangan
npm run keuangan:build

# 2. Jalankan seluruh migrasi database (idempotent & aman)
npm run migrate

# 3. Bangun frontend web (dist)
cd frontend
npm run build
cd ..
```
*Hasil build frontend akan tersimpan di `/var/www/sekolah-info/frontend/dist`.*

---

## 🔄 7. Konfigurasi PM2 Process Manager

Gunakan PM2 untuk menjaga backend Express tetap aktif 24/7 dan hidup kembali secara otomatis saat server reboot:

```bash
cd /var/www/sekolah-info

# Menjalankan aplikasi dengan nama "alhamid-backend"
pm2 start server.js --name "alhamid-backend"

# Simpan daftar proses agar otomatis aktif setelah reboot
pm2 save
pm2 startup
```
*(Jalankan perintah sudo yang disarankan oleh output `pm2 startup`).*

---

## 🌐 8. Konfigurasi Nginx & Sertifikat SSL

Buat file konfigurasi virtual host Nginx:

```bash
sudo nano /etc/nginx/sites-available/sekolah-info
```

Masukkan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name pesantren-alhamid.com www.pesantren-alhamid.com;

    # Batas ukuran payload upload foto/berkas
    client_max_body_size 20M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # 1. Frontend Web SPA
    location / {
        root /var/www/sekolah-info/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache static assets (JS, CSS, Font, Image)
        location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
            expires 1y;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }

    # 2. Uploads Directory
    location /uploads/ {
        alias /var/www/sekolah-info/public/uploads/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # 3. Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
```

Aktifkan konfigurasi dan pasang SSL Let's Encrypt:

```bash
# Aktifkan site
sudo ln -s /etc/nginx/sites-available/sekolah-info /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Pasang SSL gratis via Certbot
sudo certbot --nginx -d pesantren-alhamid.com -d www.pesantren-alhamid.com
```

---

## 🔁 9. Prosedur Sinkronisasi & Pembaruan Produksi (Safe Sync)

Saat melakukan pembaruan kode dari repositori GitHub ke server VPS, lakukan langkah-langkah terukur berikut:

```bash
cd /var/www/sekolah-info

# 1. Ambil update terbaru dari Git
git pull origin main

# 2. Update dependensi jika ada perubahan package.json
npm install
cd keuangan && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Kompilasi ulang modul keuangan
npm run keuangan:build

# 4. Jalankan migrasi database jika ada skrip baru
npm run migrate

# 5. Bangun ulang frontend web
cd frontend && npm run build && cd ..

# 6. Restart backend tanpa downtime
pm2 reload alhamid-backend

echo "✅ Pembaruan sistem selesai dengan aman!"
```

---

## 💾 10. Backup Database Otomatis (Cron Job)

Buat skrip backup harian database PostgreSQL:

```bash
sudo nano /usr/local/bin/backup-alhamid-db.sh
```

Isi skrip:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/alhamid-db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

# Dump database PostgreSQL
PGPASSWORD="PasswordSuperKuatDanAman123!" pg_dump -U alhamid_admin -h localhost sekolah_info | gzip > "$BACKUP_DIR/sekolah_info_$TIMESTAMP.sql.gz"

# Hapus backup yang lebih lama dari 30 hari
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
```

Beri izin eksekusi dan pasang di crontab:
```bash
sudo chmod +x /usr/local/bin/backup-alhamid-db.sh

# Buka crontab
sudo crontab -e
# Tambahkan baris ini (berjalan otomatis setiap jam 02:00 pagi):
0 2 * * * /usr/local/bin/backup-alhamid-db.sh
```

---

## 🔍 11. Troubleshooting & Diagnosis Cepat

| Gejala Error | Kemungkinan Penyebab | Tindakan Solusi |
|---|---|---|
| **502 Bad Gateway** | Backend Node.js mati / port 3000 tidak merespons | Cek log PM2: `pm2 logs alhamid-backend` |
| **Database Connection Refused** | PostgreSQL service mati atau kredensial `.env` salah | Cek status: `sudo systemctl status postgresql` dan verifikasi file `.env` |
| **CORS Error di Mobile App** | Domain atau IP HP belum masuk whitelist | Tambahkan IP lokal atau origin di `CORS_ORIGINS` pada `.env` |
| **Out of Memory (OOM)** | RAM server penuh | Tambahkan 2GB swap file: `sudo fallocate -l 2G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |

---

*Buku panduan ini menjamin sistem Sekolah-Info beroperasi stabil, aman, dan berkesinambungan di lingkungan produksi.* 🛡️🚀
