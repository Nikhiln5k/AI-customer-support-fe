import { Component, computed, input } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
}

/** Single-series vertical bar chart with hover tooltips and a screen-reader table. */
@Component({
  selector: 'app-bar-chart',
  host: { class: 'block' },
  template: `
    <div class="flex items-end gap-0.5" [style.height.px]="height()" aria-hidden="true">
      @for (bar of data(); track bar.label) {
        <div class="group relative flex h-full flex-1 items-end justify-center">
          <div
            class="w-full max-w-10 rounded-t transition-opacity group-hover:opacity-80"
            [style.height.%]="(bar.value / max()) * 100"
            [style.background]="color()"
          ></div>
          <div
            class="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-control border border-line bg-surface px-2 py-1 text-xs whitespace-nowrap text-ink shadow-md shadow-ink/5 group-hover:block"
          >
            {{ bar.label }} · <strong>{{ bar.value }}{{ unit() }}</strong>
          </div>
        </div>
      }
    </div>
    <div class="mt-2 flex gap-0.5 text-[11px] text-ink-faint" aria-hidden="true">
      @for (bar of data(); track bar.label) {
        <span class="flex-1 truncate text-center">{{ bar.label }}</span>
      }
    </div>

    <table class="sr-only">
      <caption>
        {{
          caption()
        }}
      </caption>
      <tbody>
        @for (bar of data(); track bar.label) {
          <tr>
            <th scope="row">{{ bar.label }}</th>
            <td>{{ bar.value }}{{ unit() }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class BarChart {
  readonly data = input.required<BarDatum[]>();
  readonly caption = input.required<string>();
  readonly unit = input('');
  readonly color = input('var(--color-chart-1)');
  readonly height = input(160);

  protected readonly max = computed(() => Math.max(1, ...this.data().map((d) => d.value)));
}
