import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Logo } from '../../layout/logo';
import { Icon, IconName } from '../../shared/ui/icon';

const HIGHLIGHTS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'sparkles',
    title: 'AI that assists, not replaces',
    text: 'Summaries, triage and reply drafts your agents review before sending.',
  },
  {
    icon: 'activity',
    title: 'Real-time conversations',
    text: 'Live messages, typing and delivery status across every ticket.',
  },
  {
    icon: 'clock',
    title: 'SLA tracking built in',
    text: 'Spot at-risk tickets early and keep response times on target.',
  },
];

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, Logo, Icon],
  template: `
    <div class="grid min-h-dvh bg-surface lg:grid-cols-2">
      <aside class="hidden flex-col justify-between bg-brand-ink p-10 text-white lg:flex xl:p-14">
        <app-logo [inverse]="true" />

        <div class="max-w-md">
          <h2 class="text-2xl leading-snug text-white xl:text-3xl">
            Resolve customer issues faster, with AI by your side.
          </h2>
          <ul class="mt-8 space-y-6">
            @for (item of highlights; track item.title) {
              <li class="flex gap-4">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10"
                >
                  <app-icon [name]="item.icon" />
                </span>
                <div>
                  <p class="font-medium text-white">{{ item.title }}</p>
                  <p class="mt-0.5 text-white/75">{{ item.text }}</p>
                </div>
              </li>
            }
          </ul>
        </div>

        <p class="text-xs text-white/70">© NexusAI · AI-assisted customer support</p>
      </aside>

      <main class="flex flex-col px-5 py-8 sm:px-8">
        <app-logo class="lg:hidden" />
        <div class="flex flex-1 items-center justify-center py-10">
          <div class="w-full max-w-sm">
            <router-outlet />
          </div>
        </div>
        <p class="text-center text-xs text-ink-faint lg:hidden">
          © NexusAI · AI-assisted customer support
        </p>
      </main>
    </div>
  `,
})
export class AuthLayout {
  protected readonly highlights = HIGHLIGHTS;
}
