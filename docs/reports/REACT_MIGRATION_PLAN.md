# Rencana Migrasi ke React

## 📋 Ringkasan

Dokumen ini menjelaskan rencana lengkap migrasi aplikasi **SI Internal Pesantren** dari HTML/CSS/JavaScript vanilla ke **React** dengan setup modern menggunakan **Vite**.

## 🎯 Tujuan Migrasi

1. **Komponen Reusable**: Membuat komponen UI yang dapat digunakan kembali
2. **State Management**: Mengelola state aplikasi dengan lebih terstruktur
3. **Developer Experience**: Meningkatkan produktivitas dengan hot reload dan tooling modern
4. **Maintainability**: Kode lebih mudah dipelihara dan di-scale
5. **Type Safety** (opsional): Persiapan untuk TypeScript di masa depan

## 🏗️ Arsitektur Target

```
sekolah-info-react/
├── backend/                    # Backend tetap sama (Node.js + Express)
│   ├── src/
│   │   ├── database/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── server.js
│   └── package.json
│
├── frontend/                   # React App (NEW)
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── components/        # Komponen UI reusable
│   │   │   ├── common/        # Button, Modal, Table, dll
│   │   │   ├── layout/        # Header, Sidebar, Layout
│   │   │   └── features/      # Komponen spesifik fitur
│   │   ├── pages/             # Halaman utama
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Santri.jsx
│   │   │   ├── Guru.jsx
│   │   │   ├── Alumni.jsx
│   │   │   ├── Kelas.jsx
│   │   │   ├── Kamar.jsx
│   │   │   ├── PelanggaranPrestasi.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Login.jsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useFetch.js
│   │   │   ├── usePagination.js
│   │   │   └── useModal.js
│   │   ├── services/          # API calls
│   │   │   ├── api.js
│   │   │   ├── santriService.js
│   │   │   ├── guruService.js
│   │   │   ├── alumniService.js
│   │   │   └── authService.js
│   │   ├── context/           # React Context untuk state global
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── utils/             # Helper functions
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   └── constants.js
│   │   ├── styles/            # CSS/SCSS
│   │   │   ├── base.css
│   │   │   ├── components.css
│   │   │   └── variables.css
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── docs/
    └── REACT_MIGRATION_PLAN.md
```

## 📦 Tech Stack

### Frontend (NEW)
- **React 18**: Library UI
- **Vite**: Build tool & dev server (lebih cepat dari CRA)
- **React Router v6**: Routing
- **Axios**: HTTP client
- **React Hook Form**: Form handling
- **date-fns**: Date formatting
- **CSS Modules** atau **Styled Components**: Styling (pilihan)

### Backend (TETAP SAMA)
- Node.js + Express
- PostgreSQL
- JWT Authentication

## 🚀 Fase Migrasi

### **Fase 0: Persiapan** (1-2 hari)
- [ ] Setup project React dengan Vite
- [ ] Konfigurasi proxy untuk development
- [ ] Setup routing dasar
- [ ] Migrasi CSS ke struktur baru
- [ ] Setup authentication context

### **Fase 1: Layout & Auth** (2-3 hari)
- [ ] Komponen Layout (Header, Sidebar, Main)
- [ ] Halaman Login
- [ ] Protected Routes
- [ ] Auth Context & hooks
- [ ] Logout functionality

### **Fase 2: Dashboard** (1 hari)
- [ ] Halaman Dashboard
- [ ] Summary cards
- [ ] API integration untuk summary

### **Fase 3: Fitur Santri** (3-4 hari)
- [ ] Halaman Santri
- [ ] Tabel Santri dengan pagination
- [ ] Filter & search
- [ ] Modal tambah/edit Santri
- [ ] CRUD operations
- [ ] Tahun Ajaran management
- [ ] Migrasi tahun ajaran

