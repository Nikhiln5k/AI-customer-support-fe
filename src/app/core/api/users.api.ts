import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListQuery, Page } from '../models/api';
import { User, UserInput } from '../models/user';
import { toParams } from './http-params';

@Service()
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  list(query: ListQuery): Observable<Page<User>> {
    return this.http.get<Page<User>>(this.url, { params: toParams(query) });
  }

  /** Active agents, for assignee pickers. */
  agents(): Observable<User[]> {
    return this.http.get<User[]>(`${this.url}/agents`);
  }

  get(id: string): Observable<User> {
    return this.http.get<User>(`${this.url}/${id}`);
  }

  invite(input: UserInput): Observable<User> {
    return this.http.post<User>(this.url, input);
  }

  update(id: string, input: Partial<UserInput>): Observable<User> {
    return this.http.patch<User>(`${this.url}/${id}`, input);
  }
}
