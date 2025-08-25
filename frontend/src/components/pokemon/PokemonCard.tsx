import React, { useState } from 'react';
import Image from 'next/image';
import { PokemonCardProps } from '@/types';
import { formatPokemonName, formatHeight, formatWeight } from '@/utils';
import TypeBadge from './TypeBadge';

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <article 
      className="bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      role="article"
      aria-labelledby={`pokemon-${pokemon.name}`}
    >
      <div className="text-center">
        {/* Pokemon Image */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
                data-testid="loading-spinner"
                role="status"
                aria-label="Loading Pokemon image"
              ></div>
            </div>
          )}
          
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">Image not available</span>
              </div>
            </div>
          ) : (
            <Image
              src={pokemon.image}
              alt={`${formatPokemonName(pokemon.name)} official artwork`}
              fill
              className="object-contain transition-opacity duration-300"
              sizes="(max-width: 640px) 280px, (max-width: 768px) 240px, (max-width: 1024px) 200px, (max-width: 1280px) 180px, 160px"
              onLoad={handleImageLoad}
              onError={handleImageError}
              priority={false}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              quality={85}
              unoptimized={false}
            />
          )}
        </div>

        {/* Pokemon Name */}
        <h3 
          id={`pokemon-${pokemon.name}`}
          className="text-lg font-bold text-gray-800 mb-3 focus:outline-none"
          tabIndex={0}
        >
          {formatPokemonName(pokemon.name)}
        </h3>

        {/* Pokemon Types */}
        <div className="flex flex-wrap justify-center gap-2 mb-4" role="list" aria-label="Pokemon types">
          {pokemon.types.map((type) => (
            <div key={type} role="listitem">
              <TypeBadge type={type} size="sm" />
            </div>
          ))}
        </div>

        {/* Pokemon Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="text-center">
            <div className="font-medium text-gray-800 mb-1">Height</div>
            <div className="text-lg font-semibold text-blue-600">
              {formatHeight(pokemon.height)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-800 mb-1">Weight</div>
            <div className="text-lg font-semibold text-green-600">
              {formatWeight(pokemon.weight)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}