import { HttpClient, HttpEvent } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListQuery, Page } from '../models/api';
import { Attachment, Ticket, TicketInput, TicketMessage, TicketStatus } from '../models/ticket';
import { toParams } from './http-params';

@Service()
export class TicketsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tickets`;

  list(query: ListQuery): Observable<Page<Ticket>> {
    return this.http.get<Page<Ticket>>(this.url, { params: toParams(query) });
  }

  get(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.url}/${id}`);
  }

  create(input: TicketInput): Observable<Ticket> {
    return this.http.post<Ticket>(this.url, input);
  }

  update(id: string, changes: Partial<TicketInput>): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.url}/${id}`, changes);
  }

  bulkUpdateStatus(ids: string[], status: TicketStatus): Observable<void> {
    return this.http.post<void>(`${this.url}/bulk-status`, { ids, status });
  }

  messages(id: string): Observable<TicketMessage[]> {
    return this.http.get<TicketMessage[]>(`${this.url}/${id}/messages`);
  }

  sendMessage(
    id: string,
    message: { body: string; kind: 'reply' | 'note'; attachmentIds: string[] },
  ): Observable<TicketMessage> {
    return this.http.post<TicketMessage>(`${this.url}/${id}/messages`, message);
  }

  uploadAttachment(file: File): Observable<HttpEvent<Attachment>> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<Attachment>(`${environment.apiUrl}/attachments`, body, {
      reportProgress: true,
      observe: 'events',
    });
  }
}
