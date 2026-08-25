'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from './LanguageProvider';
import type { Client, PurchaseItem, BusinessType } from '../types';
import { BUSINESS_TYPES, getBusinessType } from '../lib/businessTypes';

interface QuickAddModalProps {
  userId: string;
  clients: Client[];
  defaultDueDay: number;
  onClose: () => void;
  onSaved: (client: Client) => void;
  onRememberDueDay: (day: number) => void;
}

const draftKey = 'mkopo-quick-add-draft';

export default function QuickAddModal({
  userId,
  clients,
  defaultDueDay,
  onClose,
  onSaved,
  onRememberDueDay,
}: QuickAddModalProps) {
  const { t } = useLanguage();
  const [businessType, setBusinessType] = useState<BusinessType>('landlord');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [property, setProperty] = useState('');
  const [service, setService] = useState('');
  const [studentName, setStudentName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [agentShopName, setAgentShopName] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [dueDay, setDueDay] = useState(String(defaultDueDay));
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const draft = JSON.parse(window.localStorage.getItem(draftKey) || 'null');
      if (!draft) return;
      setBusinessType(draft.businessType || 'landlord');
      setName(draft.name || '');
      setPhone(draft.phone || '');
      setShopName(draft.shopName || '');
      setLocation(draft.location || '');
      setProperty(draft.property || '');
      setService(draft.service || '');
      setStudentName(draft.studentName || '');
      setRoomName(draft.roomName || '');
      setAgentShopName(draft.agentShopName || '');
      setAmount(draft.amount || '');
      setPaidAmount(draft.paidAmount || '0');
      setDueDay(draft.dueDay || String(defaultDueDay));
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [defaultDueDay]);

  const config = getBusinessType(businessType);
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalAmount = grandTotal > 0 ? grandTotal : Number(amount || 0);
  const balance = Math.max(0, totalAmount - Number(paidAmount || 0));
  const duplicate = useMemo(
    () => clients.some((client) => client.name.trim().toLowerCase() === name.trim().toLowerCase()),
    [clients, name],
  );

  const persistDraft = () => {
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        businessType,
        name,
        phone,
        shopName,
        location,
        property,
        service,
        studentName,
        roomName,
        agentShopName,
        amount,
        paidAmount,
        dueDay,
      }),
    );
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: string) => {
    setItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, [field]: field === 'name' ? value : Number(value.replace(/[^0-9.]/g, '')) || 0 };
      return { ...next, total: next.quantity * next.unit_price };
    }));
  };

  const addItem = () => setItems((current) => [...current, { name: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (index: number) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    if (digits.startsWith('254')) {
      return `+254 ${digits.slice(3, 6)}${digits.slice(6, 9) ? ` ${digits.slice(6, 9)}` : ''}${digits.slice(9, 12) ? ` ${digits.slice(9, 12)}` : ''}`.trim();
    }
    return value;
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const numericPaidAmount = Number(paidAmount || 0);
    const numericDueDay = Number(dueDay);

    if (!name.trim()) return setError('Name is required.');
    const amountToSave = grandTotal > 0 ? grandTotal : Number(amount || 0);
    if (!Number.isFinite(amountToSave) || amountToSave <= 0) return setError('Enter a valid amount or add purchase items.');
    if (!Number.isFinite(numericPaidAmount) || numericPaidAmount < 0 || numericPaidAmount > amountToSave) {
      return setError('Paid amount must be between 0 and the total amount.');
    }
    if (numericDueDay < 1 || numericDueDay > 31) return setError('Choose a due day from 1 to 31.');

    try {
      setSaving(true);
      const filteredItems = items.filter((item) => item.name.trim() && item.quantity > 0 && item.unit_price > 0);
      const { data, error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: name.trim(),
          phone: phone.replace(/\s/g, '') || null,
          property: config.fields === 'rental' ? property.trim() || null : shopName.trim() || null,
          amount: amountToSave,
          paid_amount: numericPaidAmount,
          due_day: numericDueDay,
          items: filteredItems.length > 0 ? JSON.stringify(filteredItems) : null,
          business_type: businessType,
          status: numericPaidAmount >= amountToSave ? 'paid' : 'active',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      window.localStorage.removeItem(draftKey);
      onRememberDueDay(numericDueDay);
      onSaved(data as Client);
      onClose();
    } catch (saveError) {
      persistDraft();
      setError(saveError instanceof Error ? saveError.message : 'Unable to save client. Draft saved locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <form onSubmit={save} className="w-full max-w-2xl rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Add</p>
              <h2 id="modal-title" className="mt-1 text-2xl font-semibold text-slate-950">New Client</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100" aria-label="Close">
              ×
            </button>
          </div>

          {error && <div className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><span>❌</span><span>{error}</span></div>}

          {/* Business Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-900">Business Type *</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as BusinessType)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt.id} value={bt.id}>
                  {bt.emoji} {bt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Common Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900">Name/Owner *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="+254 712 345 678"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Conditional Fields by Business Type */}
          {config.fields === 'rental' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-900">Property Name</label>
                <input
                  type="text"
                  value={property}
                  onChange={(e) => setProperty(e.target.value)}
                  placeholder="e.g., Shop B43, 3-bed apartment"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900">Monthly Rent (KES) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {['itemized', 'service', 'mobileFloat', 'education', 'lodging'].includes(config.fields) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {(config.fields === 'itemized' || config.fields === 'mobileFloat') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900">{config.fields === 'mobileFloat' ? 'Agent Shop Name' : 'Shop Name'}</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Shop or business name"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>
              )}
              {(config.fields === 'itemized' || config.fields === 'mobileFloat') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Area/street"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>
              )}
              {config.fields === 'service' && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900">Service Description</label>
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="e.g., Hair cutting, Tailoring, Repairs"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>
              )}
              {config.fields === 'education' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900">Student Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Student full name"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>
              )}
              {config.fields === 'lodging' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900">Room/Unit Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., Room 101, Suite A"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>
              )}
              {(config.fields === 'mobileFloat' || config.fields === 'education' || config.fields === 'service' || config.fields === 'lodging') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900">{config.fields === 'mobileFloat' ? 'Float Amount' : 'Amount'} (KES) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Itemized List */}
          {config.fields === 'itemized' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Itemized Purchase List</h3>
                <button type="button" onClick={addItem} className="text-sm text-emerald-600 hover:underline">
                  + Add Item
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Item name"
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      placeholder="Price"
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                    />
                    <span className="flex w-20 items-center justify-end text-xs font-semibold text-slate-900">{item.total.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {items.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">No items added yet. Click "+ Add Item" to get started.</p>
              )}
            </div>
          )}

          {/* Amount Paid & Due Day */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-slate-900">Amount Paid (KES)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>
            {['rental', 'mobileFloat', 'education', 'lodging', 'service'].includes(config.fields) && (
              <div>
                <label className="block text-sm font-semibold text-slate-900">Due Day (1-31) *</label>
                <input
                  type="number"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  min="1"
                  max="31"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-900">Balance</label>
              <div className="mt-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                KES {balance.toLocaleString()}
              </div>
            </div>
          </div>

          {duplicate && <div className="flex gap-2 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700"><span>⚠️</span><span>A client with this name already exists.</span></div>}

          <div className="flex gap-2 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Add Client'}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
