# 📱 Panduan Akses Mobile

## Cara Membuka Aplikasi di HP/Tablet

### 1️⃣ Persiapan

Pastikan:
- ✅ Server sudah berjalan di komputer
- ✅ HP dan komputer terhubung ke **WiFi yang sama**
- ✅ Firewall tidak memblokir port 3000

### 2️⃣ Cari IP Address Komputer

**Windows:**
```bash
ipconfig
```
Cari bagian **"IPv4 Address"** (contoh: `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
```
atau
```bash
ip addr show
```

### 3️⃣ Jalankan Server

```bash
npm start
```

Server akan menampilkan:
```
Server berjalan di http://localhost:3000
Untuk akses dari mobile, gunakan: http://[IP-ADDRESS]:3000
```

### 4️⃣ Buka di Mobile Browser

Di HP, buka browser (Chrome/Safari/Firefox) dan ketik:

```
http://192.168.1.100:3000
```

*(Ganti `192.168.1.100` dengan IP address komputer Anda)*

---

## 🔧 Troubleshooting

### ❌ Tidak bisa akses dari HP

**1. Cek Firewall Windows**

Buka PowerShell sebagai Administrator:
```powershell
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**2. Pastikan server listen di semua interface**

Server sudah dikonfigurasi untuk listen di `0.0.0.0` (semua network interfaces).

**3. Cek koneksi WiFi**

Pastikan HP dan komputer di WiFi yang sama:
- Buka **Settings > Network** di komputer
- Buka **Settings > WiFi** di HP
- Nama WiFi harus sama

**4. Test koneksi**

Di komputer, jalankan:
```bash
ping [IP-ADDRESS-HP]
```

Jika tidak bisa ping, ada masalah di jaringan.

---

## 📱 Tips Penggunaan Mobile

### Fitur yang Sudah Responsive:
- ✅ Sidebar otomatis collapse di mobile
- ✅ Tabel menjadi scrollable horizontal
- ✅ Form menyesuaikan lebar layar
- ✅ Modal menjadi fullscreen di layar kecil
- ✅ Touch-friendly buttons

### Navigasi Mobile:
1. **Hamburger Menu** (☰) - Buka/tutup sidebar
2. **Swipe** - Scroll tabel horizontal
3. **Tap & Hold** - Untuk aksi edit/delete

### Rekomendasi Browser:
- **Android**: Chrome, Firefox, Samsung Internet
- **iOS**: Safari, Chrome

---

## 🌐 Akses dari Internet (Opsional)

Jika ingin akses dari luar jaringan lokal:

### Opsi 1: Ngrok (Paling Mudah)

1. Install ngrok: https://ngrok.com/download

2. Jalankan:
```bash
ngrok http 3000
```

3. Gunakan URL yang diberikan (contoh: `https://abc123.ngrok.io`)

### Opsi 2: Port Forwarding

1. Login ke router
2. Buka **Port Forwarding** settings
3. Forward port `3000` ke IP komputer
4. Akses via IP publik router

⚠️ **Perhatian**: Jangan expose database production ke internet tanpa security!

---

## 🔒 Keamanan

Untuk production/akses internet:
- [ ] Tambahkan HTTPS
- [ ] Implementasi authentication
- [ ] Rate limiting
- [ ] Input validation
- [ ] CORS configuration

---

## 📞 Bantuan

Jika masih ada masalah:
1. Cek log server di terminal
2. Cek console browser (F12 > Console)
3. Pastikan tidak ada error di network tab

**Common Issues:**
- `ERR_CONNECTION_REFUSED` → Server belum jalan atau firewall block
- `ERR_NAME_NOT_RESOLVED` → IP address salah
- Halaman blank → Cek console untuk JavaScript errors
