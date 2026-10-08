import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../shared/components/empty-state';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, EmptyState],
  template: `
    <div class="card mt-10">
      <app-empty-state
        icon="search"
        title="Page not found"
        message="The page you’re looking for doesn’t exist or has been moved."
      >
        <a routerLink="/dashboard" class="btn-secondary">Back to dashboard</a>
      </app-empty-state>
    </div>
  `,
})
export default class NotFound {}
