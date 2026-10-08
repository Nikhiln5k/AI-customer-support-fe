import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./operations-layout'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'queues' },
      {
        path: 'queues',
        title: 'Queues · NexusAI',
        loadComponent: () => import('./queue-monitor/queue-monitor'),
      },
      {
        path: 'events',
        title: 'Events · NexusAI',
        loadComponent: () => import('./event-monitor/event-monitor'),
      },
    ],
  },
] satisfies Routes;
