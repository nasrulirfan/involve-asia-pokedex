import React from 'react';
import StaticBanner from './StaticBanner';

export default function StaticBanners() {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* First Static Banner */}
      <StaticBanner
        title="Featured Pokémon"
        subtitle="Discover rare finds"
        gradientFrom="from-green-400"
        gradientTo="to-emerald-600"
        className="flex-1 min-h-[5.5rem]"
      />
      
      {/* Second Static Banner */}
      <StaticBanner
        title="Type Guide"
        subtitle="Learn type advantages"
        gradientFrom="from-pink-400"
        gradientTo="to-rose-600"
        className="flex-1 min-h-[5.5rem]"
      />
    </div>
  );
}