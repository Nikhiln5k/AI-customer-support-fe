import { HttpEventType } from '@angular/common/http';
import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { TicketsApi } from '../../../core/api/tickets.api';
import { ApiError } from '../../../core/models/api';
import { Attachment } from '../../../core/models/ticket';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { Icon } from '../../../shared/ui/icon';
import { OutgoingMessage } from './ticket-conversation';

interface Upload {
  key: number;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  preview: string | null;
  attachment?: Attachment;
  error?: string;
}

const UPLOAD_LABEL: Record<Upload['status'], string> = {
  uploading: 'Uploading',
  processing: 'Processing',
  completed: 'Ready',
  failed: 'Failed',
};

@Component({
  selector: 'app-reply-composer',
  imports: [Icon, FileSizePipe],
  host: { class: 'block' },
  template: `
    <div class="rounded-card border border-line-strong bg-surface focus-within:border-brand">
      <div class="flex gap-1 border-b border-line p-1" role="radiogroup" aria-label="Message type">
        @for (option of kinds; track option.value) {
          <button
            type="button"
            role="radio"
            class="min-h-9 rounded-control px-3 text-sm font-medium transition-colors"
            [class]="kind() === option.value ? option.active : 'text-ink-muted hover:bg-subtle'"
            [attr.aria-checked]="kind() === option.value"
            (click)="kind.set(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>

      <label for="composer" class="sr-only">
        {{ kind() === 'reply' ? 'Reply to customer' : 'Internal note' }}
      </label>
      <textarea
        id="composer"
        rows="3"
        class="block w-full resize-y bg-transparent px-3.5 py-3 text-sm placeholder:text-ink-faint focus:outline-none"
        [placeholder]="
          kind() === 'reply'
            ? 'Write a reply… (Ctrl + Enter to send)'
            : 'Add a note visible only to your team…'
        "
        [value]="draft()"
        (input)="draft.set($any($event.target).value)"
        (keydown.control.enter)="submit()"
        (keydown.meta.enter)="submit()"
      ></textarea>

      @if (uploads().length) {
        <ul class="space-y-2 px-3 pb-3" aria-label="Attachments">
          @for (upload of uploads(); track upload.key) {
            <li class="flex items-center gap-3 rounded-control border border-line p-2">
              @if (upload.preview) {
                <img [src]="upload.preview" alt="" class="size-10 rounded object-cover" />
              } @else {
                <span
                  class="flex size-10 items-center justify-center rounded bg-subtle text-ink-muted"
                >
                  <app-icon name="file" />
                </span>
              }
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm">{{ upload.file.name }}</p>
                <p
                  class="text-xs"
                  [class]="upload.status === 'failed' ? 'text-danger' : 'text-ink-muted'"
                >
                  {{ upload.file.size | fileSize }} · {{ uploadLabel[upload.status] }}
                  @if (upload.status === 'uploading') {
                    {{ upload.progress }}%
                  }
                  @if (upload.error) {
                    — {{ upload.error }}
                  }
                </p>
                @if (upload.status === 'uploading') {
                  <div
                    class="mt-1 h-1 overflow-hidden rounded-full bg-subtle"
                    role="progressbar"
                    [attr.aria-label]="'Uploading ' + upload.file.name"
                    [attr.aria-valuenow]="upload.progress"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <div
                      class="h-full bg-brand transition-[width]"
                      [style.width.%]="upload.progress"
                    ></div>
                  </div>
                }
              </div>
              <button
                type="button"
                class="btn-icon size-8"
                [attr.aria-label]="'Remove ' + upload.file.name"
                (click)="remove(upload)"
              >
                <app-icon name="close" [size]="16" />
              </button>
            </li>
          }
        </ul>
      }

      <div class="flex items-center justify-between gap-2 border-t border-line p-2">
        <label class="btn-ghost cursor-pointer" [class.opacity-60]="disabled()">
          <app-icon name="paperclip" [size]="16" />
          <span class="max-sm:sr-only">Attach</span>
          <input
            type="file"
            multiple
            class="sr-only"
            [disabled]="disabled()"
            (change)="attach($event)"
          />
        </label>
        <button type="button" class="btn-primary" [disabled]="!canSend()" (click)="submit()">
          <app-icon name="send" [size]="16" />
          {{ kind() === 'reply' ? 'Send reply' : 'Add note' }}
        </button>
      </div>
    </div>
  `,
})
export class ReplyComposer {
  private readonly api = inject(TicketsApi);

  readonly draft = model('');
  readonly kind = model<'reply' | 'note'>('reply');
  readonly disabled = input(false);
  readonly send = output<OutgoingMessage>();

  protected readonly uploads = signal<Upload[]>([]);
  protected readonly uploadLabel = UPLOAD_LABEL;
  protected readonly kinds = [
    { value: 'reply', label: 'Reply', active: 'bg-brand-soft text-brand-ink' },
    { value: 'note', label: 'Internal note', active: 'bg-warn-soft text-warn' },
  ] as const;

  private nextKey = 0;

  protected readonly canSend = computed(
    () =>
      !this.disabled() &&
      this.draft().trim().length > 0 &&
      this.uploads().every((u) => u.status === 'completed' || u.status === 'failed'),
  );

  protected attach(event: Event): void {
    const input = event.target as HTMLInputElement;
    for (const file of Array.from(input.files ?? [])) this.upload(file);
    input.value = '';
  }

  protected remove(upload: Upload): void {
    if (upload.preview) URL.revokeObjectURL(upload.preview);
    this.uploads.update((list) => list.filter((u) => u.key !== upload.key));
  }

  protected submit(): void {
    if (!this.canSend()) return;

    this.send.emit({
      body: this.draft().trim(),
      kind: this.kind(),
      attachments: this.uploads().flatMap((u) => (u.attachment ? [u.attachment] : [])),
    });
    this.draft.set('');
    this.uploads.set([]);
  }

  private upload(file: File): void {
    const key = ++this.nextKey;
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    this.uploads.update((list) => [
      ...list,
      { key, file, progress: 0, status: 'uploading', preview },
    ]);

    this.api.uploadAttachment(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round((event.loaded / (event.total ?? file.size)) * 100);
          this.patch(key, { progress, status: progress === 100 ? 'processing' : 'uploading' });
        } else if (event.type === HttpEventType.Response && event.body) {
          this.patch(key, { status: 'completed', attachment: event.body });
        }
      },
      error: (error: ApiError) => this.patch(key, { status: 'failed', error: error.message }),
    });
  }

  private patch(key: number, changes: Partial<Upload>): void {
    this.uploads.update((list) => list.map((u) => (u.key === key ? { ...u, ...changes } : u)));
  }
}
