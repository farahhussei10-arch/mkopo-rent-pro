'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../components/LanguageProvider';

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

  const amount = watch('amount');
  const paid_amount = watch('paid_amount');
  const remaining = (amount || 0) - (paid_amount || 0);

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
          amount: parseFloat(data.amount as any),
          paid_amount: parseFloat(data.paid_amount as any),
          due_day: parseInt(data.due_day as any),
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

          {/* Total Amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              {t('amount')} <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 15000"
              {...register('amount', { required: 'Amount is required', min: 1 })}
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
