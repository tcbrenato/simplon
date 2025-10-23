import { Router } from 'express';
import { db } from '../db';
import { z } from 'zod';

const router = Router();

const ClientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const parsed = ClientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { name, phone, email, address } = parsed.data;
  const r = db
    .prepare('INSERT INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)')
    .run(name, phone ?? null, email ?? null, address ?? null);
  res.json({ id: Number(r.lastInsertRowid) });
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const parsed = ClientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { name, phone, email, address } = parsed.data;
  db
    .prepare('UPDATE clients SET name=?, phone=?, email=?, address=? WHERE id=?')
    .run(name, phone ?? null, email ?? null, address ?? null, id);
  res.json({ id });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM clients WHERE id=?').run(id);
  res.json({ ok: true });
});

export default router;
