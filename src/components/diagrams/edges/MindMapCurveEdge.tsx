import React, { memo } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { cn } from '../../../lib/utils';

interface MindMapCurveEdgeData {
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  thickness?: number;
  color?: string;
}

interface MindMapCurveEdgeProps extends EdgeProps {
  data?: MindMapCurveEdgeData;
}

export const MindMapCurveEdge: React.FC<MindMapCurveEdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.4, // Curva mais acentuada para mapas mentais
  });

  const edgeStyle = {
    stroke: data?.color || '#8b5cf6',
    strokeWidth: data?.thickness || 3,
    strokeLinecap: 'round' as const,
    ...style,
    ...data?.style,
  };

  return (
    <>
      <path
        id={id}
        style={edgeStyle}
        className={cn(
          'react-flow__edge-path',
          'mindmap-edge',
          data?.animated && 'animated',
          selected && 'selected'
        )}
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text
          x={labelX}
          y={labelY}
          className="react-flow__edge-text mindmap-edge-text"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            fill: data?.color || '#8b5cf6'
          }}
        >
          {data.label}
        </text>
      )}
    </>
  );
});

MindMapCurveEdge.displayName = 'MindMapCurveEdge';

export default MindMapCurveEdge;