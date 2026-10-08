import { Component, inject, input, output, signal } from '@angular/core';
import { AiApi } from '../../../core/api/ai.api';
import { AiAction, AiResult } from '../../../core/models/ai';
import { ApiError } from '../../../core/models/api';
import { Icon } from '../../../shared/ui/icon';

interface ActionState {
  loading: boolean;
  result?: AiResult;
  error?: string;
}

const ACTIONS: { action: AiAction; label: string }[] = [
  { action: 'summarize', label: 'Summarize' },
  { action: 'sentiment', label: 'Sentiment' },
  { action: 'classify', label: 'Classify' },
  { action: 'priority', label: 'Priority' },
  { action: 'action_items', label: 'Action items' },
  { action: 'reply', label: 'Suggest reply' },
];

/** AI suggestions for the open ticket. Nothing here is applied without the agent's action. */
@Component({
  selector: 'app-ticket-ai-panel',
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <div class="flex items-center gap-2">
      <app-icon name="sparkles" class="text-brand" />
      <h2 class="text-sm">AI assistance</h2>
    </div>
    <p class="mt-1 text-xs text-ink-muted">Suggestions only. Review before using them.</p>

    <div class="mt-3 flex flex-wrap gap-1.5">
      @for (item of actions; track item.action) {
        <button
          type="button"
          class="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-brand hover:text-brand-ink disabled:opacity-60 max-md:min-h-9"
          [disabled]="state()[item.action]?.loading"
          (click)="run(item.action)"
        >
          {{ state()[item.action]?.loading ? 'Working…' : item.label }}
        </button>
      }
    </div>

    <div class="mt-3 space-y-2" aria-live="polite">
      @for (item of actions; track item.action) {
        @let current = state()[item.action];
        @if (current?.loading) {
          <div class="rounded-control bg-subtle p-3" aria-busy="true">
            <div class="skeleton h-3 w-1/3 bg-line"></div>
            <div class="skeleton mt-2 h-3 bg-line"></div>
          </div>
        } @else if (current?.error) {
          <p class="rounded-control bg-danger-soft p-3 text-xs text-danger" role="alert">
            {{ item.label }}: {{ current!.error }}
            <button type="button" class="link ml-1 text-xs" (click)="run(item.action)">
              Retry
            </button>
          </p>
        } @else if (current?.result; as result) {
          <article class="rounded-control border border-line bg-canvas p-3">
            <header class="mb-1 flex items-center justify-between gap-2 text-xs">
              <span class="font-semibold text-ink">{{ item.label }}</span>
              @if (result.confidence !== null) {
                <span class="text-ink-muted"
                  >{{ (result.confidence * 100).toFixed(0) }}% confidence</span
                >
              }
            </header>
            <p class="text-sm whitespace-pre-line">{{ result.result }}</p>
            @if (result.items?.length) {
              <ul class="mt-2 list-disc space-y-1 pl-4 text-sm">
                @for (entry of result.items; track entry) {
                  <li>{{ entry }}</li>
                }
              </ul>
            }
            <p class="mt-2 text-[11px] text-ink-faint">Based on {{ result.sources.join(', ') }}</p>
            @if (item.action === 'reply') {
              <button
                type="button"
                class="btn-secondary mt-2 min-h-9 w-full"
                (click)="useReply.emit(result.result)"
              >
                <app-icon name="edit" [size]="14" />
                Edit in composer
              </button>
            }
          </article>
        }
      }
    </div>
  `,
})
export class TicketAiPanel {
  private readonly api = inject(AiApi);

  readonly ticketId = input.required<string>();
  readonly useReply = output<string>();

  protected readonly actions = ACTIONS;
  protected readonly state = signal<Partial<Record<AiAction, ActionState>>>({});

  protected run(action: AiAction): void {
    this.patch(action, { loading: true });
    this.api.run(action, { ticketId: this.ticketId() }).subscribe({
      next: (result) => this.patch(action, { loading: false, result }),
      error: (error: ApiError) => this.patch(action, { loading: false, error: error.message }),
    });
  }

  private patch(action: AiAction, value: ActionState): void {
    this.state.update((current) => ({ ...current, [action]: value }));
  }
}
