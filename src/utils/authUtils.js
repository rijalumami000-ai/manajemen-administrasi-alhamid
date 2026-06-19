// authUtils.js - Authentication utilities (password hashing, JWT)

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuration
const BCRYPT_ROUNDS = 10;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// JWT Secret — WAJIB diset di .env, tidak ada fallback default demi keamanan
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ FATAL: JWT_SECRET belum diset atau terlalu pendek (minimal 32 karakter).');
  console.error('   Tambahkan JWT_SECRET di file .env');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('⚠️  Development mode: menggunakan fallback secret (JANGAN gunakan di production!)');
  }
}
// Fallback hanya untuk development, di production akan exit di atas
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-only-secret-do-not-use-in-production-' + Date.now();

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if match
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload (user data)
 * @returns {string} - JWT token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload (user data)
 * @returns {string} - JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, EFFECTIVE_JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Token or null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Create user payload for JWT (exclude sensitive data)
 * @param {Object} user - User object from database
 * @returns {Object} - Safe user payload
 */
function createUserPayload(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    guru_id: user.guru_id
  };
}

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  createUserPayload,
  JWT_SECRET: EFFECTIVE_JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
};
