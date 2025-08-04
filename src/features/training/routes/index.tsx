// =====================================================
// ROTAS DO MÓDULO DE TREINAMENTOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// =====================================================
// LAZY LOADING DOS COMPONENTES
// =====================================================

// Páginas principais
const TrainingDashboard = React.lazy(() => import('../components/TrainingDashboard'));
const ModuleEditor = React.lazy(() => import('../components/ModuleEditor'));
const ContentEditor = React.lazy(() => import('../components/ContentEditor'));
const VideoPlayer = React.lazy(() => import('../components/VideoPlayer'));
const AssessmentViewer = React.lazy(() => import('../components/AssessmentViewer'));
const ProgressTracker = React.lazy(() => import('../components/ProgressTracker'));
const GamificationPanel = React.lazy(() => import('../components/GamificationPanel'));
const NotificationCenter = React.lazy(() => import('../components/NotificationCenter'));
const TrainingReports = React.lazy(() => import('../components/TrainingReports'));

// Páginas específicas
const ModuleDetailPage = React.lazy(() => import('../pages/ModuleDetailPage'));
const ContentViewPage = React.lazy(() => import('../pages/ContentViewPage'));
const AssessmentPage = React.lazy(() => import('../pages/AssessmentPage'));
const CertificatePage = React.lazy(() => import('../pages/CertificatePage'));
const UserProgressPage = React.lazy(() => import('../pages/UserProgressPage'));
const AdminDashboardPage = React.lazy(() => import('../pages/AdminDashboardPage'));

// =====================================================
// COMPONENTE DE LOADING
// =====================================================

function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-[400px]"
    >
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </motion.div>
  );
}

// =====================================================
// COMPONENTE DE PROTEÇÃO DE ROTAS
// =====================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'user';
  requiredPermissions?: string[];
}

function ProtectedRoute({ 
  children, 
  requiredRole = 'user', 
  requiredPermissions = [] 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Verificar role (implementar lógica de verificação de role)
  const hasRequiredRole = true; // Implementar verificação real
  
  // Verificar permissões (implementar lógica de verificação de permissões)
  const hasRequiredPermissions = true; // Implementar verificação real
  
  if (!hasRequiredRole || !hasRequiredPermissions) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Acesso Negado
        </h2>
        <p className="text-gray-600">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }
  
  return <>{children}</>;
}

// =====================================================
// COMPONENTE PRINCIPAL DE ROTAS
// =====================================================

