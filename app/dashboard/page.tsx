'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, getDate } from 'date-fns';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import type { Client, ReminderMessage } from '../types';
import { useLanguage } from '../components/LanguageProvider';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import QuickAddModal from '../components/QuickAddModal';
import PaymentMethodModal, { type PaymentMethod } from '../components/PaymentMethodModal';
import DailySummaryPopup from '../components/DailySummaryPopup';

const PAGE_SIZE = 20;
type EditableField = 'name' | 'phone' | 'amount';
type LastAction =
  | { type: 'edit'; previous: Client[]; clientId: string; field: EditableField; value: string | number }
  | { type: 'add'; previous: Client[]; clientId: string };

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 rounded-[32px] bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="h-72 rounded-2xl bg-slate-200" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<{ id: string; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [reminderMessages, setReminderMessages] = useState<ReminderMessage[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<ReminderMessage | null>(null);
  const [showReminders, setShowReminders] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [defaultDueDay, setDefaultDueDay] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [paymentClient, setPaymentClient] = useState<Client | null>(null);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [reminderTemplate, setReminderTemplate] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedDueDay = Number(window.localStorage.getItem('mkopo-last-due-day'));
    if (storedDueDay >= 1 && storedDueDay <= 31) setDefaultDueDay(storedDueDay);
    fetchClients();
  }, []);

  useEffect(() => setPage(1), [search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);
      const [{ data, error }, { data: profile }] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('reminder_template').eq('id', user.id).maybeSingle(),
      ]);
      if (error) throw error;
      const parsedClients = (data || []).map((client: any) => ({
        ...client,
        items: client.items && typeof client.items === 'string' ? JSON.parse(client.items) : client.items,
      }));
      setClients(parsedClients as Client[]);
      setReminderTemplate(profile?.reminder_template || '');
      const today = new Date().toISOString().slice(0, 10);
      if (window.localStorage.getItem('mkopo-summary-hidden') !== today) setShowDailySummary(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load clients.');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visible = clients.filter((client) => showArchived ? client.archived : !client.archived);
    if (!query) return visible;
    return visible.filter((client) => [client.name, client.property, client.phone].some((value) => value?.toLowerCase().includes(query)));
  }, [clients, search, showArchived]);

  const pageCount = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const visibleClients = filteredClients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const stats = [
    { title: t('totalTenants'), value: clients.length.toString(), description: t('activeClients') },
    { title: t('totalDebt'), value: `KES ${clients.reduce((sum, client) => sum + Math.max(0, client.amount - client.paid_amount), 0).toLocaleString()}`, description: t('outstandingBalances') },
    { title: t('overduePayments'), value: clients.filter((client) => client.status === 'overdue').length.toString(), description: t('needFollowUp') },
    { title: t('collectedThisMonth'), value: `KES ${clients.reduce((sum, client) => sum + client.paid_amount, 0).toLocaleString()}`, description: t('paidSoFar') },
  ];

  const getOrdinalSuffix = (day: number) => day > 3 && day < 21 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th');
  const formatTemplate = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
  const formatItems = (items?: Client['items']) => items?.length ? items.map((item) => `${item.name} x${item.quantity} @ KES ${item.unit_price.toLocaleString()} = KES ${item.total.toLocaleString()}`).join('; ') : '';

  const generateReminders = () => {
    const dueDateValue = addDays(new Date(), 3);
    const dueDate = getDate(dueDateValue);
    const template = reminderTemplate || t('reminderMessageTemplate');
    const messages = clients.filter((client) => client.due_day === dueDate && client.status === 'active').map((client) => ({
      clientId: client.id,
      clientName: client.name,
      phone: client.phone || '',
      message: `${formatTemplate(template, {
        name: client.name,
        amount: client.amount.toLocaleString(),
        property: client.property || t('yourRental'),
        due_day: client.due_day || 1,
        dueDay: client.due_day || 1,
        ordinal: getOrdinalSuffix(client.due_day || 1),
      })}${formatItems(client.items) ? `\n\nItems: ${formatItems(client.items)}` : ''}\n\nDue date: ${dueDateValue.toLocaleDateString()}\n\nPay securely here: https://mkopo-rent-pro.vercel.app/pay/${client.id}`,
    }));
    setReminderMessages(messages);
    setShowReminders(true);
  };

  const normalizePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 9 && digits.startsWith('7')) return `254${digits}`;
    if (digits.length === 10 && digits.startsWith('07')) return `254${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith('254')) return digits;
    return '';
  };

  const sendWhatsApp = (phone: string | undefined, message: string) => {
    const normalized = phone ? normalizePhone(phone) : '';
    if (!normalized) return toast.error(t('invalidPhoneAlert'));
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const openReminderOptions = (client: Client) => {
    const dueDateValue = addDays(new Date(), 3);
    const dueDay = client.due_day || 1;
    const template = reminderTemplate || t('reminderMessageTemplate');
    const message = `${formatTemplate(template, {
      name: client.name,
      amount: client.amount.toLocaleString(),
      property: client.property || t('yourRental'),
      due_day: dueDay,
      dueDay,
      ordinal: getOrdinalSuffix(dueDay),
    })}${formatItems(client.items) ? `\n\nItems: ${formatItems(client.items)}` : ''}\n\nDue date: ${dueDateValue.toLocaleDateString()}\n\nPay securely here: https://mkopo-rent-pro.vercel.app/pay/${client.id}`;
    setSelectedReminder({ clientId: client.id, clientName: client.name, phone: client.phone || '', message });
  };

  const markAsPaid = async (method: PaymentMethod) => {
    if (!paymentClient) return;
    const outstanding = Math.max(0, paymentClient.amount - paymentClient.paid_amount);
    const { error: paymentError } = await supabase.from('payments').insert({ client_id: paymentClient.id, user_id: userId, amount: outstanding, payment_method: method });
    if (paymentError) return toast.error(paymentError.message);
    const { error } = await supabase.from('clients').update({ paid_amount: paymentClient.amount, status: 'paid', payment_method: method, archived: true }).eq('id', paymentClient.id).eq('user_id', userId);
    if (error) return toast.error(error.message);
    setClients((current) => current.map((client) => client.id === paymentClient.id ? { ...client, paid_amount: client.amount, status: 'paid', payment_method: method, archived: true } : client));
    setPaymentClient(null);
    toast.success('Payment recorded and client archived.');
  };

  const restoreClient = async (client: Client) => {
    const { error } = await supabase.from('clients').update({ archived: false, status: 'active' }).eq('id', client.id).eq('user_id', userId);
    if (error) return toast.error(error.message);
    setClients((current) => current.map((item) => item.id === client.id ? { ...item, archived: false, status: 'active' } : item));
  };

  const chooseReminderOption = (type: 'call' | 'sms' | 'whatsapp') => {
    if (!selectedReminder) return;
    const normalized = normalizePhone(selectedReminder.phone || '');
    if (!normalized) {
      toast.error(t('invalidPhoneAlert'));
      return;
    }
    if (type === 'call') window.location.href = `tel:+${normalized}`;
    if (type === 'sms') window.location.href = `sms:+${normalized}?body=${encodeURIComponent(selectedReminder.message)}`;
    if (type === 'whatsapp') window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(selectedReminder.message)}`, '_blank', 'noopener,noreferrer');
    setSelectedReminder(null);
  };

  const saveInlineEdit = async (client: Client, field: EditableField) => {
    const nextValue = editValue.trim();
    const parsedAmount = Number(nextValue);
    if (field === 'name' && !nextValue) return toast.error('Name cannot be empty.');
    if (field === 'amount' && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) return toast.error('Enter a valid amount.');
    const previous = clients;
    const updatedClient = { ...client, [field]: field === 'amount' ? parsedAmount : nextValue } as Client;
    setClients((current) => current.map((item) => item.id === client.id ? updatedClient : item));
    setEditing(null);
    try {
      const { error } = await supabase.from('clients').update({ [field]: field === 'amount' ? parsedAmount : nextValue }).eq('id', client.id).eq('user_id', userId);
      if (error) throw error;
      setLastAction({ type: 'edit', previous, clientId: client.id, field, value: client[field] || '' });
      toast.success('Client updated.');
    } catch (error) {
      setClients(previous);
      toast.error(error instanceof Error ? error.message : 'Update failed.');
    }
  };

  const undoLastAction = async () => {
    if (!lastAction) return;
    try {
      if (lastAction.type === 'edit') {
        const { error } = await supabase.from('clients').update({ [lastAction.field]: lastAction.value }).eq('id', lastAction.clientId).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').delete().eq('id', lastAction.clientId).eq('user_id', userId);
        if (error) throw error;
      }
      setClients(lastAction.previous);
      setLastAction(null);
      toast.success('Last change undone.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to undo the last change.');
    }
  };

  const handleAdded = (client: Client) => {
    setLastAction({ type: 'add', previous: clients, clientId: client.id });
    setClients((current) => [client, ...current]);
    toast.success('Client added successfully.');
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(reminderMessages.map((message) => message.message).join('\n\n'));
    setCopySuccess(true);
    toast.success('Reminders copied.');
    window.setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <main className="space-y-6 pb-24">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{t('businessOverview')}</p><h2 className="mt-2 text-3xl font-semibold text-slate-950">{t('dashboardHeadline')}</h2><p className="mt-2 max-w-xl text-sm text-slate-600">{t('dashboardHint')}</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => router.push('/dashboard/reports')} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reports</button><button type="button" onClick={() => router.push('/dashboard/settings')} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Settings</button><button type="button" onClick={() => setShowArchived((value) => !value)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">{showArchived ? 'Show Active Clients' : 'Show Archived Clients'}</button><button type="button" onClick={undoLastAction} disabled={!lastAction} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Undo</button><button type="button" onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }} className="rounded-xl border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-white">{t('logout')}</button></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{item.title}</p><p className="mt-3 text-2xl font-semibold text-slate-950">{item.value}</p><p className="mt-2 text-sm text-slate-500">{item.description}</p></div>)}</section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h3 className="text-lg font-semibold text-slate-950">Clients</h3><p className="text-sm text-slate-500">Double-click a name, phone, or amount to edit.</p></div><div className="flex w-full gap-2 sm:w-auto"><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 sm:w-72" placeholder="Search name, shop, phone, location" aria-label="Search clients" /><button type="button" onClick={generateReminders} className="hidden rounded-xl border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 sm:block">{t('sendReminders')}</button></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse"><thead><tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-5 py-3">{t('name')}</th><th className="px-5 py-3">{t('phone')}</th><th className="px-5 py-3">{t('property')}</th><th className="px-5 py-3 text-right">{t('amount')}</th><th className="px-5 py-3 text-center">{t('dueDay')}</th><th className="px-5 py-3 text-center">{t('status')}</th><th className="px-5 py-3 text-center">{t('actions')}</th></tr></thead><tbody>
          {visibleClients.map((client) => <tr key={client.id} className={`border-t border-slate-100 text-sm hover:bg-emerald-50/30 ${client.archived ? 'bg-slate-100 text-slate-400' : ''}`}>
            {(['name', 'phone', 'amount'] as EditableField[]).map((field) => <td key={field} className={`px-5 py-3 ${field === 'amount' ? 'text-right' : ''}`} onDoubleClick={() => { setEditing({ id: client.id, field }); setEditValue(String(client[field] || '')); }}>
              {editing?.id === client.id && editing.field === field ? <input autoFocus value={editValue} onChange={(event) => setEditValue(field === 'amount' ? event.target.value.replace(/[^0-9.]/g, '') : event.target.value)} onBlur={() => saveInlineEdit(client, field)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setEditing(null); }} className="w-full rounded-lg border border-emerald-400 px-2 py-1 outline-none" inputMode={field === 'amount' ? 'decimal' : 'text'} /> : field === 'name' ? <button type="button" onClick={() => router.push(`/dashboard/client/${client.id}`)} className="font-semibold text-emerald-700 hover:underline">{client.name}</button> : <span className="cursor-text font-medium text-slate-800">{field === 'amount' ? `KES ${client.amount.toLocaleString()}` : client[field] || '—'}</span>}
            </td>)}
            <td className="px-5 py-3 text-slate-600"><p>{client.property || '—'}</p>{client.items?.length ? <p className="mt-1 max-w-xs truncate text-xs text-slate-400" title={formatItems(client.items)}>{client.items.length} item{client.items.length === 1 ? '' : 's'}: {formatItems(client.items)}</p> : null}</td><td className="px-5 py-3 text-center text-slate-600">{client.due_day || '—'}</td><td className="px-5 py-3 text-center"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${client.status === 'overdue' ? 'bg-red-100 text-red-700' : client.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{client.status}</span>{client.payment_method && <span className="mt-1 block text-xs text-slate-500">{client.payment_method}</span>}</td><td className="px-5 py-3 text-center"><div className="flex justify-center gap-2">{client.archived ? <button type="button" onClick={() => restoreClient(client)} className="rounded-xl border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700">Restore</button> : <><button type="button" onClick={() => setPaymentClient(client)} disabled={client.status === 'paid'} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">Mark as Paid</button><button type="button" onClick={() => openReminderOptions(client)} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white">{t('reminderAction')}</button></>}</div></td>
          </tr>)}
        </tbody></table></div>
        {visibleClients.length === 0 && <div className="p-12 text-center text-sm text-slate-500">{search ? 'No matching clients found.' : t('noClients')}</div>}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500"><span>{filteredClients.length} clients</span><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button><span>{page} / {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
      </section>

      {showReminders && <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold text-slate-950">{reminderMessages.length} {reminderMessages.length === 1 ? t('reminderReady') : t('reminderReadyPlural')}</h3><div className="flex gap-2"><button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(reminderMessages.map((message) => message.message).join('\n\n'))}`, '_blank')} className="rounded-xl bg-[#25D366] px-3 py-2 text-sm font-semibold text-white">{t('sendAllWhatsApp')}</button><button type="button" onClick={copyAll} className="rounded-xl border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700">{copySuccess ? t('copied') : t('copyAll')}</button></div></div>{reminderMessages.length === 0 ? <p className="mt-4 text-sm text-emerald-900">{t('noReminders')}</p> : <div className="mt-4 space-y-3">{reminderMessages.map((message) => <div key={message.clientId} className="rounded-2xl bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-900">{message.clientName}</p><button type="button" onClick={() => sendWhatsApp(message.phone, message.message)} className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white">{t('sendWhatsApp')}</button></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{message.message}</p></div>)}</div>}</section>}

      {selectedReminder && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="reminder-options-title"><div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">{t('reminderAction')}</p><h2 id="reminder-options-title" className="mt-1 text-2xl font-semibold text-slate-950">{selectedReminder.clientName}</h2><p className="mt-1 text-sm text-slate-500">Choose how to send this reminder.</p></div><button type="button" onClick={() => setSelectedReminder(null)} className="rounded-full px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100" aria-label="Close reminder options">×</button></div><div className="grid gap-3"><button type="button" onClick={() => chooseReminderOption('call')} className="flex min-h-16 items-center gap-4 rounded-2xl bg-orange-500 px-5 py-4 text-left text-lg font-bold text-white shadow-sm transition hover:bg-orange-600"><span className="text-3xl" aria-hidden="true">📞</span>Call</button><button type="button" onClick={() => chooseReminderOption('sms')} className="flex min-h-16 items-center gap-4 rounded-2xl bg-blue-600 px-5 py-4 text-left text-lg font-bold text-white shadow-sm transition hover:bg-blue-700"><span className="text-3xl" aria-hidden="true">💬</span>SMS</button><button type="button" onClick={() => chooseReminderOption('whatsapp')} className="flex min-h-16 items-center gap-4 rounded-2xl bg-[#25D366] px-5 py-4 text-left text-lg font-bold text-white shadow-sm transition hover:bg-[#1fbd5a]"><span className="text-3xl" aria-hidden="true">📱</span>WhatsApp</button></div></div></div>}
      {paymentClient && <PaymentMethodModal onSelect={markAsPaid} onClose={() => setPaymentClient(null)} />}
      {showDailySummary && <DailySummaryPopup clients={clients} onClose={() => setShowDailySummary(false)} />}

      <button type="button" onClick={() => setShowAdd(true)} className="fixed bottom-5 right-5 z-30 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-700">+ Add Client</button>
      {showAdd && <QuickAddModal userId={userId} clients={clients} defaultDueDay={defaultDueDay} onClose={() => setShowAdd(false)} onSaved={handleAdded} onRememberDueDay={(day) => { setDefaultDueDay(day); window.localStorage.setItem('mkopo-last-due-day', String(day)); }} />}
    </main>
  );
}