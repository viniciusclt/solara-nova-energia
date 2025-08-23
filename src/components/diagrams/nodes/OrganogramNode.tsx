// ============================================================================
// OrganogramNode - Componente especializado para nós de organograma
// ============================================================================

import React, { memo, useCallback, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseNode, BaseNodeProps } from './BaseNode';
import { OrganogramNodeData, DiagramNode } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Users, 
  Plus, 
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDiagramStore } from '../stores/useDiagramStore';

// ============================================================================
// Types
// ============================================================================

export interface OrganogramNodeProps extends Omit<BaseNodeProps, 'data'> {
  data: OrganogramNodeData;
}

// ============================================================================
// Utilitários
// ============================================================================

const getLevelColor = (level: number): string => {
  const colors = {
    0: 'bg-purple-100 border-purple-300 text-purple-800', // CEO
    1: 'bg-blue-100 border-blue-300 text-blue-800',       // Director
    2: 'bg-green-100 border-green-300 text-green-800',    // Manager
    3: 'bg-yellow-100 border-yellow-300 text-yellow-800', // Team Lead
    4: 'bg-gray-100 border-gray-300 text-gray-800',       // Employee
  };
  return colors[level as keyof typeof colors] || colors[4];
};

const getPositionIcon = (level: number) => {
  if (level === 0) return <User className="w-4 h-4" />;
  if (level === 1) return <Building className="w-4 h-4" />;
  if (level === 2) return <Users className="w-4 h-4" />;
  return <User className="w-4 h-4" />;
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============================================================================
// Componente Principal
// ============================================================================

export const OrganogramNode: React.FC<OrganogramNodeProps> = memo(({
  id,
  data,
  selected,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { addNode, updateNode } = useDiagramStore();

  const handleAddSubordinate = useCallback(async () => {
    const newNode: Omit<DiagramNode, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      type: 'organogram',
      position: { x: 0, y: 150 }, // Será ajustado pelo layout
      data: {
        category: 'organogram' as const,
        label: 'Novo Funcionário',
        position: 'Cargo',
        department: data.department,
        level: data.level + 1,
        email: '',
        phone: '',
        skills: [],
        reports: []
      },
      category: 'organogram' as const
    };
    
    await addNode(newNode);
    
    // Atualizar o nó atual para incluir o novo subordinado
    const updatedReports = [...(data.reports || []), `new-node-${Date.now()}`];
    await updateNode(id, {
      data: {
        ...data,
        reports: updatedReports
      }
    });
  }, [addNode, updateNode, id, data]);

  const handleEdit = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const handleSave = useCallback(async (field: string, value: string) => {
    await updateNode(id, {
      data: {
        ...data,
        [field]: value
      }
    });
    setIsEditing(false);
  }, [updateNode, id, data]);

  const levelColorClass = getLevelColor(data.level);
  const positionIcon = getPositionIcon(data.level);
  const initials = getInitials(data.label);
  const subordinateCount = data.reports?.length || 0;

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      className={cn(
        'min-w-[280px] max-w-[320px]',
        'transition-all duration-200',
        selected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      handles={{
        top: data.level > 0 ? 'target' : false,
        bottom: subordinateCount > 0 ? 'source' : false
      }}
      {...props}
    >
      {/* Handle superior para conexão com supervisor */}
      {data.level > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-blue-500 border-2 border-white"
        />
      )}

      <Card className={cn(
        'w-full border-2 shadow-lg',
        levelColorClass,
        'hover:shadow-xl transition-shadow duration-200'
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={data.avatar} alt={data.label} />
                <AvatarFallback className="bg-white text-gray-700 font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    defaultValue={data.label}
                    className="text-sm font-semibold"
                    onBlur={(e) => handleSave('label', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSave('label', e.currentTarget.value);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                    {data.label}
                  </h3>
                )}
                
                <div className="flex items-center space-x-1 mt-1">
                  {positionIcon}
                  <span className="text-xs font-medium">
                    {data.position}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-6 w-6 p-0 hover:bg-white/50"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              
              {data.level < 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSubordinate}
                  className="h-6 w-6 p-0 hover:bg-white/50"
                  title="Adicionar subordinado"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-2">
          {/* Informações de contato */}
          {(data.email || data.phone) && (
            <div className="space-y-1">
              {data.email && (
                <div className="flex items-center space-x-2 text-xs">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{data.email}</span>
                </div>
              )}
              {data.phone && (
                <div className="flex items-center space-x-2 text-xs">
                  <Phone className="w-3 h-3" />
                  <span>{data.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Departamento */}
          <div className="flex items-center space-x-2 text-xs">
            <Building className="w-3 h-3" />
            <span className="font-medium">{data.department}</span>
          </div>

          {/* Divisor */}
          <hr className="border-gray-300" />

          {/* Informações de equipe */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Users className="w-3 h-3" />
              <span>
                {subordinateCount} subordinado{subordinateCount !== 1 ? 's' : ''}
              </span>
            </div>
            
            <Badge 
              variant="secondary" 
              className="text-xs px-2 py-0.5 bg-white/70"
            >
              {data.level === 0 ? 'CEO' :
               data.level === 1 ? 'Diretor' :
               data.level === 2 ? 'Gerente' :
               data.level === 3 ? 'Líder' : 'Funcionário'}
            </Badge>
          </div>

          {/* Skills (se houver) */}
          {data.skills && data.skills.length > 0 && (
            <div className="space-y-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-1 text-xs font-medium hover:text-gray-700"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <span>Habilidades ({data.skills.length})</span>
              </button>
              
              {isExpanded && (
                <div className="flex flex-wrap gap-1">
                  {data.skills.slice(0, 3).map((skill, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs px-1.5 py-0.5 bg-white/50"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {data.skills.length > 3 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-1.5 py-0.5 bg-white/50"
                    >
                      +{data.skills.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ID do funcionário (se houver) */}
          {data.employeeId && (
            <div className="text-xs text-gray-600">
              ID: {data.employeeId}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Handle inferior para conexão com subordinados */}
      {subordinateCount > 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-green-500 border-2 border-white"
        />
      )}
    </BaseNode>
  );
});

OrganogramNode.displayName = 'OrganogramNode';

export default OrganogramNode;