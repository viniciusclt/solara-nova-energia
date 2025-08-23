// ============================================================================
// CustomBezierEdge - Edge com curvas Bézier personalizáveis
// ============================================================================

import React, { memo, useMemo, useState } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType,
  Position
} from 'reactflow';
import { cn } from '@/lib/utils';
import { CustomBezierEdgeData, BezierControlPoint } from './types';

// ============================================================================
// TIPOS
// ============================================================================

interface CustomBezierEdgeProps extends EdgeProps {
  data?: CustomBezierEdgeData;
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

const calculateControlPoints = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position,
  curvature: number = 0.25,
  tension: number = 0.5
): { sourceControlPoint: BezierControlPoint; targetControlPoint: BezierControlPoint } => {
  const distance = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
  );
  
  const controlDistance = distance * curvature * tension;
  
  let sourceControlPoint: BezierControlPoint;
  let targetControlPoint: BezierControlPoint;
  
  // Calcular pontos de controle baseado na posição dos handles
  switch (sourcePosition) {
    case Position.Right:
      sourceControlPoint = { x: sourceX + controlDistance, y: sourceY };
      break;
    case Position.Left:
      sourceControlPoint = { x: sourceX - controlDistance, y: sourceY };
      break;
    case Position.Top:
      sourceControlPoint = { x: sourceX, y: sourceY - controlDistance };
      break;
    case Position.Bottom:
      sourceControlPoint = { x: sourceX, y: sourceY + controlDistance };
      break;
    default:
      sourceControlPoint = { x: sourceX + controlDistance, y: sourceY };
  }
  
  switch (targetPosition) {
    case Position.Right:
      targetControlPoint = { x: targetX + controlDistance, y: targetY };
      break;
    case Position.Left:
      targetControlPoint = { x: targetX - controlDistance, y: targetY };
      break;
    case Position.Top:
      targetControlPoint = { x: targetX, y: targetY - controlDistance };
      break;
    case Position.Bottom:
      targetControlPoint = { x: targetX, y: targetY + controlDistance };
      break;
    default:
      targetControlPoint = { x: targetX - controlDistance, y: targetY };
  }
  
  return { sourceControlPoint, targetControlPoint };
};

const createCustomBezierPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceControlPoint: BezierControlPoint,
  targetControlPoint: BezierControlPoint
): string => {
  return `M ${sourceX},${sourceY} C ${sourceControlPoint.x},${sourceControlPoint.y} ${targetControlPoint.x},${targetControlPoint.y} ${targetX},${targetY}`;
};

const getPointOnBezierCurve = (
  t: number,
  p0: BezierControlPoint,
  p1: BezierControlPoint,
  p2: BezierControlPoint,
  p3: BezierControlPoint
): BezierControlPoint => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
  };
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CustomBezierEdge: React.FC<CustomBezierEdgeProps> = memo(({
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
  // STATE
  // ============================================================================

  const [showControlPoints, setShowControlPoints] = useState(false);

  // ============================================================================
  // CÁLCULO DO CAMINHO
  // ============================================================================

  const pathData = useMemo(() => {
    const curvature = data?.curvature || 0.25;
    const tension = data?.tension || 0.5;
    
    let sourceControlPoint: BezierControlPoint;
    let targetControlPoint: BezierControlPoint;
    
    // Usar pontos de controle customizados se fornecidos
    if (data?.controlPoints) {
      sourceControlPoint = data.controlPoints.source;
      targetControlPoint = data.controlPoints.target;
    } else {
      // Calcular pontos de controle automaticamente
      const calculated = calculateControlPoints(
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        curvature,
        tension
      );
      sourceControlPoint = calculated.sourceControlPoint;
      targetControlPoint = calculated.targetControlPoint;
    }
    
    // Criar caminho Bézier customizado
    const customPath = createCustomBezierPath(
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourceControlPoint,
      targetControlPoint
    );
    
    // Calcular posição do label (ponto médio da curva)
    const labelPoint = getPointOnBezierCurve(
      0.5,
      { x: sourceX, y: sourceY },
      sourceControlPoint,
      targetControlPoint,
      { x: targetX, y: targetY }
    );
    
    return {
      path: customPath,
      labelX: labelPoint.x,
      labelY: labelPoint.y,
      sourceControlPoint,
      targetControlPoint
    };
  }, [
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    data?.controlPoints, data?.curvature, data?.tension
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
  // HANDLERS
  // ============================================================================

  const handleEdgeClick = () => {
    if (selected) {
      setShowControlPoints(!showControlPoints);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Edge principal */}
      <BaseEdge
        id={id}
        path={pathData.path}
        style={edgeStyle}
        markerEnd={markerEndConfig}
        markerStart={markerStart}
        onClick={handleEdgeClick}
        className={cn(
          'react-flow__edge-path',
          selected && 'selected',
          data?.animated && 'animated',
          'custom-bezier-edge',
          'cursor-pointer'
        )}
      />
      
      {/* Pontos de controle (visíveis quando selecionado) */}
      {selected && showControlPoints && (
        <>
          {/* Linha de controle source */}
          <path
            d={`M ${sourceX},${sourceY} L ${pathData.sourceControlPoint.x},${pathData.sourceControlPoint.y}`}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="3,3"
            fill="none"
            className="pointer-events-none"
          />
          
          {/* Linha de controle target */}
          <path
            d={`M ${targetX},${targetY} L ${pathData.targetControlPoint.x},${pathData.targetControlPoint.y}`}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="3,3"
            fill="none"
            className="pointer-events-none"
          />
          
          {/* Ponto de controle source */}
          <circle
            cx={pathData.sourceControlPoint.x}
            cy={pathData.sourceControlPoint.y}
            r="4"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="2"
            className="cursor-move"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
          
          {/* Ponto de controle target */}
          <circle
            cx={pathData.targetControlPoint.x}
            cy={pathData.targetControlPoint.y}
            r="4"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="2"
            className="cursor-move"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
        </>
      )}
      
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
            
            {/* Indicadores */}
            <div className="inline-flex items-center ml-1 space-x-1">
              <div 
                className="w-2 h-2 bg-indigo-500 rounded-full" 
                title="Curva Bézier customizada" 
              />
              {data?.controlPoints && (
                <div 
                  className="w-2 h-2 bg-purple-500 rounded-full" 
                  title="Pontos de controle customizados" 
                />
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Controles de ajuste (quando selecionado) */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${pathData.labelX}px,${pathData.labelY + 30}px)`,
              pointerEvents: 'all'
            }}
            className="bg-white border border-gray-200 rounded p-2 shadow-lg text-xs"
          >
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowControlPoints(!showControlPoints)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-colors',
                  showControlPoints
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {showControlPoints ? 'Ocultar' : 'Mostrar'} Controles
              </button>
              
              <div className="text-gray-500">
                Curvatura: {Math.round((data?.curvature || 0.25) * 100)}%
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Debug info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${pathData.labelX}px,${pathData.labelY + 70}px)`,
              pointerEvents: 'none'
            }}
            className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-75 max-w-xs"
          >
            <div>Custom Bézier Debug:</div>
            <div>Curvatura: {data?.curvature || 0.25}</div>
            <div>Tensão: {data?.tension || 0.5}</div>
            <div>Controle Source: ({Math.round(pathData.sourceControlPoint.x)}, {Math.round(pathData.sourceControlPoint.y)})</div>
            <div>Controle Target: ({Math.round(pathData.targetControlPoint.x)}, {Math.round(pathData.targetControlPoint.y)})</div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CustomBezierEdge.displayName = 'CustomBezierEdge';

export default CustomBezierEdge;