// ============================================================================
// Specialized Nodes - Nós especializados para MindMap e Organograma
// ============================================================================
// Componentes específicos para diferentes tipos de diagramas
// ============================================================================

import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Brain,
  Lightbulb,
  Target,
  Star,
  Bookmark,
  Tag,
  Crown,
  Shield,
  Users,
  User,
  UserCheck,
  Building,
  Briefcase,
  GraduationCap,
  Award,
  Settings,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { UnifiedNodeData } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface SpecializedNodeProps extends NodeProps {
  data: UnifiedNodeData;
}

interface NodeWrapperProps {
  children: React.ReactNode;
  data: UnifiedNodeData;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  shape?: 'rectangle' | 'circle' | 'ellipse' | 'diamond' | 'hexagon' | 'cloud';
}

// ============================================================================
// COMPONENTES BASE
// ============================================================================

/**
 * Wrapper especializado para nós não-BPMN
 */
const SpecializedNodeWrapper: React.FC<NodeWrapperProps> = memo(({ 
  children, 
  data, 
  selected, 
  className = '', 
  style = {},
  shape = 'rectangle'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '');
  
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);
  
  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  }, []);
  
  const handleLabelSubmit = useCallback(() => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(label);
    }
  }, [label, data]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setLabel(data.label || '');
      setIsEditing(false);
    }
  }, [handleLabelSubmit, data.label]);
  
  const getShapeStyle = () => {
    const baseStyle = {
      backgroundColor: data.backgroundColor || '#ffffff',
      borderColor: selected ? '#3b82f6' : (data.borderColor || '#d1d5db'),
      borderWidth: selected ? 2 : 1,
      borderStyle: 'solid',
      boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
      ...style
    };
    
    switch (shape) {
      case 'circle':
        return {
          ...baseStyle,
          borderRadius: '50%',
          width: data.width || 80,
          height: data.height || 80
        };
      case 'ellipse':
        return {
          ...baseStyle,
          borderRadius: '50%',
          width: data.width || 120,
          height: data.height || 60
        };
      case 'diamond':
        return {
          ...baseStyle,
          transform: 'rotate(45deg)',
          width: data.width || 80,
          height: data.height || 80
        };
      case 'hexagon':
        return {
          ...baseStyle,
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          width: data.width || 100,
          height: data.height || 60
        };
      case 'cloud':
        return {
          ...baseStyle,
          borderRadius: '50px',
          width: data.width || 120,
          height: data.height || 60
        };
      default: // rectangle
        return {
          ...baseStyle,
          borderRadius: data.borderRadius || 8,
          width: data.width || 120,
          height: data.height || 60
        };
    }
  };
  
  return (
    <div className={`specialized-node ${className}`} onDoubleClick={handleDoubleClick}>
      <div style={getShapeStyle()}>
        {shape === 'diamond' ? (
          <div style={{ transform: 'rotate(-45deg)' }}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
      
      {/* Label editável */}
      <div className="node-label" style={{ 
        position: 'absolute',
        bottom: '-25px',
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        fontSize: '12px',
        color: '#374151',
        textAlign: 'center',
        minWidth: '60px',
        maxWidth: '150px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={handleLabelChange}
            onBlur={handleLabelSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              border: '1px solid #3b82f6',
              borderRadius: '2px',
              padding: '2px 4px',
              fontSize: '12px',
              textAlign: 'center',
              background: '#ffffff',
              width: '120px'
            }}
          />
        ) : (
          <span title={data.label}>{data.label || 'Sem rótulo'}</span>
        )}
      </div>
      
      {/* Handles para conexões */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#6b7280', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#6b7280', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#6b7280', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#6b7280', width: 8, height: 8 }}
      />
    </div>
  );
});

// ============================================================================
// MINDMAP NODES
// ============================================================================

/**
 * Nó Raiz do Mapa Mental
 */
export const MindMapRootNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="mindmap-root"
    shape="ellipse"
    style={{
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'bold',
      padding: '0 20px'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Brain size={24} />
      <span>{data.label || 'Tópico Principal'}</span>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó Ramo do Mapa Mental
 */
export const MindMapBranchNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => {
  const getColor = () => {
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    const level = data.level || 1;
    return colors[(level - 1) % colors.length];
  };
  
  return (
    <SpecializedNodeWrapper 
      data={data} 
      selected={selected} 
      className="mindmap-branch"
      shape="rectangle"
      style={{
        backgroundColor: getColor(),
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        padding: '0 16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Lightbulb size={18} />
        <span>{data.label || 'Ramo'}</span>
      </div>
    </SpecializedNodeWrapper>
  );
});

/**
 * Nó Folha do Mapa Mental
 */
export const MindMapLeafNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => {
  const getIcon = () => {
    switch (data.subType) {
      case 'idea': return <Lightbulb size={16} />;
      case 'goal': return <Target size={16} />;
      case 'important': return <Star size={16} />;
      case 'note': return <Bookmark size={16} />;
      case 'tag': return <Tag size={16} />;
      default: return <Lightbulb size={16} />;
    }
  };
  
  return (
    <SpecializedNodeWrapper 
      data={data} 
      selected={selected} 
      className="mindmap-leaf"
      shape="ellipse"
      style={{
        backgroundColor: '#f3f4f6',
        color: '#374151',
        fontSize: '12px',
        border: '2px solid #d1d5db',
        padding: '0 12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {getIcon()}
        <span>{data.label || 'Item'}</span>
      </div>
    </SpecializedNodeWrapper>
  );
});

// ============================================================================
// ORGANOGRAM NODES
// ============================================================================

/**
 * Nó CEO/Diretor
 */
export const OrgCEONode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="org-ceo"
    shape="rectangle"
    style={{
      backgroundColor: '#dc2626',
      color: 'white',
      fontSize: '14px',
      fontWeight: 'bold',
      padding: '0 16px',
      minHeight: '80px',
      flexDirection: 'column',
      gap: 4
    }}
  >
    <Crown size={24} />
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '12px', opacity: 0.9 }}>CEO</div>
      <div>{data.label || 'Diretor Executivo'}</div>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó Diretor
 */
export const OrgDirectorNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="org-director"
    shape="rectangle"
    style={{
      backgroundColor: '#ea580c',
      color: 'white',
      fontSize: '13px',
      fontWeight: '600',
      padding: '0 14px',
      minHeight: '70px',
      flexDirection: 'column',
      gap: 4
    }}
  >
    <Shield size={20} />
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', opacity: 0.9 }}>DIRETOR</div>
      <div>{data.label || 'Diretor'}</div>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó Gerente
 */
export const OrgManagerNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="org-manager"
    shape="rectangle"
    style={{
      backgroundColor: '#2563eb',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      padding: '0 12px',
      minHeight: '60px',
      flexDirection: 'column',
      gap: 4
    }}
  >
    <Users size={18} />
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '10px', opacity: 0.9 }}>GERENTE</div>
      <div>{data.label || 'Gerente'}</div>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó Funcionário
 */
