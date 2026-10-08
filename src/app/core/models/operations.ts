export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface Job {
  id: string;
  queue: string;
  type: string;
  status: JobStatus;
  attempts: number;
  createdAt: string;
  finishedAt: string | null;
  error: string | null;
}

export interface BrokerEvent {
  id: string;
  type: string;
  exchange: string;
  queue: string;
  consumer: string;
  status: 'delivered' | 'acked' | 'nacked' | 'dead_lettered';
  timestamp: string;
}
