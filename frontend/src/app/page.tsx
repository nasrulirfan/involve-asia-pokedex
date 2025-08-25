'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MainLayout } from '@/components/layout';
import { SearchBar } from '@/components/pokemon';
import { ErrorBoundary, LoadingSpinner } from '@/components/ui';

// Dynamic import for PokemonList to enable code splitting
const PokemonList = dynamic(() => import('@/components/pokemon/PokemonList'), {
  loading: () => (
    <div className="flex flex-col items-center justify-center py-8">
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-gray-600 text-lg">Loading Pokemon...</p>
    </div>
  ),
  ssr: false, // Disable SSR for this component to improve initial page load
});

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    setSearchQuery(query);
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        <div className="space-y-6">
          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} />
          
          {/* Pokemon List */}
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingSpinner size="lg" className="mb-4" />
              <p className="text-gray-600 text-lg">Loading Pokemon...</p>
            </div>
          }>
            <PokemonList searchQuery={searchQuery} enableInfiniteScroll={true} />
          </Suspense>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
}