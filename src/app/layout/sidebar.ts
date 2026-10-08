import { Component, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/ui/icon';
import { Logo } from './logo';
import { NavList } from './nav-list';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, Icon, Logo, NavList],
  host: {
    class:
      'sticky top-0 h-dvh shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200',
    '[class.w-60]': '!collapsed()',
    '[class.w-17]': 'collapsed()',
  },
  template: `
    <div class="flex h-14 items-center gap-2 border-b border-line px-4">
      <a routerLink="/dashboard" class="flex min-w-0 items-center gap-2" aria-label="NexusAI home">
        <app-logo [compact]="collapsed()" />
      </a>
    </div>

    <div class="flex-1 overflow-y-auto px-3 py-4">
      <app-nav-list [collapsed]="collapsed()" />
    </div>

    <div class="border-t border-line p-3">
      <button
        type="button"
        class="btn-ghost w-full"
        [class.justify-start]="!collapsed()"
        [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
        [attr.aria-expanded]="!collapsed()"
        (click)="collapsed.set(!collapsed())"
      >
        <app-icon name="sidebar" />
        @if (!collapsed()) {
          Collapse
        }
      </button>
    </div>
  `,
})
export class Sidebar {
  readonly collapsed = model(false);
}
