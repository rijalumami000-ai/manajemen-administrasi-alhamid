# Validation & Error Handling Pattern Guide

**Quick reference for applying validation pattern to other features**

---

## 📚 Overview

This guide shows how to apply the validation and error handling pattern (established in Alumni feature) to other features like Santri, Guru, Kelas, etc.

---

## 🔧 Backend Pattern

### Step 1: Import Utilities

```javascript
const {
  ValidationError,
  NotFoundError,
  validateRequiredFields,
  validateField,
  validators,
  handleDatabaseError
} = require('../utils/errorHandler');
```

### Step 2: Add Validation to Service Functions

```javascript
async function createSantri(data) {
  // 1. Validate required fields
  validateRequiredFields(data, ['nis', 'nama', 'tanggal_lahir']);

  // 2. Validate field formats
  validateField('NIS', data.nis, validators.nis);
  if (data.nik) validateField('NIK', data.nik, validators.nik);
  if (data.email) validateField('Email', data.email, validators.email);
  if (data.no_hp) validateField('No HP', data.no_hp, validators.phone);

  // 3. Normalize data
  const nis = normalizeText(data.nis);
  const nama = normalizeText(data.nama);
  // ... etc

  // 4. Wrap database operations in try/catch
  try {
    const result = await db.query(/* ... */);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error);
  }
}
```

### Step 3: Use Custom Error Classes

```javascript
// For not found errors
if (!result.rows.length) {
  throw new NotFoundError('Santri'); // Will show "Santri tidak ditemukan"
}

// For validation errors
if (existingData.rows.length) {
  throw new ValidationError('Data sudah ada');
}

// For conflict errors
throw new ConflictError('NIS sudah digunakan');
```

### Step 4: Wrap Routes with asyncHandler

```javascript
const { asyncHandler } = require('../utils/errorHandler');

// Before
app.post('/api/santri', async (req, res) => {
  try {
    const santri = await santriService.createSantri(req.body);
    res.status(201).json(santri);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menyimpan data' });
  }
});

// After
app.post('/api/santri', asyncHandler(async (req, res) => {
  const santri = await santriService.createSantri(req.body);
  res.status(201).json(santri);
}));
```

---

## 🎨 Frontend Pattern

### Step 1: Import Validation Utilities

```javascript
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateNIS,
  validateNIK,
  validateYear,
  showValidationErrors,
  clearValidationErrors,
  showLoading,
  hideLoading
} from './validation.js';
```

### Step 2: Create Validation Helper

```javascript
function validateSantriData(data) {
  const errors = [];

  // Required fields
  const requiredCheck = validateRequired({
    'NIS': data.nis,
    'Nama': data.nama,
    'Tanggal Lahir': data.tanggal_lahir
  });
  errors.push(...requiredCheck.errors);

  // Format validation
  if (data.nis && !validateNIS(data.nis)) {
    errors.push('Format NIS tidak valid (6-20 digit angka)');
  }

  if (data.nik && !validateNIK(data.nik)) {
    errors.push('Format NIK tidak valid (16 digit angka)');
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push('Format email tidak valid');
  }

  if (data.no_hp && !validatePhone(data.no_hp)) {
    errors.push('Format nomor HP tidak valid');
  }

  return errors;
}
```

### Step 3: Add Validation to CRUD Functions

```javascript
export async function saveSantri(event, closeModalFn, loadSantriFn) {
  event.preventDefault();

  const form = event.target;
  clearValidationErrors(form); // Clear previous errors

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Validate data
  const errors = validateSantriData(data);
  if (errors.length > 0) {
    showValidationErrors(form, errors);
    return;
  }

  // Show loading
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Menyimpan...';

  try {
    const response = await fetch(`${API_URL}/santri`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      closeModalFn();
      loadSantriFn();
      alert('Data santri berhasil ditambahkan');
    } else {
      const error = await response.json();
      showValidationErrors(form, [error.error || 'Gagal menyimpan data']);
    }
  } catch (error) {
    console.error('Error:', error);
    showValidationErrors(form, ['Gagal menyimpan data santri']);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}
```

### Step 4: Add Loading States to Data Loading

```javascript
export async function loadSantri() {
  const container = document.getElementById('santriTableBody') || document.body;

  try {
    showLoading(container, 'Memuat data santri...');

    const response = await fetch(`${API_URL}/santri`);
    if (!response.ok) {
      throw new Error('Gagal memuat data santri');
    }

    const santri = await response.json();
    displaySantri(santri);
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal memuat data santri');
  } finally {
    hideLoading(container);
  }
}
```

---

## 📋 Available Validators

