import { Component, ElementRef, input, viewChild } from '@angular/core';
import { Icon, IconName } from './icon';

const PANEL_WIDTH = 192;
let nextId = 0;

/**
 * Overflow menu rendered in the top layer via the Popover API.
 * Project buttons with the `menu-item` class; any click inside closes the menu.
 */
@Component({
  selector: 'app-menu',
  imports: [Icon],
  host: { class: 'inline-flex' },
  template: `
    <button
      #trigger
      type="button"
      class="btn-icon"
      [attr.aria-label]="label()"
      [attr.popovertarget]="panelId"
    >
      <app-icon [name]="icon()" />
    </button>
    <div
      #panel
      popover
      [id]="panelId"
      class="m-0 w-48 rounded-card border border-line bg-surface p-1 text-ink shadow-lg shadow-ink/5"
      (beforetoggle)="position($event)"
      (click)="panel.hidePopover()"
    >
      <ng-content />
    </div>
  `,
})
export class Menu {
  readonly label = input.required<string>();
  readonly icon = input<IconName>('more');

  protected readonly panelId = `menu-${++nextId}`;

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLDivElement>>('panel');

  protected position(event: Event): void {
    if ((event as ToggleEvent).newState !== 'open') return;

    const rect = this.trigger().nativeElement.getBoundingClientRect();
    const style = this.panel().nativeElement.style;
    style.top = `${rect.bottom + 4}px`;
    style.left = `${Math.max(8, rect.right - PANEL_WIDTH)}px`;
  }
}
