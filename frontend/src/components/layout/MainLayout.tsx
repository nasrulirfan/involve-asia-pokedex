import React from 'react';
import CarouselBanner from './CarouselBanner';
import StaticBanners from './StaticBanners';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section - Top banners and carousel */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-48">
            {/* Carousel Banner - Takes 3/4 width on large screens */}
            <div className="lg:col-span-3">
              <CarouselBanner />
            </div>
            
            {/* Static Banners - Takes 1/4 width on large screens */}
            <div className="lg:col-span-1">
              <StaticBanners />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Section with CSS Grid Layout */}
      <main className="flex-1 relative">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full min-h-[calc(100vh-16rem)]">
            {/* Left Static Image - Fixed positioning */}
            <div className="hidden lg:block lg:col-span-2 relative">
              <div className="sticky top-72 px-4">
                <div className="bg-gradient-to-b from-amber-400 via-orange-500 to-red-600 rounded-xl h-96 flex items-center justify-center text-white shadow-xl overflow-hidden">
                  <div className="text-center transform -rotate-12">
                    <div className="text-6xl mb-2">🔥</div>
                    <span className="text-lg font-bold block">Fire Types</span>
                    <span className="text-sm opacity-90">Discover powerful Fire Pokémon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Content - Pokemon List and Search */}
            <div className="lg:col-span-8 px-4 sm:px-6 lg:px-8 py-8">
              <div className="h-full overflow-y-auto">
                {children}
              </div>
            </div>

            {/* Right Static Image - Fixed positioning */}
            <div className="hidden lg:block lg:col-span-2 relative">
              <div className="sticky top-72 px-4">
                <div className="bg-gradient-to-b from-blue-400 via-cyan-500 to-teal-600 rounded-xl h-96 flex items-center justify-center text-white shadow-xl overflow-hidden">
                  <div className="text-center transform rotate-12">
                    <div className="text-6xl mb-2">💧</div>
                    <span className="text-lg font-bold block">Water Types</span>
                    <span className="text-sm opacity-90">Explore aquatic Pokémon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}