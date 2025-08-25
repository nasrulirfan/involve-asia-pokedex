'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { usePokemonList } from '@/hooks/usePokemon';
import { PaginationParams, Pokemon } from '@/types';
import PokemonCard from './PokemonCard';
import { LoadingSpinner, ErrorMessage, ErrorBoundary, PokemonGridSkeleton, OfflineIndicator } from '@/components/ui';

interface PokemonListProps {
  searchQuery?: string;
  className?: string;
  enableInfiniteScroll?: boolean;
}

export default function PokemonList({ 
  searchQuery, 
  className = '', 
  enableInfiniteScroll = true 
}: PokemonListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');
  
  // Refs for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const paginationParams: PaginationParams & { search?: string } = {
    page: currentPage,
    limit: 20,
    ...(searchQuery && searchQuery.trim() !== '' ? { search: searchQuery.trim() } : {})
  };

  const { data, error, isLoading, isOffline, retryCount, retry } = usePokemonList(paginationParams);

  // Reset state when search query changes
  useEffect(() => {
    const newSearchQuery = searchQuery?.trim() || '';
    if (newSearchQuery !== currentSearchQuery) {
      setCurrentSearchQuery(newSearchQuery);
      setCurrentPage(1);
      setAllPokemon([]);
      setHasLoadedInitial(false);
      setIsLoadingMore(false);
      setHasReachedEnd(false);
    }
  }, [searchQuery, currentSearchQuery]);

  // Update accumulated Pokemon data when new data arrives
  useEffect(() => {
    if (data?.data) {
      if (currentPage === 1) {
        // First page - replace all data
        setAllPokemon(data.data);
      } else {
        // Subsequent pages - append to existing data, avoiding duplicates
        setAllPokemon(prev => {
          const existingNames = new Set(prev.map(p => p.name));
          const newPokemon = data.data.filter(p => !existingNames.has(p.name));
          return [...prev, ...newPokemon];
        });
      }
      setHasLoadedInitial(true);
      setIsLoadingMore(false);
      
      // Check if we've reached the end
      if (data.pagination && !data.pagination.has_next) {
        setHasReachedEnd(true);
      }
    }
  }, [data, currentPage]);

  // For search, we display all Pokemon from API (no client-side filtering needed)
  const displayedPokemon = allPokemon;

  // Check if we have a search query
  const isSearching = searchQuery && searchQuery.trim() !== '';

  // Calculate if we should show load more
  const shouldShowLoadMore = data?.pagination?.has_next && !hasReachedEnd;

  const handleLoadMore = useCallback(() => {
    if (data?.pagination?.has_next && !isLoading && !isLoadingMore && !hasReachedEnd) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  }, [data?.pagination?.has_next, isLoading, isLoadingMore, hasReachedEnd]);

  // Set up infinite scroll with Intersection Observer
  useEffect(() => {
    if (!enableInfiniteScroll || !loadMoreTriggerRef.current) return;

    const currentTrigger = loadMoreTriggerRef.current;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Trigger 100px before the element comes into view
        threshold: 0.1,
      }
    );

    observerRef.current.observe(currentTrigger);

    return () => {
      if (observerRef.current && currentTrigger) {
        observerRef.current.unobserve(currentTrigger);
      }
    };
  }, [enableInfiniteScroll, handleLoadMore]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleRetry = useCallback(async () => {
    await retry();
  }, [retry]);

  // Loading state for initial load
  if (isLoading && !hasLoadedInitial) {
    return (
      <div className={className}>
        <OfflineIndicator />
        <div className="flex flex-col items-center justify-center py-8 mb-6">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600 text-lg">
            {isOffline ? 'Waiting for connection...' : 'Loading Pokemon...'}
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Retry attempt {retryCount}/3
            </p>
          )}
        </div>
        <PokemonGridSkeleton count={20} />
      </div>
    );
  }

  // Error state
  if (error && !hasLoadedInitial) {
    return (
      <div className={className}>
        <OfflineIndicator />
        <ErrorMessage
          error={error}
          onRetry={handleRetry}
          variant="card"
          showDetails={process.env.NODE_ENV === 'development'}
          className="max-w-md mx-auto"
        />
      </div>
    );
  }

  // Empty state for search results
  if (hasLoadedInitial && displayedPokemon.length === 0 && isSearching) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="flex flex-col items-center">
          <svg 
            className="w-16 h-16 text-gray-400 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Pokemon Found
          </h3>
          <p className="text-gray-500 mb-4">
            No Pokemon match your search for &quot;{searchQuery}&quot;.
          </p>
          {shouldShowLoadMore && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                Try a different search term or browse all Pokemon.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state for no data
  if (hasLoadedInitial && allPokemon.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="flex flex-col items-center">
          <svg 
            className="w-16 h-16 text-gray-400 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Pokemon Available
          </h3>
          <p className="text-gray-500 mb-4">
            Unable to load Pokemon data at this time.
          </p>
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`w-full ${className}`}>
        <OfflineIndicator showWhenOnline />
        
        {/* Error banner for partial failures */}
        {error && hasLoadedInitial && (
          <div className="mb-4">
            <ErrorMessage
              error={error}
              onRetry={handleRetry}
              variant="banner"
              className="mb-4"
            />
          </div>
        )}
        
        {/* Search Results Count */}
        {isSearching && hasLoadedInitial && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">
              {displayedPokemon.length === 0 
                ? `No results found for "${searchQuery}"`
                : `Found ${data?.pagination?.total_count || displayedPokemon.length} Pokemon matching "${searchQuery}"`
              }
              {data?.pagination && data.pagination.total_count > displayedPokemon.length && (
                <span className="block text-xs text-gray-500 mt-1">
                  Showing {displayedPokemon.length} of {data.pagination.total_count} results
                </span>
              )}
            </p>
          </div>
        )}

        {/* Pokemon Grid */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8"
          role="grid"
          aria-label={isSearching ? `Search results for ${searchQuery}` : "Pokemon list"}
        >
          {displayedPokemon.map((pokemon, index) => (
            <div key={`${pokemon.name}-${index}`} role="gridcell">
              <PokemonCard pokemon={pokemon} />
            </div>
          ))}
        </div>

        {/* Load More Section */}
        {data?.pagination && shouldShowLoadMore && (
          <div className="text-center">
            <div className="space-y-4">
              {/* Manual Load More Button (always visible as fallback) */}
              <button
                onClick={handleLoadMore}
                disabled={isLoading || isLoadingMore}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                aria-label={isSearching ? "Load more search results" : "Load more Pokemon"}
              >
                {isLoading || isLoadingMore ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Loading...
                  </>
                ) : (
                  isSearching ? 'Load More Results' : 'Load More Pokemon'
                )}
              </button>
              
              {/* Infinite Scroll Trigger (invisible) */}
              {enableInfiniteScroll && (
                <div
                  ref={loadMoreTriggerRef}
                  className="h-4 w-full"
                  aria-hidden="true"
                />
              )}
            </div>
            
            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && enableInfiniteScroll && (
              <div className="flex flex-col items-center justify-center py-8">
                <LoadingSpinner size="md" className="mb-2" />
                <p className="text-gray-600">
                  {isOffline ? 'Waiting for connection...' : 
                   isSearching ? 'Loading more search results...' : 'Loading more Pokemon...'}
                </p>
                {retryCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Retry attempt {retryCount}/3
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* End of Results Message */}
        {data?.pagination && !shouldShowLoadMore && hasLoadedInitial && displayedPokemon.length > 0 && (
          <div className="text-center text-gray-500 py-4">
            <p className="text-lg font-medium mb-2">
              {isSearching ? 'All search results loaded!' : 'You\'ve seen them all!'}
            </p>
            <p className="text-sm">
              {isSearching 
                ? `Showing all ${data.pagination.total_count} Pokemon matching "${searchQuery}"`
                : `Showing all ${data.pagination.total_count} Pokemon`
              }
            </p>
          </div>
        )}

        {/* Pagination Info */}
        {data?.pagination && hasLoadedInitial && (
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>
              Showing {displayedPokemon.length} of {data.pagination.total_count} {isSearching ? 'matching ' : ''}Pokemon
              {data.pagination.current_page > 1 && (
                <span> (Page {data.pagination.current_page} of {data.pagination.total_pages})</span>
              )}
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}