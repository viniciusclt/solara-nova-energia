// ============================================================================
// AutoRoutedEdge - Edge customizado para auto-routing
// ============================================================================

import React, { memo } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType
} from 'reactflow';
import { cn } from '@/lib/utils';
import { AutoRoutedEdgeData } from './types';

// ============================================================================
// TIPOS
// ============================================================================

interface AutoRoutedEdgeProps extends EdgeProps {
  data?: AutoRoutedEdgeData;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AutoRoutedEdge: React.FC<AutoRoutedEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
  markerEnd,
  markerStart
}) => {
  // ============================================================================
  // CONFIGURAÇÃO DO CAMINHO
  // ============================================================================

  // Usar pathString customizado se disponível, senão usar smooth step padrão
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (data?.pathString) {
    // Usar o caminho gerado pelo auto-routing
    edgePath = data.pathString;
    
    // Calcular posição do label no meio do caminho
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  } else {
    // Fallback para smooth step padrão
    const [path, lX, lY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: data?.cornerRadius || 8,
      offset: data?.offset || 20
    });
    
    edgePath = path;
    labelX = lX;
    labelY = lY;
  }

  // ============================================================================
  // ESTILOS
  // ============================================================================

  const edgeStyle = {
    strokeWidth: data?.strokeWidth || 2,
    stroke: selected 
      ? data?.selectedColor || '#3b82f6'
      : data?.color || '#64748b',
    strokeDasharray: data?.dashed ? '5,5' : undefined,
    opacity: data?.opacity || 1,
    filter: selected ? 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' : undefined,
    transition: 'all 0.2s ease-in-out',
    ...style
  };

  const markerEndConfig = markerEnd || {
    type: MarkerType.ArrowClosed,
    color: edgeStyle.stroke as string,
    width: 20,
    height: 20
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={markerEndConfig}
        markerStart={markerStart}
        className={cn(
          'react-flow__edge-path',
          selected && 'selected',
          data?.animated && 'animated',
          data?.routingInfo?.autoRouted && 'auto-routed'
        )}
      />
      
      {/* Label customizado */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all'
            }}
            className={cn(
              'nodrag nopan',
              'bg-white border border-gray-200 rounded px-2 py-1 text-xs font-medium shadow-sm',
              selected && 'border-blue-500 bg-blue-50 text-blue-700'
            )}
          >
            {data.label}
            
            {/* Indicador de auto-routing */}
            {data?.routingInfo?.autoRouted && (
              <div className="inline-flex items-center ml-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Auto-roteado" />
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Debug info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && data?.routingInfo && selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 30}px)`,
              pointerEvents: 'none'
            }}
            className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-75"
          >
            <div>Comprimento: {Math.round(data.routingInfo.totalLength)}px</div>
            <div>Segmentos: {data.routingInfo.segments}</div>
            {data.routingInfo.hasObstacles && (
              <div className="text-yellow-300">⚠️ Obstáculos detectados</div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

AutoRoutedEdge.displayName = 'AutoRoutedEdge';

export default AutoRoutedEdge;