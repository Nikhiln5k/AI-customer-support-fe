import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export default [
  {
    path: '',
    title: 'Tickets · NexusAI',
    loadComponent: () => import('./ticket-list/ticket-list'),
  },
  {
    path: 'new',
    title: 'New ticket · NexusAI',
    loadComponent: () => import('./ticket-form/ticket-form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    title: 'Ticket · NexusAI',
    loadComponent: () => import('./ticket-detail/ticket-detail'),
  },
  {
    path: ':id/edit',
    title: 'Edit ticket · NexusAI',
    loadComponent: () => import('./ticket-form/ticket-form'),
    canDeactivate: [unsavedChangesGuard],
  },
] satisfies Routes;
