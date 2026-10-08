import { DestroyRef, Service, effect, inject, signal } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConnectionState } from '../models/api';
import { AuthService } from './auth.service';
import { MockSocket } from '../mock/mock-socket';

export interface RealtimeEvent<T = unknown> {
  event: string;
  data: T;
}

const MAX_RETRY_DELAY = 15_000;

@Service()
export class RealtimeService {
  private readonly auth = inject(AuthService);
  private readonly events$ = new Subject<RealtimeEvent>();

  private socket: WebSocket | MockSocket | null = null;
  private retries = 0;
  private retryTimer?: ReturnType<typeof setTimeout>;

  readonly state = signal<ConnectionState>('disconnected');

  constructor() {
    effect(() => (this.auth.token() ? this.connect() : this.disconnect()));
    inject(DestroyRef).onDestroy(() => this.disconnect());
  }

  on<T>(event: string): Observable<T> {
    return this.events$.pipe(
      filter((message) => message.event === event),
      map((message) => message.data as T),
    );
  }

  send(event: string, data: unknown): void {
    if (this.state() === 'connected') {
      this.socket?.send(JSON.stringify({ event, data }));
    }
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  private connect(): void {
    if (this.socket) return;

    this.state.set(this.retries > 0 ? 'reconnecting' : 'connecting');
    const token = this.auth.token() ?? '';
    const socket = environment.useMockApi
      ? new MockSocket()
      : new WebSocket(`${environment.wsUrl}?token=${encodeURIComponent(token)}`);

    socket.onopen = () => {
      this.retries = 0;
      this.state.set('connected');
    };
    socket.onmessage = ({ data }: { data: string }) => {
      try {
        this.events$.next(JSON.parse(data) as RealtimeEvent);
      } catch {
        // Ignore malformed frames.
      }
    };
    socket.onclose = () => {
      this.socket = null;
      if (this.auth.token()) this.scheduleReconnect();
    };

    this.socket = socket;
  }

  private scheduleReconnect(): void {
    this.state.set('reconnecting');
    const delay = Math.min(1000 * 2 ** this.retries++, MAX_RETRY_DELAY);
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }

  private disconnect(): void {
    clearTimeout(this.retryTimer);
    this.retries = 0;
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.state.set('disconnected');
  }
}
