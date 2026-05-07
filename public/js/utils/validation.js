// validation.js - Frontend validation utilities

/**
 * Validate required fields
 * @param {Object} fields - Object with field names and values
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
export function validateRequired(fields) {
  const errors = [];

  for (const [fieldName, value] of Object.entries(fields)) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${fieldName} wajib diisi`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone) return true; // Optional field
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validate NIS format (numbers only, 6-20 digits)
 * @param {string} nis
 * @returns {boolean}
 */
export function validateNIS(nis) {
  if (!nis) return false;
  const nisRegex = /^[0-9]{6,20}$/;
  return nisRegex.test(nis);
}

/**
 * Validate NIK format (16 digits)
 * @param {string} nik
 * @returns {boolean}
 */
export function validateNIK(nik) {
  if (!nik) return true; // Optional field
  const nikRegex = /^[0-9]{16}$/;
  return nikRegex.test(nik);
}

/**
 * Validate year format (4 digits, reasonable range)
 * @param {string|number} year
 * @returns {boolean}
 */
export function validateYear(year) {
  if (!year) return false;
  const yearNum = parseInt(year, 10);
  return yearNum >= 1900 && yearNum <= 2100;
}

/**
 * Validate date (not in future)
 * @param {string} date - Date string
 * @returns {boolean}
 */
export function validateDateNotFuture(date) {
  if (!date) return true; // Optional field
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return inputDate <= today;
}

/**
 * Validate number range
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function validateRange(value, min, max) {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Show validation errors in form
 * @param {HTMLElement} formElement
 * @param {Array} errors
 */
export function showValidationErrors(formElement, errors) {
  // Remove existing error messages
  const existingErrors = formElement.querySelectorAll('.validation-error');
  existingErrors.forEach(el => el.remove());

  if (errors.length === 0) return;

  // Create error message container
  const errorContainer = document.createElement('div');
  errorContainer.className = 'validation-error';
  errorContainer.style.cssText = `
    background: #fee2e2;
    border: 1px solid #ef4444;
    color: #dc2626;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
  `;

  const errorList = document.createElement('ul');
  errorList.style.cssText = 'margin: 0; padding-left: 20px;';

  errors.forEach(error => {
    const li = document.createElement('li');
    li.textContent = error;
    errorList.appendChild(li);
  });

  errorContainer.appendChild(errorList);
  formElement.insertBefore(errorContainer, formElement.firstChild);
}

/**
 * Clear validation errors
 * @param {HTMLElement} formElement
 */
export function clearValidationErrors(formElement) {
  const existingErrors = formElement.querySelectorAll('.validation-error');
  existingErrors.forEach(el => el.remove());
}

/**
 * Add input validation listener
 * @param {HTMLInputElement} input
 * @param {Function} validator
 * @param {string} errorMessage
 */
export function addInputValidator(input, validator, errorMessage) {
  input.addEventListener('blur', () => {
    const isValid = validator(input.value);

    // Remove existing error
    const existingError = input.parentElement.querySelector('.field-error');
    if (existingError) existingError.remove();

    if (!isValid && input.value) {
      // Add error message
      const errorSpan = document.createElement('span');
      errorSpan.className = 'field-error';
      errorSpan.textContent = errorMessage;
      errorSpan.style.cssText = `
        color: #dc2626;
        font-size: 12px;
        margin-top: 4px;
        display: block;
      `;
      input.parentElement.appendChild(errorSpan);
      input.style.borderColor = '#ef4444';
    } else {
      input.style.borderColor = '';
    }
  });
}

/**
 * Prevent double submit
 * @param {HTMLFormElement} form
 * @param {Function} submitHandler
 */
export function preventDoubleSubmit(form, submitHandler) {
  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return; // Prevent double submit
    }

    isSubmitting = true;

    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Menyimpan...';
    }

    try {
      await submitHandler(e);
    } finally {
      isSubmitting = false;

      // Re-enable submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || 'Simpan';
      }
    }
  });
}

/**
 * Show loading state
 * @param {HTMLElement} element
 * @param {string} message
 */
export function showLoading(element, message = 'Memuat...') {
  element.style.position = 'relative';
  element.style.pointerEvents = 'none';
  element.style.opacity = '0.6';

  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 1000;
  `;

  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.style.cssText = `
    width: 20px;
    height: 20px;
    border: 3px solid #e5e7eb;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  `;

  const text = document.createElement('span');
  text.textContent = message;
  text.style.cssText = 'color: #374151; font-size: 14px;';

  loadingOverlay.appendChild(spinner);
  loadingOverlay.appendChild(text);
  element.appendChild(loadingOverlay);

  // Add spinner animation if not exists
  if (!document.getElementById('spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Hide loading state
 * @param {HTMLElement} element
 */
export function hideLoading(element) {
  element.style.pointerEvents = '';
  element.style.opacity = '';

  const loadingOverlay = element.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}
