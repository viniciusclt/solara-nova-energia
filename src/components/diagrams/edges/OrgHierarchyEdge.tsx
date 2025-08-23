import React, { memo } from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';
import { cn } from '../../../lib/utils';

interface OrgHierarchyEdgeData {
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  hierarchyLevel?: number;
  isManagerial?: boolean;
}

interface OrgHierarchyEdgeProps extends EdgeProps {
  data?: OrgHierarchyEdgeData;
}

export const OrgHierarchyEdge: React.FC<OrgHierarchyEdgeProps> = memo(({
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
    borderRadius: 8,
  });

  const getHierarchyStyle = () => {
    const baseStyle = {
      stroke: '#374151',
      strokeWidth: 2,
    };

    if (data?.isManagerial) {
      return {
        ...baseStyle,
        stroke: '#059669',
        strokeWidth: 3,
        strokeDasharray: '0',
      };
    }

    if (data?.hierarchyLevel) {
      const level = data.hierarchyLevel;
      return {
        ...baseStyle,
        strokeWidth: Math.max(1, 4 - level),
        opacity: Math.max(0.6, 1 - (level * 0.1)),
      };
    }

    return baseStyle;
  };

  const edgeStyle = {
    ...getHierarchyStyle(),
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
          'org-hierarchy-edge',
          data?.animated && 'animated',
          data?.isManagerial && 'managerial',
          selected && 'selected'
        )}
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text
          x={labelX}
          y={labelY}
          className="react-flow__edge-text org-edge-text"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '11px',
            fontWeight: data?.isManagerial ? 600 : 400,
            fill: data?.isManagerial ? '#059669' : '#374151'
          }}
        >
          {data.label}
        </text>
      )}
    </>
  );
});

OrgHierarchyEdge.displayName = 'OrgHierarchyEdge';

export default OrgHierarchyEdge;