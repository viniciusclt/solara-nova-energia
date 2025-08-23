import React, { memo } from 'react';
import { EdgeProps, getStraightPath } from 'reactflow';
import { cn } from '../../../lib/utils';

interface StraightEdgeData {
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

interface StraightEdgeProps extends EdgeProps {
  data?: StraightEdgeData;
}

export const StraightEdge: React.FC<StraightEdgeProps> = memo(({
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
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
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

StraightEdge.displayName = 'StraightEdge';

export default StraightEdge;