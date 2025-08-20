import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, DollarSign, Calculator, CreditCard, PiggyBank, Target, Settings, Zap, Shield, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FinancialKitManager } from "./FinancialKitManager";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { CalculadoraSolarService, ParametrosSistema, ResultadoFinanceiro } from '@/services/CalculadoraSolarService';
import { TarifaService, TarifaConcessionaria } from '@/services/TarifaService';

interface FinancialData {
  valorSistema: number;
  valorFinal: number;
  custoWp: number;
  bdi: number;
  markup: number;
  margem: number;
  comissaoExterna: number;
  outrosGastos: number;
  tipoVenda: string;
  inflacao: number;
  tarifaEletrica: number;
  reajusteTarifario: number;
  payback: number;
  tir: number;
  vpl: number;
  economiaAnual: number;
  economia25Anos: number;
  // Novos campos para Lei 14.300
  potenciaSistema: number;
  geracaoAnual: number;
  consumoMensal: number;
  incrementoConsumo: number;
  fatorSimultaneidade: number;
  concessionariaId: string;
  tipoLigacao: 'monofasico' | 'bifasico' | 'trifasico';
  anoInstalacao: number;
  depreciacao: number;
}

interface FinancingOption {
  banco: string;
  taxa: number;
  parcelas: number;
  carencia: number;
  valorParcela: number;
}

interface FinancialAnalysisProps {
  currentLead: Record<string, unknown> | null;
}

export function FinancialAnalysis({ currentLead }: FinancialAnalysisProps) {
  const { toast } = useToast();
  
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Análise Financeira</h1>
        <p className="text-muted-foreground">Componente em desenvolvimento</p>
      </div>
    </div>
  );
}