import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { KnowledgeApi } from '../../../core/api/knowledge.api';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorState } from '../../../shared/components/error-state';
import { Breadcrumb, PageHeader } from '../../../shared/components/page-header';
import { SkeletonRows } from '../../../shared/components/skeleton-rows';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { ARTICLE_STATUS } from '../../../shared/ui/labels';
import { ArticleContent } from './article-content';

@Component({
  selector: 'app-article-detail',
  imports: [
    DatePipe,
    RouterLink,
    PageHeader,
    ErrorState,
    SkeletonRows,
    RelativeTimePipe,
    Badge,
    Icon,
    ArticleContent,
  ],
  template: `
    @let current = loaded();

    <app-page-header [title]="current?.title ?? 'Article'" [breadcrumbs]="breadcrumbs()">
      @if (current) {
        <a routerLink="/knowledge-base/ask" class="btn-secondary">
          <app-icon name="sparkles" [size]="16" />
          Ask AI
        </a>
        @if (canEdit) {
          <a routerLink="edit" class="btn-primary">
            <app-icon name="edit" [size]="16" />
            Edit
          </a>
        }
      }
    </app-page-header>

    @if (article.isLoading() && !current) {
      <div class="card"><app-skeleton-rows [rows]="8" /></div>
    } @else if (article.error()) {
      <div class="card">
        <app-error-state [error]="article.error()" (retry)="article.reload()" />
      </div>
    } @else if (current) {
      <div class="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <article class="card min-w-0 p-4 md:p-6 lg:col-span-2" aria-label="Article content">
          <app-article-content [content]="current.content" />
        </article>

        <aside class="card self-start p-4 md:p-6" aria-labelledby="details-heading">
          <h2 id="details-heading" class="text-base">Details</h2>
          <dl class="mt-4 space-y-4">
            <div>
              <dt class="text-xs font-medium text-ink-muted">Status</dt>
              <dd class="mt-1">
                <app-badge [tone]="statusLabels[current.status].tone" [dot]="true">
                  {{ statusLabels[current.status].label }}
                </app-badge>
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-ink-muted">Category</dt>
              <dd class="mt-1">{{ current.category }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-ink-muted">Tags</dt>
              <dd class="mt-1">
                @if (current.tags.length) {
                  <ul class="flex flex-wrap gap-1.5" aria-label="Tags">
                    @for (tag of current.tags; track tag) {
                      <li class="badge bg-subtle text-ink-muted">{{ tag }}</li>
                    }
                  </ul>
                } @else {
                  <span class="text-ink-muted">No tags</span>
                }
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-ink-muted">Author</dt>
              <dd class="mt-1">{{ current.author }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-ink-muted">Last updated</dt>
              <dd class="mt-1">
                <time
                  [attr.datetime]="current.updatedAt"
                  [title]="current.updatedAt | date: 'medium'"
                >
                  {{ current.updatedAt | relativeTime }}
                </time>
              </dd>
            </div>
          </dl>

          @if (current.status !== 'published') {
            <p class="mt-5 flex gap-2 rounded-control bg-warn-soft p-3 text-xs text-warn">
              <app-icon name="info" [size]="16" />
              This article isn’t published, so customers and AI search can’t see it.
            </p>
          }
        </aside>
      </div>
    }
  `,
})
export default class ArticleDetail {
  private readonly knowledgeApi = inject(KnowledgeApi);
  protected readonly canEdit = inject(AuthService).hasRole('admin', 'agent');

  readonly id = input.required<string>();

  protected readonly statusLabels = ARTICLE_STATUS;

  protected readonly article = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.knowledgeApi.get(params),
  });

  protected readonly loaded = computed(() =>
    this.article.hasValue() ? this.article.value() : undefined,
  );

  protected readonly breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'Knowledge Base', link: '/knowledge-base' },
    { label: this.loaded()?.title ?? 'Article' },
  ]);
}
