import { AuditLog } from '../models/audit';
import { Customer, CustomerActivity } from '../models/customer';
import { Article } from '../models/knowledge';
import { AppNotification } from '../models/notification';
import { BrokerEvent, Job, QueueStats } from '../models/operations';
import {
  ActiveSession,
  AiSettings,
  NotificationPreferences,
  OrganizationSettings,
} from '../models/settings';
import { Ticket, TicketMessage, TicketPriority, TicketStatus } from '../models/ticket';
import { User } from '../models/user';

const HOUR = 3_600_000;
const now = Date.now();
const ago = (hours: number) => new Date(now - hours * HOUR).toISOString();
const pick = <T>(list: readonly T[], i: number) => list[i % list.length];

export const users: User[] = [
  {
    id: 'u1',
    name: 'Maya Chen',
    email: 'maya@nexus.io',
    role: 'admin',
    status: 'active',
    lastActiveAt: ago(0.1),
  },
  {
    id: 'u2',
    name: 'Daniel Okafor',
    email: 'daniel@nexus.io',
    role: 'agent',
    status: 'active',
    lastActiveAt: ago(0.5),
  },
  {
    id: 'u3',
    name: 'Priya Nair',
    email: 'priya@nexus.io',
    role: 'agent',
    status: 'active',
    lastActiveAt: ago(2),
  },
  {
    id: 'u4',
    name: 'Lucas Martin',
    email: 'lucas@nexus.io',
    role: 'agent',
    status: 'active',
    lastActiveAt: ago(5),
  },
  {
    id: 'u5',
    name: 'Sara Lindqvist',
    email: 'sara@nexus.io',
    role: 'viewer',
    status: 'active',
    lastActiveAt: ago(30),
  },
  {
    id: 'u6',
    name: 'Tom Becker',
    email: 'tom@nexus.io',
    role: 'agent',
    status: 'invited',
    lastActiveAt: null,
  },
  {
    id: 'u7',
    name: 'Elena Rossi',
    email: 'elena@nexus.io',
    role: 'agent',
    status: 'disabled',
    lastActiveAt: ago(400),
  },
];

const customerSeed: [string, string, string][] = [
  ['Olivia Park', 'Brightline Logistics', '+1 415 555 0132'],
  ['James Whitfield', 'Harbor & Co', '+1 212 555 0198'],
  ['Amara Diallo', 'Kestrel Health', '+44 20 7946 0321'],
  ['Noah Fischer', 'Fischer Retail', '+49 30 901820'],
  ['Isabella Gomez', 'Solace Travel', '+34 91 555 0147'],
  ['Ethan Brooks', 'Northwind Foods', '+1 312 555 0110'],
  ['Hana Sato', 'Mirai Studio', '+81 3 5555 0101'],
  ['Liam O’Connor', 'Cobalt Systems', '+353 1 555 0177'],
  ['Zoe Laurent', 'Atelier Laurent', '+33 1 55 55 01 23'],
  ['Ravi Kapoor', 'Lumen Analytics', '+91 22 5555 0190'],
  ['Grace Miller', 'Evergreen Finance', '+1 617 555 0155'],
  ['Mateo Silva', 'Silva Imports', '+55 11 5555 0166'],
];

export const customers: Customer[] = customerSeed.map(([name, company, phone], i) => ({
  id: `c${i + 1}`,
  name,
  email: `${name.split(' ')[0].toLowerCase()}@${company.split(' ')[0].toLowerCase()}.com`,
  phone,
  company,
  notes: i % 3 === 0 ? 'Enterprise plan. Prefers email follow-ups.' : '',
  openTickets: 0,
  lastInteractionAt: ago(i * 7 + 1),
  createdAt: ago(2000 - i * 90),
}));

const subjects = [
  'Unable to export invoices to CSV',
  'Payment failed after card update',
  'SSO login loops back to sign-in page',
  'Webhook deliveries delayed by several minutes',
  'Request to add more seats to our plan',
  'Dashboard charts not loading on Safari',
  'Refund request for duplicate charge',
  'API rate limit errors during nightly sync',
  'How do I reset two-factor authentication?',
  'Shipment tracking shows wrong status',
  'Data import stuck at 80%',
  'Email notifications going to spam',
  'Need invoice with updated VAT number',
  'Mobile app crashes on startup',
  'Bulk user invite not sending emails',
  'Search results missing recent records',
];
const statuses: TicketStatus[] = [
  'open',
  'pending',
  'open',
  'on_hold',
  'resolved',
  'open',
  'closed',
];
const priorities: TicketPriority[] = ['medium', 'high', 'low', 'urgent', 'medium', 'high'];
const tagPool = ['billing', 'auth', 'api', 'bug', 'feature-request', 'mobile', 'onboarding'];

