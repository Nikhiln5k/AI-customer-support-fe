import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export default [
  {
    path: '',
    title: 'Team · NexusAI',
    loadComponent: () => import('./user-list/user-list'),
  },
  {
    path: 'invite',
    title: 'Invite user · NexusAI',
    loadComponent: () => import('./user-form/user-form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    title: 'Edit user · NexusAI',
    loadComponent: () => import('./user-form/user-form'),
    canDeactivate: [unsavedChangesGuard],
  },
] satisfies Routes;
