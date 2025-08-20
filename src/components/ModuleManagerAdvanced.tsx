import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Sun, Zap, DollarSign } from 'lucide-react';
import { OfflineService } from '@/services/offlineService';
import { DemoDataService } from '@/services/DemoDataService';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/secureLogger';

interface SolarModule {
  id: string;
  name: string;
  brand: string;
  power: number;
  efficiency: number;
  voltage: number;
  current: number;
  price: number;
  warranty: number;
  technology: 'monocrystalline' | 'polycrystalline' | 'thin-film';
  dimensions: {
    length: number;
    width: number;
    thickness: number;
  };
}

const offlineService = OfflineService.getInstance();

export function ModuleManagerAdvanced() {
  const { toast } = useToast();
  const [modules, setModules] = useState<SolarModule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<SolarModule | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setIsLoading(true);
      const data = await offlineService.getModules();
      
      if (!data || data.length === 0) {
        // Carregar dados de demonstração se não houver dados
        const demoModules = DemoDataService.getSolarModules();
        setModules(demoModules);
        toast({
          title: "Dados de demonstração carregados",
          description: "Usando módulos de exemplo para demonstração"
        });
      } else {
        setModules(data);
        toast({
          title: "Módulos carregados",
          description: `${data.length} módulos carregados com sucesso`
        });
      }
    } catch (error) {
      logError('Erro ao carregar módulos', {
        service: 'ModuleManagerAdvanced',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        action: 'loadModules'
      });
      // Fallback para dados de demonstração
      const demoModules = DemoDataService.getSolarModules();
      setModules(demoModules);
      toast({
        title: "Erro ao carregar módulos",
        description: "Usando dados de demonstração como fallback",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveModule = async (module: SolarModule) => {
    try {
      setIsLoading(true);
      if (isEditing && selectedModule) {
        // Atualizar módulo existente
        const updatedModules = modules.map(m => m.id === module.id ? module : m);
        setModules(updatedModules);
        await offlineService.saveModule(module);
        toast({
          title: "Módulo atualizado",
          description: `${module.name} foi atualizado com sucesso`
        });
      } else {
        // Adicionar novo módulo
        const newModule = { ...module, id: Date.now().toString() };
        setModules([...modules, newModule]);
        await offlineService.saveModule(newModule);
        toast({
          title: "Módulo criado",
          description: `${module.name} foi adicionado com sucesso`
        });
      }
      
      setSelectedModule(null);
      setIsEditing(false);
    } catch (error) {
      logError('Erro ao salvar módulo', {
        service: 'ModuleManagerAdvanced',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        moduleId: module.id,
        moduleName: module.name,
        action: isEditing ? 'updateModule' : 'createModule'
      });
      toast({
        title: "Erro ao salvar módulo",
        description: "Não foi possível salvar o módulo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    const moduleToDelete = modules.find(m => m.id === moduleId);
    if (!moduleToDelete) return;
    
    if (!confirm(`Tem certeza que deseja excluir o módulo "${moduleToDelete.name}"?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      const updatedModules = modules.filter(m => m.id !== moduleId);
      setModules(updatedModules);
      await offlineService.deleteModule(moduleId);
      toast({
        title: "Módulo excluído",
        description: `${moduleToDelete.name} foi removido com sucesso`
      });
    } catch (error) {
      logError('Erro ao deletar módulo', {
        service: 'ModuleManagerAdvanced',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        moduleId,
        moduleName: moduleToDelete.name,
        action: 'deleteModule'
      });
      toast({
        title: "Erro ao excluir módulo",
        description: "Não foi possível excluir o módulo",
        variant: "destructive"
      });
      // Reverter a remoção em caso de erro
      loadModules();
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTechnologyBadgeColor = (technology: string) => {
    switch (technology) {
      case 'monocrystalline': return 'bg-blue-100 text-blue-800';
      case 'polycrystalline': return 'bg-green-100 text-green-800';
      case 'thin-film': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando módulos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-orange-500" />
            Gerenciador de Módulos Solares
          </CardTitle>
          <CardDescription>
            Gerencie a biblioteca de módulos fotovoltaicos para simulações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar módulos por nome ou marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => {
              setSelectedModule(null);
              setIsEditing(false);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map((module) => (
              <Card key={module.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <CardDescription>{module.brand}</CardDescription>
                    </div>
                    <Badge className={getTechnologyBadgeColor(module.technology)}>
                      {module.technology}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{module.power}W</span>
                      <span className="text-muted-foreground">({module.efficiency}% eficiência)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span>R$ {module.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {module.dimensions.length}x{module.dimensions.width}x{module.dimensions.thickness}mm
                    </div>
                    <div className="text-muted-foreground">
                      Garantia: {module.warranty} anos
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedModule(module);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteModule(module.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}