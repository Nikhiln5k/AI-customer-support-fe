export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  ip: string;
  metadata: Record<string, string>;
  timestamp: string;
}
