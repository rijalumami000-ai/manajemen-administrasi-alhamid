import { createGuruFeature } from './js/features/guruFeature.js';
import { createKamarFeature } from './js/features/kamarFeature.js';
import { createKelasFeature } from './js/features/kelasFeature.js';
import { createPelanggaranPrestasiFeature } from './js/features/pelanggaranPrestasiFeature.js';
import { createSantriFeature } from './js/features/santriFeature.js';
import { loadUsers } from './js/features/userFeature.js';
import { loadProfile } from './js/features/profileFeature.js';

document.addEventListener('DOMContentLoaded', function () {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebar-close');
  const menuItems = document.querySelectorAll('.menu-item[data-target]');
  const menuParentButtons = document.querySelectorAll('.menu-parent');
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
  const santriFilterStatus = document.getElementById('santri-filter-status');
  const tahunAjaranSelect = document.getElementById('tahun-ajaran-select');
  const tahunAjaranCards = document.getElementById('tahun-ajaran-cards');
  const santriActiveYearLabel = document.getElementById('santri-active-year-label');
  const btnMigrasiTahunAjaran = document.getElementById('btn-migrasi-tahun-ajaran');
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

  const tablePageSize = 10;

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

  const santriFeature = createSantriFeature({
    pageSize: tablePageSize,
    elements: {
      santriForm,
      santriTableBody,
      santriSearch,
      santriFilterDiniyah,
      santriFilterSekolah,
      santriFilterGender,
      santriFilterStatus,
      tahunAjaranSelect,
      tahunAjaranCards,
      santriActiveYearLabel,
      btnMigrasiTahunAjaran,
      santriPagination,
      santriMessage,
      santriFormMessage,
      modalSantriTitle,
      submitSantriButton,
      modalSantri,
      btnTambahSantri,
      closeModalSantri,
      cancelModalSantri,
    },
    onSummaryChanged: fetchSummary,
  });

  const kelasFeature = createKelasFeature({
    elements: {
      form: kelasForm,
      cards: kelasCards,
      sortSelect: kelasSortSelect,
      message: kelasMessage,
      formMessage: kelasFormMessage,
      modal: modalKelas,
      modalTitle: modalKelasTitle,
      submitButton: submitKelasButton,
      addButton: btnTambahKelas,
      closeButton: closeModalKelas,
      cancelButton: cancelModalKelas,
    },
    onLoaded: (items) => santriFeature.setKelasList(items),
  });

  const kamarFeature = createKamarFeature({
    elements: {
      form: kamarForm,
      cards: kamarCards,
      message: kamarMessage,
      formMessage: kamarFormMessage,
      modal: modalKamar,
      modalTitle: modalKamarTitle,
      submitButton: submitKamarButton,
      addButton: btnTambahKamar,
      closeButton: closeModalKamar,
      cancelButton: cancelModalKamar,
    },
    onLoaded: (items) => santriFeature.setKamarList(items),
  });

  const guruFeature = createGuruFeature({
    pageSize: tablePageSize,
    elements: {
      guruForm,
      guruTableBody,
      guruSearch,
      guruFilterJabatan,
      guruFilterMapel,
      guruFilterStatus,
      guruPagination,
      guruMessage,
      guruFormMessage,
      modalGuru,
      btnTambahGuru,
      closeModalGuru,
      cancelModalGuru,
      modalGuruTitle,
      submitGuruButton,
      guruTabCount,
      mataPelajaranList,
      jabatanList,
      mataPelajaranCount,
      jabatanCount,
      mataPelajaranFormMessage,
      jabatanFormMessage,
      modalMataPelajaran,
      btnTambahMataPelajaran,
      closeModalMataPelajaran,
      cancelModalMataPelajaran,
      modalMataPelajaranTitle,
      submitMataPelajaranButton,
      modalJabatan,
      btnTambahJabatan,
      closeModalJabatan,
      cancelModalJabatan,
      modalJabatanTitle,
      submitJabatanButton,
    },
    onSummaryChanged: fetchSummary,
  });

  const pelanggaranPrestasiFeature = createPelanggaranPrestasiFeature({
    elements: {
      pelanggaranTabCount,
      prestasiTabCount,
      modalPelanggaran,
      btnTambahPelanggaran,
      closeModalPelanggaran,
      cancelModalPelanggaran,
      modalPrestasi,
      btnTambahPrestasi,
      closeModalPrestasi,
      cancelModalPrestasi,
      pelanggaranTableBody,
      prestasiTableBody,
      pelanggaranMessage,
      prestasiMessage,
      pelanggaranFormMessage,
      prestasiFormMessage,
      pelanggaranForm,
      prestasiForm,
      modalPelanggaranTitle,
      modalPrestasiTitle,
      submitPelanggaranButton,
      submitPrestasiButton,
    },
  });

  // Initialize User Management (Admin only)
  if (window.authState && window.authState.isAdmin()) {
    const usersPanel = document.getElementById('users-panel');
    if (usersPanel) {
      // Load users when panel becomes active
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && usersPanel.classList.contains('active')) {
            loadUsers();
          }
        });
      });
      observer.observe(usersPanel, { attributes: true });
    }
  }

  // Initialize Profile
  const profilePanel = document.getElementById('profile-panel');
  if (profilePanel) {
    // Load profile when panel becomes active
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && profilePanel.classList.contains('active')) {
          loadProfile();
        }
      });
    });
    observer.observe(profilePanel, { attributes: true });
  }

  yearEl.textContent = new Date().getFullYear();

  function setSidebarState(isOpen) {
    if (!sidebar || !hamburgerMenu) return;
    hamburgerMenu.classList.toggle('active', isOpen);
    hamburgerMenu.setAttribute('aria-expanded', String(isOpen));
    sidebar.classList.toggle('active', isOpen);
    pageBody.classList.toggle('sidebar-open', isOpen);
    pageBody.classList.toggle('sidebar-collapsed', !isOpen);
  }

  function toggleSidebar() {
    const isOpen = !sidebar.classList.contains('active');
    setSidebarState(isOpen);
  }

  function closeSidebar() {
    setSidebarState(false);
  }

  function setMenuGroupExpanded(button, isExpanded) {
    const menuGroup = button.closest('.menu-group');
    button.setAttribute('aria-expanded', String(isExpanded));
    if (menuGroup) {
      menuGroup.classList.toggle('collapsed', !isExpanded);
    }
  }

  function setActivePanel(targetId) {
    panels.forEach((panel) => panel.classList.toggle('active', panel.id === targetId));
    menuItems.forEach((item) => item.classList.toggle('active', item.dataset.target === targetId));
    menuParentButtons.forEach((button) => {
      const menuGroup = button.closest('.menu-group');
      const hasActiveChild = menuGroup ? Boolean(menuGroup.querySelector(`.submenu-item[data-target="${targetId}"]`)) : false;
      button.classList.toggle('active', hasActiveChild);
      if (hasActiveChild) {
        setMenuGroupExpanded(button, true);
      }
    });
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

  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', toggleSidebar);
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }

  menuParentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      setMenuGroupExpanded(button, !isExpanded);
    });
  });

  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      setActivePanel(targetId);
      if (targetId) {
        history.replaceState(null, '', `#${targetId}`);
      }
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  const initialPanelId = window.location.hash ? window.location.hash.slice(1) : 'summary-panel';
  if (document.getElementById(initialPanelId)) {
    setActivePanel(initialPanelId);
  }

  setSidebarState(window.innerWidth > 768);

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

  santriFeature.bindEvents();
  kelasFeature.bindEvents();
  kamarFeature.bindEvents();

  guruFeature.bindEvents();

  pelanggaranPrestasiFeature.bindEvents();

  async function loadKelas() {
    return kelasFeature.load();
  }

  async function loadKamar() {
    return kamarFeature.load();
  }

  async function loadTahunAjaran() {
    return santriFeature.loadTahunAjaran();
  }

  async function loadMasterData() {
    return guruFeature.loadMasterData();
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
    return santriFeature.fetchSantri();
  }

  async function fetchGuru() {
    return guruFeature.fetchGuru();
  }

  async function loadPelanggaran() {
    return pelanggaranPrestasiFeature.loadPelanggaran();
  }

  async function loadPrestasi() {
    return pelanggaranPrestasiFeature.loadPrestasi();
  }

  async function initialize() {
    setActiveGuruTab('guru');
    setActivePPTab('pelanggaran');
    await loadKelas();
    await loadKamar();
    await loadTahunAjaran();
    await loadMasterData();
    await fetchSummary();
    await fetchSantri();
    await fetchGuru();
    await loadPelanggaran();
    await loadPrestasi();
  }

  initialize();
});
