import { escapeHtml } from '../utils/formatters.js';
import { showMessage } from '../utils/messages.js';

export function createKelasFeature({ elements, onLoaded }) {
  let items = [];
  let editingId = null;

  function clearFormState() {
    if (!elements.form) return;

    elements.form.reset();
    if (elements.formMessage) elements.formMessage.style.display = 'none';
    if (elements.modalTitle) elements.modalTitle.textContent = 'Tambah Kelas';
    if (elements.submitButton) elements.submitButton.textContent = 'Simpan Kelas';
    editingId = null;
  }

  function openModal(kelas = null) {
    clearFormState();

    if (kelas && elements.form) {
      editingId = kelas.id;
      if (elements.modalTitle) elements.modalTitle.textContent = 'Edit Kelas';
      if (elements.submitButton) elements.submitButton.textContent = 'Perbarui Kelas';
      elements.form.jenis.value = kelas.jenis || '';
      elements.form.nama.value = kelas.nama || '';
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
          <h3>Belum ada data kelas</h3>
          <p>Tekan tombol Tambah Kelas untuk membuat data kelas pertama.</p>
        </div>
      `;
      return;
    }

    const sortValue = elements.sortSelect ? elements.sortSelect.value : 'nama-asc';
    const sortedItems = [...nextItems].sort((a, b) => {
      if (sortValue === 'terbaru' || sortValue === 'terlama') {
        const firstDate = new Date(a.created_at || 0).getTime();
        const secondDate = new Date(b.created_at || 0).getTime();
        return sortValue === 'terbaru' ? secondDate - firstDate : firstDate - secondDate;
      }

      const firstName = a.nama || '';
      const secondName = b.nama || '';
      return sortValue === 'nama-desc'
        ? secondName.localeCompare(firstName, 'id', { numeric: true, sensitivity: 'base' })
        : firstName.localeCompare(secondName, 'id', { numeric: true, sensitivity: 'base' });
    });

    const renderKelasCard = (kelas) => `
      <article class="kelas-card" data-id="${kelas.id}">
        <div class="kelas-card-header">
          <span class="kelas-badge kelas-badge-${kelas.jenis === 'Sekolah' ? 'accent' : 'primary'}">${escapeHtml(kelas.jenis || 'Kelas')}</span>
          <div class="kelas-card-actions">
            <button type="button" class="card-action edit" data-action="edit" data-id="${kelas.id}" aria-label="Edit kelas ${escapeHtml(kelas.nama || '')}">
              Edit
            </button>
            <button type="button" class="card-action delete" data-action="delete" data-id="${kelas.id}" aria-label="Hapus kelas ${escapeHtml(kelas.nama || '')}">
              Hapus
            </button>
          </div>
        </div>
        <div class="kelas-card-body">
          <div class="kelas-field">
            <span>Nama Kelas</span>
            <strong>${escapeHtml(kelas.nama || '-')}</strong>
          </div>
        </div>
      </article>
    `;

    const renderKelasGroup = (jenis, title) => {
      const groupItems = sortedItems.filter((kelas) => kelas.jenis === jenis);
      return `
        <section class="kelas-card-group" aria-label="${title}">
          <div class="kelas-group-header">
            <div>
              <h3>${title}</h3>
              <p>${groupItems.length} kelas terdaftar</p>
            </div>
          </div>
          ${
            groupItems.length
              ? `<div class="kelas-card-grid">${groupItems.map(renderKelasCard).join('')}</div>`
              : `<div class="empty-state empty-state-compact">
                  <h3>Belum ada ${title.toLowerCase()}</h3>
                  <p>Tambahkan kelas baru dengan jenis ${jenis}.</p>
                </div>`
          }
        </section>
      `;
    };

    elements.cards.innerHTML = [
      renderKelasGroup('Diniyah', 'Kelas Diniyah'),
      renderKelasGroup('Sekolah', 'Kelas Sekolah'),
    ].join('');
  }

  async function load() {
    try {
      const response = await fetch('/api/kelas', { cache: 'no-store' });
      const nextItems = await response.json();
      items = Array.isArray(nextItems) ? nextItems : [];
      render(items);
      if (onLoaded) onLoaded(items);
      return items;
    } catch (error) {
      console.error('Fetch kelas failed', error);
      if (elements.cards) {
        elements.cards.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">!</div>
            <h3>Gagal memuat data kelas</h3>
            <p>Silakan coba muat ulang halaman atau cek koneksi ke server.</p>
          </div>
        `;
      }
      if (onLoaded) onLoaded([]);
      return [];
    }
  }

  async function deleteItem(id) {
    if (!confirm('Hapus data kelas ini?')) return;

    try {
      const response = await fetch(`/api/kelas/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(elements.message, data.error || 'Gagal menghapus kelas.', 'error');
        return;
      }

      showMessage(elements.message, data.message || 'Data kelas berhasil dihapus.', 'success');
      await load();
    } catch (error) {
      console.error('Delete kelas failed', error);
      showMessage(elements.message, 'Tidak bisa menghapus data kelas.', 'error');
    }
  }

  function findById(id) {
    return items.find((item) => item.id === Number(id));
  }

  function bindEvents() {
    if (elements.addButton) elements.addButton.addEventListener('click', () => openModal());
    if (elements.sortSelect) elements.sortSelect.addEventListener('change', () => render(items));
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

        const kelasId = button.dataset.id;
        if (button.dataset.action === 'edit') {
          const kelas = findById(kelasId);
          if (kelas) openModal(kelas);
          return;
        }

        if (button.classList.contains('delete')) {
          deleteItem(kelasId);
        }
      });
    }

    if (elements.form) {
      elements.form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(elements.form);
        const body = {
          jenis: formData.get('jenis'),
          nama: formData.get('nama'),
        };

        try {
          const response = await fetch(editingId ? `/api/kelas/${editingId}` : '/api/kelas', {
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
          showMessage(elements.message, isEditing ? 'Data kelas berhasil diperbarui.' : 'Data kelas berhasil disimpan.', 'success');
          await load();
        } catch (error) {
          console.error('Submit kelas failed', error);
          showMessage(elements.formMessage, 'Tidak bisa menyimpan data kelas.', 'error');
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
