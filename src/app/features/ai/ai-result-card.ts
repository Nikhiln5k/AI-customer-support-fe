import { DatePipe, PercentPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { AiResult } from '../../core/models/ai';
import { Icon, IconName } from '../../shared/ui/icon';

export interface AiActionMeta {
  label: string;
  description: string;
  icon: IconName;
}

export type AiRunState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: AiResult }
  | { status: 'error'; message: string };

/** One AI action: run button plus its result, confidence, sources and timestamp. */
@Component({
  selector: 'app-ai-result-card',
  imports: [DatePipe, PercentPipe, Icon],
  host: { class: 'card flex flex-col' },
  template: `
    @let current = state();

    <div class="flex items-start gap-3 p-4">
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-ink"
      >
        <app-icon [name]="meta().icon" [size]="18" />
      </span>
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-semibold">{{ meta().label }}</h3>
        <p class="text-xs text-ink-muted">{{ meta().description }}</p>
      </div>
      <button
        type="button"
        class="btn-secondary min-h-9 px-3"
        [disabled]="disabled() || current.status === 'loading'"
        (click)="run.emit()"
      >
        {{ current.status === 'done' ? 'Rerun' : 'Run' }}
        <span class="sr-only">{{ meta().label }}</span>
      </button>
    </div>

    <div class="flex-1 border-t border-line p-4" aria-live="polite">
      @switch (current.status) {
        @case ('idle') {
          <p class="text-ink-faint">
            {{ disabled() ? 'Choose a ticket or paste text first.' : 'Not run yet.' }}
          </p>
        }
        @case ('loading') {
          <div class="space-y-2" aria-busy="true">
            <span class="sr-only">Generating {{ meta().label }}…</span>
            <div class="skeleton h-3.5 w-full"></div>
            <div class="skeleton h-3.5 w-4/5"></div>
          </div>
        }
        @case ('error') {
          <div class="flex items-start gap-2 text-danger" role="alert">
            <app-icon name="error" [size]="16" class="mt-0.5" />
            <p class="flex-1">{{ current.message }}</p>
            <button type="button" class="link text-xs" (click)="run.emit()">Try again</button>
          </div>
        }
        @case ('done') {
          <p class="leading-relaxed whitespace-pre-line">{{ current.result.result }}</p>
          @if (current.result.items?.length) {
            <ul class="mt-2 list-disc space-y-1 pl-5">
              @for (item of current.result.items; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          }
          <dl class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            @if (current.result.confidence !== null) {
              <div class="flex gap-1">
                <dt>Confidence</dt>
                <dd class="font-medium text-ink">{{ current.result.confidence | percent }}</dd>
              </div>
            }
            @if (current.result.sources.length) {
              <div class="flex gap-1">
                <dt>Based on</dt>
                <dd>{{ current.result.sources.join(', ') }}</dd>
              </div>
            }
            <div class="flex gap-1">
              <dt>Generated</dt>
              <dd>
                <time [attr.datetime]="current.result.generatedAt">
                  {{ current.result.generatedAt | date: 'shortTime' }}
                </time>
              </dd>
            </div>
          </dl>
        }
      }
    </div>
  `,
})
export class AiResultCard {
  readonly meta = input.required<AiActionMeta>();
  readonly state = input.required<AiRunState>();
  readonly disabled = input(false);
  readonly run = output();
}
