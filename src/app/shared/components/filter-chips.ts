import { Component, input, output } from '@angular/core';
import { Icon } from '../ui/icon';

export interface FilterChip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-filter-chips',
  imports: [Icon],
  host: { class: 'contents' },
  template: `
    @if (chips().length) {
      <ul class="flex flex-wrap items-center gap-2" aria-label="Active filters">
        @for (chip of chips(); track chip.key) {
          <li
            class="inline-flex items-center gap-1 rounded-md border border-line bg-subtle py-1 pr-1 pl-2 text-xs font-medium text-ink"
          >
            {{ chip.label }}
            <button
              type="button"
              class="rounded p-0.5 text-ink-muted hover:bg-line hover:text-ink"
              [attr.aria-label]="'Remove filter ' + chip.label"
              (click)="remove.emit(chip.key)"
            >
              <app-icon name="close" [size]="14" />
            </button>
          </li>
        }
        <li>
          <button type="button" class="link text-xs" (click)="clear.emit()">Clear filters</button>
        </li>
      </ul>
    }
  `,
})
export class FilterChips {
  readonly chips = input.required<FilterChip[]>();
  readonly remove = output<string>();
  readonly clear = output();
}
