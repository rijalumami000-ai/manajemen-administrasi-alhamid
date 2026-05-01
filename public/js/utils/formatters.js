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
