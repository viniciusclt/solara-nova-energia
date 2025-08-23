import React, { memo } from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';
import { cn } from '../../../lib/utils';

interface SmoothStepEdgeData {
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  borderRadius?: number;
}

interface SmoothStepEdgeProps extends EdgeProps {
  data?: SmoothStepEdgeData;
}

export const SmoothStepEdge: React.FC<SmoothStepEdgeProps> = memo(({
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: data?.borderRadius || 5,
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

SmoothStepEdge.displayName = 'SmoothStepEdge';

export default SmoothStepEdge;