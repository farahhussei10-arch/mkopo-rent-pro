export type BusinessType = 
  | 'landlord'
  | 'hardware'
  | 'clothes'
  | 'restaurant'
  | 'salon'
  | 'phone'
  | 'grocery'
  | 'tailor'
  | 'pharmacy'
  | 'carparts'
  | 'guesthouse'
  | 'stationery'
  | 'bakery'
  | 'cosmetics'
  | 'repair'
  | 'mpesa'
  | 'travel'
  | 'logistics'
  | 'construction'
  | 'school'
  | 'photographer'
  | 'clinic';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  property?: string;
  amount: number;
  paid_amount: number;
  items?: PurchaseItem[];
  due_day?: number;
  status: 'active' | 'paid' | 'overdue';
  archived?: boolean;
  payment_method?: string;
  business_type?: BusinessType;
  created_at: string;
  updated_at?: string;
}

export interface PurchaseItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ReminderMessage {
  clientId: string;
  clientName: string;
  phone?: string;
  message: string;
}

export interface Payment {
  id: string;
  client_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  paid_at: string;
}
