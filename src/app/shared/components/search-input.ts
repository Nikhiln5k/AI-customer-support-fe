import { Component, input, model } from '@angular/core';
import { Icon } from '../ui/icon';

@Component({
  selector: 'app-search-input',
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <label class="relative block">
      <span class="sr-only">{{ label() }}</span>
      <app-icon
        name="search"
        [size]="16"
        class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
      />
      <input
        type="search"
        class="input pl-9"
        [placeholder]="label()"
        [value]="value()"
        (input)="value.set($any($event.target).value)"
      />
    </label>
  `,
})
export class SearchInput {
  readonly value = model('');
  readonly label = input('Search');
}
