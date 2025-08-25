'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui';

// Dynamic import for PokemonList with loading fallback
const PokemonList = dynamic(() => import('./PokemonList'), {
  loading: () => (
    <div className="flex flex-col items-center justify-center py-8">
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-gray-600 text-lg">Loading Pokemon list...</p>
    </div>
  ),
  ssr: false, // Disable SSR for this component to reduce initial bundle
});

export default PokemonList;