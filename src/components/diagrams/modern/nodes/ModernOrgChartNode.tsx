/**
 * Nó Moderno para Organogramas
 * Componente especializado para hierarquias organizacionais
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Mail, Phone, MapPin } from 'lucide-react';

interface OrgChartNodeData {
  name: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  level?: 'executive' | 'manager' | 'employee' | 'intern';
  status?: 'active' | 'on-leave' | 'remote' | 'new';
  reportCount?: number;
  color?: string;
}

const ModernOrgChartNode: React.FC<NodeProps<OrgChartNodeData>> = ({ data, selected }) => {
  const {
    name,
    position,
    department,
    email,
    phone,
    location,
    avatar,
    level = 'employee',
    status = 'active',
    reportCount,
    color
  } = data;

  const getLevelStyles = () => {
    switch (level) {
      case 'executive':
        return {
          card: 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300',
          header: 'bg-purple-600 text-white',
          size: 'w-72 min-h-[140px]'
        };
      case 'manager':
        return {
          card: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300',
          header: 'bg-blue-600 text-white',
          size: 'w-64 min-h-[120px]'
        };
      case 'employee':
        return {
          card: 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300',
          header: 'bg-gray-600 text-white',
          size: 'w-56 min-h-[100px]'
        };
      case 'intern':
        return {
          card: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300',
          header: 'bg-green-600 text-white',
          size: 'w-48 min-h-[90px]'
        };
      default:
        return {
          card: 'bg-white border-gray-300',
          header: 'bg-gray-600 text-white',
          size: 'w-56 min-h-[100px]'
        };
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Ativo' },
      'on-leave': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Licença' },
      remote: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Remoto' },
      new: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Novo' }
    };
    
    return statusConfig[status] || statusConfig.active;
  };

  const levelStyles = getLevelStyles();
  const statusBadge = getStatusBadge();

  return (
    <div className="group">
      {/* Handle Superior - Para receber conexões de superiores */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors"
      />
      
      {/* Card Principal */}
      <Card 
        className={cn(
          levelStyles.card,
          levelStyles.size,
          'border-2 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden',
          selected && 'ring-2 ring-blue-500 ring-offset-2',
          'group-hover:scale-105'
        )}
        style={{
          borderColor: color || undefined,
          backgroundColor: selected && color ? `${color}20` : undefined
        }}
      >
        {/* Header com Nome e Cargo */}
        <div className={cn(levelStyles.header, 'px-3 py-2')}>
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-white text-gray-700 text-sm font-medium">
                {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{name}</h3>
              <p className="text-xs opacity-90 truncate">{position}</p>
            </div>
          </div>
        </div>
        
        {/* Corpo do Card */}
        <div className="p-3 space-y-2">
          {/* Departamento */}
          {department && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <User className="w-3 h-3" />
              <span className="truncate">{department}</span>
            </div>
          )}
          
          {/* Informações de Contato */}
          <div className="space-y-1">
            {email && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Phone className="w-3 h-3" />
                <span className="truncate">{phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
          
          {/* Footer com Status e Relatórios */}
          <div className="flex items-center justify-between pt-2">
            <Badge 
              variant="outline" 
              className={cn('text-xs', statusBadge.color)}
            >
              {statusBadge.label}
            </Badge>
            
            {reportCount !== undefined && reportCount > 0 && (
              <span className="text-xs text-gray-500">
                {reportCount} relatório{reportCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        {/* Indicador de Seleção */}
        {selected && (
          <div 
            className="absolute -inset-1 rounded-lg border-2 border-dashed opacity-50"
            style={{ borderColor: color || '#3b82f6' }}
          />
        )}
      </Card>
      
      {/* Handle Inferior - Para conectar subordinados */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors"
      />
      
      {/* Handles Laterais - Para conexões horizontais (mesmo nível) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 border border-white bg-gray-300 hover:bg-green-500 transition-colors"
        style={{ top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 border border-white bg-gray-300 hover:bg-green-500 transition-colors"
        style={{ top: '50%' }}
      />
      
      {/* Tooltip com Informações Completas */}
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 max-w-xs">
        <div className="font-medium">{name}</div>
        <div>{position}</div>
        {department && <div className="text-gray-300">{department}</div>}
        {email && <div className="text-gray-300">{email}</div>}
      </div>
    </div>
  );
};

export default memo(ModernOrgChartNode);
export { ModernOrgChartNode };