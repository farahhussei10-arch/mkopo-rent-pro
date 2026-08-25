'use client';

import { useLanguage } from './LanguageProvider';
import { useEffect, useState } from 'react';

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { locale, setLocale, localeNames, t } = useLanguage();
  const [now, setNow] = useState(new Date());
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    setOnline(navigator.onLine);
    const markOnline = () => setOnline(true);
    const markOffline = () => setOnline(false);
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  return (
    <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-gradient-to-r from-white via-emerald-50/40 to-slate-100 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-2xl text-slate-600 hover:bg-slate-200 lg:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>
        )}
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t('appName')}</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Professional financial control for your business</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
            <span>{now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="text-slate-300">|</span>
            <span>{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-sm">
              <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-3xl bg-slate-100 px-4 py-3 shadow-sm">
        <span className="text-sm font-medium text-slate-600">{t('language')}</span>
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as typeof locale)}
          className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-green-500"
        >
          {Object.entries(localeNames).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
