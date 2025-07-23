import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, FileSpreadsheet, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExcelImporter } from "./ExcelImporter";

interface FinancialKit {
  id: string;
  nome: string;
  potencia: number;
  preco: number;
  preco_wp: number;
  fabricante?: string;
  categoria?: string;
  descricao?: string;
  ativo: boolean;
}

interface KitData {
  nome: string;
  potencia: number;
  preco: number;
  precoWp: number;
  fabricante?: string;
  categoria?: string;
  descricao?: string;
}

interface FinancialKitManagerProps {
  onKitsUpdated?: () => void;
}

export function FinancialKitManager({ onKitsUpdated }: FinancialKitManagerProps = {}) {
  const { toast } = useToast();
  const [kits, setKits] = useState<FinancialKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKit, setEditingKit] = useState<FinancialKit | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    potencia: "",
    preco: "",
    fabricante: "",
    categoria: "",
    descricao: ""
  });

  const categorias = ["Residencial", "Comercial", "Industrial", "Rural"];

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('financial_kits')
        .select('*')
        .eq('ativo', true)
        .order('potencia', { ascending: true });

      if (error) throw error;
      setKits(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar kits",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      potencia: "",
      preco: "",
      fabricante: "",
      categoria: "",
      descricao: ""
    });
    setIsEditing(false);
    setEditingKit(null);
  };

  const handleNewKit = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditKit = (kit: FinancialKit) => {
    setFormData({
      nome: kit.nome,
      potencia: kit.potencia.toString(),
      preco: kit.preco.toString(),
      fabricante: kit.fabricante || "",
      categoria: kit.categoria || "",
      descricao: kit.descricao || ""
    });
    setEditingKit(kit);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const potencia = parseFloat(formData.potencia);
    const preco = parseFloat(formData.preco);
    
    if (!formData.nome || potencia <= 0 || preco <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Preencha todos os campos obrigatórios com valores válidos",
        variant: "destructive"
      });
      return;
    }

    const precoWp = preco / (potencia * 1000);
    
    try {
      if (isEditing && editingKit) {
        const { error } = await supabase
          .from('financial_kits')
          .update({
            nome: formData.nome,
            potencia,
            preco,
            preco_wp: precoWp,
            fabricante: formData.fabricante || null,
            categoria: formData.categoria || null,
            descricao: formData.descricao || null
          })
          .eq('id', editingKit.id);

        if (error) throw error;
        
        toast({
          title: "Kit atualizado",
          description: "Kit financeiro atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('financial_kits')
          .insert({
            nome: formData.nome,
            potencia,
            preco,
            preco_wp: precoWp,
            fabricante: formData.fabricante || null,
            categoria: formData.categoria || null,
            descricao: formData.descricao || null
          });

        if (error) throw error;
        
        toast({
          title: "Kit criado",
          description: "Kit financeiro criado com sucesso"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchKits();
      onKitsUpdated?.();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar kit",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteKit = async (kit: FinancialKit) => {
    try {
      const { error } = await supabase
        .from('financial_kits')
        .update({ ativo: false })
        .eq('id', kit.id);

      if (error) throw error;
      
      toast({
        title: "Kit removido",
        description: "Kit financeiro removido com sucesso"
      });
      
      fetchKits();
      onKitsUpdated?.();
    } catch (error: any) {
      toast({
        title: "Erro ao remover kit",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleImportData = async (importedData: KitData[]) => {
    try {
      const kitsToInsert = importedData.map(kit => ({
        nome: kit.nome,
        potencia: kit.potencia,
        preco: kit.preco,
        preco_wp: kit.precoWp,
        fabricante: kit.fabricante || null,
        categoria: kit.categoria || null,
        descricao: kit.descricao || null
      }));

      const { error } = await supabase
        .from('financial_kits')
        .insert(kitsToInsert);

      if (error) throw error;
      
      setIsImporterOpen(false);
      fetchKits();
      onKitsUpdated?.();
      
      toast({
        title: "Kits importados",
        description: `${importedData.length} kits importados com sucesso`
      });
    } catch (error: any) {
      toast({
        title: "Erro ao importar kits",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isImporterOpen) {
    return (
      <ExcelImporter 
        onDataImported={handleImportData}
        onClose={() => setIsImporterOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Gerenciador de Kits Financeiros
              </CardTitle>
              <CardDescription>
                Gerencie os kits disponíveis para orçamentos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImporterOpen(true)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Importar Excel
              </Button>
              <Button onClick={handleNewKit}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Kit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando kits...</div>
          ) : kits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum kit encontrado. Clique em "Novo Kit" para começar.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Potência</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>R$/Wp</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kits.map((kit) => (
                    <TableRow key={kit.id}>
                      <TableCell className="font-medium">{kit.nome}</TableCell>
                      <TableCell>{kit.potencia} kWp</TableCell>
                      <TableCell>R$ {kit.preco.toLocaleString()}</TableCell>
                      <TableCell>R$ {kit.preco_wp.toFixed(2)}</TableCell>
                      <TableCell>{kit.fabricante}</TableCell>
                      <TableCell>
                        {kit.categoria && (
                          <Badge variant="outline">{kit.categoria}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditKit(kit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover o kit "{kit.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteKit(kit)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Kit" : "Novo Kit Financeiro"}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? "Edite as informações do kit" : "Adicione um novo kit financeiro"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Kit *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Kit 7.2kWp - Canadian"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="potencia">Potência (kWp) *</Label>
                <Input
                  id="potencia"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.potencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, potencia: e.target.value }))}
                  placeholder="7.2"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preco">Preço (R$) *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco: e.target.value }))}
                  placeholder="18500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fabricante">Fabricante</Label>
                <Input
                  id="fabricante"
                  value={formData.fabricante}
                  onChange={(e) => setFormData(prev => ({ ...prev, fabricante: e.target.value }))}
                  placeholder="Canadian Solar"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do kit..."
                rows={3}
              />
            </div>

            {formData.potencia && formData.preco && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Preço por Wp:</div>
                <div className="text-lg font-semibold text-primary">
                  R$ {(parseFloat(formData.preco) / (parseFloat(formData.potencia) * 1000)).toFixed(2)}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Atualizar" : "Criar"} Kit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}