import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

/** Renders whatever ConfirmService is currently asking. Mounted once in the app root. */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <dialog
      #dialog
      class="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0 text-ink backdrop:bg-ink/30"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      (cancel)="confirm.close(false)"
    >
      @if (confirm.pending(); as request) {
        <div class="p-5">
          <h2 id="confirm-title" class="text-base">{{ request.title }}</h2>
          <p id="confirm-message" class="mt-2 text-ink-muted">{{ request.message }}</p>
        </div>
        <div class="flex justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" class="btn-secondary" (click)="confirm.close(false)">Cancel</button>
          <button
            type="button"
            [class]="request.destructive ? 'btn-danger' : 'btn-primary'"
            (click)="confirm.close(true)"
          >
            {{ request.confirmLabel ?? 'Confirm' }}
          </button>
        </div>
      }
    </dialog>
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.confirm.pending() && !dialog.open) dialog.showModal();
      if (!this.confirm.pending() && dialog.open) dialog.close();
    });
  }
}
