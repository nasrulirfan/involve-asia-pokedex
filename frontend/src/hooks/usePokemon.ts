import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { apiClient, isOnline, waitForOnline, ApiError } from '@/lib/api';
import { pokemonListConfig, searchConfig } from '@/lib/swr-config';
import { PokemonListResponse, PaginationParams } from '@/types';

export function usePokemonList(params: PaginationParams & { search?: string } = {}) {
  const key = params ? `pokemon-list-${JSON.stringify(params)}` : 'pokemon-list';
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [retryCount, setRetryCount] = useState(0);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetcher = async (): Promise<PokemonListResponse> => {
    // If offline, wait for connection to come back
    if (!isOnline()) {
      await waitForOnline();
    }
    
    return apiClient.getPokemonList(params);
  };
  
  // Use specialized config based on whether we're searching
  const config = params.search ? searchConfig : pokemonListConfig;
  
  const { data, error, isLoading, mutate } = useSWR<PokemonListResponse>(
    key,
    fetcher,
    {
      ...config,
      onErrorRetry: (error: ApiError, key, config, revalidate, { retryCount }) => {
        // Don't retry on 4xx errors (client errors)
        if (error.status && error.status >= 400 && error.status < 500) {
          return;
        }

        // Don't retry more than 3 times
        if (retryCount >= 3) return;

        // Exponential backoff
        const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
        
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          revalidate({ retryCount });
        }, timeout);
      },
      onSuccess: (data) => {
        setRetryCount(0);
        
        // Prefetch next page if available and not searching
        if (data?.pagination?.has_next && !params.search) {
          const nextPageParams = { ...params, page: (params.page || 1) + 1 };
          const nextPageKey = `pokemon-list-${JSON.stringify(nextPageParams)}`;
          
          // Prefetch next page in the background with intelligent timing
          const prefetchDelay = data.data.length > 10 ? 500 : 1000; // Faster prefetch for smaller pages
          setTimeout(() => {
            // Use global mutate for prefetching
            import('swr').then(({ mutate: globalMutate }) => {
              globalMutate(nextPageKey, apiClient.getPokemonList(nextPageParams), {
                revalidate: false, // Don't revalidate immediately, just cache
              });
            });
          }, prefetchDelay);
          
          // Also prefetch the page after next for better UX
          if (data.pagination.current_page < data.pagination.total_pages - 1) {
            const nextNextPageParams = { ...params, page: (params.page || 1) + 2 };
            const nextNextPageKey = `pokemon-list-${JSON.stringify(nextNextPageParams)}`;
            
            setTimeout(() => {
              import('swr').then(({ mutate: globalMutate }) => {
                globalMutate(nextNextPageKey, apiClient.getPokemonList(nextNextPageParams), {
                  revalidate: false,
                });
              });
            }, prefetchDelay + 2000); // Delay second prefetch more
          }
        }
      },
    }
  );

  const retry = async () => {
    setRetryCount(0);
    await mutate();
  };

  const prefetchNextPage = () => {
    if (data?.pagination?.has_next && !params.search) {
      const nextPageParams = { ...params, page: (params.page || 1) + 1 };
      const nextPageKey = `pokemon-list-${JSON.stringify(nextPageParams)}`;
      
      // Prefetch next page using global mutate
      import('swr').then(({ mutate: globalMutate }) => {
        globalMutate(nextPageKey, apiClient.getPokemonList(nextPageParams));
      });
    }
  };

  return {
    data,
    error: error as ApiError,
    isLoading,
    isOffline,
    retryCount,
    mutate,
    retry,
    prefetchNextPage,
  };
}