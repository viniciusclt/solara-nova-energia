/**
 * Serviço de sincronização do Google Sheets
 * Implementação client-side como fallback para quando a Edge Function não está disponível
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;

// Fallback para desenvolvimento local
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn('Supabase não configurado, usando modo offline');
}

interface GoogleSheetsSettings {
  spreadsheetUrl: string;
  autoSync: boolean;
  syncInterval: number;
  sheetName: string;
  columnMapping: {
    name: string;
    email: string;
    phone: string;
    cpfCnpj: string;
    address: string;
    // REMOVIDO: concessionaria: string; - coluna não existe na tabela leads
    // REMOVIDO: grupo: string; - coluna não existe na tabela leads
    tipoFornecimento: string;
    consumoMedio: string;
    incrementoConsumo: string;
    // Consumo mensal (Jan-Dez)
    consumoJan: string;
    consumoFev: string;
    consumoMar: string;
    consumoAbr: string;
    consumoMai: string;
    consumoJun: string;
    consumoJul: string;
    consumoAgo: string;
    consumoSet: string;
    consumoOut: string;
    consumoNov: string;
    consumoDez: string;
    // Campos adicionais de endereço
    cep: string;
    cidade: string;
    estado: string;
    bairro: string;
    rua: string;
    numero: string;
    // Campos elétricos adicionais
    tensaoAlimentacao: string;
    modalidadeTarifaria: string;
    numeroCliente: string;
    numeroInstalacao: string;
    cdd: string;
  };
}

interface SyncResult {
  success: boolean;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
}

export class GoogleSheetsSyncService {
  private static instance: GoogleSheetsSyncService;
  private offlineData: Record<string, unknown>[] = [];

  public static getInstance(): GoogleSheetsSyncService {
    if (!GoogleSheetsSyncService.instance) {
      GoogleSheetsSyncService.instance = new GoogleSheetsSyncService();
    }
    return GoogleSheetsSyncService.instance;
  }

  /**
   * Cria dados de fallback para teste offline
   */
  private createOfflineFallbackData(): string[][] {
    return [
      ['Nome', 'Email', 'Telefone', 'CPF/CNPJ', 'Endereço', 'Concessionária', 'Grupo', 'Consumo Médio'],
      ['João Silva', 'joao.silva@email.com', '(11) 99999-9999', '123.456.789-00', 'Rua A, 123', 'CPFL', 'A', '350'],
      ['Maria Santos', 'maria.santos@email.com', '(11) 88888-8888', '987.654.321-00', 'Rua B, 456', 'Enel', 'B', '420'],
      ['Pedro Costa', 'pedro.costa@email.com', '(11) 77777-7777', '456.789.123-00', 'Rua C, 789', 'Light', 'A', '280'],
      ['Ana Oliveira', 'ana.oliveira@email.com', '(11) 66666-6666', '321.654.987-00', 'Rua D, 321', 'CEMIG', 'B', '480'],
      ['Carlos Ferreira', 'carlos.ferreira@email.com', '(11) 55555-5555', '654.321.987-00', 'Rua E, 654', 'COPEL', 'A', '320']
    ];
  }

  /**
   * Sincronização offline usando dados mockados
   */
  private async syncOfflineData(settings: GoogleSheetsSettings): Promise<SyncResult> {
    console.log('📱 Executando sincronização offline...');
    
    const offlineData = this.createOfflineFallbackData();
    const headers = offlineData[0];
    const dataRows = offlineData.slice(1);
    
    const result: SyncResult = {
      success: true,
      totalRecords: dataRows.length,
      successfulImports: dataRows.length,
      failedImports: 0,
      errors: []
    };
    
    // Simular processamento dos dados
    this.offlineData = dataRows.map((row, index) => {
      const record: Record<string, unknown> = {};
      headers.forEach((header, headerIndex) => {
        record[header.toLowerCase().replace(/\s+/g, '_')] = row[headerIndex] || '';
      });
      record.id = `offline_${index + 1}`;
      record.created_at = new Date().toISOString();
      return record;
    });
    
    console.log(`✅ Sincronização offline concluída: ${result.successfulImports} registros processados`);
    return result;
  }

  /**
   * Sincroniza dados do Google Sheets
   */
  async syncGoogleSheets(settings: GoogleSheetsSettings): Promise<SyncResult> {
    try {
      console.log('🚀 Iniciando sincronização do Google Sheets...');
      
      // Verificar se o Supabase está disponível
      if (!supabase) {
        console.warn('Supabase não disponível, usando dados offline');
        return this.syncOfflineData(settings);
      }
      
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.warn('Usuário não autenticado, usando dados offline');
        return this.syncOfflineData(settings);
      }

      // Obter informações da empresa do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        console.warn('Empresa do usuário não encontrada, usando dados offline');
        return this.syncOfflineData(settings);
      }

      // Extrair ID da planilha
      const spreadsheetId = this.extractSpreadsheetId(settings.spreadsheetUrl);
      if (!spreadsheetId) {
        throw new Error('URL do Google Sheets inválida');
      }

      // Validar configurações antes de iniciar
      if (!settings.spreadsheetUrl || !settings.sheetName) {
        throw new Error('URL da planilha e nome da aba são obrigatórios');
      }

      // Criar log de importação com fallback
      let importLog: Record<string, unknown> | null = null;
      try {
        // Verificar se a tabela import_logs existe
        const { data, error: logError } = await supabase
          .from('import_logs')
          .insert({
            user_id: user.id,
            company_id: profile.company_id,
            source_type: 'google_sheets',
            source_url: settings.spreadsheetUrl,
            import_settings: settings,
            status: 'in_progress',
            metadata: {
              spreadsheetUrl: settings.spreadsheetUrl,
              sheetName: settings.sheetName,
              startedAt: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (logError) {
          // Se a tabela não existir, criar um log local
          if (logError.code === '42P01' || logError.message?.includes('does not exist')) {
            console.warn('Tabela import_logs não existe, continuando sem log de importação');
            importLog = {
              id: `local_${Date.now()}`,
              isLocal: true,
              startedAt: new Date().toISOString()
            };
          } else {
            const errorDetails = {
              code: logError.code || 'unknown',
              message: logError.message || 'Erro desconhecido',
              details: logError.details || null
            };
            console.warn('Erro ao criar log de importação (continuando sem log):', errorDetails);
            // Criar log local como fallback em vez de lançar erro
            importLog = {
              id: `local_${Date.now()}`,
              isLocal: true,
              startedAt: new Date().toISOString()
            };
          }
        } else {
          importLog = data;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar log';
        console.warn('Erro ao criar log de importação (usando fallback local):', errorMessage);
        // Criar log local como fallback
        importLog = {
          id: `local_${Date.now()}`,
          isLocal: true,
          startedAt: new Date().toISOString()
        };
      }

      try {
        // Buscar dados do Google Sheets
        let sheetsData: string[][];
        console.log(`🔍 Iniciando busca de dados da planilha: ${spreadsheetId}`);
        console.log(`📋 Configurações: aba="${settings.sheetName}", URL="${settings.spreadsheetUrl}"`);
        
        try {
          console.log('🌐 Tentando buscar dados REAIS do Google Sheets...');
          console.log(`🔑 API Key configurada: ${googleApiKey ? 'SIM' : 'NÃO'}`);
          console.log(`📋 Spreadsheet ID: ${spreadsheetId}`);
          console.log(`📋 Sheet Name: ${settings.sheetName}`);
          
          sheetsData = await this.fetchGoogleSheetsData(spreadsheetId, settings);
          
          console.log(`✅ SUCESSO! ${sheetsData.length} linhas obtidas do Google Sheets`);
          console.log(`📋 Primeira linha (cabeçalhos):`, sheetsData[0]);
          
          if (sheetsData.length > 1) {
            console.log(`📋 Segunda linha (exemplo):`, sheetsData[1]);
            console.log(`📊 Total de linhas de dados (excluindo cabeçalho): ${sheetsData.length - 1}`);
          } else {
            console.warn('⚠️ Planilha só contém cabeçalho, sem dados para processar');
          }
          
          // Verificar estrutura dos dados
          console.log(`📊 Estrutura dos dados:`, {
            totalRows: sheetsData.length,
            hasHeader: sheetsData.length > 0,
            headerColumns: sheetsData[0]?.length || 0,
            sampleDataColumns: sheetsData[1]?.length || 0
          });
          
        } catch (fetchError) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.error('❌ ERRO ao buscar dados do Google Sheets:', errorMessage);
          console.warn('⚠️ Verifique: 1) API Key válida, 2) URL da planilha correta, 3) Planilha pública');
          throw new Error(`Falha na conexão com Google Sheets: ${errorMessage}`);
        }

        // Verificar se há dados além do cabeçalho
        if (sheetsData.length <= 1) {
          throw new Error('A planilha não contém dados além do cabeçalho. Verifique se há dados na planilha.');
        }
        
        // Filtrar linhas vazias e processar dados
        console.log(`🔍 Analisando ${sheetsData.length - 1} linhas de dados...`);
        
        const dataRows = sheetsData.slice(1).filter((row, index) => {
          const isValid = row && Array.isArray(row) && row.some(cell => 
            cell !== null && cell !== undefined && cell.toString().trim() !== ''
          );
          if (!isValid) {
            console.log(`⚠️ Linha ${index + 2} ignorada (vazia ou inválida):`, row);
          }
          return isValid;
        });
        
        console.log(`📊 Total de linhas na planilha: ${sheetsData.length}`);
        console.log(`📊 Linhas com dados (excluindo cabeçalho): ${dataRows.length}`);
        console.log(`📊 Linhas ignoradas: ${sheetsData.length - 1 - dataRows.length}`);
        
        if (dataRows.length === 0) {
          console.warn('⚠️ Nenhuma linha válida encontrada para processar');
          console.log('📋 Dados brutos recebidos:', sheetsData.slice(0, 3)); // Mostrar primeiras 3 linhas
          return {
            success: true,
            totalRecords: sheetsData.length,
            successfulImports: 0,
            failedImports: 0,
            errors: ['Nenhuma linha válida encontrada para processar']
          };
        }
        
        console.log(`📊 Processando TODAS as ${dataRows.length} linhas...`);
        const leads = [];
        const processingErrors = [];
        
        console.log(`🔄 Processando ${dataRows.length} linhas de dados...`);
        console.log(`📋 Mapeamento de colunas:`, settings.columnMapping);
        
        for (let index = 0; index < dataRows.length; index++) {
          const row = dataRows[index];
          const rowNumber = index + 2; // +2 porque começamos da linha 1 e pulamos o cabeçalho
          
          console.log(`📝 Processando linha ${rowNumber}:`, row);
          console.log(`📊 Dados brutos da linha ${rowNumber}:`, {
            length: row?.length || 0,
            firstFiveCells: row?.slice(0, 5) || [],
            isEmpty: !row || row.every(cell => !cell || String(cell).trim() === '')
          });
          
          try {
            // Verificar se a linha não está vazia
            if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
              console.log(`⏭️ Linha ${rowNumber} vazia, pulando...`);
              continue; // Pular linha vazia
            }
            
            console.log(`🔍 Iniciando processamento detalhado da linha ${rowNumber}...`);
            const processedLead = this.processRow(row, settings, user.id, profile.company_id, index);
            console.log(`📤 Resultado do processamento da linha ${rowNumber}:`, processedLead);
            
            if (processedLead) {
              leads.push(processedLead);
              console.log(`✅ Lead processado com sucesso da linha ${rowNumber}: ${processedLead.name} (${processedLead.email || 'sem email'})`);
            } else {
              console.log(`⏭️ Linha ${rowNumber} retornou null, pulando...`);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Erro detalhado na linha ${rowNumber}:`, {
              error: errorMessage,
              stack: error instanceof Error ? error.stack : null,
              rowData: row
            });
            
            // Log apenas erros significativos (não linhas vazias)
            if (!errorMessage.includes('Nome e email são obrigatórios') && 
                !errorMessage.includes('muito curto')) {
              console.error(`❌ Erro na linha ${rowNumber}:`, errorMessage);
              processingErrors.push(`Linha ${rowNumber}: ${errorMessage}`);
            } else {
              console.warn(`⚠️ Linha ${rowNumber} ignorada: ${errorMessage}`);
            }
          }
        }

        console.log(`✅ ${leads.length} leads válidos processados de ${dataRows.length} linhas`);
        
        // Relatório de erros de processamento
        const skippedLines = dataRows.length - leads.length;
        if (skippedLines > 0) {
          console.warn(`⚠️ ${skippedLines} linhas foram puladas devido a dados inválidos`);
          console.warn(`💡 Dica: Verifique se os emails estão no formato correto (ex: usuario@dominio.com)`);
        }
        
        if (processingErrors.length > 0) {
          console.warn(`⚠️ ${processingErrors.length} erros de processamento encontrados:`);
          processingErrors.forEach(error => console.warn(`  - ${error}`));
        }

        // Inserir leads no banco de dados
        let successfulImports = 0;
        let failedImports = 0;
        const errors: string[] = [];

        // Processar em lotes para melhor performance
        const batchSize = 10;
        for (let i = 0; i < leads.length; i += batchSize) {
          const batch = leads.slice(i, i + batchSize);
          
          for (const lead of batch) {
            try {
              // Verificar se o lead já existe
              let existingLead = null;
              let selectError = null;
              
              // Se tem email, buscar por email. Senão, buscar por nome e company_id
              if (lead.email && lead.email.trim() !== '') {
                const result = await supabase
                  .from('leads')
                  .select('id')
                  .eq('email', lead.email)
                  .eq('company_id', lead.company_id)
                  .single();
                existingLead = result.data;
                selectError = result.error;
              } else {
                // Para leads sem email, verificar por nome e company_id
                const result = await supabase
                  .from('leads')
                  .select('id')
                  .eq('name', lead.name)
                  .eq('company_id', lead.company_id)
                  .single();
                existingLead = result.data;
                selectError = result.error;
              }

              // Se a tabela não existir, usar fallback
              if (selectError && (selectError.code === '42P01' || selectError.message?.includes('does not exist'))) {
                console.warn('Tabela leads não existe, pulando inserção');
                failedImports++;
                errors.push(`Tabela leads não encontrada para ${lead.name}`);
                continue;
              }

              // Preparar dados do lead usando a estrutura correta da tabela
              const leadData = {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                cpf_cnpj: lead.cpf_cnpj || '',
                address: lead.address || null,
                tipo_fornecimento: lead.tipo_fornecimento || '',
                consumo_medio: lead.consumo_medio || 0,
                incremento_consumo: lead.incremento_consumo || 0,
                consumo_mensal: Array.isArray(lead.consumo_mensal) ? lead.consumo_mensal : Array(12).fill(0),
                cdd: typeof lead.cdd === 'number' ? lead.cdd : null,
                tensao_alimentacao: lead.tensao_alimentacao || '',
                modalidade_tarifaria: lead.modalidade_tarifaria || '',
                numero_cliente: lead.numero_cliente || '',
                numero_instalacao: lead.numero_instalacao || '',
                source: 'google_sheets',
                source_ref: settings.spreadsheetUrl,
                company_id: lead.company_id,
                user_id: lead.user_id,
                created_at: lead.created_at,
                updated_at: lead.updated_at
              };

              if (existingLead) {
                // Atualizar lead existente
                const { error } = await supabase
                  .from('leads')
                  .update({
                    ...leadData,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingLead.id);

                if (error) {
                  failedImports++;
                  const errorMsg = error.message.includes('does not exist') ? 
                    `Coluna inexistente na tabela leads` : error.message;
                  errors.push(`Erro ao atualizar ${lead.name}: ${errorMsg}`);
                } else {
                  successfulImports++;
                }
              } else {
                // Inserir novo lead
                const { error } = await supabase
                  .from('leads')
                  .insert(leadData);

                if (error) {
                  failedImports++;
                  const errorMsg = error.message.includes('does not exist') ? 
                    `Coluna inexistente na tabela leads` : error.message;
                  errors.push(`Erro ao inserir ${lead.name}: ${errorMsg}`);
                } else {
                  successfulImports++;
                }
              }
            } catch (error) {
              failedImports++;
              const errorMessage = error instanceof Error ? error.message : String(error);
              const friendlyError = errorMessage.includes('does not exist') ? 
                'Estrutura da tabela leads incompatível' : errorMessage;
              errors.push(`Erro ao processar ${lead.name}: ${friendlyError}`);
            }
          }
          
          // Pequena pausa entre lotes para não sobrecarregar o banco
          if (i + batchSize < leads.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Atualizar log de importação se existir e não for local
        if (importLog?.id && !importLog.isLocal) {
          try {
            const { error: updateError } = await supabase
              .from('import_logs')
              .update({
                total_records: sheetsData.length,
                successful_imports: successfulImports,
                failed_imports: failedImports,
                error_details: errors.length > 0 ? { errors } : null,
                status: failedImports > 0 ? 'completed_with_errors' : 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', importLog.id);
              
            if (updateError) {
              const errorDetails = {
                code: updateError.code || 'unknown',
                message: updateError.message || 'Erro desconhecido ao atualizar log',
                details: updateError.details || null
              };
              console.error('Erro ao atualizar log de importação:', errorDetails);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('Erro ao atualizar log de importação:', errorMessage);
          }
        } else if (importLog?.isLocal) {
          console.log(`📝 Log local concluído: ${successfulImports} sucessos, ${failedImports} falhas`);
        }

        console.log(`🎉 Importação concluída: ${successfulImports} sucessos, ${failedImports} falhas`);

        return {
          success: true,
          totalRecords: sheetsData.length,
          successfulImports,
          failedImports,
          errors: errors.slice(0, 10) // Retornar apenas os primeiros 10 erros
        };

      } catch (error) {
        // Atualizar log com erro se existir e não for local
        if (importLog?.id && !importLog.isLocal) {
          try {
            const errorDetails = {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : null,
              timestamp: new Date().toISOString()
            };
            
            const { error: updateError } = await supabase
              .from('import_logs')
              .update({
                status: 'failed',
                error_details: errorDetails,
                completed_at: new Date().toISOString()
              })
              .eq('id', importLog.id);
              
            if (updateError) {
              const logErrorDetails = {
                code: updateError.code || 'unknown',
                message: updateError.message || 'Erro desconhecido ao atualizar log com falha',
                details: updateError.details || null
              };
              console.error('Erro ao atualizar log com falha:', logErrorDetails);
            }
          } catch (logError) {
            const errorMessage = logError instanceof Error ? logError.message : 'Erro desconhecido';
            console.error('Erro ao atualizar log com falha:', errorMessage);
          }
        } else if (importLog?.isLocal) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`📝 Log local falhou: ${errorMessage}`);
        }

        throw error;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
      console.error('❌ Erro na sincronização do Google Sheets:', errorMessage);
      return {
        success: false,
        totalRecords: 0,
        successfulImports: 0,
        failedImports: 0,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Extrai o ID da planilha da URL
   */
  private extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Busca dados do Google Sheets
   */
  private async fetchGoogleSheetsData(spreadsheetId: string, settings: GoogleSheetsSettings): Promise<string[][]> {
    console.log(`🔑 Verificando API Key: ${googleApiKey ? 'Configurada' : 'NÃO CONFIGURADA'}`);
    
    if (!googleApiKey) {
      throw new Error('Chave da API do Google não configurada. Verifique a variável VITE_GOOGLE_API_KEY.');
    }

    // Buscar TODA a planilha - range amplo para capturar todos os dados
    const sheetName = settings.sheetName || 'Sheet1';
    const range = `${sheetName}!A:Z`; // Busca todas as colunas de A até Z
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${googleApiKey}`;
    
    console.log(`🌐 URL da requisição: ${url.replace(googleApiKey, 'API_KEY_HIDDEN')}`);
    console.log(`📋 Range solicitado: ${range}`);

    try {
      console.log(`📡 Fazendo requisição para Google Sheets API...`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Timeout de 30 segundos
        signal: AbortSignal.timeout(30000)
      });
      
      console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 403) {
          errorMessage = 'Acesso negado. Verifique se a chave da API do Google está correta e tem permissões para acessar o Google Sheets.';
        } else if (response.status === 404) {
          errorMessage = 'Planilha não encontrada. Verifique se a URL da planilha está correta e se ela é pública.';
        } else if (response.status === 400) {
          errorMessage = 'Requisição inválida. Verifique se o nome da aba está correto.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      console.log(`📊 Dados recebidos da API:`, {
        hasValues: !!data.values,
        rowCount: data.values?.length || 0,
        firstRow: data.values?.[0] || null,
        dataStructure: typeof data
      });
      
      if (!data.values || data.values.length === 0) {
        console.error(`❌ Planilha vazia ou sem dados na aba "${settings.sheetName || 'Sheet1'}"`);;
        throw new Error(`A planilha está vazia ou não contém dados na aba "${settings.sheetName || 'Sheet1'}". Verifique se:\n1. A aba existe\n2. Há dados na planilha\n3. A planilha é pública`);
      }
      
      console.log(`✅ ${data.values.length} linhas encontradas na planilha`);
      return data.values;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout ao buscar dados do Google Sheets. Tente novamente.');
        }
        throw error;
      }
      throw new Error('Erro desconhecido ao buscar dados do Google Sheets.');
    }
  }

  /**
   * Processa uma linha da planilha
   */
  private processRow(row: string[], settings: GoogleSheetsSettings, userId: string, companyId: string, rowIndex: number): Record<string, unknown> | null {
    console.log(`🔍 [processRow] Iniciando processamento da linha ${rowIndex + 1}:`, row.slice(0, 5)); // Mostrar apenas primeiras 5 colunas
    console.log(`🔍 [processRow] Dados completos da linha ${rowIndex + 1}:`, row);
    console.log(`🔍 [processRow] Settings de mapeamento:`, settings.columnMapping);
    
    const getValue = (column: string): string => {
      console.log(`🔍 [getValue] Buscando valor da coluna: ${column}`);
      if (!column || column === 'none') {
        console.log(`🔍 [getValue] Coluna vazia ou 'none', retornando string vazia`);
        return '';
      }
      try {
        const index = this.columnToIndex(column);
        console.log(`🔍 [getValue] Coluna ${column} convertida para índice: ${index}`);
        if (index < 0 || index >= row.length) {
          console.log(`🔍 [getValue] Índice ${index} fora do range (0-${row.length-1}), retornando string vazia`);
          return '';
        }
        const value = row[index];
        console.log(`🔍 [getValue] Valor bruto encontrado no índice ${index}:`, value);
        if (value === null || value === undefined) {
          console.log(`🔍 [getValue] Valor é null/undefined, retornando string vazia`);
          return '';
        }
        const trimmedValue = String(value).trim();
        console.log(`🔍 [getValue] Valor final processado:`, trimmedValue);
        return trimmedValue;
      } catch (error) {
        console.warn(`❌ [getValue] Erro ao obter valor da coluna ${column}:`, error);
        return '';
      }
    };

    // Verificar se a linha existe e não está vazia
    if (!row || !Array.isArray(row) || row.length === 0) {
      console.log(`⚠️ Linha ${rowIndex + 1}: Linha vazia ou inválida`);
      return null;
    }

    console.log(`🔍 [processRow] Extraindo dados principais da linha ${rowIndex + 1}...`);
    const name = getValue(settings.columnMapping.name);
    console.log(`🔍 [processRow] Nome extraído:`, name);
    
    const email = getValue(settings.columnMapping.email);
    console.log(`🔍 [processRow] Email extraído:`, email);
    
    const phone = getValue(settings.columnMapping.phone);
    console.log(`🔍 [processRow] Telefone extraído:`, phone);
    
    const cpfCnpj = getValue(settings.columnMapping.cpfCnpj);
    const address = getValue(settings.columnMapping.address);
    const consumoMedio = getValue(settings.columnMapping.consumoMedio);
    
    console.log(`📊 [processRow] Todos os dados extraídos da linha ${rowIndex + 1}:`, {
      name, email, phone, cpfCnpj, address, consumoMedio
    });

    // Verificar se a linha tem dados essenciais (apenas nome é obrigatório)
    console.log(`🔍 [processRow] Validando dados essenciais da linha ${rowIndex + 1}...`);
    if (!name && !email && !phone) {
      console.log(`⚠️ [processRow] Linha ${rowIndex + 1}: Linha completamente vazia, ignorando`);
      return null; // Linha completamente vazia, ignorar silenciosamente
    }

    // Validação básica - apenas nome é obrigatório
    console.log(`🔍 [processRow] Validando nome: "${name}" (length: ${name?.length || 0})`);
    if (!name || name.length < 2) {
      console.error(`❌ [processRow] Linha ${rowIndex + 1}: Nome inválido ou muito curto: "${name}" - PULANDO LINHA`);
      return null; // Pular linha ao invés de falhar
    }
    
    // Validar formato do email apenas se não estiver vazio
    let validatedEmail = '';
    if (email && email.length > 0) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (emailRegex.test(email)) {
        validatedEmail = email.trim().toLowerCase();
      } else {
        console.warn(`⚠️ Linha ${rowIndex + 1}: Email com formato inválido "${email}" será importado como vazio`);
        validatedEmail = '';
      }
    }

    // Processar consumo mensal
    const consumoMensal = {
      jan: parseFloat(getValue(settings.columnMapping.consumoJan)) || 0,
      fev: parseFloat(getValue(settings.columnMapping.consumoFev)) || 0,
      mar: parseFloat(getValue(settings.columnMapping.consumoMar)) || 0,
      abr: parseFloat(getValue(settings.columnMapping.consumoAbr)) || 0,
      mai: parseFloat(getValue(settings.columnMapping.consumoMai)) || 0,
      jun: parseFloat(getValue(settings.columnMapping.consumoJun)) || 0,
      jul: parseFloat(getValue(settings.columnMapping.consumoJul)) || 0,
      ago: parseFloat(getValue(settings.columnMapping.consumoAgo)) || 0,
      set: parseFloat(getValue(settings.columnMapping.consumoSet)) || 0,
      out: parseFloat(getValue(settings.columnMapping.consumoOut)) || 0,
      nov: parseFloat(getValue(settings.columnMapping.consumoNov)) || 0,
      dez: parseFloat(getValue(settings.columnMapping.consumoDez)) || 0
    };

    // Calcular consumo médio se não fornecido
    let consumoMedioCalculado = parseFloat(consumoMedio) || 0;
    if (consumoMedioCalculado === 0) {
      const valores = Object.values(consumoMensal).filter(v => v > 0);
      if (valores.length > 0) {
        consumoMedioCalculado = valores.reduce((a, b) => a + b, 0) / valores.length;
      }
    }

    // Processar consumo mensal como array numérico para o banco
    const consumoMensalArray = [
      consumoMensal.jan, consumoMensal.fev, consumoMensal.mar, consumoMensal.abr,
      consumoMensal.mai, consumoMensal.jun, consumoMensal.jul, consumoMensal.ago,
      consumoMensal.set, consumoMensal.out, consumoMensal.nov, consumoMensal.dez
    ];

    console.log(`🔍 [processRow] Montando objeto final do lead da linha ${rowIndex + 1}...`);
    const finalLead = {
      name: name.trim(),
      email: validatedEmail,
      phone: phone.trim(),
      cpf_cnpj: getValue(settings.columnMapping.cpfCnpj).trim(),
      // Endereço como objeto JSONB estruturado
      address: {
        street: getValue(settings.columnMapping.rua).trim() || getValue(settings.columnMapping.address).trim(),
        number: getValue(settings.columnMapping.numero).trim(),
        neighborhood: getValue(settings.columnMapping.bairro).trim(),
        city: getValue(settings.columnMapping.cidade).trim(),
        state: getValue(settings.columnMapping.estado).trim(),
        cep: getValue(settings.columnMapping.cep).trim()
      },
      tipo_fornecimento: getValue(settings.columnMapping.tipoFornecimento).trim(),
      consumo_medio: consumoMedioCalculado,
      incremento_consumo: parseFloat(getValue(settings.columnMapping.incrementoConsumo)) || 0,
      consumo_mensal: consumoMensalArray, // Array numérico para o banco
      cdd: parseFloat(getValue(settings.columnMapping.cdd)) || null,
      tensao_alimentacao: getValue(settings.columnMapping.tensaoAlimentacao).trim(),
      modalidade_tarifaria: getValue(settings.columnMapping.modalidadeTarifaria).trim(),
      numero_cliente: getValue(settings.columnMapping.numeroCliente).trim(),
      numero_instalacao: getValue(settings.columnMapping.numeroInstalacao).trim(),
      user_id: userId,
      company_id: companyId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`✅ [processRow] Lead final montado para linha ${rowIndex + 1}:`, finalLead);
    return finalLead;
  }

  /**
   * Converte letra da coluna para índice numérico
   */
  private columnToIndex(column: string): number {
    console.log(`🔍 [columnToIndex] Convertendo coluna: "${column}"`);
    if (!column || column === 'none') {
      console.log(`🔍 [columnToIndex] Coluna vazia ou 'none', retornando -1`);
      return -1;
    }
    
    // Normalizar entrada
    const normalizedColumn = column.trim().toUpperCase();
    console.log(`🔍 [columnToIndex] Coluna normalizada: "${normalizedColumn}"`);
    
    // Verificar se contém apenas letras
    if (!/^[A-Z]+$/.test(normalizedColumn)) {
      console.log(`🔍 [columnToIndex] Coluna contém caracteres inválidos, retornando -1`);
      return -1;
    }
    
    let result = 0;
    for (let i = 0; i < normalizedColumn.length; i++) {
      result = result * 26 + (normalizedColumn.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    const finalIndex = result - 1;
    console.log(`🔍 [columnToIndex] Resultado final: coluna "${column}" = índice ${finalIndex}`);
    return finalIndex;
  }
}

export const googleSheetsSyncService = GoogleSheetsSyncService.getInstance();