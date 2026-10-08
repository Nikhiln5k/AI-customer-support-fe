import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export default [
  {
    path: '',
    title: 'Customers · NexusAI',
    loadComponent: () => import('./customer-list/customer-list'),
  },
  {
    path: 'new',
    title: 'New customer · NexusAI',
    loadComponent: () => import('./customer-form/customer-form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    title: 'Customer · NexusAI',
    loadComponent: () => import('./customer-profile/customer-profile'),
  },
  {
    path: ':id/edit',
    title: 'Edit customer · NexusAI',
    loadComponent: () => import('./customer-form/customer-form'),
    canDeactivate: [unsavedChangesGuard],
  },
] satisfies Routes;
