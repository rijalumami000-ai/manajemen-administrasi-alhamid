// alumniModal.js - Modal management for alumni

import { escapeHtml, formatDate } from './alumniDisplay.js';

/**
 * Convert date to input value format
 */
export function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

/**
 * Open add alumni modal
 */
export function openAddModal(loadSantriListFn) {
  loadSantriListFn();
  document.getElementById('migrateForm').reset();
  document.getElementById('santriSearch').value = '';
  document.getElementById('santriSelect').value = '';
  document.getElementById('santriPreview').innerHTML = '';
  document.getElementById('santriSuggestions').classList.remove('active');
  document.getElementById('addModal').style.display = 'flex';
}

/**
 * Close add alumni modal
 */
export function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
  document.getElementById('migrateForm').reset();
  document.getElementById('santriSearch').value = '';
  document.getElementById('santriSelect').value = '';
  document.getElementById('santriPreview').innerHTML = '';
  document.getElementById('santriSuggestions').classList.remove('active');
}

/**
 * Open edit alumni modal
 */
export function openEditModal(id, allAlumni) {
  const alumni = allAlumni.find(a => a.id === id);
  if (!alumni) return;

  document.getElementById('editAlumniId').value = alumni.id;
  document.getElementById('editNis').value = alumni.nis || '';
  document.getElementById('editNik').value = alumni.nik || '';
  document.getElementById('editNama').value = alumni.nama || '';
  document.getElementById('editTempatLahir').value = alumni.tempat_lahir || '';
  document.getElementById('editTanggalLahir').value = toDateInputValue(alumni.tanggal_lahir);
  document.getElementById('editTahunMasuk').value = alumni.tahun_masuk || '';
  document.getElementById('editTahunLulus').value = alumni.tahun_lulus || '';
  document.getElementById('editKelasTerakir').value = alumni.kelas_terakhir || '';
  document.getElementById('editAlamat').value = alumni.alamat || '';
  document.getElementById('editNoHp').value = alumni.no_hp || '';
  document.getElementById('editEmail').value = alumni.email || '';
  document.getElementById('editPekerjaan').value = alumni.pekerjaan || '';
  document.getElementById('editStatusPernikahan').value = alumni.status_pernikahan || '';
  document.getElementById('editAlamatSekarang').value = alumni.alamat_sekarang || '';
  document.getElementById('editInstansi').value = alumni.instansi || '';
  document.getElementById('editPrestasiUtama').value = alumni.prestasi_utama || '';
  document.getElementById('editKeterangan').value = alumni.keterangan || '';

  document.getElementById('editModal').style.display = 'block';
}

/**
 * Close edit alumni modal
 */
export function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

/**
 * Open additional info modal
 */
export function openAdditionalModal(id, allAlumni) {
  const alumni = allAlumni.find(a => a.id === id);
  if (!alumni) return;

  document.getElementById('additionalAlumniId').value = alumni.id;
  document.getElementById('additionalPekerjaan').value = alumni.pekerjaan || '';
  document.getElementById('additionalNoHp').value = alumni.no_hp || '';
  document.getElementById('additionalStatusPernikahan').value = alumni.status_pernikahan || '';
  document.getElementById('additionalAlamatSekarang').value = alumni.alamat_sekarang || '';
  document.getElementById('additionalModal').style.display = 'flex';
}

/**
 * Close additional info modal
 */
export function closeAdditionalModal() {
  document.getElementById('additionalModal').style.display = 'none';
}

/**
 * Setup santri autocomplete
 */
export function setupSantriAutocomplete(allSantri) {
  const searchInput = document.getElementById('santriSearch');
  const hiddenInput = document.getElementById('santriSelect');
  const suggestions = document.getElementById('santriSuggestions');

  if (!searchInput || !hiddenInput || !suggestions) return;

  const renderSuggestions = () => {
    const keyword = searchInput.value.trim().toLowerCase();
    hiddenInput.value = '';
    document.getElementById('santriPreview').innerHTML = '';

    if (!keyword) {
      suggestions.classList.remove('active');
      suggestions.innerHTML = '';
      return;
    }

    const matches = allSantri
      .filter((santri) => {
        const nama = (santri.nama || '').toLowerCase();
        const nis = (santri.nis || '').toLowerCase();
        return nama.includes(keyword) || nis.includes(keyword);
      })
      .slice(0, 8);

    if (!matches.length) {
      suggestions.innerHTML = '<div class="autocomplete-option"><strong>Tidak ada santri aktif</strong><span>Coba kata kunci lain.</span></div>';
      suggestions.classList.add('active');
      return;
    }

    suggestions.innerHTML = matches.map((santri) => `
      <div class="autocomplete-option" data-id="${santri.id}">
        <strong>${escapeHtml(santri.nama)}</strong>
        <span>NIS: ${escapeHtml(santri.nis || '-')} | ${escapeHtml(santri.kelas_diniyah || '-')} / ${escapeHtml(santri.kelas_sekolah || '-')}</span>
      </div>
    `).join('');
    suggestions.classList.add('active');
  };

  searchInput.oninput = renderSuggestions;
  suggestions.onclick = (event) => {
    const option = event.target.closest('.autocomplete-option[data-id]');
    if (!option) return;

    const santri = allSantri.find((item) => item.id === Number(option.dataset.id));
    if (!santri) return;

    searchInput.value = `${santri.nama} (${santri.nis || '-'})`;
    hiddenInput.value = santri.id;
    suggestions.classList.remove('active');
    loadSantriPreview(santri);
  };

  if (!setupSantriAutocomplete.hasDocumentHandler) {
    document.addEventListener('click', (event) => {
      if (!searchInput.contains(event.target) && !suggestions.contains(event.target)) {
        suggestions.classList.remove('active');
      }
    });
    setupSantriAutocomplete.hasDocumentHandler = true;
  }
}

/**
 * Load santri preview
 */
export function loadSantriPreview(santri) {
  const preview = document.getElementById('santriPreview');

  if (!santri) {
    preview.innerHTML = '';
    return;
  }

  preview.innerHTML = `
    <div class="santri-preview">
      <h4>Data Santri yang Akan Dipindahkan</h4>
      <div class="santri-preview-grid">
        <div><strong>NIS:</strong> ${escapeHtml(santri.nis || '-')}</div>
        <div><strong>NIK:</strong> ${escapeHtml(santri.nik || '-')}</div>
        <div><strong>Nama:</strong> ${escapeHtml(santri.nama || '-')}</div>
        <div><strong>Tempat Lahir:</strong> ${escapeHtml(santri.tempat_lahir || '-')}</div>
        <div><strong>Tanggal Lahir:</strong> ${santri.tanggal_lahir ? formatDate(santri.tanggal_lahir) : '-'}</div>
        <div><strong>Kelas Diniyah:</strong> ${escapeHtml(santri.kelas_diniyah || '-')}</div>
        <div><strong>Kelas Sekolah:</strong> ${escapeHtml(santri.kelas_sekolah || '-')}</div>
        <div><strong>Kamar:</strong> ${santri.kamar ? `${escapeHtml(santri.kamar)} (${escapeHtml(santri.gedung || '')} Lt. ${escapeHtml(santri.lantai || '')})` : '-'}</div>
        <div><strong>Ayah:</strong> ${escapeHtml(santri.nama_ayah || '-')}</div>
        <div><strong>Ibu:</strong> ${escapeHtml(santri.nama_ibu || '-')}</div>
        <div><strong>Alamat:</strong> ${escapeHtml(santri.alamat || '-')}</div>
      </div>
    </div>
  `;
}
