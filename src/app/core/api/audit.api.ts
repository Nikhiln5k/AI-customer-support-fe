import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListQuery, Page } from '../models/api';
import { AuditLog } from '../models/audit';
import { toParams } from './http-params';

@Service()
export class AuditApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/audit-logs`;

  list(query: ListQuery): Observable<Page<AuditLog>> {
    return this.http.get<Page<AuditLog>>(this.url, { params: toParams(query) });
  }

  get(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.url}/${id}`);
  }
}
