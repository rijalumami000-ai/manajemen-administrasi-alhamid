const API_URL = 'http://localhost:3000/api';
let allAlumni = [];
let allSantri = [];
let currentDetailAlumni = null;
let alumniAdditionalInfo = JSON.parse(localStorage.getItem('alumniAdditionalInfo') || '{}');
let santriKamarOverrides = JSON.parse(localStorage.getItem('santriKamarOverrides') || '{}');
let allKamar = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mergeAdditionalInfo(alumni) {
  const extra = alumniAdditionalInfo[alumni.id] || {};
  return { ...alumni, ...extra };
}

function rememberAdditionalInfo(id, data) {
  alumniAdditionalInfo[id] = {
    pekerjaan: data.pekerjaan || '',
    no_hp: data.no_hp || '',
    status_pernikahan: data.status_pernikahan || '',
    alamat_sekarang: data.alamat_sekarang || '',
  };
  localStorage.setItem('alumniAdditionalInfo', JSON.stringify(alumniAdditionalInfo));
}

const hamburgerMenu = document.getElementById('hamburger-menu');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const menuParentButtons = document.querySelectorAll('.menu-parent');
const pageBody = document.body;

function setSidebarState(isOpen) {
  if (!sidebar || !hamburgerMenu) return;
  hamburgerMenu.classList.toggle('active', isOpen);
  hamburgerMenu.setAttribute('aria-expanded', String(isOpen));
  sidebar.classList.toggle('active', isOpen);
  pageBody.classList.toggle('sidebar-open', isOpen);
  pageBody.classList.toggle('sidebar-collapsed', !isOpen);
}

function closeSidebar() {
  setSidebarState(false);
}

function setMenuGroupExpanded(button, isExpanded) {
  const menuGroup = button.closest('.menu-group');
  button.setAttribute('aria-expanded', String(isExpanded));
  if (menuGroup) {
    menuGroup.classList.toggle('collapsed', !isExpanded);
  }
}

if (hamburgerMenu) {
  hamburgerMenu.addEventListener('click', function() {
    setSidebarState(!sidebar.classList.contains('active'));
  });
}

if (sidebarClose) {
  sidebarClose.addEventListener('click', closeSidebar);
}

menuParentButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    setMenuGroupExpanded(button, !isExpanded);
  });
});

document.addEventListener('click', function(event) {
  if (
    window.innerWidth <= 768 &&
    sidebar &&
    hamburgerMenu &&
    !sidebar.contains(event.target) &&
    !hamburgerMenu.contains(event.target) &&
    sidebar.classList.contains('active')
  ) {
    closeSidebar();
  }
});

setSidebarState(window.innerWidth > 768);

// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Load data on page load
async function init() {
  await loadKamarList();
  await loadAlumni();
  await loadSantriList();
}

async function loadKamarList() {
  try {
    const response = await fetch(`${API_URL}/kamar`, { cache: 'no-store' });
    const items = await response.json();
    allKamar = Array.isArray(items) ? items : [];
  } catch (error) {
    console.error('Error:', error);
  }
}

// Load alumni
async function loadAlumni() {
  try {
    const response = await fetch(`${API_URL}/alumni`);
    const alumni = await response.json();
    allAlumni = alumni.map(mergeAdditionalInfo);
    displayAlumni(allAlumni);
    updateStats(allAlumni);
    populateYearFilter(allAlumni);
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal memuat data alumni');
  }
}

