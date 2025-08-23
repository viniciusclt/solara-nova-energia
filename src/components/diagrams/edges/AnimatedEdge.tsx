// ============================================================================
// AnimatedEdge - Edge com animações e efeitos visuais
// ============================================================================

import React, { memo, useEffect, useRef, useState } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType
} from 'reactflow';
import { cn } from '@/lib/utils';
import { AnimatedEdgeData } from './types';

// ============================================================================
// TIPOS
// ============================================================================

interface AnimatedEdgeProps extends EdgeProps {
  data?: AnimatedEdgeData;
}

interface Particle {
  id: string;
  position: number; // 0 to 1 along the path
  speed: number;
  size: number;
  color: string;
  opacity: number;
}

// ============================================================================
// UTILITÁRIOS DE ANIMAÇÃO
// ============================================================================

const getAnimationCSS = (type: string, speed: number, direction: string) => {
  const duration = `${3 / speed}s`;
  
  switch (type) {
    case 'flow':
      return {
        strokeDasharray: '10 5',
        animation: `flow-${direction} ${duration} linear infinite`
      };
    case 'pulse':
      return {
        animation: `pulse ${duration} ease-in-out infinite alternate`
      };
    case 'dash':
      return {
        strokeDasharray: '8 4',
        animation: `dash-${direction} ${duration} linear infinite`
      };
    case 'glow':
      return {
        filter: 'drop-shadow(0 0 6px currentColor)',
        animation: `glow ${duration} ease-in-out infinite alternate`
      };
    default:
      return {};
  }
};

const generateParticles = (count: number, data: AnimatedEdgeData): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `particle-${i}`,
    position: Math.random(),
    speed: (data.particles?.speed || 1) * (0.8 + Math.random() * 0.4),
    size: data.particles?.size || 4,
    color: data.particles?.color || '#3b82f6',
    opacity: 0.7 + Math.random() * 0.3
  }));
};

const getPointOnPath = (path: string, position: number): { x: number; y: number } => {
  // Simplified path point calculation
  // In a real implementation, you'd parse the SVG path and calculate the exact point
  // For now, we'll use a linear interpolation as approximation
  
  // Extract coordinates from path (simplified)
  const matches = path.match(/[ML]\s*([\d.-]+)[\s,]+([\d.-]+)/g);
  if (!matches || matches.length < 2) {
    return { x: 0, y: 0 };
  }
  
  const startMatch = matches[0].match(/([\d.-]+)[\s,]+([\d.-]+)/);
  const endMatch = matches[matches.length - 1].match(/([\d.-]+)[\s,]+([\d.-]+)/);
  
  if (!startMatch || !endMatch) {
    return { x: 0, y: 0 };
  }
  
  const startX = parseFloat(startMatch[1]);
  const startY = parseFloat(startMatch[2]);
  const endX = parseFloat(endMatch[1]);
  const endY = parseFloat(endMatch[2]);
  
  return {
    x: startX + (endX - startX) * position,
    y: startY + (endY - startY) * position
  };
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AnimatedEdge: React.FC<AnimatedEdgeProps> = memo(({
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
  // STATE E REFS
  // ============================================================================

  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // ============================================================================
  // CONFIGURAÇÃO DO CAMINHO
  // ============================================================================

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: data?.cornerRadius || 8,
    offset: data?.offset || 20
  });

  // ============================================================================
  // EFEITOS
  // ============================================================================

  // Inicializar partículas
  useEffect(() => {
    if (data?.particles?.enabled && data.particles.count > 0) {
      setParticles(generateParticles(data.particles.count, data));
    } else {
      setParticles([]);
    }
  }, [data?.particles]);

  // Animação de partículas
  useEffect(() => {
    if (particles.length === 0) return;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newPosition = particle.position + (particle.speed * deltaTime * 0.001);
          
          // Reset particle when it reaches the end
          if (newPosition > 1) {
            newPosition = 0;
          }
          
          return {
            ...particle,
            position: newPosition
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles.length]);

  // ============================================================================
  // ESTILOS
  // ============================================================================

  const animation = data?.animation;
  const animationStyles = animation ? getAnimationCSS(
    animation.type,
    animation.speed,
    animation.direction
  ) : {};

  const edgeStyle = {
    strokeWidth: data?.strokeWidth || 2,
    stroke: selected 
      ? data?.selectedColor || '#3b82f6'
      : data?.color || '#64748b',
    strokeDasharray: data?.dashed ? '5,5' : undefined,
    opacity: data?.opacity || 1,
    filter: selected ? 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' : undefined,
    transition: 'all 0.2s ease-in-out',
    ...animationStyles,
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
      {/* CSS Animations */}
      <style>{`
        @keyframes flow-forward {
          to { stroke-dashoffset: -15px; }
        }
        @keyframes flow-backward {
          to { stroke-dashoffset: 15px; }
        }
        @keyframes flow-bidirectional {
          0%, 100% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: -15px; }
        }
        @keyframes dash-forward {
          to { stroke-dashoffset: -12px; }
        }
        @keyframes dash-backward {
          to { stroke-dashoffset: 12px; }
        }
        @keyframes pulse {
          from { stroke-width: ${data?.strokeWidth || 2}px; }
          to { stroke-width: ${(data?.strokeWidth || 2) * 1.5}px; }
        }
        @keyframes glow {
          from { filter: drop-shadow(0 0 2px currentColor); }
          to { filter: drop-shadow(0 0 8px currentColor); }
        }
      `}</style>

      {/* Edge principal */}
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
          animation && `animated-${animation.type}`,
          animation?.direction && `direction-${animation.direction}`
        )}
      />
      
      {/* Partículas animadas */}
      {particles.map(particle => {
        const point = getPointOnPath(edgePath, particle.position);
        return (
          <circle
            key={particle.id}
            cx={point.x}
            cy={point.y}
            r={particle.size / 2}
            fill={particle.color}
            opacity={particle.opacity}
            className="pointer-events-none"
            style={{
              filter: 'drop-shadow(0 0 2px currentColor)'
            }}
          />
        );
      })}
      
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
            
            {/* Indicadores de animação */}
            <div className="inline-flex items-center ml-1 space-x-1">
              {animation && (
                <div 
                  className="w-2 h-2 bg-green-500 rounded-full animate-pulse" 
                  title={`Animação: ${animation.type}`} 
                />
              )}
              {data?.particles?.enabled && (
                <div 
                  className="w-2 h-2 bg-purple-500 rounded-full" 
                  title={`Partículas: ${data.particles.count}`} 
                />
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Debug info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (animation || data?.particles?.enabled) && selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 40}px)`,
              pointerEvents: 'none'
            }}
            className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-75 max-w-xs"
          >
            <div>Animated Edge Debug:</div>
            {animation && (
              <>
                <div>Tipo: {animation.type}</div>
                <div>Velocidade: {animation.speed}x</div>
                <div>Direção: {animation.direction}</div>
              </>
            )}
            {data?.particles?.enabled && (
              <>
                <div>Partículas: {data.particles.count}</div>
                <div>Tamanho: {data.particles.size}px</div>
              </>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

AnimatedEdge.displayName = 'AnimatedEdge';

export default AnimatedEdge;