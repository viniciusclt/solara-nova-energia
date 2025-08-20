import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '@/hooks/useSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Thermometer, 
  Car, 
  GraduationCap, 
  Target,
  FileText,
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight 
} from 'lucide-react';

interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  status: 'active' | 'coming-soon' | 'beta';
  color: string;
  features: string[];
}

const modules: ModuleConfig[] = [
  {
    id: 'solar',
    title: 'Solar',
    description: 'Sistema completo para projetos de energia solar fotovoltaica',
    icon: Zap,
    route: '/solar',
    status: 'active',
    color: 'bg-yellow-500',
    features: ['Dimensionamento', 'Propostas', 'Relatórios', 'CRM']
  },
  {
    id: 'heating',
    title: 'Aquecimento',
    description: 'Soluções para aquecimento solar e sistemas térmicos',
    icon: Thermometer,
    route: '/heating',
    status: 'coming-soon',
    color: 'bg-orange-500',
    features: ['Cálculos térmicos', 'Dimensionamento', 'Propostas']
  },
  {
    id: 'wallbox',
    title: 'Wallbox',
    description: 'Carregadores para veículos elétricos e infraestrutura',
    icon: Car,
    route: '/wallbox',
    status: 'beta',
    color: 'bg-blue-500',
    features: ['Dimensionamento', 'Instalação', 'Monitoramento']
  },
  {
    id: 'proposals',
    title: 'Propostas',
    description: 'Editor drag-and-drop para criação de propostas personalizadas',
    icon: FileText,
    route: '/fv',
    status: 'active',
    color: 'bg-indigo-500',
    features: ['Editor visual', 'Templates', 'Exportação PDF', 'Colaboração']
  },
  {
    id: 'training',
    title: 'Treinamentos',
    description: 'Plataforma de capacitação e desenvolvimento profissional',
    icon: GraduationCap,
    route: '/training',
    status: 'active',
    color: 'bg-green-500',
    features: ['Cursos online', 'Certificações', 'Gamificação', 'Relatórios']
  },
  {
    id: 'roadmap',
    title: 'Roadmap',
    description: 'Acompanhe e participe do desenvolvimento da plataforma',
    icon: Target,
    route: '/roadmap',
    status: 'active',
    color: 'bg-purple-500',
    features: ['Sugestões', 'Votação', 'Comentários', 'Status']
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'beta':
      return <Clock className="w-4 h-4 text-blue-500" />;
    case 'coming-soon':
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    default:
      return null;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Ativo';
    case 'beta':
      return 'Beta';
    case 'coming-soon':
      return 'Em breve';
    default:
      return '';
  }
};

export const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeModule, setActiveModule } = useSidebar();

  // Navegação automática baseada no módulo ativo
  useEffect(() => {
    if (activeModule && location.pathname === '/') {
      const module = modules.find(m => m.id === activeModule);
      if (module && module.status === 'active') {
        navigate(module.route);
      }
    }
  }, [activeModule, location.pathname, navigate]);

  const handleModuleSelect = (module: ModuleConfig) => {
    if (module.status === 'active') {
      setActiveModule(module.id);
      navigate(module.route);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Plataforma Solara
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Escolha o módulo para começar a trabalhar com suas soluções de energia renovável
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module) => {
            const IconComponent = module.icon;
            const isDisabled = module.status !== 'active';
            
            return (
              <Card 
                key={module.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  isDisabled 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'cursor-pointer hover:scale-105'
                }`}
                onClick={() => !isDisabled && handleModuleSelect(module)}
              >
                <CardContent className="p-8">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge 
                      variant={module.status === 'active' ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(module.status)}
                      {getStatusText(module.status)}
                    </Badge>
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl ${module.color} flex items-center justify-center mb-6`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">
                    {module.title}
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {module.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {module.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button 
                    className={`w-full ${isDisabled ? 'opacity-50' : ''}`}
                    disabled={isDisabled}
                    variant={module.status === 'active' ? 'default' : 'outline'}
                  >
                    {module.status === 'active' ? (
                      <>
                        Acessar módulo
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      getStatusText(module.status)
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-slate-500">
          <p>Selecione um módulo para começar ou continue de onde parou</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;