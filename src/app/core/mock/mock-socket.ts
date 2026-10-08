import { AppNotification } from '../models/notification';
import { TicketMessage } from '../models/ticket';
import { messages, notifications, tickets } from './mock-db';

interface ClientMessage {
  event: string;
  data: { ticketId?: string; messageId?: string };
}

/** Simulates the realtime gateway: presence, typing, delivery receipts and notifications. */
export class MockSocket {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((message: { data: string }) => void) | null = null;

  private readonly timers: ReturnType<typeof setTimeout>[] = [];
  private notificationTimer?: ReturnType<typeof setInterval>;

  constructor() {
    this.later(600, () => this.onopen?.());
    this.notificationTimer = setInterval(() => this.pushNotification(), 60_000);
  }

  send(raw: string): void {
    const { event, data } = JSON.parse(raw) as ClientMessage;

    if (event === 'ticket:join' && data.ticketId) {
      this.later(300, () =>
        this.emit('presence', { ticketId: data.ticketId, customerOnline: true }),
      );
    }

    if (event === 'message:sent' && data.ticketId && data.messageId) {
      this.simulateCustomer(data.ticketId, data.messageId);
    }
  }

  close(): void {
    this.timers.forEach(clearTimeout);
    clearInterval(this.notificationTimer);
    this.onclose?.();
  }

  private simulateCustomer(ticketId: string, messageId: string): void {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    this.later(700, () => this.emit('message:status', { ticketId, messageId, state: 'delivered' }));
    this.later(2000, () => this.emit('message:status', { ticketId, messageId, state: 'read' }));
    this.later(2600, () =>
      this.emit('typing', { ticketId, name: ticket.customer.name, typing: true }),
    );
    this.later(5200, () => {
      const reply: TicketMessage = {
        id: Math.random().toString(36).slice(2),
        ticketId,
        kind: 'reply',
        author: { id: ticket.customer.id, name: ticket.customer.name, type: 'customer' },
        body: 'Thanks for the quick update, that helps. I will try it now.',
        attachments: [],
        state: 'read',
        createdAt: new Date().toISOString(),
      };
      messages.push(reply);
      this.emit('typing', { ticketId, name: ticket.customer.name, typing: false });
      this.emit('message:new', reply);
    });
  }

  private pushNotification(): void {
    const ticket = tickets[Math.floor(Math.random() * 10)];
    const notification: AppNotification = {
      id: Math.random().toString(36).slice(2),
      type: 'ticket_reply',
      title: `New reply on #${ticket.number}`,
      body: `${ticket.customer.name} replied to the conversation`,
      link: `/tickets/${ticket.id}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(notification);
    this.emit('notification:new', notification);
  }

  private emit(event: string, data: unknown): void {
    this.onmessage?.({ data: JSON.stringify({ event, data }) });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
