import { useState, useCallback, useRef } from 'react';
import { ProposalElement } from '@/types/proposal';

interface UndoRedoState {
  history: ProposalElement[][];
  currentIndex: number;
  maxHistorySize: number;
}

interface UseUndoRedoReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushToHistory: (elements: ProposalElement[]) => void;
  clearHistory: () => void;
  getHistorySize: () => number;
}

const useUndoRedo = (
  elements: ProposalElement[],
  setElements: (elements: ProposalElement[]) => void,
  maxHistorySize: number = 50
): UseUndoRedoReturn => {
  const [state, setState] = useState<UndoRedoState>({
    history: [elements],
    currentIndex: 0,
    maxHistorySize
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPushTime = useRef<number>(0);
  const DEBOUNCE_TIME = 500; // 500ms debounce

  const pushToHistory = useCallback((newElements: ProposalElement[]) => {
    const now = Date.now();
    
    // Debounce rapid changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        // Don't add to history if elements are the same
        const currentElements = prevState.history[prevState.currentIndex];
        if (JSON.stringify(currentElements) === JSON.stringify(newElements)) {
          return prevState;
        }
        
        // Remove any history after current index (when undoing then making new changes)
        const newHistory = prevState.history.slice(0, prevState.currentIndex + 1);
        
        // Add new state
        newHistory.push(JSON.parse(JSON.stringify(newElements))); // Deep clone
        
        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
        } else {
          // Only increment index if we didn't remove from beginning
          return {
            ...prevState,
            history: newHistory,
            currentIndex: newHistory.length - 1
          };
        }
        
        return {
          ...prevState,
          history: newHistory,
          currentIndex: newHistory.length - 1
        };
      });
      
      lastPushTime.current = now;
    }, DEBOUNCE_TIME);
  }, [maxHistorySize]);

  const undo = useCallback(() => {
    setState(prevState => {
      if (prevState.currentIndex > 0) {
        const newIndex = prevState.currentIndex - 1;
        const elementsToRestore = prevState.history[newIndex];
        setElements(JSON.parse(JSON.stringify(elementsToRestore))); // Deep clone
        
        return {
          ...prevState,
          currentIndex: newIndex
        };
      }
      return prevState;
    });
  }, [setElements]);

  const redo = useCallback(() => {
    setState(prevState => {
      if (prevState.currentIndex < prevState.history.length - 1) {
        const newIndex = prevState.currentIndex + 1;
        const elementsToRestore = prevState.history[newIndex];
        setElements(JSON.parse(JSON.stringify(elementsToRestore))); // Deep clone
        
        return {
          ...prevState,
          currentIndex: newIndex
        };
      }
      return prevState;
    });
  }, [setElements]);

  const clearHistory = useCallback(() => {
    setState({
      history: [elements],
      currentIndex: 0,
      maxHistorySize
    });
  }, [elements, maxHistorySize]);

  const getHistorySize = useCallback(() => {
    return state.history.length;
  }, [state.history.length]);

  const canUndo = state.currentIndex > 0;
  const canRedo = state.currentIndex < state.history.length - 1;

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    pushToHistory,
    clearHistory,
    getHistorySize
  };
};

export default useUndoRedo;