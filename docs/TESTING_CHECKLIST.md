# Testing Checklist - React Migration

**Last Updated**: May 2, 2026

## 🧪 Manual Testing Checklist

### Authentication & Authorization

- [ ] **Login**
  - [ ] Login dengan credentials valid
  - [ ] Login dengan credentials invalid
  - [ ] Error message muncul untuk login gagal
  - [ ] Redirect ke dashboard setelah login sukses
  - [ ] Remember me functionality (jika ada)

- [ ] **Logout**
  - [ ] Logout berhasil
  - [ ] Redirect ke login page
  - [ ] Session cleared
  - [ ] Tidak bisa akses protected routes setelah logout

- [ ] **Protected Routes**
  - [ ] Redirect ke login jika belum login
  - [ ] Bisa akses setelah login
  - [ ] Admin-only routes (Users page)

### Dashboard

- [ ] **Summary Cards**
  - [ ] Total Santri ditampilkan dengan benar
  - [ ] Total Guru ditampilkan dengan benar
  - [ ] Total Kelas ditampilkan dengan benar
  - [ ] Total Kamar ditampilkan dengan benar
  - [ ] Data update setelah perubahan

- [ ] **Loading State**
  - [ ] Loading indicator muncul saat fetch data
  - [ ] Data muncul setelah loading selesai

### Santri Management

- [ ] **List View**
  - [ ] Tabel santri ditampilkan
  - [ ] Data santri lengkap (NIS, Nama, Kelas, Kamar, dll)
  - [ ] Pagination berfungsi
  - [ ] Empty state jika tidak ada data

- [ ] **Search & Filter**
  - [ ] Search by nama berfungsi
  - [ ] Search by NIS berfungsi
  - [ ] Filter kelas diniyah berfungsi
  - [ ] Filter kelas sekolah berfungsi
  - [ ] Filter gender berfungsi
  - [ ] Filter status berfungsi
  - [ ] Filter tahun ajaran berfungsi
  - [ ] Reset filter berfungsi

- [ ] **Create Santri**
  - [ ] Modal terbuka
  - [ ] Form validation berfungsi
  - [ ] Required fields ditandai
  - [ ] Dropdown kelas terisi
  - [ ] Dropdown kamar terisi
  - [ ] Data tersimpan ke database
  - [ ] List update setelah create
  - [ ] Success message muncul

- [ ] **Edit Santri**
  - [ ] Modal terbuka dengan data pre-filled
  - [ ] Data bisa diubah
  - [ ] Validation berfungsi
  - [ ] Update berhasil
  - [ ] List update setelah edit
  - [ ] Success message muncul

- [ ] **Delete Santri**
  - [ ] Confirmation dialog muncul
  - [ ] Delete berhasil
  - [ ] List update setelah delete
  - [ ] Success message muncul

- [ ] **Tahun Ajaran**
  - [ ] Board tahun ajaran ditampilkan
  - [ ] Switch tahun ajaran berfungsi
  - [ ] Migrasi tahun ajaran berfungsi
  - [ ] Archive mode untuk tahun lama

### Kelas Management

- [ ] **List View**
  - [ ] Card kelas ditampilkan
  - [ ] Grouping by jenis (Diniyah & Sekolah)
  - [ ] Sorting berfungsi (A-Z, Z-A, Terbaru, Terlama)
  - [ ] Empty state jika tidak ada data

- [ ] **Create Kelas**
  - [ ] Modal terbuka
  - [ ] Validation berfungsi
  - [ ] Data tersimpan
  - [ ] List update
  - [ ] Success message

- [ ] **Edit Kelas**
  - [ ] Modal terbuka dengan data
  - [ ] Update berhasil
  - [ ] List update

- [ ] **Delete Kelas**
  - [ ] Confirmation dialog
  - [ ] Delete berhasil
  - [ ] List update

### Kamar Management

- [ ] **List View**
  - [ ] Card kamar ditampilkan
  - [ ] Capacity tracking (terisi/kapasitas)
  - [ ] Status badges (Tersedia/Penuh/Maintenance)
  - [ ] Jenis badges (Putra/Putri)
  - [ ] Empty state

- [ ] **Create Kamar**
  - [ ] Modal terbuka
  - [ ] Validation berfungsi
  - [ ] Data tersimpan
  - [ ] List update

- [ ] **Edit Kamar**
  - [ ] Modal terbuka dengan data
  - [ ] Update berhasil
  - [ ] List update

- [ ] **Delete Kamar**
  - [ ] Confirmation dialog
  - [ ] Delete berhasil
  - [ ] List update

### Guru Management

- [ ] **Tab System**
  - [ ] Switch between tabs (Guru, Mata Pelajaran, Jabatan)
  - [ ] Tab counts update
  - [ ] Context-aware buttons

