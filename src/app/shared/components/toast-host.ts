import { Component, inject } from '@angular/core';
import { ToastService, ToastTone } from '../../core/services/toast.service';
import { Icon, IconName } from '../ui/icon';

const TONE_ICON: Record<ToastTone, { icon: IconName; color: string }> = {
  success: { icon: 'success', color: 'text-brand' },
  error: { icon: 'error', color: 'text-danger' },
  info: { icon: 'info', color: 'text-info' },
};

@Component({
  selector: 'app-toast-host',
  imports: [Icon],
  template: `
    <div
      class="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:items-end"
      aria-live="polite"
    >
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-lg shadow-ink/5"
          [attr.role]="toast.tone === 'error' ? 'alert' : 'status'"
        >
          <app-icon [name]="tones[toast.tone].icon" [class]="tones[toast.tone].color" />
          <p class="flex-1 text-ink">{{ toast.message }}</p>
          <button
            type="button"
            class="-m-1 rounded p-1 text-ink-faint hover:text-ink"
            aria-label="Dismiss"
            (click)="toasts.dismiss(toast.id)"
          >
            <app-icon name="close" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
  protected readonly tones = TONE_ICON;
}
