/**
 * Índice dos componentes de Análise Financeira
 * Facilita importações e lazy loading
 */

import React from 'react';
import { performanceMonitor } from '../../services/PerformanceMonitor';

// Componente principal com lazy loading
export { FinancialAnalysisComplete } from './FinancialAnalysisComplete';

// Componentes lazy loading individuais
export { FinancialConfiguration } from './FinancialConfiguration';
export { FinancialResults } from './FinancialResults';
export { FinancialCharts } from './FinancialCharts';
export { FinancialReport } from './FinancialReport';

// Lazy loading factory functions com monitoramento
export const createLazyFinancialComponents = () => {
  const createLazyComponent = (importFn: () => Promise<{ [key: string]: React.ComponentType<Record<string, unknown>> }>, componentName: string) => {
    return React.lazy(() => {
      const startTime = performance.now();
      return importFn().then(module => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading(componentName, loadTime, true);
        return { default: module[componentName] };
      }).catch(error => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading(componentName, loadTime, false);
        throw error;
      });
    });
  };

  return {
    FinancialAnalysisComplete: createLazyComponent(
      () => import('./FinancialAnalysisComplete'),
      'FinancialAnalysisComplete'
    ),
    FinancialConfiguration: createLazyComponent(
      () => import('./FinancialConfiguration'),
      'FinancialConfiguration'
    ),
    FinancialResults: createLazyComponent(
      () => import('./FinancialResults'),
      'FinancialResults'
    ),
    FinancialCharts: createLazyComponent(
      () => import('./FinancialCharts'),
      'FinancialCharts'
    ),
    FinancialReport: createLazyComponent(
      () => import('./FinancialReport'),
      'FinancialReport'
    )
  };
};

// Preload functions para otimização com monitoramento
export const preloadFinancialComponents = {
  configuration: () => {
    const startTime = performance.now();
    return import('./FinancialConfiguration')
      .then(module => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialConfiguration', loadTime, true);
        return module;
      })
      .catch(error => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialConfiguration', loadTime, false);
        throw error;
      });
  },
  results: () => {
    const startTime = performance.now();
    return import('./FinancialResults')
      .then(module => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialResults', loadTime, true);
        return module;
      })
      .catch(error => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialResults', loadTime, false);
        throw error;
      });
  },
  charts: () => {
    const startTime = performance.now();
    return import('./FinancialCharts')
      .then(module => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialCharts', loadTime, true);
        return module;
      })
      .catch(error => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialCharts', loadTime, false);
        throw error;
      });
  },
  report: () => {
    const startTime = performance.now();
    return import('./FinancialReport')
      .then(module => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialReport', loadTime, true);
        return module;
      })
      .catch(error => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialReport', loadTime, false);
        throw error;
      });
  },
  complete: () => {
    const startTime = performance.now();
    return import('./FinancialAnalysisComplete')
      .then(module => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialAnalysisComplete', loadTime, true);
        return module;
      })
      .catch(error => {
        const loadTime = performance.now() - startTime;
        performanceMonitor.trackLazyLoading('FinancialAnalysisComplete', loadTime, false);
        throw error;
      });
  }
};

// Hook para preload inteligente com monitoramento
export const useFinancialComponentPreload = () => {
  const preloadComponent = React.useCallback((component: keyof typeof preloadFinancialComponents) => {
    const startTime = performance.now();
    preloadFinancialComponents[component]()
      .then(() => {
        const duration = performance.now() - startTime;
        performanceMonitor.trackComponentRender(`PreloadComponent_${component}`, duration);
      })
      .catch(console.error);
  }, []);

  const preloadAll = React.useCallback(() => {
    const startTime = performance.now();
    const promises = Object.entries(preloadFinancialComponents).map(([key, preload]) => {
      return preload().catch(error => {
        console.error(`Error preloading ${key}:`, error);
        return null;
      });
    });
    
    Promise.allSettled(promises).then(() => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackComponentRender('PreloadAllComponents', duration);
    });
  }, []);

  return { preloadComponent, preloadAll };
};