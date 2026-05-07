// alumni_script.js - Simplified entry point for alumni feature
// Uses modular structure from public/js/features/ and public/js/utils/

import { alumniFeature } from './js/features/alumniFeature.js';

// Sidebar management (shared with main dashboard)
const hamburgerMenu = document.getElementById('hamburger-menu');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const menuParentButtons = document.querySelectorAll('.menu-parent');
const pageBody = document.body;

function setSidebarState(isOpen) {
  if (!sidebar || !hamburgerMenu) return;
  hamburgerMenu.classList.toggle('active', isOpen);
  hamburgerMenu.setAttribute('aria-expanded', String(isOpen));
  sidebar.classList.toggle('active', isOpen);
  pageBody.classList.toggle('sidebar-open', isOpen);
  pageBody.classList.toggle('sidebar-collapsed', !isOpen);
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

if (hamburgerMenu) {
  hamburgerMenu.addEventListener('click', function() {
    setSidebarState(!sidebar.classList.contains('active'));
  });
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

document.addEventListener('click', function(event) {
  if (
    window.innerWidth <= 768 &&
    sidebar &&
    hamburgerMenu &&
    !sidebar.contains(event.target) &&
    !hamburgerMenu.contains(event.target) &&
    sidebar.classList.contains('active')
  ) {
    closeSidebar();
  }
});

setSidebarState(window.innerWidth > 768);

// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Close modal when clicking outside
window.onclick = function(event) {
  const addModal = document.getElementById('addModal');
  const editModal = document.getElementById('editModal');
  const detailModal = document.getElementById('detailModal');
  const additionalModal = document.getElementById('additionalModal');

  if (event.target === addModal) alumniFeature.closeAddModal();
  if (event.target === editModal) alumniFeature.closeEditModal();
  if (event.target === detailModal) alumniFeature.closeDetailModal();
  if (event.target === additionalModal) alumniFeature.closeAdditionalModal();
}

// Initialize alumni feature
alumniFeature.init();
