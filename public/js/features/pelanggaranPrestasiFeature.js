import { escapeHtml } from '../utils/formatters.js';
import { showMessage } from '../utils/messages.js';
import { setupSantriAutocomplete } from '../utils/santriAutocomplete.js';

export function createPelanggaranPrestasiFeature({ elements }) {
  let currentPelanggaranList = [];
  let currentPrestasiList = [];
  let editingPelanggaranId = null;
  let editingPrestasiId = null;

  function clearPelanggaranFormState() {
    if (!elements.pelanggaranForm) return;

    elements.pelanggaranForm.reset();
    if (elements.pelanggaranFormMessage) elements.pelanggaranFormMessage.style.display = 'none';
    if (elements.modalPelanggaranTitle) elements.modalPelanggaranTitle.textContent = 'Tambah Pelanggaran';
    if (elements.submitPelanggaranButton) elements.submitPelanggaranButton.textContent = 'Simpan';
    editingPelanggaranId = null;
  }

  async function openPelanggaranModal(pelanggaran = null) {
    clearPelanggaranFormState();

    await setupSantriAutocomplete({
      searchInputId: 'pelanggaran-santri-search',
      hiddenInputId: 'pelanggaran-santri-id',
      suggestionsId: 'pelanggaran-santri-suggestions',
      selectedSantriId: pelanggaran ? pelanggaran.santri_id : '',
    });

    if (pelanggaran && elements.pelanggaranForm) {
      editingPelanggaranId = pelanggaran.id;
      if (elements.modalPelanggaranTitle) elements.modalPelanggaranTitle.textContent = 'Edit Pelanggaran';
      if (elements.submitPelanggaranButton) elements.submitPelanggaranButton.textContent = 'Perbarui';

      elements.pelanggaranForm.jenis.value = pelanggaran.jenis || '';
      elements.pelanggaranForm.tanggal.value = pelanggaran.tanggal || '';
      elements.pelanggaranForm.deskripsi.value = pelanggaran.deskripsi || '';
      elements.pelanggaranForm.sanksi.value = pelanggaran.sanksi || '';
    }

    if (elements.modalPelanggaran) elements.modalPelanggaran.classList.add('active');
  }

  function closePelanggaranModal() {
    if (elements.modalPelanggaran) elements.modalPelanggaran.classList.remove('active');
    clearPelanggaranFormState();
  }

  function clearPrestasiFormState() {
    if (!elements.prestasiForm) return;

    elements.prestasiForm.reset();
    if (elements.prestasiFormMessage) elements.prestasiFormMessage.style.display = 'none';
    if (elements.modalPrestasiTitle) elements.modalPrestasiTitle.textContent = 'Tambah Prestasi';
    if (elements.submitPrestasiButton) elements.submitPrestasiButton.textContent = 'Simpan';
    editingPrestasiId = null;
  }

  async function openPrestasiModal(prestasi = null) {
    clearPrestasiFormState();

    await setupSantriAutocomplete({
      searchInputId: 'prestasi-santri-search',
      hiddenInputId: 'prestasi-santri-id',
      suggestionsId: 'prestasi-santri-suggestions',
      selectedSantriId: prestasi ? prestasi.santri_id : '',
    });

    if (prestasi && elements.prestasiForm) {
      editingPrestasiId = prestasi.id;
      if (elements.modalPrestasiTitle) elements.modalPrestasiTitle.textContent = 'Edit Prestasi';
      if (elements.submitPrestasiButton) elements.submitPrestasiButton.textContent = 'Perbarui';

      elements.prestasiForm.jenis.value = prestasi.jenis || '';
      elements.prestasiForm.tanggal.value = prestasi.tanggal || '';
      elements.prestasiForm.deskripsi.value = prestasi.deskripsi || '';
      elements.prestasiForm.penghargaan.value = prestasi.penghargaan || '';
    }

    if (elements.modalPrestasi) elements.modalPrestasi.classList.add('active');
  }

  function closePrestasiModal() {
    if (elements.modalPrestasi) elements.modalPrestasi.classList.remove('active');
    clearPrestasiFormState();
  }

  async function loadPelanggaran() {
    try {
      const response = await fetch('/api/pelanggaran', { cache: 'no-store' });
      const items = await response.json();
      currentPelanggaranList = Array.isArray(items) ? items : [];

      if (elements.pelanggaranTabCount) {
        elements.pelanggaranTabCount.textContent = currentPelanggaranList.length;
      }

      if (!elements.pelanggaranTableBody) return;

      if (!currentPelanggaranList.length) {
        elements.pelanggaranTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem;">
              Belum ada data pelanggaran
            </td>
          </tr>
        `;
        return;
      }

      elements.pelanggaranTableBody.innerHTML = currentPelanggaranList
        .map((pelanggaran) => `<tr>
          <td>${escapeHtml(pelanggaran.nis || '-')}</td>
          <td>${escapeHtml(pelanggaran.nama_santri || '-')}</td>
          <td>${escapeHtml(pelanggaran.jenis || '-')}</td>
          <td>${pelanggaran.tanggal || '-'}</td>
          <td>${escapeHtml(pelanggaran.deskripsi || '-')}</td>
          <td>${escapeHtml(pelanggaran.sanksi || '-')}</td>
          <td class="table-actions-cell">
            <button type="button" class="table-action edit" data-id="${pelanggaran.id}">Edit</button>
            <button type="button" class="table-action delete" data-id="${pelanggaran.id}">Hapus</button>
          </td>
        </tr>`)
        .join('');
    } catch (error) {
      console.error('Fetch pelanggaran failed', error);
      if (elements.pelanggaranTableBody) {
        elements.pelanggaranTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: #e74c3c;">
              Gagal memuat data pelanggaran
            </td>
          </tr>
        `;
      }
    }
  }

  async function loadPrestasi() {
    try {
      const response = await fetch('/api/prestasi', { cache: 'no-store' });
      const items = await response.json();
      currentPrestasiList = Array.isArray(items) ? items : [];

      if (elements.prestasiTabCount) {
        elements.prestasiTabCount.textContent = currentPrestasiList.length;
      }

      if (!elements.prestasiTableBody) return;

      if (!currentPrestasiList.length) {
        elements.prestasiTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem;">
              Belum ada data prestasi
            </td>
          </tr>
        `;
        return;
      }

      elements.prestasiTableBody.innerHTML = currentPrestasiList
        .map((prestasi) => `<tr>
          <td>${escapeHtml(prestasi.nis || '-')}</td>
          <td>${escapeHtml(prestasi.nama_santri || '-')}</td>
          <td>${escapeHtml(prestasi.jenis || '-')}</td>
          <td>${prestasi.tanggal || '-'}</td>
          <td>${escapeHtml(prestasi.deskripsi || '-')}</td>
          <td>${escapeHtml(prestasi.penghargaan || '-')}</td>
          <td class="table-actions-cell">
            <button type="button" class="table-action edit" data-id="${prestasi.id}">Edit</button>
            <button type="button" class="table-action delete" data-id="${prestasi.id}">Hapus</button>
          </td>
        </tr>`)
        .join('');
    } catch (error) {
      console.error('Fetch prestasi failed', error);
      if (elements.prestasiTableBody) {
        elements.prestasiTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: #e74c3c;">
              Gagal memuat data prestasi
            </td>
          </tr>
        `;
      }
    }
  }

  async function deletePelanggaran(id) {
    if (!confirm('Hapus data pelanggaran ini?')) return;

    try {
      const response = await fetch(`/api/pelanggaran/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(elements.pelanggaranMessage, data.error || 'Gagal menghapus pelanggaran.', 'error');
        return;
      }

      showMessage(elements.pelanggaranMessage, data.message || 'Data pelanggaran berhasil dihapus.', 'success');
      await loadPelanggaran();
    } catch (error) {
      console.error('Delete pelanggaran failed', error);
      showMessage(elements.pelanggaranMessage, 'Tidak bisa menghapus data pelanggaran.', 'error');
    }
  }

  async function deletePrestasi(id) {
    if (!confirm('Hapus data prestasi ini?')) return;

    try {
      const response = await fetch(`/api/prestasi/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(elements.prestasiMessage, data.error || 'Gagal menghapus prestasi.', 'error');
        return;
      }

      showMessage(elements.prestasiMessage, data.message || 'Data prestasi berhasil dihapus.', 'success');
      await loadPrestasi();
    } catch (error) {
      console.error('Delete prestasi failed', error);
      showMessage(elements.prestasiMessage, 'Tidak bisa menghapus data prestasi.', 'error');
    }
  }

  function findPelanggaranById(id) {
    return currentPelanggaranList.find((item) => item.id === Number(id));
  }

  function findPrestasiById(id) {
    return currentPrestasiList.find((item) => item.id === Number(id));
  }

  function bindModalEvents() {
    if (elements.btnTambahPelanggaran) elements.btnTambahPelanggaran.addEventListener('click', () => openPelanggaranModal());
    if (elements.closeModalPelanggaran) elements.closeModalPelanggaran.addEventListener('click', closePelanggaranModal);
    if (elements.cancelModalPelanggaran) elements.cancelModalPelanggaran.addEventListener('click', closePelanggaranModal);
    if (elements.modalPelanggaran) {
      elements.modalPelanggaran.addEventListener('click', (event) => {
        if (event.target === elements.modalPelanggaran) closePelanggaranModal();
      });
    }

    if (elements.btnTambahPrestasi) elements.btnTambahPrestasi.addEventListener('click', () => openPrestasiModal());
    if (elements.closeModalPrestasi) elements.closeModalPrestasi.addEventListener('click', closePrestasiModal);
    if (elements.cancelModalPrestasi) elements.cancelModalPrestasi.addEventListener('click', closePrestasiModal);
    if (elements.modalPrestasi) {
      elements.modalPrestasi.addEventListener('click', (event) => {
        if (event.target === elements.modalPrestasi) closePrestasiModal();
      });
    }
  }

  function bindTableEvents() {
    if (elements.pelanggaranTableBody) {
      elements.pelanggaranTableBody.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const pelanggaranId = button.dataset.id;
        if (button.classList.contains('edit')) {
          const pelanggaran = findPelanggaranById(pelanggaranId);
          if (pelanggaran) openPelanggaranModal(pelanggaran);
          return;
        }

        if (button.classList.contains('delete')) {
          deletePelanggaran(pelanggaranId);
        }
      });
    }

    if (elements.prestasiTableBody) {
      elements.prestasiTableBody.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const prestasiId = button.dataset.id;
        if (button.classList.contains('edit')) {
          const prestasi = findPrestasiById(prestasiId);
          if (prestasi) openPrestasiModal(prestasi);
          return;
        }

        if (button.classList.contains('delete')) {
          deletePrestasi(prestasiId);
        }
      });
    }
  }

  function bindFormEvents() {
    if (elements.pelanggaranForm) {
      elements.pelanggaranForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(elements.pelanggaranForm);
        const santriId = formData.get('santri_id');
        const jenis = formData.get('jenis');
        const tanggal = formData.get('tanggal');

        if (!santriId || !jenis || !tanggal) {
          showMessage(elements.pelanggaranFormMessage, 'Santri, jenis, dan tanggal wajib diisi.', 'error');
          return;
        }

        const body = {
          santri_id: santriId,
          jenis,
          tanggal,
          deskripsi: formData.get('deskripsi'),
          sanksi: formData.get('sanksi'),
        };

        try {
          const response = await fetch(
            editingPelanggaranId ? `/api/pelanggaran/${editingPelanggaranId}` : '/api/pelanggaran',
            {
              method: editingPelanggaranId ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            showMessage(elements.pelanggaranFormMessage, errorData.error || 'Terjadi kesalahan.', 'error');
            return;
          }

          showMessage(
            elements.pelanggaranMessage,
            editingPelanggaranId ? 'Data pelanggaran berhasil diperbarui.' : 'Data pelanggaran berhasil disimpan.',
            'success'
          );
          closePelanggaranModal();
          await loadPelanggaran();
        } catch (error) {
          console.error('Submit pelanggaran failed', error);
          showMessage(elements.pelanggaranFormMessage, 'Tidak bisa menyimpan data pelanggaran.', 'error');
        }
      });
    }

    if (elements.prestasiForm) {
      elements.prestasiForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(elements.prestasiForm);
        const santriId = formData.get('santri_id');
        const jenis = formData.get('jenis');
        const tanggal = formData.get('tanggal');

        if (!santriId || !jenis || !tanggal) {
          showMessage(elements.prestasiFormMessage, 'Santri, jenis, dan tanggal wajib diisi.', 'error');
          return;
        }

        const body = {
          santri_id: santriId,
          jenis,
          tanggal,
          deskripsi: formData.get('deskripsi'),
          penghargaan: formData.get('penghargaan'),
        };

        try {
          const response = await fetch(
            editingPrestasiId ? `/api/prestasi/${editingPrestasiId}` : '/api/prestasi',
            {
              method: editingPrestasiId ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            showMessage(elements.prestasiFormMessage, errorData.error || 'Terjadi kesalahan.', 'error');
            return;
          }

          showMessage(
            elements.prestasiMessage,
            editingPrestasiId ? 'Data prestasi berhasil diperbarui.' : 'Data prestasi berhasil disimpan.',
            'success'
          );
          closePrestasiModal();
          await loadPrestasi();
        } catch (error) {
          console.error('Submit prestasi failed', error);
          showMessage(elements.prestasiFormMessage, 'Tidak bisa menyimpan data prestasi.', 'error');
        }
      });
    }
  }

  function bindEvents() {
    bindModalEvents();
    bindTableEvents();
    bindFormEvents();
  }

  return {
    bindEvents,
    loadPelanggaran,
    loadPrestasi,
  };
}
