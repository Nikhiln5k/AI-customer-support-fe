import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiAction, AiResult } from '../models/ai';

export interface AiRequest {
  ticketId?: string;
  text?: string;
}

@Service()
export class AiApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ai`;

  run(action: AiAction, request: AiRequest): Observable<AiResult> {
    return this.http.post<AiResult>(`${this.url}/${action}`, request);
  }
}
