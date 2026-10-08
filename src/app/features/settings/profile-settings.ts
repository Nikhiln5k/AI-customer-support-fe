import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { SettingsApi } from '../../core/api/settings.api';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { toApiError } from '../../core/models/api';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FieldError } from '../../shared/components/field-error';
import { SettingsPanel } from './settings-panel';

@Component({
  selector: 'app-profile-settings',
  imports: [FormField, FormRoot, FieldError, SettingsPanel],
  template: `
    <app-settings-panel title="Profile" description="Your name and the email you sign in with.">
      <form [formRoot]="profileForm" novalidate>
        <div class="grid gap-5 p-4 md:grid-cols-2 md:p-6">
          <div>
            <label for="profile-name" class="field-label">
              Full name <span class="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              class="input"
              autocomplete="name"
              [formField]="profileForm.name"
              [attr.aria-invalid]="profileForm.name().touched() && profileForm.name().invalid()"
              aria-describedby="profile-name-error"
            />
            <app-field-error id="profile-name-error" [field]="profileForm.name" />
          </div>

          <div>
            <label for="profile-email" class="field-label">
              Email <span class="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              id="profile-email"
              type="email"
              class="input"
              autocomplete="email"
              [formField]="profileForm.email"
              [attr.aria-invalid]="profileForm.email().touched() && profileForm.email().invalid()"
              aria-describedby="profile-email-hint profile-email-error"
            />
            <p id="profile-email-hint" class="field-hint">Notifications are sent here too.</p>
            <app-field-error id="profile-email-error" [field]="profileForm.email" />
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-line px-4 py-3 md:px-6">
          <button
            type="button"
            class="btn-ghost"
            [disabled]="!profileForm().dirty() || profileForm().submitting()"
            (click)="profileForm().reset(saved)"
          >
            Discard
          </button>
          <button type="submit" class="btn-primary" [disabled]="profileForm().submitting()">
            {{ profileForm().submitting() ? 'Saving…' : 'Save profile' }}
          </button>
        </div>
      </form>
    </app-settings-panel>
  `,
})
export class ProfileSettings implements HasUnsavedChanges {
  private readonly api = inject(SettingsApi);
  private readonly toast = inject(ToastService);
  private readonly user = inject(AuthService).user();

  protected saved = { name: this.user?.name ?? '', email: this.user?.email ?? '' };

  protected readonly profileForm = form(
    signal(this.saved),
    (path) => {
      required(path.name, { message: 'Enter your name' });
      required(path.email, { message: 'Enter your email address' });
      email(path.email, { message: 'Enter a valid email address' });
    },
    {
      submission: {
        action: async (field) => {
          try {
            const user = await firstValueFrom(this.api.updateProfile(field().value()));
            this.saved = { name: user.name, email: user.email };
            field().reset(this.saved);
            this.toast.success('Profile updated');
          } catch (error) {
            this.toast.error(toApiError(error).message);
          }
          return undefined;
        },
      },
    },
  );

  hasUnsavedChanges(): boolean {
    return this.profileForm().dirty();
  }
}
