import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, form, maxLength, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { KnowledgeApi } from '../../../core/api/knowledge.api';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { ApiError, toApiError } from '../../../core/models/api';
import { Article, ArticleInput, ArticleStatus } from '../../../core/models/knowledge';
import { ToastService } from '../../../core/services/toast.service';
import { ErrorState } from '../../../shared/components/error-state';
import { FieldError } from '../../../shared/components/field-error';
import { Breadcrumb, PageHeader } from '../../../shared/components/page-header';
import { SkeletonRows } from '../../../shared/components/skeleton-rows';
import { Icon } from '../../../shared/ui/icon';
import { ARTICLE_STATUS, toOptions } from '../../../shared/ui/labels';

interface ArticleModel {
  title: string;
  category: string;
  content: string;
  tags: string;
  status: ArticleStatus;
}

const toModel = (article: Article): ArticleModel => ({
  title: article.title,
  category: article.category,
  content: article.content,
  tags: article.tags.join(', '),
  status: article.status,
});

const toInput = (model: ArticleModel): ArticleInput => ({
  title: model.title.trim(),
  category: model.category,
  content: model.content.trim(),
  status: model.status,
  tags: [...new Set(model.tags.split(',').map((tag) => tag.trim().toLowerCase()))].filter(Boolean),
});

@Component({
  selector: 'app-article-form',
  imports: [
    FormField,
    FormRoot,
    RouterLink,
    PageHeader,
    ErrorState,
    SkeletonRows,
    FieldError,
    Icon,
  ],
  templateUrl: './article-form.html',
})
export default class ArticleForm implements HasUnsavedChanges {
  private readonly knowledgeApi = inject(KnowledgeApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Present in edit mode (`/knowledge-base/:id/edit`). */
  readonly id = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly statuses = toOptions(ARTICLE_STATUS);
  protected readonly error = signal<ApiError | null>(null);
  private saved = false;

  protected readonly categories = rxResource({
    stream: () => this.knowledgeApi.categories(),
    defaultValue: [],
  });

  protected readonly article = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.knowledgeApi.get(params),
  });

  private readonly loaded = computed(() =>
    this.article.hasValue() ? this.article.value() : undefined,
  );

  protected readonly breadcrumbs = computed<Breadcrumb[]>(() => {
    const article = this.loaded();
    return [
      { label: 'Knowledge Base', link: '/knowledge-base' },
      ...(article ? [{ label: article.title, link: `/knowledge-base/${article.id}` }] : []),
      { label: this.isEdit() ? 'Edit' : 'New article' },
    ];
  });

  /** Categories from the API, plus the article's own category if it isn't listed yet. */
  protected readonly categoryOptions = computed(() => {
    const current = this.loaded()?.category;
    const list = this.categories.hasValue() ? this.categories.value() : [];
    return current && !list.includes(current) ? [...list, current] : list;
  });

  private readonly model = signal<ArticleModel>({
    title: '',
    category: '',
    content: '',
    tags: '',
    status: 'draft',
  });

  protected readonly articleForm = form(
    this.model,
    (path) => {
      required(path.title, { message: 'Enter a title' });
      maxLength(path.title, 120, { message: 'Keep the title under 120 characters' });
      required(path.category, { message: 'Choose a category' });
      required(path.content, { message: 'Write the article content' });
      minLength(path.content, 20, { message: 'Add a little more detail (at least 20 characters)' });
    },
    {
      submission: {
        action: async (field) => {
          this.error.set(null);
          const input = toInput(field().value());
          const id = this.id();
          try {
            const article = await firstValueFrom(
              id ? this.knowledgeApi.update(id, input) : this.knowledgeApi.create(input),
            );
            this.saved = true;
            this.toast.success(id ? 'Article updated' : 'Article created');
            await this.router.navigate(['/knowledge-base', article.id]);
          } catch (error) {
            this.error.set(toApiError(error));
          }
          return undefined;
        },
      },
    },
  );

  protected readonly tagPreview = computed(() => toInput(this.model()).tags);

  constructor() {
    effect(() => {
      const article = this.loaded();
      if (article) untracked(() => this.model.set(toModel(article)));
    });
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && this.articleForm().dirty();
  }
}
