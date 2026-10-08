import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { AuditApi } from '../../core/api/audit.api';
import { AuditLog } from '../../core/models/audit';
import { Drawer } from '../../shared/components/drawer';
import { EmptyState } from '../../shared/components/empty-state';
import { ErrorState } from '../../shared/components/error-state';
import { FilterChips } from '../../shared/components/filter-chips';
import { PageHeader } from '../../shared/components/page-header';
import { Pagination } from '../../shared/components/pagination';
import { SearchInput } from '../../shared/components/search-input';
import { SkeletonRows } from '../../shared/components/skeleton-rows';
import { ListQueryState } from '../../shared/data/list-query';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { Badge } from '../../shared/ui/badge';
import { Icon } from '../../shared/ui/icon';
import { AUDIT_DATE_RANGES, AuditFilters } from './audit-filters';

@Component({
  selector: 'app-audit-logs',
  imports: [
    DatePipe,
    KeyValuePipe,
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
    RelativeTimePipe,
    AuditFilters,
  ],
  templateUrl: './audit-logs.html',
})
export default class AuditLogs {
  private readonly auditApi = inject(AuditApi);

  protected readonly list = new ListQueryState({ action: '', date: '' }, (key, value) =>
    key === 'action' ? `Action: ${value}` : AUDIT_DATE_RANGES[value].label,
  );

  protected readonly logs = rxResource({
    params: () => {
      const { date, ...query } = this.list.query();
      const hours = AUDIT_DATE_RANGES[date as string]?.hours;
      const from = hours ? new Date(Date.now() - hours * 3_600_000).toISOString() : undefined;
      return { ...query, from };
    },
    stream: ({ params }) => this.auditApi.list(params),
  });

  protected readonly rows = computed(() => this.logs.value()?.items ?? []);
  protected readonly total = computed(() => this.logs.value()?.total ?? 0);
  protected readonly filtersOpen = signal(false);

  protected readonly selected = signal<AuditLog | null>(null);
  protected readonly detailOpen = signal(false);

  protected showDetail(log: AuditLog): void {
    this.selected.set(log);
    this.detailOpen.set(true);
  }
}
