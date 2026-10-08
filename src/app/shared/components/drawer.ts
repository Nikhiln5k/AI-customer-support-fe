import { Component, ElementRef, effect, input, model, viewChild } from '@angular/core';
import { Icon } from '../ui/icon';

/** Modal side panel built on <dialog>, so focus trapping and Escape come for free. */
@Component({
  selector: 'app-drawer',
  imports: [Icon],
  template: `
    <dialog
      #dialog
      class="fixed m-0 h-dvh max-h-none w-[min(24rem,100vw)] max-w-none border-line bg-surface p-0 text-ink backdrop:bg-ink/30"
      [class]="side() === 'right' ? 'ml-auto border-l' : 'mr-auto border-r'"
      [attr.aria-label]="title()"
      (close)="open.set(false)"
      (click)="closeOnBackdrop($event)"
    >
      <div class="flex h-full flex-col">
        <header class="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 class="text-base">{{ title() }}</h2>
          <button type="button" class="btn-icon" aria-label="Close" (click)="open.set(false)">
            <app-icon name="close" />
          </button>
        </header>
        <div class="flex-1 overflow-y-auto">
          <ng-content />
        </div>
        <ng-content select="[drawer-footer]" />
      </div>
    </dialog>
  `,
})
export class Drawer {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly side = input<'left' | 'right'>('right');

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) dialog.showModal();
      if (!this.open() && dialog.open) dialog.close();
    });
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.open.set(false);
  }
}
