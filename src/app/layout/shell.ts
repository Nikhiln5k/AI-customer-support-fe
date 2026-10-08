import { Component, effect, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Drawer } from '../shared/components/drawer';
import { BottomNav } from './bottom-nav';
import { NavList } from './nav-list';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

const COLLAPSED_KEY = 'nexus.sidebar-collapsed';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar, BottomNav, Drawer, NavList],
  template: `
    <a
      href="#main"
      class="sr-only z-50 rounded-control bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Skip to content
    </a>

    <div class="flex min-h-dvh">
      <app-sidebar class="hidden md:flex" [(collapsed)]="collapsed" />

      <div class="flex min-w-0 flex-1 flex-col">
        <app-topbar (menu)="menuOpen.set(true)" />
        <main id="main" tabindex="-1" class="flex-1 px-4 pt-5 pb-24 md:px-8 md:pt-7 md:pb-10">
          <div class="mx-auto max-w-7xl">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>

    <app-bottom-nav class="md:hidden" (more)="menuOpen.set(true)" />

    <app-drawer title="Menu" side="left" [(open)]="menuOpen">
      <div class="p-3">
        <app-nav-list (navigate)="menuOpen.set(false)" />
      </div>
    </app-drawer>
  `,
})
export class Shell {
  protected readonly menuOpen = signal(false);
  protected readonly collapsed = signal(readCollapsed());

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(COLLAPSED_KEY, String(this.collapsed()));
      } catch {
        // Storage unavailable; the preference just won't persist.
      }
    });
  }
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}
