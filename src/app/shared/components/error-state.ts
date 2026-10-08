import { Component, computed, input, output } from '@angular/core';
import { ApiError, toApiError } from '../../core/models/api';
import { Icon } from '../ui/icon';

/** Error panel with retry. Shows a permission-denied variant for 403 responses. */
@Component({
  selector: 'app-error-state',
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center px-6 py-12 text-center" role="alert">
      <span
        class="mb-3 flex size-11 items-center justify-center rounded-full"
        [class]="forbidden() ? 'bg-warn-soft text-warn' : 'bg-danger-soft text-danger'"
      >
        <app-icon [name]="forbidden() ? 'lock' : 'alert'" [size]="22" />
      </span>
      <h2 class="text-base">
        {{ forbidden() ? 'You don’t have access' : 'Couldn’t load this data' }}
      </h2>
      <p class="mt-1 max-w-sm text-ink-muted">
        {{
          forbidden() ? 'Ask an administrator if you need access to this area.' : apiError().message
        }}
      </p>
      @if (!forbidden()) {
        <button type="button" class="btn-secondary mt-4" (click)="retry.emit()">
          <app-icon name="refresh" [size]="16" />
          Try again
        </button>
      }
    </div>
  `,
})
export class ErrorState {
  readonly error = input.required<unknown>();
  readonly retry = output();

  protected readonly apiError = computed<ApiError>(() => toApiError(this.error()));
  protected readonly forbidden = computed(() => this.apiError().status === 403);
}
