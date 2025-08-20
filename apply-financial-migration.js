#!/usr/bin/env node

/**
 * Script para aplicar a migração da tabela financial_parameters
 * no Supabase self-hosted usando operações diretas
 */

import { createClient } from '@supabase/supabase-js';
import process from 'process';
import dotenv from 'dotenv';

// Carregar variáveis do arquivo .env
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  console.log('💡 A chave de serviço pode ser encontrada em: Settings > API > service_role');
  process.exit(1);
}

console.log('🚀 Verificando e configurando tabela financial_parameters...');

async function setupFinancialParameters() {
  try {
    // Usar chave de serviço para ter permissões administrativas
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ Cliente Supabase inicializado com chave de serviço');
    
    // Verificar se a tabela já existe tentando fazer uma query
    console.log('🔍 Verificando se a tabela financial_parameters existe...');
    
    const { data: existingData, error: existingError } = await supabase
      .from('financial_parameters')
      .select('id')
      .limit(1);
    
    if (!existingError) {
      console.log('✅ Tabela financial_parameters já existe!');
      console.log('📋 Verificando dados existentes...');
      
      const { data: allData, error: allError } = await supabase
        .from('financial_parameters')
        .select('*');
      
      if (!allError && allData) {
        console.log(`📊 Encontrados ${allData.length} registros na tabela`);
        if (allData.length > 0) {
          console.log('📋 Primeiro registro:', allData[0]);
        }
      }
      
      return true;
    }
    
    console.log('⚠️  Tabela financial_parameters não existe ou não está acessível');
    console.log('📋 INSTRUÇÕES PARA CRIAÇÃO MANUAL:');
    console.log('');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o seguinte SQL:');
    console.log('');
    console.log('-- Criar tabela para armazenar parâmetros financeiros por empresa');
    console.log('CREATE TABLE IF NOT EXISTS public.financial_parameters (');
    console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,');
    console.log('  taxa_desconto DECIMAL(5,4) DEFAULT 0.08, -- 8% ao ano');
    console.log('  inflacao DECIMAL(5,4) DEFAULT 0.04, -- 4% ao ano');
    console.log('  reajuste_tarifario DECIMAL(5,4) DEFAULT 0.05, -- 5% ao ano');
    console.log('  custo_om_percentual DECIMAL(5,4) DEFAULT 0.005, -- 0.5% ao ano');
    console.log('  taxa_financiamento DECIMAL(5,4) DEFAULT 0.12, -- 12% ao ano');
    console.log('  prazo_financiamento INTEGER DEFAULT 120, -- 120 meses (10 anos)');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  created_by UUID REFERENCES auth.users(id),');
    console.log('  updated_by UUID REFERENCES auth.users(id)');
    console.log(');');
    console.log('');
    console.log('-- Habilitar RLS');
    console.log('ALTER TABLE public.financial_parameters ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Política para visualização (usuários podem ver parâmetros de sua empresa)');
    console.log('CREATE POLICY "Users can view financial parameters of their company"');
    console.log('  ON public.financial_parameters FOR SELECT');
    console.log('  USING (');
    console.log('    company_id IN (');
    console.log('      SELECT company_id FROM public.profiles');
    console.log('      WHERE id = auth.uid()');
    console.log('    )');
    console.log('  );');
    console.log('');
    console.log('-- Política para gerenciamento (apenas admins e super_admins)');
    console.log('CREATE POLICY "Admins can manage financial parameters"');
    console.log('  ON public.financial_parameters FOR ALL');
    console.log('  USING (');
    console.log('    EXISTS (');
    console.log('      SELECT 1 FROM public.profiles');
    console.log('      WHERE id = auth.uid()');
    console.log('      AND access_type IN (\'admin\', \'super_admin\')');
    console.log('      AND company_id = financial_parameters.company_id');
    console.log('    )');
    console.log('  );');
    console.log('');
    console.log('-- Criar índice para performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_financial_parameters_company_id');
    console.log('  ON public.financial_parameters(company_id);');
    console.log('');
    console.log('-- Trigger para atualizar updated_at');
    console.log('CREATE TRIGGER update_financial_parameters_updated_at');
    console.log('  BEFORE UPDATE ON public.financial_parameters');
    console.log('  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    console.log('');
    console.log('4. Após executar o SQL, execute novamente este script para verificar');
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    return false;
  }
}

// Executar verificação
setupFinancialParameters()
  .then((success) => {
    if (success) {
      console.log('\n✅ Tabela financial_parameters está configurada e pronta para uso!');
      console.log('✅ Agora você pode usar as configurações financeiras no sistema');
    } else {
      console.log('\n⚠️  Execute o SQL manualmente no Dashboard e tente novamente');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });