'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { format, startOfMonth, subMonths } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import type { Client } from '../../types';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

export default function ReportsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('clients').select('*').eq('user_id', user.id);
      const parsedClients = (data || []).map((client: any) => ({
        ...client,
        items: client.items && typeof client.items === 'string' ? JSON.parse(client.items) : client.items,
      }));
      setClients(parsedClients as Client[]);
      setLoading(false);
    };
    load();
  }, []);

  const months = useMemo(() => Array.from({ length: 6 }, (_, index) => startOfMonth(subMonths(new Date(), 5 - index))), []);
  const collections = months.map((month) => clients.filter((client) => client.created_at && format(new Date(client.created_at), 'yyyy-MM') === format(month, 'yyyy-MM')).reduce((sum, client) => sum + client.paid_amount, 0));
  const outstanding = clients.reduce((sum, client) => sum + Math.max(0, client.amount - client.paid_amount), 0);
  const paid = clients.reduce((sum, client) => sum + Math.min(client.amount, client.paid_amount), 0);
  const overdue = clients.filter((client) => client.status === 'overdue').reduce((sum, client) => sum + Math.max(0, client.amount - client.paid_amount), 0);

  const barData = { labels: months.map((month) => format(month, 'MMM')), datasets: [{ label: 'Collections (KES)', data: collections, backgroundColor: '#059669', borderRadius: 8 }] };
  const doughnutData = { labels: ['Paid', 'Outstanding', 'Overdue'], datasets: [{ data: [paid, Math.max(0, outstanding - overdue), overdue], backgroundColor: ['#10b981', '#fbbf24', '#ef4444'], borderWidth: 0 }] };

  if (loading) return <main className="space-y-6"><TopBar onMenuClick={() => setSidebarOpen(true)} /><div className="h-96 animate-pulse rounded-3xl bg-slate-200" /></main>;

  return (
    <main className="space-y-6 pb-8">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Performance</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Reports & insights</h1><p className="mt-2 text-sm text-slate-500">A quick view of collections and outstanding balances.</p></div><Link href="/dashboard" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to dashboard</Link></div>
      <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total collected</p><p className="mt-2 text-2xl font-semibold text-emerald-700">KES {paid.toLocaleString()}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Outstanding</p><p className="mt-2 text-2xl font-semibold text-amber-600">KES {outstanding.toLocaleString()}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Overdue</p><p className="mt-2 text-2xl font-semibold text-red-600">KES {overdue.toLocaleString()}</p></div></section>
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-5 text-lg font-semibold text-slate-950">Monthly collections</h2><Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (value) => `KES ${Number(value).toLocaleString()}` } } } }} /></div><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-5 text-lg font-semibold text-slate-950">Portfolio health</h2><div className="mx-auto max-w-xs"><Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} /></div></div></section>
    </main>
  );
}
