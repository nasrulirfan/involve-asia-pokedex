import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'card' | 'text' | 'image' | 'button';
  count?: number;
}

const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-white rounded-lg shadow-md p-4 animate-pulse ${className}`}>
    {/* Image skeleton */}
    <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg"></div>
    
    {/* Name skeleton */}
    <div className="h-6 bg-gray-200 rounded mb-3 mx-auto w-3/4"></div>
    
    {/* Type badges skeleton */}
    <div className="flex justify-center gap-2 mb-4">
      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
    </div>
    
    {/* Stats skeleton */}
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="h-4 bg-gray-200 rounded mb-1"></div>
        <div className="h-6 bg-gray-200 rounded w-12 mx-auto"></div>
      </div>
      <div className="text-center">
        <div className="h-4 bg-gray-200 rounded mb-1"></div>
        <div className="h-6 bg-gray-200 rounded w-12 mx-auto"></div>
      </div>
    </div>
  </div>
);

const SkeletonText = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 rounded"></div>
  </div>
);

const SkeletonImage = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`}></div>
);

const SkeletonButton = ({ className = '' }: { className?: string }) => (
  <div className={`h-10 bg-gray-200 animate-pulse rounded-lg ${className}`}></div>
);

export default function SkeletonLoader({ 
  className = '', 
  variant = 'card', 
  count = 1 
}: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, index) => {
    switch (variant) {
      case 'card':
        return <SkeletonCard key={index} className={className} />;
      case 'text':
        return <SkeletonText key={index} className={className} />;
      case 'image':
        return <SkeletonImage key={index} className={className} />;
      case 'button':
        return <SkeletonButton key={index} className={className} />;
      default:
        return <SkeletonCard key={index} className={className} />;
    }
  });

  if (count === 1) {
    return skeletons[0];
  }

  return <>{skeletons}</>;
}

// Specialized skeleton for Pokemon grid
export function PokemonGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <SkeletonLoader variant="card" count={count} />
    </div>
  );
}