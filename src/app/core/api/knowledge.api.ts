import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListQuery, Page } from '../models/api';
import { Article, ArticleInput, RagAnswer } from '../models/knowledge';
import { toParams } from './http-params';

@Service()
export class KnowledgeApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/articles`;

  list(query: ListQuery): Observable<Page<Article>> {
    return this.http.get<Page<Article>>(this.url, { params: toParams(query) });
  }

  categories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/categories`);
  }

  get(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.url}/${id}`);
  }

  create(input: ArticleInput): Observable<Article> {
    return this.http.post<Article>(this.url, input);
  }

  update(id: string, input: ArticleInput): Observable<Article> {
    return this.http.patch<Article>(`${this.url}/${id}`, input);
  }

  ask(question: string): Observable<RagAnswer> {
    return this.http.post<RagAnswer>(`${this.url}/ask`, { question });
  }
}
