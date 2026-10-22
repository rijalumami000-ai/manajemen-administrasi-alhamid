import { Request, Response } from 'express';
import profileService from '../services/profileService';
import { asyncHandler } from '../utils/errorHandler';
import { authenticateToken } from '../middleware/authMiddleware';

export function registerProfileRoutes(app: any): void {
  /**
   * GET /api/profile - Get own profile
   * Requires: Authorization header with Bearer token
   * Returns: User profile
   */
  app.get('/api/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await profileService.getProfile(userId);
    res.json(profile);
  }));

  /**
   * PUT /api/profile - Update own profile
   * Requires: Authorization header with Bearer token
   * Body: { email, full_name, phone, photo_url }
   * Returns: Updated profile
   */
  app.put('/api/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await profileService.updateProfile(userId, req.body);
    res.json(profile);
  }));

  /**
   * POST /api/profile/change-password - Change own password
   * Requires: Authorization header with Bearer token
   * Body: { currentPassword, newPassword }
   * Returns: { message }
   */
  app.post('/api/profile/change-password', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    const result = await profileService.changePassword(userId, currentPassword, newPassword);
    res.json(result);
  }));

  /**
   * GET /api/profile/activity-logs - Get own activity logs
   * Requires: Authorization header with Bearer token
   * Query params: limit (default: 50)
   * Returns: Array of activity logs
   */
  app.get('/api/profile/activity-logs', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const logs = await profileService.getActivityLogs(userId, limit);
    res.json(logs);
  }));
}

module.exports = registerProfileRoutes;
export default registerProfileRoutes;
