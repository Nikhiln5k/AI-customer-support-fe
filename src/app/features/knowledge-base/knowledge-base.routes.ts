import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export default [
  {
    path: '',
    title: 'Knowledge Base · NexusAI',
    loadComponent: () => import('./article-list/article-list'),
  },
  {
    path: 'new',
    title: 'New article · NexusAI',
    loadComponent: () => import('./article-form/article-form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'ask',
    title: 'Ask AI · NexusAI',
    loadComponent: () => import('./knowledge-ask/knowledge-ask'),
  },
  {
    path: ':id',
    title: 'Article · NexusAI',
    loadComponent: () => import('./article-detail/article-detail'),
  },
  {
    path: ':id/edit',
    title: 'Edit article · NexusAI',
    loadComponent: () => import('./article-form/article-form'),
    canDeactivate: [unsavedChangesGuard],
  },
] satisfies Routes;
