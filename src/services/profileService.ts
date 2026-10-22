import db from '../../db';
import { hashPassword, comparePassword } from '../utils/authUtils';
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

/**
 * Get user profile by user ID
 * @param userId - User ID
 * @returns User profile (without password)
 */
export async function getProfile(userId: number): Promise<any> {
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
 * @param userId - User ID
 * @param data - Profile data to update (email, full_name, phone, photo_url)
 * @returns Updated profile
 */
export async function updateProfile(
  userId: number,
  data: { email?: string; full_name?: string; phone?: string; photo_url?: string }
): Promise<any> {
  // Validate field formats if provided
  if (data.email) validateField('Email', data.email, validators.email);
  if (data.phone) validateField('Phone', data.phone, validators.phone);

  // Build update query dynamically
  const updates: string[] = [];
  const params: any[] = [];
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
  } catch (error: any) {
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
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @returns Success message
 */
export async function changePassword(
  userId: number,
  currentPassword?: string,
  newPassword?: string
): Promise<{ message: string }> {
  // Validate required fields
  validateRequiredFields(
    { currentPassword, newPassword },
    ['currentPassword', 'newPassword']
  );

  // Validate new password strength
  if (!newPassword || newPassword.length < 8) {
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
    const isPasswordValid = await comparePassword(currentPassword!, user.password);
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
    throw error;
  }
}

/**
 * Get user activity logs
 * @param userId - User ID
 * @param limit - Number of logs to return (default: 50)
 * @returns Array of activity logs
 */
export async function getActivityLogs(userId: number, limit = 50): Promise<any[]> {
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
    return [];
  }
}

const profileService = {
  getProfile,
  updateProfile,
  changePassword,
  getActivityLogs
};

module.exports = profileService;
export default profileService;
