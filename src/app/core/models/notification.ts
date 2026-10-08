export type NotificationType =
  'ticket_assigned' | 'ticket_reply' | 'sla_warning' | 'mention' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
