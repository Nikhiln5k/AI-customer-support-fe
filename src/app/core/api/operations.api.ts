import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListQuery, Page } from '../models/api';
import { BrokerEvent, Job, QueueStats } from '../models/operations';
import { toParams } from './http-params';

@Service()
export class OperationsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/operations`;

  queues(): Observable<QueueStats[]> {
    return this.http.get<QueueStats[]>(`${this.url}/queues`);
  }

  jobs(queue: string, query: ListQuery): Observable<Page<Job>> {
    return this.http.get<Page<Job>>(`${this.url}/queues/${queue}/jobs`, {
      params: toParams(query),
    });
  }

  retryJob(queue: string, id: string): Observable<void> {
    return this.http.post<void>(`${this.url}/queues/${queue}/jobs/${id}/retry`, {});
  }

  removeJob(queue: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/queues/${queue}/jobs/${id}`);
  }

  events(query: ListQuery): Observable<Page<BrokerEvent>> {
    return this.http.get<Page<BrokerEvent>>(`${this.url}/events`, { params: toParams(query) });
  }
}
