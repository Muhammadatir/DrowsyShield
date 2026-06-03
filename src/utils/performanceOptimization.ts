import { performanceMonitor } from './performanceMonitor';

/**
 * Performance optimization utilities for DrowsyGuard
 */

// Debounce function for expensive operations
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for rate limiting
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Image optimization
export const optimizeImage = (
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
  quality = 0.8
): string => {
  const endMeasure = performanceMonitor.startMeasure('image-optimization');
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  let { width, height } = canvas;

  // Calculate new dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  // Create new canvas with optimized size
  const optimizedCanvas = document.createElement('canvas');
  optimizedCanvas.width = width;
  optimizedCanvas.height = height;
  
  const optimizedCtx = optimizedCanvas.getContext('2d');
  if (!optimizedCtx) return '';

  optimizedCtx.drawImage(canvas, 0, 0, width, height);
  
  endMeasure();
  return optimizedCanvas.toDataURL('image/jpeg', quality);
};

// Memory cleanup
export const cleanupResources = (elements: (HTMLElement | null)[]): void => {
  elements.forEach((element) => {
    if (element) {
      // Remove event listeners
      const clone = element.cloneNode(true);
      element.parentNode?.replaceChild(clone, element);
    }
  });
};

// Battery-aware processing
export const isBatteryLow = async (): Promise<boolean> => {
  if (!('getBattery' in navigator)) return false;

  try {
    const battery = await (navigator as Navigator & { getBattery: () => Promise<{ level: number; charging: boolean }> }).getBattery();
    return battery.level < 0.2 && !battery.charging;
  } catch {
    return false;
  }
};

// Adaptive frame rate based on performance
export const getAdaptiveFrameRate = (): number => {
  const metrics = performanceMonitor.getSummary();
  const faceDetectionMetrics = metrics['face-detection'];

  if (!faceDetectionMetrics) return 30; // Default

  const avgDuration = faceDetectionMetrics.avgDuration;

  // Adjust frame rate based on processing time
  if (avgDuration > 100) return 15; // Slow device
  if (avgDuration > 50) return 20;  // Medium device
  return 30; // Fast device
};

// Cache with expiration
export class CacheWithExpiry<T> {
  private cache = new Map<string, { data: T; expiry: number }>();

  set(key: string, data: T, ttl: number): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Lazy load images
export const lazyLoadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Request idle callback wrapper
export const scheduleIdleTask = (callback: () => void, timeout = 2000): void => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
};