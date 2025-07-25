import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Wrench,
  Zap,
  Battery,
  Settings
} from 'lucide-react';

// Import dos componentes de gerenciamento
import { ModuleManagerAdvanced } from './ModuleManagerAdvanced';
import { InverterManagerAdvanced } from './InverterManagerAdvanced';

interface EquipmentManagementPageProps {
  onBackToMenu: () => void;
}

export function EquipmentManagementPage({ onBackToMenu }: EquipmentManagementPageProps) {
  const [activeTab, setActiveTab] = useState('modules');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const equipmentCategories = [
    {
      id: 'modules',
      name: 'Módulos Solares',
      icon: Zap,
      description: 'Gerenciar painéis fotovoltaicos',
      count: 45,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'inverters',
      name: 'Inversores',
      icon: Settings,
      description: 'Gerenciar inversores solares',
      count: 23,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'batteries',
      name: 'Baterias',
      icon: Battery,
      description: 'Gerenciar sistemas de armazenamento',
      count: 12,
      color: 'from-purple-500 to-violet-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToMenu}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Menu
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Gerenciamento de Equipamentos
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gerencie módulos, inversores e baterias
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Equipamento
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {equipmentCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  activeTab === category.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setActiveTab(category.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {category.name}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color}`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{category.count}</div>
                  <p className="text-xs text-muted-foreground">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Equipment Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Módulos Solares
            </TabsTrigger>
            <TabsTrigger value="inverters" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Inversores
            </TabsTrigger>
            <TabsTrigger value="batteries" className="flex items-center gap-2">
              <Battery className="h-4 w-4" />
              Baterias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <ModuleManagerAdvanced />
          </TabsContent>

          <TabsContent value="inverters" className="space-y-6">
            <InverterManagerAdvanced />
          </TabsContent>

          <TabsContent value="batteries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5" />
                  Gerenciamento de Baterias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Battery className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-4">
                    O gerenciamento de baterias será implementado em uma próxima versão.
                  </p>
                  <Badge variant="secondary">
                    Próxima Versão
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}