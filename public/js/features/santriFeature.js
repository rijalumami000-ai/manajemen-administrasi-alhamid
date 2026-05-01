import { DEFAULT_TAHUN_AJARAN_LIST } from '../config/tahunAjaran.js';
import { escapeHtml, formatStatusTahunAjaran, statusBadgeClass } from '../utils/formatters.js';
import { populateFilterSelect } from '../utils/forms.js';
import { showMessage } from '../utils/messages.js';
import { renderPagination } from '../utils/pagination.js';

export function createSantriFeature({ elements, pageSize = 10, onSummaryChanged }) {
  let currentSantriList = [];
  let currentKelasList = [];
  let currentKamarList = [];
  let currentTahunAjaranList = [];
  let activeTahunAjaran = null;
  let selectedTahunAjaranId = '';
  let tahunAjaranApiReady = false;
  let santriKamarOverrides = JSON.parse(localStorage.getItem('santriKamarOverrides') || '{}');
  let santriGenderOverrides = JSON.parse(localStorage.getItem('santriGenderOverrides') || '{}');
  let santriCurrentPage = 1;
  let editingSantriId = null;
  let editingOrangtuaId = null;

  function selectedTahunAjaranIsActive() {
    return !selectedTahunAjaranId || (activeTahunAjaran && Number(selectedTahunAjaranId) === Number(activeTahunAjaran.id));
  }

  function refreshSantriYearState() {
    const selectedYear = selectedTahunAjaranId
      ? currentTahunAjaranList.find((item) => Number(item.id) === Number(selectedTahunAjaranId))
      : activeTahunAjaran;
    const isActiveYear = selectedTahunAjaranIsActive();

    if (elements.santriActiveYearLabel) {
      elements.santriActiveYearLabel.textContent = selectedYear
        ? `Data Santri Tahun Ajaran ${selectedYear.kode}${isActiveYear ? ' (Berjalan)' : ' (Arsip)'}`
        : 'Data Santri Tahun Ajaran Berjalan';
    }

    if (elements.btnTambahSantri) {
      elements.btnTambahSantri.disabled = !isActiveYear;
    }

    if (elements.btnMigrasiTahunAjaran) {
      elements.btnMigrasiTahunAjaran.disabled = !isActiveYear || !activeTahunAjaran;
    }
  }

  function renderTahunAjaranCards() {
    if (!elements.tahunAjaranCards) return;

    if (!currentTahunAjaranList.length) {
      elements.tahunAjaranCards.innerHTML = `
        <div class="empty-state empty-state-compact">
          <h3>Belum ada tahun ajaran</h3>
          <p>Daftar tahun ajaran akan muncul setelah database siap.</p>
        </div>
      `;
      return;
    }

    elements.tahunAjaranCards.innerHTML = currentTahunAjaranList
      .map((item) => {
        const isSelected = Number(item.id) === Number(selectedTahunAjaranId);
        const badge = item.is_active ? 'Berjalan' : 'Arsip';
        const badgeClass = item.is_active ? 'status-success' : 'status-muted';
        return `
          <button type="button" class="tahun-ajaran-card ${isSelected ? 'active' : ''}" data-id="${item.id}">
            <span class="tahun-ajaran-kode">${escapeHtml(item.kode)}</span>
            <span class="status-badge ${badgeClass}">${badge}</span>
            <span class="tahun-ajaran-count">${Number(item.jumlah_santri || 0)} santri</span>
          </button>
        `;
      })
      .join('');
  }

  function populateTahunAjaranSelect() {
    if (!elements.tahunAjaranSelect) return;

    const currentValue = elements.tahunAjaranSelect.value;
    elements.tahunAjaranSelect.innerHTML = currentTahunAjaranList
      .map((item) => `<option value="${item.id}">${escapeHtml(item.kode)}${item.is_active ? ' - Berjalan' : ''}</option>`)
      .join('');

    const fallbackValue = activeTahunAjaran ? String(activeTahunAjaran.id) : '';
    elements.tahunAjaranSelect.value = currentTahunAjaranList.some((item) => String(item.id) === currentValue)
      ? currentValue
      : fallbackValue;
    selectedTahunAjaranId = elements.tahunAjaranSelect.value;
  }

  async function loadTahunAjaran() {
    try {
      const response = await fetch('/api/tahun-ajaran', { cache: 'no-store' });
      const items = await response.json();
      tahunAjaranApiReady = response.ok && Array.isArray(items);
      currentTahunAjaranList = Array.isArray(items) ? items : [];
      activeTahunAjaran = currentTahunAjaranList.find((item) => item.is_active) || null;

      populateTahunAjaranSelect();
      refreshSantriYearState();
      renderTahunAjaranCards();
    } catch (error) {
      console.error('Fetch tahun ajaran failed', error);
      tahunAjaranApiReady = false;
      currentTahunAjaranList = DEFAULT_TAHUN_AJARAN_LIST;
      activeTahunAjaran = currentTahunAjaranList.find((item) => item.is_active) || null;
      populateTahunAjaranSelect();
      refreshSantriYearState();
      renderTahunAjaranCards();
      showMessage(elements.santriMessage, 'Daftar tahun ajaran tampil sementara. Restart server agar data arsip terhubung penuh.', 'error');
    }
  }

  function openModal(mode = 'create') {
    if (!selectedTahunAjaranIsActive()) {
      showMessage(elements.santriMessage, 'Data arsip hanya bisa dibaca. Pilih Tahun Ajaran Berjalan untuk tambah atau edit santri.', 'error');
      return;
    }

    if (elements.santriFormMessage) elements.santriFormMessage.style.display = 'none';
    if (mode === 'create') {
      editingSantriId = null;
      editingOrangtuaId = null;
      if (elements.modalSantriTitle) elements.modalSantriTitle.textContent = 'Tambah Santri';
      if (elements.submitSantriButton) elements.submitSantriButton.textContent = 'Simpan Santri';
      if (elements.santriForm) {
        elements.santriForm.reset();
        elements.santriForm.status_tahun_ajaran.value = 'aktif';
      }
    }
    if (elements.modalSantri) elements.modalSantri.classList.add('active');
  }

  function closeModal() {
    if (elements.modalSantri) elements.modalSantri.classList.remove('active');
    if (elements.santriForm) elements.santriForm.reset();
    if (elements.santriFormMessage) elements.santriFormMessage.style.display = 'none';
    editingSantriId = null;
    editingOrangtuaId = null;
    if (elements.modalSantriTitle) elements.modalSantriTitle.textContent = 'Tambah Santri';
    if (elements.submitSantriButton) elements.submitSantriButton.textContent = 'Simpan Santri';
  }

  function rememberSantriKamar(santriId, kamarId) {
    if (!santriId) return;
    if (kamarId) {
      santriKamarOverrides[santriId] = String(kamarId);
    } else {
      delete santriKamarOverrides[santriId];
    }
    localStorage.setItem('santriKamarOverrides', JSON.stringify(santriKamarOverrides));
  }

  function rememberSantriGender(santriId, gender) {
    if (!santriId) return;
    if (gender) {
      santriGenderOverrides[santriId] = String(gender);
    } else {
      delete santriGenderOverrides[santriId];
    }
    localStorage.setItem('santriGenderOverrides', JSON.stringify(santriGenderOverrides));
  }

  function applySantriKamarOverride(santri) {
    const kamarId = santriKamarOverrides[santri.id] || santri.kamar_id;
    const gender = santriGenderOverrides[santri.id] || santri.jenis_kelamin;
    if (!kamarId) {
      return {
        ...santri,
        jenis_kelamin: gender || santri.jenis_kelamin,
      };
    }

    const kamar = currentKamarList.find((item) => item.id === Number(kamarId));
    return {
      ...santri,
      kamar_id: Number(kamarId),
      jenis_kelamin: gender || santri.jenis_kelamin,
      nama_kamar: kamar ? kamar.nama : santri.nama_kamar,
      kamar_gedung: kamar ? kamar.gedung : santri.kamar_gedung,
      kamar_lantai: kamar ? kamar.lantai : santri.kamar_lantai,
    };
  }

  function renderSantriTable() {
    if (!elements.santriTableBody) return;
    const keyword = (elements.santriSearch ? elements.santriSearch.value : '').trim().toLowerCase();
    const diniyah = elements.santriFilterDiniyah ? elements.santriFilterDiniyah.value : '';
    const sekolah = elements.santriFilterSekolah ? elements.santriFilterSekolah.value : '';
    const gender = elements.santriFilterGender ? elements.santriFilterGender.value : '';
    const status = elements.santriFilterStatus ? elements.santriFilterStatus.value : '';
    const canEditYear = selectedTahunAjaranIsActive();

    const filtered = currentSantriList.filter((santri) => {
      const searchable = [
        santri.nis,
        santri.nik,
        santri.nama,
        santri.nama_ayah,
        santri.nama_ibu,
        santri.nama_diniyah,
        santri.nama_sekolah,
        formatStatusTahunAjaran(santri.status_tahun_ajaran),
      ].join(' ').toLowerCase();

      return (!keyword || searchable.includes(keyword))
        && (!diniyah || santri.nama_diniyah === diniyah)
        && (!sekolah || santri.nama_sekolah === sekolah)
        && (!gender || santri.jenis_kelamin === gender)
        && (!status || santri.status_tahun_ajaran === status);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    santriCurrentPage = Math.min(santriCurrentPage, totalPages);
    const start = (santriCurrentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    elements.santriTableBody.innerHTML = pageItems.length ? pageItems
      .map((santri) => `<tr>
        <td>${escapeHtml(santri.nis || '-')}</td>
        <td>${escapeHtml(santri.nik || '-')}</td>
        <td>${escapeHtml(santri.nama || '-')}</td>
        <td>${escapeHtml(santri.jenis_kelamin || '-')}</td>
        <td>${escapeHtml(santri.nama_diniyah || '-')}</td>
        <td>${escapeHtml(santri.nama_sekolah || '-')}</td>
        <td><span class="status-badge ${statusBadgeClass(santri.status_tahun_ajaran)}">${escapeHtml(formatStatusTahunAjaran(santri.status_tahun_ajaran))}</span></td>
        <td>${escapeHtml(santri.tempat_lahir || '-')}</td>
        <td>${escapeHtml(santri.nama_ayah || '-')}</td>
        <td class="table-actions-cell">
          ${canEditYear
            ? `<button type="button" class="table-action edit" data-id="${santri.id}">Edit</button>
               <button type="button" class="table-action delete" data-id="${santri.id}">Hapus</button>`
            : '<span class="status-badge status-muted">Arsip</span>'}
        </td>
      </tr>`)
      .join('') : '<tr><td colspan="10">Tidak ada data santri yang sesuai.</td></tr>';

    renderPagination(elements.santriPagination, filtered.length, santriCurrentPage, (page) => {
      santriCurrentPage = page;
      renderSantriTable();
    }, pageSize);
  }

  async function fetchSantri() {
    try {
      const yearId = selectedTahunAjaranId || (activeTahunAjaran ? activeTahunAjaran.id : '');
      const isActiveYear = selectedTahunAjaranIsActive();
      if (!tahunAjaranApiReady && !isActiveYear) {
        currentSantriList = [];
        populateSantriFilters();
        renderSantriTable();
        return;
      }

      const url = tahunAjaranApiReady && yearId ? `/api/tahun-ajaran/${yearId}/santri` : '/api/santri';
      const [response, alumniResponse] = await Promise.all([
        fetch(url, { cache: 'no-store' }),
        fetch('/api/alumni', { cache: 'no-store' }),
      ]);
      const items = await response.json();
      const alumniItems = await alumniResponse.json();
      const alumniSantriIds = new Set((Array.isArray(alumniItems) ? alumniItems : [])
        .map((alumni) => alumni.santri_id)
        .filter(Boolean)
        .map(Number));
      const alumniNis = new Set((Array.isArray(alumniItems) ? alumniItems : [])
        .map((alumni) => alumni.nis)
        .filter(Boolean));

      currentSantriList = (Array.isArray(items) ? items : [])
        .filter((santri) => !isActiveYear || (!alumniSantriIds.has(Number(santri.id)) && !alumniNis.has(santri.nis)))
        .map(applySantriKamarOverride);
      populateSantriFilters();
      refreshSantriYearState();
      renderSantriTable();
    } catch (error) {
      console.error('Fetch santri failed', error);
    }
  }

  function populateSantriFilters() {
    populateFilterSelect(elements.santriFilterDiniyah, currentSantriList, (santri) => santri.nama_diniyah, 'Semua Kelas Diniyah');
    populateFilterSelect(elements.santriFilterSekolah, currentSantriList, (santri) => santri.nama_sekolah, 'Semua Kelas Sekolah');
    populateFilterSelect(elements.santriFilterStatus, currentSantriList, (santri) => santri.status_tahun_ajaran, 'Semua Status');
    if (elements.santriFilterStatus) {
      Array.from(elements.santriFilterStatus.options).forEach((option) => {
        if (option.value) option.textContent = formatStatusTahunAjaran(option.value);
      });
    }
  }

  function openEditModal(santri) {
    if (!selectedTahunAjaranIsActive()) {
      showMessage(elements.santriMessage, 'Data arsip hanya bisa dibaca. Pilih Tahun Ajaran Berjalan untuk edit santri.', 'error');
      return;
    }

    editingSantriId = santri.id;
    editingOrangtuaId = santri.orangtua_id || null;
    if (elements.modalSantriTitle) elements.modalSantriTitle.textContent = 'Edit Santri';
    if (elements.submitSantriButton) elements.submitSantriButton.textContent = 'Perbarui Santri';

    elements.santriForm.nis.value = santri.nis || '';
    elements.santriForm.nik.value = santri.nik || '';
    elements.santriForm.nama.value = santri.nama || '';
    elements.santriForm.tempat_lahir.value = santri.tempat_lahir || '';

    let tanggalLahir = santri.tanggal_lahir || '';
    if (tanggalLahir && tanggalLahir.includes('-')) {
      const parts = tanggalLahir.split('-');
      if (parts.length === 3) {
        tanggalLahir = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    elements.santriForm.tanggal_lahir.value = tanggalLahir;

    elements.santriForm.kelas_diniyah_id.value = santri.kelas_diniyah_id || '';
    elements.santriForm.kelas_sekolah_id.value = santri.kelas_sekolah_id || '';
    elements.santriForm.kamar_id.value = santri.kamar_id || '';
    elements.santriForm.jenis_kelamin.value = santri.jenis_kelamin || '';
    elements.santriForm.status_tahun_ajaran.value = santri.status_tahun_ajaran || 'aktif';
    elements.santriForm.catatan_tahun_ajaran.value = santri.catatan_tahun_ajaran || '';
    elements.santriForm.alamat.value = santri.alamat || '';
    elements.santriForm.nama_ayah.value = santri.nama_ayah || '';
    elements.santriForm.pekerjaan_ayah.value = santri.pekerjaan_ayah || '';
    elements.santriForm.no_hp_ayah.value = santri.no_hp_ayah || '';
    elements.santriForm.nama_ibu.value = santri.nama_ibu || '';
    elements.santriForm.pekerjaan_ibu.value = santri.pekerjaan_ibu || '';
    elements.santriForm.no_hp_ibu.value = santri.no_hp_ibu || '';

    if (elements.modalSantri) elements.modalSantri.classList.add('active');
  }

  async function deleteSantri(id) {
    if (!confirm('Hapus data santri ini?')) return;

    try {
      const response = await fetch(`/api/santri/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        showMessage(elements.santriMessage, errorData.error || 'Gagal menghapus santri.', 'error');
        return;
      }

      showMessage(elements.santriMessage, 'Data santri berhasil dihapus.', 'success');
      if (onSummaryChanged) await onSummaryChanged();
      await fetchSantri();
    } catch (error) {
      console.error('Delete santri failed', error);
      showMessage(elements.santriMessage, 'Tidak bisa menghapus data santri.', 'error');
    }
  }

  function bindEvents() {
    if (elements.btnTambahSantri) elements.btnTambahSantri.addEventListener('click', () => openModal('create'));
    if (elements.closeModalSantri) elements.closeModalSantri.addEventListener('click', closeModal);
    if (elements.cancelModalSantri) elements.cancelModalSantri.addEventListener('click', closeModal);
    if (elements.modalSantri) {
      elements.modalSantri.addEventListener('click', (event) => {
        if (event.target === elements.modalSantri) closeModal();
      });
    }

    if (elements.santriTableBody) {
      elements.santriTableBody.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const santriId = button.dataset.id;
        if (button.classList.contains('edit')) {
          const santri = currentSantriList.find((item) => item.id === parseInt(santriId, 10));
          if (santri) openEditModal(santri);
          return;
        }

        if (button.classList.contains('delete')) {
          deleteSantri(santriId);
        }
      });
    }

    [elements.santriSearch, elements.santriFilterDiniyah, elements.santriFilterSekolah, elements.santriFilterGender, elements.santriFilterStatus].forEach((control) => {
      if (!control) return;
      control.addEventListener('input', () => {
        santriCurrentPage = 1;
        renderSantriTable();
      });
      control.addEventListener('change', () => {
        santriCurrentPage = 1;
        renderSantriTable();
      });
    });

    if (elements.tahunAjaranSelect) {
      elements.tahunAjaranSelect.addEventListener('change', async () => {
        selectedTahunAjaranId = elements.tahunAjaranSelect.value;
        santriCurrentPage = 1;
        refreshSantriYearState();
        renderTahunAjaranCards();
        await fetchSantri();
      });
    }

    if (elements.tahunAjaranCards) {
      elements.tahunAjaranCards.addEventListener('click', async (event) => {
        const card = event.target.closest('.tahun-ajaran-card');
        if (!card) return;

        selectedTahunAjaranId = card.dataset.id;
        if (elements.tahunAjaranSelect) {
          elements.tahunAjaranSelect.value = selectedTahunAjaranId;
        }
        santriCurrentPage = 1;
        refreshSantriYearState();
        renderTahunAjaranCards();
        await fetchSantri();
      });
    }

    if (elements.btnMigrasiTahunAjaran) {
      elements.btnMigrasiTahunAjaran.addEventListener('click', async () => {
        if (!activeTahunAjaran) {
          showMessage(elements.santriMessage, 'Tahun ajaran berjalan belum tersedia.', 'error');
          return;
        }

        const nextKode = `${activeTahunAjaran.tahun_selesai}-${activeTahunAjaran.tahun_selesai + 1}`;
        if (!confirm(`Migrasikan Tahun Ajaran Berjalan ${activeTahunAjaran.kode} ke ${nextKode}?`)) {
          return;
        }

        try {
          elements.btnMigrasiTahunAjaran.disabled = true;
          const response = await fetch('/api/tahun-ajaran/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_kode: nextKode }),
          });
          const data = await response.json();

          if (!response.ok) {
            showMessage(elements.santriMessage, data.error || 'Gagal migrasi tahun ajaran.', 'error');
            refreshSantriYearState();
            return;
          }

          showMessage(elements.santriMessage, `${data.message} ${data.migrated || 0} data santri dipindahkan.`, 'success');
          await loadTahunAjaran();
          if (onSummaryChanged) await onSummaryChanged();
          await fetchSantri();
        } catch (error) {
          console.error('Migrasi tahun ajaran failed', error);
          showMessage(elements.santriMessage, 'Tidak bisa migrasi tahun ajaran.', 'error');
        } finally {
          refreshSantriYearState();
        }
      });
    }

    if (elements.santriForm) {
      elements.santriForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(elements.santriForm);

        let tanggalLahir = formData.get('tanggal_lahir');
        if (tanggalLahir && tanggalLahir.includes('/')) {
          const parts = tanggalLahir.split('/');
          if (parts.length === 3) {
            tanggalLahir = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }

        const body = {
          nis: formData.get('nis'),
          nik: formData.get('nik'),
          nama: formData.get('nama'),
          jenis_kelamin: formData.get('jenis_kelamin'),
          kelas_diniyah_id: formData.get('kelas_diniyah_id') || null,
          kelas_sekolah_id: formData.get('kelas_sekolah_id') || null,
          kamar_id: formData.get('kamar_id') || null,
          status_tahun_ajaran: formData.get('status_tahun_ajaran') || 'aktif',
          catatan_tahun_ajaran: formData.get('catatan_tahun_ajaran'),
          tempat_lahir: formData.get('tempat_lahir'),
          tanggal_lahir: tanggalLahir || null,
          alamat: formData.get('alamat'),
          nama_ayah: formData.get('nama_ayah'),
          nama_ibu: formData.get('nama_ibu'),
          pekerjaan_ayah: formData.get('pekerjaan_ayah'),
          pekerjaan_ibu: formData.get('pekerjaan_ibu'),
          no_hp_ayah: formData.get('no_hp_ayah'),
          no_hp_ibu: formData.get('no_hp_ibu'),
        };

        try {
          const url = editingSantriId ? `/api/santri/${editingSantriId}` : '/api/santri';
          const response = await fetch(url, {
            method: editingSantriId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorData = await response.json();
            showMessage(elements.santriFormMessage, errorData.error || 'Terjadi kesalahan.', 'error');
            return;
          }

          const savedSantri = await response.json();
          rememberSantriKamar(editingSantriId || savedSantri.id, body.kamar_id);
          rememberSantriGender(editingSantriId || savedSantri.id, body.jenis_kelamin);

          showMessage(
            elements.santriFormMessage,
            editingSantriId ? 'Data santri berhasil diperbarui.' : 'Data santri berhasil disimpan.',
            'success'
          );
          closeModal();
          if (onSummaryChanged) await onSummaryChanged();
          await fetchSantri();
        } catch (error) {
          console.error('Submit santri failed', error);
          showMessage(elements.santriFormMessage, 'Tidak bisa menyimpan data.', 'error');
        }
      });
    }
  }

  function populateKelasSelect(select, kelasList, jenis, placeholder) {
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;
    kelasList
      .filter((kelas) => kelas.jenis === jenis)
      .forEach((kelas) => {
        const option = document.createElement('option');
        option.value = kelas.id;
        option.textContent = kelas.nama;
        select.appendChild(option);
      });
  }

  function setKelasList(items) {
    currentKelasList = items;
    document.querySelectorAll('select[name="kelas_diniyah_id"]').forEach((select) => {
      populateKelasSelect(select, currentKelasList, 'Diniyah', '-- Pilih Kelas Diniyah --');
    });

    document.querySelectorAll('select[name="kelas_sekolah_id"]').forEach((select) => {
      populateKelasSelect(select, currentKelasList, 'Sekolah', '-- Pilih Kelas Sekolah --');
    });
  }

  function setKamarList(items) {
    currentKamarList = items;
    document.querySelectorAll('select[name="kamar_id"]').forEach((select) => {
      const currentValue = select.value;
      select.innerHTML = '<option value="">-- Pilih Kamar --</option>';
      currentKamarList.forEach((kamar) => {
        const option = document.createElement('option');
        option.value = kamar.id;
        option.textContent = `${kamar.nama} (${kamar.jenis}) - ${kamar.terisi}/${kamar.kapasitas}`;
        if (kamar.status === 'Penuh') option.disabled = true;
        select.appendChild(option);
      });
      if (currentValue) select.value = currentValue;
    });
  }

  return {
    bindEvents,
    fetchSantri,
    loadTahunAjaran,
    setKamarList,
    setKelasList,
  };
}
