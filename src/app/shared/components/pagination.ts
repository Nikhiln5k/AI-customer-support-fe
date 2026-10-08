import { Component, computed, input, model } from '@angular/core';
import { Icon } from '../ui/icon';

@Component({
  selector: 'app-pagination',
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-ink-muted"
    >
      <p aria-live="polite">
        @if (total()) {
          Showing <span class="font-medium text-ink">{{ from() }}–{{ to() }}</span> of
          <span class="font-medium text-ink">{{ total() }}</span>
        } @else {
          No results
        }
      </p>

      <div class="flex items-center gap-3">
        <label class="hidden items-center gap-2 sm:flex">
          Rows
          <select
            class="input min-h-8 w-auto py-0 pr-8"
            [value]="pageSize()"
            (change)="changeSize($event)"
          >
            @for (size of sizes; track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </label>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="btn-icon"
            aria-label="Previous page"
            [disabled]="page() <= 1"
            (click)="page.set(page() - 1)"
          >
            <app-icon name="chevron-left" />
          </button>
          <span class="min-w-16 text-center">{{ page() }} / {{ pages() }}</span>
          <button
            type="button"
            class="btn-icon"
            aria-label="Next page"
            [disabled]="page() >= pages()"
            (click)="page.set(page() + 1)"
          >
            <app-icon name="chevron-right" />
          </button>
        </div>
      </div>
    </div>
  `,
})
export class Pagination {
  readonly page = model.required<number>();
  readonly pageSize = model.required<number>();
  readonly total = input.required<number>();

  protected readonly sizes = [10, 25, 50];
  protected readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly from = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly to = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  protected changeSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(1);
  }
}
