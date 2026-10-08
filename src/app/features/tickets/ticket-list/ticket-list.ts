import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TicketsApi } from '../../../core/api/tickets.api';
import { UsersApi } from '../../../core/api/users.api';
import { Ticket, TicketStatus } from '../../../core/models/ticket';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { Drawer } from '../../../shared/components/drawer';
import { EmptyState } from '../../../shared/components/empty-state';
import { ErrorState } from '../../../shared/components/error-state';
import { FilterChips } from '../../../shared/components/filter-chips';
import { PageHeader } from '../../../shared/components/page-header';
import { Pagination } from '../../../shared/components/pagination';
import { SearchInput } from '../../../shared/components/search-input';
import { SkeletonRows } from '../../../shared/components/skeleton-rows';
import { ListQueryState } from '../../../shared/data/list-query';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { TICKET_PRIORITY, TICKET_STATUS, toOptions } from '../../../shared/ui/labels';
import { Menu } from '../../../shared/ui/menu';
import { TicketFilters } from './ticket-filters';

const DATE_RANGES: Record<string, { label: string; hours: number }> = {
  '24h': { label: 'Last 24 hours', hours: 24 },
  '7d': { label: 'Last 7 days', hours: 24 * 7 },
  '30d': { label: 'Last 30 days', hours: 24 * 30 },
};

@Component({
  selector: 'app-ticket-list',
  imports: [
    RouterLink,
    PageHeader,
    SearchInput,
    FilterChips,
    Pagination,
    SkeletonRows,
    EmptyState,
    ErrorState,
    Drawer,
    Badge,
    Icon,
    Menu,
    RelativeTimePipe,
    TicketFilters,
  ],
  templateUrl: './ticket-list.html',
})
export default class TicketList {
  private readonly ticketsApi = inject(TicketsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  protected readonly canEdit = inject(AuthService).hasRole('admin', 'agent');

  /** Prefilled from the top bar search (`?search=`). */
  readonly search = input<string>();

  protected readonly statusLabels = TICKET_STATUS;
  protected readonly priorityLabels = TICKET_PRIORITY;
  protected readonly statusOptions = toOptions(TICKET_STATUS);
  protected readonly dateRanges = DATE_RANGES;

  protected readonly agents = rxResource({
    stream: () => this.usersApi.agents(),
    defaultValue: [],
  });

  protected readonly list = new ListQueryState(
    { status: '', priority: '', assigneeId: '', updated: '' },
    (key, value) => {
      if (key === 'status') return TICKET_STATUS[value as TicketStatus].label;
      if (key === 'priority')
        return `${TICKET_PRIORITY[value as Ticket['priority']].label} priority`;
      if (key === 'updated') return DATE_RANGES[value].label;
      return this.agents.value().find((a) => a.id === value)?.name ?? 'Assignee';
    },
  );

  protected readonly tickets = rxResource({
    params: () => {
      const { updated, ...query } = this.list.query();
      const hours = DATE_RANGES[updated as string]?.hours;
      const from = hours ? new Date(Date.now() - hours * 3_600_000).toISOString() : undefined;
      return { ...query, from };
    },
    stream: ({ params }) => this.ticketsApi.list(params),
  });

  protected readonly rows = computed(() => this.tickets.value()?.items ?? []);
  protected readonly total = computed(() => this.tickets.value()?.total ?? 0);
  protected readonly filtersOpen = signal(false);

  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly allSelected = computed(
    () => this.rows().length > 0 && this.rows().every((t) => this.selected().has(t.id)),
  );
  protected readonly bulkStatus = signal<TicketStatus>('resolved');
  protected readonly bulkSaving = signal(false);

  constructor() {
    effect(() => {
      const initial = this.search();
      if (initial) this.list.search.set(initial);
    });

    // Drop selection whenever the visible page changes.
    effect(() => {
      this.list.query();
      this.clearSelection();
    });
  }

  protected toggle(id: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  protected toggleAll(): void {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.rows().map((t) => t.id)));
  }

  protected async applyBulkStatus(): Promise<void> {
    const ids = [...this.selected()];
    const label = TICKET_STATUS[this.bulkStatus()].label;
    const confirmed = await this.confirm.ask({
      title: `Mark ${ids.length} tickets as ${label.toLowerCase()}?`,
      message: 'Customers will see the new status on their tickets.',
      confirmLabel: 'Update status',
    });
    if (!confirmed) return;

    this.bulkSaving.set(true);
    this.ticketsApi.bulkUpdateStatus(ids, this.bulkStatus()).subscribe({
      next: () => {
        this.toast.success(`${ids.length} tickets updated`);
        this.bulkSaving.set(false);
        this.clearSelection();
        this.tickets.reload();
      },
      error: (error) => {
        this.toast.error(error.message);
        this.bulkSaving.set(false);
      },
    });
  }

  protected setStatus(ticket: Ticket, status: TicketStatus): void {
    this.ticketsApi.update(ticket.id, { status }).subscribe({
      next: () => {
        this.toast.success(
          `#${ticket.number} marked as ${TICKET_STATUS[status].label.toLowerCase()}`,
        );
        this.tickets.reload();
      },
      error: (error) => this.toast.error(error.message),
    });
  }

  protected isOverdue(ticket: Ticket): boolean {
    return !!ticket.slaDueAt && Date.parse(ticket.slaDueAt) < Date.now();
  }
}
