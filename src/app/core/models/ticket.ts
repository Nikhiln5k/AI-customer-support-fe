export type TicketStatus = 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DeliveryState = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Ticket {
  id: string;
  number: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer: { id: string; name: string; email: string };
  assignee: { id: string; name: string } | null;
  tags: string[];
  slaDueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketInput {
  customerId: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status?: TicketStatus;
  assigneeId: string | null;
  tags: string[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  kind: 'reply' | 'note' | 'event';
  author: { id: string; name: string; type: 'agent' | 'customer' | 'system' };
  body: string;
  attachments: Attachment[];
  state: DeliveryState;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}
