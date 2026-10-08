import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, concat, delay, interval, map, of, take, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiAction, AiResult } from '../models/ai';
import { Page } from '../models/api';
import { Ticket, TicketInput, TicketMessage } from '../models/ticket';
import * as db from './mock-db';

type Handler = (req: HttpRequest<unknown>, params: string[]) => unknown;

const LATENCY = 450;
const FILTER_ALIASES: Record<string, string> = {
  assigneeId: 'assignee.id',
  customerId: 'customer.id',
};

const routes: [string, RegExp, Handler][] = [
  ['POST', /^\/auth\/login$/, login],
  ['POST', /^\/auth\/setup$/, setup],
  ['POST', /^\/auth\/forgot-password$/, () => null],
  ['PATCH', /^\/me$/, (req) => ({ ...db.users[0], ...body<object>(req) })],

  ['GET', /^\/dashboard$/, () => dashboard()],
  ['GET', /^\/reports$/, () => reports()],

  [
    'GET',
    /^\/tickets$/,
    (req) => paginate(db.tickets, req, ['subject', 'customer.name', 'number']),
  ],
  ['POST', /^\/tickets$/, (req) => createTicket(body<TicketInput>(req))],
  ['POST', /^\/tickets\/bulk-status$/, bulkStatus],
  ['GET', /^\/tickets\/([^/]+)$/, (_, [id]) => find(db.tickets, id)],
  ['PATCH', /^\/tickets\/([^/]+)$/, (req, [id]) => updateTicket(id, body(req))],
  [
    'GET',
    /^\/tickets\/([^/]+)\/messages$/,
    (_, [id]) => db.messages.filter((m) => m.ticketId === id),
  ],
  ['POST', /^\/tickets\/([^/]+)\/messages$/, (req, [id]) => addMessage(id, body(req))],

  ['GET', /^\/customers$/, (req) => paginate(db.customers, req, ['name', 'email', 'company'])],
  [
    'POST',
    /^\/customers$/,
    (req) =>
      insert(db.customers, {
        ...body(req),
        openTickets: 0,
        lastInteractionAt: null,
        createdAt: now(),
      }),
  ],
  ['GET', /^\/customers\/([^/]+)$/, (_, [id]) => find(db.customers, id)],
  ['PATCH', /^\/customers\/([^/]+)$/, (req, [id]) => patch(db.customers, id, body(req))],
  ['GET', /^\/customers\/([^/]+)\/activity$/, (_, [id]) => db.customerActivity(id)],

  ['GET', /^\/articles$/, (req) => paginate(db.articles, req, ['title', 'content', 'tags'])],
  [
    'GET',
    /^\/articles\/categories$/,
    () => [...new Set(db.articles.map((a) => a.category))].sort(),
  ],
  ['POST', /^\/articles\/ask$/, (req) => ask(body<{ question: string }>(req).question)],
  [
    'POST',
    /^\/articles$/,
    (req) => insert(db.articles, { ...body(req), author: db.users[0].name, updatedAt: now() }),
  ],
  ['GET', /^\/articles\/([^/]+)$/, (_, [id]) => find(db.articles, id)],
  [
    'PATCH',
    /^\/articles\/([^/]+)$/,
    (req, [id]) => patch(db.articles, id, { ...body(req), updatedAt: now() }),
  ],

  ['POST', /^\/ai\/([a-z_]+)$/, (req, [action]) => runAi(action as AiAction, body(req))],

  ['GET', /^\/notifications$/, () => db.notifications],
  [
    'PATCH',
    /^\/notifications\/([^/]+)\/read$/,
    (_, [id]) => void patch(db.notifications, id, { read: true }),
  ],
  [
    'POST',
    /^\/notifications\/read-all$/,
    () => void db.notifications.forEach((n) => (n.read = true)),
  ],

  ['GET', /^\/operations\/queues$/, () => db.queues],
  [
    'GET',
    /^\/operations\/queues\/([^/]+)\/jobs$/,
    (req, [queue]) =>
      paginate(
        db.jobs.filter((j) => j.queue === queue),
        req,
        ['id', 'type'],
      ),
  ],
  [
    'POST',
    /^\/operations\/queues\/([^/]+)\/jobs\/([^/]+)\/retry$/,
    (_, [, id]) => void patch(db.jobs, id, { status: 'waiting', error: null, finishedAt: null }),
  ],
  [
    'DELETE',
    /^\/operations\/queues\/([^/]+)\/jobs\/([^/]+)$/,
    (_, [, id]) => void remove(db.jobs, id),
  ],
  [
    'GET',
    /^\/operations\/events$/,
    (req) => paginate(db.events, req, ['type', 'exchange', 'queue', 'consumer']),
  ],

  ['GET', /^\/users$/, (req) => paginate(db.users, req, ['name', 'email'])],
  [
    'GET',
    /^\/users\/agents$/,
    () => db.users.filter((u) => u.status === 'active' && u.role !== 'viewer'),
  ],
  ['POST', /^\/users$/, (req) => insert(db.users, { ...body(req), lastActiveAt: null })],
  ['GET', /^\/users\/([^/]+)$/, (_, [id]) => find(db.users, id)],
  ['PATCH', /^\/users\/([^/]+)$/, (req, [id]) => patch(db.users, id, body(req))],

  ['GET', /^\/audit-logs$/, (req) => paginate(db.auditLogs, req, ['actor', 'action', 'resource'])],
  ['GET', /^\/audit-logs\/([^/]+)$/, (_, [id]) => find(db.auditLogs, id)],

  ['GET', /^\/settings\/organization$/, () => db.settings.organization],
  ['PUT', /^\/settings\/organization$/, (req) => (db.settings.organization = body(req))],
  ['GET', /^\/settings\/notifications$/, () => db.settings.notifications],
  ['PUT', /^\/settings\/notifications$/, (req) => (db.settings.notifications = body(req))],
  ['GET', /^\/settings\/ai$/, () => db.settings.ai],
  ['PUT', /^\/settings\/ai$/, (req) => (db.settings.ai = body(req))],
  ['GET', /^\/settings\/sessions$/, () => db.settings.sessions],
  ['DELETE', /^\/settings\/sessions\/([^/]+)$/, (_, [id]) => void remove(db.settings.sessions, id)],
];

