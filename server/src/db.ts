import Database from 'better-sqlite3';

export const db = new Database('data.sqlite');

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  client_id INTEGER,
  status TEXT DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0,
  vat_enabled INTEGER NOT NULL DEFAULT 1,
  vat_rate REAL NOT NULL DEFAULT 18,
  discount_type TEXT DEFAULT 'amount',
  discount_value REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  note TEXT,
  share_token TEXT UNIQUE,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY(client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  designation TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
`);
