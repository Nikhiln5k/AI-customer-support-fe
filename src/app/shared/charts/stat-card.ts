import { Component, input } from '@angular/core';
import { Icon, IconName } from '../ui/icon';

@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  host: { class: 'card block p-4' },
  template: `
    <div class="flex items-center justify-between gap-2 text-ink-muted">
      <p class="text-xs font-medium">{{ label() }}</p>
      @if (icon(); as icon) {
        <app-icon [name]="icon" [size]="16" />
      }
    </div>
    @if (loading()) {
      <div class="skeleton mt-3 h-7 w-20"></div>
      <div class="skeleton mt-2 h-3 w-28"></div>
    } @else {
      <p class="mt-2 text-2xl font-semibold tracking-tight text-ink">{{ value() }}</p>
      @if (hint()) {
        <p class="mt-1 text-xs" [class]="warn() ? 'font-medium text-warn' : 'text-ink-muted'">
          {{ hint() }}
        </p>
      }
    }
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input<string | number>('');
  readonly hint = input('');
  readonly icon = input<IconName>();
  readonly warn = input(false);
  readonly loading = input(false);
}
