'use client';

import { useEffect, useState } from 'react';
import type { Client } from '../types';

export default function DailySummaryPopup({ clients, onClose }: { clients: Client[]; onClose: () => void }) {
  const [dontShowToday, setDontShowToday] = useState(false);
  const dueToday = clients.filter((client) => client.status === 'active' && client.due_day === new Date().getDate());
  const overdue = clients.filter((client) => client.status === 'overdue');
  const totalDebt = clients.reduce((sum, client) => sum + Math.max(0, client.amount - client.paid_amount), 0);

  useEffect(() => {
    if (dontShowToday) window.localStorage.setItem('mkopo-summary-hidden', new Date().toISOString().slice(0, 10));
  }, [dontShowToday]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="daily-summary-title">
      <div className="flex max-h-[95vh] min-h-[90vh] w-[calc(100%-1rem)] max-w-[500px] flex-col overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:min-h-0 sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Today</p><h2 id="daily-summary-title" className="mt-1 text-2xl font-semibold text-slate-950">Daily summary</h2></div><button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100" aria-label="Close daily summary">×</button></div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3"><div className="rounded-2xl bg-emerald-50 p-5"><p className="text-sm text-emerald-700">Due today</p><p className="mt-3 text-3xl font-bold text-emerald-900">{dueToday.length}</p></div><div className="rounded-2xl bg-red-50 p-5"><p className="text-sm text-red-700">Overdue</p><p className="mt-3 text-3xl font-bold text-red-900">{overdue.length}</p></div><div className="rounded-2xl bg-amber-50 p-5"><p className="text-sm text-amber-700">Total debt</p><p className="mt-3 text-xl font-bold text-amber-900">KES {totalDebt.toLocaleString()}</p></div></div>
        <label className="mt-8 flex min-h-12 items-center gap-3 text-base text-slate-600"><input type="checkbox" checked={dontShowToday} onChange={(event) => setDontShowToday(event.target.checked)} className="h-5 w-5 accent-emerald-600" /> Don&apos;t show today</label>
        <button type="button" onClick={onClose} className="mt-8 w-full rounded-xl bg-emerald-600 px-5 py-4 text-lg font-semibold text-white hover:bg-emerald-700">Continue</button>
      </div>
    </div>
  );
}
