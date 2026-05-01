export function showMessage(element, text, type = 'success') {
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
