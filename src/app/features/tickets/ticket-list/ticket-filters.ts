import { Component, computed, input } from '@angular/core';
import { User } from '../../../core/models/user';
import { ListQueryState } from '../../../shared/data/list-query';
import { TICKET_PRIORITY, TICKET_STATUS, toOptions } from '../../../shared/ui/labels';

type TicketFilterKeys = { status: string; priority: string; assigneeId: string; updated: string };

/** Ticket filter controls. Inline on desktop, stacked inside the drawer on mobile. */
@Component({
  selector: 'app-ticket-filters',
  host: { class: 'contents' },
  template: `
    @let filters = list().filters();

    <label [class]="fieldClass()">
      <span [class]="labelClass()">Status</span>
      <select class="input" [value]="filters.status" (change)="set('status', $event)">
        <option value="">All statuses</option>
        @for (option of statuses; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </label>

    <label [class]="fieldClass()">
      <span [class]="labelClass()">Priority</span>
      <select class="input" [value]="filters.priority" (change)="set('priority', $event)">
        <option value="">All priorities</option>
        @for (option of priorities; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </label>

    <label [class]="fieldClass()">
      <span [class]="labelClass()">Assignee</span>
      <select class="input" [value]="filters.assigneeId" (change)="set('assigneeId', $event)">
        <option value="">Anyone</option>
        @for (agent of agents(); track agent.id) {
          <option [value]="agent.id">{{ agent.name }}</option>
        }
      </select>
    </label>

    <label [class]="fieldClass()">
      <span [class]="labelClass()">Updated</span>
      <select class="input" [value]="filters.updated" (change)="set('updated', $event)">
        <option value="">Any time</option>
        <option value="24h">Last 24 hours</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
      </select>
    </label>
  `,
})
export class TicketFilters {
  readonly list = input.required<ListQueryState<TicketFilterKeys>>();
  readonly agents = input.required<User[]>();
  readonly stacked = input(false);

  protected readonly statuses = toOptions(TICKET_STATUS);
  protected readonly priorities = toOptions(TICKET_PRIORITY);

  protected readonly fieldClass = computed(() => (this.stacked() ? 'block' : 'block w-40'));
  protected readonly labelClass = computed(() => (this.stacked() ? 'field-label' : 'sr-only'));

  protected set(key: keyof TicketFilterKeys, event: Event): void {
    this.list().setFilter(key, (event.target as HTMLSelectElement).value);
  }
}
