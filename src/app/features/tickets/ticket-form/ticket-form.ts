import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, form, maxLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { CustomersApi } from '../../../core/api/customers.api';
import { TicketsApi } from '../../../core/api/tickets.api';
import { UsersApi } from '../../../core/api/users.api';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { ApiError } from '../../../core/models/api';
import { Ticket, TicketInput, TicketPriority, TicketStatus } from '../../../core/models/ticket';
import { ToastService } from '../../../core/services/toast.service';
import { ErrorState } from '../../../shared/components/error-state';
import { FieldError } from '../../../shared/components/field-error';
import { PageHeader } from '../../../shared/components/page-header';
import { TICKET_PRIORITY, TICKET_STATUS, toOptions } from '../../../shared/ui/labels';

interface TicketFormModel {
  customerId: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId: string;
  tags: string;
}

const EMPTY: TicketFormModel = {
  customerId: '',
  subject: '',
  description: '',
  priority: 'medium',
  status: 'open',
  assigneeId: '',
  tags: '',
};

@Component({
  selector: 'app-ticket-form',
  imports: [FormField, FormRoot, RouterLink, PageHeader, FieldError, ErrorState],
  templateUrl: './ticket-form.html',
})
export default class TicketForm implements HasUnsavedChanges {
  private readonly ticketsApi = inject(TicketsApi);
  private readonly customersApi = inject(CustomersApi);
  private readonly usersApi = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Route param; present in edit mode. */
  readonly id = input<string>();
  /** Optional `?customerId=` prefill when creating from a customer profile. */
  readonly customerId = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly priorities = toOptions(TICKET_PRIORITY);
  protected readonly statuses = toOptions(TICKET_STATUS);
  protected readonly saveError = signal<ApiError | null>(null);
  private saved = false;

  protected readonly ticket = rxResource({
    params: () => this.id(),
    stream: ({ params }) => (params ? this.ticketsApi.get(params) : of(null)),
  });

  protected readonly customers = rxResource({
    stream: () =>
      this.customersApi.list({ page: 1, pageSize: 100, sort: 'name', direction: 'asc' }),
  });

  protected readonly agents = rxResource({
    stream: () => this.usersApi.agents(),
    defaultValue: [],
  });

  private readonly model = signal<TicketFormModel>({ ...EMPTY });

  protected readonly ticketForm = form(
    this.model,
    (path) => {
      required(path.customerId, { message: 'Choose a customer' });
      required(path.subject, { message: 'Add a short subject' });
      maxLength(path.subject, 140, { message: 'Keep the subject under 140 characters' });
      required(path.description, { message: 'Describe the request' });
    },
    { submission: { action: async () => this.save() } },
  );

  constructor() {
    effect(() => {
      const prefill = this.customerId();
      if (prefill && !this.isEdit()) this.model.update((m) => ({ ...m, customerId: prefill }));
    });

    effect(() => {
      const ticket = this.ticket.value();
      if (ticket) this.ticketForm().reset(toModel(ticket));
    });
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && this.ticketForm().dirty();
  }

  private async save(): Promise<undefined> {
    const value = this.model();
    const input: TicketInput = {
      customerId: value.customerId,
      subject: value.subject.trim(),
      description: value.description.trim(),
      priority: value.priority,
      assigneeId: value.assigneeId || null,
      tags: value.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      ...(this.isEdit() && { status: value.status }),
    };

    this.saveError.set(null);
    try {
      const id = this.id();
      const ticket = await firstValueFrom(
        id ? this.ticketsApi.update(id, input) : this.ticketsApi.create(input),
      );
      this.saved = true;
      this.toast.success(id ? 'Ticket updated' : `Ticket #${ticket.number} created`);
      await this.router.navigate(['/tickets', ticket.id]);
    } catch (error) {
      this.saveError.set(error as ApiError);
    }
    return undefined;
  }
}

function toModel(ticket: Ticket): TicketFormModel {
  return {
    customerId: ticket.customer.id,
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    assigneeId: ticket.assignee?.id ?? '',
    tags: ticket.tags.join(', '),
  };
}
