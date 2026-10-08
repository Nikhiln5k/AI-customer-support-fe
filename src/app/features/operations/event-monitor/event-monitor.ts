import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, interval, switchMap } from 'rxjs';
import { OperationsApi } from '../../../core/api/operations.api';
import { BrokerEvent } from '../../../core/models/operations';
import { EmptyState } from '../../../shared/components/empty-state';
import { ErrorState } from '../../../shared/components/error-state';
import { Pagination } from '../../../shared/components/pagination';
import { SearchInput } from '../../../shared/components/search-input';
import { SkeletonRows } from '../../../shared/components/skeleton-rows';
import { ListQueryState } from '../../../shared/data/list-query';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { Label, toOptions } from '../../../shared/ui/labels';

const EVENT_STATUS: Record<BrokerEvent['status'], Label> = {
  delivered: { label: 'Delivered', tone: 'info' },
  acked: { label: 'Acked', tone: 'brand' },
  nacked: { label: 'Nacked', tone: 'warn' },
  dead_lettered: { label: 'Dead-lettered', tone: 'danger' },
};

const AUTO_REFRESH_MS = 10_000;

@Component({
  selector: 'app-event-monitor',
  imports: [
    DatePipe,
    SearchInput,
    Pagination,
    SkeletonRows,
    EmptyState,
    ErrorState,
    Badge,
    Icon,
    RelativeTimePipe,
  ],
  templateUrl: './event-monitor.html',
})
export default class EventMonitor {
  private readonly api = inject(OperationsApi);

  protected readonly statusLabels = EVENT_STATUS;
  protected readonly statusOptions = toOptions(EVENT_STATUS);

  protected readonly list = new ListQueryState(
    { status: '' },
    (_, value) => EVENT_STATUS[value as BrokerEvent['status']].label,
  );

  protected readonly events = rxResource({
    params: () => this.list.query(),
    stream: ({ params }) => this.api.events(params),
  });

  protected readonly rows = computed(() => this.events.value()?.items ?? []);
  protected readonly total = computed(() => this.events.value()?.total ?? 0);
  protected readonly autoRefresh = signal(false);

  constructor() {
    toObservable(this.autoRefresh)
      .pipe(
        switchMap((enabled) => (enabled ? interval(AUTO_REFRESH_MS) : EMPTY)),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.events.reload());
  }

  protected setStatus(event: Event): void {
    this.list.setFilter('status', (event.target as HTMLSelectElement).value);
  }

  protected toggleAutoRefresh(event: Event): void {
    this.autoRefresh.set((event.target as HTMLInputElement).checked);
  }
}
