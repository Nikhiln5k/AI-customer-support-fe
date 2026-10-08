import { Routes } from '@angular/router';
import { AuthLayout } from './auth-layout';

export default [
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: 'login', title: 'Sign in · NexusAI', loadComponent: () => import('./login') },
      {
        path: 'forgot-password',
        title: 'Reset password · NexusAI',
        loadComponent: () => import('./forgot-password'),
      },
      {
        path: 'setup',
        title: 'Set up your organization · NexusAI',
        loadComponent: () => import('./organization-setup'),
      },
    ],
  },
] satisfies Routes;
