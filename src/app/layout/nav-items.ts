import { Role } from '../core/models/user';
import { IconName } from '../shared/ui/icon';

export interface NavItem {
  label: string;
  link: string;
  icon: IconName;
  roles?: Role[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Support',
    items: [
      { label: 'Dashboard', link: '/dashboard', icon: 'dashboard' },
      { label: 'Tickets', link: '/tickets', icon: 'ticket' },
      { label: 'Customers', link: '/customers', icon: 'users' },
      { label: 'Knowledge Base', link: '/knowledge-base', icon: 'book' },
      { label: 'AI Workspace', link: '/ai', icon: 'sparkles' },
      { label: 'Notifications', link: '/notifications', icon: 'bell' },
    ],
  },
  {
    label: 'Insights',
    items: [{ label: 'Reports', link: '/reports', icon: 'chart' }],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Operations', link: '/operations', icon: 'activity', roles: ['admin'] },
      { label: 'Team', link: '/team', icon: 'team', roles: ['admin'] },
      { label: 'Audit Logs', link: '/audit-logs', icon: 'audit', roles: ['admin'] },
      { label: 'Settings', link: '/settings', icon: 'settings' },
    ],
  },
];

export const MOBILE_NAV: NavItem[] = [
  { label: 'Home', link: '/dashboard', icon: 'dashboard' },
  { label: 'Tickets', link: '/tickets', icon: 'ticket' },
  { label: 'Customers', link: '/customers', icon: 'users' },
  { label: 'AI', link: '/ai', icon: 'sparkles' },
];
