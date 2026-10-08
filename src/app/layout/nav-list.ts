import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationCenter } from '../core/services/notification-center.service';
import { Icon } from '../shared/ui/icon';
import { NAV_GROUPS } from './nav-items';

@Component({
  selector: 'app-nav-list',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <nav aria-label="Main" class="space-y-5">
      @for (group of groups(); track group.label) {
        <div>
          @if (!collapsed()) {
            <p class="mb-1 px-3 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
              {{ group.label }}
            </p>
          }
          <ul class="space-y-0.5">
            @for (item of group.items; track item.link) {
              <li>
                <a
                  [routerLink]="item.link"
                  routerLinkActive="bg-brand-soft !text-brand-ink"
                  ariaCurrentWhenActive="page"
                  class="flex min-h-10 items-center gap-3 rounded-control px-3 font-medium text-ink-muted transition-colors hover:bg-subtle hover:text-ink max-md:min-h-11"
                  [class.justify-center]="collapsed()"
                  [attr.title]="collapsed() ? item.label : null"
                  (click)="navigate.emit()"
                >
                  <app-icon [name]="item.icon" />
                  @if (collapsed()) {
                    <span class="sr-only">{{ item.label }}</span>
                  } @else {
                    <span class="flex-1 truncate">{{ item.label }}</span>
                    @if (item.link === '/notifications' && unread()) {
                      <span class="rounded-md bg-brand px-1.5 text-xs font-semibold text-white">
                        {{ unread() }}
                      </span>
                    }
                  }
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </nav>
  `,
})
export class NavList {
  readonly collapsed = input(false);
  readonly navigate = output();

  private readonly auth = inject(AuthService);
  protected readonly unread = inject(NotificationCenter).unreadCount;

  protected readonly groups = computed(() => {
    const role = this.auth.user()?.role;
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
    })).filter((group) => group.items.length);
  });
}
