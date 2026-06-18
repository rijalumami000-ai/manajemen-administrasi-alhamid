// roleMiddleware.js - Role-based authorization middleware

const { authenticateToken } = require('./authMiddleware');

/**
 * Middleware to require authentication
 * Alias for authenticateToken for clarity
 */
const requireAuth = authenticateToken;

/**
 * Middleware to require specific role(s)
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} - Express middleware
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login.' });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses resource ini.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to require admin role
 */
const requireAdmin = requireRole(['admin']);

/**
 * Middleware to require admin or guru role
 */
const requireAdminOrGuru = requireRole(['admin', 'madrasah_diniyah']);

/**
 * Middleware to require any authenticated user
 */
const requireAnyRole = requireRole(['admin', 'madrasah_diniyah', 'bendahara']);

/**
 * Middleware to check if user owns the resource or is admin
 * @param {string} userIdParam - Name of the parameter containing user ID
 * @returns {Function} - Express middleware
 */
function requireOwnerOrAdmin(userIdParam = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login.' });
    }

    const resourceUserId = parseInt(req.params[userIdParam], 10);
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (currentUserId !== resourceUserId && !isAdmin) {
      return res.status(403).json({
        error: 'Akses ditolak. Anda hanya dapat mengakses data Anda sendiri.'
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireAdminOrGuru,
  requireAnyRole,
  requireOwnerOrAdmin
};
