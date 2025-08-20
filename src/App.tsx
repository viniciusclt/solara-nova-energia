import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GlobalLayout } from '@/components/layout/GlobalLayout';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import FlowchartEditorPage from '@/pages/flowcharteditorpage';
import ProposalEditorPage from '@/pages/ProposalEditorPage';
import PlaybookEditorPage from '@/pages/PlaybookEditorPage';
import VideoUpload from '@/pages/VideoUpload';
import RoadmapPage from '@/pages/RoadmapPage';
import TrainingPage from '@/pages/TrainingPage';
import SolarWorkflowPage from '@/pages/SolarWorkflowPage';
import EquipmentManagementPage from '@/pages/EquipmentManagementPage';

// Styles
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <Index />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/solar" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <SolarWorkflowPage />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/equipment" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <EquipmentManagementPage />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/roadmap" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <RoadmapPage />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/training" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <TrainingPage />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              
              {/* Flowchart Editor Routes */}
              <Route path="/flowcharts/editor" element={
                <ProtectedRoute requiredAccess={['admin', 'super_admin', 'engenheiro']}>
                  <FlowchartEditorPage />
                </ProtectedRoute>
              } />
              
              <Route path="/flowcharts/editor/:id" element={
                <ProtectedRoute requiredAccess={['admin', 'super_admin', 'engenheiro']}>
                  <FlowchartEditorPage />
                </ProtectedRoute>
              } />
              
              {/* Proposal Editor Routes */}
              <Route path="/proposals/editor" element={
                <ProtectedRoute requiredAccess={['admin', 'super_admin', 'engenheiro']}>
                  <ProposalEditorPage />
                </ProtectedRoute>
              } />
              
              <Route path="/proposals/editor/:id" element={
                <ProtectedRoute requiredAccess={['admin', 'super_admin', 'engenheiro']}>
                  <ProposalEditorPage />
                </ProtectedRoute>
              } />
              
              {/* Playbook Editor Routes */}
              <Route path="/playbooks/editor" element={
                <ProtectedRoute requiredAccess={['admin', 'super_admin', 'engenheiro']}>
                  <PlaybookEditorPage />
                </ProtectedRoute>
              } />
              
              <Route path="/playbooks/editor/:id" element={
                <ProtectedRoute requiredAccess={['admin', 'super_admin', 'engenheiro']}>
                  <PlaybookEditorPage />
                </ProtectedRoute>
              } />
              
              {/* Video Upload Route */}
              <Route path="/videos/upload" element={
                <ProtectedRoute requiredAccess={['admin', 'super_admin']}>
                  <VideoUpload />
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;