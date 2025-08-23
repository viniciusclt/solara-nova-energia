// ============================================================================
// BPMN Nodes - Componentes de nós BPMN unificados
// ============================================================================
// Implementação completa dos nós BPMN 2.0 para o editor unificado
// ============================================================================

import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Play,
  Square,
  Diamond,
  Circle,
  Hexagon,
  Triangle,
  Clock,
  Mail,
  Zap,
  AlertTriangle,
  ArrowUp,
  X,
  User,
  Settings,
  Code,
  FileText,
  Database,
  Send,
  Download,
  Timer,
  MessageSquare,
  Radio,
  AlertCircle,
  TrendingUp,
  Link,
  Layers,
  StopCircle,
  XCircle
} from 'lucide-react';
import { UnifiedNodeData } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface BPMNNodeProps extends NodeProps {
  data: UnifiedNodeData;
}

interface NodeWrapperProps {
  children: React.ReactNode;
  data: UnifiedNodeData;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// COMPONENTES BASE
// ============================================================================

/**
 * Wrapper base para todos os nós BPMN
 */
const NodeWrapper: React.FC<NodeWrapperProps> = memo(({ 
  children, 
  data, 
  selected, 
  className = '', 
  style = {} 
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
  
  const baseStyle = {
    minWidth: data.width || 100,
    minHeight: data.height || 50,
    backgroundColor: data.backgroundColor || '#ffffff',
    borderColor: selected ? '#3b82f6' : (data.borderColor || '#d1d5db'),
    borderWidth: selected ? 2 : 1,
    borderStyle: 'solid',
    borderRadius: data.borderRadius || 4,
    boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
    ...style
  };
  
  return (
    <div 
      className={`bpmn-node ${className}`}
      style={baseStyle}
      onDoubleClick={handleDoubleClick}
    >
      {children}
      
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
        minWidth: '60px'
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
              background: '#ffffff'
            }}
          />
        ) : (
          <span>{data.label || 'Sem rótulo'}</span>
        )}
      </div>
    </div>
  );
});

/**
 * Handle padrão para conexões
 */
const NodeHandles: React.FC<{ type?: 'source' | 'target' | 'both' }> = memo(({ type = 'both' }) => (
  <>
    {(type === 'target' || type === 'both') && (
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#6b7280', width: 8, height: 8 }}
      />
    )}
    {(type === 'source' || type === 'both') && (
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#6b7280', width: 8, height: 8 }}
      />
    )}
  </>
));

// ============================================================================
// EVENTOS BPMN
// ============================================================================

/**
 * Evento de Início
 */
export const StartEventNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="start-event">
    <div style={{
      width: 50,
      height: 50,
      borderRadius: '50%',
      backgroundColor: '#10b981',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <Play size={20} />
    </div>
    <NodeHandles type="source" />
  </NodeWrapper>
));

/**
 * Evento de Fim
 */
export const EndEventNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="end-event">
    <div style={{
      width: 50,
      height: 50,
      borderRadius: '50%',
      backgroundColor: '#ef4444',
      border: '3px solid #dc2626',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <Square size={16} fill="currentColor" />
    </div>
    <NodeHandles type="target" />
  </NodeWrapper>
));

/**
 * Evento Intermediário
 */
