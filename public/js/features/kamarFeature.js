import { escapeHtml } from '../utils/formatters.js';
import { showMessage } from '../utils/messages.js';

export function createKamarFeature({ elements, onLoaded }) {
  let items = [];
  let editingId = null;

  function clearFormState() {
    if (!elements.form) return;

    elements.form.reset();
    if (elements.formMessage) elements.formMessage.style.display = 'none';
    if (elements.modalTitle) elements.modalTitle.textContent = 'Tambah Kamar';
    if (elements.submitButton) elements.submitButton.textContent = 'Simpan Kamar';
    editingId = null;
  }

  function openModal(kamar = null) {
    clearFormState();

    if (kamar && elements.form) {
      editingId = kamar.id;
      if (elements.modalTitle) elements.modalTitle.textContent = 'Edit Kamar';
      if (elements.submitButton) elements.submitButton.textContent = 'Perbarui Kamar';
      elements.form.nama.value = kamar.nama || '';
      elements.form.gedung.value = kamar.gedung || '';
      elements.form.lantai.value = kamar.lantai || '';
      elements.form.kapasitas.value = kamar.kapasitas || '';
      elements.form.terisi.value = kamar.terisi || 0;
      elements.form.jenis.value = kamar.jenis || '';
      elements.form.status.value = kamar.status || 'Tersedia';
      elements.form.fasilitas.value = kamar.fasilitas || '';
      elements.form.keterangan.value = kamar.keterangan || '';
    }

    if (elements.modal) elements.modal.classList.add('active');
  }

  function closeModal() {
    if (elements.modal) elements.modal.classList.remove('active');
    clearFormState();
  }

  function render(nextItems = items) {
    if (!elements.cards) return;

    if (!nextItems.length) {
      elements.cards.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">!</div>
          <h3>Belum ada data kamar</h3>
          <p>Tekan tombol Tambah Kamar untuk membuat data kamar pertama.</p>
        </div>
      `;
      return;
    }

    elements.cards.innerHTML = nextItems.map((kamar) => {
      const persenTerisi = kamar.kapasitas > 0 ? Math.round((kamar.terisi / kamar.kapasitas) * 100) : 0;
      const statusClass = kamar.status === 'Penuh' ? 'danger' : kamar.status === 'Maintenance' ? 'warning' : 'success';
      const jenisClass = kamar.jenis === 'Putra' ? 'primary' : 'accent';

      return `
        <article class="kelas-card" data-id="${kamar.id}">
          <div class="kelas-card-header">
            <span class="kelas-badge kelas-badge-${jenisClass}">${escapeHtml(kamar.jenis || 'Kamar')}</span>
            <div class="kelas-card-actions">
              <button type="button" class="card-action edit" data-action="edit" data-id="${kamar.id}">Edit</button>
              <button type="button" class="card-action delete" data-action="delete" data-id="${kamar.id}">Hapus</button>
            </div>
          </div>
          <div class="kelas-card-body">
            <div class="kelas-field">
              <span>Nama Kamar</span>
              <strong>${escapeHtml(kamar.nama || '-')}</strong>
            </div>
            ${kamar.gedung ? `<div class="kelas-field"><span>Gedung</span><strong>${escapeHtml(kamar.gedung)}</strong></div>` : ''}
            ${kamar.lantai ? `<div class="kelas-field"><span>Lantai</span><strong>${kamar.lantai}</strong></div>` : ''}
            <div class="kelas-field">
              <span>Kapasitas</span>
              <strong>${kamar.terisi} / ${kamar.kapasitas} (${persenTerisi}%)</strong>
            </div>
            <div class="kelas-field">
              <span>Status</span>
              <strong class="status-badge status-${statusClass}">${escapeHtml(kamar.status || '-')}</strong>
            </div>
            ${kamar.fasilitas ? `<div class="kelas-field"><span>Fasilitas</span><strong>${escapeHtml(kamar.fasilitas)}</strong></div>` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  async function load() {
    try {
      const response = await fetch('/api/kamar', { cache: 'no-store' });
      const nextItems = await response.json();
      items = Array.isArray(nextItems) ? nextItems : [];
      render(items);
      if (onLoaded) onLoaded(items);
      return items;
    } catch (error) {
      console.error('Fetch kamar failed', error);
      if (elements.cards) {
        elements.cards.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">!</div>
            <h3>Gagal memuat data kamar</h3>
            <p>Silakan coba muat ulang halaman atau cek koneksi ke server.</p>
          </div>
        `;
      }
      if (onLoaded) onLoaded([]);
      return [];
    }
  }

  async function deleteItem(id) {
    if (!confirm('Hapus data kamar ini?')) return;

    try {
      const response = await fetch(`/api/kamar/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        showMessage(elements.message, data.error || 'Gagal menghapus kamar.', 'error');
        return;
      }

      showMessage(elements.message, data.message || 'Data kamar berhasil dihapus.', 'success');
      await load();
    } catch (error) {
      console.error('Delete kamar failed', error);
      showMessage(elements.message, 'Tidak bisa menghapus data kamar.', 'error');
    }
  }

  function findById(id) {
    return items.find((item) => item.id === Number(id));
  }

  function bindEvents() {
    if (elements.addButton) elements.addButton.addEventListener('click', () => openModal());
    if (elements.closeButton) elements.closeButton.addEventListener('click', closeModal);
    if (elements.cancelButton) elements.cancelButton.addEventListener('click', closeModal);

    if (elements.modal) {
      elements.modal.addEventListener('click', (event) => {
        if (event.target === elements.modal) closeModal();
      });
    }

    if (elements.cards) {
      elements.cards.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const kamarId = button.dataset.id;
        if (button.dataset.action === 'edit') {
          const kamar = findById(kamarId);
          if (kamar) openModal(kamar);
          return;
        }

        if (button.classList.contains('delete')) {
          deleteItem(kamarId);
        }
      });
    }

    if (elements.form) {
      elements.form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(elements.form);
        const body = {
          nama: formData.get('nama'),
          gedung: formData.get('gedung'),
          lantai: formData.get('lantai'),
          kapasitas: formData.get('kapasitas'),
          terisi: formData.get('terisi'),
          jenis: formData.get('jenis'),
          status: formData.get('status'),
          fasilitas: formData.get('fasilitas'),
          keterangan: formData.get('keterangan'),
        };

        try {
          const response = await fetch(editingId ? `/api/kamar/${editingId}` : '/api/kamar', {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorData = await response.json();
            showMessage(elements.formMessage, errorData.error || 'Terjadi kesalahan.', 'error');
            return;
          }

          const isEditing = Boolean(editingId);
          closeModal();
          showMessage(elements.message, isEditing ? 'Data kamar berhasil diperbarui.' : 'Data kamar berhasil disimpan.', 'success');
          await load();
        } catch (error) {
          console.error('Submit kamar failed', error);
          showMessage(elements.formMessage, 'Tidak bisa menyimpan data kamar.', 'error');
        }
      });
    }
  }

  return {
    bindEvents,
    load,
    render,
  };
}
