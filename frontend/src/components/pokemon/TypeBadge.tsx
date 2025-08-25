import React from 'react';
import { getTypeColor, formatPokemonName } from '@/utils';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function TypeBadge({ type, size = 'sm' }: TypeBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={`
        inline-block rounded-full font-medium text-white
        transition-transform duration-200 hover:scale-105
        ${getTypeColor(type)} ${sizeClasses[size]}
      `}
      role="badge"
      aria-label={`Pokemon type: ${formatPokemonName(type)}`}
    >
      {formatPokemonName(type)}
    </span>
  );
}