/** Fake backend for local development. Disabled when `environment.useMockApi` is false. */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockApi || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const path = req.url.slice(environment.apiUrl.length);

  if (req.method === 'POST' && path === '/attachments') {
    return upload(req.body as FormData);
  }

  for (const [method, pattern, handler] of routes) {
    const match = path.match(pattern);
    if (method === req.method && match) {
      try {
        const result = handler(req, match.slice(1));
        return of(new HttpResponse({ status: 200, body: result ?? null })).pipe(delay(LATENCY));
      } catch (error) {
        return fail(
          error instanceof MockError ? error.status : 500,
          String((error as Error).message),
        );
      }
    }
  }

  return fail(404, `No mock route for ${req.method} ${path}`);
};

class MockError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function fail(status: number, message: string): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, error: { message } })).pipe(
    delay(LATENCY),
  );
}

const now = () => new Date().toISOString();
const body = <T = Record<string, unknown>>(req: HttpRequest<unknown>) => req.body as T;
const newId = () => Math.random().toString(36).slice(2, 10);

function find<T extends { id: string }>(list: T[], id: string): T {
  const item = list.find((entry) => entry.id === id);
  if (!item) throw new MockError(404, 'Not found');
  return item;
}

function insert<T extends { id: string }>(list: T[], item: Omit<T, 'id'>): T {
  const created = { ...item, id: newId() } as T;
  list.unshift(created);
  return created;
}

function patch<T extends { id: string }>(list: T[], id: string, changes: Partial<T>): T {
  return Object.assign(find(list, id), changes);
}

function remove<T extends { id: string }>(list: T[], id: string): void {
  list.splice(list.indexOf(find(list, id)), 1);
}

function read(item: object, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown>)?.[key], item);
}

