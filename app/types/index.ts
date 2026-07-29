export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  property?: string;
  amount: number;
  paid_amount: number;
  due_day?: number;
  status: 'active' | 'paid' | 'overdue';
  created_at: string;
  updated_at?: string;
}

export interface ReminderMessage {
  clientId: string;
  clientName: string;
  phone?: string;
  message: string;
}
