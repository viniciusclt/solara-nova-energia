import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// SISTEMA DE FEEDBACK VISUAL GLOBAL
// =====================================================

interface FeedbackItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface FeedbackContextType {
  items: FeedbackItem[];
  addFeedback: (item: Omit<FeedbackItem, 'id'>) => void;
  removeFeedback: (id: string) => void;
  clearAll: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// Provider do sistema de feedback
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<FeedbackItem[]>([]);

  const addFeedback = useCallback((item: Omit<FeedbackItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newItem: FeedbackItem = {
      ...item,
      id,
      duration: item.duration ?? 5000
    };

    setItems(prev => [...prev, newItem]);

    // Auto-remove se não for persistente
    if (!item.persistent && newItem.duration) {
      setTimeout(() => {
        removeFeedback(id);
      }, newItem.duration);
    }
  }, []);

  const removeFeedback = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <FeedbackContext.Provider value={{ items, addFeedback, removeFeedback, clearAll }}>
      {children}
      <FeedbackContainer />
    </FeedbackContext.Provider>
  );
};

// Container para exibir os feedbacks
const FeedbackContainer: React.FC = () => {
  const { items, removeFeedback } = useFeedback();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {items.map((item) => (
          <FeedbackItem
            key={item.id}
            item={item}
            onRemove={() => removeFeedback(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Item individual de feedback
const FeedbackItem: React.FC<{
  item: FeedbackItem;
  onRemove: () => void;
}> = ({ item, onRemove }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (item.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        getBackgroundColor()
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {item.title}
          </h4>
          {item.message && (
            <p className="mt-1 text-sm text-gray-600">
              {item.message}
            </p>
          )}
        </div>
        
        <button
          onClick={onRemove}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

// Componente de loading overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  progress?: number;
}> = ({ isVisible, message = 'Carregando...', progress }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center"
          >
            <div className="mb-4">
              <motion.div
                className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {message}
            </h3>
            
            {progress !== undefined && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="h-full bg-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Componente de confirmação com animação
export const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {title}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            <div className="flex space-x-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                {cancelText}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className={cn(
                  'px-4 py-2 text-white rounded-md transition-colors',
                  variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para usar o sistema de feedback de forma simplificada
export const useSimpleFeedback = () => {
  const { addFeedback } = useFeedback();

  const success = useCallback((title: string, message?: string) => {
    addFeedback({ type: 'success', title, message });
  }, [addFeedback]);

  const error = useCallback((title: string, message?: string) => {
    addFeedback({ type: 'error', title, message });
  }, [addFeedback]);

  const warning = useCallback((title: string, message?: string) => {
    addFeedback({ type: 'warning', title, message });
  }, [addFeedback]);

  const info = useCallback((title: string, message?: string) => {
    addFeedback({ type: 'info', title, message });
  }, [addFeedback]);

  return { success, error, warning, info };
};

// Componente de status indicator
export const StatusIndicator: React.FC<{
  status: 'idle' | 'loading' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}> = ({ status, size = 'md', showText = false }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <motion.div
            className={cn('border-2 border-gray-300 border-t-blue-600 rounded-full', sizeClasses[size])}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        );
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn('bg-green-500 rounded-full flex items-center justify-center', sizeClasses[size])}
          >
            <CheckCircle className="w-full h-full text-white" />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn('bg-red-500 rounded-full flex items-center justify-center', sizeClasses[size])}
          >
            <XCircle className="w-full h-full text-white" />
          </motion.div>
        );
      default:
        return (
          <div className={cn('bg-gray-300 rounded-full', sizeClasses[size])} />
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading': return 'Carregando...';
      case 'success': return 'Sucesso';
      case 'error': return 'Erro';
      default: return 'Aguardando';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {getStatusContent()}
      {showText && (
        <span className="text-sm text-gray-600">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};