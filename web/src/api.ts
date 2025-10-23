import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

export type Client = {
  id?: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type Item = {
  designation: string;
  quantity: number;
  unit_price: number;
};

export type InvoicePayload = {
  client: Client;
  items: Item[];
  vatEnabled: boolean;
  vatRate: number;
  discountType: 'amount' | 'percent';
  discountValue: number;
  status: 'draft' | 'saved';
  date?: string;
  number?: string;
  note?: string | null;
  expiresAt?: string | null;
};
