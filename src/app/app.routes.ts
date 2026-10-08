import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes'),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · NexusAI',
        loadComponent: () => import('./features/dashboard/dashboard'),
      },
      { path: 'tickets', loadChildren: () => import('./features/tickets/tickets.routes') },
      { path: 'customers', loadChildren: () => import('./features/customers/customers.routes') },
      {
        path: 'knowledge-base',
        loadChildren: () => import('./features/knowledge-base/knowledge-base.routes'),
      },
      {
        path: 'ai',
        title: 'AI Workspace · NexusAI',
        loadComponent: () => import('./features/ai/ai-workspace'),
      },
      {
        path: 'notifications',
        title: 'Notifications · NexusAI',
        loadComponent: () => import('./features/notifications/notifications'),
      },
      {
        path: 'reports',
        title: 'Reports · NexusAI',
        loadComponent: () => import('./features/reports/reports'),
      },
      {
        path: 'operations',
        canMatch: [roleGuard('admin')],
        loadChildren: () => import('./features/operations/operations.routes'),
      },
      {
        path: 'team',
        canMatch: [roleGuard('admin')],
        loadChildren: () => import('./features/team/team.routes'),
      },
      {
        path: 'audit-logs',
        canMatch: [roleGuard('admin')],
        title: 'Audit Logs · NexusAI',
        loadComponent: () => import('./features/audit/audit-logs'),
      },
      {
        path: 'settings',
        title: 'Settings · NexusAI',
        loadComponent: () => import('./features/settings/settings'),
      },
      {
        path: 'forbidden',
        title: 'Access denied · NexusAI',
        loadComponent: () => import('./features/system/forbidden'),
      },
      {
        path: '**',
        title: 'Not found · NexusAI',
        loadComponent: () => import('./features/system/not-found'),
      },
    ],
  },
];
