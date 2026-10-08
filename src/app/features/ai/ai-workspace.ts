import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AiApi, AiRequest } from '../../core/api/ai.api';
import { TicketsApi } from '../../core/api/tickets.api';
import { AiAction } from '../../core/models/ai';
import { toApiError } from '../../core/models/api';
import { PageHeader } from '../../shared/components/page-header';
import { Badge } from '../../shared/ui/badge';
import { Icon } from '../../shared/ui/icon';
import { TICKET_PRIORITY, TICKET_STATUS } from '../../shared/ui/labels';
import { AiActionMeta, AiResultCard, AiRunState } from './ai-result-card';
import { SuggestedReply } from './suggested-reply';

type AnalysisAction = Exclude<AiAction, 'reply'>;

const ACTIONS: Record<AnalysisAction, AiActionMeta> = {
  summarize: { label: 'Summarize', description: 'Key points of the conversation.', icon: 'note' },
  classify: { label: 'Classify', description: 'Suggested category for routing.', icon: 'filter' },
  sentiment: {
    label: 'Detect sentiment',
    description: 'How the customer is feeling.',
    icon: 'activity',
  },
  priority: { label: 'Suggest priority', description: 'Recommended urgency level.', icon: 'alert' },
  action_items: {
    label: 'Extract action items',
    description: 'Follow-ups for the team.',
    icon: 'check',
  },
};

const MIN_TEXT_LENGTH = 20;

const idleStates = (): Record<AnalysisAction, AiRunState> => ({
  summarize: { status: 'idle' },
  classify: { status: 'idle' },
  sentiment: { status: 'idle' },
  priority: { status: 'idle' },
  action_items: { status: 'idle' },
});

@Component({
  selector: 'app-ai-workspace',
  imports: [RouterLink, PageHeader, Badge, Icon, AiResultCard, SuggestedReply],
  templateUrl: './ai-workspace.html',
})
export default class AiWorkspace {
  private readonly aiApi = inject(AiApi);
  private readonly ticketsApi = inject(TicketsApi);

  /** Preselects a ticket, e.g. when opened from the ticket detail page (`?ticketId=`). */
  readonly ticketId = input<string>();

  protected readonly actions = Object.entries(ACTIONS) as [AnalysisAction, AiActionMeta][];
  protected readonly statusLabels = TICKET_STATUS;
  protected readonly priorityLabels = TICKET_PRIORITY;
  protected readonly minTextLength = MIN_TEXT_LENGTH;

  protected readonly modes = [
    { value: 'ticket', label: 'Ticket' },
    { value: 'text', label: 'Paste text' },
  ] as const;
  protected readonly mode = signal<'ticket' | 'text'>('ticket');
  protected readonly selectedId = linkedSignal(() => this.ticketId() ?? '');
  protected readonly text = signal('');

  protected readonly openTickets = rxResource({
    stream: () => this.ticketsApi.list({ page: 1, pageSize: 25, status: 'open' }),
  });

  private readonly selectedTicket = rxResource({
    params: () => (this.mode() === 'ticket' ? this.selectedId() || undefined : undefined),
    stream: ({ params }) => this.ticketsApi.get(params),
  });

  protected readonly ticket = computed(() => {
    const ticket = this.selectedTicket.hasValue() ? this.selectedTicket.value() : undefined;
    return this.mode() === 'ticket' && ticket?.id === this.selectedId() ? ticket : undefined;
  });

  /** Open tickets, plus a preselected ticket that isn't in that list. */
  protected readonly ticketOptions = computed(() => {
    const list = this.openTickets.hasValue() ? this.openTickets.value().items : [];
    const ticket = this.ticket();
    return ticket && !list.some((t) => t.id === ticket.id) ? [ticket, ...list] : list;
  });

  protected readonly request = computed<AiRequest | null>(() => {
    if (this.mode() === 'ticket') return this.selectedId() ? { ticketId: this.selectedId() } : null;
    const text = this.text().trim();
    return text.length >= MIN_TEXT_LENGTH ? { text } : null;
  });

  protected readonly contextKey = computed(() =>
    this.mode() === 'ticket' ? `ticket:${this.selectedId()}` : 'text',
  );

  protected readonly states = signal(idleStates());
  protected readonly anyRunning = computed(() =>
    Object.values(this.states()).some((state) => state.status === 'loading'),
  );

  private readonly running = new Map<AnalysisAction, Subscription>();

  constructor() {
    // Results belong to one context; switching context starts fresh.
    effect(() => {
      this.contextKey();
      untracked(() => this.resetResults());
    });
    inject(DestroyRef).onDestroy(() => this.running.forEach((sub) => sub.unsubscribe()));
  }

  protected selectTicket(event: Event): void {
    this.selectedId.set((event.target as HTMLSelectElement).value);
  }

  protected run(action: AnalysisAction): void {
    const request = this.request();
    if (!request) return;

    this.running.get(action)?.unsubscribe();
    this.setState(action, { status: 'loading' });
    this.running.set(
      action,
      this.aiApi.run(action, request).subscribe({
        next: (result) => this.setState(action, { status: 'done', result }),
        error: (error) =>
          this.setState(action, { status: 'error', message: toApiError(error).message }),
      }),
    );
  }

  protected runAll(): void {
    for (const [action] of this.actions) this.run(action);
  }

  private setState(action: AnalysisAction, state: AiRunState): void {
    this.states.update((states) => ({ ...states, [action]: state }));
  }

  private resetResults(): void {
    this.running.forEach((sub) => sub.unsubscribe());
    this.running.clear();
    this.states.set(idleStates());
  }
}
