/**
 * auditRoutes.ts — Log audit keuangan (admin only)
 */

import { Application, Request, Response } from 'express';
import { pool } from '../db';
import { validatePositiveInt, ValidationError } from '../utils/validators';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticateToken } = require('../../../src/middleware/authMiddleware');
import { requireAdminKeuangan } from '../middleware/roleGuard';

export function registerAuditRoutes(app: Application): void {

  // GET /api/keuangan/audit-log
  app.get('/api/keuangan/audit-log', authenticateToken, requireAdminKeuangan,
    async (req: Request, res: Response) => {
      try {
        const { entity_type, action, user_id, page = 1, limit = 50 } = req.query;
        const conditions: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        if (entity_type) { conditions.push(`ak.entity_type=$${idx++}`); params.push(entity_type); }
        if (action) { conditions.push(`ak.action=$${idx++}`); params.push(action); }
        if (user_id) {
          conditions.push(`ak.user_id=$${idx++}`);
          params.push(validatePositiveInt(user_id, 'user_id'));
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const offset = (Number(page) - 1) * Number(limit);

        const count = await pool.query(`SELECT COUNT(*) AS total FROM audit_keuangan ak ${where}`, params);

        const result = await pool.query(
          `SELECT ak.*, u.full_name AS nama_user, u.username
           FROM audit_keuangan ak
           LEFT JOIN users u ON u.id = ak.user_id
           ${where}
           ORDER BY ak.created_at DESC
           LIMIT $${idx} OFFSET $${idx + 1}`,
          [...params, Number(limit), offset]
        );

        res.json({
          data: result.rows,
          pagination: {
            total: Number(count.rows[0].total),
            page: Number(page),
            limit: Number(limit),
            total_pages: Math.ceil(Number(count.rows[0].total) / Number(limit)),
          },
        });
      } catch (err) {
        if (err instanceof ValidationError) {
          res.status(400).json({ error: err.message });
          return;
        }
        res.status(500).json({ error: 'Gagal memuat audit log.' });
      }
    }
  );
}
