import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-rows',
  host: { class: 'block', 'aria-busy': 'true', 'aria-label': 'Loading' },
  template: `
    <div class="divide-y divide-line">
      @for (row of rowList(); track row) {
        <div class="flex items-center gap-4 px-4 py-4">
          <div class="skeleton size-8 shrink-0 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton h-3.5" [style.width.%]="60 - (row % 3) * 12"></div>
            <div class="skeleton h-3 w-1/3"></div>
          </div>
          <div class="skeleton hidden h-5 w-16 sm:block"></div>
        </div>
      }
    </div>
  `,
})
export class SkeletonRows {
  readonly rows = input(5);
  protected readonly rowList = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
}
