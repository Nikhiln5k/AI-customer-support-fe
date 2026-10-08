import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, Session } from '../models/user';

const STORAGE_KEY = 'nexus.session';

export interface OrganizationSetup {
  organizationName: string;
  adminName: string;
  email: string;
  password: string;
}

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly session = signal<Session | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly organization = computed(() => this.session()?.organization ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  login(email: string, password: string, remember: boolean): Observable<Session> {
    return this.http
      .post<Session>(`${this.url}/login`, { email, password })
      .pipe(tap((session) => this.store(session, remember)));
  }

  setupOrganization(input: OrganizationSetup): Observable<Session> {
    return this.http
      .post<Session>(`${this.url}/setup`, input)
      .pipe(tap((session) => this.store(session, true)));
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${this.url}/forgot-password`, { email });
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.user()?.role;
    return !!role && roles.includes(role);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
    this.router.navigate(['/login']);
  }

  private store(session: Session, remember: boolean): void {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}
