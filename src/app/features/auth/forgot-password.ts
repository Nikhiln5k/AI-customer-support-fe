import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../../core/models/api';
import { AuthService } from '../../core/services/auth.service';
import { FieldError } from '../../shared/components/field-error';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-forgot-password',
  imports: [FormField, FormRoot, RouterLink, FieldError, Icon],
  template: `
    @if (sentTo(); as address) {
      <div class="text-center" role="status">
        <span
          class="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand"
        >
          <app-icon name="mail" [size]="22" />
        </span>
        <h1 class="text-2xl">Check your inbox</h1>
        <p class="mt-2 text-ink-muted">
          If an account exists for <strong class="text-ink">{{ address }}</strong
          >, you’ll receive a reset link shortly.
        </p>
        <a routerLink="/login" class="btn-secondary mt-6 w-full">Return to sign in</a>
      </div>
    } @else {
      <h1 class="text-2xl">Reset your password</h1>
      <p class="mt-1 text-ink-muted">We’ll email you a link to choose a new password.</p>

      @if (error(); as error) {
        <p class="mt-5 rounded-control bg-danger-soft p-3 text-danger" role="alert">
          {{ error.message }}
        </p>
      }

      <form [formRoot]="resetForm" class="mt-6 space-y-4" novalidate>
        <div>
          <label for="email" class="field-label">Email</label>
          <input
            id="email"
            type="email"
            class="input"
            autocomplete="email"
            [formField]="resetForm.email"
            [attr.aria-invalid]="resetForm.email().touched() && resetForm.email().invalid()"
            aria-describedby="email-error"
          />
          <app-field-error id="email-error" [field]="resetForm.email" />
        </div>

        <button type="submit" class="btn-primary w-full" [disabled]="resetForm().submitting()">
          {{ resetForm().submitting() ? 'Sending…' : 'Send reset link' }}
        </button>
      </form>

      <a routerLink="/login" class="btn-ghost mt-3 w-full">
        <app-icon name="arrow-left" [size]="16" />
        Return to sign in
      </a>
    }
  `,
})
export default class ForgotPassword {
  private readonly auth = inject(AuthService);

  protected readonly sentTo = signal<string | null>(null);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly resetForm = form(
    signal({ email: '' }),
    (path) => {
      required(path.email, { message: 'Enter your email address' });
      email(path.email, { message: 'Enter a valid email address' });
    },
    {
      submission: {
        action: async (field) => {
          const { email } = field().value();
          this.error.set(null);
          try {
            await firstValueFrom(this.auth.requestPasswordReset(email));
            this.sentTo.set(email);
          } catch (error) {
            this.error.set(error as ApiError);
          }
          return undefined;
        },
      },
    },
  );
}
