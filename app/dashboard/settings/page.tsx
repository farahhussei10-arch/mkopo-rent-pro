'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';

const defaultTemplate = 'Dear {name}, your payment of KES {amount} for {property} is due on the {due_day}{ordinal}.';

export default function SettingsPage() {
  const [template, setTemplate] = useState(defaultTemplate);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('reminder_template').eq('id', user.id).maybeSingle();
      if (data?.reminder_template) setTemplate(data.reminder_template);
    };
    void load();
  }, []);

  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, reminder_template: template.trim() || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Reminder template saved.');
  };

  return <main className="space-y-6 pb-8"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><TopBar onMenuClick={() => setSidebarOpen(true)} /><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Settings</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Reminder Template</h1></div><Link href="/dashboard" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Back</Link></div><section className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><label className="text-sm font-semibold text-slate-700">Reminder Template<textarea value={template} onChange={(event) => setTemplate(event.target.value)} rows={7} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-emerald-500" /></label><p className="mt-3 text-sm text-slate-500">Placeholders: {'{name}'}, {'{amount}'}, {'{property}'}, {'{due_day}'}, {'{ordinal}'}</p><button type="button" onClick={save} disabled={saving} className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save Template'}</button></section></main>;
}
