'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import type { Client, Payment } from '../../../types';
import TopBar from '../../../components/TopBar';
import Sidebar from '../../../components/Sidebar';
import PaymentMethodModal, { type PaymentMethod } from '../../../components/PaymentMethodModal';

export default function ClientProfilePage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');
      const [{ data: clientData }, { data: paymentData }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', params.clientId).eq('user_id', user.id).single(),
        supabase.from('payments').select('*').eq('client_id', params.clientId).eq('user_id', user.id).order('paid_at', { ascending: false }),
      ]);
      if (!clientData) return toast.error('Client not found.');
      const parsedClient = {
        ...clientData,
        items: clientData.items && typeof clientData.items === 'string' ? JSON.parse(clientData.items) : clientData.items,
      };
      setClient(parsedClient as Client);
      setPayments((paymentData || []) as Payment[]);
    };
    void load();
  }, [params.clientId, router]);

  const markAsPaid = async (method: PaymentMethod) => {
    if (!client) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: paymentError } = await supabase.from('payments').insert({ client_id: client.id, user_id: user.id, amount: Math.max(0, client.amount - client.paid_amount), payment_method: method });
    if (paymentError) return toast.error(paymentError.message);
    const { error } = await supabase.from('clients').update({ paid_amount: client.amount, status: 'paid', payment_method: method, archived: true }).eq('id', client.id).eq('user_id', user.id);
    if (error) return toast.error(error.message);
    setClient({ ...client, paid_amount: client.amount, status: 'paid', payment_method: method, archived: true });
    setShowPaymentMethods(false);
    toast.success('Payment recorded.');
  };

  const sendReminder = () => {
    if (!client?.phone) return toast.error('Please add a phone number for this client.');
    const digits = client.phone.replace(/\D/g, '');
    const normalized = digits.length === 9 && digits.startsWith('7') ? `254${digits}` : digits.length === 10 && digits.startsWith('07') ? `254${digits.slice(1)}` : digits;
    const message = `Dear ${client.name}, your payment of KES ${client.amount.toLocaleString()} for ${client.property || 'your rental'} is due on day ${client.due_day || 1}.\n\nPay securely here: https://mkopo-rent-pro.vercel.app/pay/${client.id}`;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  if (!client) return <main className="space-y-6"><TopBar onMenuClick={() => setSidebarOpen(true)} /><div className="h-64 animate-pulse rounded-3xl bg-slate-200" /></main>;

  return <main className="space-y-6 pb-8"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><TopBar onMenuClick={() => setSidebarOpen(true)} /><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Client profile</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">{client.name}</h1></div><Link href="/dashboard" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Back to dashboard</Link></div><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Phone', client.phone || '—'], ['Property', client.property || '—'], ['Amount', `KES ${client.amount.toLocaleString()}`], ['Due day', String(client.due_day || '—')]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-900">{value}</p></div>)}</section><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Payment history</h2><p className="mt-1 text-sm text-slate-500">Status: <span className="font-semibold text-emerald-700">{client.status}</span>{client.payment_method ? ` · ${client.payment_method}` : ''}</p></div><div className="flex gap-2"><button type="button" onClick={() => setShowPaymentMethods(true)} disabled={client.status === 'paid'} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Mark as Paid</button><button type="button" onClick={sendReminder} className="rounded-xl border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-700">Send Reminder</button></div></div><div className="mt-5 divide-y divide-slate-100">{payments.length ? payments.map((payment) => <div key={payment.id} className="flex justify-between py-3 text-sm"><span>{new Date(payment.paid_at).toLocaleString()} · {payment.payment_method}</span><strong>KES {payment.amount.toLocaleString()}</strong></div>) : <p className="py-4 text-sm text-slate-500">No payments recorded yet.</p>}</div></section>{showPaymentMethods && <PaymentMethodModal onSelect={markAsPaid} onClose={() => setShowPaymentMethods(false)} />}</main>;
}
