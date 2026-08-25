'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../components/LanguageProvider';
import type { PurchaseItem } from '../../types';

interface FormData {
  name: string;
  phone: string;
  property: string;
  amount: number;
  paid_amount: number;
  due_day: number;
}

export default function AddClientPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      paid_amount: 0,
      due_day: 1,
    },
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const amount = watch('amount');
  const paid_amount = watch('paid_amount');
  const remaining = (amount || 0) - (paid_amount || 0);
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const updateItem = (index: number, field: keyof PurchaseItem, value: string) => {
    setItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, [field]: field === 'name' ? value : Number(value.replace(/[^0-9.]/g, '')) || 0 };
      return { ...next, total: next.quantity * next.unit_price };
    }));
  };

  const addItem = () => setItems((current) => [...current, { name: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (index: number) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setErrorMsg('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase.from('clients').insert([
        {
          user_id: user.id,
          name: data.name,
          phone: data.phone || null,
          property: data.property || null,
          amount: grandTotal > 0 ? grandTotal : parseFloat(data.amount as any),
          paid_amount: parseFloat(data.paid_amount as any),
          due_day: parseInt(data.due_day as any),
          items: items.filter((item) => item.name.trim() && item.quantity > 0 && item.unit_price > 0),
          status: 'active',
        },
      ]);

      if (error) throw error;

      setSuccessMsg('Client added successfully! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to add client. Try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-green-100 bg-green-50 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-green-700 hover:underline"
          >
            {t('back')}
          </button>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-green-700">{t('addTenantHeadline')}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{t('addTenantHint')}</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., John Kimani"
              {...register('name', { required: 'Name is required' })}
              className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">{t('phone')}</label>
            <input
              type="tel"
              placeholder="e.g., +254712345678"
              {...register('phone')}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Property/Item */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">{t('property')}</label>
            <input
              type="text"
              placeholder="e.g., 2-Bedroom Apartment, Sofa Set"
              {...register('property')}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Itemized purchase list */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">Itemized purchase list</h2>
                <p className="mt-1 text-xs text-slate-600">Add items to calculate the client total automatically.</p>
              </div>
              <button type="button" onClick={addItem} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">+ Add item</button>
            </div>
            {items.length > 0 && (
              <div className="mt-4 space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-[1.5fr_0.7fr_1fr_auto] sm:items-end">
                    <label className="text-xs font-semibold text-slate-600">Item name<input value={item.name} onChange={(event) => updateItem(index, 'name', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" placeholder="e.g. Cement" /></label>
                    <label className="text-xs font-semibold text-slate-600">Quantity<input value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" inputMode="numeric" /></label>
                    <label className="text-xs font-semibold text-slate-600">Unit price<input value={item.unit_price} onChange={(event) => updateItem(index, 'unit_price', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" inputMode="decimal" /></label>
                    <div className="flex items-center justify-between gap-3 sm:block"><p className="text-sm font-semibold text-emerald-700">KES {item.total.toLocaleString()}</p><button type="button" onClick={() => removeItem(index)} className="text-xs font-semibold text-red-600 hover:underline">Remove</button></div>
                  </div>
                ))}
                <p className="text-right text-sm font-bold text-slate-900">Grand total: KES {grandTotal.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              {t('amount')} <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 15000"
              disabled={grandTotal > 0}
              {...register('amount', { required: grandTotal > 0 ? false : 'Amount is required', min: grandTotal > 0 ? undefined : 1 })}
              className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.amount ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">{t('amountPaid')}</label>
            <input
              type="number"
              placeholder="0"
              {...register('paid_amount', { min: 0 })}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-slate-600">
              Remaining: KES {remaining.toLocaleString()}
            </p>
          </div>

          {/* Due Day */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              {t('dueDay')} <span className="text-red-600">*</span>
            </label>
            <select
              {...register('due_day', { required: 'Due day is required' })}
              className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.due_day ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
              }`}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:bg-green-400"
          >
            {loading ? t('saving') : t('saveClient')}
          </button>
        </form>
      </div>
    </main>
  );
}
