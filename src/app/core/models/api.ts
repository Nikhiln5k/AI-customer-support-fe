export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListQuery {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  [filter: string]: string | number | undefined;
}

export interface ApiError {
  status: number;
  message: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/** Extracts an ApiError from a resource/HTTP failure (resources wrap non-Error values in `cause`). */
export function toApiError(error: unknown): ApiError {
  const candidate = (error as { cause?: unknown })?.cause ?? error;
  if (
    candidate &&
    typeof candidate === 'object' &&
    'status' in candidate &&
    'message' in candidate
  ) {
    return candidate as ApiError;
  }
  return { status: 500, message: 'Something went wrong. Please try again.' };
}
