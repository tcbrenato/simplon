import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, InvoicePayload } from '../api';
import { useState } from 'react';

const ItemSchema = z.object({
  designation: z.string().min(1, 'Requis'),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

const FormSchema = z.object({
  client: z.object({
    name: z.string().min(1, 'Requis'),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }),
  items: z.array(ItemSchema).min(1, 'Ajouter au moins un article'),
  vatEnabled: z.boolean().default(true),
  vatRate: z.number().nonnegative().default(18),
  discountType: z.enum(['amount', 'percent']).default('amount'),
  discountValue: z.number().nonnegative().default(0),
  status: z.enum(['draft', 'saved']).default('draft'),
  note: z.string().optional(),
});

export type FormData = z.infer<typeof FormSchema>;

export default function InvoiceEditor() {
  const [result, setResult] = useState<any>(null);
  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      client: { name: '' },
      items: [{ designation: '', quantity: 1, unit_price: 0 }],
      vatEnabled: true,
      vatRate: 18,
      discountType: 'amount',
      discountValue: 0,
      status: 'draft',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items');
  const vatEnabled = watch('vatEnabled');
  const vatRate = watch('vatRate');
  const discountType = watch('discountType');
  const discountValue = watch('discountValue');

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unit_price)||0), 0);
  const discount = discountType === 'percent' ? (subtotal * (Number(discountValue)||0))/100 : (Number(discountValue)||0);
  const taxable = Math.max(subtotal - discount, 0);
  const vat = vatEnabled ? (taxable * (Number(vatRate)||0))/100 : 0;
  const total = taxable + vat;

  const onSubmit = async (data: FormData) => {
    const payload: InvoicePayload = {
      ...data,
      items: data.items.map(it => ({ designation: it.designation, quantity: Number(it.quantity), unit_price: Number(it.unit_price) })),
    } as InvoicePayload;
    const res = await api.post('/invoices', payload);
    setResult(res.data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-sm text-slate-600">Client</label>
          <Controller name="client.name" control={control} render={({ field }) => (
            <input {...field} placeholder="Nom du client" className="border rounded px-3 py-2" />
          )} />
          <div className="grid grid-cols-2 gap-2">
            <Controller name="client.phone" control={control} render={({ field }) => (
              <input {...field} placeholder="Téléphone" className="border rounded px-3 py-2" />
            )} />
            <Controller name="client.email" control={control} render={({ field }) => (
              <input {...field} placeholder="Email" className="border rounded px-3 py-2" />
            )} />
          </div>
          <Controller name="client.address" control={control} render={({ field }) => (
            <input {...field} placeholder="Adresse" className="border rounded px-3 py-2" />
          )} />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-slate-600">TVA et Réduction</label>
          <div className="flex items-center gap-2">
            <Controller name="vatEnabled" control={control} render={({ field }) => (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                <span>Activer TVA</span>
              </label>
            )} />
            <Controller name="vatRate" control={control} render={({ field }) => (
              <input type="number" {...field} step="0.1" className="border rounded px-3 py-2 w-28" />
            )} />
            <Controller name="discountType" control={control} render={({ field }) => (
              <select {...field} className="border rounded px-3 py-2">
                <option value="amount">Réduction (montant)</option>
                <option value="percent">Réduction (%)</option>
              </select>
            )} />
            <Controller name="discountValue" control={control} render={({ field }) => (
              <input type="number" {...field} step="0.1" className="border rounded px-3 py-2 w-28" />
            )} />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-600">Articles</div>
          <button type="button" onClick={() => append({ designation: '', quantity: 1, unit_price: 0 })} className="px-3 py-2 border rounded">Ajouter une ligne</button>
        </div>
        <div className="grid gap-2">
          {fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-12 gap-2 items-center">
              <Controller name={`items.${i}.designation`} control={control} render={({ field }) => (
                <input {...field} placeholder="Désignation" className="col-span-6 border rounded px-3 py-2" />
              )} />
              <Controller name={`items.${i}.quantity`} control={control} render={({ field }) => (
                <input type="number" {...field} step="0.01" className="col-span-2 border rounded px-3 py-2" />
              )} />
              <Controller name={`items.${i}.unit_price`} control={control} render={({ field }) => (
                <input type="number" {...field} step="0.01" className="col-span-2 border rounded px-3 py-2" />
              )} />
              <div className="col-span-1 text-right font-medium">
                {((Number(items[i]?.quantity)||0) * (Number(items[i]?.unit_price)||0)).toLocaleString()} FCFA
              </div>
              <button type="button" onClick={() => remove(i)} className="col-span-1 text-red-600">Supprimer</button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div />
        <div className="border rounded p-4 grid gap-2">
          <Row label="Total HT" value={`${subtotal.toLocaleString()} FCFA`} />
          <Row label={`Réduction (${discountType === 'percent' ? discountValue + '%' : discountValue + ' FCFA'})`} value={`- ${discount.toLocaleString()} FCFA`} />
          <Row label={`TVA (${vatEnabled ? vatRate + '%' : 'N/A'})`} value={`${vat.toLocaleString()} FCFA`} />
          <Row label="Total TTC" value={`${total.toLocaleString()} FCFA`} highlight />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Enregistrer</button>
        <button type="button" onClick={() => window.print()} className="px-4 py-2 border rounded">Imprimer</button>
      </div>

      {result && (
        <div className="text-sm text-green-700">Facture enregistrée. N° {result.number}</div>
      )}
    </form>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className={highlight ? 'font-semibold text-primary' : 'text-slate-600'}>{label}</div>
      <div className={highlight ? 'font-semibold text-primary' : ''}>{value}</div>
    </div>
  );
}
