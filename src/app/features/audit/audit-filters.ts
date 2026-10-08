import { Component, computed, input } from '@angular/core';
import { ListQueryState } from '../../shared/data/list-query';

export type AuditFilterKeys = { action: string; date: string };

export const AUDIT_ACTIONS = [
  'ticket.update',
  'user.invite',
  'auth.login',
  'article.publish',
  'settings.update',
  'job.retry',
  'user.disable',
];

export const AUDIT_DATE_RANGES: Record<string, { label: string; hours: number }> = {
  '24h': { label: 'Last 24 hours', hours: 24 },
  '7d': { label: 'Last 7 days', hours: 24 * 7 },
  '30d': { label: 'Last 30 days', hours: 24 * 30 },
};

/** Audit filter controls. Inline on desktop, stacked inside the drawer on mobile. */
@Component({
  selector: 'app-audit-filters',
  host: { class: 'contents' },
  template: `
    @let filters = list().filters();

    <label [class]="fieldClass()">
      <span [class]="labelClass()">Action</span>
      <select class="input" [value]="filters.action" (change)="set('action', $event)">
        <option value="">All actions</option>
        @for (action of actions; track action) {
          <option [value]="action">{{ action }}</option>
        }
      </select>
    </label>

    <label [class]="fieldClass()">
      <span [class]="labelClass()">Date</span>
      <select class="input" [value]="filters.date" (change)="set('date', $event)">
        <option value="">Any time</option>
        @for (range of ranges; track range.value) {
          <option [value]="range.value">{{ range.label }}</option>
        }
      </select>
    </label>
  `,
})
export class AuditFilters {
  readonly list = input.required<ListQueryState<AuditFilterKeys>>();
  readonly stacked = input(false);

  protected readonly actions = AUDIT_ACTIONS;
  protected readonly ranges = Object.entries(AUDIT_DATE_RANGES).map(([value, { label }]) => ({
    value,
    label,
  }));

  protected readonly fieldClass = computed(() => (this.stacked() ? 'block' : 'block w-44'));
  protected readonly labelClass = computed(() => (this.stacked() ? 'field-label' : 'sr-only'));

  protected set(key: keyof AuditFilterKeys, event: Event): void {
    this.list().setFilter(key, (event.target as HTMLSelectElement).value);
  }
}
