import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CustomersApi } from '../../../core/api/customers.api';
import { AuthService } from '../../../core/services/auth.service';
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
import { Avatar } from '../../../shared/ui/avatar';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { Menu } from '../../../shared/ui/menu';

@Component({
  selector: 'app-customer-list',
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
    Avatar,
    Badge,
    Icon,
    Menu,
    RelativeTimePipe,
  ],
  templateUrl: './customer-list.html',
})
export default class CustomerList {
  private readonly customersApi = inject(CustomersApi);
  protected readonly canEdit = inject(AuthService).hasRole('admin', 'agent');

  protected readonly list = new ListQueryState({ company: '' }, (_, value) => value);

  // The mock API has no companies endpoint, so derive the filter options from one large page.
  protected readonly companies = rxResource({
    stream: () =>
      this.customersApi
        .list({ page: 1, pageSize: 200 })
        .pipe(map((page) => [...new Set(page.items.map((c) => c.company).filter(Boolean))].sort())),
    defaultValue: [],
  });

  protected readonly customers = rxResource({
    params: () => this.list.query(),
    stream: ({ params }) => this.customersApi.list(params),
  });

  protected readonly rows = computed(() => this.customers.value()?.items ?? []);
  protected readonly total = computed(() => this.customers.value()?.total ?? 0);
  protected readonly filtersOpen = signal(false);

  protected setCompany(event: Event): void {
    this.list.setFilter('company', (event.target as HTMLSelectElement).value);
  }
}
