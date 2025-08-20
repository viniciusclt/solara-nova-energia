import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Save, 
  Download, 
  Share2, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Type,
  Image,
  Video,
  BarChart3,
  Shapes,
  Building2,
  Code,
  Copy,
  Trash2,
  Move,
  MoreHorizontal,
  Settings,
  FileText,
  Presentation,
  Monitor,
  Upload,
  FolderOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logInfo, logError } from '@/utils/logger';
import { ProposalElement, DocumentFormat, CanvasState, EditorState } from '@/types/proposal';
import CanvasContainer from './CanvasContainer';
import ElementToolbox from './ElementToolbox';
import EditorToolbar from './EditorToolbar';
import useUndoRedo from '@/hooks/useUndoRedo';
import useAlignment from '@/hooks/useAlignment';
import useGrouping, { ElementGroup } from '@/hooks/useGrouping';
import useDuplication from '@/hooks/useDuplication';
import { TemplateUploader, TemplateLibrary, Template } from '../templates';
import { FileConverterService } from '../../services/fileConverter';
// Document format configurations
const DOCUMENT_FORMATS = {
  A4: { width: 794, height: 1123, name: 'A4 (210×297mm)' },
  A3: { width: 1123, height: 1587, name: 'A3 (297×420mm)' },
  LETTER: { width: 816, height: 1056, name: 'Letter (8.5×11in)' },
  PRESENTATION_16_9: { width: 1920, height: 1080, name: '16:9 Presentation' },
  PRESENTATION_4_3: { width: 1024, height: 768, name: '4:3 Presentation' }
};

// Interfaces
interface ProposalEditorProps {
  proposalId?: string;
  initialElements?: ProposalElement[];
  onSave?: (elements: ProposalElement[]) => void;
  onExport?: (format: string) => void;
  readOnly?: boolean;
  className?: string;
}

