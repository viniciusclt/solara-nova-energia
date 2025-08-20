// ============================================================================
// ProcessNode - Nó de processo do fluxograma
// ============================================================================

import React from 'react';
import { NodeProps } from 'reactflow';
import { FlowchartNode } from '@/types/flowchart';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';
import { EditableLabel } from './EditableLabel';
import { Settings } from 'lucide-react';

export const ProcessNode: React.FC<NodeProps<FlowchartNode['data']>> = ({ id, data, selected, xPos, yPos }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const nodeStyle = {
    background: data.style?.backgroundColor || 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    color: data.style?.color || '#1E293B',
    border: `2px solid ${selected ? '#3B82F6' : data.style?.borderColor || '#E2E8F0'}`,
    borderRadius: '12px',
    padding: '16px 20px',
    minWidth: '140px',
    textAlign: 'center' as const,
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: selected 
      ? '0 8px 25px rgba(59, 130, 246, 0.25), 0 4px 12px rgba(59, 130, 246, 0.15)' 
      : '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: selected ? 'translateY(-2px)' : 'translateY(0)',
  };

  return (
    <EnhancedNodeWrapper
      nodeId={id}
      isSelected={selected}
      isHovered={isHovered}
      position={{ x: xPos, y: yPos }}
      onAddNode={data?.onAddNode}
      onAddEdge={data?.onAddEdge}
    >
      <div 
        style={nodeStyle} 
        className="process-node"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <EditableLabel
              value={data.label || 'Processo'}
              onSave={(newLabel) => {
                if (data?.onUpdateNode) {
                  data.onUpdateNode(id, { ...data, label: newLabel });
                }
              }}
              isSelected={selected}
              placeholder="Processo"
              maxLength={30}
            />
            {data.description && (
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                {data.description}
              </div>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        {data.status && (
          <div className="mt-3 flex justify-center">
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
              data.status === 'completed' ? 'bg-green-100 text-green-700' :
              data.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
              data.status === 'pending' ? 'bg-gray-100 text-gray-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {data.status}
            </span>
          </div>
        )}
      </div>
    </EnhancedNodeWrapper>
  );
};

export default ProcessNode;