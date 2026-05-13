// authService.js - Authentication business logic

const db = require('../../db');
const {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  createUserPayload
} = require('../utils/authUtils');
const {
  ValidationError,
  NotFoundError,
  AppError,
  validateRequiredFields
} = require('../utils/errorHandler');

/**
 * Login user with username and password
 * @param {string} username
 * @param {string} password
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} - { user, accessToken, refreshToken }
 */
async function login(username, password, ipAddress = null, userAgent = null) {
  // Validate required fields
  validateRequiredFields({ username, password }, ['username', 'password']);

  try {
    // Get user from database
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (!result.rows.length) {
      throw new ValidationError('Username atau password salah');
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new ValidationError('Akun tidak aktif. Hubungi administrator.');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Username atau password salah');
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Create user payload (exclude password)
    const userPayload = createUserPayload(user);

    // Generate tokens
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: user.id, username: user.username });

    // Save session (optional)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.query(
      `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, accessToken, ipAddress, userAgent, expiresAt]
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'login', `User ${username} logged in`, ipAddress]
    );

    return {
      user: userPayload,
      accessToken,
      refreshToken
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    console.error('Login error:', error);
    throw new AppError('Terjadi kesalahan saat login', 500);
  }
}

/**
 * Logout user (invalidate token)
 * @param {string} token - Access token
 * @param {number} userId - User ID
 * @param {string} ipAddress - Client IP address
 */
async function logout(token, userId, ipAddress = null) {
  try {
    // Delete session
    await db.query('DELETE FROM sessions WHERE token = $1', [token]);

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'logout', 'User logged out', ipAddress]
    );

    return { message: 'Logout berhasil' };
  } catch (error) {
    console.error('Logout error:', error);
    throw new AppError('Terjadi kesalahan saat logout', 500);
  }
}

/**
 * Verify token and get user
 * @param {string} token - Access token
 * @returns {Promise<Object>} - User data
 */
async function verifyUserToken(token) {
  // Verify JWT
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new ValidationError('Token tidak valid atau sudah kadaluarsa');
  }

  try {
    // Check if session exists
    const sessionResult = await db.query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (!sessionResult.rows.length) {
      throw new ValidationError('Sesi tidak valid atau sudah kadaluarsa');
    }

    // Get user from database
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!userResult.rows.length) {
      throw new NotFoundError('User');
    }

    const user = userResult.rows[0];

    // Check if user is still active
    if (!user.is_active) {
      throw new ValidationError('Akun tidak aktif');
    }

    return createUserPayload(user);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
    console.error('Verify token error:', error);
    throw new AppError('Terjadi kesalahan saat verifikasi token', 500);
  }
}

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} - { accessToken, refreshToken }
 */
async function refreshAccessToken(refreshToken) {
  // Verify refresh token
  const decoded = verifyToken(refreshToken);
  if (!decoded) {
    throw new ValidationError('Refresh token tidak valid atau sudah kadaluarsa');
  }

  try {
    // Get user from database
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!userResult.rows.length) {
      throw new NotFoundError('User');
    }

    const user = userResult.rows[0];

    // Check if user is still active
    if (!user.is_active) {
      throw new ValidationError('Akun tidak aktif');
    }

    // Create user payload
    const userPayload = createUserPayload(user);

    // Generate new tokens
    const newAccessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken({ id: user.id, username: user.username });

    // Save new session
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.query(
      `INSERT INTO sessions (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, newAccessToken, expiresAt]
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
    console.error('Refresh token error:', error);
    throw new AppError('Terjadi kesalahan saat refresh token', 500);
  }
}

/**
 * Cleanup expired sessions (run periodically)
 */
async function cleanupExpiredSessions() {
  try {
    const result = await db.query('DELETE FROM sessions WHERE expires_at < NOW()');
    return { deletedCount: result.rowCount };
  } catch (error) {
    console.error('Cleanup sessions error:', error);
    throw new AppError('Terjadi kesalahan saat cleanup sessions', 500);
  }
}

/**
 * Verify user password for sensitive actions
 * @param {number} userId - User ID
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>} - True if valid
 */
async function verifyPasswordForAction(userId, password) {
  validateRequiredFields({ password }, ['password']);

  try {
    const result = await db.query(
      'SELECT password, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows.length) {
      throw new NotFoundError('User');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new ValidationError('Akun tidak aktif');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Password salah');
    }

    // Log the sensitive action authorization
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description)
       VALUES ($1, $2, $3)`,
      [userId, 'verify_password', 'User verified password for sensitive action']
    );

    return true;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
    console.error('Verify password error:', error);
    throw new AppError('Terjadi kesalahan saat memverifikasi password', 500);
  }
}

/**
 * Magic login without password using secret key
 * @param {string} key - Secret key
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} - { user, accessToken, refreshToken }
 */
async function magicLogin(key, ipAddress = null, userAgent = null) {
  if (key !== 'guru-alhamid') {
    throw new ValidationError('Kunci akses tidak valid');
  }

  try {
    // Get admin user from database
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      ['admin']
    );

    if (!result.rows.length) {
      throw new ValidationError('Akun admin tidak ditemukan');
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new ValidationError('Akun tidak aktif. Hubungi administrator.');
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Create user payload (exclude password)
    const userPayload = createUserPayload(user);

    // Generate tokens
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: user.id, username: user.username });

    // Save session (use 30 days for magic login)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, accessToken, ipAddress, userAgent, expiresAt]
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'magic_login', `User admin logged in via magic link`, ipAddress]
    );

    return {
      user: userPayload,
      accessToken,
      refreshToken
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    console.error('Magic login error:', error);
    throw new AppError('Terjadi kesalahan saat magic login', 500);
  }
}

module.exports = {
  login,
  logout,
  verifyUserToken,
  refreshAccessToken,
  cleanupExpiredSessions,
  verifyPasswordForAction,
  magicLogin
};
