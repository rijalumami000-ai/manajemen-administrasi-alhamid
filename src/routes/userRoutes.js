// userRoutes.js - User management API routes (Admin only)

const userService = require('../services/userService');
const { asyncHandler } = require('../utils/errorHandler');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

function registerUserRoutes(app) {
  /**
   * GET /api/users - Get all users (Admin only)
   * Query params: role, is_active
   * Returns: Array of users
   */
  app.get('/api/users', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
    const { role, is_active } = req.query;
    const filters = {};

    if (role) filters.role = role;
    if (is_active !== undefined) filters.is_active = is_active === 'true';

    const users = await userService.getAllUsers(filters);
    res.json(users);
  }));

  /**
   * GET /api/users/:id - Get user by ID (Admin only)
   * Returns: User object
   */
  app.get('/api/users/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    res.json(user);
  }));

  /**
   * POST /api/users - Create new user (Admin only)
   * Body: { username, password, email, full_name, role, phone, photo_url, is_active }
   * Returns: Created user
   */
  app.post('/api/users', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  }));

  /**
   * PUT /api/users/:id - Update user (Admin only)
   * Body: { username, email, full_name, role, phone, photo_url, is_active, password }
   * Returns: Updated user
   */
  app.put('/api/users/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    res.json(user);
  }));

  /**
   * DELETE /api/users/:id - Soft delete user (Admin only)
   * Returns: { message, user }
   */
  app.delete('/api/users/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await userService.deleteUser(id);
    res.json(result);
  }));

  /**
   * DELETE /api/users/:id/hard - Hard delete user (Admin only)
   * Returns: { message, user }
   */
  app.delete('/api/users/:id/hard', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await userService.hardDeleteUser(id);
    res.json(result);
  }));

  /**
   * POST /api/users/:id/activate - Activate user (Admin only)
   * Returns: Activated user
   */
  app.post('/api/users/:id/activate', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.activateUser(id);
    res.json(user);
  }));
}

module.exports = registerUserRoutes;
