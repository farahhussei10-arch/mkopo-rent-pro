'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Client, ReminderMessage } from '../types';
import { addDays, getDate } from 'date-fns';
import { useLanguage } from '../components/LanguageProvider';
import TopBar from '../components/TopBar';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminderMessages, setReminderMessages] = useState<ReminderMessage[]>([]);
  const [showReminders, setShowReminders] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = [
    {
      title: t('totalTenants'),
      value: clients.length.toString(),
      description: t('activeClients'),
    },
    {
      title: t('totalDebt'),
      value: `KES ${(clients.reduce((sum, c) => sum + (c.amount - c.paid_amount), 0)).toLocaleString()}`,
      description: t('outstandingBalances'),
    },
    {
      title: t('overduePayments'),
      value: clients.filter((c) => c.status === 'overdue').length.toString(),
      description: t('needFollowUp'),
    },
    {
      title: t('collectedThisMonth'),
      value: `KES ${clients.reduce((sum, c) => sum + c.paid_amount, 0).toLocaleString()}`,
      description: t('paidSoFar'),
    },
  ];

  const formatTemplate = (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));

  const handleGenerateReminders = () => {
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);
    const threeDaysDueDate = getDate(threeDaysFromNow);

    const template = t('reminderMessageTemplate');

    const messages = clients
      .filter((client) => client.due_day === threeDaysDueDate && client.status === 'active')
      .map((client) => ({
        clientId: client.id,
        clientName: client.name,
        phone: client.phone || '',
        message: formatTemplate(template, {
          name: client.name,
          amount: client.amount.toLocaleString(),
          property: client.property || t('yourRental'),
          dueDay: client.due_day || 1,
          ordinal: getOrdinalSuffix(client.due_day || 1),
        }),
      }));

    setReminderMessages(messages);
    setShowReminders(true);
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const normalizePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 9 && digits.startsWith('7')) {
      return `254${digits}`;
    }
    if (digits.length === 10 && digits.startsWith('07')) {
      return `254${digits.slice(1)}`;
    }
    if (digits.length === 12 && digits.startsWith('254')) {
      return digits;
    }
    return '';
  };

  const handleSendWhatsApp = (phone: string | undefined, message: string, clientName: string) => {
    if (!phone) {
      alert(t('invalidPhoneAlert'));
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      alert(t('invalidPhoneAlert'));
      return;
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const handleSendAllWhatsApp = () => {
    if (reminderMessages.length === 0) {
      return;
    }

    const encodedMessage = encodeURIComponent(reminderMessages.map((msg) => msg.message).join('\n\n'));
    const url = `https://wa.me/?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const handleCopyAll = () => {
    const text = reminderMessages.map((msg) => msg.message).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <main className="space-y-6">
        <p className="text-center text-slate-500">{t('loadingDashboard')}</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <TopBar />
      <div className="rounded-2xl border border-green-100 bg-green-50 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-green-700">{t('businessOverview')}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{t('dashboardHeadline')}</h1>
            <p className="mt-2 text-sm text-slate-600">{t('dashboardHint')}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
          >
            {t('logout')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{item.title}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={() => router.push('/dashboard/add-client')}
          className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 sm:px-8"
        >
          {t('addClient')}
        </button>
        {clients.length > 0 && (
          <button
            onClick={handleGenerateReminders}
            className="rounded-xl border-2 border-green-600 px-6 py-3 font-semibold text-green-700 transition hover:bg-green-50"
          >
            {t('sendReminders')}
          </button>
        )}
      </div>

      {/* Reminders Section */}
      {showReminders && reminderMessages.length > 0 && (
        <div className="space-y-4 rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {reminderMessages.length} {reminderMessages.length > 1 ? t('reminderReadyPlural') : t('reminderReady')}
              </h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={handleSendAllWhatsApp}
                className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5f]"
              >
                {t('sendAllWhatsApp')}
              </button>
              <button
                onClick={handleCopyAll}
                className={`rounded-lg px-4 py-2 font-semibold transition ${
                  copySuccess
                    ? 'bg-green-600 text-white'
                    : 'border border-green-600 text-green-700 hover:bg-green-100'
                }`}
              >
                {copySuccess ? t('copied') : t('copyAll')}
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reminderMessages.map((msg) => (
              <div key={msg.clientId} className="rounded-lg border border-white bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{msg.clientName}</p>
                    {msg.phone && <p className="text-sm text-slate-600">{msg.phone}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(msg.phone, msg.message, msg.clientName)}
                    className="rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5f] sm:ml-4"
                  >
                    {t('sendWhatsApp')}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showReminders && reminderMessages.length === 0 && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-center font-semibold text-yellow-900">
            {t('noReminders')}
          </p>
        </div>
      )}

      {/* Clients Table */}
      {clients.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-green-200 bg-green-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">{t('name')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">{t('property')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{t('amount')}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">{t('dueDay')}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">{t('status') || 'Status'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{client.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{client.property || '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                    KES {client.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">
                    {client.due_day || '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : client.status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <button className="text-green-600 hover:underline">{t('reminderAction')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {clients.length === 0 && !showReminders && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">{t('noClients')}</p>
        </div>
      )}
    </main>
  );
}
