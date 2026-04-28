document.addEventListener('DOMContentLoaded', function () {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebar-close');
  const menuItems = document.querySelectorAll('.menu-item');
  const pageBody = document.body;

  const panels = document.querySelectorAll('.panel');
  const totalSantriEl = document.getElementById('total-santri');
  const totalGuruEl = document.getElementById('total-guru');
  const yearEl = document.getElementById('year');

  const santriForm = document.getElementById('santri-form');
  const guruForm = document.getElementById('guru-form');
  const kelasForm = document.getElementById('kelas-form');
  const santriTableBody = document.getElementById('santri-table-body');
  const guruTableBody = document.getElementById('guru-table-body');
  const kelasCards = document.getElementById('kelas-cards');
  const mataPelajaranList = document.getElementById('mata-pelajaran-list');
  const jabatanList = document.getElementById('jabatan-list');
  const mataPelajaranCount = document.getElementById('mata-pelajaran-count');
  const jabatanCount = document.getElementById('jabatan-count');
  const santriMessage = document.getElementById('santri-message');
  const guruMessage = document.getElementById('guru-message');
  const kelasMessage = document.getElementById('kelas-message');
  const santriFormMessage = document.getElementById('santri-form-message');
  const kelasFormMessage = document.getElementById('kelas-form-message');
  const guruFormMessage = document.getElementById('guru-form-message');
  const mataPelajaranFormMessage = document.getElementById('mata-pelajaran-form-message');
  const jabatanFormMessage = document.getElementById('jabatan-form-message');
  const modalSantriTitle = document.querySelector('#modal-santri .modal-header h2');
  const modalKelasTitle = document.querySelector('#modal-kelas .modal-header h2');
  const modalGuruTitle = document.querySelector('#modal-guru .modal-header h2');
  const modalMataPelajaranTitle = document.querySelector('#modal-mata-pelajaran .modal-header h2');
  const modalJabatanTitle = document.querySelector('#modal-jabatan .modal-header h2');
  const submitSantriButton = santriForm ? santriForm.querySelector('button[type="submit"]') : null;
  const submitKelasButton = kelasForm ? kelasForm.querySelector('button[type="submit"]') : null;
  const submitGuruButton = guruForm ? guruForm.querySelector('button[type="submit"]') : null;
  const submitMataPelajaranButton = document.querySelector('#modal-mata-pelajaran button[type="submit"]');
  const submitJabatanButton = document.querySelector('#modal-jabatan button[type="submit"]');
  const masterTabButtons = document.querySelectorAll('[data-master-tab]');
  const masterPanels = document.querySelectorAll('[data-master-panel]');

  let currentSantriList = [];
  let currentKelasList = [];
  let currentGuruList = [];
  let currentMataPelajaranList = [];
  let currentJabatanList = [];

  let editingSantriId = null;
  let editingOrangtuaId = null;
  let editingKelasId = null;
  let editingGuruId = null;
  let editingMataPelajaranId = null;
  let editingJabatanId = null;

  const modalSantri = document.getElementById('modal-santri');
  const btnTambahSantri = document.getElementById('btn-tambah-santri');
  const closeModalSantri = document.getElementById('close-modal-santri');
  const cancelModalSantri = document.getElementById('cancel-modal-santri');

  const modalKelas = document.getElementById('modal-kelas');
  const btnTambahKelas = document.getElementById('btn-tambah-kelas');
  const closeModalKelas = document.getElementById('close-modal-kelas');
  const cancelModalKelas = document.getElementById('cancel-modal-kelas');

  const modalGuru = document.getElementById('modal-guru');
  const btnTambahGuru = document.getElementById('btn-tambah-guru');
  const closeModalGuru = document.getElementById('close-modal-guru');
  const cancelModalGuru = document.getElementById('cancel-modal-guru');

  const modalMataPelajaran = document.getElementById('modal-mata-pelajaran');
  const btnTambahMataPelajaran = document.getElementById('btn-tambah-mata-pelajaran');
  const closeModalMataPelajaran = document.getElementById('close-modal-mata-pelajaran');
  const cancelModalMataPelajaran = document.getElementById('cancel-modal-mata-pelajaran');

  const modalJabatan = document.getElementById('modal-jabatan');
  const btnTambahJabatan = document.getElementById('btn-tambah-jabatan');
  const closeModalJabatan = document.getElementById('close-modal-jabatan');
  const cancelModalJabatan = document.getElementById('cancel-modal-jabatan');

  yearEl.textContent = new Date().getFullYear();

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => {
      if (character === '&') return '&';
      if (character === '<') return '<';
      if (character === '>') return '>';
      if (character === '"') return '"';
      return ''';
    });
  }

  function toggleSidebar() {
    const isActive = !sidebar.classList.contains('active');
    hamburgerMenu.classList.toggle('active', isActive);
    sidebar.classList.toggle('active', isActive);
    pageBody.classList.toggle('sidebar-open', isActive);
  }

  function closeSidebar() {
    hamburgerMenu.classList.remove('active');
    sidebar.classList.remove('active');
    pageBody.classList.remove('sidebar-open');
  }

  function setActivePanel(targetId) {
    panels.forEach((panel) => panel.classList.toggle('active', panel.id === targetId));
    menuItems.forEach((item) => item.classList.toggle('active', item.dataset.target === targetId));
  }

  function setActiveMasterTab(tabName) {
    masterTabButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.masterTab === tabName);
    });

    masterPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.masterPanel === tabName);
    });
  }

  function showMessage(element, text, type = 'success') {
    if (!element) {
      return;
    }

    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 4000);
  }

  function clearKelasFormState() {
    if (!kelasForm) return;

    kelasForm.reset();
    if (kelasFormMessage) kelasFormMessage.style.display = 'none';
    if (modalKelasTitle) modalKelasTitle.textContent = 'Tambah Kelas';
    if (submitKelasButton) submitKelasButton.textContent = 'Simpan Kelas';
    editingKelasId = null;
  }

  function openKelasModal(kelas = null) {
    clearKelasFormState();

    if (kelas && kelasForm) {
      editingKelasId = kelas.id;
      if (modalKelasTitle) modalKelasTitle.textContent = 'Edit Kelas';
      if (submitKelasButton) submitKelasButton.textContent = 'Perbarui Kelas';
      kelasForm.jenis.value = kelas.jenis || '';
      kelasForm.nama.value = kelas.nama || '';
    }

    if (modalKelas) modalKelas.classList.add('active');
  }

  function closeKelasModal() {
    if (modalKelas) modalKelas.classList.remove('active');
    clearKelasFormState();
  }

  function clearGuruFormState() {
    if (!guruForm) return;

    guruForm.reset();
    if (guruFormMessage) guruFormMessage.style.display = 'none';
    if (modalGuruTitle) modalGuruTitle.textContent = 'Tambah Guru';
    if (submitGuruButton) submitGuruButton.textContent = 'Simpan Guru';
    editingGuruId = null;
  }

  function openGuruModal(guru = null) {
    clearGuruFormState();

    if (guru && guruForm) {
      editingGuruId = guru.id;
      if (modalGuruTitle) modalGuruTitle.textContent = 'Edit Guru';
      if (submitGuruButton) submitGuruButton.textContent = 'Perbarui Guru';
      guruForm.nip.value = guru.nip || '';
      guruForm.nama.value = guru.nama || '';
      guruForm.mata_pelajaran_id.value = guru.mata_pelajaran_id || '';
      guruForm.jabatan_id.value = guru.jabatan_id || '';
      guruForm.no_hp.value = guru.no_hp || '';
      guruForm.alamat.value = guru.alamat || '';
      guruForm.status.value = guru.status || '';
    }

    if (modalGuru) modalGuru.classList.add('active');
  }

  function closeGuruModal() {
    if (modalGuru) modalGuru.classList.remove('active');
    clearGuruFormState();
  }

  function clearMataPelajaranFormState() {
    const form = document.getElementById('mata-pelajaran-form');
    if (!form) return;

    form.reset();
    if (mataPelajaranFormMessage) mataPelajaranFormMessage.style.display = 'none';
    if (modalMataPelajaranTitle) modalMataPelajaranTitle.textContent = 'Tambah Mata Pelajaran';
    if (submitMataPelajaranButton) submitMataPelajaranButton.textContent = 'Simpan Mata Pelajaran';
    editingMataPelajaranId = null;
  }

  function openMataPelajaranModal(item = null) {
    clearMataPelajaranFormState();

    if (item) {
      editingMataPelajaranId = item.id;
      if (modalMataPelajaranTitle) modalMataPelajaranTitle.textContent = 'Edit Mata Pelajaran';
      if (submitMataPelajaranButton) submitMataPelajaranButton.textContent = 'Perbarui Mata Pelajaran';
      const form = document.getElementById('mata-pelajaran-form');
      if (form) {
        form.nama.value = item.nama || '';
      }
    }

    if (modalMataPelajaran) modalMataPelajaran.classList.add('active');
  }

  function closeMataPelajaranModal() {
    if (modalMataPelajaran) modalMataPelajaran.classList.remove('active');
    clearMataPelajaranFormState();
  }

  function clearJabatanFormState() {
    const form = document.getElementById('jabatan-form');
    if (!form) return;

    form.reset();
    if (jabatanFormMessage) jabatanFormMessage.style.display = 'none';
    if (modalJabatanTitle) modalJabatanTitle.textContent = 'Tambah Jabatan';
    if (submitJabatanButton) submitJabatanButton.textContent = 'Simpan Jabatan';
    editingJabatanId = null;
  }

  function openJabatanModal(item = null) {
    clearJabatanFormState();

    if (item) {
      editingJabatanId = item.id;
      if (modalJabatanTitle) modalJabatanTitle.textContent = 'Edit Jabatan';
      if (submitJabatanButton) submitJabatanButton.textContent = 'Perbarui Jabatan';
      const form = document.getElementById('jabatan-form');
      if (form) {
        form.nama.value = item.nama || '';
      }
    }

    if (modalJabatan) modalJabatan.classList.add('active');
  }

  function closeJabatanModal() {
    if (modalJabatan) modalJabatan.classList.remove('active');
    clearJabatanFormState();
  }

  function openModal(mode = 'create') {
    if (santriFormMessage) santriFormMessage.style.display = 'none';
    if (mode === 'create') {
      editingSantriId = null;
      editingOrangtuaId = null;
      if (modalSantriTitle) modalSantriTitle.textContent = 'Tambah Santri';
      if (submitSantriButton) submitSantriButton.textContent = 'Simpan Santri';
      if (santriForm) santriForm.reset();
    }
    if (modalSantri) modalSantri.classList.add('active');
  }

  function closeModal() {
    if (modalSantri) modalSantri.classList.remove('active');
    if (santriForm) santriForm.reset();
    if (santriFormMessage) santriFormMessage.style.display = 'none';
    editingSantriId = null;
    editingOrangtuaId = null;
    if (modalSantriTitle) modalSantriTitle.textContent = 'Tambah Santri';
    if (submitSantriButton) submitSantriButton.textContent = 'Simpan Santri';
  }

  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', toggleSidebar);
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }

  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      setActivePanel(targetId);
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  masterTabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveMasterTab(button.dataset.masterTab));
  });

  document.addEventListener('click', (e) => {
    if (
      window.innerWidth <= 768 &&
      sidebar &&
      hamburgerMenu &&
      !sidebar.contains(e.target) &&
      !hamburgerMenu.contains(e.target) &&
      sidebar.classList.contains('active')
    ) {
      closeSidebar();
    }
  });

  if (btnTambahSantri) btnTambahSantri.addEventListener('click', () => openModal('create'));
  if (closeModalSantri) closeModalSantri.addEventListener('click', closeModal);
  if (cancelModalSantri) cancelModalSantri.addEventListener('click', closeModal);
  if (modalSantri) {
    modalSantri.addEventListener('click', (e) => {
      if (e.target === modalSantri) closeModal();
    });
  }

  if (btnTambahKelas) btnTambahKelas.addEventListener('click', () => openKelasModal());
  if (closeModalKelas) closeModalKelas.addEventListener('click', closeKelasModal);
  if (cancelModalKelas) cancelModalKelas.addEventListener('click', closeKelasModal);
  if (modalKelas) {
    modalKelas.addEventListener('click', (e) => {
      if (e.target === modalKelas) closeKelasModal();
    });
  }

  if (btnTambahGuru) btnTambahGuru.addEventListener('click', () => openGuruModal());
  if (closeModalGuru) closeModalGuru.addEventListener('click', closeGuruModal);
  if (cancelModalGuru) cancelModalGuru.addEventListener('click', closeGuruModal);
  if (modalGuru) {
    modalGuru.addEventListener('click', (e) => {
      if (e.target === modalGuru) closeGuruModal();
    });
  }

  if (btnTambahMataPelajaran) btnTambahMataPelajaran.addEventListener('click', () => openMataPelajaranModal());
  if (closeModalMataPelajaran) closeModalMataPelajaran.addEventListener('click', closeMataPelajaranModal);
  if (cancelModalMataPelajaran) cancelModalMataPelajaran.addEventListener('click', closeMataPelajaranModal);
  if (modalMataPelajaran) {
    modalMataPelajaran.addEventListener('click', (e) => {
      if (e.target === modalMataPelajaran) closeMataPelajaranModal();
    });
  }

  if (btnTambahJabatan) btnTambahJabatan.addEventListener('click', () => openJabatanModal());
  if (closeModalJabatan) closeModalJabatan.addEventListener('click', closeJabatanModal);
  if (cancelModalJabatan) cancelModalJabatan.addEventListener('click', closeJabatanModal);
  if (modalJabatan) {
    modalJabatan.addEventListener('click', (e) => {
      if (e.target === modalJabatan) closeJabatanModal();
    });
  }

  function renderKelasCards(items) {
    if (!kelasCards) {
      return;
    }

    if (!items.length) {
      kelasCards.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>Belum ada data kelas</h3>
          <p>Tekan tombol Tambah Kelas untuk membuat data kelas pertama.</p>
        </div>
      `;
      return;
    }

    kelasCards.innerHTML = items
      .map(
        (kelas) => `
          <article class="kelas-card" data-id="${kelas.id}">
            <div class="kelas-card-header">
              <span class="kelas-badge">${escapeHtml(kelas.jenis || 'Kelas')}</span>
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
        `
      )
      .join('');
  }

  function populateKelasSelect(select, kelasList, jenis, placeholder) {
    if (!select) {
      return;
    }

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

  async function loadKelas() {
    try {
      const response = await fetch('/api/kelas', { cache: 'no-store' });
      const items = await response.json();
      currentKelasList = Array.isArray(items) ? items : [];

      document.querySelectorAll('select[name="kelas_diniyah_id"]').forEach((select) => {
        populateKelasSelect(select, currentKelasList, 'Diniyah', '-- Pilih Kelas Diniyah --');
      });

      document.querySelectorAll('select[name="kelas_sekolah_id"]').forEach((select) => {
        populateKelasSelect(select, currentKelasList, 'Sekolah', '-- Pilih Kelas Sekolah --');
      });

      renderKelasCards(currentKelasList);
    } catch (error) {
      console.error('Fetch kelas failed', error);
      if (kelasCards) {
        kelasCards.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>Gagal memuat data kelas</h3>
            <p>Silakan coba muat ulang halaman atau cek koneksi ke server.</p>
          </div>
        `;
      }
    }
  }

  function renderMasterList(container, items, emptyLabel, type) {
    if (!container) {
      return;
    }

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state empty-state-compact">
          <div class="empty-state-icon">🗂️</div>
          <h3>Belum ada data</h3>
          <p>${escapeHtml(emptyLabel)}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items
      .map(
        (item, index) => `
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
        `
      )
      .join('');
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

      renderMasterList(mataPelajaranList, currentMataPelajaranList, 'Tambahkan mata pelajaran pertama dari tombol di atas.', 'mata-pelajaran');
      renderMasterList(jabatanList, currentJabatanList, 'Tambahkan jabatan pertama dari tombol di atas.', 'jabatan');

      if (mataPelajaranCount) {
        mataPelajaranCount.textContent = currentMataPelajaranList.length;
      }

      if (jabatanCount) {
        jabatanCount.textContent = currentJabatanList.length;
      }
    } catch (error) {
      console.error('Fetch master data failed', error);
      renderMasterList(mataPelajaranList, [], 'Gagal memuat mata pelajaran. Coba muat ulang halaman.', 'mata-pelajaran');
      renderMasterList(jabatanList, [], 'Gagal memuat jabatan. Coba muat ulang halaman.', 'jabatan');
      if (mataPelajaranCount) {
        mataPelajaranCount.textContent = '0';
      }
      if (jabatanCount) {
        jabatanCount.textContent = '0';
      }
    }
  }

  async function fetchSummary() {
    try {
      const response = await fetch('/api/summary');
      const data = await response.json();
      totalSantriEl.textContent = data.santri;
      totalGuruEl.textContent = data.guru;
    } catch (error) {
      console.error('Fetch summary failed', error);
    }
  }

  async function fetchSantri() {
    try {
      const response = await fetch('/api/santri');
      const items = await response.json();
      currentSantriList = Array.isArray(items) ? items : [];
      santriTableBody.innerHTML = currentSantriList
        .map(
          (santri) => `<tr>
            <td>${escapeHtml(santri.nis || '-')}</td>
            <td>${escapeHtml(santri.nik || '-')}</td>
            <td>${escapeHtml(santri.nama || '-')}</td>
            <td>${escapeHtml(santri.nama_diniyah || '-')}</td>
            <td>${escapeHtml(santri.nama_sekolah || '-')}</td>
            <td>${escapeHtml(santri.tempat_lahir || '-')}</td>
            <td>${escapeHtml(santri.nama_ayah || '-')}</td>
            <td class="table-actions-cell">
              <button type="button" class="table-action edit" data-id="${santri.id}">Edit</button>
              <button type="button" class="table-action delete" data-id="${santri.id}">Hapus</button>
            </td>
          </tr>`
        )
        .join('');
    } catch (error) {
      console.error('Fetch santri failed', error);
    }
  }

  async function fetchGuru() {
    try {
      const response = await fetch('/api/guru');
      const items = await response.json();
      currentGuruList = Array.isArray(items) ? items : [];
      guruTableBody.innerHTML = currentGuruList
        .map(
          (guru) => `<tr>
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
          </tr>`
        )
        .join('');
    } catch (error) {
      console.error('Fetch guru failed', error);
    }
  }

  function findKelasById(id) {
    return currentKelasList.find((item) => item.id === Number(id));
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

  async function deleteKelas(id) {
    if (!confirm('Hapus data kelas ini?')) return;

    try {
      const response = await fetch(`/api/kelas/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(kelasMessage, data.error || 'Gagal menghapus kelas.', 'error');
        return;
      }

      showMessage(kelasMessage, data.message || 'Data kelas berhasil dihapus.', 'success');
      await loadKelas();
    } catch (error) {
      console.error('Delete kelas failed', error);
      showMessage(kelasMessage, 'Tidak bisa menghapus data kelas.', 'error');
    }
  }

  async function deleteGuru(id) {
    if (!confirm('Hapus data guru ini?')) return;

    try {
      const response = await fetch(`/api/guru/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(guruMessage, data.error || 'Gagal menghapus guru.', 'error');
        return;
      }

      showMessage(guruMessage, data.message || 'Data guru berhasil dihapus.', 'success');
      await fetchSummary();
      await fetchGuru();
    } catch (error) {
      console.error('Delete guru failed', error);
      showMessage(guruMessage, 'Tidak bisa menghapus data guru.', 'error');
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
        showMessage(mataPelajaranFormMessage || guruMessage, data.error || 'Gagal menghapus mata pelajaran.', 'error');
        return;
      }

      showMessage(guruMessage, data.message || 'Mata pelajaran berhasil dihapus.', 'success');
      await loadMasterData();
      await fetchGuru();
    } catch (error) {
      console.error('Delete mata pelajaran failed', error);
      showMessage(mataPelajaranFormMessage || guruMessage, 'Tidak bisa menghapus mata pelajaran.', 'error');
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
        showMessage(jabatanFormMessage || guruMessage, data.error || 'Gagal menghapus jabatan.', 'error');
        return;
      }

      showMessage(guruMessage, data.message || 'Jabatan berhasil dihapus.', 'success');
      await loadMasterData();
      await fetchGuru();
    } catch (error) {
      console.error('Delete jabatan failed', error);
      showMessage(jabatanFormMessage || guruMessage, 'Tidak bisa menghapus jabatan.', 'error');
    }
  }

  if (santriTableBody) {
    santriTableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const santriId = button.dataset.id;
      if (button.classList.contains('edit')) {
        const santri = currentSantriList.find((item) => item.id === parseInt(santriId, 10));
        if (santri) {
          openEditModal(santri);
        }
        return;
      }

      if (button.classList.contains('delete')) {
        deleteSantri(santriId);
      }
    });
  }

  if (kelasCards) {
    kelasCards.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const kelasId = button.dataset.id;
      if (button.dataset.action === 'edit') {
        const kelas = findKelasById(kelasId);
        if (kelas) {
          openKelasModal(kelas);
        }
        return;
      }

      if (button.classList.contains('delete')) {
        deleteKelas(kelasId);
      }
    });
  }

  if (guruTableBody) {
    guruTableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const guruId = button.dataset.id;
      if (button.classList.contains('edit')) {
        const guru = findGuruById(guruId);
        if (guru) {
          openGuruModal(guru);
        }
        return;
      }

      if (button.classList.contains('delete')) {
        deleteGuru(guruId);
      }
    });
  }

  if (mataPelajaranList) {
    mataPelajaranList.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const itemId = button.dataset.id;
      const item = findMataPelajaranById(itemId);
      if (!item) {
        return;
      }

      if (button.classList.contains('edit')) {
        openMataPelajaranModal(item);
        return;
      }

      if (button.classList.contains('delete')) {
        deleteMataPelajaran(itemId);
      }
    });
  }

  if (jabatanList) {
    jabatanList.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const itemId = button.dataset.id;
      const item = findJabatanById(itemId);
      if (!item) {
        return;
      }

      if (button.classList.contains('edit')) {
        openJabatanModal(item);
        return;
      }

      if (button.classList.contains('delete')) {
        deleteJabatan(itemId);
      }
    });
  }

  function openEditModal(santri) {
    editingSantriId = santri.id;
    editingOrangtuaId = santri.orangtua_id || null;
    if (modalSantriTitle) modalSantriTitle.textContent = 'Edit Santri';
    if (submitSantriButton) submitSantriButton.textContent = 'Perbarui Santri';

    santriForm.nis.value = santri.nis || '';
    santriForm.nik.value = santri.nik || '';
    santriForm.nama.value = santri.nama || '';
    santriForm.tempat_lahir.value = santri.tempat_lahir || '';
    santriForm.tanggal_lahir.value = santri.tanggal_lahir || '';
    santriForm.kelas_diniyah_id.value = santri.kelas_diniyah_id || '';
    santriForm.kelas_sekolah_id.value = santri.kelas_sekolah_id || '';
    santriForm.alamat.value = santri.alamat || '';
    santriForm.nama_ayah.value = santri.nama_ayah || '';
    santriForm.pekerjaan_ayah.value = santri.pekerjaan_ayah || '';
    santriForm.no_hp_ayah.value = santri.no_hp_ayah || '';
    santriForm.nama_ibu.value = santri.nama_ibu || '';
    santriForm.pekerjaan_ibu.value = santri.pekerjaan_ibu || '';
    santriForm.no_hp_ibu.value = santri.no_hp_ibu || '';

    if (modalSantri) modalSantri.classList.add('active');
  }

  async function deleteSantri(id) {
    if (!confirm('Hapus data santri ini?')) return;

    try {
      const response = await fetch(`/api/santri/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        showMessage(santriMessage, errorData.error || 'Gagal menghapus santri.', 'error');
        return;
      }

      showMessage(santriMessage, 'Data santri berhasil dihapus.', 'success');
      await fetchSummary();
      await fetchSantri();
    } catch (error) {
      console.error('Delete santri failed', error);
      showMessage(santriMessage, 'Tidak bisa menghapus data santri.', 'error');
    }
  }

  if (kelasForm) {
    kelasForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(kelasForm);
      const body = {
        jenis: formData.get('jenis'),
        nama: formData.get('nama'),
      };

      try {
        const response = await fetch(editingKelasId ? `/api/kelas/${editingKelasId}` : '/api/kelas', {
          method: editingKelasId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          showMessage(kelasFormMessage, errorData.error || 'Terjadi kesalahan.', 'error');
          return;
        }

        closeKelasModal();
        showMessage(kelasMessage, editingKelasId ? 'Data kelas berhasil diperbarui.' : 'Data kelas berhasil disimpan.', 'success');
        await loadKelas();
      } catch (error) {
        console.error('Submit kelas failed', error);
        showMessage(kelasFormMessage, 'Tidak bisa menyimpan data kelas.', 'error');
      }
    });
  }

  if (santriForm) {
    santriForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(santriForm);
      const body = {
        nis: formData.get('nis'),
        nik: formData.get('nik'),
        nama: formData.get('nama'),
        kelas_diniyah_id: formData.get('kelas_diniyah_id') || null,
        kelas_sekolah_id: formData.get('kelas_sekolah_id') || null,
        tempat_lahir: formData.get('tempat_lahir'),
        tanggal_lahir: formData.get('tanggal_lahir'),
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
          showMessage(santriFormMessage, errorData.error || 'Terjadi kesalahan.', 'error');
          return;
        }

        showMessage(
          santriFormMessage,
          editingSantriId ? 'Data santri berhasil diperbarui.' : 'Data santri berhasil disimpan.',
          'success'
        );
        closeModal();
        await fetchSummary();
        await fetchSantri();
      } catch (error) {
        console.error('Submit santri failed', error);
        showMessage(santriFormMessage, 'Tidak bisa menyimpan data.', 'error');
      }
    });
  }

  if (guruForm) {
    guruForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(guruForm);
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
          showMessage(guruFormMessage || guruMessage, errorData.error || 'Terjadi kesalahan.', 'error');
          return;
        }

        showMessage(guruMessage, editingGuruId ? 'Data guru berhasil diperbarui.' : 'Data guru berhasil disimpan.', 'success');
        closeGuruModal();
        await fetchSummary();
        await fetchGuru();
      } catch (error) {
        console.error('Submit guru failed', error);
        showMessage(guruFormMessage || guruMessage, 'Tidak bisa menyimpan data.', 'error');
      }
    });
  }

  const mataPelajaranForm = document.getElementById('mata-pelajaran-form');
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
          showMessage(mataPelajaranFormMessage || guruMessage, errorData.error || 'Terjadi kesalahan.', 'error');
          return;
        }

        showMessage(
          mataPelajaranFormMessage || guruMessage,
          editingMataPelajaranId ? 'Mata pelajaran berhasil diperbarui.' : 'Mata pelajaran berhasil disimpan.',
          'success'
        );
        closeMataPelajaranModal();
        await loadMasterData();
        await fetchGuru();
      } catch (error) {
        console.error('Submit mata pelajaran failed', error);
        showMessage(mataPelajaranFormMessage || guruMessage, 'Tidak bisa menyimpan mata pelajaran.', 'error');
      }
    });
  }

  const jabatanForm = document.getElementById('jabatan-form');
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
          showMessage(jabatanFormMessage || guruMessage, errorData.error || 'Terjadi kesalahan.', 'error');
          return;
        }

        showMessage(
          jabatanFormMessage || guruMessage,
          editingJabatanId ? 'Jabatan berhasil diperbarui.' : 'Jabatan berhasil disimpan.',
          'success'
        );
        closeJabatanModal();
        await loadMasterData();
        await fetchGuru();
      } catch (error) {
        console.error('Submit jabatan failed', error);
        showMessage(jabatanFormMessage || guruMessage, 'Tidak bisa menyimpan jabatan.', 'error');
      }
    });
  }

  async function initialize() {
    setActiveMasterTab('mata-pelajaran');
    await loadKelas();
    await loadMasterData();
    await fetchSummary();
    await fetchSantri();
    await fetchGuru();
  }

  initialize();
});
