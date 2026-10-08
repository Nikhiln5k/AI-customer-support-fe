import { Component, computed, inject } from '@angular/core';
import { RealtimeService } from '../../core/services/realtime.service';

const STATES = {
  connecting: { label: 'Connecting', dot: 'bg-warn animate-pulse' },
  connected: { label: 'Live', dot: 'bg-brand' },
  reconnecting: { label: 'Reconnecting', dot: 'bg-warn animate-pulse' },
  disconnected: { label: 'Offline', dot: 'bg-danger' },
};

@Component({
  selector: 'app-connection-status',
  host: { class: 'inline-flex' },
  template: `
    <span
      class="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted"
      role="status"
      [attr.aria-label]="'Realtime connection: ' + view().label"
    >
      <span class="size-2 rounded-full" [class]="view().dot"></span>
      {{ view().label }}
      @if (realtime.state() === 'disconnected') {
        <button type="button" class="link ml-1" (click)="realtime.reconnect()">Retry</button>
      }
    </span>
  `,
})
export class ConnectionStatus {
  protected readonly realtime = inject(RealtimeService);
  protected readonly view = computed(() => STATES[this.realtime.state()]);
}