// Load santri list for migration
async function loadSantriList() {
  try {
    const response = await fetch(`${API_URL}/santri/active`);
    allSantri = await response.json();
    setupSantriAutocomplete();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Display alumni
function displayAlumni(alumni) {
  const list = document.getElementById('alumniList');
  
  if (alumni.length === 0) {
    list.innerHTML = '<div class="empty-state">Tidak ada data alumni</div>';
    return;
  }

  list.innerHTML = alumni.map(a => `
    <div class="alumni-card">
      <div class="alumni-header">
        <div>
          <h3 class="alumni-name">${a.nama}</h3>
          <p class="alumni-nis">NIS: ${a.nis}</p>
        </div>
        <div class="alumni-year">Lulus ${a.tahun_lulus}</div>
      </div>
      
      <div class="alumni-details">
        ${a.tempat_lahir || a.tanggal_lahir ? `
          <div class="detail-item">
            <span class="detail-label">Lahir:</span>
            <span class="detail-value">${a.tempat_lahir || ''}, ${a.tanggal_lahir ? formatDate(a.tanggal_lahir) : ''}</span>
          </div>
        ` : ''}
        
        ${a.tahun_masuk ? `
          <div class="detail-item">
            <span class="detail-label">Tahun Masuk:</span>
            <span class="detail-value">${a.tahun_masuk}</span>
          </div>
        ` : ''}
        
        ${a.kelas_terakhir ? `
          <div class="detail-item">
            <span class="detail-label">Kelas Terakhir:</span>
            <span class="detail-value">${a.kelas_terakhir}</span>
          </div>
        ` : ''}
        
        ${a.no_hp ? `
          <div class="detail-item">
            <span class="detail-label">No. HP:</span>
            <span class="detail-value">${a.no_hp}</span>
          </div>
        ` : ''}
        
        ${a.email ? `
          <div class="detail-item">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${a.email}</span>
          </div>
        ` : ''}
        
        ${a.pekerjaan ? `
          <div class="detail-item">
            <span class="detail-label">Pekerjaan:</span>
            <span class="detail-value">${a.pekerjaan}</span>
          </div>
        ` : ''}

        ${a.status_pernikahan ? `
          <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${a.status_pernikahan}</span>
          </div>
        ` : ''}

        ${a.alamat_sekarang ? `
          <div class="detail-item full-width">
            <span class="detail-label">Alamat Sekarang:</span>
            <span class="detail-value">${a.alamat_sekarang}</span>
          </div>
        ` : ''}
        
        ${a.instansi ? `
          <div class="detail-item">
            <span class="detail-label">Instansi:</span>
            <span class="detail-value">${a.instansi}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="alumni-actions">
        <button class="button-secondary" style="padding: 6px 12px; font-size: 14px;" onclick="showDetail(${a.id})">Detail</button>
        <button class="button-secondary" style="padding: 6px 12px; font-size: 14px;" onclick="openAdditionalModal(${a.id})">Tambah Informasi Tambahan</button>
        <button class="button-secondary" style="padding: 6px 12px; font-size: 14px; background: #dc3545; color: white;" onclick="deleteAlumni(${a.id}, '${a.nama.replace(/'/g, "\\'")}')">Hapus</button>
      </div>
    </div>
  `).join('');
}

// Update stats
function updateStats(alumni) {
  document.getElementById('totalAlumni').textContent = alumni.length;
  
  if (alumni.length > 0) {
    const latestYear = Math.max(...alumni.map(a => a.tahun_lulus));
    document.getElementById('latestYear').textContent = latestYear;
    
    const working = alumni.filter(a => a.pekerjaan).length;
    document.getElementById('workingAlumni').textContent = working;
  }
}

// Populate year filter
function populateYearFilter(alumni) {
  const years = [...new Set(alumni.map(a => a.tahun_lulus))].sort((a, b) => b - a);
  const select = document.getElementById('yearFilter');
  
  select.innerHTML = '<option value="">Semua Tahun</option>' + 
    years.map(year => `<option value="${year}">${year}</option>`).join('');
}

// Search alumni
function searchAlumni() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const yearFilter = document.getElementById('yearFilter').value;
  
  let filtered = allAlumni;
  
  if (searchTerm) {
    filtered = filtered.filter(a => 
      a.nama.toLowerCase().includes(searchTerm) || 
      a.nis.toLowerCase().includes(searchTerm)
    );
  }
  
  if (yearFilter) {
    filtered = filtered.filter(a => a.tahun_lulus == yearFilter);
  }
  
  displayAlumni(filtered);
}

// Reset search
function resetSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('yearFilter').value = '';
  displayAlumni(allAlumni);
}

// Modal functions
function openAddModal() {
  loadSantriList();
  document.getElementById('migrateForm').reset();
  document.getElementById('santriSearch').value = '';
  document.getElementById('santriSelect').value = '';
  document.getElementById('santriPreview').innerHTML = '';
  document.getElementById('santriSuggestions').classList.remove('active');
  document.getElementById('addModal').style.display = 'flex';
}

function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
  document.getElementById('migrateForm').reset();
  document.getElementById('santriSearch').value = '';
  document.getElementById('santriSelect').value = '';
  document.getElementById('santriPreview').innerHTML = '';
  document.getElementById('santriSuggestions').classList.remove('active');
}

function openEditModal(id) {
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

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

function closeDetailModal() {
  document.getElementById('detailModal').style.display = 'none';
}

function closeAdditionalModal() {
  document.getElementById('additionalModal').style.display = 'none';
}

function openAdditionalModal(id) {
  const alumni = allAlumni.find(a => a.id === id);
  if (!alumni) return;

  document.getElementById('additionalAlumniId').value = alumni.id;
  document.getElementById('additionalPekerjaan').value = alumni.pekerjaan || '';
  document.getElementById('additionalNoHp').value = alumni.no_hp || '';
  document.getElementById('additionalStatusPernikahan').value = alumni.status_pernikahan || '';
  document.getElementById('additionalAlamatSekarang').value = alumni.alamat_sekarang || '';
  document.getElementById('additionalModal').style.display = 'flex';
}

async function saveAdditionalInfo(event) {
  event.preventDefault();
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
  rememberAdditionalInfo(id, data);

  try {
    const response = await fetch(`${API_URL}/alumni/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const saved = await response.json();
      rememberAdditionalInfo(id, { ...saved, ...data });
      allAlumni = allAlumni.map((item) => item.id === id ? { ...item, ...saved, ...data } : item);
      closeAdditionalModal();
      await loadAlumni();
      allAlumni = allAlumni.map((item) => item.id === id ? { ...item, ...data } : item);
      displayAlumni(allAlumni);
      alert('Informasi tambahan berhasil disimpan');
    } else {
      const error = await response.json();
      alert(error.error || 'Gagal menyimpan informasi tambahan');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal menyimpan informasi tambahan');
  }
}

function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function setupSantriAutocomplete() {
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
    loadSantriPreview();
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

// Load santri preview
function loadSantriPreview() {
  const santriId = document.getElementById('santriSelect').value;
  const preview = document.getElementById('santriPreview');
  
  if (!santriId) {
    preview.innerHTML = '';
    return;
  }
  
  const santri = allSantri.find(s => s.id == santriId);
  if (!santri) return;
  
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

// Save manual alumni
async function saveManualAlumni(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(`${API_URL}/alumni`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      closeAddModal();
      loadAlumni();
      alert('Data alumni berhasil ditambahkan');
    } else {
      const error = await response.json();
      alert(error.error || 'Gagal menyimpan data');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal menyimpan data alumni');
  }
}

// Migrate santri
async function migrateSantri(event) {
  event.preventDefault();
  
  const santriId = document.getElementById('santriSelect').value;
  const tahunLulus = document.getElementById('tahunLulusMigrasi').value;
  const keterangan = document.getElementById('keteranganMigrasi').value;

  if (!santriId || !tahunLulus) {
    alert('Santri dan tahun lulus wajib diisi');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/alumni/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ santri_id: santriId, tahun_lulus: tahunLulus, keterangan })
    });

    if (response.ok) {
      const result = await response.json();
      closeAddModal();
      await loadAlumni();
      await loadSantriList();
      alert(result.message || 'Data santri berhasil dipindahkan ke alumni');
    } else {
      const error = await response.json();
      alert(error.error || 'Gagal migrasi santri');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal migrasi santri ke alumni');
  }
}

