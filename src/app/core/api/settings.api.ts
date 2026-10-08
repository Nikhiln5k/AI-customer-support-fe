import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActiveSession,
  AiSettings,
  NotificationPreferences,
  OrganizationSettings,
} from '../models/settings';
import { User } from '../models/user';

@Service()
export class SettingsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/settings`;

  updateProfile(profile: { name: string; email: string }): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/me`, profile);
  }

  organization(): Observable<OrganizationSettings> {
    return this.http.get<OrganizationSettings>(`${this.url}/organization`);
  }

  saveOrganization(settings: OrganizationSettings): Observable<OrganizationSettings> {
    return this.http.put<OrganizationSettings>(`${this.url}/organization`, settings);
  }

  notifications(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.url}/notifications`);
  }

  saveNotifications(prefs: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.url}/notifications`, prefs);
  }

  ai(): Observable<AiSettings> {
    return this.http.get<AiSettings>(`${this.url}/ai`);
  }

  saveAi(settings: AiSettings): Observable<AiSettings> {
    return this.http.put<AiSettings>(`${this.url}/ai`, settings);
  }

  sessions(): Observable<ActiveSession[]> {
    return this.http.get<ActiveSession[]>(`${this.url}/sessions`);
  }

  revokeSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/sessions/${id}`);
  }
}