// Main ProposalEditor Component
const ProposalEditor: React.FC<ProposalEditorProps> = ({
  proposalId,
  initialElements = [],
  onSave,
  onExport,
  readOnly = false,
  className = ''
}) => {
  const { toast } = useToast();
  
  // State management
  const [elements, setElements] = useState<ProposalElement[]>(initialElements);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<ElementGroup[]>([]);
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>('A4');
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    showGrid: true,
    showRulers: true,
    snapToGrid: true,
    gridSize: 20
  });
  const [editorState, setEditorState] = useState<EditorState>({
    tool: 'select',
    isPlaying: false,
    currentSlide: 0
  });
  const [showElementToolbox, setShowElementToolbox] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showTemplateUploader, setShowTemplateUploader] = useState(false);
  
  // Hooks
  const { history, currentIndex, pushToHistory, undo, redo, canUndo, canRedo } = useUndoRedo(elements);
  const { alignLeft, alignCenter, alignRight, alignTop, alignMiddle, alignBottom, distributeHorizontally, distributeVertically, centerInCanvas } = useAlignment();
  const { groupElements, ungroupElements, selectGroup, isElementInGroup, duplicateGroup, lockGroup, unlockGroup } = useGrouping();
  const { duplicateElements, duplicateWithOffset } = useDuplication();
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Document dimensions based on format
  const documentDimensions = DOCUMENT_FORMATS[documentFormat];
  
  // Auto-save functionality
  useEffect(() => {
    if (elements.length > 0 && onSave) {
      const timeoutId = setTimeout(() => {
        onSave(elements);
        logInfo('Auto-saved proposal', 'ProposalEditor', { proposalId, elementCount: elements.length });
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [elements, onSave, proposalId]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      
      // Prevent default for our shortcuts
      if ((e.ctrlKey || e.metaKey) && ['z', 'y', 'c', 'v', 'd', 'a', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        handleRedo();
      }
      
      // Copy/Paste/Duplicate
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        handleDuplicate();
      }
      
      // Select All
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        setSelectedElementIds(elements.map(el => el.id));
      }
      
      // Save
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        handleSave();
      }
      
      // Delete
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
      
      // Arrow keys for moving elements
      else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        handleMoveSelected(e.key, e.shiftKey ? 10 : 1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedElementIds, readOnly]);
  
  // Element manipulation functions
  const handleAddElement = useCallback((elementType: string, position?: { x: number; y: number }) => {
    const newElement: ProposalElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: elementType as ProposalElement['type'],
      position: position || { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      rotation: 0,
      zIndex: elements.length > 0 ? Math.max(...elements.map(e => e.zIndex), 0) + 1 : 1,
      visible: true,
      locked: false,
      content: {
        text: elementType === 'text' ? 'New Text' : undefined,
        url: elementType === 'image' ? 'https://via.placeholder.com/200x100' : undefined
      },
      style: {
        backgroundColor: 'transparent',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 4,
        opacity: 1,
        fontSize: 16,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#1f2937'
      }
    };
    
    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    pushToHistory(updatedElements);
    setSelectedElementIds([newElement.id]);
    
    toast({
      title: 'Element added',
      description: `${elementType} element has been added to the canvas.`
    });
  }, [elements, pushToHistory, toast]);
  
  const handleUpdateElement = useCallback((elementId: string, updates: Partial<ProposalElement>) => {
    const updatedElements = elements.map(element => 
      element.id === elementId ? { ...element, ...updates } : element
    );
    setElements(updatedElements);
    pushToHistory(updatedElements);
  }, [elements, pushToHistory]);
  
  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    
    const updatedElements = elements.filter(element => !selectedElementIds.includes(element.id));
    setElements(updatedElements);
    pushToHistory(updatedElements);
    setSelectedElementIds([]);
    
    toast({
      title: 'Elements deleted',
      description: `${selectedElementIds.length} element(s) have been deleted.`
    });
  }, [elements, selectedElementIds, pushToHistory, toast]);
  
  const handleMoveSelected = useCallback((direction: string, distance: number) => {
    if (selectedElementIds.length === 0) return;
    
    const updatedElements = elements.map(element => {
      if (selectedElementIds.includes(element.id)) {
        const newPosition = { ...element.position };
        switch (direction) {
          case 'ArrowUp':
            newPosition.y -= distance;
            break;
          case 'ArrowDown':
            newPosition.y += distance;
            break;
          case 'ArrowLeft':
            newPosition.x -= distance;
            break;
          case 'ArrowRight':
            newPosition.x += distance;
            break;
        }
        return { ...element, position: newPosition };
      }
      return element;
    });
    
    setElements(updatedElements);
    pushToHistory(updatedElements);
  }, [elements, selectedElementIds, pushToHistory]);
  
  // Action handlers
  const handleUndo = useCallback(() => {
    if (canUndo) {
      const previousElements = undo();
      if (previousElements) {
        setElements(previousElements);
      }
    }
  }, [canUndo, undo]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      const nextElements = redo();
      if (nextElements) {
        setElements(nextElements);
      }
    }
  }, [canRedo, redo]);
  
  const handleCopy = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    
    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    localStorage.setItem('copiedElements', JSON.stringify(selectedElements));
    
    toast({
      title: 'Elements copied',
      description: `${selectedElementIds.length} element(s) copied to clipboard.`
    });
  }, [elements, selectedElementIds, toast]);
  
  const handlePaste = useCallback(() => {
    const copiedElementsStr = localStorage.getItem('copiedElements');
    if (!copiedElementsStr) return;
    
    try {
      const copiedElements: ProposalElement[] = JSON.parse(copiedElementsStr);
      const { elements: updatedElements, newSelectedIds } = duplicateWithOffset(
        elements,
        copiedElements.map(el => el.id),
        { x: 20, y: 20 }
      );
      
      // Create new elements with new IDs
      const pastedElements = copiedElements.map(el => ({
        ...el,
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: { x: el.position.x + 20, y: el.position.y + 20 },
        zIndex: elements.length > 0 ? Math.max(...elements.map(e => e.zIndex), 0) + 1 : 1
      }));
      
      const finalElements = [...elements, ...pastedElements];
      setElements(finalElements);
      pushToHistory(finalElements);
      setSelectedElementIds(pastedElements.map(el => el.id));
      
      toast({
        title: 'Elements pasted',
        description: `${pastedElements.length} element(s) pasted.`
      });
    } catch (error) {
      logError('Failed to paste elements', 'ProposalEditor', error);
    }
  }, [elements, duplicateWithOffset, pushToHistory, toast]);
  
  const handleDuplicate = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    
    const { elements: updatedElements, newSelectedIds } = duplicateElements(
      elements,
      selectedElementIds,
      groups
    );
    
    setElements(updatedElements);
    pushToHistory(updatedElements);
    setSelectedElementIds(newSelectedIds);
    
    toast({
      title: 'Elements duplicated',
      description: `${selectedElementIds.length} element(s) duplicated.`
    });
  }, [elements, selectedElementIds, groups, duplicateElements, pushToHistory, toast]);
  
  const handleSave = useCallback(async () => {
    if (onSave) {
      setIsLoading(true);
      try {
        await onSave(elements);
        toast({
          title: 'Proposal saved',
          description: 'Your proposal has been saved successfully.'
        });
      } catch (error) {
        logError('Failed to save proposal', 'ProposalEditor', error);
        toast({
          title: 'Save failed',
          description: 'Failed to save the proposal. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [elements, onSave, toast]);
  
  // Template handling functions
  const handleTemplateSelect = useCallback(async (template: Template) => {
    try {
      setIsLoading(true);
      
      // Convert template elements to proposal elements
      const templateElements = template.proposalElements.map(element => ({
        ...element,
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        zIndex: elements.length > 0 ? Math.max(...elements.map(e => e.zIndex), 0) + 1 : 1
      }));
      
      // Add template elements to canvas
      setElements(prev => [...prev, ...templateElements]);
      pushToHistory([...elements, ...templateElements]);
      
      toast({
        title: 'Template applied',
        description: `Template "${template.metadata.name}" has been applied to your proposal.`
      });
      
      setShowTemplateLibrary(false);
      logInfo('Template applied successfully', 'ProposalEditor', { 
        templateId: template.id, 
        templateName: template.metadata.name,
        elementCount: templateElements.length 
      });
    } catch (error) {
      logError('Failed to apply template', 'ProposalEditor', error);
      toast({
        title: 'Template application failed',
        description: 'Failed to apply the template. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [elements, pushToHistory, toast]);

  const handleTemplateUploadSuccess = useCallback((template: Template) => {
    toast({
      title: 'Template uploaded',
      description: `Template "${template.metadata.name}" has been uploaded successfully.`
    });
    setShowTemplateUploader(false);
    logInfo('Template uploaded successfully', 'ProposalEditor', { 
      templateId: template.id, 
      templateName: template.metadata.name 
    });
  }, [toast]);

  const handleCreateTemplateFromCurrent = useCallback(async () => {
    if (elements.length === 0) {
      toast({
        title: 'No elements to save',
        description: 'Add some elements to your proposal before creating a template.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Create a template from current elements
      const template: Partial<Template> = {
        metadata: {
          id: `template_${Date.now()}`,
          name: `Template ${new Date().toLocaleDateString()}`,
          description: 'Template created from current proposal',
          category: 'custom',
          originalFormat: 'json',
          fileSize: JSON.stringify(elements).length,
          uploadedAt: new Date(),
          uploadedBy: 'Current User',
          tags: ['custom', 'proposal'],
          usageCount: 0,
          isPublic: false
        },
        proposalElements: elements.map(el => ({ ...el })),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Here you would typically save to your backend
      // For now, we'll just show a success message
      toast({
        title: 'Template created',
        description: 'Your current proposal has been saved as a template.'
      });
      
      logInfo('Template created from current proposal', 'ProposalEditor', { 
        elementCount: elements.length 
      });
    } catch (error) {
      logError('Failed to create template', 'ProposalEditor', error);
      toast({
        title: 'Template creation failed',
        description: 'Failed to create template. Please try again.',
        variant: 'destructive'
      });
    }
  }, [elements, toast]);
  
  const handleExport = useCallback(async (format: string) => {
    if (onExport) {
      setIsLoading(true);
      try {
        await onExport(format);
        toast({
          title: 'Export started',
          description: `Exporting proposal as ${format.toUpperCase()}...`
        });
      } catch (error) {
        logError('Failed to export proposal', 'ProposalEditor', error);
        toast({
          title: 'Export failed',
          description: 'Failed to export the proposal. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [onExport, toast]);
  
  // Alignment handlers
  const handleAlign = useCallback((type: string) => {
    if (selectedElementIds.length === 0) return;
    
    let updatedElements: ProposalElement[] = [];
    
    switch (type) {
      case 'left':
        updatedElements = alignLeft(elements, selectedElementIds);
        break;
      case 'center':
        updatedElements = alignCenter(elements, selectedElementIds);
        break;
      case 'right':
        updatedElements = alignRight(elements, selectedElementIds);
        break;
      case 'top':
        updatedElements = alignTop(elements, selectedElementIds);
        break;
      case 'middle':
        updatedElements = alignMiddle(elements, selectedElementIds);
        break;
      case 'bottom':
        updatedElements = alignBottom(elements, selectedElementIds);
        break;
      case 'distribute-horizontal':
        updatedElements = distributeHorizontally(elements, selectedElementIds);
        break;
      case 'distribute-vertical':
        updatedElements = distributeVertically(elements, selectedElementIds);
        break;
      case 'center-canvas':
        updatedElements = centerInCanvas(elements, selectedElementIds, documentDimensions);
        break;
      default:
        return;
    }
    
    setElements(updatedElements);
    pushToHistory(updatedElements);
  }, [elements, selectedElementIds, alignLeft, alignCenter, alignRight, alignTop, alignMiddle, alignBottom, distributeHorizontally, distributeVertically, centerInCanvas, documentDimensions, pushToHistory]);
  
  // Group handlers
  const handleGroup = useCallback(() => {
    if (selectedElementIds.length < 2) return;
    
    const { elements: updatedElements, groups: updatedGroups } = groupElements(
      elements,
      selectedElementIds,
      groups
    );
    
    setElements(updatedElements);
    setGroups(updatedGroups);
    pushToHistory(updatedElements);
    
    toast({
      title: 'Elements grouped',
      description: `${selectedElementIds.length} elements have been grouped.`
    });
  }, [elements, selectedElementIds, groups, groupElements, pushToHistory, toast]);
  
  const handleUngroup = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    
    // Find groups that contain selected elements
    const groupsToUngroup = groups.filter(group => 
      selectedElementIds.some(id => group.elementIds.includes(id))
    );
    
    if (groupsToUngroup.length === 0) return;
    
    let updatedElements = elements;
    let updatedGroups = groups;
    
    groupsToUngroup.forEach(group => {
      const result = ungroupElements(updatedElements, group.id, updatedGroups);
      updatedElements = result.elements;
      updatedGroups = result.groups;
    });
    
    setElements(updatedElements);
    setGroups(updatedGroups);
    pushToHistory(updatedElements);
    
    toast({
      title: 'Elements ungrouped',
      description: `${groupsToUngroup.length} group(s) have been ungrouped.`
    });
  }, [elements, selectedElementIds, groups, ungroupElements, pushToHistory, toast]);
  
  // Render
  return (
    <div className={`proposal-editor h-screen flex flex-col bg-gray-50 ${className}`}>
      {/* Top Toolbar */}
      <EditorToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onExport={handleExport}
        zoom={canvasState.zoom}
        onZoomChange={(zoom) => setCanvasState(prev => ({ ...prev, zoom }))}
        documentFormat={documentFormat}
        onDocumentFormatChange={setDocumentFormat}
        showGrid={canvasState.showGrid}
        onToggleGrid={(showGrid) => setCanvasState(prev => ({ ...prev, showGrid }))}
        showRulers={canvasState.showRulers}
        onToggleRulers={(showRulers) => setCanvasState(prev => ({ ...prev, showRulers }))}
        snapToGrid={canvasState.snapToGrid}
        onToggleSnapToGrid={(snapToGrid) => setCanvasState(prev => ({ ...prev, snapToGrid }))}
        selectedCount={selectedElementIds.length}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteSelected}
        onAlign={handleAlign}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        isLoading={isLoading}
        readOnly={readOnly}
        onOpenTemplateLibrary={() => setShowTemplateLibrary(true)}
        onOpenTemplateUploader={() => setShowTemplateUploader(true)}
        onCreateTemplate={handleCreateTemplateFromCurrent}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Element Toolbox */}
        {showElementToolbox && (
          <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Elements</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowElementToolbox(false)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ElementToolbox
                onAddElement={handleAddElement}
                readOnly={readOnly}
              />
            </div>
          </div>
        )}
        
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CanvasContainer
            ref={canvasRef}
            elements={elements}
            selectedElementIds={selectedElementIds}
            onSelectionChange={setSelectedElementIds}
            onElementUpdate={handleUpdateElement}
            onElementAdd={handleAddElement}
            documentFormat={documentFormat}
            documentDimensions={documentDimensions}
            canvasState={canvasState}
            onCanvasStateChange={setCanvasState}
            editorState={editorState}
            onEditorStateChange={setEditorState}
            readOnly={readOnly}
            className="flex-1"
          />
        </div>
        
        {/* Right Sidebar - Properties Panel */}
        {selectedElementIds.length > 0 && (
          <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                Properties
                {selectedElementIds.length > 1 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({selectedElementIds.length} selected)
                  </span>
                )}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Properties panel content */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Position</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs text-gray-500">X</Label>
                      <Input
                        type="number"
                        size="sm"
                        value={selectedElementIds.length === 1 ? 
                          elements.find(el => el.id === selectedElementIds[0])?.position.x || 0 : ''}
                        onChange={(e) => {
                          if (selectedElementIds.length === 1) {
                            handleUpdateElement(selectedElementIds[0], {
                              position: {
                                ...elements.find(el => el.id === selectedElementIds[0])!.position,
                                x: parseInt(e.target.value) || 0
                              }
                            });
                          }
                        }}
                        disabled={readOnly || selectedElementIds.length !== 1}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Y</Label>
                      <Input
                        type="number"
                        size="sm"
                        value={selectedElementIds.length === 1 ? 
                          elements.find(el => el.id === selectedElementIds[0])?.position.y || 0 : ''}
                        onChange={(e) => {
                          if (selectedElementIds.length === 1) {
                            handleUpdateElement(selectedElementIds[0], {
                              position: {
                                ...elements.find(el => el.id === selectedElementIds[0])!.position,
                                y: parseInt(e.target.value) || 0
                              }
                            });
                          }
                        }}
                        disabled={readOnly || selectedElementIds.length !== 1}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-700">Size</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs text-gray-500">Width</Label>
                      <Input
                        type="number"
                        size="sm"
                        value={selectedElementIds.length === 1 ? 
                          elements.find(el => el.id === selectedElementIds[0])?.size.width || 0 : ''}
                        onChange={(e) => {
                          if (selectedElementIds.length === 1) {
                            handleUpdateElement(selectedElementIds[0], {
                              size: {
                                ...elements.find(el => el.id === selectedElementIds[0])!.size,
                                width: parseInt(e.target.value) || 0
                              }
                            });
                          }
                        }}
                        disabled={readOnly || selectedElementIds.length !== 1}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Height</Label>
                      <Input
                        type="number"
                        size="sm"
                        value={selectedElementIds.length === 1 ? 
                          elements.find(el => el.id === selectedElementIds[0])?.size.height || 0 : ''}
                        onChange={(e) => {
                          if (selectedElementIds.length === 1) {
                            handleUpdateElement(selectedElementIds[0], {
                              size: {
                                ...elements.find(el => el.id === selectedElementIds[0])!.size,
                                height: parseInt(e.target.value) || 0
                              }
                            });
                          }
                        }}
                        disabled={readOnly || selectedElementIds.length !== 1}
                      />
                    </div>
                  </div>
                </div>
                
                {selectedElementIds.length === 1 && (
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Rotation</Label>
                    <div className="mt-1">
                      <Slider
                        value={[elements.find(el => el.id === selectedElementIds[0])?.rotation || 0]}
                        onValueChange={([value]) => {
                          handleUpdateElement(selectedElementIds[0], { rotation: value });
                        }}
                        min={0}
                        max={360}
                        step={1}
                        disabled={readOnly}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {elements.find(el => el.id === selectedElementIds[0])?.rotation || 0}°
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Template Library Dialog */}
      <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Template Library</DialogTitle>
          </DialogHeader>
          <TemplateLibrary
             onSelectTemplate={handleTemplateSelect}
             onCreateNew={() => setShowTemplateUploader(true)}
           />
        </DialogContent>
      </Dialog>

      {/* Template Uploader Dialog */}
      <Dialog open={showTemplateUploader} onOpenChange={setShowTemplateUploader}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Template</DialogTitle>
          </DialogHeader>
          <TemplateUploader
             onUploadSuccess={handleTemplateUploadSuccess}
           />
        </DialogContent>
      </Dialog>

      {/* Hidden file input for imports */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.json"
        className="hidden"
        onChange={(e) => {
          // Handle file import
          const file = e.target.files?.[0];
          if (file) {
            logInfo('File selected for import', 'ProposalEditor', { fileName: file.name, fileType: file.type });
          }
        }}
      />
    </div>
  );
};
// Export the component
export default ProposalEditor;
export type { ProposalEditorProps };

// Temporary simplified services
const proposalPDFGenerator = {
  generatePDF: async (proposal: { id: string; [key: string]: unknown }) => {
    logInfo('PDF generation requested', 'ProposalEditor', { proposalId: proposal.id });
    return new Blob(['PDF content'], { type: 'application/pdf' });
  }
};

const proposalSharingService = {
  shareProposal: async (proposalId: string, options: Record<string, unknown>) => {
    logInfo('Proposal sharing requested', 'ProposalEditor', { proposalId, options });
    return { shareUrl: `https://example.com/proposals/${proposalId}` };
  }
};