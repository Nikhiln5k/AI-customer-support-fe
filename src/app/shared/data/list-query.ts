import { WritableSignal, computed, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { ListQuery } from '../../core/models/api';
import { FilterChip } from '../components/filter-chips';

export type Filters = Record<string, string>;

/**
 * Search, filter, sort and paging state shared by every list page.
 * Must be created in an injection context (e.g. a component field).
 */
export class ListQueryState<F extends Filters> {
  readonly search = signal('');
  readonly filters: WritableSignal<F>;
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sort = signal<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  private readonly debouncedSearch = toSignal(toObservable(this.search).pipe(debounceTime(300)), {
    initialValue: '',
  });

  readonly query = computed<ListQuery>(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
    search: this.debouncedSearch().trim() || undefined,
    sort: this.sort()?.field,
    direction: this.sort()?.direction,
    ...this.filters(),
  }));

  readonly activeFilterCount = computed(() => Object.values(this.filters()).filter(Boolean).length);

  readonly chips = computed<FilterChip[]>(() =>
    Object.entries(this.filters())
      .filter(([, value]) => value)
      .map(([key, value]) => ({ key, label: this.describe(key, value) })),
  );

  private readonly emptyFilters: F;
  private readonly describe: (key: keyof F, value: string) => string;

  /** `describe` turns a filter value into a chip label, e.g. an id into a name. */
  constructor(emptyFilters: F, describe?: (key: keyof F, value: string) => string) {
    this.emptyFilters = emptyFilters;
    this.describe = describe ?? ((_, value) => value);
    this.filters = signal(emptyFilters);
    toObservable(this.debouncedSearch).subscribe(() => this.page.set(1));
  }

  setFilter(key: keyof F, value: string): void {
    this.filters.update((filters) => ({ ...filters, [key]: value }));
    this.page.set(1);
  }

  clearFilter(key: string): void {
    this.setFilter(key, '');
  }

  clearAll(): void {
    this.filters.set(this.emptyFilters);
    this.search.set('');
    this.page.set(1);
  }

  toggleSort(field: string): void {
    const current = this.sort();
    if (current?.field !== field) this.sort.set({ field, direction: 'asc' });
    else if (current.direction === 'asc') this.sort.set({ field, direction: 'desc' });
    else this.sort.set(null);
  }

  sortState(field: string): 'ascending' | 'descending' | 'none' {
    const current = this.sort();
    if (current?.field !== field) return 'none';
    return current.direction === 'asc' ? 'ascending' : 'descending';
  }
}