export const IntermediateEventNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => {
  const getIcon = () => {
    switch (data.subType) {
      case 'timer': return <Clock size={16} />;
      case 'message': return <Mail size={16} />;
      case 'signal': return <Radio size={16} />;
      case 'error': return <AlertCircle size={16} />;
      case 'escalation': return <TrendingUp size={16} />;
      case 'compensation': return <ArrowUp size={16} />;
      case 'conditional': return <Diamond size={16} />;
      case 'link': return <Link size={16} />;
      case 'multiple': return <Layers size={16} />;
      default: return <Circle size={16} />;
    }
  };
  
  const getColor = () => {
    switch (data.subType) {
      case 'timer': return '#f59e0b';
      case 'message': return '#3b82f6';
      case 'signal': return '#8b5cf6';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  return (
    <NodeWrapper data={data} selected={selected} className="intermediate-event">
      <div style={{
        width: 50,
        height: 50,
        borderRadius: '50%',
        backgroundColor: getColor(),
        border: '2px solid #ffffff',
        outline: `2px solid ${getColor()}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        {getIcon()}
      </div>
      <NodeHandles />
    </NodeWrapper>
  );
});

// ============================================================================
// ATIVIDADES BPMN
// ============================================================================

/**
 * Tarefa Genérica
 */
export const TaskNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="task">
    <div style={{
      width: 100,
      height: 60,
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '14px',
      fontWeight: 500
    }}>
      <FileText size={20} />
    </div>
    <NodeHandles />
  </NodeWrapper>
));

/**
 * Tarefa de Usuário
 */
export const UserTaskNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="user-task">
    <div style={{
      width: 100,
      height: 60,
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      position: 'relative'
    }}>
      <User size={20} />
      <div style={{
        position: 'absolute',
        top: 4,
        left: 4,
        width: 12,
        height: 12,
        backgroundColor: '#1d4ed8',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <User size={8} />
      </div>
    </div>
    <NodeHandles />
  </NodeWrapper>
));

/**
 * Tarefa de Serviço
 */
export const ServiceTaskNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="service-task">
    <div style={{
      width: 100,
      height: 60,
      backgroundColor: '#6366f1',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      position: 'relative'
    }}>
      <Settings size={20} />
      <div style={{
        position: 'absolute',
        top: 4,
        left: 4,
        width: 12,
        height: 12,
        backgroundColor: '#4f46e5',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Settings size={8} />
      </div>
    </div>
    <NodeHandles />
  </NodeWrapper>
));

/**
 * Tarefa de Script
 */
export const ScriptTaskNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="script-task">
    <div style={{
      width: 100,
      height: 60,
      backgroundColor: '#8b5cf6',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      position: 'relative'
    }}>
      <Code size={20} />
      <div style={{
        position: 'absolute',
        top: 4,
        left: 4,
        width: 12,
        height: 12,
        backgroundColor: '#7c3aed',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Code size={8} />
      </div>
    </div>
    <NodeHandles />
  </NodeWrapper>
));

/**
 * Tarefa Manual
 */
export const ManualTaskNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="manual-task">
    <div style={{
      width: 100,
      height: 60,
      backgroundColor: '#f59e0b',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      position: 'relative'
    }}>
      <User size={20} />
      <div style={{
        position: 'absolute',
        top: 4,
        left: 4,
        width: 12,
        height: 12,
        backgroundColor: '#d97706',
        borderRadius: 2
      }} />
    </div>
    <NodeHandles />
  </NodeWrapper>
));

/**
 * Regra de Negócio
 */
export const BusinessRuleTaskNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="business-rule-task">
    <div style={{
      width: 100,
      height: 60,
      backgroundColor: '#06b6d4',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      position: 'relative'
    }}>
      <Database size={20} />
      <div style={{
        position: 'absolute',
        top: 4,
        left: 4,
        width: 12,
        height: 12,
        backgroundColor: '#0891b2',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <FileText size={8} />
      </div>
    </div>
    <NodeHandles />
  </NodeWrapper>
));

/**
 * Tarefa de Envio
 */
export const SendTaskNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="send-task">
    <div style={{
      width: 100,
      height: 60,
      backgroundColor: '#84cc16',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      position: 'relative'
    }}>
      <Send size={20} />
      <div style={{
        position: 'absolute',
        top: 4,
        left: 4,
        width: 12,
        height: 12,
        backgroundColor: '#65a30d',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Send size={8} />
      </div>
    </div>
    <NodeHandles />
  </NodeWrapper>
));

/**
 * Tarefa de Recebimento
 */
export const ReceiveTaskNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="receive-task">
    <div style={{
      width: 100,
      height: 60,
      backgroundColor: '#10b981',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      position: 'relative'
    }}>
      <Download size={20} />
      <div style={{
        position: 'absolute',
        top: 4,
        left: 4,
        width: 12,
        height: 12,
        backgroundColor: '#059669',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Download size={8} />
      </div>
    </div>
    <NodeHandles />
  </NodeWrapper>
));

// ============================================================================
// GATEWAYS BPMN
// ============================================================================

/**
 * Gateway Base
 */
const GatewayBase: React.FC<{
  data: UnifiedNodeData;
  selected?: boolean;
  children: React.ReactNode;
  color: string;
  className: string;
}> = memo(({ data, selected, children, color, className }) => (
  <NodeWrapper data={data} selected={selected} className={className}>
    <div style={{
      width: 60,
      height: 60,
      backgroundColor: color,
      transform: 'rotate(45deg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div style={{ transform: 'rotate(-45deg)' }}>
        {children}
      </div>
    </div>
    <NodeHandles />
  </NodeWrapper>
));

/**
 * Gateway Exclusivo (XOR)
 */
export const ExclusiveGatewayNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <GatewayBase data={data} selected={selected} color="#f59e0b" className="exclusive-gateway">
    <X size={20} />
  </GatewayBase>
));

/**
 * Gateway Inclusivo (OR)
 */
export const InclusiveGatewayNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <GatewayBase data={data} selected={selected} color="#06b6d4" className="inclusive-gateway">
    <Circle size={20} />
  </GatewayBase>
));

/**
 * Gateway Paralelo (AND)
 */
export const ParallelGatewayNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <GatewayBase data={data} selected={selected} color="#8b5cf6" className="parallel-gateway">
    <div style={{
      width: 20,
      height: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 'bold'
    }}>
      +
    </div>
  </GatewayBase>
));

/**
 * Gateway Complexo
 */
export const ComplexGatewayNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <GatewayBase data={data} selected={selected} color="#6b7280" className="complex-gateway">
    <Hexagon size={20} />
  </GatewayBase>
));

/**
 * Gateway Baseado em Evento
 */
export const EventBasedGatewayNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <GatewayBase data={data} selected={selected} color="#10b981" className="event-based-gateway">
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2
    }}>
      <Circle size={8} />
      <Circle size={8} />
    </div>
  </GatewayBase>
));

// ============================================================================
// SUBPROCESSOS
// ============================================================================

/**
 * Subprocesso
 */
export const SubprocessNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="subprocess">
    <div style={{
      width: 120,
      height: 80,
      backgroundColor: '#84cc16',
      borderRadius: 8,
      border: '2px solid #65a30d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      position: 'relative'
    }}>
      <Layers size={24} />
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 12,
        height: 12,
        backgroundColor: '#ffffff',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#84cc16'
      }}>
        <div style={{
          width: 8,
          height: 2,
          backgroundColor: 'currentColor'
        }} />
        <div style={{
          position: 'absolute',
          width: 2,
          height: 8,
          backgroundColor: 'currentColor'
        }} />
      </div>
    </div>
    <NodeHandles />
  </NodeWrapper>
));

/**
 * Atividade de Chamada
 */
export const CallActivityNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="call-activity">
    <div style={{
      width: 120,
      height: 80,
      backgroundColor: '#f97316',
      borderRadius: 8,
      border: '3px solid #ea580c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4
      }}>
        <Layers size={20} />
        <div style={{
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          CALL
        </div>
      </div>
    </div>
    <NodeHandles />
  </NodeWrapper>
));

// ============================================================================
// EVENTOS DE TÉRMINO
// ============================================================================

/**
 * Evento de Término
 */
export const TerminateEventNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="terminate-event">
    <div style={{
      width: 50,
      height: 50,
      borderRadius: '50%',
      backgroundColor: '#ef4444',
      border: '3px solid #dc2626',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <StopCircle size={20} fill="currentColor" />
    </div>
    <NodeHandles type="target" />
  </NodeWrapper>
));

/**
 * Evento de Cancelamento
 */
export const CancelEventNode: React.FC<BPMNNodeProps> = memo(({ data, selected }) => (
  <NodeWrapper data={data} selected={selected} className="cancel-event">
    <div style={{
      width: 50,
      height: 50,
      borderRadius: '50%',
      backgroundColor: '#6b7280',
      border: '3px solid #4b5563',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <XCircle size={20} />
    </div>
    <NodeHandles type="target" />
  </NodeWrapper>
));

// ============================================================================
// MAPA DE TIPOS DE NÓS
// ============================================================================

export const bpmnNodeTypes = {
  // Eventos
  'start': StartEventNode,
  'end': EndEventNode,
  'intermediate': IntermediateEventNode,
  'timer': IntermediateEventNode,
  'message': IntermediateEventNode,
  'signal': IntermediateEventNode,
  'error': IntermediateEventNode,
  'escalation': IntermediateEventNode,
  'compensation': IntermediateEventNode,
  'conditional': IntermediateEventNode,
  'link': IntermediateEventNode,
  'multiple': IntermediateEventNode,
  'parallel-multiple': IntermediateEventNode,
  'terminate': TerminateEventNode,
  'cancel': CancelEventNode,
  
  // Atividades
  'task': TaskNode,
  'user-task': UserTaskNode,
  'service-task': ServiceTaskNode,
  'script-task': ScriptTaskNode,
  'manual-task': ManualTaskNode,
  'business-rule': BusinessRuleTaskNode,
  'receive-task': ReceiveTaskNode,
  'send-task': SendTaskNode,
  
  // Gateways
  'decision': ExclusiveGatewayNode,
  'exclusive': ExclusiveGatewayNode,
  'inclusive': InclusiveGatewayNode,
  'parallel': ParallelGatewayNode,
  'complex': ComplexGatewayNode,
  'event-based': EventBasedGatewayNode,
  
  // Subprocessos
  'subprocess': SubprocessNode,
  'call-activity': CallActivityNode
};

export default bpmnNodeTypes;