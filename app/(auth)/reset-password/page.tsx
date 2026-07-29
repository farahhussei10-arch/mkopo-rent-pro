'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../components/LanguageProvider';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (password.length < 6) {
      setError(t('invalidPassword'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setIsSubmitting(true);
    const { error: resetError } = await supabase.auth.updateUser({ password });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage(t('passwordUpdated'));
      setTimeout(() => router.replace('/login'), 1200);
    }

    setIsSubmitting(false);
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-1 py-4">
      <div className="w-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-semibold text-green-700">
            MR
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('resetPasswordHeadline')}</h1>
          <p className="mt-2 text-sm text-slate-600">{t('resetPasswordHint')}</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-green-600 focus:bg-white"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-green-600 focus:bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? t('loading') : t('resetPasswordButton')}
          </button>
        </form>

        {error ? <p className="mt-4 text-center text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-center text-sm text-slate-700">{message}</p> : null}
      </div>
    </main>
  );
}
