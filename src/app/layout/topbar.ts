import { Component, computed, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationCenter } from '../core/services/notification-center.service';
import { ConnectionStatus } from '../shared/components/connection-status';
import { Avatar } from '../shared/ui/avatar';
import { Icon } from '../shared/ui/icon';
import { ROLE_LABEL } from '../shared/ui/labels';
import { Logo } from './logo';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, Icon, Avatar, Logo, ConnectionStatus],
  host: {
    class:
      'sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-2 backdrop-blur md:px-6',
  },
  template: `
    <button type="button" class="btn-icon md:hidden" aria-label="Open menu" (click)="menu.emit()">
      <app-icon name="menu" />
    </button>
    <a routerLink="/dashboard" class="md:hidden" aria-label="NexusAI home">
      <app-logo [compact]="true" />
    </a>

    <form
      role="search"
      class="hidden max-w-md flex-1 md:block"
      (submit)="search($event, query.value)"
    >
      <label class="relative block">
        <span class="sr-only">Search tickets</span>
        <app-icon
          name="search"
          [size]="16"
          class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
        />
        <input #query type="search" class="input bg-canvas pl-9" placeholder="Search tickets…" />
      </label>
    </form>

    <div class="ml-auto flex items-center gap-1 md:gap-3">
      <app-connection-status class="hidden sm:inline-flex" />

      <a routerLink="/notifications" class="btn-icon relative" aria-label="Notifications">
        <app-icon name="bell" />
        @if (unread()) {
          <span
            class="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 font-semibold text-white"
          >
            {{ unread() > 9 ? '9+' : unread() }}
          </span>
          <span class="sr-only">({{ unread() }} unread)</span>
        }
      </a>

      <button
        type="button"
        class="flex items-center gap-2 rounded-control p-1 hover:bg-subtle md:pr-2"
        popovertarget="user-menu"
        aria-label="Account menu"
      >
        <app-avatar [name]="auth.user()?.name ?? '?'" />
        <span class="hidden text-left leading-tight lg:block">
          <span class="block font-medium">{{ auth.user()?.name }}</span>
          <span class="block text-xs text-ink-muted">{{ role() }}</span>
        </span>
      </button>

      <div
        #userMenu
        id="user-menu"
        popover
        class="fixed inset-auto top-14 right-2 m-0 w-60 rounded-card border border-line bg-surface p-1 text-ink shadow-lg shadow-ink/5 md:right-6"
      >
        <div class="border-b border-line px-3 py-2.5">
          <p class="font-medium">{{ auth.user()?.name }}</p>
          <p class="truncate text-xs text-ink-muted">{{ auth.user()?.email }}</p>
          <p class="mt-1 text-xs text-ink-muted">{{ auth.organization()?.name }} · {{ role() }}</p>
        </div>
        <a
          routerLink="/settings"
          class="mt-1 flex min-h-10 items-center gap-2 rounded-control px-3 hover:bg-subtle"
          (click)="userMenu.hidePopover()"
        >
          <app-icon name="settings" [size]="16" /> Settings
        </a>
        <button
          type="button"
          class="flex min-h-10 w-full items-center gap-2 rounded-control px-3 text-left hover:bg-subtle"
          (click)="auth.logout()"
        >
          <app-icon name="logout" [size]="16" /> Sign out
        </button>
      </div>
    </div>
  `,
})
export class Topbar {
  readonly menu = output();

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly unread = inject(NotificationCenter).unreadCount;
  protected readonly role = computed(() => {
    const role = this.auth.user()?.role;
    return role ? ROLE_LABEL[role] : '';
  });

  protected search(event: Event, value: string): void {
    event.preventDefault();
    this.router.navigate(['/tickets'], { queryParams: { search: value.trim() || null } });
  }
}
