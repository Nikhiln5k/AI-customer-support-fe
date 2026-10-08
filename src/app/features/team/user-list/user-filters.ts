import { Component, computed, input } from '@angular/core';
import { ListQueryState } from '../../../shared/data/list-query';
import { ROLE_LABEL, USER_STATUS, toOptions } from '../../../shared/ui/labels';

export type UserFilterKeys = { role: string; status: string };

/** Role and status filters. Inline on desktop, stacked inside the drawer on mobile. */
@Component({
  selector: 'app-user-filters',
  host: { class: 'contents' },
  template: `
    @let filters = list().filters();

    <label [class]="fieldClass()">
      <span [class]="labelClass()">Role</span>
      <select class="input" [value]="filters.role" (change)="set('role', $event)">
        <option value="">All roles</option>
        @for (option of roles; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
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
export class UserFilters {
  readonly list = input.required<ListQueryState<UserFilterKeys>>();
  readonly stacked = input(false);

  protected readonly roles = toOptions(ROLE_LABEL);
  protected readonly statuses = toOptions(USER_STATUS);

  protected readonly fieldClass = computed(() => (this.stacked() ? 'block' : 'block w-40'));
  protected readonly labelClass = computed(() => (this.stacked() ? 'field-label' : 'sr-only'));

  protected set(key: keyof UserFilterKeys, event: Event): void {
    this.list().setFilter(key, (event.target as HTMLSelectElement).value);
  }
}
