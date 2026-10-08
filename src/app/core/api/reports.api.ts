import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummary, ReportData } from '../models/dashboard';

export type DateRange = '7d' | '30d' | '90d';

@Service()
export class ReportsApi {
  private readonly http = inject(HttpClient);

  dashboard(range: DateRange): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard`, {
      params: { range },
    });
  }

  reports(range: DateRange): Observable<ReportData> {
    return this.http.get<ReportData>(`${environment.apiUrl}/reports`, { params: { range } });
  }
}
