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

  // If date is in YYYY-MM-DD format, convert to DD/MM/YYYY
  if (dateString.includes('-')) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  return dateString;
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
