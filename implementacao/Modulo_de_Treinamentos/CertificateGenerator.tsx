import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { TrainingService } from '@/services/trainingService';
import { Certificate, TrainingModule } from '@/types/training';
import { 
  Award, 
  Download, 
  Calendar, 
  User, 
  Building,
  CheckCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface CertificateGeneratorProps {
  module: TrainingModule;
  onCertificateGenerated?: (certificate: Certificate) => void;
  className?: string;
}

export function CertificateGenerator({ 
  module, 
  onCertificateGenerated, 
  className 
}: CertificateGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const { user, profile } = useAuth();

  const generateCertificate = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const newCertificate = await TrainingService.generateCertificate(user.id, module.id);
      setCertificate(newCertificate);
      onCertificateGenerated?.(newCertificate);
      
      // Gerar PDF do certificado
      await generateCertificatePDF(newCertificate);
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      alert('Erro ao gerar certificado. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const generateCertificatePDF = async (cert: Certificate) => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Configurações do PDF
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    // Cores
    const primaryColor = '#2563eb'; // blue-600
    const secondaryColor = '#64748b'; // slate-500
    const accentColor = '#f59e0b'; // amber-500

    // Fundo decorativo
    pdf.setFillColor(249, 250, 251); // gray-50
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Borda decorativa
    pdf.setDrawColor(37, 99, 235); // blue-600
    pdf.setLineWidth(2);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Borda interna
    pdf.setDrawColor(245, 158, 11); // amber-500
    pdf.setLineWidth(1);
    pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Título principal
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(32);
    pdf.setTextColor(37, 99, 235); // blue-600
    pdf.text('CERTIFICADO DE CONCLUSÃO', centerX, 40, { align: 'center' });

    // Subtítulo
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text('Este certificado atesta que', centerX, 55, { align: 'center' });

    // Nome do usuário
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(15, 23, 42); // slate-900
    const userName = profile?.full_name || user?.email || 'Usuário';
    pdf.text(userName.toUpperCase(), centerX, 75, { align: 'center' });

    // Texto do meio
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text('concluiu com êxito o módulo de treinamento', centerX, 90, { align: 'center' });

    // Nome do módulo
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(37, 99, 235); // blue-600
    
    // Quebrar o título do módulo se for muito longo
    const moduleTitle = module.title.toUpperCase();
    const maxWidth = pageWidth - 60;
    const titleLines = pdf.splitTextToSize(moduleTitle, maxWidth);
    
    let yPosition = 110;
    titleLines.forEach((line: string) => {
      pdf.text(line, centerX, yPosition, { align: 'center' });
      yPosition += 10;
    });

    // Descrição do módulo (se houver)
    if (module.description) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(100, 116, 139); // slate-500
      
      const descLines = pdf.splitTextToSize(module.description, maxWidth);
      yPosition += 10;
      descLines.slice(0, 2).forEach((line: string) => { // Máximo 2 linhas
        pdf.text(line, centerX, yPosition, { align: 'center' });
        yPosition += 6;
      });
    }

    // Data de emissão
    const issueDate = new Date(cert.issued_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(`Emitido em ${issueDate}`, centerX, pageHeight - 50, { align: 'center' });

    // Número do certificado
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(156, 163, 175); // gray-400
    pdf.text(`Certificado nº ${cert.certificate_number}`, centerX, pageHeight - 35, { align: 'center' });

    // Logo/Selo (simulado com texto)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(245, 158, 11); // amber-500
    pdf.text('SOLARCALC PRO', 30, pageHeight - 30);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text('Sistema de Gestão para Energia Solar', 30, pageHeight - 20);

    // Assinatura digital (simulada)
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text('Certificado digital válido', pageWidth - 80, pageHeight - 30);

    // Salvar o PDF
    const fileName = `certificado_${module.title.replace(/[^a-zA-Z0-9]/g, '_')}_${cert.certificate_number}.pdf`;
    pdf.save(fileName);
  };

  const downloadExistingCertificate = async () => {
    if (!certificate) return;
    await generateCertificatePDF(certificate);
  };

  if (certificate) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              Certificado Gerado com Sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">{module.title}</h3>
                <p className="text-sm text-green-700">
                  Certificado #{certificate.certificate_number}
                </p>
                <p className="text-xs text-green-600">
                  Emitido em {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge variant="default" className="bg-green-500">
                <Award className="h-3 w-3 mr-1" />
                Certificado
              </Badge>
            </div>

            <Button 
              onClick={downloadExistingCertificate}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Certificado (PDF)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            Gerar Certificado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <Award className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-800 mb-1">
                Parabéns pela conclusão!
              </h3>
              <p className="text-sm text-yellow-700">
                Você completou com sucesso o módulo "{module.title}". 
                Clique no botão abaixo para gerar seu certificado de conclusão.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium">Participante</div>
                  <div className="text-gray-600">
                    {profile?.full_name || user?.email || 'Usuário'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium">Módulo</div>
                  <div className="text-gray-600">{module.title}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="font-medium">Data</div>
                  <div className="text-gray-600">
                    {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={generateCertificate}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                'Gerando certificado...'
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Gerar Certificado
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

