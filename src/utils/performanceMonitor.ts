interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100;

  startMeasure(name: string): () => void {
    const startTime = performance.now();
    const timestamp = Date.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({ name, duration, timestamp });
    };
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  getAverageDuration(name: string): number {
    const relevantMetrics = this.getMetrics(name);
    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / relevantMetrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  getSummary(): Record<string, { count: number; avgDuration: number; maxDuration: number }> {
    const summary: Record<string, { count: number; avgDuration: number; maxDuration: number }> = {};

    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avgDuration: 0,
          maxDuration: 0,
        };
      }

      const current = summary[metric.name];
      current.count++;
      current.maxDuration = Math.max(current.maxDuration, metric.duration);
      current.avgDuration = ((current.avgDuration * (current.count - 1)) + metric.duration) / current.count;
    });

    return summary;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Helper function to measure async operations
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const endMeasure = performanceMonitor.startMeasure(name);
  try {
    return await fn();
  } finally {
    endMeasure();
  }
}

// Helper function to measure sync operations
export function measureSync<T>(name: string, fn: () => T): T {
  const endMeasure = performanceMonitor.startMeasure(name);
  try {
    return fn();
  } finally {
    endMeasure();
  }
}