// Update alumni
async function updateAlumni(event) {
  event.preventDefault();
  
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

  try {
    const response = await fetch(`${API_URL}/alumni/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      closeEditModal();
      loadAlumni();
      alert('Data alumni berhasil diperbarui');
    } else {
      const error = await response.json();
      alert(error.error || 'Gagal memperbarui data');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal memperbarui data alumni');
  }
}

// Delete alumni
async function deleteAlumni(id, nama) {
  if (!confirm(`Apakah Anda yakin ingin menghapus data alumni ${nama}?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/alumni/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      const result = await response.json();
      await loadAlumni();
      await loadSantriList();
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

// Show detail
async function showDetail(id) {
  try {
    const response = await fetch(`${API_URL}/alumni/${id}/detail`);
    const data = await response.json();
    data.alumni = mergeAdditionalInfo(data.alumni);

    if (!data.identitas) {
      const santriResponse = await fetch(`${API_URL}/santri`, { cache: 'no-store' });
      const santriList = await santriResponse.json();
      data.identitas = (Array.isArray(santriList) ? santriList : []).find((santri) => {
        return santri.id === data.alumni.santri_id || santri.nis === data.alumni.nis;
      }) || null;
    }

    if (data.identitas) {
      const overrideKamarId = santriKamarOverrides[data.identitas.id];
      if (overrideKamarId) {
        const kamar = allKamar.find((item) => item.id === Number(overrideKamarId));
        data.identitas = {
          ...data.identitas,
          kamar_id: Number(overrideKamarId),
          kamar: kamar ? kamar.nama : data.identitas.kamar,
          nama_kamar: kamar ? kamar.nama : data.identitas.nama_kamar,
          gedung: kamar ? kamar.gedung : data.identitas.gedung,
          lantai: kamar ? kamar.lantai : data.identitas.lantai,
        };
      }
    }
    
    currentDetailAlumni = data;
    displayDetailInfo(data.alumni, data.identitas);
    displayDetailKelas(data.riwayat.kelas);
    displayDetailKamar(data.riwayat.kamar);
    displayDetailPrestasi(data.riwayat.prestasi);
    displayDetailPelanggaran(data.riwayat.pelanggaran);
    
    document.getElementById('detailModal').style.display = 'flex';
    switchDetailTab('info');
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal memuat detail alumni');
  }
}

// Display detail info
function displayDetailInfo(alumni, identitas = null) {
  const content = document.getElementById('detail-info');
  const source = identitas || alumni;
  const kelasParts = (alumni.kelas_terakhir || '').split('/').map((item) => item.trim());
  const kelasDiniyah = source.kelas_diniyah || source.nama_diniyah || kelasParts[0] || '-';
  const kelasSekolah = source.kelas_sekolah || source.nama_sekolah || kelasParts[1] || '-';
  const kamar = source.kamar || source.nama_kamar || '-';
  content.innerHTML = `
    <div class="alumni-details">
      <div class="detail-item"><span class="detail-label">NIS:</span><span class="detail-value">${alumni.nis}</span></div>
      <div class="detail-item"><span class="detail-label">NIK:</span><span class="detail-value">${alumni.nik || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Nama:</span><span class="detail-value">${alumni.nama}</span></div>
      <div class="detail-item"><span class="detail-label">Tempat Lahir:</span><span class="detail-value">${alumni.tempat_lahir || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Tanggal Lahir:</span><span class="detail-value">${alumni.tanggal_lahir ? formatDate(alumni.tanggal_lahir) : '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Tahun Masuk:</span><span class="detail-value">${alumni.tahun_masuk || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Tahun Lulus:</span><span class="detail-value">${alumni.tahun_lulus}</span></div>
      <div class="detail-item"><span class="detail-label">Kelas Diniyah:</span><span class="detail-value">${kelasDiniyah}</span></div>
      <div class="detail-item"><span class="detail-label">Kelas Sekolah:</span><span class="detail-value">${kelasSekolah}</span></div>
      <div class="detail-item"><span class="detail-label">Kamar:</span><span class="detail-value">${kamar}</span></div>
      <div class="detail-item full-width"><span class="detail-label">Alamat Asal:</span><span class="detail-value">${alumni.alamat || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">No. HP:</span><span class="detail-value">${alumni.no_hp || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Pekerjaan:</span><span class="detail-value">${alumni.pekerjaan || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Status Pernikahan:</span><span class="detail-value">${alumni.status_pernikahan || '-'}</span></div>
      <div class="detail-item full-width"><span class="detail-label">Alamat Sekarang:</span><span class="detail-value">${alumni.alamat_sekarang || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Nama Ayah:</span><span class="detail-value">${source.nama_ayah || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">No HP Ayah:</span><span class="detail-value">${source.no_hp_ayah || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Nama Ibu:</span><span class="detail-value">${source.nama_ibu || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">No HP Ibu:</span><span class="detail-value">${source.no_hp_ibu || '-'}</span></div>
    </div>
  `;
}

// Display detail kelas
function displayDetailKelas(kelas) {
  const content = document.getElementById('detail-kelas');
  
  if (!kelas || kelas.length === 0) {
    content.innerHTML = '<div class="empty-state">Tidak ada riwayat kelas</div>';
    return;
  }
  
  content.innerHTML = kelas.map(k => `
    <div class="history-item">
      <h5>${k.kelas_diniyah || '-'} / ${k.kelas_sekolah || '-'}</h5>
      <div class="history-date">
        ${formatDate(k.tanggal_mulai)} - ${k.tanggal_selesai ? formatDate(k.tanggal_selesai) : 'Sekarang'}
      </div>
      ${k.keterangan ? `<div>${k.keterangan}</div>` : ''}
    </div>
  `).join('');
}

// Display detail kamar
function displayDetailKamar(kamar) {
  const content = document.getElementById('detail-kamar');
  
  if (!kamar || kamar.length === 0) {
    content.innerHTML = '<div class="empty-state">Tidak ada riwayat kamar</div>';
    return;
  }
  
  content.innerHTML = kamar.map(k => `
    <div class="history-item">
      <h5>${k.kamar} ${k.gedung ? `- ${k.gedung}` : ''} ${k.lantai ? `Lt. ${k.lantai}` : ''}</h5>
      <div class="history-date">
        ${formatDate(k.tanggal_mulai)} - ${k.tanggal_selesai ? formatDate(k.tanggal_selesai) : 'Sekarang'}
      </div>
      ${k.keterangan ? `<div>${k.keterangan}</div>` : ''}
    </div>
  `).join('');
}

// Display detail prestasi
function displayDetailPrestasi(prestasi) {
  const content = document.getElementById('detail-prestasi');
  
  if (!prestasi || prestasi.length === 0) {
    content.innerHTML = '<div class="empty-state">Tidak ada prestasi</div>';
    return;
  }
  
  content.innerHTML = prestasi.map(p => `
    <div class="history-item">
      <h5>${p.jenis}</h5>
      <div class="history-date">${formatDate(p.tanggal)}</div>
      ${p.deskripsi ? `<div>${p.deskripsi}</div>` : ''}
      ${p.penghargaan ? `<div><strong>Penghargaan:</strong> ${p.penghargaan}</div>` : ''}
    </div>
  `).join('');
}

// Display detail pelanggaran
function displayDetailPelanggaran(pelanggaran) {
  const content = document.getElementById('detail-pelanggaran');
  
  if (!pelanggaran || pelanggaran.length === 0) {
    content.innerHTML = '<div class="empty-state">Tidak ada pelanggaran</div>';
    return;
  }
  
  content.innerHTML = pelanggaran.map(p => `
    <div class="history-item">
      <h5>${p.jenis}</h5>
      <div class="history-date">${formatDate(p.tanggal)}</div>
      ${p.deskripsi ? `<div>${p.deskripsi}</div>` : ''}
      ${p.sanksi ? `<div><strong>Sanksi:</strong> ${p.sanksi}</div>` : ''}
    </div>
  `).join('');
}

// Switch detail tab
function switchDetailTab(tab) {
  document.querySelectorAll('.detail-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.detail-tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`.detail-tab[onclick="switchDetailTab('${tab}')"]`).classList.add('active');
  document.getElementById(`detail-${tab}`).classList.add('active');
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

// Close modal when clicking outside
window.onclick = function(event) {
  const addModal = document.getElementById('addModal');
  const editModal = document.getElementById('editModal');
  const detailModal = document.getElementById('detailModal');
  const additionalModal = document.getElementById('additionalModal');
  
  if (event.target === addModal) closeAddModal();
  if (event.target === editModal) closeEditModal();
  if (event.target === detailModal) closeDetailModal();
  if (event.target === additionalModal) closeAdditionalModal();
}

// Initialize
init();