export const OrgEmployeeNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="org-employee"
    shape="rectangle"
    style={{
      backgroundColor: '#059669',
      color: 'white',
      fontSize: '12px',
      fontWeight: '400',
      padding: '0 10px',
      minHeight: '50px',
      flexDirection: 'column',
      gap: 2
    }}
  >
    <User size={16} />
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '9px', opacity: 0.9 }}>FUNCIONÁRIO</div>
      <div>{data.label || 'Funcionário'}</div>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó Contratado/Terceirizado
 */
export const OrgContractorNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="org-contractor"
    shape="rectangle"
    style={{
      backgroundColor: '#7c3aed',
      color: 'white',
      fontSize: '12px',
      fontWeight: '400',
      padding: '0 10px',
      minHeight: '50px',
      flexDirection: 'column',
      gap: 2,
      borderStyle: 'dashed'
    }}
  >
    <UserCheck size={16} />
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '9px', opacity: 0.9 }}>CONTRATADO</div>
      <div>{data.label || 'Terceirizado'}</div>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó Departamento
 */
export const OrgDepartmentNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="org-department"
    shape="rectangle"
    style={{
      backgroundColor: '#0891b2',
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      padding: '0 16px',
      minHeight: '60px',
      flexDirection: 'column',
      gap: 4,
      borderRadius: '12px'
    }}
  >
    <Building size={20} />
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '10px', opacity: 0.9 }}>DEPARTAMENTO</div>
      <div>{data.label || 'Departamento'}</div>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó Equipe/Projeto
 */
export const OrgTeamNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="org-team"
    shape="ellipse"
    style={{
      backgroundColor: '#65a30d',
      color: 'white',
      fontSize: '12px',
      fontWeight: '500',
      padding: '0 12px',
      border: '2px solid #4d7c0f'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Briefcase size={16} />
      <span>{data.label || 'Equipe'}</span>
    </div>
  </SpecializedNodeWrapper>
));

// ============================================================================
// NÓDULOS ESPECIAIS ADICIONAIS
// ============================================================================

/**
 * Nó de Processo/Workflow
 */
export const ProcessNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="process-node"
    shape="hexagon"
    style={{
      backgroundColor: '#7c2d12',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Settings size={18} />
      <span>{data.label || 'Processo'}</span>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó de Dados/Informação
 */
export const DataNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="data-node"
    shape="diamond"
    style={{
      backgroundColor: '#1e40af',
      color: 'white',
      fontSize: '12px',
      fontWeight: '500'
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <BarChart3 size={16} />
      <span style={{ fontSize: '10px' }}>{data.label || 'Dados'}</span>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó de Decisão/Escolha
 */
export const DecisionNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="decision-node"
    shape="diamond"
    style={{
      backgroundColor: '#b91c1c',
      color: 'white',
      fontSize: '12px',
      fontWeight: '500'
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Target size={16} />
      <span style={{ fontSize: '10px' }}>{data.label || 'Decisão'}</span>
    </div>
  </SpecializedNodeWrapper>
));

/**
 * Nó de Documento
 */
export const DocumentNode: React.FC<SpecializedNodeProps> = memo(({ data, selected }) => (
  <SpecializedNodeWrapper 
    data={data} 
    selected={selected} 
    className="document-node"
    shape="rectangle"
    style={{
      backgroundColor: '#f3f4f6',
      color: '#374151',
      fontSize: '12px',
      fontWeight: '400',
      border: '2px solid #9ca3af',
      borderRadius: '4px',
      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <GraduationCap size={16} />
      <span>{data.label || 'Documento'}</span>
    </div>
  </SpecializedNodeWrapper>
));

// ============================================================================
// MAPA DE TIPOS DE NÓS ESPECIALIZADOS
// ============================================================================

export const specializedNodeTypes = {
  // MindMap
  'mindmap-root': MindMapRootNode,
  'mindmap-branch': MindMapBranchNode,
  'mindmap-leaf': MindMapLeafNode,
  
  // Organogram
  'org-ceo': OrgCEONode,
  'org-director': OrgDirectorNode,
  'org-manager': OrgManagerNode,
  'org-employee': OrgEmployeeNode,
  'org-contractor': OrgContractorNode,
  'org-department': OrgDepartmentNode,
  'org-team': OrgTeamNode,
  
  // Especiais
  'process': ProcessNode,
  'data': DataNode,
  'decision-special': DecisionNode,
  'document': DocumentNode
};

export default specializedNodeTypes;