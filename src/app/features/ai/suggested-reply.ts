import { DatePipe, PercentPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AiApi, AiRequest } from '../../core/api/ai.api';
import { TicketsApi } from '../../core/api/tickets.api';
import { toApiError } from '../../core/models/api';
import { Ticket } from '../../core/models/ticket';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { Icon } from '../../shared/ui/icon';
import { AiRunState } from './ai-result-card';

/** Generate → review → edit → explicitly send. Nothing is ever sent automatically. */
@Component({
  selector: 'app-suggested-reply',
  imports: [DatePipe, PercentPipe, RouterLink, Icon],
  host: { class: 'card block' },
  template: `
    @let current = state();

    <div class="flex flex-wrap items-start gap-3 p-4">
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-ink"
      >
        <app-icon name="mail" [size]="18" />
      </span>
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-semibold">Suggested reply</h3>
        <p class="text-xs text-ink-muted">Draft a customer reply you can review and edit.</p>
      </div>
      <button
        type="button"
        class="btn-primary min-h-9 px-3 max-sm:w-full"
        [disabled]="!request() || current.status === 'loading' || sending()"
        (click)="generate()"
      >
        <app-icon name="sparkles" [size]="16" />
        {{ current.status === 'done' ? 'Regenerate' : 'Generate reply' }}
      </button>
    </div>

    <p class="mx-4 flex gap-2 rounded-control bg-info-soft p-3 text-xs text-info">
      <app-icon name="info" [size]="16" />
      AI replies are never sent automatically. Review and edit the draft, then choose “Send reply”
      yourself.
    </p>

    <div class="p-4" aria-live="polite">
      @switch (current.status) {
        @case ('idle') {
          @if (sent(); as sent) {
            <div
              class="flex flex-wrap items-center gap-2 rounded-control bg-brand-soft p-3 text-brand-ink"
            >
              <app-icon name="success" [size]="16" />
              <span>Reply sent to the customer.</span>
              <a [routerLink]="['/tickets', sent.id]" class="link"
                >View ticket #{{ sent.number }}</a
              >
            </div>
          } @else {
            <p class="text-ink-faint">
              {{ request() ? 'No draft yet.' : 'Choose a ticket or paste text first.' }}
            </p>
          }
        }
        @case ('loading') {
          <div class="space-y-2" aria-busy="true">
            <span class="sr-only">Generating a suggested reply…</span>
            <div class="skeleton h-3.5 w-1/3"></div>
            <div class="skeleton h-3.5 w-full"></div>
            <div class="skeleton h-3.5 w-11/12"></div>
            <div class="skeleton h-3.5 w-3/4"></div>
          </div>
        }
        @case ('error') {
          <div class="flex items-start gap-2 text-danger" role="alert">
            <app-icon name="error" [size]="16" class="mt-0.5" />
            <p class="flex-1">{{ current.message }}</p>
            <button type="button" class="link text-xs" (click)="generate()">Try again</button>
          </div>
        }
        @case ('done') {
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label for="reply-draft" class="field-label mb-0">
              Reply draft
              <span class="badge ml-1 bg-brand-soft text-brand-ink">AI-generated</span>
            </label>
            @if (edited()) {
              <span class="text-xs text-ink-muted">Edited by you</span>
            }
          </div>
          <textarea
            id="reply-draft"
            rows="9"
            class="input leading-relaxed"
            [attr.aria-describedby]="ticket() ? 'reply-meta' : 'reply-meta reply-send-hint'"
            [value]="draft()"
            (input)="draft.set($any($event.target).value)"
          ></textarea>
          <dl id="reply-meta" class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
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

          <div class="mt-4 flex flex-wrap items-center justify-end gap-2">
            @if (!ticket()) {
              <p id="reply-send-hint" class="mr-auto text-xs text-ink-muted">
                Select a ticket to send this reply. You can still copy it.
              </p>
            }
            <button type="button" class="btn-ghost" (click)="discard()">Discard</button>
            <button
              type="button"
              class="btn-secondary"
              [disabled]="!draft().trim()"
              (click)="copy()"
            >
              <app-icon name="copy" [size]="16" />
              Copy
            </button>
            <button
              type="button"
              class="btn-primary"
              [disabled]="!ticket() || !draft().trim() || sending()"
              (click)="send()"
            >
              <app-icon name="send" [size]="16" />
              {{ sending() ? 'Sending…' : 'Send reply' }}
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class SuggestedReply {
  private readonly aiApi = inject(AiApi);
  private readonly ticketsApi = inject(TicketsApi);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  /** What the AI should reply to; null while no context is chosen. */
  readonly request = input.required<AiRequest | null>();
  /** Replies can only be sent when the context is a ticket. */
  readonly ticket = input<Ticket>();
  /** Changes whenever the agent switches context; clears the draft. */
  readonly contextKey = input.required<string>();

  protected readonly state = signal<AiRunState>({ status: 'idle' });
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly sent = signal<Pick<Ticket, 'id' | 'number'> | null>(null);

  protected readonly edited = computed(() => {
    const state = this.state();
    return state.status === 'done' && state.result.result !== this.draft();
  });

  private pending?: Subscription;

  constructor() {
    effect(() => {
      this.contextKey();
      untracked(() => this.reset());
    });
    inject(DestroyRef).onDestroy(() => this.pending?.unsubscribe());
  }

  protected async generate(): Promise<void> {
    const request = this.request();
    if (!request) return;
    if (this.edited()) {
      const replace = await this.confirm.ask({
        title: 'Replace your edited draft?',
        message: 'A new suggestion will overwrite the changes you made to this reply.',
        confirmLabel: 'Replace draft',
        destructive: true,
      });
      if (!replace) return;
    }

    this.pending?.unsubscribe();
    this.sent.set(null);
    this.state.set({ status: 'loading' });
    this.pending = this.aiApi.run('reply', request).subscribe({
      next: (result) => {
        this.draft.set(result.result);
        this.state.set({ status: 'done', result });
      },
      error: (error) => this.state.set({ status: 'error', message: toApiError(error).message }),
    });
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.draft());
      this.toast.success('Reply copied to clipboard');
    } catch {
      this.toast.error('Couldn’t copy the reply. Select the text and copy it manually.');
    }
  }

  protected send(): void {
    const ticket = this.ticket();
    const body = this.draft().trim();
    if (!ticket || !body) return;

    this.sending.set(true);
    this.ticketsApi.sendMessage(ticket.id, { body, kind: 'reply', attachmentIds: [] }).subscribe({
      next: () => {
        this.toast.success(`Reply sent on ticket #${ticket.number}`);
        this.sending.set(false);
        this.clearDraft();
        this.sent.set({ id: ticket.id, number: ticket.number });
      },
      error: (error) => {
        this.toast.error(toApiError(error).message);
        this.sending.set(false);
      },
    });
  }

  protected async discard(): Promise<void> {
    if (this.edited()) {
      const confirmed = await this.confirm.ask({
        title: 'Discard this draft?',
        message: 'Your edits to the suggested reply will be lost.',
        confirmLabel: 'Discard',
        destructive: true,
      });
      if (!confirmed) return;
    }
    this.clearDraft();
  }

  private clearDraft(): void {
    this.state.set({ status: 'idle' });
    this.draft.set('');
  }

  private reset(): void {
    this.pending?.unsubscribe();
    this.clearDraft();
    this.sent.set(null);
  }
}
