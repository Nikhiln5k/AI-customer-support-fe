import { Component, inject, input, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiError } from '../../core/models/api';
import { AuthService } from '../../core/services/auth.service';
import { FieldError } from '../../shared/components/field-error';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot, RouterLink, FieldError, Icon],
  template: `
    <h1 class="text-2xl">Sign in</h1>
    <p class="mt-1.5 text-ink-muted">Welcome back. Enter your work account details.</p>

    @if (error(); as error) {
      <div
        class="mt-6 flex gap-2 rounded-control border border-danger/20 bg-danger-soft p-3 text-danger"
        role="alert"
      >
        <app-icon [name]="error.status === 0 ? 'wifi-off' : 'error'" class="mt-0.5" />
        <p>{{ error.message }}</p>
      </div>
    }

    <form [formRoot]="loginForm" class="mt-6 space-y-5" novalidate>
      <div>
        <label for="email" class="field-label">Email</label>
        <div class="relative">
          <app-icon
            name="mail"
            [size]="16"
            class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
          />
          <input
            id="email"
            type="email"
            class="input pl-9"
            autocomplete="email"
            placeholder="you&#64;company.com"
            [formField]="loginForm.email"
            [attr.aria-invalid]="loginForm.email().touched() && loginForm.email().invalid()"
            aria-describedby="email-error"
          />
        </div>
        <app-field-error id="email-error" [field]="loginForm.email" />
      </div>

      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <label for="password" class="text-sm font-medium text-ink">Password</label>
          <a routerLink="/forgot-password" class="link text-xs">Forgot password?</a>
        </div>
        <div class="relative">
          <app-icon
            name="lock"
            [size]="16"
            class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
          />
          <input
            id="password"
            class="input pr-11 pl-9"
            autocomplete="current-password"
            placeholder="Enter your password"
            [type]="showPassword() ? 'text' : 'password'"
            [formField]="loginForm.password"
            [attr.aria-invalid]="loginForm.password().touched() && loginForm.password().invalid()"
            aria-describedby="password-error"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-control text-ink-faint hover:text-ink"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
            [attr.aria-pressed]="showPassword()"
            (click)="showPassword.set(!showPassword())"
          >
            <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="16" />
          </button>
        </div>
        <app-field-error id="password-error" [field]="loginForm.password" />
      </div>

      <label class="flex w-fit cursor-pointer items-center gap-2 text-ink-muted">
        <input type="checkbox" class="checkbox" [formField]="loginForm.remember" />
        Remember me on this device
      </label>

      <button type="submit" class="btn-primary w-full" [disabled]="loginForm().submitting()">
        @if (loginForm().submitting()) {
          <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              stroke-opacity="0.3"
              stroke-width="3"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            />
          </svg>
          Signing in…
        } @else {
          Sign in
        }
      </button>
    </form>

    <p class="mt-6 text-center text-ink-muted">
      New to NexusAI? <a routerLink="/setup" class="link">Set up your organization</a>
    </p>

    @if (isDemo) {
      <section class="mt-8 border-t border-line pt-6" aria-labelledby="demo-title">
        <h2 id="demo-title" class="text-xs font-medium text-ink-muted">Demo accounts</h2>
        <div class="mt-2 grid grid-cols-3 gap-2">
          @for (account of demoAccounts; track account.email) {
            <button
              type="button"
              class="rounded-control border border-line px-2 py-2 text-left transition-colors hover:border-brand hover:bg-brand-soft max-md:min-h-11"
              [attr.aria-label]="'Use ' + account.role + ' demo account'"
              (click)="useDemo(account.email)"
            >
              <span class="block text-xs font-medium text-ink">{{ account.role }}</span>
              <span class="block truncate text-[11px] text-ink-muted">{{ account.email }}</span>
            </button>
          }
        </div>
      </section>
    }
  `,
})
export default class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();

  protected readonly isDemo = environment.useMockApi;
  protected readonly error = signal<ApiError | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly demoAccounts = [
    { role: 'Admin', email: 'maya@nexus.io' },
    { role: 'Agent', email: 'daniel@nexus.io' },
    { role: 'Viewer', email: 'sara@nexus.io' },
  ];

  protected readonly loginForm = form(
    signal({ email: '', password: '', remember: true }),
    (path) => {
      required(path.email, { message: 'Enter your email address' });
      email(path.email, { message: 'Enter a valid email address' });
      required(path.password, { message: 'Enter your password' });
    },
    {
      submission: {
        action: async (field) => {
          const { email, password, remember } = field().value();
          this.error.set(null);
          try {
            await firstValueFrom(this.auth.login(email, password, remember));
            await this.router.navigateByUrl(this.returnUrl() || '/dashboard');
          } catch (error) {
            this.error.set(error as ApiError);
          }
          return undefined;
        },
      },
    },
  );

  /** Fills the form with a mock-backend account (any 6+ character password works). */
  protected useDemo(email: string): void {
    this.loginForm.email().value.set(email);
    this.loginForm.password().value.set('demo-password');
    this.error.set(null);
  }
}
