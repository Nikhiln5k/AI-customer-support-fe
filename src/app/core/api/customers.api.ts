import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListQuery, Page } from '../models/api';
import { Customer, CustomerActivity, CustomerInput } from '../models/customer';
import { toParams } from './http-params';

@Service()
export class CustomersApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/customers`;

  list(query: ListQuery): Observable<Page<Customer>> {
    return this.http.get<Page<Customer>>(this.url, { params: toParams(query) });
  }

  get(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.url}/${id}`);
  }

  create(input: CustomerInput): Observable<Customer> {
    return this.http.post<Customer>(this.url, input);
  }

  update(id: string, input: CustomerInput): Observable<Customer> {
    return this.http.patch<Customer>(`${this.url}/${id}`, input);
  }

  activity(id: string): Observable<CustomerActivity[]> {
    return this.http.get<CustomerActivity[]>(`${this.url}/${id}/activity`);
  }
}
