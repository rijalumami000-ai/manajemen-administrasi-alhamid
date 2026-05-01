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
  const kamarForm = document.getElementById('kamar-form');
  const santriTableBody = document.getElementById('santri-table-body');
  const guruTableBody = document.getElementById('guru-table-body');
  const santriSearch = document.getElementById('santri-search');
  const santriFilterDiniyah = document.getElementById('santri-filter-diniyah');
  const santriFilterSekolah = document.getElementById('santri-filter-sekolah');
  const santriFilterGender = document.getElementById('santri-filter-gender');
  const santriPagination = document.getElementById('santri-pagination');
  const guruSearch = document.getElementById('guru-search');
  const guruFilterJabatan = document.getElementById('guru-filter-jabatan');
  const guruFilterMapel = document.getElementById('guru-filter-mapel');
  const guruFilterStatus = document.getElementById('guru-filter-status');
  const guruPagination = document.getElementById('guru-pagination');
  const kelasCards = document.getElementById('kelas-cards');
  const kelasSortSelect = document.getElementById('kelas-sort-select');
  const kamarCards = document.getElementById('kamar-cards');
  const mataPelajaranList = document.getElementById('mata-pelajaran-list');
  const jabatanList = document.getElementById('jabatan-list');
  const mataPelajaranCount = document.getElementById('mata-pelajaran-count');
  const jabatanCount = document.getElementById('jabatan-count');
  const santriMessage = document.getElementById('santri-message');
  const guruMessage = document.getElementById('guru-message');
  const kelasMessage = document.getElementById('kelas-message');
  const kamarMessage = document.getElementById('kamar-message');
  const santriFormMessage = document.getElementById('santri-form-message');
  const kelasFormMessage = document.getElementById('kelas-form-message');
  const kamarFormMessage = document.getElementById('kamar-form-message');
  const guruFormMessage = document.getElementById('guru-form-message');
  const mataPelajaranFormMessage = document.getElementById('mata-pelajaran-form-message');
  const jabatanFormMessage = document.getElementById('jabatan-form-message');
  const modalSantriTitle = document.querySelector('#modal-santri .modal-header h2');
  const modalKelasTitle = document.querySelector('#modal-kelas .modal-header h2');
  const modalKamarTitle = document.querySelector('#modal-kamar .modal-header h2');
  const modalGuruTitle = document.querySelector('#modal-guru .modal-header h2');
  const modalMataPelajaranTitle = document.querySelector('#modal-mata-pelajaran .modal-header h2');
  const modalJabatanTitle = document.querySelector('#modal-jabatan .modal-header h2');
  const submitSantriButton = santriForm ? santriForm.querySelector('button[type="submit"]') : null;
  const submitKelasButton = kelasForm ? kelasForm.querySelector('button[type="submit"]') : null;
  const submitKamarButton = kamarForm ? kamarForm.querySelector('button[type="submit"]') : null;
  const submitGuruButton = guruForm ? guruForm.querySelector('button[type="submit"]') : null;
  const submitMataPelajaranButton = document.querySelector('#modal-mata-pelajaran button[type="submit"]');
  const submitJabatanButton = document.querySelector('#modal-jabatan button[type="submit"]');
  const guruTabButtons = document.querySelectorAll('[data-guru-tab]');
  const guruTabPanels = document.querySelectorAll('.guru-tab-panel');
  const guruTabActionButtons = document.querySelectorAll('[data-show-on-tab]');
  const guruTabCount = document.getElementById('guru-tab-count');

  const ppTabButtons = document.querySelectorAll('[data-pp-tab]');
  const ppTabPanels = document.querySelectorAll('[id^="pp-tab-panel-"]');
  const ppTabActionButtons = document.querySelectorAll('[data-show-on-tab]');
  const pelanggaranTabCount = document.getElementById('pelanggaran-tab-count');
  const prestasiTabCount = document.getElementById('prestasi-tab-count');

  let currentSantriList = [];
  let currentKelasList = [];
  let currentKamarList = [];
  let currentGuruList = [];
  let currentMataPelajaranList = [];
  let currentJabatanList = [];
  let currentPelanggaranList = [];
  let currentPrestasiList = [];
  let santriKamarOverrides = JSON.parse(localStorage.getItem('santriKamarOverrides') || '{}');
  let santriGenderOverrides = JSON.parse(localStorage.getItem('santriGenderOverrides') || '{}');
  let santriCurrentPage = 1;
  let guruCurrentPage = 1;
  const tablePageSize = 10;

  let editingSantriId = null;
  let editingOrangtuaId = null;
  let editingKelasId = null;
  let editingKamarId = null;
  let editingGuruId = null;
  let editingMataPelajaranId = null;
  let editingJabatanId = null;
  let editingPelanggaranId = null;
  let editingPrestasiId = null;

  const modalSantri = document.getElementById('modal-santri');
  const btnTambahSantri = document.getElementById('btn-tambah-santri');
  const closeModalSantri = document.getElementById('close-modal-santri');
  const cancelModalSantri = document.getElementById('cancel-modal-santri');

  const modalKelas = document.getElementById('modal-kelas');
  const btnTambahKelas = document.getElementById('btn-tambah-kelas');
  const closeModalKelas = document.getElementById('close-modal-kelas');
  const cancelModalKelas = document.getElementById('cancel-modal-kelas');

  const modalKamar = document.getElementById('modal-kamar');
  const btnTambahKamar = document.getElementById('btn-tambah-kamar');
  const closeModalKamar = document.getElementById('close-modal-kamar');
  const cancelModalKamar = document.getElementById('cancel-modal-kamar');

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

  const modalPelanggaran = document.getElementById('modal-pelanggaran');
  const btnTambahPelanggaran = document.getElementById('btn-tambah-pelanggaran');
  const closeModalPelanggaran = document.getElementById('close-modal-pelanggaran');
  const cancelModalPelanggaran = document.getElementById('cancel-modal-pelanggaran');

  const modalPrestasi = document.getElementById('modal-prestasi');
  const btnTambahPrestasi = document.getElementById('btn-tambah-prestasi');
  const closeModalPrestasi = document.getElementById('close-modal-prestasi');
  const cancelModalPrestasi = document.getElementById('cancel-modal-prestasi');

  const pelanggaranTableBody = document.getElementById('pelanggaran-table-body');
  const prestasiTableBody = document.getElementById('prestasi-table-body');
  const pelanggaranMessage = document.getElementById('pelanggaran-message');
  const prestasiMessage = document.getElementById('prestasi-message');
  const pelanggaranFormMessage = document.getElementById('pelanggaran-form-message');
  const prestasiFormMessage = document.getElementById('prestasi-form-message');
  const pelanggaranForm = document.getElementById('pelanggaran-form');
  const prestasiForm = document.getElementById('prestasi-form');
  const modalPelanggaranTitle = document.querySelector('#modal-pelanggaran .modal-header h2');
  const modalPrestasiTitle = document.querySelector('#modal-prestasi .modal-header h2');
  const submitPelanggaranButton = pelanggaranForm ? pelanggaranForm.querySelector('button[type="submit"]') : null;
  const submitPrestasiButton = prestasiForm ? prestasiForm.querySelector('button[type="submit"]') : null;

  yearEl.textContent = new Date().getFullYear();

  function escapeHtml(value) {
    const input = String(value ?? '');
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  function setActiveGuruTab(tabName) {
    guruTabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.guruTab === tabName);
    });
    guruTabPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === `guru-tab-panel-${tabName}`);
    });
    guruTabActionButtons.forEach((btn) => {
      btn.style.display = btn.dataset.showOnTab === tabName ? '' : 'none';
    });
  }

  function setActivePPTab(tabName) {
    ppTabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.ppTab === tabName);
    });
    ppTabPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === `pp-tab-panel-${tabName}`);
    });
    ppTabActionButtons.forEach((btn) => {
      if (btn.id === 'btn-tambah-pelanggaran' || btn.id === 'btn-tambah-prestasi') {
        btn.style.display = btn.dataset.showOnTab === tabName ? '' : 'none';
      }
    });
  }

  function renderPagination(container, totalItems, currentPage, onPageChange) {
    if (!container) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / tablePageSize));
    if (totalItems <= tablePageSize) {
      container.innerHTML = totalItems ? `<span>${totalItems} data</span>` : '';
      return;
    }

    const pageButtons = Array.from({ length: totalPages }, (_, index) => index + 1)
      .map((page) => `
        <button type="button" class="pagination-page ${page === currentPage ? 'active' : ''}" data-page="${page}">
          ${page}
        </button>
      `)
      .join('');

    container.innerHTML = `
      <span>Halaman ${currentPage} dari ${totalPages} (${totalItems} data)</span>
      <div class="pagination-actions">
        <button type="button" class="pagination-page" data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? 'disabled' : ''}>Sebelumnya</button>
        ${pageButtons}
        <button type="button" class="pagination-page" data-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? 'disabled' : ''}>Berikutnya</button>
      </div>
    `;

    container.querySelectorAll('button[data-page]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextPage = Number(button.dataset.page);
        if (nextPage && nextPage !== currentPage) onPageChange(nextPage);
      });
    });
  }

  function populateFilterSelect(select, items, getValue, placeholder) {
    if (!select) return;
    const currentValue = select.value;
    const values = [...new Set(items.map(getValue).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'id', { numeric: true }));
    select.innerHTML = `<option value="">${placeholder}</option>` + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    if (values.includes(currentValue)) select.value = currentValue;
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

  function clearKamarFormState() {
    if (!kamarForm) return;
    kamarForm.reset();
    if (kamarFormMessage) kamarFormMessage.style.display = 'none';
    if (modalKamarTitle) modalKamarTitle.textContent = 'Tambah Kamar';
    if (submitKamarButton) submitKamarButton.textContent = 'Simpan Kamar';
    editingKamarId = null;
  }

  function openKamarModal(kamar = null) {
    clearKamarFormState();
    if (kamar && kamarForm) {
      editingKamarId = kamar.id;
      if (modalKamarTitle) modalKamarTitle.textContent = 'Edit Kamar';
      if (submitKamarButton) submitKamarButton.textContent = 'Perbarui Kamar';
      kamarForm.nama.value = kamar.nama || '';
      kamarForm.gedung.value = kamar.gedung || '';
      kamarForm.lantai.value = kamar.lantai || '';
      kamarForm.kapasitas.value = kamar.kapasitas || '';
      kamarForm.terisi.value = kamar.terisi || 0;
      kamarForm.jenis.value = kamar.jenis || '';
      kamarForm.status.value = kamar.status || 'Tersedia';
      kamarForm.fasilitas.value = kamar.fasilitas || '';
      kamarForm.keterangan.value = kamar.keterangan || '';
    }
    if (modalKamar) modalKamar.classList.add('active');
  }

  function closeKamarModal() {
    if (modalKamar) modalKamar.classList.remove('active');
    clearKamarFormState();
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

  function clearPelanggaranFormState() {
    if (!pelanggaranForm) return;
    pelanggaranForm.reset();
    if (pelanggaranFormMessage) pelanggaranFormMessage.style.display = 'none';
    if (modalPelanggaranTitle) modalPelanggaranTitle.textContent = 'Tambah Pelanggaran';
    if (submitPelanggaranButton) submitPelanggaranButton.textContent = 'Simpan';
    editingPelanggaranId = null;
  }

  function openPelanggaranModal(pelanggaran = null) {
    clearPelanggaranFormState();
    if (pelanggaran && pelanggaranForm) {
      editingPelanggaranId = pelanggaran.id;
      if (modalPelanggaranTitle) modalPelanggaranTitle.textContent = 'Edit Pelanggaran';
      if (submitPelanggaranButton) submitPelanggaranButton.textContent = 'Perbarui';
      pelanggaranForm.santri_id.value = pelanggaran.santri_id || '';
      pelanggaranForm.jenis.value = pelanggaran.jenis || '';
      pelanggaranForm.tanggal.value = pelanggaran.tanggal || '';
      pelanggaranForm.deskripsi.value = pelanggaran.deskripsi || '';
      pelanggaranForm.sanksi.value = pelanggaran.sanksi || '';
    }
    if (modalPelanggaran) modalPelanggaran.classList.add('active');
  }

  function closePelanggaranModal() {
    if (modalPelanggaran) modalPelanggaran.classList.remove('active');
    clearPelanggaranFormState();
  }

  function clearPrestasiFormState() {
    if (!prestasiForm) return;
    prestasiForm.reset();
    if (prestasiFormMessage) prestasiFormMessage.style.display = 'none';
    if (modalPrestasiTitle) modalPrestasiTitle.textContent = 'Tambah Prestasi';
    if (submitPrestasiButton) submitPrestasiButton.textContent = 'Simpan';
    editingPrestasiId = null;
  }

  function openPrestasiModal(prestasi = null) {
    clearPrestasiFormState();
    if (prestasi && prestasiForm) {
      editingPrestasiId = prestasi.id;
      if (modalPrestasiTitle) modalPrestasiTitle.textContent = 'Edit Prestasi';
      if (submitPrestasiButton) submitPrestasiButton.textContent = 'Perbarui';
      prestasiForm.santri_id.value = prestasi.santri_id || '';
      prestasiForm.jenis.value = prestasi.jenis || '';
      prestasiForm.tanggal.value = prestasi.tanggal || '';
      prestasiForm.deskripsi.value = prestasi.deskripsi || '';
      prestasiForm.penghargaan.value = prestasi.penghargaan || '';
    }
    if (modalPrestasi) modalPrestasi.classList.add('active');
  }

  function closePrestasiModal() {
    if (modalPrestasi) modalPrestasi.classList.remove('active');
    clearPrestasiFormState();
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

  guruTabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveGuruTab(button.dataset.guruTab));
  });

  ppTabButtons.forEach((button) => {
    button.addEventListener('click', () => setActivePPTab(button.dataset.ppTab));
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
  if (kelasSortSelect) {
    kelasSortSelect.addEventListener('change', () => renderKelasCards(currentKelasList));
  }
  if (closeModalKelas) closeModalKelas.addEventListener('click', closeKelasModal);
  if (cancelModalKelas) cancelModalKelas.addEventListener('click', closeKelasModal);
  if (modalKelas) {
    modalKelas.addEventListener('click', (e) => {
      if (e.target === modalKelas) closeKelasModal();
    });
  }

  if (btnTambahKamar) btnTambahKamar.addEventListener('click', () => openKamarModal());
  if (closeModalKamar) closeModalKamar.addEventListener('click', closeKamarModal);
  if (cancelModalKamar) cancelModalKamar.addEventListener('click', closeKamarModal);
  if (modalKamar) {
    modalKamar.addEventListener('click', (e) => {
      if (e.target === modalKamar) closeKamarModal();
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

  if (btnTambahPelanggaran) btnTambahPelanggaran.addEventListener('click', () => openPelanggaranModalEnhanced());
  if (closeModalPelanggaran) closeModalPelanggaran.addEventListener('click', closePelanggaranModal);
  if (cancelModalPelanggaran) cancelModalPelanggaran.addEventListener('click', closePelanggaranModal);
  if (modalPelanggaran) {
    modalPelanggaran.addEventListener('click', (e) => {
      if (e.target === modalPelanggaran) closePelanggaranModal();
    });
  }

  if (btnTambahPrestasi) btnTambahPrestasi.addEventListener('click', () => openPrestasiModalEnhanced());
  if (closeModalPrestasi) closeModalPrestasi.addEventListener('click', closePrestasiModal);
  if (cancelModalPrestasi) cancelModalPrestasi.addEventListener('click', closePrestasiModal);
  if (modalPrestasi) {
    modalPrestasi.addEventListener('click', (e) => {
      if (e.target === modalPrestasi) closePrestasiModal();
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

    const sortValue = kelasSortSelect ? kelasSortSelect.value : 'nama-asc';
    const sortedItems = [...items].sort((a, b) => {
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

    kelasCards.innerHTML = [
      renderKelasGroup('Diniyah', 'Kelas Diniyah'),
      renderKelasGroup('Sekolah', 'Kelas Sekolah'),
    ].join('');
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

  function renderKamarCards(items) {
    if (!kamarCards) return;
    if (!items.length) {
      kamarCards.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏠</div>
          <h3>Belum ada data kamar</h3>
          <p>Tekan tombol Tambah Kamar untuk membuat data kamar pertama.</p>
        </div>
      `;
      return;
    }
    kamarCards.innerHTML = items.map(kamar => {
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

  async function loadKamar() {
    try {
      const response = await fetch('/api/kamar', { cache: 'no-store' });
      const items = await response.json();
      currentKamarList = Array.isArray(items) ? items : [];
      
      // Populate kamar select in santri form
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
      
      renderKamarCards(currentKamarList);
    } catch (error) {
      console.error('Fetch kamar failed', error);
      if (kamarCards) {
        kamarCards.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>Gagal memuat data kamar</h3>
            <p>Silakan coba muat ulang halaman atau cek koneksi ke server.</p>
          </div>
        `;
      }
    }
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
    if (!santriTableBody) return;
    const keyword = (santriSearch ? santriSearch.value : '').trim().toLowerCase();
    const diniyah = santriFilterDiniyah ? santriFilterDiniyah.value : '';
    const sekolah = santriFilterSekolah ? santriFilterSekolah.value : '';
    const gender = santriFilterGender ? santriFilterGender.value : '';

    const filtered = currentSantriList.filter((santri) => {
      const searchable = [
        santri.nis,
        santri.nik,
        santri.nama,
        santri.nama_ayah,
        santri.nama_ibu,
        santri.nama_diniyah,
        santri.nama_sekolah,
      ].join(' ').toLowerCase();

      return (!keyword || searchable.includes(keyword))
        && (!diniyah || santri.nama_diniyah === diniyah)
        && (!sekolah || santri.nama_sekolah === sekolah)
        && (!gender || santri.jenis_kelamin === gender);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));
    santriCurrentPage = Math.min(santriCurrentPage, totalPages);
    const start = (santriCurrentPage - 1) * tablePageSize;
    const pageItems = filtered.slice(start, start + tablePageSize);

    santriTableBody.innerHTML = pageItems.length ? pageItems
      .map(
        (santri) => `<tr>
          <td>${escapeHtml(santri.nis || '-')}</td>
          <td>${escapeHtml(santri.nik || '-')}</td>
          <td>${escapeHtml(santri.nama || '-')}</td>
          <td>${escapeHtml(santri.jenis_kelamin || '-')}</td>
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
      .join('') : '<tr><td colspan="9">Tidak ada data santri yang sesuai.</td></tr>';

    renderPagination(santriPagination, filtered.length, santriCurrentPage, (page) => {
      santriCurrentPage = page;
      renderSantriTable();
    });
  }

  function renderGuruTable() {
    if (!guruTableBody) return;
    const keyword = (guruSearch ? guruSearch.value : '').trim().toLowerCase();
    const jabatan = guruFilterJabatan ? guruFilterJabatan.value : '';
    const mapel = guruFilterMapel ? guruFilterMapel.value : '';
    const status = guruFilterStatus ? guruFilterStatus.value : '';

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

    const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));
    guruCurrentPage = Math.min(guruCurrentPage, totalPages);
    const start = (guruCurrentPage - 1) * tablePageSize;
    const pageItems = filtered.slice(start, start + tablePageSize);

    guruTableBody.innerHTML = pageItems.length ? pageItems.map((guru) => `
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

    renderPagination(guruPagination, filtered.length, guruCurrentPage, (page) => {
      guruCurrentPage = page;
      renderGuruTable();
    });
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
      const [response, alumniResponse] = await Promise.all([
        fetch('/api/santri'),
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
        .filter((santri) => !alumniSantriIds.has(Number(santri.id)) && !alumniNis.has(santri.nis))
        .map(applySantriKamarOverride);
      populateFilterSelect(santriFilterDiniyah, currentSantriList, (santri) => santri.nama_diniyah, 'Semua Kelas Diniyah');
      populateFilterSelect(santriFilterSekolah, currentSantriList, (santri) => santri.nama_sekolah, 'Semua Kelas Sekolah');
      renderSantriTable();
    } catch (error) {
      console.error('Fetch santri failed', error);
    }
  }

  async function fetchGuru() {
    try {
      const response = await fetch('/api/guru');
      const items = await response.json();
      currentGuruList = Array.isArray(items) ? items : [];
      if (guruTabCount) guruTabCount.textContent = currentGuruList.length;
      populateFilterSelect(guruFilterJabatan, currentGuruList, (guru) => guru.jabatan, 'Semua Jabatan');
      populateFilterSelect(guruFilterMapel, currentGuruList, (guru) => guru.mata_pelajaran, 'Semua Mapel');
      populateFilterSelect(guruFilterStatus, currentGuruList, (guru) => guru.status, 'Semua Status');
      renderGuruTable();
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

  async function deleteKamar(id) {
    if (!confirm('Hapus data kamar ini?')) return;
    try {
      const response = await fetch(`/api/kamar/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        showMessage(kamarMessage, data.error || 'Gagal menghapus kamar.', 'error');
        return;
      }
      showMessage(kamarMessage, data.message || 'Data kamar berhasil dihapus.', 'success');
      await loadKamar();
    } catch (error) {
      console.error('Delete kamar failed', error);
      showMessage(kamarMessage, 'Tidak bisa menghapus data kamar.', 'error');
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

  if (kamarCards) {
    kamarCards.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const kamarId = button.dataset.id;
      if (button.dataset.action === 'edit') {
        const kamar = currentKamarList.find(k => k.id === Number(kamarId));
        if (kamar) openKamarModal(kamar);
        return;
      }
      if (button.classList.contains('delete')) {
        deleteKamar(kamarId);
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

  [santriSearch, santriFilterDiniyah, santriFilterSekolah, santriFilterGender].forEach((control) => {
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

  [guruSearch, guruFilterJabatan, guruFilterMapel, guruFilterStatus].forEach((control) => {
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
    
    // Convert date from yyyy-mm-dd to dd/mm/yyyy
    let tanggalLahir = santri.tanggal_lahir || '';
    if (tanggalLahir && tanggalLahir.includes('-')) {
      const parts = tanggalLahir.split('-');
      if (parts.length === 3) {
        tanggalLahir = `${parts[2]}/${parts[1]}/${parts[0]}`; // dd/mm/yyyy
      }
    }
    santriForm.tanggal_lahir.value = tanggalLahir;
    
    santriForm.kelas_diniyah_id.value = santri.kelas_diniyah_id || '';
    santriForm.kelas_sekolah_id.value = santri.kelas_sekolah_id || '';
    santriForm.kamar_id.value = santri.kamar_id || '';
    santriForm.jenis_kelamin.value = santri.jenis_kelamin || '';
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

  if (kamarForm) {
    kamarForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(kamarForm);
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
        const response = await fetch(editingKamarId ? `/api/kamar/${editingKamarId}` : '/api/kamar', {
          method: editingKamarId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const errorData = await response.json();
          showMessage(kamarFormMessage, errorData.error || 'Terjadi kesalahan.', 'error');
          return;
        }
        closeKamarModal();
        showMessage(kamarMessage, editingKamarId ? 'Data kamar berhasil diperbarui.' : 'Data kamar berhasil disimpan.', 'success');
        await loadKamar();
      } catch (error) {
        console.error('Submit kamar failed', error);
        showMessage(kamarFormMessage, 'Tidak bisa menyimpan data kamar.', 'error');
      }
    });
  }

  if (santriForm) {
    santriForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(santriForm);
      
      // Convert date from dd/mm/yyyy to yyyy-mm-dd for database
      let tanggalLahir = formData.get('tanggal_lahir');
      if (tanggalLahir && tanggalLahir.includes('/')) {
        const parts = tanggalLahir.split('/');
        if (parts.length === 3) {
          tanggalLahir = `${parts[2]}-${parts[1]}-${parts[0]}`; // yyyy-mm-dd
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
          showMessage(santriFormMessage, errorData.error || 'Terjadi kesalahan.', 'error');
          return;
        }

        const savedSantri = await response.json();
        rememberSantriKamar(editingSantriId || savedSantri.id, body.kamar_id);
        rememberSantriGender(editingSantriId || savedSantri.id, body.jenis_kelamin);

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

  // Task 10.1: Load Pelanggaran data
  async function loadPelanggaran() {
    try {
      const response = await fetch('/api/pelanggaran', { cache: 'no-store' });
      const items = await response.json();
      currentPelanggaranList = Array.isArray(items) ? items : [];
      
      if (pelanggaranTabCount) {
        pelanggaranTabCount.textContent = currentPelanggaranList.length;
      }

      if (!pelanggaranTableBody) return;

      if (!currentPelanggaranList.length) {
        pelanggaranTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem;">
              Belum ada data pelanggaran
            </td>
          </tr>
        `;
        return;
      }

      pelanggaranTableBody.innerHTML = currentPelanggaranList
        .map(
          (pelanggaran) => `<tr>
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
          </tr>`
        )
        .join('');
    } catch (error) {
      console.error('Fetch pelanggaran failed', error);
      if (pelanggaranTableBody) {
        pelanggaranTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: #e74c3c;">
              Gagal memuat data pelanggaran
            </td>
          </tr>
        `;
      }
    }
  }

  // Task 10.2: Enhance openPelanggaranModal to populate santri dropdown with autocomplete
  async function openPelanggaranModalEnhanced(pelanggaran = null) {
    clearPelanggaranFormState();
    
    // Fetch santri list
    try {
      const response = await fetch('/api/santri', { cache: 'no-store' });
      const santriList = await response.json();
      
      const searchInput = document.getElementById('pelanggaran-santri-search');
      const hiddenInput = document.getElementById('pelanggaran-santri-id');
      const suggestionsDiv = document.getElementById('pelanggaran-santri-suggestions');
      
      if (searchInput && hiddenInput && suggestionsDiv && Array.isArray(santriList)) {
        // Sort santri alphabetically
        const sortedSantri = santriList.sort((a, b) => {
          const nameA = (a.nama || '').toLowerCase();
          const nameB = (b.nama || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        // Store santri data
        searchInput.dataset.santriList = JSON.stringify(sortedSantri);
        
        // Clear previous values
        searchInput.value = '';
        hiddenInput.value = '';
        
        // Autocomplete functionality
        searchInput.oninput = function() {
          const searchTerm = this.value.toLowerCase().trim();
          
          if (searchTerm.length === 0) {
            suggestionsDiv.style.display = 'none';
            hiddenInput.value = '';
            return;
          }
          
          const allSantri = JSON.parse(this.dataset.santriList || '[]');
          const filtered = allSantri.filter(santri => {
            const nis = (santri.nis || '').toLowerCase();
            const nama = (santri.nama || '').toLowerCase();
            return nis.includes(searchTerm) || nama.includes(searchTerm);
          });
          
          if (filtered.length === 0) {
            suggestionsDiv.innerHTML = '<div style="padding: 10px; color: #999;">Tidak ada santri ditemukan</div>';
            suggestionsDiv.style.display = 'block';
            return;
          }
          
          suggestionsDiv.innerHTML = filtered.slice(0, 10).map(santri => `
            <div class="suggestion-item" data-id="${santri.id}" data-nis="${escapeHtml(santri.nis || '')}" data-nama="${escapeHtml(santri.nama || '')}" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;">
              <strong>${escapeHtml(santri.nis || '')}</strong> - ${escapeHtml(santri.nama || '')}
            </div>
          `).join('');
          suggestionsDiv.style.display = 'block';
        };
        
        // Handle suggestion click
        suggestionsDiv.onclick = function(e) {
          const item = e.target.closest('.suggestion-item');
          if (item) {
            const id = item.dataset.id;
            const nis = item.dataset.nis;
            const nama = item.dataset.nama;
            
            searchInput.value = `${nis} - ${nama}`;
            hiddenInput.value = id;
            suggestionsDiv.style.display = 'none';
          }
        };
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
          if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
          }
        });
      }
    } catch (error) {
      console.error('Failed to load santri list', error);
    }
    
    // If editing, populate form fields
    if (pelanggaran && pelanggaranForm) {
      editingPelanggaranId = pelanggaran.id;
      if (modalPelanggaranTitle) modalPelanggaranTitle.textContent = 'Edit Pelanggaran';
      if (submitPelanggaranButton) submitPelanggaranButton.textContent = 'Perbarui';
      
      const searchInput = document.getElementById('pelanggaran-santri-search');
      const hiddenInput = document.getElementById('pelanggaran-santri-id');
      
      if (searchInput && hiddenInput) {
        // Find santri name from list
        const santriList = JSON.parse(searchInput.dataset.santriList || '[]');
        const santri = santriList.find(s => s.id == pelanggaran.santri_id);
        if (santri) {
          searchInput.value = `${santri.nis || ''} - ${santri.nama || ''}`;
        }
        hiddenInput.value = pelanggaran.santri_id || '';
      }
      
      pelanggaranForm.jenis.value = pelanggaran.jenis || '';
      pelanggaranForm.tanggal.value = pelanggaran.tanggal || '';
      pelanggaranForm.deskripsi.value = pelanggaran.deskripsi || '';
      pelanggaranForm.sanksi.value = pelanggaran.sanksi || '';
    }
    
    if (modalPelanggaran) modalPelanggaran.classList.add('active');
  }

  // Task 10.4: Delete Pelanggaran
  async function deletePelanggaran(id) {
    if (!confirm('Hapus data pelanggaran ini?')) return;

    try {
      const response = await fetch(`/api/pelanggaran/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(pelanggaranMessage, data.error || 'Gagal menghapus pelanggaran.', 'error');
        return;
      }

      showMessage(pelanggaranMessage, data.message || 'Data pelanggaran berhasil dihapus.', 'success');
      await loadPelanggaran();
    } catch (error) {
      console.error('Delete pelanggaran failed', error);
      showMessage(pelanggaranMessage, 'Tidak bisa menghapus data pelanggaran.', 'error');
    }
  }

  function findPelanggaranById(id) {
    return currentPelanggaranList.find((item) => item.id === Number(id));
  }

  // Event delegation for pelanggaran table
  if (pelanggaranTableBody) {
    pelanggaranTableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const pelanggaranId = button.dataset.id;
      if (button.classList.contains('edit')) {
        const pelanggaran = findPelanggaranById(pelanggaranId);
        if (pelanggaran) {
          openPelanggaranModalEnhanced(pelanggaran);
        }
        return;
      }

      if (button.classList.contains('delete')) {
        deletePelanggaran(pelanggaranId);
      }
    });
  }

  // Task 10.3: Save Pelanggaran (form submission handler)
  if (pelanggaranForm) {
    pelanggaranForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(pelanggaranForm);
      
      // Validate required fields
      const santriId = formData.get('santri_id');
      const jenis = formData.get('jenis');
      const tanggal = formData.get('tanggal');
      
      if (!santriId || !jenis || !tanggal) {
        showMessage(pelanggaranFormMessage, 'Santri, jenis, dan tanggal wajib diisi.', 'error');
        return;
      }
      
      const body = {
        santri_id: santriId,
        jenis: jenis,
        tanggal: tanggal,
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
          showMessage(pelanggaranFormMessage, errorData.error || 'Terjadi kesalahan.', 'error');
          return;
        }

        showMessage(
          pelanggaranMessage,
          editingPelanggaranId ? 'Data pelanggaran berhasil diperbarui.' : 'Data pelanggaran berhasil disimpan.',
          'success'
        );
        closePelanggaranModal();
        await loadPelanggaran();
      } catch (error) {
        console.error('Submit pelanggaran failed', error);
        showMessage(pelanggaranFormMessage, 'Tidak bisa menyimpan data pelanggaran.', 'error');
      }
    });
  }

  // Task 11.1: Load Prestasi data
  async function loadPrestasi() {
    try {
      const response = await fetch('/api/prestasi', { cache: 'no-store' });
      const items = await response.json();
      currentPrestasiList = Array.isArray(items) ? items : [];
      
      if (prestasiTabCount) {
        prestasiTabCount.textContent = currentPrestasiList.length;
      }

      if (!prestasiTableBody) return;

      if (!currentPrestasiList.length) {
        prestasiTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem;">
              Belum ada data prestasi
            </td>
          </tr>
        `;
        return;
      }

      prestasiTableBody.innerHTML = currentPrestasiList
        .map(
          (prestasi) => `<tr>
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
          </tr>`
        )
        .join('');
    } catch (error) {
      console.error('Fetch prestasi failed', error);
      if (prestasiTableBody) {
        prestasiTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: #e74c3c;">
              Gagal memuat data prestasi
            </td>
          </tr>
        `;
      }
    }
  }

  // Task 11.2: Enhance openPrestasiModal to populate santri dropdown with autocomplete
  async function openPrestasiModalEnhanced(prestasi = null) {
    clearPrestasiFormState();
    
    // Fetch santri list
    try {
      const response = await fetch('/api/santri', { cache: 'no-store' });
      const santriList = await response.json();
      
      const searchInput = document.getElementById('prestasi-santri-search');
      const hiddenInput = document.getElementById('prestasi-santri-id');
      const suggestionsDiv = document.getElementById('prestasi-santri-suggestions');
      
      if (searchInput && hiddenInput && suggestionsDiv && Array.isArray(santriList)) {
        // Sort santri alphabetically
        const sortedSantri = santriList.sort((a, b) => {
          const nameA = (a.nama || '').toLowerCase();
          const nameB = (b.nama || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        // Store santri data
        searchInput.dataset.santriList = JSON.stringify(sortedSantri);
        
        // Clear previous values
        searchInput.value = '';
        hiddenInput.value = '';
        
        // Autocomplete functionality
        searchInput.oninput = function() {
          const searchTerm = this.value.toLowerCase().trim();
          
          if (searchTerm.length === 0) {
            suggestionsDiv.style.display = 'none';
            hiddenInput.value = '';
            return;
          }
          
          const allSantri = JSON.parse(this.dataset.santriList || '[]');
          const filtered = allSantri.filter(santri => {
            const nis = (santri.nis || '').toLowerCase();
            const nama = (santri.nama || '').toLowerCase();
            return nis.includes(searchTerm) || nama.includes(searchTerm);
          });
          
          if (filtered.length === 0) {
            suggestionsDiv.innerHTML = '<div style="padding: 10px; color: #999;">Tidak ada santri ditemukan</div>';
            suggestionsDiv.style.display = 'block';
            return;
          }
          
          suggestionsDiv.innerHTML = filtered.slice(0, 10).map(santri => `
            <div class="suggestion-item" data-id="${santri.id}" data-nis="${escapeHtml(santri.nis || '')}" data-nama="${escapeHtml(santri.nama || '')}" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;">
              <strong>${escapeHtml(santri.nis || '')}</strong> - ${escapeHtml(santri.nama || '')}
            </div>
          `).join('');
          suggestionsDiv.style.display = 'block';
        };
        
        // Handle suggestion click
        suggestionsDiv.onclick = function(e) {
          const item = e.target.closest('.suggestion-item');
          if (item) {
            const id = item.dataset.id;
            const nis = item.dataset.nis;
            const nama = item.dataset.nama;
            
            searchInput.value = `${nis} - ${nama}`;
            hiddenInput.value = id;
            suggestionsDiv.style.display = 'none';
          }
        };
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
          if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
          }
        });
      }
    } catch (error) {
      console.error('Failed to load santri list', error);
    }
    
    // If editing, populate form fields
    if (prestasi && prestasiForm) {
      editingPrestasiId = prestasi.id;
      if (modalPrestasiTitle) modalPrestasiTitle.textContent = 'Edit Prestasi';
      if (submitPrestasiButton) submitPrestasiButton.textContent = 'Perbarui';
      
      const searchInput = document.getElementById('prestasi-santri-search');
      const hiddenInput = document.getElementById('prestasi-santri-id');
      
      if (searchInput && hiddenInput) {
        // Find santri name from list
        const santriList = JSON.parse(searchInput.dataset.santriList || '[]');
        const santri = santriList.find(s => s.id == prestasi.santri_id);
        if (santri) {
          searchInput.value = `${santri.nis || ''} - ${santri.nama || ''}`;
        }
        hiddenInput.value = prestasi.santri_id || '';
      }
      
      prestasiForm.jenis.value = prestasi.jenis || '';
      prestasiForm.tanggal.value = prestasi.tanggal || '';
      prestasiForm.deskripsi.value = prestasi.deskripsi || '';
      prestasiForm.penghargaan.value = prestasi.penghargaan || '';
    }
    
    if (modalPrestasi) modalPrestasi.classList.add('active');
  }

  // Task 11.4: Delete Prestasi
  async function deletePrestasi(id) {
    if (!confirm('Hapus data prestasi ini?')) return;

    try {
      const response = await fetch(`/api/prestasi/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(prestasiMessage, data.error || 'Gagal menghapus prestasi.', 'error');
        return;
      }

      showMessage(prestasiMessage, data.message || 'Data prestasi berhasil dihapus.', 'success');
      await loadPrestasi();
    } catch (error) {
      console.error('Delete prestasi failed', error);
      showMessage(prestasiMessage, 'Tidak bisa menghapus data prestasi.', 'error');
    }
  }

  function findPrestasiById(id) {
    return currentPrestasiList.find((item) => item.id === Number(id));
  }

  // Event delegation for prestasi table
  if (prestasiTableBody) {
    prestasiTableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const prestasiId = button.dataset.id;
      if (button.classList.contains('edit')) {
        const prestasi = findPrestasiById(prestasiId);
        if (prestasi) {
          openPrestasiModalEnhanced(prestasi);
        }
        return;
      }

      if (button.classList.contains('delete')) {
        deletePrestasi(prestasiId);
      }
    });
  }

  // Task 11.3: Save Prestasi (form submission handler)
  if (prestasiForm) {
    prestasiForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(prestasiForm);
      
      // Validate required fields
      const santriId = formData.get('santri_id');
      const jenis = formData.get('jenis');
      const tanggal = formData.get('tanggal');
      
      if (!santriId || !jenis || !tanggal) {
        showMessage(prestasiFormMessage, 'Santri, jenis, dan tanggal wajib diisi.', 'error');
        return;
      }
      
      const body = {
        santri_id: santriId,
        jenis: jenis,
        tanggal: tanggal,
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
          showMessage(prestasiFormMessage, errorData.error || 'Terjadi kesalahan.', 'error');
          return;
        }

        showMessage(
          prestasiMessage,
          editingPrestasiId ? 'Data prestasi berhasil diperbarui.' : 'Data prestasi berhasil disimpan.',
          'success'
        );
        closePrestasiModal();
        await loadPrestasi();
      } catch (error) {
        console.error('Submit prestasi failed', error);
        showMessage(prestasiFormMessage, 'Tidak bisa menyimpan data prestasi.', 'error');
      }
    });
  }

  async function initialize() {
    setActiveGuruTab('guru');
    setActivePPTab('pelanggaran');
    await loadKelas();
    await loadKamar();
    await loadMasterData();
    await fetchSummary();
    await fetchSantri();
    await fetchGuru();
    await loadPelanggaran();
    await loadPrestasi();
  }

  initialize();
});
