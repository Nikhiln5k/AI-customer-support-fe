import { Component, input } from '@angular/core';

export type Tone = 'neutral' | 'brand' | 'info' | 'warn' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-subtle text-ink-muted',
  brand: 'bg-brand-soft text-brand-ink',
  info: 'bg-info-soft text-info',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
};

@Component({
  selector: 'app-badge',
  template: `
    <span class="badge" [class]="classes[tone()]">
      @if (dot()) {
        <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      }
      <ng-content />
    </span>
  `,
})
export class Badge {
  readonly tone = input<Tone>('neutral');
  readonly dot = input(false);

  protected readonly classes = TONES;
}
