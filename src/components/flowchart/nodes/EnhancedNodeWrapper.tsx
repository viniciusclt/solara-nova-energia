import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, ChevronDown } from 'lucide-react';
import { FlowchartNodeType, FlowchartPosition } from '@/types/flowchart';

interface AddNodeButtonProps {
  position: Position;
  onAddNode: (type: FlowchartNodeType, direction: Position) => void;
  isVisible: boolean;
}

const AddNodeButton: React.FC<AddNodeButtonProps> = ({ position, onAddNode, isVisible }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: '#3B82F6',
      border: '2px solid white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 1000, // Aumentar z-index para ficar acima dos Handles
      transition: 'all 0.2s ease-in-out',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
      pointerEvents: 'auto' as const, // Garantir que os botões sejam clicáveis
    };

    switch (position) {
      case Position.Top:
        return { ...baseStyles, top: '-12px', left: '50%', transform: 'translateX(-50%)' };
      case Position.Right:
        return { ...baseStyles, right: '-12px', top: '50%', transform: 'translateY(-50%)' };
      case Position.Bottom:
        return { ...baseStyles, bottom: '-12px', left: '50%', transform: 'translateX(-50%)' };
      case Position.Left:
        return { ...baseStyles, left: '-12px', top: '50%', transform: 'translateY(-50%)' };
      default:
        return baseStyles;
    }
  };

  const nodeTypes = [
    { type: 'process' as FlowchartNodeType, label: 'Processo', icon: '⚙️' },
    { type: 'decision' as FlowchartNodeType, label: 'Decisão', icon: '❓' },
    { type: 'data' as FlowchartNodeType, label: 'Dados', icon: '📊' },
    { type: 'document' as FlowchartNodeType, label: 'Documento', icon: '📄' },
    { type: 'subprocess' as FlowchartNodeType, label: 'Subprocesso', icon: '🔄' },
  ];

  if (!isVisible) return null;

  return (
    <div className="relative" style={{ pointerEvents: 'auto' }}>
      <div
        style={getPositionStyles()}
        onClick={(e) => {
          e.stopPropagation(); // Evitar conflitos com eventos do nó
          setShowMenu(!showMenu);
        }}
        className="hover:scale-110 hover:shadow-lg"
      >
        <Plus size={12} color="white" />
      </div>
      
      {showMenu && (
        <div 
          className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[160px]"
          style={{
            top: position === Position.Top ? '30px' : position === Position.Bottom ? '-120px' : '50%',
            left: position === Position.Left ? '30px' : position === Position.Right ? '-170px' : '50%',
            transform: position === Position.Top || position === Position.Bottom ? 'translateX(-50%)' : 
                      position === Position.Left || position === Position.Right ? 'translateY(-50%)' : 'none',
            zIndex: 1001, // Garantir que o menu fique acima dos botões
            pointerEvents: 'auto' as const // Garantir que o menu seja clicável
          }}
        >
          <div className="text-xs font-medium text-gray-600 mb-2 px-1">Adicionar Nó</div>
          {nodeTypes.map((nodeType) => (
            <button
              key={nodeType.type}
              onClick={() => {
                onAddNode(nodeType.type, position);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-xs rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
            >
              <span>{nodeType.icon}</span>
              <span>{nodeType.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface EnhancedNodeWrapperProps {
  children: React.ReactNode;
  isSelected: boolean;
  isHovered?: boolean;
  onAddNode?: (type: FlowchartNodeType, position: FlowchartPosition) => void;
  onAddEdge?: (source: string, target: string) => void;
  showAddButtons?: boolean;
  nodeId: string;
  className?: string;
  position: FlowchartPosition;
}

export const EnhancedNodeWrapper: React.FC<EnhancedNodeWrapperProps> = ({
  children,
  isSelected,
  isHovered = false,
  onAddNode,
  onAddEdge,
  showAddButtons = true,
  nodeId,
  className = '',
  position
}) => {
  const [localHovered, setLocalHovered] = useState(false);
  const shouldShowButtons = showAddButtons && onAddNode && (isSelected || isHovered || localHovered);

  const handleAddNode = (type: FlowchartNodeType, direction: Position) => {
    if (onAddNode) {
      // Calcular posição do novo nó baseado na direção
      const offset = 200;
      let newPosition: FlowchartPosition;
      
      switch (direction) {
        case Position.Top:
          newPosition = { x: position.x, y: position.y - offset };
          break;
        case Position.Bottom:
          newPosition = { x: position.x, y: position.y + offset };
          break;
        case Position.Left:
          newPosition = { x: position.x - offset, y: position.y };
          break;
        case Position.Right:
          newPosition = { x: position.x + offset, y: position.y };
          break;
        default:
          newPosition = { x: position.x + offset, y: position.y };
      }
      
      // Criar novo nó - a função addNode já deve lidar com a criação da conexão se necessário
      onAddNode(type, newPosition);
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setLocalHovered(true)}
      onMouseLeave={() => setLocalHovered(false)}
      style={{ 
        pointerEvents: 'auto', // Garantir que o nó seja arrastável
        position: 'relative',
        zIndex: 1 // Base z-index para o nó
      }}
    >
      {children}
      
      {/* Botões de adição em cada direção */}
      {shouldShowButtons && (
        <>
          <AddNodeButton 
            position={Position.Top} 
            onAddNode={handleAddNode} 
            isVisible={true}
          />
          <AddNodeButton 
            position={Position.Right} 
            onAddNode={handleAddNode} 
            isVisible={true}
          />
          <AddNodeButton 
            position={Position.Bottom} 
            onAddNode={handleAddNode} 
            isVisible={true}
          />
          <AddNodeButton 
            position={Position.Left} 
            onAddNode={handleAddNode} 
            isVisible={true}
          />
        </>
      )}
      
      {/* Handles para conexões */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: '-6px', zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ right: '-6px', zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ bottom: '-6px', zIndex: 10 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ left: '-6px', zIndex: 10 }}
      />
    </div>
  );
};

export default EnhancedNodeWrapper;