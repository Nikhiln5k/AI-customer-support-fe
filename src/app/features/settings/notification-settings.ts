import { Component, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormRoot, form } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { SettingsApi } from '../../core/api/settings.api';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { toApiError } from '../../core/models/api';
import { NotificationPreferences } from '../../core/models/settings';
import { ToastService } from '../../core/services/toast.service';
import { ErrorState } from '../../shared/components/error-state';
import { SettingSwitch } from './setting-switch';
import { SettingsPanel, SettingsSkeleton } from './settings-panel';

@Component({
  selector: 'app-notification-settings',
  imports: [FormRoot, ErrorState, SettingSwitch, SettingsPanel, SettingsSkeleton],
  template: `
    <app-settings-panel
      title="Notification preferences"
      description="Choose how and when NexusAI lets you know about activity."
    >
      @if (prefs.isLoading() && !prefs.hasValue()) {
        <app-settings-skeleton />
      } @else if (prefs.error()) {
        <app-error-state [error]="prefs.error()" (retry)="prefs.reload()" />
      } @else {
        <form [formRoot]="prefsForm" novalidate>
          <fieldset class="border-b border-line px-4 pt-4 pb-2 md:px-6">
            <legend class="text-xs font-medium tracking-wide text-ink-muted uppercase">
              Channels
            </legend>
            <div class="divide-y divide-line">
              <app-setting-switch
                id="pref-email"
                label="Email"
                hint="Send notifications to your inbox."
                [field]="prefsForm.email"
              />
              <app-setting-switch
                id="pref-in-app"
                label="In-app"
                hint="Show notifications in the bell menu and as toasts."
                [field]="prefsForm.inApp"
              />
            </div>
          </fieldset>

          <fieldset class="px-4 pt-4 pb-2 md:px-6">
            <legend class="text-xs font-medium tracking-wide text-ink-muted uppercase">
              Events
            </legend>
            <div class="divide-y divide-line">
              <app-setting-switch
                id="pref-sla"
                label="SLA warnings"
                hint="When a ticket you own is close to breaching its SLA."
                [field]="prefsForm.slaWarnings"
              />
              <app-setting-switch
                id="pref-assignments"
                label="Assignments"
                hint="When a ticket is assigned to you."
                [field]="prefsForm.assignments"
              />
              <app-setting-switch
                id="pref-mentions"
                label="Mentions"
                hint="When a teammate mentions you in an internal note."
                [field]="prefsForm.mentions"
              />
            </div>
          </fieldset>

          <div class="flex justify-end gap-2 border-t border-line px-4 py-3 md:px-6">
            <button
              type="button"
              class="btn-ghost"
              [disabled]="!prefsForm().dirty() || prefsForm().submitting()"
              (click)="discard()"
            >
              Discard
            </button>
            <button type="submit" class="btn-primary" [disabled]="prefsForm().submitting()">
              {{ prefsForm().submitting() ? 'Saving…' : 'Save preferences' }}
            </button>
          </div>
        </form>
      }
    </app-settings-panel>
  `,
})
export class NotificationSettings implements HasUnsavedChanges {
  private readonly api = inject(SettingsApi);
  private readonly toast = inject(ToastService);

  protected readonly prefs = rxResource({ stream: () => this.api.notifications() });

  protected readonly prefsForm = form(
    signal<NotificationPreferences>({
      email: false,
      inApp: false,
      slaWarnings: false,
      assignments: false,
      mentions: false,
    }),
    {
      submission: {
        action: async (field) => {
          try {
            this.prefs.set(await firstValueFrom(this.api.saveNotifications(field().value())));
            this.toast.success('Notification preferences saved');
          } catch (error) {
            this.toast.error(toApiError(error).message);
          }
          return undefined;
        },
      },
    },
  );

  constructor() {
    effect(() => {
      const value = this.prefs.value();
      if (value) untracked(() => this.prefsForm().reset(value));
    });
  }

  protected discard(): void {
    const value = this.prefs.value();
    if (value) this.prefsForm().reset(value);
  }

  hasUnsavedChanges(): boolean {
    return this.prefsForm().dirty();
  }
}