- [ ] **Guru CRUD**
  - [ ] List guru ditampilkan
  - [ ] Search & filter berfungsi
  - [ ] Pagination berfungsi
  - [ ] Create guru berhasil
  - [ ] Edit guru berhasil
  - [ ] Delete guru berhasil

- [ ] **Mata Pelajaran CRUD**
  - [ ] List mata pelajaran ditampilkan
  - [ ] Create berhasil
  - [ ] Edit berhasil
  - [ ] Delete berhasil
  - [ ] Dropdown guru update setelah perubahan

- [ ] **Jabatan CRUD**
  - [ ] List jabatan ditampilkan
  - [ ] Create berhasil
  - [ ] Edit berhasil
  - [ ] Delete berhasil
  - [ ] Dropdown guru update setelah perubahan

### Pelanggaran & Prestasi

- [ ] **Tab System**
  - [ ] Switch between tabs
  - [ ] Tab counts update

- [ ] **Santri Autocomplete**
  - [ ] Search santri by NIS berfungsi
  - [ ] Search santri by nama berfungsi
  - [ ] Dropdown suggestions muncul
  - [ ] Select santri berfungsi
  - [ ] Click outside closes dropdown

- [ ] **Pelanggaran CRUD**
  - [ ] List pelanggaran ditampilkan
  - [ ] Create dengan autocomplete berhasil
  - [ ] Edit berhasil
  - [ ] Delete berhasil

- [ ] **Prestasi CRUD**
  - [ ] List prestasi ditampilkan
  - [ ] Create dengan autocomplete berhasil
  - [ ] Edit berhasil
  - [ ] Delete berhasil

### Alumni Management

- [ ] **Statistics**
  - [ ] Total alumni ditampilkan
  - [ ] Tahun terbaru ditampilkan
  - [ ] Alumni bekerja ditampilkan

- [ ] **List View**
  - [ ] Card alumni ditampilkan
  - [ ] Search by nama berfungsi
  - [ ] Search by NIS berfungsi
  - [ ] Filter by year berfungsi
  - [ ] Reset filter berfungsi

- [ ] **Migrate Santri**
  - [ ] Modal terbuka
  - [ ] Santri autocomplete berfungsi
  - [ ] Preview santri ditampilkan
  - [ ] Migrasi berhasil
  - [ ] Santri dihapus dari list aktif
  - [ ] Alumni list update

- [ ] **Edit Alumni**
  - [ ] Modal terbuka dengan 17 fields
  - [ ] Data pre-filled
  - [ ] Update berhasil
  - [ ] List update

- [ ] **Delete Alumni**
  - [ ] Confirmation dialog
  - [ ] Delete berhasil
  - [ ] List update

- [ ] **Detail View**
  - [ ] Modal detail terbuka
  - [ ] 5 tabs ditampilkan
  - [ ] Tab Identitas: 18 fields
  - [ ] Tab Riwayat Kelas: history ditampilkan
  - [ ] Tab Riwayat Kamar: history ditampilkan
  - [ ] Tab Prestasi: records ditampilkan
  - [ ] Tab Pelanggaran: records ditampilkan
  - [ ] Empty states untuk tabs kosong

### User Management (Admin Only)

- [ ] **Access Control**
  - [ ] Page hanya bisa diakses admin
  - [ ] Non-admin redirect atau error
  - [ ] Sidebar menu hanya muncul untuk admin

- [ ] **User List**
  - [ ] Tabel user ditampilkan
  - [ ] Role badges dengan warna
  - [ ] Status badges (Aktif/Nonaktif)
  - [ ] Action buttons sesuai status

- [ ] **Create User**
  - [ ] Modal terbuka
  - [ ] Validation berfungsi
  - [ ] Password required
  - [ ] Role dropdown berfungsi
  - [ ] Create berhasil
  - [ ] List update

- [ ] **Edit User**
  - [ ] Modal terbuka dengan data
  - [ ] Username disabled
  - [ ] Password optional
  - [ ] Update berhasil
  - [ ] List update

- [ ] **Deactivate/Activate User**
  - [ ] Confirmation dialog
  - [ ] Status berubah
  - [ ] Action button berubah
  - [ ] List update

- [ ] **Delete User (Hard)**
  - [ ] Double confirmation
  - [ ] Delete berhasil
  - [ ] List update

### Profile Management

- [ ] **View Profile**
  - [ ] Profile card ditampilkan
  - [ ] Avatar muncul
  - [ ] 7 info fields ditampilkan
  - [ ] Dates formatted dengan benar
  - [ ] Role label ditampilkan

- [ ] **Edit Profile**
  - [ ] Modal terbuka
  - [ ] Data pre-filled
  - [ ] Update berhasil
  - [ ] AuthContext update
  - [ ] Navbar update
  - [ ] Success message

