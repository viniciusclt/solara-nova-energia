import React, { memo } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { cn } from '../../../lib/utils';

interface BezierEdgeData {
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  curvature?: number;
}

interface BezierEdgeProps extends EdgeProps {
  data?: BezierEdgeData;
}

export const BezierEdge: React.FC<BezierEdgeProps> = memo(({
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
    curvature: data?.curvature || 0.25,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          ...data?.style,
        }}
        className={cn(
          'react-flow__edge-path',
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
          className="react-flow__edge-text"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {data.label}
        </text>
      )}
    </>
  );
});

BezierEdge.displayName = 'BezierEdge';

export default BezierEdge;