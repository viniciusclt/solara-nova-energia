import { useCallback } from 'react';
import { ProposalElement } from '@/types/proposal';

interface ElementGroup {
  id: string;
  elementIds: string[];
  name?: string;
  locked?: boolean;
  visible?: boolean;
}

interface UseGroupingReturn {
  groupElements: (elements: ProposalElement[], selectedIds: string[], groups: ElementGroup[]) => {
    elements: ProposalElement[];
    groups: ElementGroup[];
  };
  ungroupElements: (elements: ProposalElement[], groupId: string, groups: ElementGroup[]) => {
    elements: ProposalElement[];
    groups: ElementGroup[];
  };
  selectGroup: (groupId: string, groups: ElementGroup[]) => string[];
  isElementInGroup: (elementId: string, groups: ElementGroup[]) => ElementGroup | null;
  getGroupByElement: (elementId: string, groups: ElementGroup[]) => ElementGroup | null;
  duplicateGroup: (groupId: string, elements: ProposalElement[], groups: ElementGroup[]) => {
    elements: ProposalElement[];
    groups: ElementGroup[];
  };
  lockGroup: (groupId: string, groups: ElementGroup[]) => ElementGroup[];
  unlockGroup: (groupId: string, groups: ElementGroup[]) => ElementGroup[];
  hideGroup: (groupId: string, elements: ProposalElement[], groups: ElementGroup[]) => ProposalElement[];
  showGroup: (groupId: string, elements: ProposalElement[], groups: ElementGroup[]) => ProposalElement[];
}

const useGrouping = (): UseGroupingReturn => {
  // Generate unique ID for groups
  const generateGroupId = useCallback(() => {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Generate unique ID for elements
  const generateElementId = useCallback(() => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Group selected elements
  const groupElements = useCallback((elements: ProposalElement[], selectedIds: string[], groups: ElementGroup[]) => {
    if (selectedIds.length < 2) {
      return { elements, groups };
    }

    // Check if any selected elements are already in groups
    const elementsInGroups = selectedIds.filter(id => 
      groups.some(group => group.elementIds.includes(id))
    );

    if (elementsInGroups.length > 0) {
      console.warn('Some elements are already in groups. Ungroup them first.');
      return { elements, groups };
    }

    // Create new group
    const newGroup: ElementGroup = {
      id: generateGroupId(),
      elementIds: [...selectedIds],
      name: `Group ${groups.length + 1}`,
      locked: false,
      visible: true
    };

    // Update elements to reflect group membership (optional: add group reference)
    const updatedElements = elements.map(element => {
      if (selectedIds.includes(element.id)) {
        return {
          ...element,
          // You could add a groupId property to elements if needed
          // groupId: newGroup.id
        };
      }
      return element;
    });

    return {
      elements: updatedElements,
      groups: [...groups, newGroup]
    };
  }, [generateGroupId]);

  // Ungroup elements
  const ungroupElements = useCallback((elements: ProposalElement[], groupId: string, groups: ElementGroup[]) => {
    const groupToRemove = groups.find(group => group.id === groupId);
    if (!groupToRemove) {
      return { elements, groups };
    }

    // Update elements to remove group reference
    const updatedElements = elements.map(element => {
      if (groupToRemove.elementIds.includes(element.id)) {
        return {
          ...element,
          // Remove groupId if you added it
          // groupId: undefined
        };
      }
      return element;
    });

    // Remove group from groups array
    const updatedGroups = groups.filter(group => group.id !== groupId);

    return {
      elements: updatedElements,
      groups: updatedGroups
    };
  }, []);

  // Select all elements in a group
  const selectGroup = useCallback((groupId: string, groups: ElementGroup[]) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.elementIds : [];
  }, []);

  // Check if element is in any group
  const isElementInGroup = useCallback((elementId: string, groups: ElementGroup[]) => {
    return groups.find(group => group.elementIds.includes(elementId)) || null;
  }, []);

  // Get group by element ID
  const getGroupByElement = useCallback((elementId: string, groups: ElementGroup[]) => {
    return groups.find(group => group.elementIds.includes(elementId)) || null;
  }, []);

  // Duplicate a group
  const duplicateGroup = useCallback((groupId: string, elements: ProposalElement[], groups: ElementGroup[]) => {
    const groupToDuplicate = groups.find(group => group.id === groupId);
    if (!groupToDuplicate) {
      return { elements, groups };
    }

    // Get elements in the group
    const groupElements = elements.filter(element => 
      groupToDuplicate.elementIds.includes(element.id)
    );

    // Calculate offset for duplicated elements
    const offset = { x: 20, y: 20 };

    // Create duplicated elements
    const duplicatedElements = groupElements.map(element => ({
      ...element,
      id: generateElementId(),
      position: {
        x: element.position.x + offset.x,
        y: element.position.y + offset.y
      },
      zIndex: Math.max(...elements.map(e => e.zIndex), 0) + 1
    }));

    // Create duplicated group
    const duplicatedGroup: ElementGroup = {
      ...groupToDuplicate,
      id: generateGroupId(),
      elementIds: duplicatedElements.map(el => el.id),
      name: `${groupToDuplicate.name} Copy`
    };

    return {
      elements: [...elements, ...duplicatedElements],
      groups: [...groups, duplicatedGroup]
    };
  }, [generateElementId, generateGroupId]);

  // Lock a group
  const lockGroup = useCallback((groupId: string, groups: ElementGroup[]) => {
    return groups.map(group => {
      if (group.id === groupId) {
        return { ...group, locked: true };
      }
      return group;
    });
  }, []);

  // Unlock a group
  const unlockGroup = useCallback((groupId: string, groups: ElementGroup[]) => {
    return groups.map(group => {
      if (group.id === groupId) {
        return { ...group, locked: false };
      }
      return group;
    });
  }, []);

  // Hide a group
  const hideGroup = useCallback((groupId: string, elements: ProposalElement[], groups: ElementGroup[]) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return elements;

    return elements.map(element => {
      if (group.elementIds.includes(element.id)) {
        return { ...element, visible: false };
      }
      return element;
    });
  }, []);

  // Show a group
  const showGroup = useCallback((groupId: string, elements: ProposalElement[], groups: ElementGroup[]) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return elements;

    return elements.map(element => {
      if (group.elementIds.includes(element.id)) {
        return { ...element, visible: true };
      }
      return element;
    });
  }, []);

  return {
    groupElements,
    ungroupElements,
    selectGroup,
    isElementInGroup,
    getGroupByElement,
    duplicateGroup,
    lockGroup,
    unlockGroup,
    hideGroup,
    showGroup
  };
};

export default useGrouping;
export type { ElementGroup };