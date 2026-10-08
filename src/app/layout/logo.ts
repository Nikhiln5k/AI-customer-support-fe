import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <span
      class="flex size-8 shrink-0 items-center justify-center rounded-lg"
      [class]="inverse() ? 'bg-white text-brand-ink' : 'bg-brand text-white'"
      aria-hidden="true"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 19V5l14 14V5" />
      </svg>
    </span>
    @if (!compact()) {
      <span
        class="text-base font-semibold tracking-tight"
        [class]="inverse() ? 'text-white' : 'text-ink'"
      >
        Nexus<span [class]="inverse() ? 'text-white/70' : 'text-brand'">AI</span>
      </span>
    }
  `,
})
export class Logo {
  readonly compact = input(false);
  /** Light variant for dark backgrounds. */
  readonly inverse = input(false);
}