### Backend (src/utils/errorHandler.js)

```javascript
validators.email(value)      // Email format
validators.phone(value)      // Indonesian phone format
validators.nis(value)        // 6-20 digits
validators.nik(value)        // 16 digits
validators.year(value)       // 1900-2100
validators.positiveNumber(value) // > 0
```

### Frontend (public/js/utils/validation.js)

```javascript
validateRequired(fields)     // Check required fields
validateEmail(email)         // Email format
validatePhone(phone)         // Indonesian phone format
validateNIS(nis)            // 6-20 digits
validateNIK(nik)            // 16 digits
validateYear(year)          // 1900-2100
validateDateNotFuture(date) // Not in future
validateRange(value, min, max) // Number range
```

---

## 🎯 Validation Rules by Feature

### Santri
- **Required:** NIS, Nama, Tanggal Lahir
- **Optional:** NIK (16 digits), Email, No HP, Alamat
- **Format:** NIS (6-20 digits), NIK (16 digits), Email, Phone

### Guru
- **Required:** NIP, Nama
- **Optional:** NIK (16 digits), Email, No HP, Alamat
- **Format:** NIP (similar to NIS), NIK (16 digits), Email, Phone

### Kelas
- **Required:** Nama, Tingkat, Jenis
- **Optional:** Wali Kelas, Kapasitas
- **Format:** Kapasitas (positive number)

### Kamar
- **Required:** Nama, Gedung, Lantai
- **Optional:** Kapasitas
- **Format:** Lantai (positive number), Kapasitas (positive number)

### Pelanggaran
- **Required:** Santri ID, Tanggal, Jenis, Poin
- **Optional:** Keterangan
- **Format:** Tanggal (not future), Poin (positive number)

### Prestasi
- **Required:** Santri ID, Tanggal, Nama Prestasi
- **Optional:** Tingkat, Keterangan
- **Format:** Tanggal (not future)

---

## 🚨 Error Response Format

All API errors return JSON with this format:

```json
{
  "error": "Error message in Indonesian"
}
```

### HTTP Status Codes
- **400** - Validation Error (invalid input)
- **404** - Not Found Error (resource not found)
- **409** - Conflict Error (duplicate data)
- **500** - Server Error (generic error)

---

## ✅ Checklist for Applying Pattern

### Backend
- [ ] Import validation utilities from errorHandler
- [ ] Add validateRequiredFields() for required fields
- [ ] Add validateField() for format validation
- [ ] Wrap database operations in try/catch
- [ ] Use custom error classes (ValidationError, NotFoundError, etc.)
- [ ] Let handleDatabaseError() handle database errors
- [ ] Wrap routes with asyncHandler()
- [ ] Remove manual try/catch from routes
- [ ] Remove manual error responses from routes

### Frontend
- [ ] Import validation utilities from validation.js
- [ ] Create validateXData() helper function
- [ ] Call clearValidationErrors() at start of submit
- [ ] Validate data before submit
- [ ] Call showValidationErrors() if validation fails
- [ ] Add loading states with showLoading/hideLoading
- [ ] Disable submit button during loading
- [ ] Handle API errors gracefully
- [ ] Display user-friendly error messages

### Testing
- [ ] Syntax check all modified files
- [ ] Test GET endpoint (200 OK)
- [ ] Test POST with invalid data (400 error)
- [ ] Test POST with valid data (201 created)
- [ ] Test GET non-existent resource (404 error)
- [ ] Test loading states in browser
- [ ] Test validation feedback in browser

---

## 📚 Reference Files

- **Backend Utilities:** `src/utils/errorHandler.js`
- **Frontend Utilities:** `public/js/utils/validation.js`
- **Example Service:** `src/services/alumniService.js`
- **Example Routes:** `src/routes/alumniRoutes.js`
- **Example CRUD:** `public/js/utils/alumniCrud.js`
- **Example Feature:** `public/js/features/alumniFeature.js`
- **Implementation Summary:** `docs/reports/TASK_4_IMPLEMENTATION_SUMMARY.md`

---

## 💡 Tips

1. **Start with backend** - Implement validation in service layer first
2. **Test as you go** - Test each function after adding validation
3. **Reuse validators** - Use existing validators from errorHandler.js
4. **Consistent messages** - Use Indonesian error messages
5. **User-friendly** - Show clear, specific error messages
6. **Loading states** - Always show loading during async operations
7. **Prevent double submit** - Disable buttons during submission
8. **Handle all errors** - Catch and display all API errors

---

**Status:** Ready to use  
**Last Updated:** 2026-05-02  
**Pattern Established By:** Kiro (Alumni feature implementation)
