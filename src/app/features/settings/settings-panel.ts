import { Component, input } from '@angular/core';

/** Card shell shared by every settings section. */
@Component({
  selector: 'app-settings-panel',
  host: { class: 'card block' },
  template: `
    <header class="border-b border-line px-4 py-4 md:px-6">
      <h2 class="text-base">{{ title() }}</h2>
      <p class="mt-0.5 text-ink-muted">{{ description() }}</p>
    </header>
    <ng-content />
  `,
})
export class SettingsPanel {
  readonly title = input.required<string>();
  readonly description = input('');
}

@Component({
  selector: 'app-settings-skeleton',
  host: { class: 'block', role: 'status' },
  template: `
    <span class="sr-only">Loading…</span>
    <div class="grid gap-5 p-4 md:grid-cols-2 md:p-6" aria-hidden="true">
      @for (row of rowList; track row) {
        <div class="space-y-2">
          <div class="skeleton h-3.5 w-24"></div>
          <div class="skeleton h-10"></div>
        </div>
      }
    </div>
  `,
})
export class SettingsSkeleton {
  protected readonly rowList = [0, 1, 2, 3];
}
