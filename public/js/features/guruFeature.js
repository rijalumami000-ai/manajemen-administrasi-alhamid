import { escapeHtml } from '../utils/formatters.js';
import { populateFilterSelect } from '../utils/forms.js';
import { showMessage } from '../utils/messages.js';
import { renderPagination } from '../utils/pagination.js';

export function createGuruFeature({ elements, pageSize = 10, onSummaryChanged }) {
  let currentGuruList = [];
  let currentMataPelajaranList = [];
  let currentJabatanList = [];
  let guruCurrentPage = 1;
  let editingGuruId = null;
  let editingMataPelajaranId = null;
  let editingJabatanId = null;

  function getMataPelajaranForm() {
    return document.getElementById('mata-pelajaran-form');
  }

  function getJabatanForm() {
    return document.getElementById('jabatan-form');
  }

  function clearGuruFormState() {
    if (!elements.guruForm) return;

    elements.guruForm.reset();
    if (elements.guruFormMessage) elements.guruFormMessage.style.display = 'none';
    if (elements.modalGuruTitle) elements.modalGuruTitle.textContent = 'Tambah Guru';
    if (elements.submitGuruButton) elements.submitGuruButton.textContent = 'Simpan Guru';
    editingGuruId = null;
  }

  function openGuruModal(guru = null) {
    clearGuruFormState();

    if (guru && elements.guruForm) {
      editingGuruId = guru.id;
      if (elements.modalGuruTitle) elements.modalGuruTitle.textContent = 'Edit Guru';
      if (elements.submitGuruButton) elements.submitGuruButton.textContent = 'Perbarui Guru';
      elements.guruForm.nip.value = guru.nip || '';
      elements.guruForm.nama.value = guru.nama || '';
      elements.guruForm.mata_pelajaran_id.value = guru.mata_pelajaran_id || '';
      elements.guruForm.jabatan_id.value = guru.jabatan_id || '';
      elements.guruForm.no_hp.value = guru.no_hp || '';
      elements.guruForm.alamat.value = guru.alamat || '';
      elements.guruForm.status.value = guru.status || '';
    }

    if (elements.modalGuru) elements.modalGuru.classList.add('active');
  }

  function closeGuruModal() {
    if (elements.modalGuru) elements.modalGuru.classList.remove('active');
    clearGuruFormState();
  }

  function clearMataPelajaranFormState() {
    const form = getMataPelajaranForm();
    if (!form) return;

    form.reset();
    if (elements.mataPelajaranFormMessage) elements.mataPelajaranFormMessage.style.display = 'none';
    if (elements.modalMataPelajaranTitle) elements.modalMataPelajaranTitle.textContent = 'Tambah Mata Pelajaran';
    if (elements.submitMataPelajaranButton) elements.submitMataPelajaranButton.textContent = 'Simpan Mata Pelajaran';
    editingMataPelajaranId = null;
  }

  function openMataPelajaranModal(item = null) {
    clearMataPelajaranFormState();

    if (item) {
      editingMataPelajaranId = item.id;
      if (elements.modalMataPelajaranTitle) elements.modalMataPelajaranTitle.textContent = 'Edit Mata Pelajaran';
      if (elements.submitMataPelajaranButton) elements.submitMataPelajaranButton.textContent = 'Perbarui Mata Pelajaran';
      const form = getMataPelajaranForm();
      if (form) {
        form.nama.value = item.nama || '';
      }
    }

    if (elements.modalMataPelajaran) elements.modalMataPelajaran.classList.add('active');
  }

  function closeMataPelajaranModal() {
    if (elements.modalMataPelajaran) elements.modalMataPelajaran.classList.remove('active');
    clearMataPelajaranFormState();
  }

  function clearJabatanFormState() {
    const form = getJabatanForm();
    if (!form) return;

    form.reset();
    if (elements.jabatanFormMessage) elements.jabatanFormMessage.style.display = 'none';
    if (elements.modalJabatanTitle) elements.modalJabatanTitle.textContent = 'Tambah Jabatan';
    if (elements.submitJabatanButton) elements.submitJabatanButton.textContent = 'Simpan Jabatan';
    editingJabatanId = null;
  }

  function openJabatanModal(item = null) {
    clearJabatanFormState();

    if (item) {
      editingJabatanId = item.id;
      if (elements.modalJabatanTitle) elements.modalJabatanTitle.textContent = 'Edit Jabatan';
      if (elements.submitJabatanButton) elements.submitJabatanButton.textContent = 'Perbarui Jabatan';
      const form = getJabatanForm();
      if (form) {
        form.nama.value = item.nama || '';
      }
    }

    if (elements.modalJabatan) elements.modalJabatan.classList.add('active');
  }

  function closeJabatanModal() {
    if (elements.modalJabatan) elements.modalJabatan.classList.remove('active');
    clearJabatanFormState();
  }

  function renderGuruTable() {
    if (!elements.guruTableBody) return;

    const keyword = (elements.guruSearch ? elements.guruSearch.value : '').trim().toLowerCase();
    const jabatan = elements.guruFilterJabatan ? elements.guruFilterJabatan.value : '';
    const mapel = elements.guruFilterMapel ? elements.guruFilterMapel.value : '';
    const status = elements.guruFilterStatus ? elements.guruFilterStatus.value : '';

    const filtered = currentGuruList.filter((guru) => {
      const searchable = [
        guru.nip,
        guru.nama,
        guru.mata_pelajaran,
        guru.jabatan,
        guru.no_hp,
        guru.alamat,
        guru.status,
      ].join(' ').toLowerCase();

      return (!keyword || searchable.includes(keyword))
        && (!jabatan || guru.jabatan === jabatan)
        && (!mapel || guru.mata_pelajaran === mapel)
        && (!status || guru.status === status);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    guruCurrentPage = Math.min(guruCurrentPage, totalPages);
    const start = (guruCurrentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    elements.guruTableBody.innerHTML = pageItems.length ? pageItems.map((guru) => `
      <tr>
        <td>${escapeHtml(guru.nip || '-')}</td>
        <td>${escapeHtml(guru.nama || '-')}</td>
        <td>${escapeHtml(guru.mata_pelajaran || '-')}</td>
        <td>${escapeHtml(guru.jabatan || '-')}</td>
        <td>${escapeHtml(guru.no_hp || '-')}</td>
        <td>${escapeHtml(guru.alamat || '-')}</td>
        <td>${escapeHtml(guru.status || '-')}</td>
        <td class="table-actions-cell">
          <button type="button" class="table-action edit" data-id="${guru.id}">Edit</button>
          <button type="button" class="table-action delete" data-id="${guru.id}">Hapus</button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="8">Tidak ada data guru yang sesuai.</td></tr>';

    renderPagination(elements.guruPagination, filtered.length, guruCurrentPage, (page) => {
      guruCurrentPage = page;
      renderGuruTable();
    }, pageSize);
  }

  function renderMasterList(container, items, emptyLabel, type) {
    if (!container) return;

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state empty-state-compact">
          <div class="empty-state-icon">!</div>
          <h3>Belum ada data</h3>
          <p>${escapeHtml(emptyLabel)}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items
      .map((item, index) => `
        <div class="master-list-item">
          <span class="master-list-index">${index + 1}</span>
          <span class="master-list-name">${escapeHtml(item.nama || '-')}</span>
          <div class="master-list-actions">
            <button type="button" class="master-action edit" data-type="${type}" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.nama || '')}">
              Edit
            </button>
            <button type="button" class="master-action delete" data-type="${type}" data-id="${item.id}" aria-label="Hapus ${escapeHtml(item.nama || '')}">
              Hapus
            </button>
          </div>
        </div>
      `)
      .join('');
  }

  function populateMasterSelects() {
    const mataPelajaranSelects = document.querySelectorAll('select[name="mata_pelajaran_id"], select[name="mata_pelajaran"]');
    mataPelajaranSelects.forEach((select) => {
      select.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
      currentMataPelajaranList.forEach((mataPelajaran) => {
        const option = document.createElement('option');
        option.value = mataPelajaran.id;
        option.textContent = mataPelajaran.nama;
        select.appendChild(option);
      });
    });

    const jabatanSelects = document.querySelectorAll('select[name="jabatan_id"], select[name="jabatan"]');
    jabatanSelects.forEach((select) => {
      select.innerHTML = '<option value="">-- Pilih Jabatan --</option>';
      currentJabatanList.forEach((jabatan) => {
        const option = document.createElement('option');
        option.value = jabatan.id;
        option.textContent = jabatan.nama;
        select.appendChild(option);
      });
    });
  }

  async function loadMasterData() {
    try {
      const [mataPelajaranResponse, jabatanResponse] = await Promise.all([
        fetch('/api/mata-pelajaran', { cache: 'no-store' }),
        fetch('/api/jabatan', { cache: 'no-store' }),
      ]);

      const mataPelajaranItems = await mataPelajaranResponse.json();
      const jabatanItems = await jabatanResponse.json();
      currentMataPelajaranList = Array.isArray(mataPelajaranItems) ? mataPelajaranItems : [];
      currentJabatanList = Array.isArray(jabatanItems) ? jabatanItems : [];

      populateMasterSelects();
      renderMasterList(elements.mataPelajaranList, currentMataPelajaranList, 'Tambahkan mata pelajaran pertama dari tombol di atas.', 'mata-pelajaran');
      renderMasterList(elements.jabatanList, currentJabatanList, 'Tambahkan jabatan pertama dari tombol di atas.', 'jabatan');

      if (elements.mataPelajaranCount) elements.mataPelajaranCount.textContent = currentMataPelajaranList.length;
      if (elements.jabatanCount) elements.jabatanCount.textContent = currentJabatanList.length;
    } catch (error) {
      console.error('Fetch master data failed', error);
      renderMasterList(elements.mataPelajaranList, [], 'Gagal memuat mata pelajaran. Coba muat ulang halaman.', 'mata-pelajaran');
      renderMasterList(elements.jabatanList, [], 'Gagal memuat jabatan. Coba muat ulang halaman.', 'jabatan');
      if (elements.mataPelajaranCount) elements.mataPelajaranCount.textContent = '0';
      if (elements.jabatanCount) elements.jabatanCount.textContent = '0';
    }
  }

  async function fetchGuru() {
    try {
      const response = await fetch('/api/guru');
      const items = await response.json();
      currentGuruList = Array.isArray(items) ? items : [];
      if (elements.guruTabCount) elements.guruTabCount.textContent = currentGuruList.length;
      populateFilterSelect(elements.guruFilterJabatan, currentGuruList, (guru) => guru.jabatan, 'Semua Jabatan');
      populateFilterSelect(elements.guruFilterMapel, currentGuruList, (guru) => guru.mata_pelajaran, 'Semua Mapel');
      populateFilterSelect(elements.guruFilterStatus, currentGuruList, (guru) => guru.status, 'Semua Status');
      renderGuruTable();
    } catch (error) {
      console.error('Fetch guru failed', error);
    }
  }

  function findGuruById(id) {
    return currentGuruList.find((item) => item.id === Number(id));
  }

  function findMataPelajaranById(id) {
    return currentMataPelajaranList.find((item) => item.id === Number(id));
  }

  function findJabatanById(id) {
    return currentJabatanList.find((item) => item.id === Number(id));
  }

  async function deleteGuru(id) {
    if (!confirm('Hapus data guru ini?')) return;

    try {
      const response = await fetch(`/api/guru/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(elements.guruMessage, data.error || 'Gagal menghapus guru.', 'error');
        return;
      }

      showMessage(elements.guruMessage, data.message || 'Data guru berhasil dihapus.', 'success');
      if (onSummaryChanged) await onSummaryChanged();
      await fetchGuru();
    } catch (error) {
      console.error('Delete guru failed', error);
      showMessage(elements.guruMessage, 'Tidak bisa menghapus data guru.', 'error');
    }
  }

  async function deleteMataPelajaran(id) {
    if (!confirm('Hapus mata pelajaran ini?')) return;

    try {
      const response = await fetch(`/api/mata-pelajaran/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(elements.mataPelajaranFormMessage || elements.guruMessage, data.error || 'Gagal menghapus mata pelajaran.', 'error');
        return;
      }

      showMessage(elements.guruMessage, data.message || 'Mata pelajaran berhasil dihapus.', 'success');
      await loadMasterData();
      await fetchGuru();
    } catch (error) {
      console.error('Delete mata pelajaran failed', error);
      showMessage(elements.mataPelajaranFormMessage || elements.guruMessage, 'Tidak bisa menghapus mata pelajaran.', 'error');
    }
  }

  async function deleteJabatan(id) {
    if (!confirm('Hapus jabatan ini?')) return;

    try {
      const response = await fetch(`/api/jabatan/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(elements.jabatanFormMessage || elements.guruMessage, data.error || 'Gagal menghapus jabatan.', 'error');
        return;
      }

      showMessage(elements.guruMessage, data.message || 'Jabatan berhasil dihapus.', 'success');
      await loadMasterData();
      await fetchGuru();
    } catch (error) {
      console.error('Delete jabatan failed', error);
      showMessage(elements.jabatanFormMessage || elements.guruMessage, 'Tidak bisa menghapus jabatan.', 'error');
    }
  }

  function bindModalEvents() {
    if (elements.btnTambahGuru) elements.btnTambahGuru.addEventListener('click', () => openGuruModal());
    if (elements.closeModalGuru) elements.closeModalGuru.addEventListener('click', closeGuruModal);
    if (elements.cancelModalGuru) elements.cancelModalGuru.addEventListener('click', closeGuruModal);
    if (elements.modalGuru) {
      elements.modalGuru.addEventListener('click', (event) => {
        if (event.target === elements.modalGuru) closeGuruModal();
      });
    }

    if (elements.btnTambahMataPelajaran) elements.btnTambahMataPelajaran.addEventListener('click', () => openMataPelajaranModal());
    if (elements.closeModalMataPelajaran) elements.closeModalMataPelajaran.addEventListener('click', closeMataPelajaranModal);
    if (elements.cancelModalMataPelajaran) elements.cancelModalMataPelajaran.addEventListener('click', closeMataPelajaranModal);
    if (elements.modalMataPelajaran) {
      elements.modalMataPelajaran.addEventListener('click', (event) => {
        if (event.target === elements.modalMataPelajaran) closeMataPelajaranModal();
      });
    }

    if (elements.btnTambahJabatan) elements.btnTambahJabatan.addEventListener('click', () => openJabatanModal());
    if (elements.closeModalJabatan) elements.closeModalJabatan.addEventListener('click', closeJabatanModal);
    if (elements.cancelModalJabatan) elements.cancelModalJabatan.addEventListener('click', closeJabatanModal);
    if (elements.modalJabatan) {
      elements.modalJabatan.addEventListener('click', (event) => {
        if (event.target === elements.modalJabatan) closeJabatanModal();
      });
    }
  }

  function bindTableEvents() {
    if (elements.guruTableBody) {
      elements.guruTableBody.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const guruId = button.dataset.id;
        if (button.classList.contains('edit')) {
          const guru = findGuruById(guruId);
          if (guru) openGuruModal(guru);
          return;
        }

        if (button.classList.contains('delete')) {
          deleteGuru(guruId);
        }
      });
    }

    [elements.guruSearch, elements.guruFilterJabatan, elements.guruFilterMapel, elements.guruFilterStatus].forEach((control) => {
      if (!control) return;
      control.addEventListener('input', () => {
        guruCurrentPage = 1;
        renderGuruTable();
      });
      control.addEventListener('change', () => {
        guruCurrentPage = 1;
        renderGuruTable();
      });
    });
  }

  function bindMasterListEvents() {
    if (elements.mataPelajaranList) {
      elements.mataPelajaranList.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const itemId = button.dataset.id;
        const item = findMataPelajaranById(itemId);
        if (!item) return;

        if (button.classList.contains('edit')) {
          openMataPelajaranModal(item);
          return;
        }

        if (button.classList.contains('delete')) {
          deleteMataPelajaran(itemId);
        }
      });
    }

    if (elements.jabatanList) {
      elements.jabatanList.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const itemId = button.dataset.id;
        const item = findJabatanById(itemId);
        if (!item) return;

        if (button.classList.contains('edit')) {
          openJabatanModal(item);
          return;
        }

        if (button.classList.contains('delete')) {
          deleteJabatan(itemId);
        }
      });
    }
  }

  function bindFormEvents() {
    if (elements.guruForm) {
      elements.guruForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(elements.guruForm);
        const body = {
          nip: formData.get('nip'),
          nama: formData.get('nama'),
          mata_pelajaran_id: formData.get('mata_pelajaran_id') || null,
          jabatan_id: formData.get('jabatan_id') || null,
          no_hp: formData.get('no_hp'),
          alamat: formData.get('alamat'),
          status: formData.get('status'),
        };

        try {
          const response = await fetch(editingGuruId ? `/api/guru/${editingGuruId}` : '/api/guru', {
            method: editingGuruId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorData = await response.json();
            showMessage(elements.guruFormMessage || elements.guruMessage, errorData.error || 'Terjadi kesalahan.', 'error');
            return;
          }

          showMessage(elements.guruMessage, editingGuruId ? 'Data guru berhasil diperbarui.' : 'Data guru berhasil disimpan.', 'success');
          closeGuruModal();
          if (onSummaryChanged) await onSummaryChanged();
          await fetchGuru();
        } catch (error) {
          console.error('Submit guru failed', error);
          showMessage(elements.guruFormMessage || elements.guruMessage, 'Tidak bisa menyimpan data.', 'error');
        }
      });
    }

    const mataPelajaranForm = getMataPelajaranForm();
    if (mataPelajaranForm) {
      mataPelajaranForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(mataPelajaranForm);
        const body = {
          nama: formData.get('nama'),
        };

        try {
          const response = await fetch(editingMataPelajaranId ? `/api/mata-pelajaran/${editingMataPelajaranId}` : '/api/mata-pelajaran', {
            method: editingMataPelajaranId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorData = await response.json();
            showMessage(elements.mataPelajaranFormMessage || elements.guruMessage, errorData.error || 'Terjadi kesalahan.', 'error');
            return;
          }

          showMessage(
            elements.mataPelajaranFormMessage || elements.guruMessage,
            editingMataPelajaranId ? 'Mata pelajaran berhasil diperbarui.' : 'Mata pelajaran berhasil disimpan.',
            'success'
          );
          closeMataPelajaranModal();
          await loadMasterData();
          await fetchGuru();
        } catch (error) {
          console.error('Submit mata pelajaran failed', error);
          showMessage(elements.mataPelajaranFormMessage || elements.guruMessage, 'Tidak bisa menyimpan mata pelajaran.', 'error');
        }
      });
    }

    const jabatanForm = getJabatanForm();
    if (jabatanForm) {
      jabatanForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(jabatanForm);
        const body = {
          nama: formData.get('nama'),
        };

        try {
          const response = await fetch(editingJabatanId ? `/api/jabatan/${editingJabatanId}` : '/api/jabatan', {
            method: editingJabatanId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorData = await response.json();
            showMessage(elements.jabatanFormMessage || elements.guruMessage, errorData.error || 'Terjadi kesalahan.', 'error');
            return;
          }

          showMessage(
            elements.jabatanFormMessage || elements.guruMessage,
            editingJabatanId ? 'Jabatan berhasil diperbarui.' : 'Jabatan berhasil disimpan.',
            'success'
          );
          closeJabatanModal();
          await loadMasterData();
          await fetchGuru();
        } catch (error) {
          console.error('Submit jabatan failed', error);
          showMessage(elements.jabatanFormMessage || elements.guruMessage, 'Tidak bisa menyimpan jabatan.', 'error');
        }
      });
    }
  }

  function bindEvents() {
    bindModalEvents();
    bindTableEvents();
    bindMasterListEvents();
    bindFormEvents();
  }

  return {
    bindEvents,
    fetchGuru,
    loadMasterData,
  };
}
