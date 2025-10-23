import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import invoicesRouter from './routes/invoices';
import clientsRouter from './routes/clients';
import { COMPANY } from './company';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/company', (_req, res) => res.json(COMPANY));
app.use('/api/invoices', invoicesRouter);
app.use('/api/clients', clientsRouter);

// Static serve uploaded logo if used later
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`API listening on port ${PORT}`);
});
