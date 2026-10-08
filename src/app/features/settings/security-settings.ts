import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { SettingsApi } from '../../core/api/settings.api';
import { toApiError } from '../../core/models/api';
import { ActiveSession } from '../../core/models/settings';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyState } from '../../shared/components/empty-state';
import { ErrorState } from '../../shared/components/error-state';
import { SkeletonRows } from '../../shared/components/skeleton-rows';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { Badge } from '../../shared/ui/badge';
import { Icon } from '../../shared/ui/icon';
import { ROLE_LABEL } from '../../shared/ui/labels';
import { SettingsPanel } from './settings-panel';

@Component({
  selector: 'app-security-settings',
  imports: [EmptyState, ErrorState, SkeletonRows, RelativeTimePipe, Badge, Icon, SettingsPanel],
  template: `
    <app-settings-panel
      title="Security and sessions"
      description="Your access level and the devices signed in to your account."
    >
      <dl class="grid gap-4 p-4 sm:grid-cols-2 md:p-6">
        <div>
          <dt class="text-xs font-medium text-ink-muted">Role</dt>
          <dd class="mt-1">
            <app-badge tone="info">{{ role() }}</app-badge>
          </dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-ink-muted">Signed in as</dt>
          <dd class="mt-1 truncate">{{ auth.user()?.email }}</dd>
        </div>
      </dl>

      <section class="border-t border-line" aria-labelledby="sessions-title">
        <h3 id="sessions-title" class="px-4 pt-4 text-sm md:px-6">Active sessions</h3>

        @if (sessions.isLoading() && !sessions.hasValue()) {
          <app-skeleton-rows [rows]="2" />
        } @else if (sessions.error()) {
          <app-error-state [error]="sessions.error()" (retry)="sessions.reload()" />
        } @else if (!sessions.value()?.length) {
          <app-empty-state icon="lock" title="No active sessions" />
        } @else {
          <ul class="mt-2 divide-y divide-line">
            @for (session of sessions.value(); track session.id) {
              <li class="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
                <div class="min-w-0 flex-1">
                  <p class="flex flex-wrap items-center gap-2 font-medium">
                    {{ session.device }}
                    @if (session.current) {
                      <app-badge tone="brand">This device</app-badge>
                    }
                  </p>
                  <p class="mt-0.5 text-xs text-ink-muted">
                    {{ session.location }} ·
                    {{
                      session.current
                        ? 'Active now'
                        : 'Last seen ' + (session.lastSeenAt | relativeTime)
                    }}
                  </p>
                </div>
                @if (!session.current) {
                  <button
                    type="button"
                    class="btn-secondary"
                    [disabled]="revoking() === session.id"
                    [attr.aria-label]="'Revoke session on ' + session.device"
                    (click)="revoke(session)"
                  >
                    {{ revoking() === session.id ? 'Revoking…' : 'Revoke' }}
                  </button>
                }
              </li>
            }
          </ul>
        }
      </section>

      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 md:px-6"
      >
        <p class="text-ink-muted">Sign out of NexusAI on this device.</p>
        <button type="button" class="btn-secondary" (click)="auth.logout()">
          <app-icon name="logout" [size]="16" />
          Sign out
        </button>
      </div>
    </app-settings-panel>
  `,
})
export class SecuritySettings {
  private readonly api = inject(SettingsApi);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly role = computed(() => {
    const role = this.auth.user()?.role;
    return role ? ROLE_LABEL[role] : '—';
  });

  protected readonly sessions = rxResource({ stream: () => this.api.sessions() });
  protected readonly revoking = signal<string | null>(null);

  protected async revoke(session: ActiveSession): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Revoke this session?',
      message: `${session.device} in ${session.location} will be signed out immediately.`,
      confirmLabel: 'Revoke session',
      destructive: true,
    });
    if (!confirmed) return;

    this.revoking.set(session.id);
    this.api.revokeSession(session.id).subscribe({
      next: () => {
        this.revoking.set(null);
        this.sessions.update((list) => list?.filter((s) => s.id !== session.id));
        this.toast.success(`Signed out ${session.device}`);
      },
      error: (error) => {
        this.revoking.set(null);
        this.toast.error(toApiError(error).message);
      },
    });
  }
}
