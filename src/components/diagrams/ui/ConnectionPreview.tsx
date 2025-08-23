// ============================================================================
// ConnectionPreview - Componente para preview visual de conexões
// ============================================================================

import React from 'react';
import { ConnectionPreview as ConnectionPreviewType, ConnectionStyle } from '../hooks/useAdvancedConnections';
import { useDiagramStore } from '../stores/useDiagramStore';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ConnectionPreviewProps {
  preview: ConnectionPreviewType;
  containerRef?: React.RefObject<HTMLDivElement>;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ConnectionPreview: React.FC<ConnectionPreviewProps> = ({
  preview,
  containerRef
}) => {
  const { nodes } = useDiagramStore();

  // Não renderizar se o preview não estiver visível
  if (!preview.isVisible || !preview.sourceId || !preview.mousePosition) {
    return null;
  }

  // Encontrar o nó de origem
  const sourceNode = nodes.find(n => n.id === preview.sourceId);
  if (!sourceNode) {
    return null;
  }

  // Calcular posições
  const containerRect = containerRef?.current?.getBoundingClientRect();
  const sourceX = sourceNode.position.x + (sourceNode.data?.width || 150) / 2;
  const sourceY = sourceNode.position.y + (sourceNode.data?.height || 100) / 2;
  
  // Ajustar posição do mouse relativa ao container
  const mouseX = containerRect 
    ? preview.mousePosition.x - containerRect.left
    : preview.mousePosition.x;
  const mouseY = containerRect 
    ? preview.mousePosition.y - containerRect.top
    : preview.mousePosition.y;

  // Calcular o caminho da linha
  const getLinePath = (): string => {
    switch (preview.style.strokeDasharray) {
      case 'curved':
        // Linha curva usando quadratic bezier
        const controlX = (sourceX + mouseX) / 2;
        const controlY = sourceY - Math.abs(mouseY - sourceY) * 0.3;
        return `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${mouseX} ${mouseY}`;
      
      case 'stepped':
        // Linha em degraus
        const midX = (sourceX + mouseX) / 2;
        return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${mouseY} L ${mouseX} ${mouseY}`;
      
      case 'orthogonal':
        // Linha ortogonal (ângulos retos)
        if (Math.abs(mouseX - sourceX) > Math.abs(mouseY - sourceY)) {
          return `M ${sourceX} ${sourceY} L ${mouseX} ${sourceY} L ${mouseX} ${mouseY}`;
        } else {
          return `M ${sourceX} ${sourceY} L ${sourceX} ${mouseY} L ${mouseX} ${mouseY}`;
        }
      
      default:
        // Linha reta
        return `M ${sourceX} ${sourceY} L ${mouseX} ${mouseY}`;
    }
  };

  // Calcular posição da seta
  const getArrowTransform = (): string => {
    const angle = Math.atan2(mouseY - sourceY, mouseX - sourceX) * (180 / Math.PI);
    return `translate(${mouseX}, ${mouseY}) rotate(${angle})`;
  };

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-50"
      style={{ zIndex: 1000 }}
    >
      <svg 
        className="w-full h-full"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {/* Definições para marcadores de seta */}
        <defs>
          <marker
            id="preview-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill={preview.style.strokeColor}
              opacity={0.8}
            />
          </marker>
          
          {/* Marcador para linha animada */}
          <marker
            id="preview-arrow-animated"
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill={preview.style.strokeColor}
              opacity={0.9}
            >
              {preview.style.animated && (
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="1s"
                  repeatCount="indefinite"
                />
              )}
            </path>
          </marker>
        </defs>

        {/* Linha de preview */}
        <path
          d={getLinePath()}
          stroke={preview.style.strokeColor}
          strokeWidth={preview.style.strokeWidth}
          strokeDasharray={preview.style.strokeDasharray}
          fill="none"
          opacity={0.7}
          markerEnd={preview.style.showArrows ? 
            (preview.style.animated ? "url(#preview-arrow-animated)" : "url(#preview-arrow)") : 
            undefined
          }
          className={preview.style.animated ? 'animate-pulse' : ''}
        >
          {/* Animação da linha se habilitada */}
          {preview.style.animated && (
            <animate
              attributeName="stroke-dashoffset"
              values="0;20"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
        </path>

        {/* Ponto de origem */}
        <circle
          cx={sourceX}
          cy={sourceY}
          r={4}
          fill={preview.style.strokeColor}
          opacity={0.8}
          className="animate-pulse"
        />

        {/* Ponto de destino (posição do mouse) */}
        <circle
          cx={mouseX}
          cy={mouseY}
          r={3}
          fill={preview.style.strokeColor}
          opacity={0.6}
          className="animate-ping"
        />

        {/* Indicador de snap se próximo a um nó */}
        {preview.targetId && (
          <circle
            cx={mouseX}
            cy={mouseY}
            r={8}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            opacity={0.8}
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Tooltip com informações da conexão */}
      <div
        className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
        style={{
          left: mouseX + 10,
          top: mouseY - 30,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="flex flex-col gap-1">
          <div className="font-medium">
            Conectando de: {sourceNode.data?.label || sourceNode.id}
          </div>
          {preview.targetId && (
            <div className="text-green-400">
              Para: {nodes.find(n => n.id === preview.targetId)?.data?.label || preview.targetId}
            </div>
          )}
          <div className="text-gray-400">
            Tipo: {preview.style.strokeDasharray || 'reta'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionPreview;