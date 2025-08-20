import { useCallback } from 'react';
import { ProposalElement } from '@/types/proposal';
import { ElementGroup } from './useGrouping';

interface UseDuplicationReturn {
  duplicateElements: (elements: ProposalElement[], selectedIds: string[], groups: ElementGroup[]) => {
    elements: ProposalElement[];
    groups: ElementGroup[];
    newSelectedIds: string[];
  };
  duplicateElement: (element: ProposalElement, elements: ProposalElement[]) => ProposalElement;
  duplicateWithOffset: (elements: ProposalElement[], selectedIds: string[], offset: { x: number; y: number }) => {
    elements: ProposalElement[];
    newSelectedIds: string[];
  };
  duplicateInGrid: (elements: ProposalElement[], selectedIds: string[], rows: number, cols: number, spacing: { x: number; y: number }) => {
    elements: ProposalElement[];
    newSelectedIds: string[];
  };
}

const useDuplication = (): UseDuplicationReturn => {
  // Generate unique ID for elements
  const generateElementId = useCallback(() => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Generate unique ID for groups
  const generateGroupId = useCallback(() => {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Duplicate a single element
  const duplicateElement = useCallback((element: ProposalElement, elements: ProposalElement[]) => {
    const offset = { x: 20, y: 20 };
    const maxZIndex = Math.max(...elements.map(e => e.zIndex), 0);
    
    return {
      ...element,
      id: generateElementId(),
      position: {
        x: element.position.x + offset.x,
        y: element.position.y + offset.y
      },
      zIndex: maxZIndex + 1,
      // Reset selection state for duplicated element
      selected: false
    };
  }, [generateElementId]);

  // Duplicate multiple elements with group handling
  const duplicateElements = useCallback((elements: ProposalElement[], selectedIds: string[], groups: ElementGroup[]) => {
    if (selectedIds.length === 0) {
      return { elements, groups, newSelectedIds: [] };
    }

    const offset = { x: 20, y: 20 };
    const maxZIndex = Math.max(...elements.map(e => e.zIndex), 0);
    const duplicatedElements: ProposalElement[] = [];
    const newSelectedIds: string[] = [];
    const newGroups: ElementGroup[] = [];
    const processedGroupIds = new Set<string>();

    // Process each selected element
    selectedIds.forEach((elementId, index) => {
      const element = elements.find(e => e.id === elementId);
      if (!element) return;

      // Check if element is part of a group
      const elementGroup = groups.find(group => group.elementIds.includes(elementId));
      
      if (elementGroup && !processedGroupIds.has(elementGroup.id)) {
        // Duplicate entire group
        processedGroupIds.add(elementGroup.id);
        
        const groupElements = elements.filter(e => elementGroup.elementIds.includes(e.id));
        const duplicatedGroupElements = groupElements.map((groupElement, groupIndex) => {
          const duplicated = {
            ...groupElement,
            id: generateElementId(),
            position: {
              x: groupElement.position.x + offset.x,
              y: groupElement.position.y + offset.y
            },
            zIndex: maxZIndex + index * 100 + groupIndex + 1,
            selected: false
          };
          
          duplicatedElements.push(duplicated);
          newSelectedIds.push(duplicated.id);
          return duplicated;
        });

        // Create duplicated group
        const duplicatedGroup: ElementGroup = {
          ...elementGroup,
          id: generateGroupId(),
          elementIds: duplicatedGroupElements.map(el => el.id),
          name: `${elementGroup.name} Copy`
        };
        
        newGroups.push(duplicatedGroup);
      } else if (!elementGroup) {
        // Duplicate individual element (not in a group)
        const duplicated = {
          ...element,
          id: generateElementId(),
          position: {
            x: element.position.x + offset.x,
            y: element.position.y + offset.y
          },
          zIndex: maxZIndex + index + 1,
          selected: false
        };
        
        duplicatedElements.push(duplicated);
        newSelectedIds.push(duplicated.id);
      }
    });

    return {
      elements: [...elements, ...duplicatedElements],
      groups: [...groups, ...newGroups],
      newSelectedIds
    };
  }, [generateElementId, generateGroupId]);

  // Duplicate elements with custom offset
  const duplicateWithOffset = useCallback((elements: ProposalElement[], selectedIds: string[], offset: { x: number; y: number }) => {
    if (selectedIds.length === 0) {
      return { elements, newSelectedIds: [] };
    }

    const maxZIndex = Math.max(...elements.map(e => e.zIndex), 0);
    const duplicatedElements: ProposalElement[] = [];
    const newSelectedIds: string[] = [];

    selectedIds.forEach((elementId, index) => {
      const element = elements.find(e => e.id === elementId);
      if (!element) return;

      const duplicated = {
        ...element,
        id: generateElementId(),
        position: {
          x: element.position.x + offset.x,
          y: element.position.y + offset.y
        },
        zIndex: maxZIndex + index + 1,
        selected: false
      };
      
      duplicatedElements.push(duplicated);
      newSelectedIds.push(duplicated.id);
    });

    return {
      elements: [...elements, ...duplicatedElements],
      newSelectedIds
    };
  }, [generateElementId]);

  // Duplicate elements in a grid pattern
  const duplicateInGrid = useCallback((elements: ProposalElement[], selectedIds: string[], rows: number, cols: number, spacing: { x: number; y: number }) => {
    if (selectedIds.length === 0 || rows <= 0 || cols <= 0) {
      return { elements, newSelectedIds: [] };
    }

    const maxZIndex = Math.max(...elements.map(e => e.zIndex), 0);
    const duplicatedElements: ProposalElement[] = [];
    const newSelectedIds: string[] = [];
    let zIndexCounter = 0;

    // Get bounding box of selected elements
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    if (selectedElements.length === 0) {
      return { elements, newSelectedIds: [] };
    }

    const minX = Math.min(...selectedElements.map(e => e.position.x));
    const minY = Math.min(...selectedElements.map(e => e.position.y));
    const maxX = Math.max(...selectedElements.map(e => e.position.x + e.size.width));
    const maxY = Math.max(...selectedElements.map(e => e.position.y + e.size.height));
    
    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;

    // Create grid duplicates
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Skip the original position (0,0)
        if (row === 0 && col === 0) continue;

        const offsetX = col * (groupWidth + spacing.x);
        const offsetY = row * (groupHeight + spacing.y);

        selectedIds.forEach((elementId) => {
          const element = elements.find(e => e.id === elementId);
          if (!element) return;

          const duplicated = {
            ...element,
            id: generateElementId(),
            position: {
              x: element.position.x + offsetX,
              y: element.position.y + offsetY
            },
            zIndex: maxZIndex + zIndexCounter + 1,
            selected: false
          };
          
          duplicatedElements.push(duplicated);
          newSelectedIds.push(duplicated.id);
          zIndexCounter++;
        });
      }
    }

    return {
      elements: [...elements, ...duplicatedElements],
      newSelectedIds
    };
  }, [generateElementId]);

  return {
    duplicateElements,
    duplicateElement,
    duplicateWithOffset,
    duplicateInGrid
  };
};

export default useDuplication;