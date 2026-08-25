'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

type PublicClient = {
  id: string;
  user_id: string;
  name: string;
  property?: string | null;
  amount: number;
  paid_amount: number;
  due_day?: number | null;
};

type PublicProfile = {
  business_name?: string | null;
  mpesa_paybill?: string | null;
  paybill?: string | null;
  mpesa_account_number?: string | null;
  account_number?: string | null;
  bank_details?: string | null;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? 'Copied' : `📋 ${label}`}
    </button>
  );
}

export default function PublicPaymentPage() {
  const params = useParams<{ clientId: string }>();
  const [client, setClient] = useState<PublicClient | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPaymentPage = async () => {
      if (!params.clientId) return;

      try {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, user_id, name, property, amount, paid_amount, due_day')
          .eq('id', params.clientId)
          .maybeSingle();

        if (clientError) throw clientError;
        if (!clientData) {
          setError('This payment page could not be found.');
          return;
        }

        setClient(clientData as PublicClient);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('business_name, mpesa_paybill, paybill, mpesa_account_number, account_number, bank_details')
          .eq('id', clientData.user_id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        setProfile((profileData || null) as PublicProfile | null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load payment details.');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentPage();
  }, [params.clientId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4">
        <div className="w-full max-w-md animate-pulse space-y-4 rounded-3xl bg-white p-6 shadow-xl">
          <div className="h-8 rounded bg-slate-200" />
          <div className="h-28 rounded-2xl bg-slate-200" />
          <div className="h-40 rounded-2xl bg-slate-200" />
        </div>
      </main>
    );
  }

  if (error || !client) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">!</div>
          <h1 className="mt-4 text-xl font-semibold text-slate-950">Payment page unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">{error || 'We could not find this client.'}</p>
        </section>
      </main>
    );
  }

  const paybill = profile?.mpesa_paybill || profile?.paybill || '';
  const accountNumber = profile?.mpesa_account_number || profile?.account_number || '';
  const balance = Math.max(0, client.amount - client.paid_amount);
  const dueDate = client.due_day
    ? format(new Date(new Date().getFullYear(), new Date().getMonth(), client.due_day), 'EEE, d MMM yyyy')
    : 'Please confirm with the business';

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-lg space-y-5">
        <header className="rounded-3xl bg-emerald-700 p-6 text-white shadow-xl shadow-emerald-900/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Secure payment details</p>
          <h1 className="mt-3 text-3xl font-semibold">{profile?.business_name || 'Mkopo Tracker Business'}</h1>
          <p className="mt-2 text-sm text-emerald-100">Payment information for {client.name}</p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Amount due</p>
              <p className="mt-1 text-3xl font-bold text-slate-950">KES {balance.toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Pending</span>
          </div>
          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Client</dt><dd className="mt-1 font-semibold text-slate-900">{client.name}</dd></div>
            <div><dt className="text-slate-500">Property / item</dt><dd className="mt-1 font-semibold text-slate-900">{client.property || 'Not specified'}</dd></div>
            <div><dt className="text-slate-500">Total bill</dt><dd className="mt-1 font-semibold text-slate-900">KES {client.amount.toLocaleString()}</dd></div>
            <div><dt className="text-slate-500">Due date</dt><dd className="mt-1 font-semibold text-slate-900">{dueDate}</dd></div>
          </dl>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">Payment instructions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Pay the amount due using the details below, then keep your confirmation message for your records.</p>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">M-Pesa Paybill</p><p className="mt-1 font-semibold text-slate-950">{paybill || 'Not provided'}</p></div>
              <CopyButton value={paybill} label="Copy Paybill" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Account Number</p><p className="mt-1 font-semibold text-slate-950">{accountNumber || 'Not provided'}</p></div>
              <CopyButton value={accountNumber} label="Copy Account Number" />
            </div>
            <div className="rounded-2xl bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bank details</p><p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-900">{profile?.bank_details || 'Not provided'}</p></div>
          </div>
        </section>

        <p className="text-center text-xs text-slate-400">Powered by Mkopo Tracker</p>
      </div>
    </main>
  );
}
