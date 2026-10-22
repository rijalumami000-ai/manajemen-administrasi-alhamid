import db from '../../db';
import { hashPassword } from '../utils/authUtils';
import { normalizeText } from '../utils/normalizers';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  validateRequiredFields,
  validateField,
  validators,
  handleDatabaseError
} from '../utils/errorHandler';

export interface UserFilters {
  role?: string;
  is_active?: boolean | number;
}

export interface UserCreateData {
  username?: string;
  password?: string;
  full_name?: string;
  role?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  is_active?: boolean | number;
}

export interface UserUpdateData {
  username?: string;
  password?: string;
  full_name?: string;
  role?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  is_active?: boolean | number;
}

/**
 * Get all users
 * @param filters - Optional filters (role, is_active)
 * @returns Array of users (without passwords)
 */
export async function getAllUsers(filters: UserFilters = {}): Promise<any[]> {
  try {
    let query = 'SELECT id, username, email, full_name, role, phone, photo_url, is_active, last_login, created_at, updated_at FROM users WHERE 1=1';
    const params: any[] = [];

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
    return [];
  }
}

/**
 * Get user by ID
 * @param id - User ID
 * @returns User object (without password)
 */
export async function getUserById(id: number): Promise<any> {
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
 * @param data - User data
 * @returns Created user (without password)
 */
export async function createUser(data: UserCreateData): Promise<any> {
  // Validate required fields
  validateRequiredFields(data, ['username', 'password', 'full_name', 'role']);

  // Validate field formats
  if (data.email) validateField('Email', data.email, validators.email);
  if (data.phone) validateField('Phone', data.phone, validators.phone);

  // Validate role
  const validRoles = ['admin', 'madrasah_diniyah', 'bendahara'];
  if (!data.role || !validRoles.includes(data.role)) {
    throw new ValidationError(`Role harus salah satu dari: ${validRoles.join(', ')}`);
  }

  // Validate password strength
  if (!data.password || data.password.length < 8) {
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
  } catch (error: any) {
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
 * @param id - User ID
 * @param data - User data to update
 * @returns Updated user (without password)
 */
export async function updateUser(id: number, data: UserUpdateData): Promise<any> {
  // Validate field formats if provided
  if (data.email) validateField('Email', data.email, validators.email);
  if (data.phone) validateField('Phone', data.phone, validators.phone);

  // Validate role if provided
  if (data.role) {
    const validRoles = ['admin', 'madrasah_diniyah', 'bendahara'];
    if (!validRoles.includes(data.role)) {
      throw new ValidationError(`Role harus salah satu dari: ${validRoles.join(', ')}`);
    }
  }

  // Build update query dynamically
  const updates: string[] = [];
  const params: any[] = [];
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
  } catch (error: any) {
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
 * @param id - User ID
 * @returns Deleted user info
 */
export async function deleteUser(id: number): Promise<any> {
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
 * @param id - User ID
 * @returns Deleted user info
 */
export async function hardDeleteUser(id: number): Promise<any> {
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
 * @param id - User ID
 * @returns Activated user
 */
export async function activateUser(id: number): Promise<any> {
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

const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  activateUser
};

module.exports = userService;
export default userService;