- [ ] **Change Password**
  - [ ] Modal terbuka
  - [ ] Validation berfungsi
  - [ ] Password min 8 chars
  - [ ] Confirmation matching
  - [ ] Change berhasil
  - [ ] Auto-logout
  - [ ] Redirect to login

## 🎨 UI/UX Testing

### Responsive Design

- [ ] **Desktop (>1024px)**
  - [ ] Layout proper
  - [ ] Sidebar visible
  - [ ] Tables readable
  - [ ] Modals centered

- [ ] **Tablet (768px-1024px)**
  - [ ] Layout adjusted
  - [ ] Sidebar collapsible
  - [ ] Tables scrollable
  - [ ] Modals responsive

- [ ] **Mobile (<768px)**
  - [ ] Hamburger menu berfungsi
  - [ ] Sidebar overlay
  - [ ] Tables scrollable horizontal
  - [ ] Modals full width
  - [ ] Touch interactions smooth
  - [ ] Forms usable
  - [ ] Buttons accessible

### Loading States

- [ ] **Initial Load**
  - [ ] Loading indicator muncul
  - [ ] Skeleton screens (jika ada)
  - [ ] Smooth transition ke content

- [ ] **Form Submission**
  - [ ] Button disabled saat submit
  - [ ] Loading text/spinner
  - [ ] Re-enable setelah selesai

- [ ] **Data Fetching**
  - [ ] Loading state saat fetch
  - [ ] Error state jika gagal
  - [ ] Retry mechanism (jika ada)

### Messages & Notifications

- [ ] **Success Messages**
  - [ ] Muncul setelah action berhasil
  - [ ] Auto-dismiss setelah 5 detik
  - [ ] Bisa di-close manual
  - [ ] Warna hijau

- [ ] **Error Messages**
  - [ ] Muncul saat error
  - [ ] Message jelas dan helpful
  - [ ] Warna merah
  - [ ] Bisa di-close

- [ ] **Validation Errors**
  - [ ] Muncul per field
  - [ ] Message spesifik
  - [ ] Hilang saat field diperbaiki

- [ ] **Confirmation Dialogs**
  - [ ] Muncul untuk destructive actions
  - [ ] Message jelas
  - [ ] Bisa cancel
  - [ ] Bisa confirm

### Accessibility

- [ ] **Keyboard Navigation**
  - [ ] Tab order logical
  - [ ] Focus visible
  - [ ] Enter/Space untuk buttons
  - [ ] Escape untuk close modals

- [ ] **Screen Reader**
  - [ ] Labels proper
  - [ ] ARIA attributes
  - [ ] Alt text untuk images
  - [ ] Semantic HTML

- [ ] **Color Contrast**
  - [ ] Text readable
  - [ ] Buttons distinguishable
  - [ ] Links visible

## 🚀 Performance Testing

- [ ] **Page Load**
  - [ ] Initial load < 3 seconds
  - [ ] Assets optimized
  - [ ] Code splitting berfungsi

- [ ] **Navigation**
  - [ ] Route changes smooth
  - [ ] No unnecessary re-renders
  - [ ] Back button berfungsi

- [ ] **Large Lists**
  - [ ] Pagination berfungsi
  - [ ] Scroll smooth
  - [ ] No lag saat filter

- [ ] **Forms**
  - [ ] Input responsive
  - [ ] Validation instant
  - [ ] Submit cepat

## 🌐 Cross-Browser Testing

- [ ] **Chrome**
  - [ ] All features berfungsi
  - [ ] Layout proper
  - [ ] No console errors

- [ ] **Firefox**
  - [ ] All features berfungsi
  - [ ] Layout proper
  - [ ] No console errors

- [ ] **Safari**
  - [ ] All features berfungsi
  - [ ] Layout proper
  - [ ] No console errors

- [ ] **Edge**
  - [ ] All features berfungsi
  - [ ] Layout proper
  - [ ] No console errors

## 🐛 Error Handling

- [ ] **Network Errors**
  - [ ] Error message muncul
  - [ ] Retry option (jika ada)
  - [ ] Graceful degradation

- [ ] **API Errors**
  - [ ] Error message dari server ditampilkan
  - [ ] User-friendly message
  - [ ] No crash

- [ ] **Validation Errors**
  - [ ] Client-side validation
  - [ ] Server-side validation
  - [ ] Clear error messages

- [ ] **404 Errors**
  - [ ] Redirect ke home atau 404 page
  - [ ] User bisa navigate back

## 📝 Notes

- Test dengan data real (bukan hanya dummy data)
- Test dengan berbagai role (admin, guru, staff)
- Test dengan berbagai screen sizes
- Test dengan slow network (throttling)
- Test dengan banyak data (pagination, performance)
- Document bugs yang ditemukan
- Prioritize bugs (critical, high, medium, low)

---

**Testing Progress**: ___% Complete

**Bugs Found**: ___

**Critical Issues**: ___

**Last Tested By**: ___________

**Date**: ___________