### **Fase 4: Fitur Kelas & Kamar** (2 hari)
- [ ] Halaman Kelas
- [ ] Card view untuk kelas
- [ ] CRUD Kelas
- [ ] Halaman Kamar
- [ ] Card view untuk kamar
- [ ] CRUD Kamar

### **Fase 5: Fitur Guru** (3 hari)
- [ ] Halaman Guru dengan tabs
- [ ] Tab Guru (table + CRUD)
- [ ] Tab Mata Pelajaran
- [ ] Tab Jabatan
- [ ] Filter & search

### **Fase 6: Pelanggaran & Prestasi** (2-3 hari)
- [ ] Halaman Pelanggaran & Prestasi
- [ ] Tab Pelanggaran
- [ ] Tab Prestasi
- [ ] Autocomplete Santri
- [ ] CRUD operations

### **Fase 7: Alumni** (2-3 hari)
- [ ] Halaman Alumni
- [ ] List view dengan filter
- [ ] Detail view dengan tabs
- [ ] CRUD operations
- [ ] Export functionality

### **Fase 8: User Management & Profile** (2 hari)
- [ ] Halaman User Management (Admin only)
- [ ] Halaman Profile
- [ ] Change password
- [ ] Role-based access

### **Fase 9: Polish & Testing** (2-3 hari)
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications
- [ ] Responsive design check
- [ ] Performance optimization
- [ ] Testing manual

### **Fase 10: Deployment** (1 hari)
- [ ] Build production
- [ ] Setup environment variables
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Testing production

**Total Estimasi: 21-28 hari kerja**

## 🔧 Setup Awal

### 1. Buat Project React dengan Vite

```bash
# Di root project
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### 2. Install Dependencies

```bash
npm install react-router-dom axios date-fns
npm install -D @vitejs/plugin-react
```

### 3. Konfigurasi Vite untuk Proxy

**frontend/vite.config.js:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

### 4. Update Backend untuk CORS

**server.js:**
```javascript
// Tambahkan CORS config
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));
```

### 5. Struktur Folder Awal

```bash
cd frontend/src
mkdir -p components/{common,layout,features}
mkdir -p pages hooks services context utils styles
```

## 📝 Pola Konversi

### Dari Vanilla JS ke React

#### **1. HTML → JSX Component**

**Sebelum (HTML):**
```html
<section id="santri-panel" class="panel">
  <div class="panel-header">
    <h2>Manajemen Data Santri</h2>
    <button id="btn-tambah-santri" class="button">+ Tambah Santri</button>
  </div>
  <div id="santri-table-body"></div>
