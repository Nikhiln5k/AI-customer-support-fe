import { Component, computed, input, signal } from '@angular/core';

export interface LineSeries {
  name: string;
  /** CSS color, e.g. `var(--color-chart-1)`. */
  color: string;
  values: number[];
}

const WIDTH = 600;
const HEIGHT = 200;

/**
 * Multi-series line chart on one shared y-axis.
 * SVG scales to its container; labels and tooltip are HTML so text never distorts.
 */
@Component({
  selector: 'app-line-chart',
  host: { class: 'block' },
  template: `
    <div class="mb-3 flex flex-wrap gap-4 text-xs text-ink-muted" aria-hidden="true">
      @for (s of series(); track s.name) {
        <span class="flex items-center gap-1.5">
          <span class="h-0.5 w-4 rounded" [style.background]="s.color"></span>{{ s.name }}
        </span>
      }
    </div>

    <div class="flex gap-2">
      <div
        class="flex flex-col justify-between pb-6 text-right text-[11px] text-ink-faint"
        aria-hidden="true"
      >
        @for (tick of ticks(); track tick) {
          <span class="leading-none">{{ tick }}</span>
        }
      </div>

      <div class="relative min-w-0 flex-1">
        <svg
          [attr.viewBox]="'0 0 ' + width + ' ' + height"
          preserveAspectRatio="none"
          class="block w-full overflow-visible"
          [style.height.px]="height"
          aria-hidden="true"
        >
          @for (tick of ticks(); track tick; let i = $index) {
            <line
              x1="0"
              [attr.x2]="width"
              [attr.y1]="(i / (ticks().length - 1)) * height"
              [attr.y2]="(i / (ticks().length - 1)) * height"
              stroke="var(--color-line)"
              vector-effect="non-scaling-stroke"
            />
          }
          @if (active() !== null) {
            <line
              [attr.x1]="x(active()!)"
              [attr.x2]="x(active()!)"
              y1="0"
              [attr.y2]="height"
              stroke="var(--color-line-strong)"
              vector-effect="non-scaling-stroke"
            />
          }
          @for (s of series(); track s.name) {
            <path
              [attr.d]="path(s.values)"
              fill="none"
              [attr.stroke]="s.color"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          }
        </svg>

        <!-- Hover columns, wider than the marks -->
        <div class="absolute inset-x-0 top-0 flex" [style.height.px]="height">
          @for (label of labels(); track $index) {
            <div
              class="h-full flex-1"
              (mouseenter)="active.set($index)"
              (mouseleave)="active.set(null)"
            ></div>
          }
        </div>

        @if (active() !== null) {
          <div
            class="pointer-events-none absolute top-2 z-10 min-w-32 -translate-x-1/2 rounded-control border border-line bg-surface px-3 py-2 text-xs shadow-md shadow-ink/5"
            [style.left.%]="(x(active()!) / width) * 100"
          >
            <p class="mb-1 font-medium text-ink">{{ labels()[active()!] }}</p>
            @for (s of series(); track s.name) {
              <p class="flex items-center justify-between gap-3 text-ink-muted">
                <span class="flex items-center gap-1.5">
                  <span class="size-2 rounded-full" [style.background]="s.color"></span>{{ s.name }}
                </span>
                <span class="font-medium text-ink">{{ s.values[active()!] }}</span>
              </p>
            }
          </div>
        }

        <div class="mt-2 flex justify-between text-[11px] text-ink-faint" aria-hidden="true">
          <span>{{ labels()[0] }}</span>
          <span>{{ labels()[labels().length - 1] }}</span>
        </div>
      </div>
    </div>

    <table class="sr-only">
      <caption>
        {{
          caption()
        }}
      </caption>
      <thead>
        <tr>
          <th scope="col">Period</th>
          @for (s of series(); track s.name) {
            <th scope="col">{{ s.name }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (label of labels(); track $index; let i = $index) {
          <tr>
            <th scope="row">{{ label }}</th>
            @for (s of series(); track s.name) {
              <td>{{ s.values[i] }}</td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class LineChart {
  readonly series = input.required<LineSeries[]>();
  readonly labels = input.required<string[]>();
  readonly caption = input.required<string>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly active = signal<number | null>(null);

  private readonly max = computed(() => {
    const peak = Math.max(1, ...this.series().flatMap((s) => s.values));
    const step = Math.pow(10, Math.floor(Math.log10(peak)));
    return Math.ceil(peak / step) * step;
  });

  protected readonly ticks = computed(() => {
    const max = this.max();
    return [max, Math.round((max * 2) / 3), Math.round(max / 3), 0];
  });

  protected x(index: number): number {
    const count = this.labels().length;
    return count > 1 ? (index / (count - 1)) * WIDTH : WIDTH / 2;
  }

  protected path(values: number[]): string {
    return values
      .map((v, i) => `${i ? 'L' : 'M'}${this.x(i)},${HEIGHT - (v / this.max()) * HEIGHT}`)
      .join(' ');
  }
}
