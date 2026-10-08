import { Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

/** A labelled on/off setting: a native checkbox exposed as a switch. */
@Component({
  selector: 'app-setting-switch',
  imports: [FormField],
  host: { class: 'flex items-start justify-between gap-4 py-3.5' },
  template: `
    <div class="min-w-0">
      <label [for]="id()" class="font-medium text-ink">{{ label() }}</label>
      @if (hint()) {
        <p class="mt-0.5 text-xs text-ink-muted" [id]="id() + '-hint'">{{ hint() }}</p>
      }
    </div>
    <input
      type="checkbox"
      role="switch"
      class="relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-ink-faint transition-colors before:absolute before:top-0.5 before:left-0.5 before:size-5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform checked:bg-brand checked:before:translate-x-5 disabled:cursor-not-allowed disabled:opacity-50"
      [id]="id()"
      [formField]="field()"
      [attr.aria-describedby]="hint() ? id() + '-hint' : null"
    />
  `,
})
export class SettingSwitch {
  readonly field = input.required<FieldTree<boolean>>();
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input('');
}
