// ============================================================================
// SmartEdge - Edge inteligente com roteamento adaptativo
// ============================================================================

import React, { memo, useMemo } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  getStraightPath,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType,
  Position
} from 'reactflow';
import { cn } from '@/lib/utils';
import { SmartEdgeData } from './types';
import { useAutoRouting } from '../hooks/useAutoRouting';

// ============================================================================
// TIPOS
// ============================================================================

interface SmartEdgeProps extends EdgeProps {
  data?: SmartEdgeData;
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

const getOptimalConnectionPoints = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position,
  gridSize: number = 20
) => {
  // Calcular pontos de conexão otimizados
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  
  let optimalSourceX = sourceX;
  let optimalSourceY = sourceY;
  let optimalTargetX = targetX;
  let optimalTargetY = targetY;
  
  // Ajustar baseado na posição preferencial
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Conexão horizontal preferencial
    if (sourcePosition === Position.Right || sourcePosition === Position.Left) {
      optimalSourceY = snapToGrid(sourceY, gridSize);
    }
    if (targetPosition === Position.Right || targetPosition === Position.Left) {
      optimalTargetY = snapToGrid(targetY, gridSize);
    }
  } else {
    // Conexão vertical preferencial
    if (sourcePosition === Position.Top || sourcePosition === Position.Bottom) {
      optimalSourceX = snapToGrid(sourceX, gridSize);
    }
    if (targetPosition === Position.Top || targetPosition === Position.Bottom) {
      optimalTargetX = snapToGrid(targetX, gridSize);
    }
  }
  
  return {
    sourceX: optimalSourceX,
    sourceY: optimalSourceY,
    targetX: optimalTargetX,
    targetY: optimalTargetY
  };
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const SmartEdge: React.FC<SmartEdgeProps> = memo(({
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
  // HOOKS
  // ============================================================================

  const { generateRoute, validateConnection } = useAutoRouting({
    avoidNodes: data?.smartRouting?.avoidNodes || false,
    preferOrthogonal: data?.smartRouting?.preferOrthogonal || true,
    smoothCurves: true,
    gridSize: data?.smartRouting?.gridSize || 20
  });

  // ============================================================================
  // CÁLCULO DO CAMINHO
  // ============================================================================

  const pathData = useMemo(() => {
    const smartRouting = data?.smartRouting;
    
    if (!smartRouting?.enabled) {
      // Usar caminho padrão smooth step
      const [path, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: data?.cornerRadius || 8,
        offset: data?.offset || 20
      });
      
      return { path, labelX, labelY, isSmartRouted: false };
    }

    // Aplicar snap to grid se habilitado
    let adjustedCoords = { sourceX, sourceY, targetX, targetY };
    
    if (smartRouting.snapToGrid) {
      adjustedCoords = getOptimalConnectionPoints(
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        smartRouting.gridSize
      );
    }

    // Usar pontos de conexão customizados se disponíveis
    if (data?.connectionPoints) {
      adjustedCoords.sourceX = data.connectionPoints.source.x;
      adjustedCoords.sourceY = data.connectionPoints.source.y;
      adjustedCoords.targetX = data.connectionPoints.target.x;
      adjustedCoords.targetY = data.connectionPoints.target.y;
    }

    // Gerar rota inteligente se evitar nós estiver habilitado
    if (smartRouting.avoidNodes) {
      try {
        const route = generateRoute(
          { x: adjustedCoords.sourceX, y: adjustedCoords.sourceY },
          { x: adjustedCoords.targetX, y: adjustedCoords.targetY }
        );
        
        if (route.success && route.pathString) {
          return {
            path: route.pathString,
            labelX: (adjustedCoords.sourceX + adjustedCoords.targetX) / 2,
            labelY: (adjustedCoords.sourceY + adjustedCoords.targetY) / 2,
            isSmartRouted: true,
            routingInfo: route.routingInfo
          };
        }
      } catch (error) {
        console.warn('Smart routing failed, falling back to default:', error);
      }
    }

    // Fallback para roteamento ortogonal ou smooth step
    if (smartRouting.preferOrthogonal) {
      const [path, labelX, labelY] = getSmoothStepPath({
        sourceX: adjustedCoords.sourceX,
        sourceY: adjustedCoords.sourceY,
        sourcePosition,
        targetX: adjustedCoords.targetX,
        targetY: adjustedCoords.targetY,
        targetPosition,
        borderRadius: data?.cornerRadius || 8,
        offset: data?.offset || 20
      });
      
      return { path, labelX, labelY, isSmartRouted: true };
    } else {
      const [path, labelX, labelY] = getBezierPath({
        sourceX: adjustedCoords.sourceX,
        sourceY: adjustedCoords.sourceY,
        sourcePosition,
        targetX: adjustedCoords.targetX,
        targetY: adjustedCoords.targetY,
        targetPosition,
        curvature: 0.25
      });
      
      return { path, labelX, labelY, isSmartRouted: true };
    }
  }, [
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    data, generateRoute
  ]);

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
        path={pathData.path}
        style={edgeStyle}
        markerEnd={markerEndConfig}
        markerStart={markerStart}
        className={cn(
          'react-flow__edge-path',
          selected && 'selected',
          data?.animated && 'animated',
          pathData.isSmartRouted && 'smart-routed',
          data?.smartRouting?.enabled && 'smart-routing-enabled'
        )}
      />
      
      {/* Label customizado */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${pathData.labelX}px,${pathData.labelY}px)`,
              pointerEvents: 'all'
            }}
            className={cn(
              'nodrag nopan',
              'bg-white border border-gray-200 rounded px-2 py-1 text-xs font-medium shadow-sm',
              selected && 'border-blue-500 bg-blue-50 text-blue-700'
            )}
          >
            {data.label}
            
            {/* Indicadores de funcionalidades */}
            <div className="inline-flex items-center ml-1 space-x-1">
              {pathData.isSmartRouted && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" title="Roteamento inteligente" />
              )}
              {data?.smartRouting?.snapToGrid && (
                <div className="w-2 h-2 bg-purple-500 rounded-full" title="Snap to grid" />
              )}
              {data?.smartRouting?.avoidNodes && (
                <div className="w-2 h-2 bg-orange-500 rounded-full" title="Evita obstáculos" />
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Debug info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && pathData.routingInfo && selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${pathData.labelX}px,${pathData.labelY + 40}px)`,
              pointerEvents: 'none'
            }}
            className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-75 max-w-xs"
          >
            <div>Smart Edge Debug:</div>
            <div>Comprimento: {Math.round(pathData.routingInfo.totalLength)}px</div>
            <div>Segmentos: {pathData.routingInfo.segments}</div>
            <div>Grid: {data?.smartRouting?.gridSize || 20}px</div>
            {pathData.routingInfo.hasObstacles && (
              <div className="text-yellow-300">⚠️ Obstáculos detectados</div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

SmartEdge.displayName = 'SmartEdge';

export default SmartEdge;