import { Component, input } from '@angular/core';
import { Icon, IconName } from '../ui/icon';

@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center px-6 py-12 text-center">
      <span
        class="mb-3 flex size-11 items-center justify-center rounded-full bg-subtle text-ink-muted"
      >
        <app-icon [name]="icon()" [size]="22" />
      </span>
      <h2 class="text-base">{{ title() }}</h2>
      @if (message()) {
        <p class="mt-1 max-w-sm text-ink-muted">{{ message() }}</p>
      }
      <div class="mt-4 empty:hidden">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input('');
  readonly icon = input<IconName>('inbox');
}
