// Performance monitoring utilities

interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  type: 'api' | 'render' | 'interaction' | 'navigation';
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric({
                name: 'page-load',
                duration: navEntry.loadEventEnd - navEntry.fetchStart,
                timestamp: Date.now(),
                type: 'navigation',
                metadata: {
                  domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                  firstPaint: this.getFirstPaint(),
                  firstContentfulPaint: this.getFirstContentfulPaint(),
                }
              });
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch {
        console.warn('Navigation timing observer not supported');
      }

      // Observe paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: entry.name,
              duration: entry.startTime,
              timestamp: Date.now(),
              type: 'render'
            });
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch {
        console.warn('Paint timing observer not supported');
      }

      // Observe largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric({
            name: 'largest-contentful-paint',
            duration: lastEntry.startTime,
            timestamp: Date.now(),
            type: 'render',
            metadata: {
              element: (lastEntry as PerformanceEntry & { element?: { tagName: string } }).element?.tagName,
              size: (lastEntry as PerformanceEntry & { size?: number }).size
            }
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch {
        console.warn('LCP observer not supported');
      }
    }
  }

  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const fpEntry = paintEntries.find(entry => entry.name === 'first-paint');
    return fpEntry ? fpEntry.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : null;
  }

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Measure API call performance
  measureApiCall<T>(name: string, apiCall: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> {
    const startTime = performance.now();
    
    return apiCall().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.recordMetric({
          name: `api-${name}`,
          duration,
          timestamp: Date.now(),
          type: 'api',
          metadata: { ...metadata, success: true }
        });
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.recordMetric({
          name: `api-${name}`,
          duration,
          timestamp: Date.now(),
          type: 'api',
          metadata: { ...metadata, success: false, error: error.message }
        });
        throw error;
      }
    );
  }

  // Measure component render performance
  measureRender(name: string, renderFn: () => void, metadata?: Record<string, unknown>) {
    const startTime = performance.now();
    renderFn();
    const duration = performance.now() - startTime;
    
    this.recordMetric({
      name: `render-${name}`,
      duration,
      timestamp: Date.now(),
      type: 'render',
      metadata
    });
  }

  // Measure user interaction performance
  measureInteraction(name: string, interactionFn: () => void | Promise<void>, metadata?: Record<string, unknown>) {
    const startTime = performance.now();
    
    const result = interactionFn();
    
    if (result instanceof Promise) {
      return result.then(
        (res) => {
          const duration = performance.now() - startTime;
          this.recordMetric({
            name: `interaction-${name}`,
            duration,
            timestamp: Date.now(),
            type: 'interaction',
            metadata: { ...metadata, async: true }
          });
          return res;
        },
        (error) => {
          const duration = performance.now() - startTime;
          this.recordMetric({
            name: `interaction-${name}`,
            duration,
            timestamp: Date.now(),
            type: 'interaction',
            metadata: { ...metadata, async: true, error: error.message }
          });
          throw error;
        }
      );
    } else {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `interaction-${name}`,
        duration,
        timestamp: Date.now(),
        type: 'interaction',
        metadata: { ...metadata, async: false }
      });
    }
  }

  // Get performance summary
  getSummary() {
    const summary = {
      totalMetrics: this.metrics.length,
      byType: {} as Record<string, number>,
      averageDurations: {} as Record<string, number>,
      slowestOperations: [] as PerformanceMetrics[]
    };

    // Group by type
    this.metrics.forEach(metric => {
      summary.byType[metric.type] = (summary.byType[metric.type] || 0) + 1;
    });

    // Calculate average durations by name
    const durationsByName: Record<string, number[]> = {};
    this.metrics.forEach(metric => {
      if (!durationsByName[metric.name]) {
        durationsByName[metric.name] = [];
      }
      durationsByName[metric.name].push(metric.duration);
    });

    Object.entries(durationsByName).forEach(([name, durations]) => {
      summary.averageDurations[name] = durations.reduce((a, b) => a + b, 0) / durations.length;
    });

    // Find slowest operations
    summary.slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return summary;
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }

  // Cleanup observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    measureRender: performanceMonitor.measureRender.bind(performanceMonitor),
    measureInteraction: performanceMonitor.measureInteraction.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
  };
}

// Web Vitals measurement
export function measureWebVitals() {
  if (typeof window === 'undefined') return;

  // Measure CLS (Cumulative Layout Shift)
  let clsValue = 0;
  const clsEntries: PerformanceEntry[] = [];

  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
      if (!layoutShiftEntry.hadRecentInput) {
        clsValue += layoutShiftEntry.value || 0;
        clsEntries.push(entry);
      }
    }
  });

  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    console.warn('CLS measurement not supported');
  }

  // Report Web Vitals after page load
  window.addEventListener('beforeunload', () => {
    performanceMonitor.recordMetric({
      name: 'cumulative-layout-shift',
      duration: clsValue,
      timestamp: Date.now(),
      type: 'render',
      metadata: {
        entries: clsEntries.length
      }
    });
  });
}

// Initialize Web Vitals measurement
if (typeof window !== 'undefined') {
  measureWebVitals();
}