import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNotification, NotificationType } from '../../core/models/notification';
import { NotificationCenter } from '../../core/services/notification-center.service';
import { ConnectionStatus } from '../../shared/components/connection-status';
import { EmptyState } from '../../shared/components/empty-state';
import { ErrorState } from '../../shared/components/error-state';
import { PageHeader } from '../../shared/components/page-header';
import { SkeletonRows } from '../../shared/components/skeleton-rows';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { Icon, IconName } from '../../shared/ui/icon';

const TYPES: Record<NotificationType, { label: string; icon: IconName; color: string }> = {
  ticket_assigned: { label: 'Assignment', icon: 'ticket', color: 'bg-info-soft text-info' },
  ticket_reply: { label: 'Reply', icon: 'mail', color: 'bg-brand-soft text-brand-ink' },
  sla_warning: { label: 'SLA warning', icon: 'clock', color: 'bg-warn-soft text-warn' },
  mention: { label: 'Mention', icon: 'users', color: 'bg-info-soft text-info' },
  system: { label: 'System', icon: 'info', color: 'bg-subtle text-ink-muted' },
};

type View = 'all' | 'unread';

@Component({
  selector: 'app-notifications',
  imports: [
    RouterLink,
    PageHeader,
    ConnectionStatus,
    SkeletonRows,
    EmptyState,
    ErrorState,
    Icon,
    RelativeTimePipe,
  ],
  templateUrl: './notifications.html',
})
export default class Notifications {
  protected readonly center = inject(NotificationCenter);

  protected readonly types = TYPES;
  protected readonly view = signal<View>('all');
  protected readonly views: { value: View; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
  ];

  protected readonly visible = computed(() => {
    const items = this.center.items();
    return this.view() === 'unread' ? items.filter((n) => !n.read) : items;
  });

  protected readonly description = computed(() => {
    const count = this.center.unreadCount();
    return count
      ? `You have ${count} unread ${count === 1 ? 'notification' : 'notifications'}.`
      : 'You’re all caught up.';
  });

  protected open(notification: AppNotification): void {
    if (!notification.read) this.center.markRead(notification.id);
  }
}
