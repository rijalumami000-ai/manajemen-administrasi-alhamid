export function escapeHtml(value) {
  const input = String(value ?? '');
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatStatusTahunAjaran(status) {
  const labels = {
    aktif: 'Aktif',
    draft: 'Draft',
    tidak_naik: 'Tidak Naik',
    lulus: 'Lulus',
    alumni: 'Alumni',
    pindah: 'Pindah',
    keluar: 'Keluar',
  };
  return labels[status] || 'Aktif';
}

export function statusBadgeClass(status) {
  if (status === 'aktif') return 'status-success';
  if (status === 'tidak_naik' || status === 'draft') return 'status-warning';
  if (status === 'pindah' || status === 'keluar') return 'status-danger';
  return 'status-muted';
}

export function formatDate(dateString) {
  if (!dateString) return '-';

  try {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}

  const str = String(dateString).trim().split('T')[0];
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }

  return String(dateString);
}

export function parseDateToISO(dateString) {
  if (!dateString) return null;

  // If date is in DD/MM/YYYY format, convert to YYYY-MM-DD
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return dateString;
}
