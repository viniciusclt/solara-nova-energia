import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sun, Zap, Battery, Settings, ArrowLeft } from "lucide-react";
import { ModuleManagerAdvanced } from "./ModuleManagerAdvanced";
import { InverterManagerAdvanced } from "./InverterManagerAdvanced";

interface EquipmentManagerProps {
  onBack?: () => void;
  defaultTab?: "modules" | "inverters" | "batteries";
}

export function EquipmentManager({ onBack, defaultTab = "modules" }: EquipmentManagerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const equipmentCategories = [
    {
      id: "modules",
      name: "Módulos Solares",
      icon: Sun,
      description: "Gerenciar módulos fotovoltaicos",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      id: "inverters", 
      name: "Inversores",
      icon: Zap,
      description: "Gerenciar inversores solares",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      id: "batteries",
      name: "Baterias",
      icon: Battery,
      description: "Gerenciar sistemas de armazenamento",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    }
  ];

  return (
    <div className="space-y-6">
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
                  <Settings className="h-5 w-5 text-primary" />
                  Gerenciamento de Equipamentos
                </CardTitle>
                <CardDescription>
                  Gerencie módulos, inversores e baterias para simulações
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

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
                <Badge variant="secondary">Próxima Atualização</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Estatísticas Rápidas */}
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
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${category.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{category.name}</h4>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
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