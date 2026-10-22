// roleMiddleware.ts - Role-based authorization middleware
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from './authMiddleware';

/**
 * Middleware to require authentication
 * Alias for authenticateToken for clarity
 */
export const requireAuth = authenticateToken;

/**
 * Middleware to require specific role(s)
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
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
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware to require admin or guru role
 */
export const requireAdminOrGuru = requireRole(['admin', 'madrasah_diniyah']);

/**
 * Middleware to require any authenticated user
 */
export const requireAnyRole = requireRole(['admin', 'madrasah_diniyah', 'bendahara']);

/**
 * Middleware to check if user owns the resource or is admin
 */
export function requireOwnerOrAdmin(userIdParam = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login.' });
    }

    const paramVal = req.params[userIdParam];
    const resourceUserId = parseInt(Array.isArray(paramVal) ? paramVal[0] : (paramVal || ''), 10);
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

const mod = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireAdminOrGuru,
  requireAnyRole,
  requireOwnerOrAdmin
};

module.exports = mod;
export default mod;
