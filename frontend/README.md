# SI Internal Pesantren - React Frontend

Frontend React untuk Sistem Informasi Internal Pesantren.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server (port 3001)
npm run dev
```

Frontend akan berjalan di `http://localhost:3001`

### Build Production

```bash
# Build untuk production
npm run build

# Preview production build
npm run preview
```

## 📁 Struktur Folder

```
src/
├── components/          # Komponen React
│   ├── common/         # Komponen reusable (Button, Modal, Table, dll)
│   ├── layout/         # Layout components (Header, Sidebar, Layout)
│   └── features/       # Komponen spesifik fitur
├── pages/              # Halaman utama
├── hooks/              # Custom React hooks
├── services/           # API services
├── context/            # React Context (Auth, dll)
├── utils/              # Helper functions
└── styles/             # CSS files
```

## 🔧 Konfigurasi

### Proxy API

Vite dikonfigurasi untuk proxy request `/api/*` ke backend di `http://localhost:3000`.

Lihat `vite.config.js` untuk detail.

### Environment Variables

Buat file `.env` jika diperlukan:

```env
VITE_API_URL=http://localhost:3000
```

## 📚 Tech Stack

- **React 19** - UI Library
- **Vite** - Build tool & dev server
- **React Router v6** - Routing
- **Axios** - HTTP client
- **date-fns** - Date formatting

## 🎨 Styling

CSS diorganisir dalam beberapa file:
- `base.css` - Base styles & reset
- `layout.css` - Layout & grid
- `components.css` - Component styles
- `modals.css` - Modal styles
- `features-*.css` - Feature-specific styles

## 🔐 Authentication

Authentication menggunakan Context API (`AuthContext`).

Login state disimpan di cookie (httpOnly) yang dikelola backend.

## 📝 Development Notes

### Menambah Halaman Baru

1. Buat file di `src/pages/NamaHalaman.jsx`
2. Tambahkan route di `src/App.jsx`
3. Tambahkan link di `src/components/layout/Sidebar.jsx`

### Menambah Komponen Reusable

1. Buat file di `src/components/common/NamaKomponen.jsx`
2. Export komponen
3. Import dan gunakan di halaman/komponen lain

### Custom Hooks

Buat custom hooks di `src/hooks/` untuk logic yang reusable:
- `useFetch` - Fetch data dari API
- `useModal` - Manage modal state
- `usePagination` - Pagination logic

## 🐛 Troubleshooting

### Port 3001 sudah digunakan

Edit `vite.config.js` dan ubah port:

```javascript
server: {
  port: 3002, // atau port lain
  // ...
}
```

### CORS Error

Pastikan backend sudah dikonfigurasi untuk allow origin `http://localhost:3001`.

Cek `server.js` di root project.

## 📞 Support

Lihat dokumentasi lengkap di `docs/REACT_MIGRATION_PLAN.md`
