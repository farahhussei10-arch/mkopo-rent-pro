'use client';

import { useLanguage } from './LanguageProvider';

export default function TopBar() {
  const { locale, setLocale, localeNames, t } = useLanguage();

  return (
    <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-slate-100 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t('appName')}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Professional financial control for your business</h1>
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
