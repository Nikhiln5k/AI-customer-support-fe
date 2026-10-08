import { DatePipe } from '@angular/common';
import { Component, ElementRef, afterRenderEffect, inject, input, output } from '@angular/core';
import { DeliveryState, TicketMessage } from '../../../core/models/ticket';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { Avatar } from '../../../shared/ui/avatar';
import { Icon, IconName } from '../../../shared/ui/icon';

const DELIVERY: Record<DeliveryState, { icon: IconName; label: string }> = {
  sending: { icon: 'clock', label: 'Sending' },
  sent: { icon: 'check', label: 'Sent' },
  delivered: { icon: 'check-double', label: 'Delivered' },
  read: { icon: 'check-double', label: 'Read' },
  failed: { icon: 'error', label: 'Failed to send' },
};

@Component({
  selector: 'app-message-thread',
  imports: [DatePipe, Avatar, Icon, FileSizePipe],
  host: { class: 'block overflow-y-auto' },
  template: `
    <ol class="space-y-5" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
      @for (message of messages(); track message.id) {
        @switch (message.kind) {
          @case ('event') {
            <li class="flex items-center gap-3 text-xs text-ink-faint">
              <span class="h-px flex-1 bg-line"></span>
              {{ message.body }} · {{ message.createdAt | date: 'MMM d, HH:mm' }}
              <span class="h-px flex-1 bg-line"></span>
            </li>
          }
          @default {
            @let fromAgent = message.author.type === 'agent';
            <li class="flex gap-3" [class.flex-row-reverse]="fromAgent">
              <app-avatar [name]="message.author.name" [size]="32" class="mt-0.5" />
              <div class="max-w-[85%] min-w-0 md:max-w-[75%]" [class.text-right]="fromAgent">
                <p class="mb-1 text-xs text-ink-muted">
                  <span class="font-medium text-ink">{{ message.author.name }}</span>
                  · {{ message.createdAt | date: 'MMM d, HH:mm' }}
                  @if (message.kind === 'note') {
                    · <span class="font-medium text-warn">Internal note</span>
                  }
                </p>
                <div
                  class="inline-block rounded-card border px-3.5 py-2.5 text-left whitespace-pre-line"
                  [class]="bubbleClass(message)"
                >
                  {{ message.body }}

                  @if (message.attachments.length) {
                    <ul class="mt-2 space-y-1">
                      @for (file of message.attachments; track file.id) {
                        <li>
                          <a
                            [href]="file.url"
                            target="_blank"
                            rel="noopener"
                            class="inline-flex items-center gap-1.5 text-xs underline-offset-2 hover:underline"
                          >
                            <app-icon name="paperclip" [size]="12" />
                            {{ file.name }} ({{ file.size | fileSize }})
                          </a>
                        </li>
                      }
                    </ul>
                  }
                </div>

                @if (fromAgent) {
                  <p
                    class="mt-1 flex items-center justify-end gap-1 text-xs"
                    [class]="message.state === 'failed' ? 'text-danger' : 'text-ink-faint'"
                  >
                    <app-icon
                      [name]="delivery[message.state].icon"
                      [size]="13"
                      [class.text-brand]="message.state === 'read'"
                    />
                    {{ delivery[message.state].label }}
                    @if (message.state === 'failed') {
                      <button type="button" class="link ml-1 text-xs" (click)="retry.emit(message)">
                        Retry
                      </button>
                    }
                  </p>
                }
              </div>
            </li>
          }
        }
      }
    </ol>

    @if (typing(); as name) {
      <p class="mt-4 flex items-center gap-2 text-xs text-ink-muted" role="status">
        <span class="flex gap-0.5" aria-hidden="true">
          <span class="size-1.5 animate-bounce rounded-full bg-ink-faint"></span>
          <span
            class="size-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:150ms]"
          ></span>
          <span
            class="size-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:300ms]"
          ></span>
        </span>
        {{ name }} is typing…
      </p>
    }
  `,
})
export class MessageThread {
  readonly messages = input.required<TicketMessage[]>();
  readonly typing = input<string | null>(null);
  readonly retry = output<TicketMessage>();

  protected readonly delivery = DELIVERY;

  constructor() {
    // Keep the newest message in view.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterRenderEffect(() => {
      this.messages();
      this.typing();
      host.scrollTop = host.scrollHeight;
    });
  }

  protected bubbleClass(message: TicketMessage): string {
    if (message.kind === 'note') return 'border-warn/30 bg-warn-soft text-ink';
    if (message.author.type === 'agent') return 'border-brand/20 bg-brand-soft text-ink';
    return 'border-line bg-surface text-ink';
  }
}
