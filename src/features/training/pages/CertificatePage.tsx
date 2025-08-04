// =====================================================
// PÁGINA DE CERTIFICADOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Share2,
  Award,
  Calendar,
  User,
  Building,
  CheckCircle,
  ExternalLink,
  Printer
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserCertificate } from '../hooks/useTraining';
import type { Certificate } from '../types';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const CertificatePage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: certificate,
    isLoading,
    error
  } = useUserCertificate(certificateId!);

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Implementar download do PDF
      console.log('Downloading certificate PDF...');
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error downloading certificate:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificado - ${certificate?.moduleName}`,
          text: `Confira meu certificado de conclusão do curso ${certificate?.moduleName}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBackToTraining = () => {
    navigate('/training');
  };

  // =====================================================
  // LOADING E ERROR STATES
  // =====================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Award className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Certificado não encontrado</h2>
              <p className="text-gray-600 mb-6">O certificado solicitado não foi encontrado ou você não tem permissão para acessá-lo.</p>
              <Button onClick={handleBackToTraining}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Treinamentos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <Button onClick={handleBackToTraining} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Treinamentos
            </Button>
            
            <div className="flex gap-2">
              <Button onClick={handleShare} variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Button onClick={handlePrint} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button 
                onClick={handleDownloadPDF} 
                disabled={isDownloading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Baixando...' : 'Baixar PDF'}
              </Button>
            </div>
          </div>

          {/* Certificate */}
          <Card className="overflow-hidden" ref={certificateRef}>
            <CardContent className="p-0">
              {/* Certificate Design */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
                  <div className="absolute top-20 right-20 w-24 h-24 border-2 border-white rounded-full"></div>
                  <div className="absolute bottom-10 left-20 w-20 h-20 border-2 border-white rounded-full"></div>
                  <div className="absolute bottom-20 right-10 w-28 h-28 border-2 border-white rounded-full"></div>
                </div>
                
                {/* Certificate Content */}
                <div className="relative z-10 text-center">
                  {/* Header */}
                  <div className="mb-8">
                    <Award className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
                    <h1 className="text-4xl font-bold mb-2">CERTIFICADO</h1>
                    <p className="text-xl opacity-90">de Conclusão</p>
                  </div>
                  
                  {/* Main Content */}
                  <div className="mb-8">
                    <p className="text-lg mb-4 opacity-90">Certificamos que</p>
                    <h2 className="text-3xl font-bold mb-4 text-yellow-300">
                      {certificate.userName}
                    </h2>
                    <p className="text-lg mb-2 opacity-90">concluiu com êxito o curso</p>
                    <h3 className="text-2xl font-semibold mb-6">
                      {certificate.moduleName}
                    </h3>
                    
                    <div className="flex justify-center items-center gap-8 mb-6">
                      <div className="text-center">
                        <p className="text-sm opacity-75 mb-1">Carga Horária</p>
                        <p className="text-lg font-semibold">{certificate.duration}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm opacity-75 mb-1">Nota Final</p>
                        <p className="text-lg font-semibold">{certificate.finalScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm opacity-75 mb-1">Data de Conclusão</p>
                        <p className="text-lg font-semibold">
                          {new Date(certificate.completedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="border-t border-white/20 pt-6">
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <p className="text-sm opacity-75">Emitido por</p>
                        <p className="font-semibold">Solara Nova Energia</p>
                        <p className="text-sm opacity-75">Sistema de Treinamentos Corporativos</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm opacity-75">Certificado Nº</p>
                        <p className="font-mono text-sm">{certificate.certificateNumber}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle className="h-4 w-4 text-green-300" />
                          <span className="text-xs opacity-75">Verificado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Detalhes do Certificado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Participante</p>
                      <p className="font-medium">{certificate.userName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Empresa</p>
                      <p className="font-medium">{certificate.companyName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Data de Emissão</p>
                      <p className="font-medium">
                        {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Status</p>
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Válido
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Verificação</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {certificate.verificationCode}
                      </code>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Verificar
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Competências Desenvolvidas</p>
                    <div className="flex flex-wrap gap-1">
                      {certificate.skills?.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      )) || (
                        <Badge variant="secondary" className="text-xs">
                          Energia Solar
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CertificatePage;