import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';

export interface Breadcrumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-header',
  imports: [RouterLink, Icon],
  host: { class: 'block mb-6' },
  template: `
    @if (breadcrumbs().length) {
      <nav aria-label="Breadcrumb" class="mb-2">
        <ol class="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
          @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
            <li class="flex items-center gap-1">
              @if (crumb.link && !last) {
                <a [routerLink]="crumb.link" class="hover:text-ink hover:underline">{{
                  crumb.label
                }}</a>
                <app-icon name="chevron-right" [size]="14" />
              } @else {
                <span [attr.aria-current]="last ? 'page' : null">{{ crumb.label }}</span>
              }
            </li>
          }
        </ol>
      </nav>
    }

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl md:text-2xl">{{ title() }}</h1>
        @if (description()) {
          <p class="mt-1 text-ink-muted">{{ description() }}</p>
        }
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly breadcrumbs = input<Breadcrumb[]>([]);
}
