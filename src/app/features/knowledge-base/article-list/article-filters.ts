import { Component, computed, input } from '@angular/core';
import { ListQueryState } from '../../../shared/data/list-query';
import { ARTICLE_STATUS, toOptions } from '../../../shared/ui/labels';

export type ArticleFilterKeys = { category: string; status: string };

/** Article filter controls. Inline on desktop, stacked inside the drawer on mobile. */
@Component({
  selector: 'app-article-filters',
  host: { class: 'contents' },
  template: `
    @let filters = list().filters();

    <label [class]="fieldClass()">
      <span [class]="labelClass()">Category</span>
      <select class="input" [value]="filters.category" (change)="set('category', $event)">
        <option value="">All categories</option>
        @for (category of categories(); track category) {
          <option [value]="category" [selected]="category === filters.category">
            {{ category }}
          </option>
        }
      </select>
    </label>

    <label [class]="fieldClass()">
      <span [class]="labelClass()">Status</span>
      <select class="input" [value]="filters.status" (change)="set('status', $event)">
        <option value="">All statuses</option>
        @for (option of statuses; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </label>
  `,
})
export class ArticleFilters {
  readonly list = input.required<ListQueryState<ArticleFilterKeys>>();
  readonly categories = input.required<string[]>();
  readonly stacked = input(false);

  protected readonly statuses = toOptions(ARTICLE_STATUS);

  protected readonly fieldClass = computed(() => (this.stacked() ? 'block' : 'block w-44'));
  protected readonly labelClass = computed(() => (this.stacked() ? 'field-label' : 'sr-only'));

  protected set(key: keyof ArticleFilterKeys, event: Event): void {
    this.list().setFilter(key, (event.target as HTMLSelectElement).value);
  }
}
