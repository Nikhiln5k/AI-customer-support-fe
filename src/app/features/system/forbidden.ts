import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../shared/components/empty-state';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, EmptyState],
  template: `
    <div class="card mt-10">
      <app-empty-state
        icon="lock"
        title="You don’t have access to this page"
        message="This area is limited to administrators. Ask an admin if you need access."
      >
        <a routerLink="/dashboard" class="btn-secondary">Back to dashboard</a>
      </app-empty-state>
    </div>
  `,
})
export default class Forbidden {}
