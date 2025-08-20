import { useCallback } from 'react';
import { ProposalElement, Position } from '@/types/proposal';

interface UseAlignmentReturn {
  alignLeft: (elements: ProposalElement[], selectedIds: string[]) => ProposalElement[];
  alignCenter: (elements: ProposalElement[], selectedIds: string[]) => ProposalElement[];
  alignRight: (elements: ProposalElement[], selectedIds: string[]) => ProposalElement[];
  alignTop: (elements: ProposalElement[], selectedIds: string[]) => ProposalElement[];
  alignMiddle: (elements: ProposalElement[], selectedIds: string[]) => ProposalElement[];
  alignBottom: (elements: ProposalElement[], selectedIds: string[]) => ProposalElement[];
  distributeHorizontally: (elements: ProposalElement[], selectedIds: string[]) => ProposalElement[];
  distributeVertically: (elements: ProposalElement[], selectedIds: string[]) => ProposalElement[];
  centerInCanvas: (elements: ProposalElement[], selectedIds: string[], canvasWidth: number, canvasHeight: number) => ProposalElement[];
}

const useAlignment = (): UseAlignmentReturn => {
  // Helper function to get selected elements
  const getSelectedElements = useCallback((elements: ProposalElement[], selectedIds: string[]) => {
    return elements.filter(element => selectedIds.includes(element.id));
  }, []);

  // Helper function to get bounding box of selected elements
  const getBoundingBox = useCallback((selectedElements: ProposalElement[]) => {
    if (selectedElements.length === 0) {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    selectedElements.forEach(element => {
      const elementLeft = element.position.x;
      const elementTop = element.position.y;
      const elementRight = element.position.x + element.size.width;
      const elementBottom = element.position.y + element.size.height;

      left = Math.min(left, elementLeft);
      top = Math.min(top, elementTop);
      right = Math.max(right, elementRight);
      bottom = Math.max(bottom, elementBottom);
    });

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top
    };
  }, []);

  // Align elements to the left
  const alignLeft = useCallback((elements: ProposalElement[], selectedIds: string[]) => {
    if (selectedIds.length < 2) return elements;

    const selectedElements = getSelectedElements(elements, selectedIds);
    const boundingBox = getBoundingBox(selectedElements);

    return elements.map(element => {
      if (selectedIds.includes(element.id)) {
        return {
          ...element,
          position: {
            ...element.position,
            x: boundingBox.left
          }
        };
      }
      return element;
    });
  }, [getSelectedElements, getBoundingBox]);

  // Align elements to the center horizontally
  const alignCenter = useCallback((elements: ProposalElement[], selectedIds: string[]) => {
    if (selectedIds.length < 2) return elements;

    const selectedElements = getSelectedElements(elements, selectedIds);
    const boundingBox = getBoundingBox(selectedElements);
    const centerX = boundingBox.left + boundingBox.width / 2;

    return elements.map(element => {
      if (selectedIds.includes(element.id)) {
        return {
          ...element,
          position: {
            ...element.position,
            x: centerX - element.size.width / 2
          }
        };
      }
      return element;
    });
  }, [getSelectedElements, getBoundingBox]);

  // Align elements to the right
  const alignRight = useCallback((elements: ProposalElement[], selectedIds: string[]) => {
    if (selectedIds.length < 2) return elements;

    const selectedElements = getSelectedElements(elements, selectedIds);
    const boundingBox = getBoundingBox(selectedElements);

    return elements.map(element => {
      if (selectedIds.includes(element.id)) {
        return {
          ...element,
          position: {
            ...element.position,
            x: boundingBox.right - element.size.width
          }
        };
      }
      return element;
    });
  }, [getSelectedElements, getBoundingBox]);

  // Align elements to the top
  const alignTop = useCallback((elements: ProposalElement[], selectedIds: string[]) => {
    if (selectedIds.length < 2) return elements;

    const selectedElements = getSelectedElements(elements, selectedIds);
    const boundingBox = getBoundingBox(selectedElements);

    return elements.map(element => {
      if (selectedIds.includes(element.id)) {
        return {
          ...element,
          position: {
            ...element.position,
            y: boundingBox.top
          }
        };
      }
      return element;
    });
  }, [getSelectedElements, getBoundingBox]);

  // Align elements to the middle vertically
  const alignMiddle = useCallback((elements: ProposalElement[], selectedIds: string[]) => {
    if (selectedIds.length < 2) return elements;

    const selectedElements = getSelectedElements(elements, selectedIds);
    const boundingBox = getBoundingBox(selectedElements);
    const centerY = boundingBox.top + boundingBox.height / 2;

    return elements.map(element => {
      if (selectedIds.includes(element.id)) {
        return {
          ...element,
          position: {
            ...element.position,
            y: centerY - element.size.height / 2
          }
        };
      }
      return element;
    });
  }, [getSelectedElements, getBoundingBox]);

  // Align elements to the bottom
  const alignBottom = useCallback((elements: ProposalElement[], selectedIds: string[]) => {
    if (selectedIds.length < 2) return elements;

    const selectedElements = getSelectedElements(elements, selectedIds);
    const boundingBox = getBoundingBox(selectedElements);

    return elements.map(element => {
      if (selectedIds.includes(element.id)) {
        return {
          ...element,
          position: {
            ...element.position,
            y: boundingBox.bottom - element.size.height
          }
        };
      }
      return element;
    });
  }, [getSelectedElements, getBoundingBox]);

  // Distribute elements horizontally
  const distributeHorizontally = useCallback((elements: ProposalElement[], selectedIds: string[]) => {
    if (selectedIds.length < 3) return elements;

    const selectedElements = getSelectedElements(elements, selectedIds)
      .sort((a, b) => a.position.x - b.position.x);
    
    const boundingBox = getBoundingBox(selectedElements);
    const totalWidth = selectedElements.reduce((sum, el) => sum + el.size.width, 0);
    const availableSpace = boundingBox.width - totalWidth;
    const spacing = availableSpace / (selectedElements.length - 1);

    let currentX = boundingBox.left;

    return elements.map(element => {
      const selectedIndex = selectedElements.findIndex(sel => sel.id === element.id);
      if (selectedIndex !== -1) {
        const newPosition = { ...element.position, x: currentX };
        currentX += element.size.width + spacing;
        return {
          ...element,
          position: newPosition
        };
      }
      return element;
    });
  }, [getSelectedElements, getBoundingBox]);

  // Distribute elements vertically
  const distributeVertically = useCallback((elements: ProposalElement[], selectedIds: string[]) => {
    if (selectedIds.length < 3) return elements;

    const selectedElements = getSelectedElements(elements, selectedIds)
      .sort((a, b) => a.position.y - b.position.y);
    
    const boundingBox = getBoundingBox(selectedElements);
    const totalHeight = selectedElements.reduce((sum, el) => sum + el.size.height, 0);
    const availableSpace = boundingBox.height - totalHeight;
    const spacing = availableSpace / (selectedElements.length - 1);

    let currentY = boundingBox.top;

    return elements.map(element => {
      const selectedIndex = selectedElements.findIndex(sel => sel.id === element.id);
      if (selectedIndex !== -1) {
        const newPosition = { ...element.position, y: currentY };
        currentY += element.size.height + spacing;
        return {
          ...element,
          position: newPosition
        };
      }
      return element;
    });
  }, [getSelectedElements, getBoundingBox]);

  // Center elements in canvas
  const centerInCanvas = useCallback((elements: ProposalElement[], selectedIds: string[], canvasWidth: number, canvasHeight: number) => {
    if (selectedIds.length === 0) return elements;

    const selectedElements = getSelectedElements(elements, selectedIds);
    const boundingBox = getBoundingBox(selectedElements);
    
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    const selectionCenterX = boundingBox.left + boundingBox.width / 2;
    const selectionCenterY = boundingBox.top + boundingBox.height / 2;
    
    const deltaX = canvasCenterX - selectionCenterX;
    const deltaY = canvasCenterY - selectionCenterY;

    return elements.map(element => {
      if (selectedIds.includes(element.id)) {
        return {
          ...element,
          position: {
            x: element.position.x + deltaX,
            y: element.position.y + deltaY
          }
        };
      }
      return element;
    });
  }, [getSelectedElements, getBoundingBox]);

  return {
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    distributeHorizontally,
    distributeVertically,
    centerInCanvas
  };
};

export default useAlignment;