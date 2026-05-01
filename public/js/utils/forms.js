import { escapeHtml } from './formatters.js';

export function populateFilterSelect(select, items, getValue, placeholder) {
  if (!select) return;

  const currentValue = select.value;
  const values = [...new Set(items.map(getValue).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'id', { numeric: true }));

  select.innerHTML = `<option value="">${placeholder}</option>`
    + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');

  if (values.includes(currentValue)) {
    select.value = currentValue;
  }
}
