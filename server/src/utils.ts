import crypto from 'crypto';
import dayjs from 'dayjs';

export function generateInvoiceNumber(now: Date = new Date()): string {
  const year = dayjs(now).format('YYYY');
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `PF-${year}-${rand}`;
}

export function generateShareToken(): string {
  return crypto.randomBytes(12).toString('hex');
}

export function computeTotals(options: {
  items: { quantity: number; unit_price: number }[];
  vatEnabled: boolean;
  vatRate: number; // percent
  discountType: 'amount' | 'percent';
  discountValue: number;
}) {
  const subtotal = options.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const discount =
    options.discountType === 'percent'
      ? (subtotal * options.discountValue) / 100
      : options.discountValue;

  const taxable = Math.max(subtotal - discount, 0);
  const vat = options.vatEnabled ? (taxable * options.vatRate) / 100 : 0;
  const total = taxable + vat;

  return { subtotal, discount, vat, total };
}
