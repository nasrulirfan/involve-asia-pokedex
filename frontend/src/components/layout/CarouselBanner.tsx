'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CarouselSlide {
  id: number;
  title: string;
  subtitle: string;
  gradient: string;
  icon: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    title: 'Discover Amazing Pokémon',
    subtitle: 'Explore the world of Pokémon with our comprehensive Pokédex',
    gradient: 'from-blue-500 via-purple-600 to-indigo-700',
    icon: '⚡'
  },
  {
    id: 2,
    title: 'Search & Filter',
    subtitle: 'Find your favorite Pokémon quickly with our powerful search',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    icon: '🔍'
  },
  {
    id: 3,
    title: 'Detailed Information',
    subtitle: 'Learn about types, stats, and characteristics of every Pokémon',
    gradient: 'from-orange-500 via-red-600 to-pink-700',
    icon: '📊'
  },
  {
    id: 4,
    title: 'Beautiful Interface',
    subtitle: 'Enjoy a modern, responsive design that works on all devices',
    gradient: 'from-violet-500 via-purple-600 to-fuchsia-700',
    icon: '✨'
  }
];

export default function CarouselBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  // Pause auto-rotation on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div 
      className="relative w-full h-full rounded-xl overflow-hidden shadow-lg group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Pokédex carousel banner"
    >
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={index !== currentSlide}
          >
            <div className={`bg-gradient-to-r ${slide.gradient} w-full h-full flex items-center justify-center text-white`}>
              <div className="text-center px-6 max-w-2xl">
                <div className="text-4xl sm:text-5xl mb-4 animate-bounce">
                  {slide.icon}
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight">
                  {slide.title}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg opacity-90 leading-relaxed">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1 sm:p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1 sm:p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Next slide"
      >
        <ChevronRightIcon className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              index === currentSlide
                ? 'bg-white scale-110'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? 'true' : 'false'}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
        <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
          isAutoPlaying ? 'bg-green-400' : 'bg-gray-400'
        }`} title={isAutoPlaying ? 'Auto-playing' : 'Paused'} />
      </div>
    </div>
  );
}