// alumniDetail.js - Detail view & tabs for alumni

import { formatDate, escapeHtml } from './alumniDisplay.js';
import { mergeAdditionalInfo } from './alumniCrud.js';

const API_URL = 'http://localhost:3000/api';

// LocalStorage for kamar overrides
let santriKamarOverrides = JSON.parse(localStorage.getItem('santriKamarOverrides') || '{}');
let allKamar = [];
let currentDetailAlumni = null;

/**
 * Set kamar list (called from main feature)
 */
export function setKamarList(kamarList) {
  allKamar = kamarList;
}

/**
 * Close detail modal
 */
export function closeDetailModal() {
  document.getElementById('detailModal').style.display = 'none';
}

/**
 * Show detail modal
 */
export async function showDetail(id) {
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

/**
 * Display detail info tab
 */
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

/**
 * Display detail kelas history
 */
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

/**
 * Display detail kamar history
 */
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

/**
 * Display detail prestasi
 */
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

/**
 * Display detail pelanggaran
 */
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

/**
 * Switch detail tab
 */
export function switchDetailTab(tab) {
  document.querySelectorAll('.detail-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.detail-tab-content').forEach(content => content.classList.remove('active'));

  document.querySelector(`.detail-tab[onclick="window.alumniFeature.switchDetailTab('${tab}')"]`).classList.add('active');
  document.getElementById(`detail-${tab}`).classList.add('active');
}
