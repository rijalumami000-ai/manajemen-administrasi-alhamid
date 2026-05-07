// authRoutes.js - Authentication API routes

const authService = require('../services/authService');
const { asyncHandler } = require('../utils/errorHandler');
const { authenticateToken } = require('../middleware/authMiddleware');

function registerAuthRoutes(app) {
  /**
   * POST /api/auth/login - Login with username and password
   * Body: { username, password }
   * Returns: { user, accessToken, refreshToken }
   */
  app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(username, password, ipAddress, userAgent);

    res.json(result);
  }));

  /**
   * POST /api/auth/logout - Logout (invalidate token)
   * Requires: Authorization header with Bearer token
   * Returns: { message }
   */
  app.post('/api/auth/logout', authenticateToken, asyncHandler(async (req, res) => {
    const token = req.token;
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await authService.logout(token, userId, ipAddress);

    res.json(result);
  }));

  /**
   * GET /api/auth/me - Get current user info
   * Requires: Authorization header with Bearer token
   * Returns: { user }
   */
  app.get('/api/auth/me', authenticateToken, asyncHandler(async (req, res) => {
    const token = req.token;
    const user = await authService.verifyUserToken(token);

    res.json({ user });
  }));

  /**
   * POST /api/auth/refresh - Refresh access token
   * Body: { refreshToken }
   * Returns: { accessToken, refreshToken }
   */
  app.post('/api/auth/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token diperlukan' });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json(result);
  }));

  /**
   * POST /api/auth/cleanup-sessions - Cleanup expired sessions (Admin only)
   * Requires: Authorization header with Bearer token + Admin role
   * Returns: { deletedCount }
   */
  app.post('/api/auth/cleanup-sessions', authenticateToken, asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang dapat melakukan cleanup.' });
    }

    const result = await authService.cleanupExpiredSessions();

    res.json(result);
  }));
  /**
   * POST /api/auth/verify-password - Verify password for sensitive actions
   * Requires: Authorization header with Bearer token
   * Body: { password }
   * Returns: { success: true }
   */
  app.post('/api/auth/verify-password', authenticateToken, asyncHandler(async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;
    
    if (!password) {
      return res.status(400).json({ error: 'Password harus diisi' });
    }

    await authService.verifyPasswordForAction(userId, password);
    
    res.json({ success: true });
  }));
}

module.exports = registerAuthRoutes;
