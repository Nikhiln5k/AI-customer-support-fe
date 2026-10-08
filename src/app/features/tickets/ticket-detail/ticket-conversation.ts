import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TicketsApi } from '../../../core/api/tickets.api';
import { ApiError } from '../../../core/models/api';
import { Attachment, DeliveryState, TicketMessage } from '../../../core/models/ticket';
import { AuthService } from '../../../core/services/auth.service';
import { RealtimeService } from '../../../core/services/realtime.service';

export interface OutgoingMessage {
  body: string;
  kind: 'reply' | 'note';
  attachments: Attachment[];
}

/**
 * Live conversation state for one ticket: REST for history and sending,
 * WebSocket for new messages, delivery receipts, typing and presence.
 * Provided per ticket-detail instance.
 */
@Injectable()
export class TicketConversation {
  private readonly api = inject(TicketsApi);
  private readonly realtime = inject(RealtimeService);
  private readonly auth = inject(AuthService);

  private readonly ticketId = signal<string | null>(null);

  readonly messages = signal<TicketMessage[]>([]);
  readonly loading = signal(true);
  readonly error = signal<ApiError | null>(null);
  readonly typing = signal<string | null>(null);
  readonly customerOnline = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Join the ticket room once connected (and again after reconnects).
    effect(() => {
      const id = this.ticketId();
      if (id && this.realtime.state() === 'connected') {
        this.realtime.send('ticket:join', { ticketId: id });
      }
    });

    this.realtime
      .on<TicketMessage>('message:new')
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((message) => {
        if (message.ticketId !== this.ticketId()) return;
        this.messages.update((list) =>
          list.some((m) => m.id === message.id) ? list : [...list, message],
        );
      });

    this.realtime
      .on<{ ticketId: string; messageId: string; state: DeliveryState }>('message:status')
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(({ ticketId, messageId, state }) => {
        if (ticketId === this.ticketId()) this.setState(messageId, state);
      });

    this.realtime
      .on<{ ticketId: string; name: string; typing: boolean }>('typing')
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(({ ticketId, name, typing }) => {
        if (ticketId === this.ticketId()) this.typing.set(typing ? name : null);
      });

    this.realtime
      .on<{ ticketId: string; customerOnline: boolean }>('presence')
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(({ ticketId, customerOnline }) => {
        if (ticketId === this.ticketId()) this.customerOnline.set(customerOnline);
      });
  }

  load(ticketId: string): void {
    this.ticketId.set(ticketId);
    this.loading.set(true);
    this.error.set(null);
    this.api.messages(ticketId).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.error.set(error);
        this.loading.set(false);
      },
    });
  }

  /** Optimistically appends the message, then reconciles with the server response. */
  send(outgoing: OutgoingMessage): void {
    const ticketId = this.ticketId();
    const user = this.auth.user();
    if (!ticketId || !user) return;

    const tempId = `temp-${Date.now()}`;
    this.messages.update((list) => [
      ...list,
      {
        id: tempId,
        ticketId,
        kind: outgoing.kind,
        author: { id: user.id, name: user.name, type: 'agent' },
        body: outgoing.body,
        attachments: outgoing.attachments,
        state: 'sending',
        createdAt: new Date().toISOString(),
      },
    ]);
    this.deliver(tempId, outgoing);
  }

  retry(message: TicketMessage): void {
    this.setState(message.id, 'sending');
    this.deliver(message.id, {
      body: message.body,
      kind: message.kind === 'note' ? 'note' : 'reply',
      attachments: message.attachments,
    });
  }

  private deliver(localId: string, outgoing: OutgoingMessage): void {
    const ticketId = this.ticketId()!;
    this.api
      .sendMessage(ticketId, {
        body: outgoing.body,
        kind: outgoing.kind,
        attachmentIds: outgoing.attachments.map((a) => a.id),
      })
      .subscribe({
        next: (saved) => {
          this.messages.update((list) =>
            list.map((m) =>
              m.id === localId ? { ...saved, attachments: outgoing.attachments } : m,
            ),
          );
          if (saved.kind === 'reply') {
            this.realtime.send('message:sent', { ticketId, messageId: saved.id });
          }
        },
        error: () => this.setState(localId, 'failed'),
      });
  }

  private setState(id: string, state: DeliveryState): void {
    this.messages.update((list) => list.map((m) => (m.id === id ? { ...m, state } : m)));
  }
}
