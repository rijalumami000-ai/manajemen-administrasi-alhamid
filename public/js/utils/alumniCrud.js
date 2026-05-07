// alumniCrud.js - CRUD operations for alumni

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

const API_URL = 'http://localhost:3000/api';

// LocalStorage for additional info
let alumniAdditionalInfo = JSON.parse(localStorage.getItem('alumniAdditionalInfo') || '{}');

/**
 * Merge additional info from localStorage
 */
export function mergeAdditionalInfo(alumni) {
  const extra = alumniAdditionalInfo[alumni.id] || {};
  return { ...alumni, ...extra };
}

/**
 * Remember additional info in localStorage
 */
export function rememberAdditionalInfo(id, data) {
  alumniAdditionalInfo[id] = {
    pekerjaan: data.pekerjaan || '',
    no_hp: data.no_hp || '',
    status_pernikahan: data.status_pernikahan || '',
    alamat_sekarang: data.alamat_sekarang || '',
  };
  localStorage.setItem('alumniAdditionalInfo', JSON.stringify(alumniAdditionalInfo));
}

/**
 * Validate alumni form data
 */
function validateAlumniData(data) {
  const errors = [];

  // Required fields
  const requiredCheck = validateRequired({
    'NIS': data.nis,
    'Nama': data.nama,
    'Tahun Lulus': data.tahun_lulus
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

  if (data.tahun_masuk && !validateYear(data.tahun_masuk)) {
    errors.push('Tahun masuk tidak valid');
  }

  if (data.tahun_lulus && !validateYear(data.tahun_lulus)) {
    errors.push('Tahun lulus tidak valid');
  }

  return errors;
}

/**
 * Save manual alumni
 */
export async function saveManualAlumni(event, closeModalFn, loadAlumniFn) {
  event.preventDefault();

  const form = event.target;
  clearValidationErrors(form);

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Validate data
  const errors = validateAlumniData(data);
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
    const response = await fetch(`${API_URL}/alumni`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      closeModalFn();
      loadAlumniFn();
      alert('Data alumni berhasil ditambahkan');
    } else {
      const error = await response.json();
      showValidationErrors(form, [error.error || 'Gagal menyimpan data']);
    }
  } catch (error) {
    console.error('Error:', error);
    showValidationErrors(form, ['Gagal menyimpan data alumni']);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Migrate santri to alumni
 */
export async function migrateSantri(event, closeModalFn, loadAlumniFn, loadSantriFn) {
  event.preventDefault();

  const form = event.target;
  clearValidationErrors(form);

  const santriId = document.getElementById('santriSelect').value;
  const tahunLulus = document.getElementById('tahunLulusMigrasi').value;
  const keterangan = document.getElementById('keteranganMigrasi').value;

  // Validate
  const errors = [];
  const requiredCheck = validateRequired({
    'Santri': santriId,
    'Tahun Lulus': tahunLulus
  });
  errors.push(...requiredCheck.errors);

  if (tahunLulus && !validateYear(tahunLulus)) {
    errors.push('Tahun lulus tidak valid');
  }

  if (errors.length > 0) {
    showValidationErrors(form, errors);
    return;
  }

  // Show loading
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';

  try {
    const response = await fetch(`${API_URL}/alumni/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ santri_id: santriId, tahun_lulus: tahunLulus, keterangan })
    });

    if (response.ok) {
      const result = await response.json();
      closeModalFn();
      await loadAlumniFn();
      await loadSantriFn();
      alert(result.message || 'Data santri berhasil dipindahkan ke alumni');
    } else {
      const error = await response.json();
      showValidationErrors(form, [error.error || 'Gagal migrasi santri']);
    }
  } catch (error) {
    console.error('Error:', error);
    showValidationErrors(form, ['Gagal migrasi santri ke alumni']);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Update alumni
 */
export async function updateAlumni(event, closeModalFn, loadAlumniFn) {
  event.preventDefault();

  const form = event.target;
  clearValidationErrors(form);

  const id = document.getElementById('editAlumniId').value;
  const data = {
    nis: document.getElementById('editNis').value,
    nik: document.getElementById('editNik').value,
    nama: document.getElementById('editNama').value,
    tempat_lahir: document.getElementById('editTempatLahir').value,
    tanggal_lahir: document.getElementById('editTanggalLahir').value,
    tahun_masuk: document.getElementById('editTahunMasuk').value,
    tahun_lulus: document.getElementById('editTahunLulus').value,
    kelas_terakhir: document.getElementById('editKelasTerakir').value,
    alamat: document.getElementById('editAlamat').value,
    no_hp: document.getElementById('editNoHp').value,
    email: document.getElementById('editEmail').value,
    pekerjaan: document.getElementById('editPekerjaan').value,
    status_pernikahan: document.getElementById('editStatusPernikahan').value,
    alamat_sekarang: document.getElementById('editAlamatSekarang').value,
    instansi: document.getElementById('editInstansi').value,
    prestasi_utama: document.getElementById('editPrestasiUtama').value,
    keterangan: document.getElementById('editKeterangan').value
  };

  // Validate data
  const errors = validateAlumniData(data);
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
    const response = await fetch(`${API_URL}/alumni/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      closeModalFn();
      loadAlumniFn();
      alert('Data alumni berhasil diperbarui');
    } else {
      const error = await response.json();
      showValidationErrors(form, [error.error || 'Gagal memperbarui data']);
    }
  } catch (error) {
    console.error('Error:', error);
    showValidationErrors(form, ['Gagal memperbarui data alumni']);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Delete alumni
 */
export async function deleteAlumni(id, nama, loadAlumniFn, loadSantriFn) {
  if (!confirm(`Apakah Anda yakin ingin menghapus data alumni ${nama}?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/alumni/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      const result = await response.json();
      await loadAlumniFn();
      await loadSantriFn();
      alert(result.message || 'Data alumni berhasil dihapus');
    } else {
      const error = await response.json();
      alert(error.error || 'Gagal menghapus data');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal menghapus data alumni');
  }
}

/**
 * Save additional info
 */
export async function saveAdditionalInfo(event, allAlumni, closeModalFn, loadAlumniFn, displayAlumniFn) {
  event.preventDefault();

  const form = event.target;
  clearValidationErrors(form);

  const id = Number(document.getElementById('additionalAlumniId').value);
  const alumni = allAlumni.find(a => a.id === id);
  if (!alumni) return;

  const data = {
    ...alumni,
    pekerjaan: document.getElementById('additionalPekerjaan').value,
    no_hp: document.getElementById('additionalNoHp').value,
    status_pernikahan: document.getElementById('additionalStatusPernikahan').value,
    alamat_sekarang: document.getElementById('additionalAlamatSekarang').value,
  };

  // Validate phone if provided
  const errors = [];
  if (data.no_hp && !validatePhone(data.no_hp)) {
    errors.push('Format nomor HP tidak valid');
  }

  if (errors.length > 0) {
    showValidationErrors(form, errors);
    return;
  }

  rememberAdditionalInfo(id, data);

  // Show loading
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Menyimpan...';

  try {
    const response = await fetch(`${API_URL}/alumni/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const saved = await response.json();
      rememberAdditionalInfo(id, { ...saved, ...data });
      closeModalFn();
      await loadAlumniFn();
      alert('Informasi tambahan berhasil disimpan');
    } else {
      const error = await response.json();
      showValidationErrors(form, [error.error || 'Gagal menyimpan informasi tambahan']);
    }
  } catch (error) {
    console.error('Error:', error);
    showValidationErrors(form, ['Gagal menyimpan informasi tambahan']);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}
