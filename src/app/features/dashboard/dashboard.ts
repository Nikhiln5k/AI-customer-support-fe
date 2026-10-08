import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DateRange, ReportsApi } from '../../core/api/reports.api';
import { TicketsApi } from '../../core/api/tickets.api';
import { AuthService } from '../../core/services/auth.service';
import { LineChart, LineSeries } from '../../shared/charts/line-chart';
import { StatCard } from '../../shared/charts/stat-card';
import { EmptyState } from '../../shared/components/empty-state';
import { ErrorState } from '../../shared/components/error-state';
import { PageHeader } from '../../shared/components/page-header';
import { SkeletonRows } from '../../shared/components/skeleton-rows';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { Badge } from '../../shared/ui/badge';
import { TICKET_PRIORITY, TICKET_STATUS } from '../../shared/ui/labels';

const DAY_FORMAT = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    PageHeader,
    StatCard,
    LineChart,
    SkeletonRows,
    ErrorState,
    EmptyState,
    Badge,
    RelativeTimePipe,
  ],
  templateUrl: './dashboard.html',
})
export default class Dashboard {
  private readonly reportsApi = inject(ReportsApi);
  private readonly ticketsApi = inject(TicketsApi);
  private readonly auth = inject(AuthService);

  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');

  protected readonly range = signal<DateRange>('7d');
  protected readonly statusLabels = TICKET_STATUS;
  protected readonly priorityLabels = TICKET_PRIORITY;

  protected readonly summary = rxResource({
    params: () => this.range(),
    stream: ({ params }) => this.reportsApi.dashboard(params),
  });

  protected readonly recentTickets = rxResource({
    stream: () =>
      this.ticketsApi.list({ page: 1, pageSize: 5, sort: 'updatedAt', direction: 'desc' }),
  });

  protected readonly trendLabels = computed(() =>
    (this.summary.value()?.trend ?? []).map((p) => DAY_FORMAT.format(new Date(p.date))),
  );

  protected readonly trendSeries = computed<LineSeries[]>(() => {
    const trend = this.summary.value()?.trend ?? [];
    return [
      { name: 'Created', color: 'var(--color-chart-1)', values: trend.map((p) => p.created) },
      { name: 'Resolved', color: 'var(--color-chart-2)', values: trend.map((p) => p.resolved) },
    ];
  });

  protected readonly slaSegments = computed(() => {
    const sla = this.summary.value()?.sla;
    if (!sla) return [];
    const total = sla.onTrack + sla.atRisk + sla.breached || 1;
    return [
      { label: 'On track', value: sla.onTrack, color: 'bg-brand' },
      { label: 'At risk', value: sla.atRisk, color: 'bg-warn' },
      { label: 'Breached', value: sla.breached, color: 'bg-danger' },
    ].map((segment) => ({ ...segment, percent: Math.round((segment.value / total) * 100) }));
  });

  protected readonly ranges: { value: DateRange; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
  ];
}
