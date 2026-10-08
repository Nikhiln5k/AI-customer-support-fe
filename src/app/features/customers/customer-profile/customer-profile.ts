import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CustomersApi } from '../../../core/api/customers.api';
import { TicketsApi } from '../../../core/api/tickets.api';
import { TicketStatus } from '../../../core/models/ticket';
import { AuthService } from '../../../core/services/auth.service';
import { EmptyState } from '../../../shared/components/empty-state';
import { ErrorState } from '../../../shared/components/error-state';
import { PageHeader } from '../../../shared/components/page-header';
import { SkeletonRows } from '../../../shared/components/skeleton-rows';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Avatar } from '../../../shared/ui/avatar';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { TICKET_PRIORITY, TICKET_STATUS } from '../../../shared/ui/labels';

const CLOSED: TicketStatus[] = ['resolved', 'closed'];

@Component({
  selector: 'app-customer-profile',
  imports: [
    RouterLink,
    PageHeader,
    EmptyState,
    ErrorState,
    SkeletonRows,
    RelativeTimePipe,
    Avatar,
    Badge,
    Icon,
  ],
  templateUrl: './customer-profile.html',
})
export default class CustomerProfile {
  private readonly customersApi = inject(CustomersApi);
  private readonly ticketsApi = inject(TicketsApi);
  protected readonly canEdit = inject(AuthService).hasRole('admin', 'agent');

  readonly id = input.required<string>();

  protected readonly statusLabels = TICKET_STATUS;
  protected readonly priorityLabels = TICKET_PRIORITY;

  protected readonly customer = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.customersApi.get(params),
  });

  // Status filtering is equality-only, so fetch the customer's tickets once and split them here.
  protected readonly tickets = rxResource({
    params: () => this.id(),
    stream: ({ params }) =>
      this.ticketsApi.list({
        customerId: params,
        page: 1,
        pageSize: 100,
        sort: 'updatedAt',
        direction: 'desc',
      }),
  });

  protected readonly activity = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.customersApi.activity(params),
    defaultValue: [],
  });

  protected readonly openTickets = computed(() =>
    (this.tickets.value()?.items ?? []).filter((t) => !CLOSED.includes(t.status)),
  );
  protected readonly recentTickets = computed(() =>
    (this.tickets.value()?.items ?? []).slice(0, 5),
  );
}
