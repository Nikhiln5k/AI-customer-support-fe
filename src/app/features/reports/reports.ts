import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DateRange, ReportsApi } from '../../core/api/reports.api';
import { BarChart } from '../../shared/charts/bar-chart';
import { StatCard } from '../../shared/charts/stat-card';
import { EmptyState } from '../../shared/components/empty-state';
import { ErrorState } from '../../shared/components/error-state';
import { PageHeader } from '../../shared/components/page-header';

const average = (values: number[]) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

@Component({
  selector: 'app-reports',
  imports: [PageHeader, StatCard, BarChart, EmptyState, ErrorState],
  templateUrl: './reports.html',
})
export default class Reports {
  private readonly reportsApi = inject(ReportsApi);

  protected readonly range = signal<DateRange>('30d');
  protected readonly ranges: { value: DateRange; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
  ];

  protected readonly report = rxResource({
    params: () => this.range(),
    stream: ({ params }) => this.reportsApi.reports(params),
  });

  protected readonly totalVolume = computed(() =>
    (this.report.value()?.volume ?? []).reduce((sum, d) => sum + d.value, 0),
  );

  protected readonly avgResolution = computed(() =>
    average((this.report.value()?.resolutionHours ?? []).map((d) => d.value)).toFixed(1),
  );

  protected readonly avgResponse = computed(() =>
    Math.round(average((this.report.value()?.responseMinutes ?? []).map((d) => d.value))),
  );

  /** Workload rows with bar widths relative to the busiest agent. */
  protected readonly workload = computed(() => {
    const rows = this.report.value()?.workload ?? [];
    const peak = Math.max(1, ...rows.map((r) => r.resolved + r.open));
    return rows.map((row) => ({
      ...row,
      resolvedPct: (row.resolved / peak) * 100,
      openPct: (row.open / peak) * 100,
    }));
  });
}
