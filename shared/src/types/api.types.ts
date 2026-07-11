export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
  metadata?: {
    version?: string;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
    pagination?: PaginatedResponse<T>['pagination'];
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  timestamp: string;
  requestId?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
    field?: string;
    validationErrors?: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  };
  timestamp: string;
  requestId?: string;
  path?: string;
  method?: string;
}

export interface RequestStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
  metadata?: Record<string, unknown>;
}