export const tickets: Ticket[] = Array.from({ length: 46 }, (_, i) => {
  const customer = pick(customers, i * 5);
  const assignee = i % 6 === 5 ? null : pick(users.slice(0, 4), i);
  const status = pick(statuses, i);
  return {
    id: `t${i + 1}`,
    number: 1048 - i,
    subject: pick(subjects, i),
    description:
      'Hi team, since yesterday we have been seeing this issue across several accounts. ' +
      'Could you take a look and let us know if there is a workaround in the meantime?',
    status,
    priority: pick(priorities, i),
    customer: { id: customer.id, name: customer.name, email: customer.email },
    assignee: assignee && { id: assignee.id, name: assignee.name },
    tags: [pick(tagPool, i), ...(i % 3 === 0 ? [pick(tagPool, i + 3)] : [])],
    slaDueAt: status === 'resolved' || status === 'closed' ? null : ago(i % 4 === 0 ? 1 : -6 - i),
    createdAt: ago(i * 5 + 3),
    updatedAt: ago(i * 2 + 0.2),
  };
});

customers.forEach((customer) => {
  customer.openTickets = tickets.filter(
    (t) => t.customer.id === customer.id && !['resolved', 'closed'].includes(t.status),
  ).length;
});

export const messages: TicketMessage[] = tickets.flatMap((ticket) => [
  {
    id: `${ticket.id}-m1`,
    ticketId: ticket.id,
    kind: 'reply',
    author: { id: ticket.customer.id, name: ticket.customer.name, type: 'customer' },
    body: ticket.description,
    attachments: [],
    state: 'read',
    createdAt: ticket.createdAt,
  },
  {
    id: `${ticket.id}-m2`,
    ticketId: ticket.id,
    kind: 'event',
    author: { id: 'system', name: 'System', type: 'system' },
    body: `Assigned to ${ticket.assignee?.name ?? 'the support queue'}`,
    attachments: [],
    state: 'read',
    createdAt: ticket.createdAt,
  },
  {
    id: `${ticket.id}-m3`,
    ticketId: ticket.id,
    kind: 'reply',
    author: { id: 'u2', name: 'Daniel Okafor', type: 'agent' },
    body: 'Thanks for reaching out. I am looking into this now and will update you shortly.',
    attachments: [],
    state: 'read',
    createdAt: ticket.updatedAt,
  },
]);

export const customerActivity = (customerId: string): CustomerActivity[] =>
  tickets
    .filter((t) => t.customer.id === customerId)
    .slice(0, 6)
    .map((t, i) => ({
      id: `${customerId}-a${i}`,
      description: i % 2 ? `Replied on #${t.number}` : `Opened ticket #${t.number} — ${t.subject}`,
      createdAt: t.updatedAt,
    }));

const articleSeed: [string, string][] = [
  ['Resetting two-factor authentication', 'Account & Security'],
  ['Exporting invoices and receipts', 'Billing'],
  ['Configuring SAML single sign-on', 'Account & Security'],
  ['Understanding API rate limits', 'Developers'],
  ['Retrying failed webhook deliveries', 'Developers'],
  ['Adding and removing seats', 'Billing'],
  ['Requesting a refund', 'Billing'],
  ['Importing data from CSV', 'Getting Started'],
  ['Inviting your team', 'Getting Started'],
  ['Troubleshooting email deliverability', 'Notifications'],
  ['Supported browsers', 'Getting Started'],
  ['Data retention policy', 'Account & Security'],
];

export const articles: Article[] = articleSeed.map(([title, category], i) => ({
  id: `a${i + 1}`,
  title,
  category,
  content:
    `## Overview\n\nThis article explains ${title.toLowerCase()}.\n\n` +
    '## Steps\n\n1. Open **Settings** from the sidebar.\n2. Select the relevant section.\n' +
    '3. Follow the on-screen instructions and save your changes.\n\n' +
    '## Still need help?\n\nContact support and include your organization ID.',
  tags: [category.toLowerCase().split(' ')[0], i % 2 ? 'how-to' : 'faq'],
  status: i % 5 === 4 ? 'draft' : i === 11 ? 'archived' : 'published',
  author: pick(users, i).name,
  updatedAt: ago(i * 30 + 4),
}));

export const notifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'ticket_assigned',
    title: 'Ticket #1048 assigned to you',
    body: 'Unable to export invoices to CSV',
    link: '/tickets/t1',
    read: false,
    createdAt: ago(0.2),
  },
  {
    id: 'n2',
    type: 'sla_warning',
    title: 'SLA at risk on #1044',
    body: 'First response due in 30 minutes',
    link: '/tickets/t5',
    read: false,
    createdAt: ago(0.7),
  },
  {
    id: 'n3',
    type: 'ticket_reply',
    title: 'New reply on #1046',
    body: 'Amara Diallo replied to your message',
    link: '/tickets/t3',
    read: false,
    createdAt: ago(1.5),
  },
  {
    id: 'n4',
    type: 'mention',
    title: 'Priya mentioned you',
    body: '“@Maya can you approve this refund?”',
    link: '/tickets/t7',
    read: true,
    createdAt: ago(5),
  },
  {
    id: 'n5',
    type: 'system',
    title: 'Knowledge base re-indexed',
    body: '12 articles processed for AI search',
    link: '/knowledge-base',
    read: true,
    createdAt: ago(20),
  },
  {
    id: 'n6',
    type: 'ticket_assigned',
    title: 'Ticket #1039 assigned to you',
    body: 'Mobile app crashes on startup',
    link: '/tickets/t10',
    read: true,
    createdAt: ago(28),
  },
];

