import { PercentPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { KnowledgeApi } from '../../../core/api/knowledge.api';
import { ErrorState } from '../../../shared/components/error-state';
import { FieldError } from '../../../shared/components/field-error';
import { PageHeader } from '../../../shared/components/page-header';
import { Icon } from '../../../shared/ui/icon';

const SUGGESTIONS = [
  'How do I reset two-factor authentication for a user?',
  'A customer wants a refund for last month. What is the process?',
  'Webhook deliveries are failing. How can they be retried?',
];

@Component({
  selector: 'app-knowledge-ask',
  imports: [FormField, FormRoot, RouterLink, PercentPipe, PageHeader, ErrorState, FieldError, Icon],
  templateUrl: './knowledge-ask.html',
})
export default class KnowledgeAsk {
  private readonly knowledgeApi = inject(KnowledgeApi);

  /** Optional question prefilled from the list search (`?q=`). */
  readonly q = input<string>();

  protected readonly suggestions = SUGGESTIONS;

  /** The question the current answer belongs to; drives the request. */
  protected readonly asked = signal<string | undefined>(undefined);

  protected readonly questionForm = form(
    signal({ question: '' }),
    (path) => required(path.question, { message: 'Type a question to ask' }),
    {
      submission: {
        action: async (field) => {
          this.ask(field.question().value());
          return undefined;
        },
      },
    },
  );

  protected readonly answer = rxResource({
    params: () => this.asked(),
    stream: ({ params }) => this.knowledgeApi.ask(params),
  });

  protected readonly result = computed(() =>
    this.answer.hasValue() ? this.answer.value() : undefined,
  );

  constructor() {
    effect(() => {
      const initial = this.q()?.trim();
      if (initial) untracked(() => this.useSuggestion(initial));
    });
  }

  protected useSuggestion(question: string): void {
    this.questionForm.question().value.set(question);
    this.ask(question);
  }

  private ask(question: string): void {
    const trimmed = question.trim();
    if (!trimmed) return;
    if (trimmed === this.asked()) this.answer.reload();
    else this.asked.set(trimmed);
  }
}
