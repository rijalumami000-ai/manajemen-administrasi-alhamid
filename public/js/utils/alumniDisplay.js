// alumniDisplay.js - Display & rendering functions for alumni

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Display alumni cards
 */
export function displayAlumni(alumni) {
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
        <button class="button-secondary" style="padding: 6px 12px; font-size: 14px;" onclick="window.alumniFeature.showDetail(${a.id})">Detail</button>
        <button class="button-secondary" style="padding: 6px 12px; font-size: 14px;" onclick="window.alumniFeature.openAdditionalModal(${a.id})">Tambah Informasi Tambahan</button>
        <button class="button-secondary" style="padding: 6px 12px; font-size: 14px; background: #dc3545; color: white;" onclick="window.alumniFeature.deleteAlumni(${a.id}, '${a.nama.replace(/'/g, "\\'")}')">Hapus</button>
      </div>
    </div>
  `).join('');
}

/**
 * Update statistics
 */
export function updateStats(alumni) {
  document.getElementById('totalAlumni').textContent = alumni.length;

  if (alumni.length > 0) {
    const latestYear = Math.max(...alumni.map(a => a.tahun_lulus));
    document.getElementById('latestYear').textContent = latestYear;

    const working = alumni.filter(a => a.pekerjaan).length;
    document.getElementById('workingAlumni').textContent = working;
  }
}

/**
 * Populate year filter dropdown
 */
export function populateYearFilter(alumni) {
  const years = [...new Set(alumni.map(a => a.tahun_lulus))].sort((a, b) => b - a);
  const select = document.getElementById('yearFilter');

  select.innerHTML = '<option value="">Semua Tahun</option>' +
    years.map(year => `<option value="${year}">${year}</option>`).join('');
}
