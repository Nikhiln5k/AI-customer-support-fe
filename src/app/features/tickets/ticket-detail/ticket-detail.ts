import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TicketsApi } from '../../../core/api/tickets.api';
import { UsersApi } from '../../../core/api/users.api';
import { ApiError } from '../../../core/models/api';
import { Ticket, TicketInput, TicketPriority, TicketStatus } from '../../../core/models/ticket';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConnectionStatus } from '../../../shared/components/connection-status';
import { Drawer } from '../../../shared/components/drawer';
import { ErrorState } from '../../../shared/components/error-state';
import { PageHeader } from '../../../shared/components/page-header';
import { SkeletonRows } from '../../../shared/components/skeleton-rows';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Avatar } from '../../../shared/ui/avatar';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { TICKET_PRIORITY, TICKET_STATUS, toOptions } from '../../../shared/ui/labels';
import { OutgoingMessage, TicketConversation } from './ticket-conversation';
import { MessageThread } from './message-thread';
import { ReplyComposer } from './reply-composer';
import { TicketAiPanel } from './ticket-ai-panel';

@Component({
  selector: 'app-ticket-detail',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    PageHeader,
    ErrorState,
    SkeletonRows,
    Drawer,
    ConnectionStatus,
    Avatar,
    Badge,
    Icon,
    RelativeTimePipe,
    MessageThread,
    ReplyComposer,
    TicketAiPanel,
  ],
  providers: [TicketConversation],
  templateUrl: './ticket-detail.html',
})
export default class TicketDetail {
  private readonly ticketsApi = inject(TicketsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly toast = inject(ToastService);
  protected readonly conversation = inject(TicketConversation);
  protected readonly canEdit = inject(AuthService).hasRole('admin', 'agent');

  readonly id = input.required<string>();

  protected readonly statusLabels = TICKET_STATUS;
  protected readonly priorityLabels = TICKET_PRIORITY;
  protected readonly statusOptions = toOptions(TICKET_STATUS);
  protected readonly priorityOptions = toOptions(TICKET_PRIORITY);

  protected readonly ticket = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.ticketsApi.get(params),
  });

  protected readonly agents = rxResource({
    stream: () => this.usersApi.agents(),
    defaultValue: [],
  });

  protected readonly draft = signal('');
  protected readonly composerKind = signal<'reply' | 'note'>('reply');
  protected readonly detailsOpen = signal(false);

  constructor() {
    effect(() => this.conversation.load(this.id()));
  }

  protected send(message: OutgoingMessage): void {
    this.conversation.send(message);
  }

  protected useAiReply(text: string): void {
    this.draft.set(text);
    this.composerKind.set('reply');
    this.detailsOpen.set(false);
    this.toast.info('Suggestion added to the composer. Review it before sending.');
  }

  protected changeStatus(event: Event): void {
    this.update({ status: selectValue<TicketStatus>(event) }, 'Status updated');
  }

  protected changePriority(event: Event): void {
    this.update({ priority: selectValue<TicketPriority>(event) }, 'Priority updated');
  }

  protected changeAssignee(event: Event): void {
    this.update({ assigneeId: selectValue(event) || null }, 'Assignee updated');
  }

  private update(changes: Partial<TicketInput>, message: string): void {
    const previous = this.ticket.value();
    if (!previous) return;

    this.ticketsApi.update(previous.id, changes).subscribe({
      next: (updated: Ticket) => {
        this.ticket.set(updated);
        this.toast.success(message);
      },
      error: (error: ApiError) => {
        this.ticket.set({ ...previous });
        this.toast.error(error.message);
      },
    });
  }
}

function selectValue<T extends string = string>(event: Event): T {
  return (event.target as HTMLSelectElement).value as T;
}
