export interface ClientRow {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
}

export interface InvoiceRow {
  id: number;
  number: string;
  date: string;
  client_id: number;
  status: 'draft' | 'saved';
  subtotal: number;
  vat_enabled: 0 | 1;
  vat_rate: number;
  discount_type: 'amount' | 'percent';
  discount_value: number;
  total: number;
  note: string | null;
  share_token: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ItemRow {
  id: number;
  invoice_id: number;
  designation: string;
  quantity: number;
  unit_price: number;
  amount: number;
}
