import { Service, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationsApi } from '../api/notifications.api';
import { ApiError } from '../models/api';
import { AppNotification } from '../models/notification';
import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';
import { ToastService } from './toast.service';

/** Shared notification state, used by the top bar badge and the notifications page. */
@Service()
export class NotificationCenter {
  private readonly api = inject(NotificationsApi);
  private readonly toast = inject(ToastService);

  readonly items = signal<AppNotification[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly unreadCount = computed(() => this.items().filter((n) => !n.read).length);

  constructor() {
    const auth = inject(AuthService);
    effect(() => (auth.isAuthenticated() ? this.load() : this.items.set([])));

    inject(RealtimeService)
      .on<AppNotification>('notification:new')
      .pipe(takeUntilDestroyed())
      .subscribe((notification) => {
        this.items.update((list) => [notification, ...list]);
        this.toast.info(notification.title);
      });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.error.set(error);
        this.loading.set(false);
      },
    });
  }

  markRead(id: string): void {
    this.setRead((n) => n.id === id);
    this.api.markRead(id).subscribe({ error: () => this.load() });
  }

  markAllRead(): void {
    this.setRead(() => true);
    this.api.markAllRead().subscribe({ error: () => this.load() });
  }

  private setRead(match: (n: AppNotification) => boolean): void {
    this.items.update((list) => list.map((n) => (match(n) ? { ...n, read: true } : n)));
  }
}