export const queues: QueueStats[] = [
  { name: 'ai-processing', waiting: 12, active: 3, completed: 4821, failed: 7, delayed: 2 },
  { name: 'email-outbound', waiting: 4, active: 1, completed: 15230, failed: 2, delayed: 0 },
  { name: 'sla-timers', waiting: 0, active: 0, completed: 9031, failed: 0, delayed: 38 },
  { name: 'attachment-scan', waiting: 1, active: 1, completed: 2210, failed: 3, delayed: 0 },
];

const jobTypes: Record<string, string[]> = {
  'ai-processing': ['summarize-ticket', 'classify-ticket', 'embed-article'],
  'email-outbound': ['send-reply', 'send-digest'],
  'sla-timers': ['sla-check'],
  'attachment-scan': ['virus-scan', 'extract-text'],
};
const jobStatuses: Job['status'][] = [
  'completed',
  'failed',
  'active',
  'waiting',
  'completed',
  'delayed',
];

export const jobs: Job[] = queues.flatMap((queue, q) =>
  Array.from({ length: 14 }, (_, i) => {
    const status = pick(jobStatuses, i + q);
    const finished = status === 'completed' || status === 'failed';
    return {
      id: `${queue.name.slice(0, 3)}-${9800 - i * 7}`,
      queue: queue.name,
      type: pick(jobTypes[queue.name], i),
      status,
      attempts: status === 'failed' ? 3 : 1,
      createdAt: ago(i * 0.6 + q),
      finishedAt: finished ? ago(i * 0.6 + q - 0.05) : null,
      error: status === 'failed' ? 'TimeoutError: upstream model did not respond in 30000ms' : null,
    };
  }),
);

const eventTypes = [
  'ticket.created',
  'ticket.updated',
  'message.created',
  'ai.completed',
  'sla.breached',
];
const eventStatuses: BrokerEvent['status'][] = [
  'acked',
  'acked',
  'delivered',
  'acked',
  'nacked',
  'dead_lettered',
];

export const events: BrokerEvent[] = Array.from({ length: 40 }, (_, i) => {
  const type = pick(eventTypes, i);
  return {
    id: `ev${i + 1}`,
    type,
    exchange: `nexus.${type.split('.')[0]}`,
    queue: `${type.split('.')[0]}-consumers`,
    consumer: pick(['notification-svc', 'search-indexer', 'analytics-svc'], i),
    status: pick(eventStatuses, i),
    timestamp: ago(i * 0.15),
  };
});

const auditActions = [
  'ticket.update',
  'user.invite',
  'auth.login',
  'article.publish',
  'settings.update',
  'job.retry',
  'user.disable',
];

export const auditLogs: AuditLog[] = Array.from({ length: 52 }, (_, i) => {
  const action = pick(auditActions, i);
  return {
    id: `al${i + 1}`,
    actor: pick(users, i).name,
    action,
    resource: action.startsWith('ticket')
      ? `ticket/#${1048 - i}`
      : `${action.split('.')[0]}/${i + 100}`,
    result: i % 9 === 4 ? 'failure' : 'success',
    ip: `10.0.${i % 7}.${20 + i}`,
    metadata: { userAgent: 'Chrome 140 / macOS', requestId: `req_${(i * 7919).toString(16)}` },
    timestamp: ago(i * 1.7),
  };
});

export const settings = {
  organization: {
    name: 'Nexus Demo Co',
    timezone: 'Europe/London',
    supportEmail: 'support@nexus.io',
  } as OrganizationSettings,
  notifications: {
    email: true,
    inApp: true,
    slaWarnings: true,
    assignments: true,
    mentions: false,
  } as NotificationPreferences,
  ai: {
    suggestReplies: true,
    autoClassify: true,
    autoSentiment: false,
    minConfidence: 70,
  } as AiSettings,
  sessions: [
    {
      id: 's1',
      device: 'Chrome on macOS',
      location: 'London, UK',
      lastSeenAt: ago(0),
      current: true,
    },
    {
      id: 's2',
      device: 'Safari on iPhone',
      location: 'London, UK',
      lastSeenAt: ago(20),
      current: false,
    },
  ] as ActiveSession[],
};
