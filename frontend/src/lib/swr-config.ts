import { SWRConfiguration } from 'swr';
import { ApiError } from './api';

// Global SWR configuration for optimal caching
export const swrConfig: SWRConfiguration = {
  // Cache configuration
  dedupingInterval: 60000, // 1 minute deduping
  focusThrottleInterval: 5000, // 5 seconds focus throttle
  
  // Revalidation settings
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  
  // Error handling
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  shouldRetryOnError: (error: ApiError) => {
    // Don't retry on 4xx errors (client errors)
    if (error.status && error.status >= 400 && error.status < 500) {
      return false;
    }
    return true;
  },
  
  // Performance optimizations
  loadingTimeout: 10000, // 10 seconds timeout
  
  // Cache provider for better memory management with LRU eviction
  provider: () => {
    // Use Map for better performance than default cache
    const map = new Map();
    
    // Add cache size limit to prevent memory leaks
    const maxSize = 150; // Increased for better caching
    
    return {
      get: (key: string) => {
        const value = map.get(key);
        if (value !== undefined) {
          // Move to end (LRU behavior)
          map.delete(key);
          map.set(key, value);
        }
        return value;
      },
      set: (key: string, value: unknown) => {
        // Remove if already exists to update position
        if (map.has(key)) {
          map.delete(key);
        } else if (map.size >= maxSize) {
          // Remove oldest entry when cache is full (LRU eviction)
          const firstKey = map.keys().next().value;
          map.delete(firstKey);
        }
        map.set(key, value);
      },
      delete: (key: string) => map.delete(key),
      clear: () => map.clear(),
      keys: () => map.keys(),
    };
  },
  
  // Global error handler
  onError: (error: ApiError, key: string) => {
    console.error('SWR Error:', { error, key });
    
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.group('SWR Error Details');
      console.log('Key:', key);
      console.log('Error:', error);
      console.log('Status:', error.status);
      console.log('Network Error:', error.isNetworkError);
      console.log('Timeout Error:', error.isTimeoutError);
      console.groupEnd();
    }
  },
  
  // Success handler for performance monitoring
  onSuccess: (data: unknown, key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('SWR Success:', { key, dataSize: JSON.stringify(data).length });
    }
  },
};

// Specialized configurations for different data types
export const pokemonListConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 300000, // 5 minutes for Pokemon lists (they don't change often)
  revalidateIfStale: false, // Pokemon data is relatively static
  keepPreviousData: true, // Keep previous data while loading new data
};

export const searchConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 30000, // 30 seconds for search results
  revalidateIfStale: true, // Search results might change
  keepPreviousData: false, // Don't keep previous search results
};

// Cache warming utility
export function warmCache() {
  if (typeof window === 'undefined') return;
  
  // Warm the cache with first page of Pokemon
  import('swr').then(({ mutate }) => {
    import('../lib/api').then(({ apiClient }) => {
      // Prefetch first few pages
      for (let page = 1; page <= 3; page++) {
        const key = `pokemon-list-${JSON.stringify({ page, limit: 20 })}`;
        mutate(key, apiClient.getPokemonList({ page, limit: 20 }), { revalidate: false });
      }
    });
  });
}

// Intelligent cache preloading based on user behavior
export function preloadPopularPokemon() {
  if (typeof window === 'undefined') return;
  
  // Popular Pokemon that users often search for
  const popularSearches = ['pikachu', 'charizard', 'blastoise', 'venusaur', 'mewtwo'];
  
  import('swr').then(({ mutate }) => {
    import('../lib/api').then(({ apiClient }) => {
      popularSearches.forEach((search, index) => {
        setTimeout(() => {
          const key = `pokemon-list-${JSON.stringify({ page: 1, limit: 20, search })}`;
          mutate(key, apiClient.getPokemonList({ page: 1, limit: 20, search }), { revalidate: false });
        }, index * 1000); // Stagger requests
      });
    });
  });
}