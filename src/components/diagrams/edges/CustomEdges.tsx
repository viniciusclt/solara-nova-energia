// ============================================================================
// Custom Edges - Arestas customizadas para o editor unificado
// ============================================================================
// Componentes de arestas para diferentes tipos de diagramas e conexões
// ============================================================================

import React, { memo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType
} from 'reactflow';
import { X, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { UnifiedEdgeData } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface CustomEdgeProps extends EdgeProps {
  data?: UnifiedEdgeData;
}

interface EdgeLabelProps {
  label?: string;
  labelStyle?: React.CSSProperties;
  labelBgStyle?: React.CSSProperties;
  labelShowBg?: boolean;
  onLabelChange?: (newLabel: string) => void;
  editable?: boolean;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Componente para renderizar rótulos de arestas editáveis
 */
const EdgeLabel: React.FC<EdgeLabelProps & { x: number; y: number }> = memo(({ 
  x, 
  y, 
  label, 
  labelStyle, 
  labelBgStyle, 
  labelShowBg = true, 
  onLabelChange,
  editable = false
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editLabel, setEditLabel] = React.useState(label || '');
  
  const handleDoubleClick = React.useCallback(() => {
    if (editable) {
      setIsEditing(true);
    }
  }, [editable]);
  
  const handleSubmit = React.useCallback(() => {
    setIsEditing(false);
    if (onLabelChange && editLabel !== label) {
      onLabelChange(editLabel);
    }
  }, [editLabel, label, onLabelChange]);
  
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditLabel(label || '');
      setIsEditing(false);
    }
  }, [handleSubmit, label]);
  
  if (!label && !isEditing) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
        pointerEvents: 'all',
        fontSize: 12,
        ...labelStyle
      }}
      onDoubleClick={handleDoubleClick}
    >
      {labelShowBg && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            padding: '2px 6px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            zIndex: -1,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: '20px',
            minHeight: '16px',
            ...labelBgStyle
          }}
        />
      )}
      {isEditing ? (
        <input
          type="text"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            textAlign: 'center',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            color: 'inherit',
            width: `${Math.max(editLabel.length * 8, 40)}px`
          }}
        />
      ) : (
        <span style={{ padding: '2px 6px', cursor: editable ? 'pointer' : 'default' }}>
          {label}
        </span>
      )}
    </div>
  );
});

/**
 * Botão para remover aresta
 */
const EdgeRemoveButton: React.FC<{ x: number; y: number; onRemove: () => void }> = memo(({ x, y, onRemove }) => (
  <div
    style={{
      position: 'absolute',
      transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
      pointerEvents: 'all'
    }}
  >
    <button
      onClick={onRemove}
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#ef4444',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
      }}
      title="Remover conexão"
    >
      <X size={12} />
    </button>
  </div>
));

// ============================================================================
// ARESTAS BPMN
// ============================================================================

/**
 * Aresta de Fluxo de Sequência (BPMN)
 */
export const BPMNSequenceFlowEdge: React.FC<CustomEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#374151',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: data?.conditional ? '5,5' : 'none'
        }}
        markerEnd={MarkerType.ArrowClosed}
      />
      <EdgeLabelRenderer>
        {data?.label && (
          <EdgeLabel
            x={labelX}
            y={labelY}
            label={data.label}
            onLabelChange={data.onLabelChange}
            editable={data.editable}
            labelBgStyle={{ backgroundColor: '#f3f4f6' }}
          />
        )}
        {selected && data?.onRemove && (
          <EdgeRemoveButton
            x={labelX + 30}
            y={labelY - 20}
            onRemove={data.onRemove}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});

/**
 * Aresta de Fluxo de Mensagem (BPMN)
 */
export const BPMNMessageFlowEdge: React.FC<CustomEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#6b7280',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '10,5'
        }}
        markerEnd={MarkerType.ArrowClosed}
        markerStart={MarkerType.Circle}
      />
      <EdgeLabelRenderer>
        {data?.label && (
          <EdgeLabel
            x={labelX}
            y={labelY}
            label={data.label}
            onLabelChange={data.onLabelChange}
            editable={data.editable}
            labelBgStyle={{ backgroundColor: '#e5e7eb' }}
          />
        )}
        {selected && data?.onRemove && (
          <EdgeRemoveButton
            x={labelX + 30}
            y={labelY - 20}
            onRemove={data.onRemove}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});

/**
 * Aresta de Associação (BPMN)
 */
export const BPMNAssociationEdge: React.FC<CustomEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY
  });
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#9ca3af',
          strokeWidth: selected ? 3 : 1,
          strokeDasharray: '3,3'
        }}
      />
      <EdgeLabelRenderer>
        {data?.label && (
          <EdgeLabel
            x={labelX}
            y={labelY}
            label={data.label}
            onLabelChange={data.onLabelChange}
            editable={data.editable}
            labelShowBg={false}
          />
        )}
        {selected && data?.onRemove && (
          <EdgeRemoveButton
            x={labelX + 30}
            y={labelY - 20}
            onRemove={data.onRemove}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});

// ============================================================================
// ARESTAS MINDMAP
// ============================================================================

/**
 * Aresta Orgânica para MindMap
 */
