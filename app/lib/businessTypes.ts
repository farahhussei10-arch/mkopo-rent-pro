import type { BusinessType } from '../types';

export interface BusinessTypeConfig {
  id: BusinessType;
  label: string;
  emoji: string;
  fields: 'rental' | 'itemized' | 'service' | 'mobileFloat' | 'education' | 'lodging';
}

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
  { id: 'landlord', label: 'Landlord / Rental', emoji: '🏠', fields: 'rental' },
  { id: 'hardware', label: 'Hardware / Wholesale', emoji: '🏪', fields: 'itemized' },
  { id: 'clothes', label: 'Clothes Seller (Mitumba / Fashion)', emoji: '👗', fields: 'itemized' },
  { id: 'restaurant', label: 'Restaurant / Food Vendor', emoji: '🍽️', fields: 'itemized' },
  { id: 'salon', label: 'Salon / Barber', emoji: '💄', fields: 'service' },
  { id: 'phone', label: 'Phone / Electronics Shop', emoji: '📱', fields: 'itemized' },
  { id: 'grocery', label: 'Grocery / Supermarket (Duka)', emoji: '🛒', fields: 'itemized' },
  { id: 'tailor', label: 'Tailor / Fashion Designer', emoji: '🧵', fields: 'service' },
  { id: 'pharmacy', label: 'Pharmacy / Chemist', emoji: '🏥', fields: 'itemized' },
  { id: 'carparts', label: 'Car Parts / Garage', emoji: '🚗', fields: 'itemized' },
  { id: 'guesthouse', label: 'Guest House / Lodging', emoji: '🏨', fields: 'lodging' },
  { id: 'stationery', label: 'Stationery / Office Supplies', emoji: '🧾', fields: 'itemized' },
  { id: 'bakery', label: 'Bakery / Confectionery', emoji: '🍞', fields: 'itemized' },
  { id: 'cosmetics', label: 'Cosmetics / Perfume', emoji: '🧴', fields: 'itemized' },
  { id: 'repair', label: 'Repair / Mechanic', emoji: '🔧', fields: 'service' },
  { id: 'mpesa', label: 'M-Pesa Agent', emoji: '💰', fields: 'mobileFloat' },
  { id: 'travel', label: 'Travel / Tour Agent', emoji: '🧳', fields: 'service' },
  { id: 'logistics', label: 'Logistics / Delivery', emoji: '📦', fields: 'itemized' },
  { id: 'construction', label: 'Construction / Contractor', emoji: '🏗️', fields: 'itemized' },
  { id: 'school', label: 'School / Education', emoji: '📚', fields: 'education' },
  { id: 'photographer', label: 'Photographer / Videographer', emoji: '🎥', fields: 'service' },
  { id: 'clinic', label: 'Clinic / Health', emoji: '🩺', fields: 'service' },
];

export function getBusinessType(id: BusinessType): BusinessTypeConfig {
  return BUSINESS_TYPES.find((bt) => bt.id === id) || BUSINESS_TYPES[0];
}
