export function renderPagination(container, totalItems, currentPage, onPageChange, pageSize = 10) {
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) {
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
