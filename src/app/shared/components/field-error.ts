import { Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

/** Shows the first validation message once the field has been touched. */
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p class="field-error" [id]="id()">{{ text }}</p>
    }
  `,
})
export class FieldError {
  readonly field = input.required<FieldTree<unknown>>();
  readonly id = input<string>();

  protected readonly message = computed(() => {
    const state = this.field()();
    if (!state.touched() || state.valid()) return null;
    return state.errors()[0]?.message ?? 'This field is invalid';
  });
}
