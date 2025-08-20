import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, Zap, Battery, Settings, ArrowLeft, Plus, Upload, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface EquipmentManagementPageProps {
  onBack?: () => void;
}

export function EquipmentManagementPage({ onBack }: EquipmentManagementPageProps) {
  const { toast } = useToast();
  const [systemType, setSystemType] = useState("");
  const [installationType, setInstallationType] = useState("");

  const quickActions = [
    {
      title: "Configurar Módulos",
      description: "Definir módulos para o sistema",
      icon: Sun,
      action: () => {
        toast({
          title: "Configuração de Módulos",
          description: "Funcionalidade será integrada na próxima etapa (Simulação)"
        });
      },
      color: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      title: "Configurar Inversores",
      description: "Definir inversores para o sistema",
      icon: Zap,
      action: () => {
        toast({
          title: "Configuração de Inversores",
          description: "Funcionalidade será integrada na próxima etapa (Simulação)"
        });
      },
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Importar Configuração",
      description: "Importar configuração de equipamentos",
      icon: Upload,
      action: () => {
        toast({
          title: "Importar Configuração",
          description: "Funcionalidade de importação em desenvolvimento"
        });
      },
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      title: "Exportar Configuração",
      description: "Exportar configuração atual",
      icon: Download,
      action: () => {
        toast({
          title: "Exportar Configuração",
          description: "Funcionalidade de exportação em desenvolvimento"
        });
      },
      color: "text-green-500",
      bgColor: "bg-green-50"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Configuration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configuração Básica do Sistema
          </CardTitle>
          <CardDescription>
            Configure os parâmetros básicos do sistema solar. O gerenciamento detalhado de equipamentos será feito na etapa de Simulação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label htmlFor="system-type">Tipo de Sistema</Label>
               <Input
                 id="system-type"
                 placeholder="Ex: Residencial, Comercial, Industrial"
                 value={systemType}
                 onChange={(e) => setSystemType(e.target.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="installation-type">Tipo de Instalação</Label>
               <Input
                 id="installation-type"
                 placeholder="Ex: Telhado, Solo, Carport"
                 value={installationType}
                 onChange={(e) => setInstallationType(e.target.value)}
               />
             </div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800 dark:text-blue-200">Próxima Etapa</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              O gerenciamento detalhado de módulos, inversores e baterias será feito na etapa de <strong>Simulação Técnica</strong>.
            </p>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}

export default EquipmentManagementPage;