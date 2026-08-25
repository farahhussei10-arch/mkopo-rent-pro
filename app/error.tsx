'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5">
      <section className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Something went wrong</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">We could not load this workspace.</h1>
        <p className="mt-3 text-sm text-slate-600">Your data is still protected. Try refreshing the page and continue where you left off.</p>
        <button type="button" onClick={reset} className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Try again</button>
      </section>
    </main>
  );
}