import { Router } from 'express';
import { db } from '../db';
import { computeTotals, generateInvoiceNumber, generateShareToken } from '../utils';
import { z } from 'zod';
import dayjs from 'dayjs';
import { renderInvoicePdf } from '../pdf/generate';
import { COMPANY } from '../company';
import type { InvoiceRow, ClientRow, ItemRow } from '../types';

const router = Router();

const ItemSchema = z.object({
  designation: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

const InvoiceSchema = z.object({
  client: z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
  }),
  items: z.array(ItemSchema).min(1),
  vatEnabled: z.boolean(),
  vatRate: z.number().nonnegative(),
  discountType: z.enum(['amount', 'percent']),
  discountValue: z.number().nonnegative(),
  status: z.enum(['draft', 'saved']).default('draft'),
  date: z.string().optional(),
  number: z.string().optional(),
  note: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

router.post('/', (req, res) => {
  const parsed = InvoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { client, items, vatEnabled, vatRate, discountType, discountValue, status, date, number, note, expiresAt } = parsed.data;

  let clientId = client.id;
  if (!clientId) {
    const stmt = db.prepare(
      'INSERT INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)'
    );
    const r = stmt.run(client.name, client.phone ?? null, client.email ?? null, client.address ?? null);
    clientId = Number(r.lastInsertRowid);
  }

  const totals = computeTotals({
    items,
    vatEnabled,
    vatRate,
    discountType,
    discountValue,
  });

  const invNumber = number || generateInvoiceNumber();
  const invDate = date || dayjs().format('YYYY-MM-DD');
  const shareToken = generateShareToken();

  const insertInv = db.prepare(`
    INSERT INTO invoices (number, date, client_id, status, subtotal, vat_enabled, vat_rate, discount_type, discount_value, total, note, share_token, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertInv.run(
    invNumber,
    invDate,
    clientId,
    status,
    totals.subtotal,
    vatEnabled ? 1 : 0,
    vatRate,
    discountType,
    discountValue,
    totals.total,
    note ?? null,
    shareToken,
    expiresAt ?? null
  );
  const invoiceId = Number(result.lastInsertRowid);

  const insertItem = db.prepare(
    'INSERT INTO items (invoice_id, designation, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)'
  );
  const itemTxn = db.transaction((rows: any[]) => {
    for (const row of rows) {
      insertItem.run(invoiceId, row.designation, row.quantity, row.unit_price, row.quantity * row.unit_price);
    }
  });
  itemTxn(items);

  res.json({ id: invoiceId, number: invNumber, shareToken, totals });
});

router.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT invoices.*, clients.name as client_name FROM invoices
    LEFT JOIN clients ON clients.id = invoices.client_id
    ORDER BY invoices.created_at DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as InvoiceRow | undefined;
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(invoice.client_id) as ClientRow;
  const items = db.prepare('SELECT * FROM items WHERE invoice_id = ?').all(id) as ItemRow[];
  res.json({ invoice, client, items });
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const parsed = InvoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { client, items, vatEnabled, vatRate, discountType, discountValue, status, note, expiresAt } = parsed.data;

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as InvoiceRow | undefined;
  if (!invoice) return res.status(404).json({ error: 'Not found' });

  let clientId = client.id ?? invoice.client_id;
  if (!client.id) {
    const stmt = db.prepare('INSERT INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)');
    const r = stmt.run(client.name, client.phone ?? null, client.email ?? null, client.address ?? null);
    clientId = Number(r.lastInsertRowid);
  }

  const totals = computeTotals({ items, vatEnabled, vatRate, discountType, discountValue });

  db.prepare(`
    UPDATE invoices SET client_id=?, status=?, subtotal=?, vat_enabled=?, vat_rate=?, discount_type=?, discount_value=?, total=?, note=?, updated_at=datetime('now'), expires_at=?
    WHERE id=?
  `).run(clientId, status, totals.subtotal, vatEnabled ? 1 : 0, vatRate, discountType, discountValue, totals.total, note ?? null, expiresAt ?? null, id);

  db.prepare('DELETE FROM items WHERE invoice_id = ?').run(id);
  const insertItem = db.prepare('INSERT INTO items (invoice_id, designation, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)');
  const itemTxn = db.transaction((rows: any[]) => {
    for (const row of rows) {
      insertItem.run(id, row.designation, row.quantity, row.unit_price, row.quantity * row.unit_price);
    }
  });
  itemTxn(items);

  res.json({ id, totals });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM items WHERE invoice_id = ?').run(id);
  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  res.json({ ok: true });
});

router.post('/:id/duplicate', (req, res) => {
  const id = Number(req.params.id);
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as InvoiceRow | undefined;
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare('SELECT * FROM items WHERE invoice_id = ?').all(id);

  const number = generateInvoiceNumber();
  const shareToken = generateShareToken();

  const r = db.prepare(`
    INSERT INTO invoices (number, date, client_id, status, subtotal, vat_enabled, vat_rate, discount_type, discount_value, total, note, share_token, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    number,
    invoice.date,
    invoice.client_id,
    invoice.status,
    invoice.subtotal,
    invoice.vat_enabled,
    invoice.vat_rate,
    invoice.discount_type,
    invoice.discount_value,
    invoice.total,
    invoice.note,
    shareToken,
    invoice.expires_at
  );
  const newId = Number(r.lastInsertRowid);

  const insertItem = db.prepare('INSERT INTO items (invoice_id, designation, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)');
  const itemTxn = db.transaction((rows: any[]) => {
    for (const row of rows) {
      insertItem.run(newId, row.designation, row.quantity, row.unit_price, row.amount);
    }
  });
  itemTxn(items);

  res.json({ id: newId, number, shareToken });
});

router.get('/:id/pdf', async (req, res) => {
  const id = Number(req.params.id);
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as InvoiceRow | undefined;
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(invoice.client_id) as ClientRow;
  const items = db.prepare('SELECT * FROM items WHERE invoice_id = ?').all(id) as ItemRow[];

  const totals = computeTotals({
    items: items.map((it: any) => ({ quantity: it.quantity, unit_price: it.unit_price })),
    vatEnabled: Boolean(invoice.vat_enabled),
    vatRate: invoice.vat_rate,
    discountType: invoice.discount_type,
    discountValue: invoice.discount_value,
  });

  const data = {
    brand: COMPANY.brand,
    company: COMPANY,
    invoice,
    client,
    items,
    subtotal: totals.subtotal,
    discountType: invoice.discount_type,
    discountValue: invoice.discount_value,
    vatEnabled: Boolean(invoice.vat_enabled),
    vatRate: invoice.vat_rate,
    discount: totals.discount,
    vat: totals.vat,
    total: totals.total,
    paymentMode: req.query.paymentMode as string | undefined,
    conditions: req.query.conditions as string | undefined,
    whatsAppLink: `https://wa.me/+22996346435`,
  };

  const pdf = await renderInvoicePdf(data);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.number}.pdf"`);
  res.send(pdf);
});

router.get('/share/:token', (req, res) => {
  const token = req.params.token;
  const invoice = db.prepare('SELECT * FROM invoices WHERE share_token = ?').get(token) as InvoiceRow | undefined;
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  res.json({ id: invoice.id, number: invoice.number });
});

export default router;