export const MindMapOrganicEdge: React.FC<CustomEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3
  });
  
  const getColor = () => {
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    const level = data?.level || 1;
    return colors[(level - 1) % colors.length];
  };
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : getColor(),
          strokeWidth: selected ? 4 : 3,
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
        }}
      />
      <EdgeLabelRenderer>
        {data?.label && (
          <EdgeLabel
            x={labelX}
            y={labelY}
            label={data.label}
            onLabelChange={data.onLabelChange}
            editable={data.editable}
            labelStyle={{ color: getColor(), fontWeight: '500' }}
            labelBgStyle={{ backgroundColor: '#ffffff', borderColor: getColor() }}
          />
        )}
        {selected && data?.onRemove && (
          <EdgeRemoveButton
            x={labelX + 30}
            y={labelY - 20}
            onRemove={data.onRemove}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});

/**
 * Aresta Reta para MindMap
 */
export const MindMapStraightEdge: React.FC<CustomEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY
  });
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#6b7280',
          strokeWidth: selected ? 3 : 2
        }}
      />
      <EdgeLabelRenderer>
        {data?.label && (
          <EdgeLabel
            x={labelX}
            y={labelY}
            label={data.label}
            onLabelChange={data.onLabelChange}
            editable={data.editable}
          />
        )}
        {selected && data?.onRemove && (
          <EdgeRemoveButton
            x={labelX + 30}
            y={labelY - 20}
            onRemove={data.onRemove}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});

// ============================================================================
// ARESTAS ORGANOGRAMA
// ============================================================================

/**
 * Aresta Hierárquica para Organograma
 */
export const OrgHierarchicalEdge: React.FC<CustomEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8
  });
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#374151',
          strokeWidth: selected ? 3 : 2
        }}
        markerEnd={MarkerType.ArrowClosed}
      />
      <EdgeLabelRenderer>
        {data?.label && (
          <EdgeLabel
            x={labelX}
            y={labelY}
            label={data.label}
            onLabelChange={data.onLabelChange}
            editable={data.editable}
          />
        )}
        {selected && data?.onRemove && (
          <EdgeRemoveButton
            x={labelX + 30}
            y={labelY - 20}
            onRemove={data.onRemove}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});

/**
 * Aresta de Colaboração (linha pontilhada)
 */
export const OrgCollaborationEdge: React.FC<CustomEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#6b7280',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '5,5'
        }}
        markerEnd={MarkerType.ArrowClosed}
      />
      <EdgeLabelRenderer>
        {data?.label && (
          <EdgeLabel
            x={labelX}
            y={labelY}
            label={data.label}
            onLabelChange={data.onLabelChange}
            editable={data.editable}
            labelBgStyle={{ backgroundColor: '#f9fafb' }}
          />
        )}
        {selected && data?.onRemove && (
          <EdgeRemoveButton
            x={labelX + 30}
            y={labelY - 20}
            onRemove={data.onRemove}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});

// ============================================================================
// ARESTAS ESPECIAIS
// ============================================================================

/**
 * Aresta com Status/Validação
 */
export const StatusEdge: React.FC<CustomEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  
  const getStatusColor = () => {
    switch (data?.status) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };
  
  const getStatusIcon = () => {
    switch (data?.status) {
      case 'success': return <CheckCircle size={14} />;
      case 'error': return <XCircle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'info': return <Info size={14} />;
      default: return null;
    }
  };
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : getStatusColor(),
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: data?.status === 'warning' ? '3,3' : 'none'
        }}
        markerEnd={MarkerType.ArrowClosed}
      />
      <EdgeLabelRenderer>
        {(data?.label || data?.status) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#ffffff',
              border: `1px solid ${getStatusColor()}`,
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 12,
              color: getStatusColor(),
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {getStatusIcon()}
            <span>{data?.label || data?.status}</span>
          </div>
        )}
        {selected && data?.onRemove && (
          <EdgeRemoveButton
            x={labelX + 40}
            y={labelY - 20}
            onRemove={data.onRemove}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});

/**
 * Aresta Animada
 */
export const AnimatedEdge: React.FC<CustomEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#10b981',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '5,5',
          animation: 'dash 1s linear infinite'
        }}
        markerEnd={MarkerType.ArrowClosed}
      />
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
      <EdgeLabelRenderer>
        {data?.label && (
          <EdgeLabel
            x={labelX}
            y={labelY}
            label={data.label}
            onLabelChange={data.onLabelChange}
            editable={data.editable}
            labelBgStyle={{ backgroundColor: '#ecfdf5', borderColor: '#10b981' }}
          />
        )}
        {selected && data?.onRemove && (
          <EdgeRemoveButton
            x={labelX + 30}
            y={labelY - 20}
            onRemove={data.onRemove}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});

// ============================================================================
// MAPA DE TIPOS DE ARESTAS
// ============================================================================

export const customEdgeTypes = {
  // BPMN
  'bpmn-sequence': BPMNSequenceFlowEdge,
  'bpmn-message': BPMNMessageFlowEdge,
  'bpmn-association': BPMNAssociationEdge,
  
  // MindMap
  'mindmap-organic': MindMapOrganicEdge,
  'mindmap-straight': MindMapStraightEdge,
  
  // Organogram
  'org-hierarchical': OrgHierarchicalEdge,
  'org-collaboration': OrgCollaborationEdge,
  
  // Especiais
  'status': StatusEdge,
  'animated': AnimatedEdge
};

export default customEdgeTypes;