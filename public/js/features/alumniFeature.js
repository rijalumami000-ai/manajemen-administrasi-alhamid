// alumniFeature.js - Main orchestrator for alumni feature

import { displayAlumni, updateStats, populateYearFilter } from '../utils/alumniDisplay.js';
import {
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openAdditionalModal,
  closeAdditionalModal,
  setupSantriAutocomplete
} from '../utils/alumniModal.js';
import {
  mergeAdditionalInfo,
  saveManualAlumni,
  migrateSantri,
  updateAlumni,
  deleteAlumni,
  saveAdditionalInfo
} from '../utils/alumniCrud.js';
import {
  showDetail,
  closeDetailModal,
  switchDetailTab,
  setKamarList
} from '../utils/alumniDetail.js';
import { showLoading, hideLoading } from '../utils/validation.js';

const API_URL = 'http://localhost:3000/api';

// Global state
let allAlumni = [];
let allSantri = [];
let allKamar = [];

/**
 * Initialize alumni feature
 */
export async function init() {
  await loadKamarList();
  await loadAlumni();
  await loadSantriList();
}

/**
 * Load kamar list
 */
async function loadKamarList() {
  try {
    const response = await fetch(`${API_URL}/kamar`, { cache: 'no-store' });
    const items = await response.json();
    allKamar = Array.isArray(items) ? items : [];
    setKamarList(allKamar);
  } catch (error) {
    console.error('Error loading kamar:', error);
  }
}

/**
 * Load alumni data
 */
export async function loadAlumni() {
  const container = document.getElementById('alumniTableBody') || document.body;

  try {
    showLoading(container, 'Memuat data alumni...');

    const response = await fetch(`${API_URL}/alumni`);
    if (!response.ok) {
      throw new Error('Gagal memuat data alumni');
    }

    const alumni = await response.json();
    allAlumni = alumni.map(mergeAdditionalInfo);
    displayAlumni(allAlumni);
    updateStats(allAlumni);
    populateYearFilter(allAlumni);
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal memuat data alumni');
  } finally {
    hideLoading(container);
  }
}

/**
 * Load santri list for migration
 */
export async function loadSantriList() {
  try {
    const response = await fetch(`${API_URL}/santri/active`);
    if (!response.ok) {
      throw new Error('Gagal memuat data santri');
    }

    allSantri = await response.json();
    setupSantriAutocomplete(allSantri);
  } catch (error) {
    console.error('Error loading santri:', error);
  }
}

/**
 * Search alumni
 */
export function searchAlumni() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const yearFilter = document.getElementById('yearFilter').value;

  let filtered = allAlumni;

  if (searchTerm) {
    filtered = filtered.filter(a =>
      a.nama.toLowerCase().includes(searchTerm) ||
      a.nis.toLowerCase().includes(searchTerm)
    );
  }

  if (yearFilter) {
    filtered = filtered.filter(a => a.tahun_lulus == yearFilter);
  }

  displayAlumni(filtered);
}

/**
 * Reset search
 */
export function resetSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('yearFilter').value = '';
  displayAlumni(allAlumni);
}

// Export wrapped functions for global access
export const alumniFeature = {
  // Initialization
  init,
  loadAlumni,
  loadSantriList,
  searchAlumni,
  resetSearch,

  // Modal functions
  openAddModal: () => openAddModal(loadSantriList),
  closeAddModal,
  openEditModal: (id) => openEditModal(id, allAlumni),
  closeEditModal,
  openAdditionalModal: (id) => openAdditionalModal(id, allAlumni),
  closeAdditionalModal,

  // CRUD operations
  saveManualAlumni: (event) => saveManualAlumni(event, closeAddModal, loadAlumni),
  migrateSantri: (event) => migrateSantri(event, closeAddModal, loadAlumni, loadSantriList),
  updateAlumni: (event) => updateAlumni(event, closeEditModal, loadAlumni),
  deleteAlumni: (id, nama) => deleteAlumni(id, nama, loadAlumni, loadSantriList),
  saveAdditionalInfo: (event) => saveAdditionalInfo(event, allAlumni, closeAdditionalModal, loadAlumni, displayAlumni),

  // Detail view
  showDetail,
  closeDetailModal,
  switchDetailTab
};

// Expose to window for onclick handlers
window.alumniFeature = alumniFeature;
