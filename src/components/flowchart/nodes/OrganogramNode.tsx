// ============================================================================
// OrganogramNode - Nó específico para organogramas hierárquicos
// ============================================================================

import React from 'react';
import { NodeProps } from 'reactflow';
import { CustomNodeData } from '../types';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';
import { EditableLabel } from './EditableLabel';
import { User, Users, Crown, Shield, Briefcase } from 'lucide-react';

interface OrganogramNodeData extends CustomNodeData {
  position?: 'ceo' | 'director' | 'manager' | 'employee' | 'team';
  department?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export const OrganogramNode: React.FC<NodeProps<OrganogramNodeData>> = ({ 
  id, 
  data, 
  selected, 
  xPos, 
  yPos 
}) => {
  // Função para obter ícone baseado na posição hierárquica
  const getPositionIcon = () => {
    switch (data.position) {
      case 'ceo':
        return Crown;
      case 'director':
        return Shield;
      case 'manager':
        return Briefcase;
      case 'team':
        return Users;
      default:
        return User;
    }
  };

  // Função para obter cores baseadas na posição
  const getPositionColors = () => {
    switch (data.position) {
      case 'ceo':
        return {
          bg: 'bg-purple-100',
          border: 'border-purple-300',
          text: 'text-purple-800',
          icon: 'text-purple-600'
        };
      case 'director':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-800',
          icon: 'text-blue-600'
        };
      case 'manager':
        return {
          bg: 'bg-green-100',
          border: 'border-green-300',
          text: 'text-green-800',
          icon: 'text-green-600'
        };
      case 'team':
        return {
          bg: 'bg-orange-100',
          border: 'border-orange-300',
          text: 'text-orange-800',
          icon: 'text-orange-600'
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-800',
          icon: 'text-gray-600'
        };
    }
  };

  const PositionIcon = getPositionIcon();
  const colors = getPositionColors();

  const nodeStyle = {
    backgroundColor: data.backgroundColor || '#ffffff',
    borderColor: data.borderColor || '#e5e7eb',
    borderWidth: data.borderWidth || 2,
    borderRadius: data.borderRadius || 8,
    width: data.width || 200,
    height: data.height || 'auto',
    padding: data.padding || 12,
    color: data.textColor || '#1f2937',
    fontSize: data.fontSize || 14,
    fontWeight: data.fontWeight || 'normal',
    boxShadow: selected ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out'
  };

  return (
    <EnhancedNodeWrapper
      id={id}
      data={data}
      selected={selected}
      nodeType="organogram"
      className={`organogram-node ${colors.bg} ${colors.border} ${colors.text}`}
      style={nodeStyle}
    >
      <div className="flex flex-col space-y-2">
        {/* Header com ícone e posição */}
        <div className="flex items-center space-x-2">
          <PositionIcon className={`w-5 h-5 ${colors.icon}`} />
          <div className="flex-1">
            <EditableLabel
              value={data.label || 'Novo Cargo'}
              onChange={(newLabel) => {
                // Callback para atualizar o label será implementado pelo EnhancedNodeWrapper
              }}
              className={`font-medium ${colors.text}`}
              placeholder="Nome do cargo"
            />
          </div>
        </div>

        {/* Informações do departamento */}
        {data.department && (
          <div className={`text-xs ${colors.text} opacity-75`}>
            {data.department}
          </div>
        )}

        {/* Descrição opcional */}
        {data.description && (
          <div className={`text-xs ${colors.text} opacity-60 mt-1`}>
            {data.description}
          </div>
        )}

        {/* Informações de contato */}
        <div className="space-y-1">
          {data.email && (
            <div className={`text-xs ${colors.text} opacity-75`}>
              📧 {data.email}
            </div>
          )}
          {data.phone && (
            <div className={`text-xs ${colors.text} opacity-75`}>
              📞 {data.phone}
            </div>
          )}
        </div>

        {/* Avatar placeholder */}
        {data.avatar && (
          <div className="flex justify-center mt-2">
            <div className={`w-8 h-8 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}>
              <User className={`w-4 h-4 ${colors.icon}`} />
            </div>
          </div>
        )}

        {/* Status indicator */}
        {data.status && (
          <div className="flex justify-center mt-2">
            <div className={`w-2 h-2 rounded-full ${
              data.status === 'completed' ? 'bg-green-500' :
              data.status === 'in-progress' ? 'bg-yellow-500' :
              data.status === 'pending' ? 'bg-gray-400' :
              'bg-red-500'
            }`} />
          </div>
        )}
      </div>
    </EnhancedNodeWrapper>
  );
};

export default OrganogramNode;