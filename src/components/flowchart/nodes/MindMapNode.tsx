import React from 'react';
import { NodeProps } from 'reactflow';
import { FlowchartNode } from '@/types/flowchart';
import { Brain, Lightbulb, Target, Users, Zap, Sparkles } from 'lucide-react';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'idea': return <Lightbulb size={18} />;
    case 'goal': return <Target size={18} />;
    case 'team': return <Users size={18} />;
    case 'action': return <Zap size={18} />;
    default: return <Brain size={18} />;
  }
};

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'idea': return { 
      bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', 
      border: '#F59E0B', 
      text: '#92400E',
      glow: 'rgba(245, 158, 11, 0.3)'
    };
    case 'goal': return { 
      bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', 
      border: '#3B82F6', 
      text: '#1E40AF',
      glow: 'rgba(59, 130, 246, 0.3)'
    };
    case 'team': return { 
      bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', 
      border: '#10B981', 
      text: '#065F46',
      glow: 'rgba(16, 185, 129, 0.3)'
    };
    case 'action': return { 
      bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', 
      border: '#EF4444', 
      text: '#991B1B',
      glow: 'rgba(239, 68, 68, 0.3)'
    };
    default: return { 
      bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', 
      border: '#8B5CF6', 
      text: '#5B21B6',
      glow: 'rgba(139, 92, 246, 0.3)'
    };
  }
};

export const MindMapNode: React.FC<NodeProps<FlowchartNode['data']>> = ({ id, data, selected, xPos, yPos }) => {
  const level = data.level || 0;
  const isRoot = data.isRoot || level === 0;
  const colors = getCategoryColor(data.category);
  
  // Estilo baseado no nível hierárquico
  const getNodeStyle = () => {
    const baseSize = isRoot ? 140 : Math.max(100 - (level * 10), 80);
    const fontSize = isRoot ? 16 : Math.max(14 - (level * 1), 12);
    
    return {
      background: data.style?.backgroundColor || colors.bg,
      color: data.style?.color || colors.text,
      border: `3px solid ${selected ? '#3B82F6' : data.style?.borderColor || colors.border}`,
      borderRadius: isRoot ? '50%' : '24px',
      width: `${baseSize}px`,
      height: `${baseSize}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${fontSize}px`,
      fontWeight: isRoot ? '800' : '700',
      boxShadow: selected 
        ? `0 12px 35px ${colors.glow}, 0 6px 18px ${colors.border}40, inset 0 1px 0 rgba(255,255,255,0.3)` 
        : `0 8px 25px ${colors.glow}, 0 4px 12px ${colors.border}30, inset 0 1px 0 rgba(255,255,255,0.2)`,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: selected ? 'translateY(-4px) scale(1.08)' : 'translateY(0) scale(1)',
      textAlign: 'center' as const,
      padding: isRoot ? '20px' : '16px',
      position: 'relative' as const,
    };
  };

  return (
    <EnhancedNodeWrapper
      nodeId={id}
      isSelected={selected}
      position={{ x: xPos, y: yPos }}
      onAddNode={data?.onAddNode}
      onAddEdge={data?.onAddEdge}
      className="mindmap-node-wrapper"
    >
      <div style={getNodeStyle()} className="mindmap-node">
        {/* Efeito de brilho interno */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" 
             style={{ borderRadius: isRoot ? '50%' : '20px' }} />
        
        <div className="flex flex-col items-center gap-2 relative z-10">
          {/* Ícone da categoria com fundo */}
          <div className="flex items-center justify-center p-2 bg-white/20 rounded-full">
            {getCategoryIcon(data.category)}
            {isRoot && <Sparkles size={14} className="ml-1 opacity-70" />}
          </div>
          
          {/* Texto do nó */}
          <div className="text-center leading-tight">
            <div className="font-bold tracking-wide">
              {data.label || 'Tópico'}
            </div>
            {data.description && !isRoot && (
              <div className="text-xs opacity-80 mt-1 leading-relaxed">
                {data.description}
              </div>
            )}
          </div>
        </div>
        
        {/* Indicador de nível para nós não-raiz */}
        {!isRoot && level > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 shadow-lg">
            {level}
          </div>
        )}
        
        {/* Animação de pulso para nó raiz quando selecionado */}
        {isRoot && selected && (
          <div className="absolute inset-0 rounded-full border-3 border-white/60 animate-ping" />
        )}
      </div>
    </EnhancedNodeWrapper>
  );
};