import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  FinancialInput,
  SearchInput,
  Spinner,
  DotsLoading,
  SkeletonCard,
  SkeletonText,
  MetricCard,
  VideoCard,
  ProposalCard,
  AnimatedButton,
  AnimatedCard,
  AnimatedContainer,
  AnimatedList,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveText,
  ResponsiveShowHide,
  useDesignTokens,
  useResponsive,
  useMicroInteractions
} from '../index';

/**
 * Componente de demonstração do Design System Solara
 * 
 * Este componente showcases todos os componentes e funcionalidades
 * disponíveis no design system, servindo como:
 * - Documentação visual
 * - Playground para testes
 * - Referência de implementação
 */
export function DesignSystemDemo() {
  const [activeTab, setActiveTab] = useState('tokens');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    investment: ''
  });

  const { getColor, getSpacing } = useDesignTokens();
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsive();
  const { animateElement, getButtonClasses } = useMicroInteractions();

  const tabs = [
    { id: 'tokens', label: 'Design Tokens' },
    { id: 'components', label: 'Componentes' },
    { id: 'responsive', label: 'Responsividade' },
    { id: 'animations', label: 'Animações' },
    { id: 'examples', label: 'Exemplos' }
  ];

  const mockMetrics = [
    { title: 'Receita Total', value: 'R$ 125.000', change: '+12%', trend: 'up' as const },
    { title: 'Projetos Ativos', value: '23', change: '+3', trend: 'up' as const },
    { title: 'Economia Gerada', value: '45.2 MWh', change: '+8%', trend: 'up' as const },
    { title: 'Satisfação', value: '98%', change: '+2%', trend: 'up' as const }
  ];

  const mockVideos = [
    { id: 1, title: 'Instalação Residencial', duration: '5:30', thumbnail: '/api/placeholder/300/200' },
    { id: 2, title: 'Manutenção Preventiva', duration: '3:45', thumbnail: '/api/placeholder/300/200' },
    { id: 3, title: 'Sistema Comercial', duration: '8:15', thumbnail: '/api/placeholder/300/200' }
  ];

  const mockProposals = [
    { id: 1, title: 'Proposta Residencial', status: 'pending' as const, value: 'R$ 45.000' },
    { id: 2, title: 'Projeto Comercial', status: 'approved' as const, value: 'R$ 120.000' },
    { id: 3, title: 'Sistema Industrial', status: 'draft' as const, value: 'R$ 350.000' }
  ];

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const handleAnimationDemo = () => {
    animateElement('#animation-target', 'bounce');
  };

  return (
    <ResponsiveContainer type="content" className="py-8">
      {/* Header */}
      <div className="mb-8">
        <ResponsiveText 
          size={{ xs: '2xl', lg: '4xl' }}
          weight="bold"
          className="text-center mb-4"
        >
          Design System Solara
        </ResponsiveText>
        <ResponsiveText 
          size={{ xs: 'base', lg: 'lg' }}
          className="text-center text-gray-600 mb-6"
        >
          Sistema de design completo para aplicações de energia solar
        </ResponsiveText>
        
        {/* Device Info */}
        <Card className="mb-6">
          <CardBody>
            <ResponsiveStack direction={{ xs: 'column', md: 'row' }} spacing="4">
              <div>
                <strong>Breakpoint:</strong> {currentBreakpoint}
              </div>
              <div>
                <strong>Dispositivo:</strong> {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
              </div>
              <div>
                <strong>Tela:</strong> {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'SSR'}
              </div>
            </ResponsiveStack>
          </CardBody>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <ResponsiveStack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing="2"
          className="border-b border-gray-200"
        >
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex-1"
            >
              {tab.label}
            </Button>
          ))}
        </ResponsiveStack>
      </div>

      {/* Content Sections */}
      <AnimatedContainer entranceType="fade" key={activeTab}>
        {activeTab === 'tokens' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-4">Design Tokens</h2>
            
            {/* Colors */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Cores</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveGrid columns={{ xs: 2, md: 4, lg: 6 }} gap="4">
                  {['primary', 'secondary', 'success', 'warning', 'error', 'solar'].map((color) => (
                    <div key={color} className="text-center">
                      <div 
                        className="w-16 h-16 rounded-lg mx-auto mb-2 shadow-md"
                        style={{ backgroundColor: getColor(color as 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'solar', 500) }}
                      />
                      <p className="text-sm font-medium capitalize">{color}</p>
                    </div>
                  ))}
                </ResponsiveGrid>
              </CardBody>
            </Card>

            {/* Spacing */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Espaçamentos</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveGrid columns={{ xs: 2, md: 4 }} gap="4">
                  {[1, 2, 4, 6, 8, 12, 16, 20].map((space) => (
                    <div key={space} className="flex items-center space-x-2">
                      <div 
                        className="bg-blue-500 rounded"
                        style={{ 
                          width: getSpacing(space), 
                          height: getSpacing(2) 
                        }}
                      />
                      <span className="text-sm">{space} ({getSpacing(space)})</span>
                    </div>
                  ))}
                </ResponsiveGrid>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-4">Componentes</h2>
            
            {/* Buttons */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Botões</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveStack spacing="4">
                  <ResponsiveStack direction={{ xs: 'column', sm: 'row' }} spacing="2">
                    <Button variant="primary">Primário</Button>
                    <Button variant="secondary">Secundário</Button>
                    <Button variant="success">Sucesso</Button>
                    <Button variant="warning">Aviso</Button>
                    <Button variant="error">Erro</Button>
                    <Button variant="ghost">Ghost</Button>
                  </ResponsiveStack>
                  
                  <ResponsiveStack direction={{ xs: 'column', sm: 'row' }} spacing="2">
                    <Button size="sm">Pequeno</Button>
                    <Button size="md">Médio</Button>
                    <Button size="lg">Grande</Button>
                    <Button size="xl">Extra Grande</Button>
                  </ResponsiveStack>
                  
                  <ResponsiveStack direction={{ xs: 'column', sm: 'row' }} spacing="2">
                    <Button loading={loading}>Carregando</Button>
                    <Button disabled>Desabilitado</Button>
                    <Button onClick={handleLoadingDemo}>Testar Loading</Button>
                  </ResponsiveStack>
                </ResponsiveStack>
              </CardBody>
            </Card>

            {/* Inputs */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Inputs</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveStack spacing="4">
                  <ResponsiveStack direction={{ xs: 'column', md: 'row' }} spacing="4">
                    <Input 
                      label="Nome"
                      placeholder="Digite seu nome"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input 
                      label="Email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </ResponsiveStack>
                  
                  <ResponsiveStack direction={{ xs: 'column', md: 'row' }} spacing="4">
                    <FinancialInput 
                      label="Investimento"
                      currency="BRL"
                      placeholder="0,00"
                      value={formData.investment}
                      onChange={(e) => setFormData(prev => ({ ...prev, investment: e.target.value }))}
                    />
                    <SearchInput 
                      placeholder="Buscar projetos..."
                      onSearch={(query) => console.log('Busca:', query)}
                    />
                  </ResponsiveStack>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input variant="error" label="Com Erro" error="Campo obrigatório" />
                    <Input variant="success" label="Sucesso" helperText="Validado com sucesso" />
                    <Input disabled label="Desabilitado" placeholder="Campo desabilitado" />
                  </div>
                </ResponsiveStack>
              </CardBody>
            </Card>

            {/* Loading States */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Estados de Carregamento</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveGrid columns={{ xs: 1, md: 2, lg: 4 }} gap="6">
                  <div className="text-center space-y-2">
                    <Spinner size="lg" />
                    <p className="text-sm">Spinner</p>
                  </div>
                  <div className="text-center space-y-2">
                    <DotsLoading />
                    <p className="text-sm">Dots Loading</p>
                  </div>
                  <div className="space-y-2">
                    <SkeletonText lines={3} />
                    <p className="text-sm text-center">Skeleton Text</p>
                  </div>
                  <div className="space-y-2">
                    <SkeletonCard />
                    <p className="text-sm text-center">Skeleton Card</p>
                  </div>
                </ResponsiveGrid>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === 'responsive' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-4">Sistema Responsivo</h2>
            
            {/* Responsive Grid */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Grid Responsivo</h3>
                <p className="text-sm text-gray-600">1 coluna no mobile, 2 no tablet, 3 no desktop</p>
              </CardHeader>
              <CardBody>
                <ResponsiveGrid columns={{ xs: 1, md: 2, lg: 3 }} gap="4">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <Card key={item} variant="default">
                      <CardBody className="text-center py-8">
                        <p className="text-lg font-semibold">Item {item}</p>
                      </CardBody>
                    </Card>
                  ))}
                </ResponsiveGrid>
              </CardBody>
            </Card>

            {/* Responsive Text */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Tipografia Responsiva</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <ResponsiveText size={{ xs: 'lg', md: 'xl', lg: '2xl' }} weight="bold">
                    Título que cresce com a tela
                  </ResponsiveText>
                  <ResponsiveText size={{ xs: 'sm', md: 'base', lg: 'lg' }}>
                    Texto que se adapta ao dispositivo para melhor legibilidade
                  </ResponsiveText>
                </div>
              </CardBody>
            </Card>

            {/* Show/Hide */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Mostrar/Ocultar por Dispositivo</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <ResponsiveShowHide showOn="mobile">
                    <div className="p-4 bg-blue-100 rounded-lg">
                      <p className="text-blue-800">📱 Visível apenas no mobile</p>
                    </div>
                  </ResponsiveShowHide>
                  
                  <ResponsiveShowHide showOn="tablet">
                    <div className="p-4 bg-green-100 rounded-lg">
                      <p className="text-green-800">📱 Visível apenas no tablet</p>
                    </div>
                  </ResponsiveShowHide>
                  
                  <ResponsiveShowHide showOn="desktop">
                    <div className="p-4 bg-purple-100 rounded-lg">
                      <p className="text-purple-800">🖥️ Visível apenas no desktop</p>
                    </div>
                  </ResponsiveShowHide>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === 'animations' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-4">Animações e Micro-interações</h2>
            
            {/* Animated Components */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Componentes Animados</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveStack spacing="4">
                  <ResponsiveStack direction={{ xs: 'column', sm: 'row' }} spacing="2">
                    <AnimatedButton variant="primary" hoverEffect="scale">
                      Hover Scale
                    </AnimatedButton>
                    <AnimatedButton variant="secondary" hoverEffect="glow">
                      Hover Glow
                    </AnimatedButton>
                    <AnimatedButton variant="success" clickEffect="bounce">
                      Click Bounce
                    </AnimatedButton>
                  </ResponsiveStack>
                  
                  <div className="text-center">
                    <Button onClick={handleAnimationDemo} className="mb-4">
                      Testar Animação
                    </Button>
                    <div 
                      id="animation-target"
                      className="w-16 h-16 bg-blue-500 rounded-lg mx-auto"
                    />
                  </div>
                </ResponsiveStack>
              </CardBody>
            </Card>

            {/* Animated List */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Lista Animada</h3>
              </CardHeader>
              <CardBody>
                <AnimatedList 
                  items={mockMetrics}
                  entranceType="slideUp"
                  staggerDelay={100}
                  renderItem={(metric, index) => (
                    <AnimatedCard key={index} hoverEffect="lift">
                      <CardBody className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{metric.value}</p>
                        <p className="text-sm text-gray-600">{metric.title}</p>
                        <p className="text-xs text-green-600">{metric.change}</p>
                      </CardBody>
                    </AnimatedCard>
                  )}
                />
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-4">Exemplos Práticos</h2>
            
            {/* Financial Dashboard */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Dashboard Financeiro</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveGrid 
                  type="financial"
                  columns={{ xs: 1, md: 2, lg: 4 }}
                  gap="4"
                >
                  {mockMetrics.map((metric, index) => (
                    <MetricCard 
                      key={index}
                      title={metric.title}
                      value={metric.value}
                      change={metric.change}
                      trend={metric.trend}
                    />
                  ))}
                </ResponsiveGrid>
              </CardBody>
            </Card>

            {/* Video Gallery */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Galeria de Vídeos</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveGrid 
                  columns={{ xs: 1, md: 2, lg: 3 }}
                  gap="6"
                >
                  {mockVideos.map((video, index) => (
                    <AnimatedContainer 
                      key={video.id}
                      entranceType="slideUp"
                      delay={index * 100}
                    >
                      <VideoCard 
                        title={video.title}
                        duration={video.duration}
                        thumbnail={video.thumbnail}
                        onPlay={() => console.log('Play video:', video.id)}
                      />
                    </AnimatedContainer>
                  ))}
                </ResponsiveGrid>
              </CardBody>
            </Card>

            {/* Proposals */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Propostas</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveGrid 
                  columns={{ xs: 1, lg: 2 }}
                  gap="4"
                >
                  {mockProposals.map((proposal) => (
                    <ProposalCard 
                      key={proposal.id}
                      title={proposal.title}
                      status={proposal.status}
                      value={proposal.value}
                      onEdit={() => console.log('Edit:', proposal.id)}
                      onView={() => console.log('View:', proposal.id)}
                    />
                  ))}
                </ResponsiveGrid>
              </CardBody>
            </Card>
          </div>
        )}
      </AnimatedContainer>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
        <p>Design System Solara v1.0.0</p>
        <p className="text-sm mt-2">Desenvolvido para aplicações de energia solar</p>
      </div>
    </ResponsiveContainer>
  );
}

export default DesignSystemDemo;