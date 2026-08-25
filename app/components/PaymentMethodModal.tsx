'use client';

const methods = ['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque', 'Other'] as const;

export type PaymentMethod = (typeof methods)[number];

export default function PaymentMethodModal({
  onSelect,
  onClose,
}: {
  onSelect: (method: PaymentMethod) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="payment-method-title">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Payment</p><h2 id="payment-method-title" className="mt-1 text-2xl font-semibold text-slate-950">How did they pay?</h2></div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100" aria-label="Close payment method dialog">×</button>
        </div>
        <div className="grid gap-2">{methods.map((method) => <button key={method} type="button" onClick={() => onSelect(method)} className="rounded-xl border border-slate-200 px-4 py-3 text-left font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50">{method}</button>)}</div>
      </div>
    </div>
  );
}
