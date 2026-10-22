import { Request, Response } from 'express';
import db from '../../db';
import { isUniqueViolation } from '../utils/databaseErrors';
import { normalizeText } from '../utils/normalizers';

export function registerJabatanRoutes(app: any): void {
  // ===== JABATAN API =====
  app.get('/api/jabatan', async (req: Request, res: Response) => {
    try {
      const result = await db.query('SELECT * FROM jabatan ORDER BY nama');
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data jabatan.' });
    }
  });
  
  app.post('/api/jabatan', async (req: Request, res: Response) => {
    const nama = normalizeText(req.body.nama);
  
    if (!nama) {
      return res.status(400).json({ error: 'Nama jabatan wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        'INSERT INTO jabatan (nama) VALUES ($1) RETURNING *',
        [nama]
      );
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: 'Jabatan sudah terdaftar.' });
      }
      res.status(500).json({ error: 'Gagal menyimpan data jabatan.' });
    }
  });
  
  app.put('/api/jabatan/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const nama = normalizeText(req.body.nama);
  
    if (!nama) {
      return res.status(400).json({ error: 'Nama jabatan wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        'UPDATE jabatan SET nama = $1 WHERE id = $2 RETURNING *',
        [nama, id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data jabatan tidak ditemukan.' });
      }
  
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: 'Jabatan sudah terdaftar.' });
      }
      res.status(500).json({ error: 'Gagal memperbarui data jabatan.' });
    }
  });
  
  app.delete('/api/jabatan/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM jabatan WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data jabatan tidak ditemukan.' });
      }
      res.json({ message: 'Data jabatan berhasil dihapus.' });
    } catch (error: any) {
      console.error(error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Jabatan tidak dapat dihapus karena sedang digunakan oleh data guru.' });
      }
      res.status(500).json({ error: 'Gagal menghapus data jabatan.' });
    }
  });
}

module.exports = registerJabatanRoutes;
export default registerJabatanRoutes;
