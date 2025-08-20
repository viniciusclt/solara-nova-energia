import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Droplets, Thermometer, Home, Zap, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import GeradorPropostas from './GeradorPropostas';

const DimensionadorAquecimento = () => {
  const [formData, setFormData] = useState({
    num_pessoas: 4,
    num_banheiros: 1,
    duracao_banho_min: 10,
    tem_banheira: false,
    tem_ducha_higienica: false,
    tem_pia_cozinha: true,
    tem_maquina_lavar_louca: false,
    tem_maquina_lavar_roupa: false,
    temperatura_desejada: 40,
    localizacao: 'sudeste',
    tipo_coletor: 'placa_plana',
    tipo_pressao: 'baixa',
    tipo_energia_atual: 'eletrica'
  });

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dimensionamento');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calcularDimensionamento = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dimensionamento/calcular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setResultado(data.data);
        setActiveTab('resultados');
      } else {
        alert('Erro no cálculo: ' + data.error);
      }
    } catch (error) {
      alert('Erro na comunicação com o servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Thermometer className="h-8 w-8" />
              Dimensionador de Aquecimento Solar de Água
            </CardTitle>
            <p className="text-blue-100">
              Calcule o sistema ideal para aquecimento de banho baseado nas normas ABNT
            </p>
          </CardHeader>
        </Card>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dimensionamento" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Dimensionamento
          </TabsTrigger>
          <TabsTrigger value="resultados" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="proposta" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Gerar Proposta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dimensionamento" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Dados da Residência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="num-pessoas">Número de Pessoas</Label>
                    <Input
                      id="num-pessoas"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.num_pessoas}
                      onChange={(e) => handleInputChange('num_pessoas', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="num-banheiros">Número de Banheiros</Label>
                    <Input
                      id="num-banheiros"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.num_banheiros}
                      onChange={(e) => handleInputChange('num_banheiros', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="duracao-banho">Duração do Banho (min)</Label>
                    <Input
                      id="duracao-banho"
                      type="number"
                      min="5"
                      max="30"
                      value={formData.duracao_banho_min}
                      onChange={(e) => handleInputChange('duracao_banho_min', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="localizacao">Localização</Label>
                    <Select onValueChange={(value) => handleInputChange('localizacao', value)} value={formData.localizacao}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="norte">Norte</SelectItem>
                        <SelectItem value="nordeste">Nordeste</SelectItem>
                        <SelectItem value="centro-oeste">Centro-Oeste</SelectItem>
                        <SelectItem value="sudeste">Sudeste</SelectItem>
                        <SelectItem value="sul">Sul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="temperatura">Temperatura Desejada (°C)</Label>
                    <Input
                      id="temperatura"
                      type="number"
                      min="30"
                      max="60"
                      value={formData.temperatura_desejada}
                      onChange={(e) => handleInputChange('temperatura_desejada', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Pontos de Consumo de Água Quente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="banheira"
                      checked={formData.tem_banheira}
                      onCheckedChange={(checked) => handleInputChange('tem_banheira', checked)}
                    />
                    <Label htmlFor="banheira">Banheira</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ducha-higienica"
                      checked={formData.tem_ducha_higienica}
                      onCheckedChange={(checked) => handleInputChange('tem_ducha_higienica', checked)}
                    />
                    <Label htmlFor="ducha-higienica">Ducha Higiênica</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pia-cozinha"
                      checked={formData.tem_pia_cozinha}
                      onCheckedChange={(checked) => handleInputChange('tem_pia_cozinha', checked)}
                    />
                    <Label htmlFor="pia-cozinha">Pia da Cozinha</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lava-louca"
                      checked={formData.tem_maquina_lavar_louca}
                      onCheckedChange={(checked) => handleInputChange('tem_maquina_lavar_louca', checked)}
                    />
                    <Label htmlFor="lava-louca">Máquina Lava-Louças</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lava-roupa"
                      checked={formData.tem_maquina_lavar_roupa}
                      onCheckedChange={(checked) => handleInputChange('tem_maquina_lavar_roupa', checked)}
                    />
                    <Label htmlFor="lava-roupa">Máquina Lava-Roupas</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Configurações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tipo-coletor">Tipo de Coletor</Label>
                    <Select onValueChange={(value) => handleInputChange('tipo_coletor', value)} value={formData.tipo_coletor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placa_plana">Placa Plana</SelectItem>
                        <SelectItem value="vacuo">Tubo a Vácuo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tipo-pressao">Tipo de Pressão</Label>
                    <Select onValueChange={(value) => handleInputChange('tipo_pressao', value)} value={formData.tipo_pressao}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a pressão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa Pressão</SelectItem>
                        <SelectItem value="alta">Alta Pressão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="energia-atual">Energia Atual</Label>
                    <Select onValueChange={(value) => handleInputChange('tipo_energia_atual', value)} value={formData.tipo_energia_atual}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a energia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eletrica">Elétrica</SelectItem>
                        <SelectItem value="gas">Gás</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button 
              onClick={calcularDimensionamento} 
              disabled={loading}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {loading ? 'Calculando...' : 'Calcular Dimensionamento'}
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="resultados" className="space-y-6">
          {resultado && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Dimensionamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {resultado.consumo_diario_estimado}L
                      </div>
                      <div className="text-sm text-gray-600">Consumo Diário</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {resultado.volume_boiler_sugerido}L
                      </div>
                      <div className="text-sm text-gray-600">Volume do Boiler</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {resultado.area_coletora_sugerida}m²
                      </div>
                      <div className="text-sm text-gray-600">Área dos Coletores</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equipamentos Sugeridos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Boiler</h4>
                      <Badge variant="outline">{resultado.tipo_boiler_sugerido.replace('_', ' ').toUpperCase()}</Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        Volume: {resultado.volume_boiler_sugerido}L
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Coletor Solar</h4>
                      <Badge variant="outline">{resultado.tipo_coletor_sugerido.replace('_', ' ').toUpperCase()}</Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        Área: {resultado.area_coletora_sugerida}m²
                      </p>
                    </div>
                  </div>
                  
                  {resultado.precisa_pressurizador && (
                    <div className="p-4 border rounded-lg bg-yellow-50">
                      <h4 className="font-semibold mb-2">⚠️ Pressurizador Recomendado</h4>
                      <p className="text-sm text-gray-600">
                        Baseado na configuração do sistema, recomendamos a instalação de um pressurizador.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {resultado.economia && (
                <Card>
                  <CardHeader>
                    <CardTitle>Economia de Energia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatarMoeda(resultado.economia.economia_mensal)}
                        </div>
                        <div className="text-sm text-gray-600">Economia Mensal</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatarMoeda(resultado.economia.economia_anual)}
                        </div>
                        <div className="text-sm text-gray-600">Economia Anual</div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="text-sm text-gray-600">
                      <p>Energia mensal economizada: {resultado.economia.energia_mensal_kwh} kWh</p>
                      <p>Baseado no custo de R$ {resultado.economia.custo_kwh_usado}/kWh</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {!resultado && (
            <Card>
              <CardContent className="text-center py-12">
                <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Realize o dimensionamento para ver os resultados aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="proposta" className="space-y-6">
          <GeradorPropostas resultado={resultado} formData={formData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DimensionadorAquecimento;

