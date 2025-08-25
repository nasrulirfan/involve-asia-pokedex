import { PokemonListResponse, PaginationParams } from '@/types';
import { performanceMonitor } from './performance-monitor';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 10000; // 10 seconds

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout') as ApiError;
        timeoutError.isTimeoutError = true;
        throw timeoutError;
      }
      throw error;
    }
  }

  private createApiError(response: Response, message?: string): ApiError {
    const error = new Error(message || `API Error: ${response.status} ${response.statusText}`) as ApiError;
    error.status = response.status;
    error.statusText = response.statusText;
    return error;
  }

  private createNetworkError(originalError: Error): ApiError {
    const error = new Error('Network error - please check your internet connection') as ApiError;
    error.isNetworkError = true;
    error.cause = originalError;
    return error;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    try {
      const response = await this.fetchWithTimeout(url.toString());
      
      if (!response.ok) {
        // Handle different HTTP error statuses
        switch (response.status) {
          case 400:
            throw this.createApiError(response, 'Invalid request parameters');
          case 404:
            throw this.createApiError(response, 'Pokemon data not found');
          case 429:
            throw this.createApiError(response, 'Too many requests - please wait a moment');
          case 500:
            throw this.createApiError(response, 'Server error - please try again later');
          case 503:
            throw this.createApiError(response, 'Pokemon service is temporarily unavailable');
          default:
            throw this.createApiError(response);
        }
      }

      return response.json();
    } catch (error) {
      // Re-throw API errors as-is
      if (error instanceof Error && 'status' in error) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw this.createNetworkError(error);
      }
      
      // Handle other errors
      throw error;
    }
  }

  async getPokemonList(params: PaginationParams & { search?: string } = {}): Promise<PokemonListResponse> {
    const queryParams: Record<string, string | number> = {};
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.search !== undefined && params.search.trim() !== '') queryParams.search = params.search.trim();
    
    return performanceMonitor.measureApiCall(
      'pokemon-list',
      () => this.get<PokemonListResponse>('/pokemons', queryParams),
      {
        page: params.page,
        limit: params.limit,
        hasSearch: !!params.search,
      }
    );
  }
}

// Utility function to check if user is online
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Utility function to wait for network to come back online
export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
};

export const apiClient = new ApiClient();