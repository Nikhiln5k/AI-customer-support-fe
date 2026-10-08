import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  FormField,
  FormRoot,
  disabled,
  email,
  form,
  maxLength,
  required,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsersApi } from '../../../core/api/users.api';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { ApiError } from '../../../core/models/api';
import { Role, UserInput } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ErrorState } from '../../../shared/components/error-state';
import { FieldError } from '../../../shared/components/field-error';
import { Breadcrumb, PageHeader } from '../../../shared/components/page-header';
import { USER_STATUS, toOptions } from '../../../shared/ui/labels';

const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access, including team, settings and audit logs.',
  },
  {
    value: 'agent',
    label: 'Agent',
    description: 'Works tickets, replies to customers and uses AI tools.',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to tickets, customers and reports.',
  },
];

@Component({
  selector: 'app-user-form',
  imports: [FormField, FormRoot, RouterLink, PageHeader, ErrorState, FieldError],
  templateUrl: './user-form.html',
})
export default class UserForm implements HasUnsavedChanges {
  private readonly usersApi = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly currentUserId = inject(AuthService).user()?.id;

  /** Route param; present in edit mode. */
  readonly id = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly isSelf = computed(() => !!this.id() && this.id() === this.currentUserId);
  protected readonly roles = ROLES;
  protected readonly statuses = toOptions(USER_STATUS);
  protected readonly saveError = signal<ApiError | null>(null);
  private saved = false;

  protected readonly user = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.usersApi.get(params),
  });

  protected readonly breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'Team', link: '/team' },
    { label: this.isEdit() ? (this.user.value()?.name ?? '…') : 'Invite user' },
  ]);

  private readonly model = signal<UserInput>({
    name: '',
    email: '',
    role: 'agent',
    status: 'invited',
  });

  protected readonly userForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Enter their name' });
      maxLength(path.name, 120, { message: 'Keep the name under 120 characters' });
      required(path.email, { message: 'Enter their work email' });
      email(path.email, { message: 'Enter a valid email address' });
      // Stop admins from locking themselves out.
      disabled(path.role, () => this.isSelf());
      disabled(path.status, () => this.isSelf());
    },
    { submission: { action: async () => this.save() } },
  );

  constructor() {
    effect(() => {
      const user = this.user.value();
      if (!user) return;
      const { name, email, role, status } = user;
      this.userForm().reset({ name, email, role, status });
    });
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && this.userForm().dirty();
  }

  private async save(): Promise<undefined> {
    const value = this.model();
    const input: UserInput = {
      name: value.name.trim(),
      email: value.email.trim().toLowerCase(),
      role: value.role,
      status: this.isEdit() ? value.status : 'invited',
    };

    this.saveError.set(null);
    try {
      const id = this.id();
      const user = await firstValueFrom(
        id ? this.usersApi.update(id, input) : this.usersApi.invite(input),
      );
      this.saved = true;
      this.toast.success(id ? `${user.name} updated` : `Invitation sent to ${user.email}`);
      await this.router.navigate(['/team']);
    } catch (error) {
      this.saveError.set(error as ApiError);
    }
    return undefined;
  }
}
