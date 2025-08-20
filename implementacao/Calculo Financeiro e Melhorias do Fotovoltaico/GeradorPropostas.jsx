import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Eye, Share2, Clock, MapPin, User } from 'lucide-react';
import { motion } from 'framer-motion';

const GeradorPropostas = ({ resultado, formData }) => {
  const [templates, setTemplates] = useState([]);
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [dadosCliente, setDadosCliente] = useState({
    nome_cliente: '',
    email_cliente: '',
    telefone_cliente: ''
  });
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState({});
  const [observacoes, setObservacoes] = useState('');
  const [formatoProposta, setFormatoProposta] = useState('A4');
  const [loading, setLoading] = useState(false);
  const [propostaGerada, setPropostaGerada] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    carregarTemplates();
    carregarEquipamentos();
  }, []);

  const carregarTemplates = async () => {
    try {
      const response = await fetch('/api/templates/');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
        // Selecionar primeiro template por padrão
        if (data.data.length > 0) {
          setTemplateSelecionado(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const carregarEquipamentos = async () => {
    if (!resultado) return;

    try {
      // Buscar sugestões de equipamentos baseado no dimensionamento
      const response = await fetch('/api/dimensionamento/equipamentos/sugestoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultado)
      });

      const data = await response.json();
      
      if (data.success) {
        setEquipamentosSelecionados({
          boiler_id: data.data.boiler?.id,
          coletor_id: data.data.coletor?.id,
          pressurizador_id: data.data.pressurizador?.id
        });
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    }
  };

  const gerarProposta = async () => {
    if (!dadosCliente.nome_cliente) {
      alert('Nome do cliente é obrigatório');
      return;
    }

    setLoading(true);
    try {
      // Primeiro, criar a proposta
      const propostaData = {
        nome_cliente: dadosCliente.nome_cliente,
        email_cliente: dadosCliente.email_cliente,
        telefone_cliente: dadosCliente.telefone_cliente,
        dimensionamento: {
          ...formData,
          ...resultado
        },
        equipamentos_selecionados: equipamentosSelecionados,
        observacoes: observacoes,
        template_usado: templates.find(t => t.id === templateSelecionado)?.nome,
        formato_proposta: formatoProposta
      };

      const response = await fetch('/api/dimensionamento/proposta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propostaData)
      });

      const data = await response.json();
      
      if (data.success) {
        setPropostaGerada(data.data);
        
        // Gerar preview da proposta
        await gerarPreview(data.data.id);
      } else {
        alert('Erro ao criar proposta: ' + data.error);
      }
    } catch (error) {
      alert('Erro na comunicação com o servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const gerarPreview = async (propostaId) => {
    try {
      const response = await fetch('/api/propostas/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposta_id: propostaId,
          template_id: templateSelecionado,
          formato_saida: 'html'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPreviewHtml(data.data.html);
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    }
  };

  const baixarPDF = async () => {
    if (!propostaGerada) return;

    try {
      const response = await fetch('/api/propostas/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposta_id: propostaGerada.id,
          template_id: templateSelecionado,
          formato_saida: 'pdf'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `proposta_${propostaGerada.uuid}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Erro ao gerar PDF');
      }
    } catch (error) {
      alert('Erro ao baixar PDF');
      console.error(error);
    }
  };

  const copiarLinkVisualizacao = () => {
    if (!propostaGerada) return;

    const link = `${window.location.origin}/api/propostas/visualizar/${propostaGerada.uuid}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copiado para a área de transferência!');
    });
  };

  if (!resultado) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            Realize o dimensionamento primeiro para gerar uma proposta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nome-cliente">Nome do Cliente *</Label>
                <Input
                  id="nome-cliente"
                  value={dadosCliente.nome_cliente}
                  onChange={(e) => setDadosCliente(prev => ({
                    ...prev,
                    nome_cliente: e.target.value
                  }))}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email-cliente">Email</Label>
                <Input
                  id="email-cliente"
                  type="email"
                  value={dadosCliente.email_cliente}
                  onChange={(e) => setDadosCliente(prev => ({
                    ...prev,
                    email_cliente: e.target.value
                  }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="telefone-cliente">Telefone</Label>
                <Input
                  id="telefone-cliente"
                  value={dadosCliente.telefone_cliente}
                  onChange={(e) => setDadosCliente(prev => ({
                    ...prev,
                    telefone_cliente: e.target.value
                  }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configurações da Proposta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template">Template</Label>
                <Select onValueChange={(value) => setTemplateSelecionado(parseInt(value))} value={templateSelecionado?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.nome} ({template.formato})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="formato">Formato</Label>
                <Select onValueChange={setFormatoProposta} value={formatoProposta}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (Documento)</SelectItem>
                    <SelectItem value="16:9">16:9 (Apresentação)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais para a proposta..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {resultado.consumo_diario_estimado}L
                </div>
                <div className="text-sm text-gray-600">Consumo Diário</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {resultado.volume_boiler_sugerido}L
                </div>
                <div className="text-sm text-gray-600">Volume do Boiler</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {resultado.area_coletora_sugerida}m²
                </div>
                <div className="text-sm text-gray-600">Área dos Coletores</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex gap-4"
      >
        <Button 
          onClick={gerarProposta} 
          disabled={loading || !dadosCliente.nome_cliente}
          className="flex-1"
          size="lg"
        >
          {loading ? 'Gerando...' : 'Gerar Proposta'}
        </Button>

        {templateSelecionado && (
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Preview do Template</DialogTitle>
              </DialogHeader>
              <div className="border rounded-lg p-4 bg-white">
                {previewHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Gere uma proposta para ver o preview
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {propostaGerada && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Proposta Gerada com Sucesso!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Gerada em {new Date(propostaGerada.created_at).toLocaleString('pt-BR')}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                ID da Proposta: {propostaGerada.uuid}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button onClick={baixarPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>

                <Button onClick={copiarLinkVisualizacao} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>

                <Button 
                  onClick={() => setShowPreview(true)}
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </div>

              <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                <strong>Link para o cliente:</strong><br />
                <code className="text-xs break-all">
                  {window.location.origin}/api/propostas/visualizar/{propostaGerada.uuid}
                </code>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default GeradorPropostas;

