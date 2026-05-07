// authMiddleware.js - Authentication middleware

const { verifyToken, extractTokenFromHeader } = require('../utils/authUtils');
const { ValidationError } = require('../utils/errorHandler');

/**
 * Middleware to verify JWT token
 * Attaches user data to req.user if valid
 */
function authenticateToken(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login.' });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.' });
    }

    // Attach user data to request
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Autentikasi gagal' });
  }
}

/**
 * Middleware to check if user is authenticated (optional)
 * Does not throw error if no token, just sets req.user to null
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}

module.exports = {
  authenticateToken,
  optionalAuth
};
