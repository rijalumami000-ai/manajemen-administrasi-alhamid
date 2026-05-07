// userService.js - User management business logic

const db = require('../../db');
const { hashPassword } = require('../utils/authUtils');
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
 * Get all users
 * @param {Object} filters - Optional filters (role, is_active)
 * @returns {Promise<Array>} - Array of users (without passwords)
 */
async function getAllUsers(filters = {}) {
  try {
    let query = 'SELECT id, username, email, full_name, role, phone, photo_url, is_active, last_login, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    // Filter by role
    if (filters.role) {
      params.push(filters.role);
      query += ` AND role = $${params.length}`;
    }

    // Filter by active status
    if (filters.is_active !== undefined) {
      params.push(filters.is_active);
      query += ` AND is_active = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object>} - User object (without password)
 */
async function getUserById(id) {
  try {
    const result = await db.query(
      'SELECT id, username, email, full_name, role, phone, photo_url, is_active, last_login, created_at, updated_at FROM users WHERE id = $1',
      [id]
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
 * Create new user
 * @param {Object} data - User data
 * @returns {Promise<Object>} - Created user (without password)
 */
async function createUser(data) {
  // Validate required fields
  validateRequiredFields(data, ['username', 'password', 'full_name', 'role']);

  // Validate field formats
  if (data.email) validateField('Email', data.email, validators.email);
  if (data.phone) validateField('Phone', data.phone, validators.phone);

  // Validate role
  const validRoles = ['admin', 'guru', 'staff'];
  if (!validRoles.includes(data.role)) {
    throw new ValidationError(`Role harus salah satu dari: ${validRoles.join(', ')}`);
  }

  // Validate password strength
  if (data.password.length < 8) {
    throw new ValidationError('Password minimal 8 karakter');
  }

  // Normalize data
  const username = normalizeText(data.username);
  const email = normalizeText(data.email);
  const full_name = normalizeText(data.full_name);
  const role = data.role;
  const phone = normalizeText(data.phone);
  const photo_url = normalizeText(data.photo_url);
  const is_active = data.is_active !== undefined ? data.is_active : true;

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  try {
    const result = await db.query(
      `INSERT INTO users (username, password, email, full_name, role, phone, photo_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, full_name, role, phone, photo_url, is_active, created_at, updated_at`,
      [username, hashedPassword, email, full_name, role, phone, photo_url, is_active]
    );

    return result.rows[0];
  } catch (error) {
    // Check for duplicate username or email
    if (error.code === '23505') {
      if (error.constraint === 'users_username_key') {
        throw new ConflictError('Username sudah digunakan');
      }
      if (error.constraint === 'users_email_key') {
        throw new ConflictError('Email sudah digunakan');
      }
    }
    handleDatabaseError(error);
  }
}

/**
 * Update user by ID
 * @param {number} id - User ID
 * @param {Object} data - User data to update
 * @returns {Promise<Object>} - Updated user (without password)
 */
async function updateUser(id, data) {
  // Validate field formats if provided
  if (data.email) validateField('Email', data.email, validators.email);
  if (data.phone) validateField('Phone', data.phone, validators.phone);

  // Validate role if provided
  if (data.role) {
    const validRoles = ['admin', 'guru', 'staff'];
    if (!validRoles.includes(data.role)) {
      throw new ValidationError(`Role harus salah satu dari: ${validRoles.join(', ')}`);
    }
  }

  // Build update query dynamically
  const updates = [];
  const params = [];
  let paramCount = 1;

  if (data.username !== undefined) {
    params.push(normalizeText(data.username));
    updates.push(`username = $${paramCount++}`);
  }
  if (data.email !== undefined) {
    params.push(normalizeText(data.email));
    updates.push(`email = $${paramCount++}`);
  }
  if (data.full_name !== undefined) {
    params.push(normalizeText(data.full_name));
    updates.push(`full_name = $${paramCount++}`);
  }
  if (data.role !== undefined) {
    params.push(data.role);
    updates.push(`role = $${paramCount++}`);
  }
  if (data.phone !== undefined) {
    params.push(normalizeText(data.phone));
    updates.push(`phone = $${paramCount++}`);
  }
  if (data.photo_url !== undefined) {
    params.push(normalizeText(data.photo_url));
    updates.push(`photo_url = $${paramCount++}`);
  }
  if (data.is_active !== undefined) {
    params.push(data.is_active);
    updates.push(`is_active = $${paramCount++}`);
  }

  // If password is provided, hash it
  if (data.password) {
    if (data.password.length < 8) {
      throw new ValidationError('Password minimal 8 karakter');
    }
    const hashedPassword = await hashPassword(data.password);
    params.push(hashedPassword);
    updates.push(`password = $${paramCount++}`);
  }

  if (updates.length === 0) {
    throw new ValidationError('Tidak ada data yang diupdate');
  }

  params.push(id);
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
    // Check for duplicate username or email
    if (error.code === '23505') {
      if (error.constraint === 'users_username_key') {
        throw new ConflictError('Username sudah digunakan');
      }
      if (error.constraint === 'users_email_key') {
        throw new ConflictError('Email sudah digunakan');
      }
    }
    handleDatabaseError(error);
  }
}

/**
 * Delete user by ID (soft delete - set is_active to false)
 * @param {number} id - User ID
 * @returns {Promise<Object>} - Deleted user info
 */
async function deleteUser(id) {
  try {
    // Soft delete - set is_active to false
    const result = await db.query(
      `UPDATE users SET is_active = FALSE WHERE id = $1
       RETURNING id, username, full_name`,
      [id]
    );

    if (!result.rows.length) {
      throw new NotFoundError('User');
    }

    return {
      message: 'User berhasil dinonaktifkan',
      user: result.rows[0]
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error);
  }
}

/**
 * Hard delete user by ID (permanent delete)
 * @param {number} id - User ID
 * @returns {Promise<Object>} - Deleted user info
 */
async function hardDeleteUser(id) {
  try {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username, full_name',
      [id]
    );

    if (!result.rows.length) {
      throw new NotFoundError('User');
    }

    return {
      message: 'User berhasil dihapus permanen',
      user: result.rows[0]
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error);
  }
}

/**
 * Activate user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object>} - Activated user
 */
async function activateUser(id) {
  try {
    const result = await db.query(
      `UPDATE users SET is_active = TRUE WHERE id = $1
       RETURNING id, username, email, full_name, role, phone, photo_url, is_active, created_at, updated_at`,
      [id]
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

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  activateUser
};
