export type AiAction =
  'summarize' | 'classify' | 'sentiment' | 'priority' | 'reply' | 'action_items';

export interface AiResult {
  action: AiAction;
  result: string;
  items?: string[];
  confidence: number | null;
  sources: string[];
  generatedAt: string;
}
