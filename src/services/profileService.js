// profileService.js - Profile management business logic

const db = require('../../db');
const { hashPassword, comparePassword } = require('../utils/authUtils');
const { normalizeText } = require('../utils/normalizers');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  validateRequiredFields,
  validateField,
  validators,
  handleDatabaseError
} = require('../utils/errorHandler');

/**
 * Get user profile by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - User profile (without password)
 */
async function getProfile(userId) {
  try {
    const result = await db.query(
      'SELECT id, username, email, full_name, role, phone, photo_url, is_active, last_login, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows.length) {
      throw new NotFoundError('User');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error);
  }
}

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} data - Profile data to update (email, full_name, phone, photo_url)
 * @returns {Promise<Object>} - Updated profile
 */
async function updateProfile(userId, data) {
  // Validate field formats if provided
  if (data.email) validateField('Email', data.email, validators.email);
  if (data.phone) validateField('Phone', data.phone, validators.phone);

  // Build update query dynamically
  const updates = [];
  const params = [];
  let paramCount = 1;

  if (data.email !== undefined) {
    params.push(normalizeText(data.email));
    updates.push(`email = $${paramCount++}`);
  }
  if (data.full_name !== undefined) {
    params.push(normalizeText(data.full_name));
    updates.push(`full_name = $${paramCount++}`);
  }
  if (data.phone !== undefined) {
    params.push(normalizeText(data.phone));
    updates.push(`phone = $${paramCount++}`);
  }
  if (data.photo_url !== undefined) {
    params.push(normalizeText(data.photo_url));
    updates.push(`photo_url = $${paramCount++}`);
  }

  if (updates.length === 0) {
    throw new ValidationError('Tidak ada data yang diupdate');
  }

  params.push(userId);
  const query = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, username, email, full_name, role, phone, photo_url, is_active, last_login, created_at, updated_at
  `;

  try {
    const result = await db.query(query, params);

    if (!result.rows.length) {
      throw new NotFoundError('User');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
    // Check for duplicate email
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      throw new ConflictError('Email sudah digunakan');
    }
    handleDatabaseError(error);
  }
}

/**
 * Change user password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Success message
 */
async function changePassword(userId, currentPassword, newPassword) {
  // Validate required fields
  validateRequiredFields(
    { currentPassword, newPassword },
    ['currentPassword', 'newPassword']
  );

  // Validate new password strength
  if (newPassword.length < 8) {
    throw new ValidationError('Password baru minimal 8 karakter');
  }

  // Check if new password is same as current
  if (currentPassword === newPassword) {
    throw new ValidationError('Password baru tidak boleh sama dengan password lama');
  }

  try {
    // Get current user with password
    const userResult = await db.query(
      'SELECT id, password FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows.length) {
      throw new NotFoundError('User');
    }

    const user = userResult.rows[0];

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Password lama tidak sesuai');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    // Invalidate all sessions for this user (force re-login)
    await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description)
       VALUES ($1, $2, $3)`,
      [userId, 'change_password', 'User changed password']
    );

    return {
      message: 'Password berhasil diubah. Silakan login kembali dengan password baru.'
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
    handleDatabaseError(error);
  }
}

/**
 * Get user activity logs
 * @param {number} userId - User ID
 * @param {number} limit - Number of logs to return (default: 50)
 * @returns {Promise<Array>} - Array of activity logs
 */
async function getActivityLogs(userId, limit = 50) {
  try {
    const result = await db.query(
      `SELECT id, action, entity_type, entity_id, description, ip_address, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    handleDatabaseError(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getActivityLogs
};
