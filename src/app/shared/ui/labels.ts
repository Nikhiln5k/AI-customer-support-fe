import { ArticleStatus } from '../../core/models/knowledge';
import { JobStatus } from '../../core/models/operations';
import { TicketPriority, TicketStatus } from '../../core/models/ticket';
import { Role, UserStatus } from '../../core/models/user';
import { Tone } from './badge';

export interface Label {
  label: string;
  tone: Tone;
}

export const TICKET_STATUS: Record<TicketStatus, Label> = {
  open: { label: 'Open', tone: 'info' },
  pending: { label: 'Pending', tone: 'warn' },
  on_hold: { label: 'On hold', tone: 'neutral' },
  resolved: { label: 'Resolved', tone: 'brand' },
  closed: { label: 'Closed', tone: 'neutral' },
};

export const TICKET_PRIORITY: Record<TicketPriority, Label> = {
  low: { label: 'Low', tone: 'neutral' },
  medium: { label: 'Medium', tone: 'info' },
  high: { label: 'High', tone: 'warn' },
  urgent: { label: 'Urgent', tone: 'danger' },
};

export const ARTICLE_STATUS: Record<ArticleStatus, Label> = {
  draft: { label: 'Draft', tone: 'warn' },
  published: { label: 'Published', tone: 'brand' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export const USER_STATUS: Record<UserStatus, Label> = {
  active: { label: 'Active', tone: 'brand' },
  invited: { label: 'Invited', tone: 'info' },
  disabled: { label: 'Disabled', tone: 'neutral' },
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  agent: 'Agent',
  viewer: 'Viewer',
};

export const JOB_STATUS: Record<JobStatus, Label> = {
  waiting: { label: 'Waiting', tone: 'neutral' },
  active: { label: 'Active', tone: 'info' },
  completed: { label: 'Completed', tone: 'brand' },
  failed: { label: 'Failed', tone: 'danger' },
  delayed: { label: 'Delayed', tone: 'warn' },
};

/** Turns a label map into `<select>` options. */
export const toOptions = <K extends string>(map: Record<K, Label | string>) =>
  (Object.keys(map) as K[]).map((value) => {
    const entry = map[value];
    return { value, label: typeof entry === 'string' ? entry : entry.label };
  });