/** Generic search, equality filters, sorting and paging over a seed list. */
function paginate<T extends object>(
  list: T[],
  req: HttpRequest<unknown>,
  searchFields: string[],
): Page<T> {
  const params = req.params;
  const page = Number(params.get('page') ?? 1);
  const pageSize = Number(params.get('pageSize') ?? 10);
  const search = params.get('search')?.toLowerCase();
  const reserved = ['page', 'pageSize', 'search', 'sort', 'direction', 'from', 'to'];

  let items = list.filter((item) => {
    if (search && !searchFields.some((f) => String(read(item, f)).toLowerCase().includes(search))) {
      return false;
    }
    return params
      .keys()
      .filter((key) => !reserved.includes(key))
      .every((key) => String(read(item, FILTER_ALIASES[key] ?? key)) === params.get(key));
  });

  const from = params.get('from');
  if (from) {
    const since = Date.parse(from);
    items = items.filter((item) => {
      const date = read(item, 'updatedAt') ?? read(item, 'timestamp') ?? read(item, 'createdAt');
      return Date.parse(String(date)) >= since;
    });
  }

  const sort = params.get('sort');
  if (sort) {
    const dir = params.get('direction') === 'asc' ? 1 : -1;
    items = [...items].sort((a, b) => (String(read(a, sort)) > String(read(b, sort)) ? dir : -dir));
  }

  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

function login(req: HttpRequest<unknown>) {
  const { email, password } = body<{ email: string; password: string }>(req);
  const user = db.users.find((u) => u.email === email.toLowerCase() && u.status === 'active');
  if (!user || password.length < 6) throw new MockError(401, 'Invalid email or password');
  return {
    token: `mock.${user.id}`,
    user,
    organization: { id: 'o1', name: db.settings.organization.name },
  };
}

function setup(req: HttpRequest<unknown>) {
  const input = body<{ organizationName: string; adminName: string; email: string }>(req);
  db.settings.organization.name = input.organizationName;
  const user = insert(db.users, {
    name: input.adminName,
    email: input.email,
    role: 'admin',
    status: 'active',
    lastActiveAt: now(),
  });
  return {
    token: `mock.${user.id}`,
    user,
    organization: { id: 'o1', name: input.organizationName },
  };
}

function toTicketRefs(input: Partial<TicketInput>) {
  const refs: Partial<Ticket> = {};
  if (input.customerId) {
    const c = find(db.customers, input.customerId);
    refs.customer = { id: c.id, name: c.name, email: c.email };
  }
  if (input.assigneeId !== undefined) {
    const user = input.assigneeId ? find(db.users, input.assigneeId) : null;
    refs.assignee = user && { id: user.id, name: user.name };
  }
  return refs;
}

function createTicket(input: TicketInput): Ticket {
  const { customerId, assigneeId, ...fields } = input;
  const ticket = insert(db.tickets, {
    ...fields,
    ...toTicketRefs({ customerId, assigneeId }),
    number: Math.max(...db.tickets.map((t) => t.number)) + 1,
    status: 'open',
    slaDueAt: new Date(Date.now() + 8 * 3_600_000).toISOString(),
    createdAt: now(),
    updatedAt: now(),
  } as Omit<Ticket, 'id'>);
  db.messages.push({
    id: newId(),
    ticketId: ticket.id,
    kind: 'reply',
    author: { id: ticket.customer.id, name: ticket.customer.name, type: 'customer' },
    body: ticket.description,
    attachments: [],
    state: 'read',
    createdAt: now(),
  });
  return ticket;
}

function updateTicket(id: string, input: Partial<TicketInput>): Ticket {
  const { customerId, assigneeId, ...fields } = input;
  return patch(db.tickets, id, {
    ...fields,
    ...toTicketRefs({ customerId, assigneeId }),
    updatedAt: now(),
  });
}

function bulkStatus(req: HttpRequest<unknown>) {
  const { ids, status } = body<{ ids: string[]; status: Ticket['status'] }>(req);
  ids.forEach((id) => patch(db.tickets, id, { status, updatedAt: now() }));
  return null;
}

function addMessage(
  ticketId: string,
  input: { body: string; kind: 'reply' | 'note'; attachmentIds: string[] },
) {
  const message: TicketMessage = {
    id: newId(),
    ticketId,
    kind: input.kind,
    author: { id: 'u1', name: 'Maya Chen', type: 'agent' },
    body: input.body,
    attachments: [],
    state: 'sent',
    createdAt: now(),
  };
  db.messages.push(message);
  patch(db.tickets, ticketId, { updatedAt: now() });
  return message;
}

function upload(form: FormData): Observable<HttpEvent<unknown>> {
  const file = form.get('file') as File;
  if (file.size > 10 * 1024 * 1024) return fail(413, 'File is larger than 10 MB');

  const progress = interval(120).pipe(
    take(10),
    map(
      (step) =>
        ({
          type: HttpEventType.UploadProgress,
          loaded: ((step + 1) / 10) * file.size,
          total: file.size,
        }) as HttpEvent<unknown>,
    ),
  );
  const done = of(
    new HttpResponse({
      status: 200,
      body: {
        id: newId(),
        name: file.name,
        size: file.size,
        mimeType: file.type,
        url: URL.createObjectURL(file),
      },
    }),
  );
  return concat(progress, done);
}

function ask(question: string) {
  const words = question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);
  const matches = db.articles
    .filter((a) => a.status === 'published')
    .map((a) => ({
      article: a,
      score: words.filter((w) => `${a.title} ${a.content}`.toLowerCase().includes(w)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    answer:
      `Based on the knowledge base, start by checking “${matches[0].article.title}”. ` +
      'Open Settings, select the relevant section and follow the guided steps. ' +
      'If the issue continues, collect the organization ID and escalate to tier 2.',
    sources: matches.map(({ article, score }, i) => ({
      articleId: article.id,
      title: article.title,
      snippet: article.content.split('\n\n')[1] ?? article.content.slice(0, 140),
      score: Math.max(0.55, Math.min(0.97, 0.6 + score * 0.12 - i * 0.05)),
    })),
  };
}

function runAi(action: AiAction, input: { ticketId?: string; text?: string }): AiResult {
  const ticket = input.ticketId ? db.tickets.find((t) => t.id === input.ticketId) : undefined;
  const subject = ticket?.subject ?? 'the reported issue';
  const name = ticket?.customer.name.split(' ')[0] ?? 'there';
  const sources = ticket ? [`Ticket #${ticket.number}`, 'Conversation history'] : ['Provided text'];

  const results: Record<AiAction, Pick<AiResult, 'result' | 'items' | 'confidence'>> = {
    summarize: {
      result: `Customer reports: ${subject.toLowerCase()}. The issue started recently and affects multiple accounts. An agent acknowledged and is investigating; no workaround has been shared yet.`,
      confidence: 0.91,
    },
    classify: {
      result: ticket?.tags.includes('billing') ? 'Billing › Payments' : 'Technical › Product issue',
      confidence: 0.84,
    },
    sentiment: { result: 'Frustrated — customer is polite but signals urgency.', confidence: 0.78 },
    priority: { result: ticket?.priority === 'urgent' ? 'Urgent' : 'High', confidence: 0.72 },
    reply: {
      result: `Hi ${name},\n\nThanks for your patience. I have reproduced the problem with ${subject.toLowerCase()} and our engineers are working on a fix. In the meantime, you can retry the action from Settings → Data. I will update you as soon as the fix is deployed.\n\nBest regards,\nMaya`,
      confidence: 0.8,
    },
    action_items: {
      result: 'Three follow-ups identified.',
      items: [
        'Reproduce the issue in staging',
        'Share a temporary workaround with the customer',
        'Link ticket to the engineering incident',
      ],
      confidence: null,
    },
  };

  if (!results[action]) throw new MockError(400, 'Unknown AI action');
  return { action, ...results[action], sources, generatedAt: now() };
}

function dashboard() {
  const open = db.tickets.filter((t) => !['resolved', 'closed'].includes(t.status));
  return {
    openTickets: open.length,
    overdueTickets: open.filter((t) => t.slaDueAt && Date.parse(t.slaDueAt) < Date.now()).length,
    slaHealth: 92,
    avgResponseMinutes: 38,
    aiResolutionRate: 27,
    trend: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86_400_000).toISOString(),
      created: 18 + ((i * 7) % 11),
      resolved: 15 + ((i * 5) % 12),
    })),
    sla: { onTrack: 31, atRisk: 6, breached: 3 },
    workload: db.users
      .slice(0, 4)
      .map((u, i) => ({ agent: u.name, open: [9, 14, 6, 11][i], capacity: 15 })),
    activity: db.auditLogs.slice(0, 6).map((log) => ({
      id: log.id,
      actor: log.actor,
      description: `${log.action.replace('.', ' ')} on ${log.resource}`,
      createdAt: log.timestamp,
    })),
  };
}

function reports() {
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  return {
    volume: weeks.map((label, i) => ({ label, value: 120 + ((i * 37) % 60) })),
    resolutionHours: weeks.map((label, i) => ({ label, value: 9 + ((i * 3) % 7) })),
    responseMinutes: weeks.map((label, i) => ({ label, value: 30 + ((i * 11) % 25) })),
    slaPerformance: 93,
    aiAssistedRate: 27,
    workload: db.users
      .slice(0, 4)
      .map((u, i) => ({ agent: u.name, resolved: [64, 81, 47, 58][i], open: [9, 14, 6, 11][i] })),
  };
}
