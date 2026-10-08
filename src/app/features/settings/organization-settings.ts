import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, disabled, email, form, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { SettingsApi } from '../../core/api/settings.api';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { toApiError } from '../../core/models/api';
import { OrganizationSettings as Organization } from '../../core/models/settings';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ErrorState } from '../../shared/components/error-state';
import { FieldError } from '../../shared/components/field-error';
import { Icon } from '../../shared/ui/icon';
import { SettingsPanel, SettingsSkeleton } from './settings-panel';

const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
];

@Component({
  selector: 'app-organization-settings',
  imports: [FormField, FormRoot, FieldError, ErrorState, Icon, SettingsPanel, SettingsSkeleton],
  template: `
    <app-settings-panel
      title="Organization"
      description="Workspace details shown to your team and customers."
    >
      @if (settings.isLoading() && !settings.hasValue()) {
        <app-settings-skeleton />
      } @else if (settings.error()) {
        <app-error-state [error]="settings.error()" (retry)="settings.reload()" />
      } @else {
        @if (!canEdit) {
          <p
            class="mx-4 mt-4 flex items-center gap-2 rounded-control bg-subtle p-3 text-ink-muted md:mx-6"
          >
            <app-icon name="lock" [size]="16" />
            Only admins can change organization settings.
          </p>
        }

        <form [formRoot]="orgForm" novalidate>
          <div class="grid gap-5 p-4 md:grid-cols-2 md:p-6">
            <div>
              <label for="org-name" class="field-label">
                Organization name <span class="text-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="org-name"
                type="text"
                class="input"
                autocomplete="organization"
                [formField]="orgForm.name"
                [attr.aria-invalid]="orgForm.name().touched() && orgForm.name().invalid()"
                aria-describedby="org-name-error"
              />
              <app-field-error id="org-name-error" [field]="orgForm.name" />
            </div>

            <div>
              <label for="org-timezone" class="field-label">Timezone</label>
              <select
                id="org-timezone"
                class="input"
                [formField]="orgForm.timezone"
                aria-describedby="org-timezone-hint"
              >
                @for (zone of timezones(); track zone) {
                  <option [value]="zone">{{ zone }}</option>
                }
              </select>
              <p id="org-timezone-hint" class="field-hint">Used for SLA timers and reports.</p>
            </div>

            <div>
              <label for="org-email" class="field-label">
                Support email <span class="text-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="org-email"
                type="email"
                class="input"
                autocomplete="email"
                [formField]="orgForm.supportEmail"
                [attr.aria-invalid]="
                  orgForm.supportEmail().touched() && orgForm.supportEmail().invalid()
                "
                aria-describedby="org-email-hint org-email-error"
              />
              <p id="org-email-hint" class="field-hint">
                Customer replies are sent from this address.
              </p>
              <app-field-error id="org-email-error" [field]="orgForm.supportEmail" />
            </div>
          </div>

          @if (canEdit) {
            <div class="flex justify-end gap-2 border-t border-line px-4 py-3 md:px-6">
              <button
                type="button"
                class="btn-ghost"
                [disabled]="!orgForm().dirty() || orgForm().submitting()"
                (click)="discard()"
              >
                Discard
              </button>
              <button type="submit" class="btn-primary" [disabled]="orgForm().submitting()">
                {{ orgForm().submitting() ? 'Saving…' : 'Save organization' }}
              </button>
            </div>
          }
        </form>
      }
    </app-settings-panel>
  `,
})
export class OrganizationSettings implements HasUnsavedChanges {
  private readonly api = inject(SettingsApi);
  private readonly toast = inject(ToastService);
  protected readonly canEdit = inject(AuthService).hasRole('admin');

  protected readonly settings = rxResource({ stream: () => this.api.organization() });

  protected readonly orgForm = form(
    signal<Organization>({ name: '', timezone: 'UTC', supportEmail: '' }),
    (path) => {
      disabled(path, { when: () => !this.canEdit });
      required(path.name, { message: 'Enter your organization name' });
      required(path.supportEmail, { message: 'Enter a support email' });
      email(path.supportEmail, { message: 'Enter a valid email address' });
    },
    {
      submission: {
        action: async (field) => {
          try {
            const saved = await firstValueFrom(this.api.saveOrganization(field().value()));
            this.settings.set(saved);
            this.toast.success('Organization settings saved');
          } catch (error) {
            this.toast.error(toApiError(error).message);
          }
          return undefined;
        },
      },
    },
  );

  /** Keeps a stored timezone selectable even if it isn't in the short list. */
  protected readonly timezones = computed(() => {
    const current = this.orgForm.timezone().value();
    return TIMEZONES.includes(current) ? TIMEZONES : [current, ...TIMEZONES];
  });

  constructor() {
    effect(() => {
      const value = this.settings.value();
      if (value) untracked(() => this.orgForm().reset(value));
    });
  }

  protected discard(): void {
    const value = this.settings.value();
    if (value) this.orgForm().reset(value);
  }

  hasUnsavedChanges(): boolean {
    return this.orgForm().dirty();
  }
}
