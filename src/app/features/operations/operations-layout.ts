import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PageHeader } from '../../shared/components/page-header';

@Component({
  selector: 'app-operations-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, PageHeader],
  template: `
    <app-page-header
      title="Operations"
      description="Monitor background jobs and message broker events."
    />

    <nav aria-label="Operations sections" class="-mt-2 mb-6 border-b border-line">
      <ul class="flex gap-1">
        @for (tab of tabs; track tab.link) {
          <li>
            <a
              [routerLink]="tab.link"
              routerLinkActive
              #rla="routerLinkActive"
              ariaCurrentWhenActive="page"
              class="-mb-px flex min-h-11 items-center border-b-2 px-3 text-sm font-medium"
              [class]="
                rla.isActive
                  ? 'border-brand text-brand-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              "
            >
              {{ tab.label }}
            </a>
          </li>
        }
      </ul>
    </nav>

    <router-outlet />
  `,
})
export default class OperationsLayout {
  protected readonly tabs = [
    { label: 'Job queues', link: 'queues' },
    { label: 'Event monitor', link: 'events' },
  ];
}
