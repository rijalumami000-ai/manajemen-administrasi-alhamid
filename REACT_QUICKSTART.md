# 🚀 React Quick Start Guide

## Menjalankan Aplikasi React

### 1. Install Dependencies (Pertama Kali)

```bash
# Install dependencies root (backend)
npm install

# Install dependencies frontend
cd frontend
npm install
cd ..
```

### 2. Jalankan Aplikasi

**Option A: Jalankan Backend & Frontend Sekaligus (Recommended)**

```bash
npm run dev:all
```

**Option B: Jalankan Terpisah**

Terminal 1 (Backend):
```bash
npm run backend
```

Terminal 2 (Frontend):
```bash
npm run frontend
```

### 3. Akses Aplikasi

- **React Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000

## 📝 Login Credentials

Gunakan credentials yang sudah ada di database Anda.

Default (jika menggunakan data seed):
- Username: `admin`
- Password: (sesuai database)

## 🎯 Apa yang Sudah Berfungsi?

✅ **Login Page** - Fully functional  
✅ **Dashboard** - Menampilkan summary data  
✅ **Layout** - Header & Sidebar navigation  
✅ **Authentication** - Login/logout working  
✅ **Protected Routes** - Redirect ke login jika belum login  

## 🚧 Apa yang Masih Placeholder?

Halaman-halaman ini sudah ada tapi masih placeholder (Coming Soon):
- Santri
- Guru
- Alumni
- Kelas
- Kamar
- Pelanggaran & Prestasi
- User Management
- Profile

## 📚 Dokumentasi Lengkap

- [Migration Plan](docs/REACT_MIGRATION_PLAN.md) - Rencana lengkap migrasi
- [Setup Complete](docs/REACT_SETUP_COMPLETE.md) - Detail setup yang sudah dikerjakan
- [Frontend README](frontend/README.md) - Dokumentasi frontend

## 🐛 Troubleshooting

### Port sudah digunakan

Jika port 3000 atau 3001 sudah digunakan:

**Backend (port 3000):**
Edit `.env`:
```
PORT=3002
```

**Frontend (port 3001):**
Edit `frontend/vite.config.js`:
```javascript
server: {
  port: 3002,
  // ...
}
```

### CORS Error

Pastikan backend sudah running dan CORS dikonfigurasi dengan benar di `server.js`.

### Database Connection Error

Pastikan PostgreSQL running dan credentials di `.env` sudah benar.

## 🎨 Development Workflow

1. **Jalankan dev server**: `npm run dev:all`
2. **Edit code** di `frontend/src/`
3. **Save** - Changes akan auto-reload (HMR)
4. **Test** di browser
5. **Commit** changes

## 📞 Need Help?

Lihat dokumentasi lengkap di folder `docs/` atau baca kode di `frontend/src/`.

---

Happy Coding! 🎉
