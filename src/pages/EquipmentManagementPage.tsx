import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sun, Zap, Battery, Settings, ArrowLeft, Plus, Search, Filter } from "lucide-react";
import { ModuleManagerAdvanced } from "@/components/ModuleManagerAdvanced";
import { InverterManagerAdvanced } from "@/components/InverterManagerAdvanced";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EquipmentManagementPageProps {
  onBack?: () => void;
  defaultTab?: "modules" | "inverters" | "batteries";
}

export function EquipmentManagementPage({ onBack, defaultTab = "modules" }: EquipmentManagementPageProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  const equipmentCategories = [
    {
      id: "modules",
      name: "Módulos Solares",
      icon: Sun,
      description: "Gerenciar módulos fotovoltaicos",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      count: 0 // Será atualizado dinamicamente
    },
    {
      id: "inverters", 
      name: "Inversores",
      icon: Zap,
      description: "Gerenciar inversores solares",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      count: 0 // Será atualizado dinamicamente
    },
    {
      id: "batteries",
      name: "Baterias",
      icon: Battery,
      description: "Gerenciar sistemas de armazenamento",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      count: 0 // Será atualizado dinamicamente
    }
  ];

  const quickActions = [
    {
      title: "Adicionar Módulo",
      description: "Cadastrar novo módulo solar",
      icon: Sun,
      action: () => setActiveTab("modules"),
      color: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      title: "Adicionar Inversor",
      description: "Cadastrar novo inversor",
      icon: Zap,
      action: () => setActiveTab("inverters"),
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Importar Dados",
      description: "Importar equipamentos em lote",
      icon: Plus,
      action: () => console.log("Import functionality"),
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary" />
                  Gerenciamento de Equipamentos
                </CardTitle>
                <CardDescription>
                  Gerencie módulos, inversores e baterias para suas simulações solares
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Sistema Avançado
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Card 
              key={index}
              className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
              onClick={action.action}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${action.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="favorites">Favoritos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {equipmentCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex items-center gap-2"
              >
                <IconComponent className={`h-4 w-4 ${category.color}`} />
                {category.name}
                {category.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <ModuleManagerAdvanced />
        </TabsContent>

        <TabsContent value="inverters" className="space-y-4">
          <InverterManagerAdvanced />
        </TabsContent>

        <TabsContent value="batteries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5 text-green-500" />
                Gerenciador de Baterias
              </CardTitle>
              <CardDescription>
                Gerencie sistemas de armazenamento de energia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Battery className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
                <p className="text-muted-foreground mb-4">
                  O gerenciamento de baterias será implementado em uma próxima versão
                </p>
                <div className="flex flex-col items-center gap-2">
                  <Badge variant="secondary">Próxima Atualização</Badge>
                  <p className="text-xs text-muted-foreground">
                    Funcionalidades planejadas: Tesla Powerwall, BYD, Pylontech
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Equipment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {equipmentCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card 
              key={category.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeTab === category.id ? `${category.bgColor} ${category.borderColor} border-2` : ''
              }`}
              onClick={() => setActiveTab(category.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                      <IconComponent className={`h-5 w-5 ${category.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{category.count}</div>
                    <div className="text-xs text-muted-foreground">cadastrados</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default EquipmentManagementPage;