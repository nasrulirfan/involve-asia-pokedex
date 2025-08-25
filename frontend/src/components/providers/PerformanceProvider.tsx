'use client';

import { useEffect } from 'react';
import { warmCache, preloadPopularPokemon } from '@/lib/swr-config';
import { performanceMonitor } from '@/lib/performance-monitor';

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export default function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance monitoring
    if (typeof window !== 'undefined') {
      // Warm cache on app load
      setTimeout(() => {
        warmCache();
      }, 2000); // Wait 2 seconds after initial load
      
      // Preload popular Pokemon after a delay
      setTimeout(() => {
        preloadPopularPokemon();
      }, 5000); // Wait 5 seconds after initial load
      
      // Log performance summary periodically in development
      if (process.env.NODE_ENV === 'development') {
        const logPerformance = () => {
          const summary = performanceMonitor.getSummary();
          if (summary.totalMetrics > 0) {
            console.group('Performance Summary');
            console.table(summary.averageDurations);
            console.log('Slowest Operations:', summary.slowestOperations.slice(0, 5));
            console.groupEnd();
          }
        };
        
        // Log every 30 seconds in development
        const interval = setInterval(logPerformance, 30000);
        
        return () => {
          clearInterval(interval);
          performanceMonitor.destroy();
        };
      }
    }
  }, []);

  return <>{children}</>;
}