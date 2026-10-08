import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { UsersApi } from '../../../core/api/users.api';
import { Role, User, UserStatus } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { Drawer } from '../../../shared/components/drawer';
import { EmptyState } from '../../../shared/components/empty-state';
import { ErrorState } from '../../../shared/components/error-state';
import { FilterChips } from '../../../shared/components/filter-chips';
import { PageHeader } from '../../../shared/components/page-header';
import { Pagination } from '../../../shared/components/pagination';
import { SearchInput } from '../../../shared/components/search-input';
import { SkeletonRows } from '../../../shared/components/skeleton-rows';
import { ListQueryState } from '../../../shared/data/list-query';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Avatar } from '../../../shared/ui/avatar';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { ROLE_LABEL, USER_STATUS } from '../../../shared/ui/labels';
import { Menu } from '../../../shared/ui/menu';
import { UserFilters } from './user-filters';

@Component({
  selector: 'app-user-list',
  imports: [
    RouterLink,
    PageHeader,
    SearchInput,
    FilterChips,
    Pagination,
    SkeletonRows,
    EmptyState,
    ErrorState,
    Drawer,
    Avatar,
    Badge,
    Icon,
    Menu,
    RelativeTimePipe,
    UserFilters,
  ],
  templateUrl: './user-list.html',
})
export default class UserList {
  private readonly usersApi = inject(UsersApi);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  protected readonly currentUserId = inject(AuthService).user()?.id;

  protected readonly roleLabels = ROLE_LABEL;
  protected readonly statusLabels = USER_STATUS;

  protected readonly list = new ListQueryState({ role: '', status: '' }, (key, value) =>
    key === 'role' ? ROLE_LABEL[value as Role] : USER_STATUS[value as UserStatus].label,
  );

  protected readonly users = rxResource({
    params: () => this.list.query(),
    stream: ({ params }) => this.usersApi.list(params),
  });

  protected readonly rows = computed(() => this.users.value()?.items ?? []);
  protected readonly total = computed(() => this.users.value()?.total ?? 0);
  protected readonly filtersOpen = signal(false);

  protected async toggleDisabled(user: User): Promise<void> {
    const disabling = user.status !== 'disabled';
    const confirmed = await this.confirm.ask(
      disabling
        ? {
            title: `Disable ${user.name}?`,
            message:
              'They will be signed out and can no longer access NexusAI. You can re-enable them later.',
            confirmLabel: 'Disable user',
            destructive: true,
          }
        : {
            title: `Enable ${user.name}?`,
            message: 'They will regain access with their current role.',
            confirmLabel: 'Enable user',
          },
    );
    if (!confirmed) return;

    this.usersApi.update(user.id, { status: disabling ? 'disabled' : 'active' }).subscribe({
      next: () => {
        this.toast.success(`${user.name} ${disabling ? 'disabled' : 'enabled'}`);
        this.users.reload();
      },
      error: (error) => this.toast.error(error.message),
    });
  }
}
