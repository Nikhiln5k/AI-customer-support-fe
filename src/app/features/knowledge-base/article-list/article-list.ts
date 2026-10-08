import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { KnowledgeApi } from '../../../core/api/knowledge.api';
import { ArticleStatus } from '../../../core/models/knowledge';
import { AuthService } from '../../../core/services/auth.service';
import { Drawer } from '../../../shared/components/drawer';
import { EmptyState } from '../../../shared/components/empty-state';
import { ErrorState } from '../../../shared/components/error-state';
import { FilterChips } from '../../../shared/components/filter-chips';
import { PageHeader } from '../../../shared/components/page-header';
import { Pagination } from '../../../shared/components/pagination';
import { SearchInput } from '../../../shared/components/search-input';
import { SkeletonRows } from '../../../shared/components/skeleton-rows';
import { ListQueryState } from '../../../shared/data/list-query';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { ARTICLE_STATUS } from '../../../shared/ui/labels';
import { ArticleFilters, ArticleFilterKeys } from './article-filters';

@Component({
  selector: 'app-article-list',
  imports: [
    RouterLink,
    PageHeader,
    SearchInput,
    FilterChips,
    Pagination,
    SkeletonRows,
    EmptyState,
    ErrorState,
    Drawer,
    Badge,
    Icon,
    RelativeTimePipe,
    ArticleFilters,
  ],
  templateUrl: './article-list.html',
})
export default class ArticleList {
  private readonly knowledgeApi = inject(KnowledgeApi);
  protected readonly canEdit = inject(AuthService).hasRole('admin', 'agent');

  protected readonly statusLabels = ARTICLE_STATUS;

  protected readonly categories = rxResource({
    stream: () => this.knowledgeApi.categories(),
    defaultValue: [],
  });

  protected readonly categoryList = computed(() =>
    this.categories.hasValue() ? this.categories.value() : [],
  );

  protected readonly list = new ListQueryState<ArticleFilterKeys>(
    { category: '', status: '' },
    (key, value) => (key === 'status' ? ARTICLE_STATUS[value as ArticleStatus].label : value),
  );

  protected readonly articles = rxResource({
    params: () => this.list.query(),
    stream: ({ params }) => this.knowledgeApi.list(params),
  });

  protected readonly rows = computed(() => this.articles.value()?.items ?? []);
  protected readonly total = computed(() => this.articles.value()?.total ?? 0);
  protected readonly filtersOpen = signal(false);

  /** Carries the current search over to the AI search page. */
  protected readonly askParams = computed(() => {
    const q = this.list.search().trim();
    return q ? { q } : {};
  });
}
