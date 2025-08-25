'use client';

import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '@/lib/performance-monitor';

interface PerformanceDashboardProps {
  isVisible?: boolean;
}

export default function PerformanceDashboard({ isVisible = false }: PerformanceDashboardProps) {
  const [summary, setSummary] = useState<{
    totalMetrics: number;
    byType: Record<string, number>;
    averageDurations: Record<string, number>;
    slowestOperations: Array<{ name: string; duration: number; timestamp: number; type: string }>;
  }>({ totalMetrics: 0, byType: {}, averageDurations: {}, slowestOperations: [] });
  const [isExpanded, setIsExpanded] = useState(false);
  const { getSummary } = usePerformanceMonitor();

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setSummary(getSummary());
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, getSummary]);

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatValue = (value: number, unit: string = 'ms') => {
    if (unit === 'ms') {
      return value < 1000 ? `${value.toFixed(1)}ms` : `${(value / 1000).toFixed(2)}s`;
    }
    return value.toFixed(3);
  };

  const getGradeColor = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'text-green-600 bg-green-100';
    if (value <= thresholds.poor) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg mb-2 transition-colors"
        title="Performance Dashboard"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Dashboard Panel */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-xl border p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Performance</h3>
            <div className="text-xs text-gray-500">
              {summary.totalMetrics || 0} metrics
            </div>
          </div>

          {/* Performance Summary */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-blue-600 font-medium">API Calls</div>
                <div className="text-blue-800">{summary.byType?.api || 0}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-green-600 font-medium">Renders</div>
                <div className="text-green-800">{summary.byType?.render || 0}</div>
              </div>
            </div>
          </div>

          {/* Average Durations */}
          {summary.averageDurations && Object.keys(summary.averageDurations).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Average Performance</h4>
              <div className="space-y-2">
                {Object.entries(summary.averageDurations).map(([name, duration]) => {
                  const thresholds = name.includes('api') ? { good: 500, poor: 1000 } : { good: 100, poor: 300 };
                  
                  return (
                    <div key={name} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate">
                        {name.replace('api-', '').replace('-', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {formatValue(duration)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getGradeColor(duration, thresholds)}`}>
                          {duration <= thresholds.good ? 'Good' : duration <= thresholds.poor ? 'OK' : 'Slow'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Slowest Operations */}
          {summary.slowestOperations && summary.slowestOperations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Slowest Operations</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {summary.slowestOperations.slice(0, 5).map((metric, index: number) => (
                  <div key={index} className="text-xs text-gray-500 flex justify-between">
                    <span className="truncate">{metric.name}</span>
                    <span className="font-mono ml-2 text-red-600">
                      {formatValue(metric.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}