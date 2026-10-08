import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../../core/models/api';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FieldError } from '../../shared/components/field-error';

@Component({
  selector: 'app-organization-setup',
  imports: [FormField, FormRoot, RouterLink, FieldError],
  template: `
    <h1 class="text-2xl">Set up your organization</h1>
    <p class="mt-1 text-ink-muted">Create a workspace and an admin account to get started.</p>

    @if (error(); as error) {
      <p class="mt-5 rounded-control bg-danger-soft p-3 text-danger" role="alert">
        {{ error.message }}
      </p>
    }

    <form [formRoot]="setupForm" class="mt-6 space-y-4" novalidate>
      @for (field of fields; track field.key) {
        <div>
          <label [for]="field.key" class="field-label">{{ field.label }}</label>
          <input
            class="input"
            [id]="field.key"
            [type]="field.type"
            [autocomplete]="field.autocomplete"
            [formField]="setupForm[field.key]"
            [attr.aria-invalid]="
              setupForm[field.key]().touched() && setupForm[field.key]().invalid()
            "
            [attr.aria-describedby]="field.key + '-hint ' + field.key + '-error'"
          />
          @if (field.hint) {
            <p class="field-hint" [id]="field.key + '-hint'">{{ field.hint }}</p>
          }
          <app-field-error [id]="field.key + '-error'" [field]="setupForm[field.key]" />
        </div>
      }

      <button type="submit" class="btn-primary w-full" [disabled]="setupForm().submitting()">
        {{ setupForm().submitting() ? 'Creating workspace…' : 'Create workspace' }}
      </button>
    </form>

    <p class="mt-6 text-center text-ink-muted">
      Already have an account? <a routerLink="/login" class="link">Sign in</a>
    </p>
  `,
})
export default class OrganizationSetup {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly error = signal<ApiError | null>(null);

  protected readonly fields = [
    {
      key: 'organizationName',
      label: 'Organization name',
      type: 'text',
      autocomplete: 'organization',
      hint: '',
    },
    { key: 'adminName', label: 'Your name', type: 'text', autocomplete: 'name', hint: '' },
    { key: 'email', label: 'Work email', type: 'email', autocomplete: 'email', hint: '' },
    {
      key: 'password',
      label: 'Password',
      type: 'password',
      autocomplete: 'new-password',
      hint: 'At least 8 characters.',
    },
  ] as const;

  protected readonly setupForm = form(
    signal({ organizationName: '', adminName: '', email: '', password: '' }),
    (path) => {
      required(path.organizationName, { message: 'Enter your organization name' });
      required(path.adminName, { message: 'Enter your name' });
      required(path.email, { message: 'Enter your work email' });
      email(path.email, { message: 'Enter a valid email address' });
      required(path.password, { message: 'Choose a password' });
      minLength(path.password, 8, { message: 'Use at least 8 characters' });
    },
    {
      submission: {
        action: async (field) => {
          this.error.set(null);
          try {
            await firstValueFrom(this.auth.setupOrganization(field().value()));
            this.toast.success('Workspace created. Welcome to NexusAI!');
            await this.router.navigate(['/dashboard']);
          } catch (error) {
            this.error.set(error as ApiError);
          }
          return undefined;
        },
      },
    },
  );
}
