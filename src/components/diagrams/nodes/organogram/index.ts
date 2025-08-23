// ============================================================================
// Organogram Nodes - Componentes de nós para organogramas
// ============================================================================

import React, { memo } from 'react';
import {
  Crown,
  Shield,
  Users,
  User,
  Building,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { BaseNode, createNodeComponent } from '../BaseNode';

// ============================================================================
// Tipos e Interfaces
// ============================================================================

interface OrganogramNodeData {
  name: string;
  position: string;
  department?: string;
  level: number; // 0 = CEO, 1 = Director, 2 = Manager, 3+ = Employee
  avatar?: string;
  email?: string;
  phone?: string;
  location?: string;
  employeeCount?: number;
  status?: 'active' | 'inactive' | 'vacation' | 'remote';
  skills?: string[];
  editable?: boolean;
  isManager?: boolean;
}

interface OrganogramNodeProps extends NodeProps {
  data: OrganogramNodeData;
}

// ============================================================================
// Configurações de Estilo por Nível
// ============================================================================

const LEVEL_STYLES = {
  0: { // CEO
    bg: 'bg-gradient-to-br from-purple-500 to-purple-700',
    border: 'border-purple-600',
    text: 'text-white',
    icon: Crown,
    size: 'large'
  },
  1: { // Director
    bg: 'bg-gradient-to-br from-blue-500 to-blue-700',
    border: 'border-blue-600',
    text: 'text-white',
    icon: Shield,
    size: 'large'
  },
  2: { // Manager
    bg: 'bg-gradient-to-br from-green-500 to-green-700',
    border: 'border-green-600',
    text: 'text-white',
    icon: UserCheck,
    size: 'medium'
  },
  3: { // Team Lead
    bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    border: 'border-orange-500',
    text: 'text-white',
    icon: Users,
    size: 'medium'
  },
  default: { // Employee
    bg: 'bg-gradient-to-br from-gray-400 to-gray-600',
    border: 'border-gray-500',
    text: 'text-white',
    icon: User,
    size: 'small'
  }
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-300',
  inactive: 'bg-gray-100 text-gray-800 border-gray-300',
  vacation: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  remote: 'bg-blue-100 text-blue-800 border-blue-300'
};

const STATUS_LABELS = {
  active: 'Ativo',
  inactive: 'Inativo',
  vacation: 'Férias',
  remote: 'Remoto'
};

// ============================================================================
// Componente Base para Nós de Organograma
// ============================================================================

interface OrganogramNodeProps {
  id: string;
  data: OrganogramNodeData;
  selected: boolean;
  level?: number;
  className?: string;
}

const OrganogramNode: React.FC<OrganogramNodeProps> = memo(({
  id,
  data,
  selected,
  level = data.level,
  className
}) => {
  const levelStyle = LEVEL_STYLES[level as keyof typeof LEVEL_STYLES] || LEVEL_STYLES.default;
  const IconComponent = levelStyle.icon;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getHandles = () => {
    if (level === 0) {
      // CEO - apenas saída para baixo
      return { bottom: 'source' as const };
    } else {
      // Outros níveis - entrada de cima e saída para baixo
      return {
        top: 'target' as const,
        bottom: 'source' as const
      };
    }
  };

  const getSize = () => {
    if (level === 0) return 'large';
    if (level <= 2) return 'medium';
    return 'small';
  };

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      handles={getHandles()}
      shape="rectangle"
      size={getSize()}
      className={cn(
        levelStyle.bg,
        levelStyle.border,
        'rounded-lg',
        className
      )}
      editable
      deletable={level > 0}
    >

      {/* Header com Avatar e Informações Básicas */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className={cn(
              'border-2 border-white shadow-sm',
              getSize() === 'large' ? 'h-12 w-12' : getSize() === 'medium' ? 'h-10 w-10' : 'h-8 w-8'
            )}>
              <AvatarImage src={data.avatar} alt={data.name} />
              <AvatarFallback className="bg-white text-gray-700 font-semibold">
                {getInitials(data.name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Ícone de Nível */}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
              <IconComponent className="h-3 w-3 text-gray-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-semibold text-sm leading-tight truncate',
              levelStyle.text
            )}>
              {data.name}
            </h3>
            
            <p className={cn(
              'text-xs opacity-90 truncate',
              levelStyle.text
            )}>
              {data.position}
            </p>
            
            {data.department && (
              <p className={cn(
                'text-xs opacity-75 truncate',
                levelStyle.text
              )}>
                {data.department}
              </p>
            )}
          </div>
        </div>

        {/* Status e Informações Adicionais */}
        <div className="space-y-2">
          {/* Status */}
          {data.status && (
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs px-2 py-1',
                STATUS_COLORS[data.status]
              )}
            >
              {STATUS_LABELS[data.status]}
            </Badge>
          )}

          {/* Contagem de Funcionários (para managers) */}
          {data.isManager && data.employeeCount !== undefined && (
            <div className="flex items-center gap-1 text-xs text-white/80">
              <Users className="h-3 w-3" />
              <span>{data.employeeCount} funcionário{data.employeeCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Informações de Contato */}
          <div className="space-y-1">
            {data.email && (
              <div className="flex items-center gap-1 text-xs text-white/80">
                <Mail className="h-3 w-3" />
                <span className="truncate">{data.email}</span>
              </div>
            )}
            
            {data.phone && (
              <div className="flex items-center gap-1 text-xs text-white/80">
                <Phone className="h-3 w-3" />
                <span>{data.phone}</span>
              </div>
            )}
            
            {data.location && (
              <div className="flex items-center gap-1 text-xs text-white/80">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{data.location}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  {skill}
                </Badge>
              ))}
              {data.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{data.skills.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </BaseNode>
  );
};

// ============================================================================
// Nó CEO
// ============================================================================

const CEONode: React.FC<OrganogramNodeProps> = memo(({ id, data, selected }) => {
  return (
    <OrganogramNode
      id={id}
      data={{ ...data, isManager: true }}
      selected={selected}
      level={0}
    />
  );
});

CEONode.displayName = 'OrganogramCEONode';

// ============================================================================
// Nó Diretor
// ============================================================================

const DirectorNode: React.FC<OrganogramNodeProps> = memo(({ id, data, selected }) => {
  return (
    <OrganogramNode
      id={id}
      data={{ ...data, isManager: true }}
      selected={selected}
      level={1}
    />
  );
});

DirectorNode.displayName = 'OrganogramDirectorNode';

// ============================================================================
// Nó Gerente
// ============================================================================

const ManagerNode: React.FC<OrganogramNodeProps> = memo(({ id, data, selected }) => {
  return (
    <OrganogramNode
      id={id}
      data={{ ...data, isManager: true }}
      selected={selected}
      level={2}
    />
  );
});

ManagerNode.displayName = 'OrganogramManagerNode';

// ============================================================================
// Nó Líder de Equipe
// ============================================================================

const TeamLeadNode: React.FC<OrganogramNodeProps> = memo(({ id, data, selected }) => {
  return (
    <OrganogramNode
      id={id}
      data={{ ...data, isManager: true }}
      selected={selected}
      level={3}
    />
  );
});

TeamLeadNode.displayName = 'OrganogramTeamLeadNode';

// ============================================================================
// Nó Funcionário
// ============================================================================

const EmployeeNode: React.FC<OrganogramNodeProps> = memo(({ id, data, selected }) => {
  return (
    <OrganogramNode
      id={id}
      data={{ ...data, isManager: false }}
      selected={selected}
      level={4}
    />
  );
});

EmployeeNode.displayName = 'OrganogramEmployeeNode';

// ============================================================================
// Nó Departamento
// ============================================================================

const DepartmentNode: React.FC<OrganogramNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      handles={{ top: 'target', bottom: 'source' }}
      shape="rectangle"
      size="large"
      className="bg-gradient-to-br from-indigo-400 to-indigo-600 border-indigo-500 text-white w-64 min-h-[100px] rounded-lg"
      editable
      deletable
    >
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building className="h-6 w-6" />
          <h3 className="font-bold text-lg">{data.name}</h3>
        </div>
        
        {data.employeeCount !== undefined && (
          <div className="flex items-center justify-center gap-1 text-sm opacity-90">
            <Users className="h-4 w-4" />
            <span>{data.employeeCount} funcionário{data.employeeCount !== 1 ? 's' : ''}</span>
          </div>
        )}
        
        {data.location && (
          <div className="flex items-center justify-center gap-1 text-sm opacity-75 mt-1">
            <MapPin className="h-3 w-3" />
            <span>{data.location}</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
});

DepartmentNode.displayName = 'OrganogramDepartmentNode';

// ============================================================================
// Exports
// ============================================================================

export const OrganogramNodes = {
  CEONode,
  DirectorNode,
  ManagerNode,
  TeamLeadNode,
  EmployeeNode,
  DepartmentNode
};

export {
  CEONode,
  DirectorNode,
  ManagerNode,
  TeamLeadNode,
  EmployeeNode,
  DepartmentNode
};

export type {
  OrganogramNodeData,
  OrganogramNodeProps
};