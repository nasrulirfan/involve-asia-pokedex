import React from 'react';

interface StaticBannerProps {
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  className?: string;
}

export default function StaticBanner({ 
  title, 
  subtitle, 
  gradientFrom, 
  gradientTo, 
  className = '' 
}: StaticBannerProps) {
  return (
    <div 
      className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl h-full flex items-center justify-center text-white shadow-lg ${className}`}
    >
      <div className="text-center px-4">
        <span className="text-lg font-semibold block">{title}</span>
        <span className="text-xs opacity-90">{subtitle}</span>
      </div>
    </div>
  );
}