</section>
```

**Sesudah (React):**
```jsx
function SantriPage() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Manajemen Data Santri</h2>
        <button 
          className="button" 
          onClick={() => setShowModal(true)}
        >
          + Tambah Santri
        </button>
      </div>
      <SantriTable />
      {showModal && <SantriModal onClose={() => setShowModal(false)} />}
    </section>
  );
}
```

#### **2. Event Listeners → Event Handlers**

**Sebelum:**
```javascript
document.getElementById('btn-tambah-santri').addEventListener('click', () => {
  openModal();
});
```

**Sesudah:**
```jsx
<button onClick={handleAddClick}>+ Tambah Santri</button>
```

#### **3. DOM Manipulation → State**

**Sebelum:**
```javascript
function renderSantri(data) {
  const tbody = document.getElementById('santri-table-body');
  tbody.innerHTML = data.map(item => `
    <tr>
      <td>${item.nis}</td>
      <td>${item.nama}</td>
    </tr>
  `).join('');
}
```

**Sesudah:**
```jsx
function SantriTable({ data }) {
  return (
    <tbody>
      {data.map(item => (
        <tr key={item.id}>
          <td>{item.nis}</td>
          <td>{item.nama}</td>
        </tr>
      ))}
    </tbody>
  );
}
```

#### **4. Fetch API → Custom Hook**

**Sebelum:**
```javascript
async function fetchSantri() {
  const response = await fetch('/api/santri');
  const data = await response.json();
  renderSantri(data);
}
```

**Sesudah:**
```jsx
// hooks/useFetch.js
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// Penggunaan
function SantriPage() {
  const { data, loading, error } = useFetch('/api/santri');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <SantriTable data={data} />;
}
```

## 🎨 Komponen Reusable

### 1. Button Component
```jsx
// components/common/Button.jsx
export function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled,
  ...props 
}) {
  return (
    <button
      className={`button button-${variant}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 2. Modal Component
```jsx
// components/common/Modal.jsx
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

### 3. Table Component
```jsx
// components/common/Table.jsx
export function Table({ columns, data, onEdit, onDelete }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id}>
              {columns.map(col => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
              <td>
                <button onClick={() => onEdit(row)}>Edit</button>
                <button onClick={() => onDelete(row.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 🔐 Authentication Pattern

```jsx
// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      return { success: true };
    }
    
    return { success: false, error: 'Login failed' };
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## 🛣️ Routing Setup

```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Santri from './pages/Santri';
import Guru from './pages/Guru';
// ... import pages lainnya

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="santri" element={<Santri />} />
            <Route path="guru" element={<Guru />} />
            <Route path="alumni" element={<Alumni />} />
            <Route path="kelas" element={<Kelas />} />
            <Route path="kamar" element={<Kamar />} />
            <Route path="pelanggaran-prestasi" element={<PelanggaranPrestasi />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

## 📊 State Management Strategy

### Local State (useState)
Untuk state yang hanya digunakan dalam satu komponen:
- Form input values
- Modal open/close
- Loading states

### Context API
Untuk state yang digunakan di banyak komponen:
- Authentication state
- Theme/settings
- Notification/toast

### Server State (React Query - opsional)
Untuk data dari API:
- Caching
- Automatic refetching
- Optimistic updates

## 🎯 Best Practices

1. **Komponen Kecil & Fokus**: Satu komponen satu tanggung jawab
2. **Custom Hooks**: Extract logic yang reusable
3. **Prop Types**: Dokumentasi props (atau TypeScript)
4. **Error Boundaries**: Handle error dengan graceful
5. **Code Splitting**: Lazy load pages untuk performa
6. **Accessibility**: Semantic HTML, ARIA labels
7. **Consistent Naming**: camelCase untuk JS, PascalCase untuk components

## 🔄 Migration Checklist

### Pre-Migration
- [ ] Backup kode existing
- [ ] Dokumentasi API endpoints
- [ ] List semua fitur yang ada
- [ ] Setup Git branch untuk React migration

### During Migration
- [ ] Setup React project
- [ ] Migrate CSS
- [ ] Create reusable components
- [ ] Migrate page by page
- [ ] Test each feature after migration
- [ ] Update documentation

### Post-Migration
- [ ] Performance testing
- [ ] Cross-browser testing
- [ ] Mobile responsive check
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Deploy to production

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [React Hook Form](https://react-hook-form.com)

## 🤔 Pertimbangan

### Kapan TIDAK Migrasi ke React?
- Aplikasi sudah stabil dan tidak ada rencana pengembangan besar
- Tim tidak familiar dengan React
- Budget/waktu terbatas
- Aplikasi sangat sederhana

### Alternatif React
- **Vue.js**: Lebih mudah dipelajari, progressive framework
- **Svelte**: Lebih ringan, compile-time framework
- **Alpine.js**: Minimal, untuk interaktivitas sederhana
- **HTMX**: Hypermedia-driven, minimal JavaScript

## 📞 Next Steps

1. **Review dokumen ini** dengan tim
2. **Pilih fase** yang ingin dimulai
3. **Setup environment** development
4. **Mulai dengan Fase 0** (Persiapan)
5. **Iterasi** dan improve seiring berjalannya migrasi

---

**Catatan**: Dokumen ini adalah living document. Update sesuai progress dan learning selama migrasi.

**Dibuat**: 2 Mei 2026  
**Terakhir Update**: 2 Mei 2026
