// パフォーマンス監視ユーティリティ
import React from 'react';

interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // パフォーマンス計測開始
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  // パフォーマンス計測終了
  end(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // コンソールに出力
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`, metric.metadata);

    return duration;
  }

  // 計測結果を取得
  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  // 全ての計測結果を取得
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  // 計測結果をクリア
  clear(): void {
    this.metrics.clear();
  }

  // 統計情報を取得
  getStats(): {
    totalMetrics: number;
    completedMetrics: number;
    averageDuration: number;
    slowestMetric: PerformanceMetrics | null;
  } {
    const allMetrics = this.getAllMetrics();
    const completedMetrics = allMetrics.filter(m => m.duration !== undefined);
    
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0;
    
    const slowestMetric = completedMetrics.reduce((slowest, current) => {
      if (!slowest || (current.duration || 0) > (slowest.duration || 0)) {
        return current;
      }
      return slowest;
    }, null as PerformanceMetrics | null);

    return {
      totalMetrics: allMetrics.length,
      completedMetrics: completedMetrics.length,
      averageDuration,
      slowestMetric,
    };
  }
}

// グローバルインスタンス
export const performanceMonitor = new PerformanceMonitor();

// React Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const start = (name: string, metadata?: Record<string, any>) => {
    performanceMonitor.start(name, metadata);
  };

  const end = (name: string) => {
    return performanceMonitor.end(name);
  };

  return { start, end };
};

// HOC for component performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent: React.FC<P> = (props) => {
    const name = componentName || Component.displayName || Component.name || 'UnknownComponent';
    
    React.useEffect(() => {
      performanceMonitor.start(`${name}:mount`);
      
      return () => {
        performanceMonitor.end(`${name}:mount`);
      };
    }, [name]);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName || Component.displayName || Component.name})`;

  return WrappedComponent;
}

// API request performance monitoring
export const measureApiCall = async <T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  performanceMonitor.start(`api:${name}`);
  
  try {
    const result = await apiCall();
    performanceMonitor.end(`api:${name}`);
    return result;
  } catch (error) {
    performanceMonitor.end(`api:${name}`);
    throw error;
  }
};

// Bundle size analyzer helper
export const logBundleInfo = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Log performance navigation timing
    if (window.performance && window.performance.getEntriesByType) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        console.group('📊 Performance Metrics');
        console.log('DOM Content Loaded:', `${(navigation.domContentLoadedEventEnd - navigation.fetchStart).toFixed(2)}ms`);
        console.log('Page Load Complete:', `${(navigation.loadEventEnd - navigation.fetchStart).toFixed(2)}ms`);
        console.log('First Paint:', `${(navigation.responseStart - navigation.fetchStart).toFixed(2)}ms`);
        console.groupEnd();
      }
    }

    // Log memory usage if available
    if ((window.performance as any).memory) {
      const memory = (window.performance as any).memory;
      console.group('💾 Memory Usage');
      console.log('Used:', `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log('Total:', `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log('Limit:', `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
      console.groupEnd();
    }
  }
};

// Component render count tracker
export const useRenderCount = (componentName: string) => {
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
};

// Debounced performance logger
let logTimeout: NodeJS.Timeout;
export const debouncedPerformanceLog = () => {
  clearTimeout(logTimeout);
  logTimeout = setTimeout(() => {
    const stats = performanceMonitor.getStats();
    if (stats.completedMetrics > 0) {
      console.group('⚡ Performance Summary');
      console.log('Completed Metrics:', stats.completedMetrics);
      console.log('Average Duration:', `${stats.averageDuration.toFixed(2)}ms`);
      if (stats.slowestMetric) {
        console.log('Slowest Operation:', `${stats.slowestMetric.name} (${stats.slowestMetric.duration?.toFixed(2)}ms)`);
      }
      console.groupEnd();
    }
  }, 1000);
}; 