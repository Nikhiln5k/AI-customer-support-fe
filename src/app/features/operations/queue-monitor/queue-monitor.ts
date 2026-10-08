import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { OperationsApi } from '../../../core/api/operations.api';
import { Job, JobStatus, QueueStats } from '../../../core/models/operations';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyState } from '../../../shared/components/empty-state';
import { ErrorState } from '../../../shared/components/error-state';
import { Pagination } from '../../../shared/components/pagination';
import { SearchInput } from '../../../shared/components/search-input';
import { SkeletonRows } from '../../../shared/components/skeleton-rows';
import { ListQueryState } from '../../../shared/data/list-query';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { JOB_STATUS, toOptions } from '../../../shared/ui/labels';

type QueueCount = Exclude<keyof QueueStats, 'name'>;

@Component({
  selector: 'app-queue-monitor',
  imports: [
    DatePipe,
    DecimalPipe,
    SearchInput,
    Pagination,
    SkeletonRows,
    EmptyState,
    ErrorState,
    Badge,
    Icon,
    RelativeTimePipe,
  ],
  templateUrl: './queue-monitor.html',
})
export default class QueueMonitor {
  private readonly api = inject(OperationsApi);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly statusLabels = JOB_STATUS;
  protected readonly statusOptions = toOptions(JOB_STATUS);
  protected readonly counts: { key: QueueCount; label: string }[] = [
    { key: 'waiting', label: 'Waiting' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
    { key: 'delayed', label: 'Delayed' },
  ];

  protected readonly queues = rxResource({ stream: () => this.api.queues() });
  protected readonly selectedQueue = signal<string | null>(null);

  protected readonly list = new ListQueryState(
    { status: '' },
    (_, value) => JOB_STATUS[value as JobStatus].label,
  );

  protected readonly jobs = rxResource({
    params: () => {
      const queue = this.selectedQueue();
      return queue ? { queue, query: this.list.query() } : undefined;
    },
    stream: ({ params }) => this.api.jobs(params.queue, params.query),
  });

  protected readonly rows = computed(() => this.jobs.value()?.items ?? []);
  protected readonly total = computed(() => this.jobs.value()?.total ?? 0);
  protected readonly busyJobId = signal<string | null>(null);

  protected select(queue: string): void {
    if (this.selectedQueue() === queue) return;
    this.list.clearAll();
    this.selectedQueue.set(queue);
  }

  protected setStatus(event: Event): void {
    this.list.setFilter('status', (event.target as HTMLSelectElement).value);
  }

  /** Danger/warn tones only draw attention when there is something to look at. */
  protected countClass(key: QueueCount, value: number): string {
    if (value > 0 && key === 'failed') return 'text-danger';
    if (value > 0 && key === 'delayed') return 'text-warn';
    return 'text-ink';
  }

  protected retry(job: Job): void {
    this.run(job, this.api.retryJob(job.queue, job.id), `Job ${job.id} queued for retry`);
  }

  protected async remove(job: Job): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: `Remove job ${job.id}?`,
      message: 'The failed job and its error details will be permanently deleted.',
      confirmLabel: 'Remove job',
      destructive: true,
    });
    if (confirmed) this.run(job, this.api.removeJob(job.queue, job.id), `Job ${job.id} removed`);
  }

  private run(job: Job, action: Observable<void>, message: string): void {
    this.busyJobId.set(job.id);
    action.subscribe({
      next: () => {
        this.toast.success(message);
        this.busyJobId.set(null);
        this.jobs.reload();
        this.queues.reload();
      },
      error: (error) => {
        this.toast.error(error.message);
        this.busyJobId.set(null);
      },
    });
  }
}
