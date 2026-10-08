import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../shared/ui/icon';
import { MOBILE_NAV } from './nav-items';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, Icon],
  host: {
    class:
      'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]',
  },
  template: `
    <nav aria-label="Primary">
      <ul class="grid grid-cols-5">
        @for (item of items; track item.link) {
          <li>
            <a
              [routerLink]="item.link"
              routerLinkActive="!text-brand-ink"
              ariaCurrentWhenActive="page"
              class="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-muted"
            >
              <app-icon [name]="item.icon" [size]="20" />
              {{ item.label }}
            </a>
          </li>
        }
        <li>
          <button
            type="button"
            class="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-muted"
            (click)="more.emit()"
          >
            <app-icon name="more" [size]="20" />
            More
          </button>
        </li>
      </ul>
    </nav>
  `,
})
export class BottomNav {
  readonly more = output();
  protected readonly items = MOBILE_NAV;
}