export function TrainingRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Dashboard Principal */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <TrainingDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Módulos */}
        <Route 
          path="/modules" 
          element={
            <ProtectedRoute>
              <TrainingDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/modules/new" 
          element={
            <ProtectedRoute requiredRole="admin">
              <ModuleEditor />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/modules/:moduleId" 
          element={
            <ProtectedRoute>
              <ModuleDetailPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/modules/:moduleId/edit" 
          element={
            <ProtectedRoute requiredRole="admin">
              <ModuleEditor />
            </ProtectedRoute>
          } 
        />
        
        {/* Conteúdo */}
        <Route 
          path="/modules/:moduleId/content/new" 
          element={
            <ProtectedRoute requiredRole="admin">
              <ContentEditor />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/modules/:moduleId/content/:contentId" 
          element={
            <ProtectedRoute>
              <ContentViewPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/modules/:moduleId/content/:contentId/edit" 
          element={
            <ProtectedRoute requiredRole="admin">
              <ContentEditor />
            </ProtectedRoute>
          } 
        />
        
        {/* Vídeos */}
        <Route 
          path="/videos/:videoId" 
          element={
            <ProtectedRoute>
              <VideoPlayer videoId="" />
            </ProtectedRoute>
          } 
        />
        
        {/* Avaliações */}
        <Route 
          path="/modules/:moduleId/assessment" 
          element={
            <ProtectedRoute>
              <AssessmentPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/assessments/:assessmentId" 
          element={
            <ProtectedRoute>
              <AssessmentViewer assessmentId="" />
            </ProtectedRoute>
          } 
        />
        
        {/* Progresso */}
        <Route 
          path="/progress" 
          element={
            <ProtectedRoute>
              <UserProgressPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/progress/:userId" 
          element={
            <ProtectedRoute requiredRole="manager">
              <UserProgressPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Gamificação */}
        <Route 
          path="/gamification" 
          element={
            <ProtectedRoute>
              <GamificationPanel />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ranking" 
          element={
            <ProtectedRoute>
              <GamificationPanel />
            </ProtectedRoute>
          } 
        />
        
        {/* Certificados */}
        <Route 
          path="/certificates" 
          element={
            <ProtectedRoute>
              <CertificatePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/certificates/:certificateId" 
          element={
            <ProtectedRoute>
              <CertificatePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Notificações */}
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          } 
        />
        
        {/* Relatórios */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute requiredRole="manager">
              <TrainingReports />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reports/modules/:moduleId" 
          element={
            <ProtectedRoute requiredRole="manager">
              <TrainingReports />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reports/users/:userId" 
          element={
            <ProtectedRoute requiredRole="manager">
              <TrainingReports />
            </ProtectedRoute>
          } 
        />
        
        {/* Administração */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/modules" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to="/training" replace />} />
      </Routes>
    </Suspense>
  );
}

// =====================================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// =====================================================

export function PublicTrainingRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Visualização pública de certificados */}
        <Route 
          path="/certificates/public/:certificateId" 
          element={<CertificatePage />} 
        />
        
        {/* Página de demonstração */}
        <Route 
          path="/demo" 
          element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Demonstração do Sistema de Treinamentos
              </h2>
              <p className="text-gray-600 mb-6">
                Conheça as funcionalidades do nosso sistema de treinamentos corporativos.
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Solicitar Demonstração
              </button>
            </div>
          } 
        />
        
        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

// =====================================================
// HOOK PARA NAVEGAÇÃO DO TREINAMENTO
// =====================================================

export function useTrainingNavigation() {
  const navigate = (path: string) => {
    // Implementar navegação com prefixo /training
    window.location.href = `/training${path}`;
  };
  
  return {
    goToDashboard: () => navigate('/'),
    goToModules: () => navigate('/modules'),
    goToModule: (moduleId: string) => navigate(`/modules/${moduleId}`),
    goToContent: (moduleId: string, contentId: string) => 
      navigate(`/modules/${moduleId}/content/${contentId}`),
    goToAssessment: (moduleId: string) => navigate(`/modules/${moduleId}/assessment`),
    goToProgress: () => navigate('/progress'),
    goToGamification: () => navigate('/gamification'),
    goToReports: () => navigate('/reports'),
    goToNotifications: () => navigate('/notifications'),
    goToAdmin: () => navigate('/admin')
  };
}

// =====================================================
// BREADCRUMB HELPER
// =====================================================

export function useTrainingBreadcrumb() {
  const getBreadcrumb = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    // Remover 'training' do início se existir
    if (segments[0] === 'training') {
      segments.shift();
    }
    
    // Dashboard
    breadcrumbs.push({ label: 'Treinamentos', href: '/training' });
    
    // Processar segmentos
    let currentPath = '/training';
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      
      switch (segment) {
        case 'modules':
          breadcrumbs.push({ label: 'Módulos', href: currentPath });
          break;
        case 'content':
          breadcrumbs.push({ label: 'Conteúdo', href: currentPath });
          break;
        case 'assessment':
          breadcrumbs.push({ label: 'Avaliação', href: currentPath });
          break;
        case 'progress':
          breadcrumbs.push({ label: 'Progresso', href: currentPath });
          break;
        case 'gamification':
          breadcrumbs.push({ label: 'Gamificação', href: currentPath });
          break;
        case 'reports':
          breadcrumbs.push({ label: 'Relatórios', href: currentPath });
          break;
        case 'notifications':
          breadcrumbs.push({ label: 'Notificações', href: currentPath });
          break;
        case 'admin':
          breadcrumbs.push({ label: 'Administração', href: currentPath });
          break;
        case 'new':
          breadcrumbs.push({ label: 'Novo', href: currentPath });
          break;
        case 'edit':
          breadcrumbs.push({ label: 'Editar', href: currentPath });
          break;
        default:
          // Para IDs, tentar buscar o nome real
          if (segment.match(/^[a-f0-9-]{36}$/)) {
            breadcrumbs.push({ label: 'Detalhes', href: currentPath });
          } else {
            breadcrumbs.push({ 
              label: segment.charAt(0).toUpperCase() + segment.slice(1), 
              href: currentPath 
            });
          }
      }
    }
    
    return breadcrumbs;
  };
  
  return { getBreadcrumb };
}

export default TrainingRoutes;