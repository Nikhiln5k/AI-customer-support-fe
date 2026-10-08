export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  openTickets: number;
  lastInteractionAt: string | null;
  createdAt: string;
}

export type CustomerInput = Pick<Customer, 'name' | 'email' | 'phone' | 'company' | 'notes'>;

export interface CustomerActivity {
  id: string;
  description: string;
  createdAt: string;
}
