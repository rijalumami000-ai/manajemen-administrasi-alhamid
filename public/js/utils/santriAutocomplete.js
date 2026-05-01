import { escapeHtml } from './formatters.js';

function sortSantriByName(items) {
  return [...items].sort((a, b) => {
    const nameA = (a.nama || '').toLowerCase();
    const nameB = (b.nama || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

function santriLabel(santri) {
  return `${santri.nis || ''} - ${santri.nama || ''}`;
}

function bindAutocomplete(searchInput, hiddenInput, suggestionsDiv) {
  searchInput.oninput = function () {
    const searchTerm = this.value.toLowerCase().trim();

    if (searchTerm.length === 0) {
      suggestionsDiv.style.display = 'none';
      hiddenInput.value = '';
      return;
    }

    const allSantri = JSON.parse(this.dataset.santriList || '[]');
    const filtered = allSantri.filter((santri) => {
      const nis = (santri.nis || '').toLowerCase();
      const nama = (santri.nama || '').toLowerCase();
      return nis.includes(searchTerm) || nama.includes(searchTerm);
    });

    if (filtered.length === 0) {
      suggestionsDiv.innerHTML = '<div style="padding: 10px; color: #999;">Tidak ada santri ditemukan</div>';
      suggestionsDiv.style.display = 'block';
      return;
    }

    suggestionsDiv.innerHTML = filtered.slice(0, 10).map((santri) => `
      <div class="suggestion-item" data-id="${santri.id}" data-nis="${escapeHtml(santri.nis || '')}" data-nama="${escapeHtml(santri.nama || '')}" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;">
        <strong>${escapeHtml(santri.nis || '')}</strong> - ${escapeHtml(santri.nama || '')}
      </div>
    `).join('');
    suggestionsDiv.style.display = 'block';
  };

  suggestionsDiv.onclick = function (event) {
    const item = event.target.closest('.suggestion-item');
    if (!item) return;

    searchInput.value = `${item.dataset.nis} - ${item.dataset.nama}`;
    hiddenInput.value = item.dataset.id;
    suggestionsDiv.style.display = 'none';
  };

  if (searchInput.dataset.autocompleteReady === 'true') {
    return;
  }

  document.addEventListener('click', (event) => {
    if (!searchInput.contains(event.target) && !suggestionsDiv.contains(event.target)) {
      suggestionsDiv.style.display = 'none';
    }
  });
  searchInput.dataset.autocompleteReady = 'true';
}

export async function setupSantriAutocomplete({
  searchInputId,
  hiddenInputId,
  suggestionsId,
  selectedSantriId = '',
}) {
  const searchInput = document.getElementById(searchInputId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const suggestionsDiv = document.getElementById(suggestionsId);

  if (!searchInput || !hiddenInput || !suggestionsDiv) {
    return [];
  }

  searchInput.value = '';
  hiddenInput.value = selectedSantriId || '';

  try {
    const response = await fetch('/api/santri', { cache: 'no-store' });
    const santriList = await response.json();

    if (!Array.isArray(santriList)) {
      return [];
    }

    const sortedSantri = sortSantriByName(santriList);
    searchInput.dataset.santriList = JSON.stringify(sortedSantri);
    bindAutocomplete(searchInput, hiddenInput, suggestionsDiv);

    if (selectedSantriId) {
      const selectedSantri = sortedSantri.find((santri) => Number(santri.id) === Number(selectedSantriId));
      if (selectedSantri) {
        searchInput.value = santriLabel(selectedSantri);
      }
    }

    return sortedSantri;
  } catch (error) {
    console.error('Failed to load santri list', error);
    return [];
  }
}
