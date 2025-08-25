export interface ApiError {
  message: string;
  status: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams {
  query?: string;
}