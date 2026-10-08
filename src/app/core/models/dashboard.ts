export interface DashboardSummary {
  openTickets: number;
  overdueTickets: number;
  slaHealth: number;
  avgResponseMinutes: number;
  aiResolutionRate: number;
  trend: { date: string; created: number; resolved: number }[];
  sla: { onTrack: number; atRisk: number; breached: number };
  workload: { agent: string; open: number; capacity: number }[];
  activity: { id: string; actor: string; description: string; createdAt: string }[];
}

export interface ReportData {
  volume: { label: string; value: number }[];
  resolutionHours: { label: string; value: number }[];
  responseMinutes: { label: string; value: number }[];
  slaPerformance: number;
  aiAssistedRate: number;
  workload: { agent: string; resolved: number; open: number }[];
}
