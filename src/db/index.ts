import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Caminho para o banco de dados local
const dbPath = path.join(process.cwd(), 'local-database.db');

// Criar diretório se não existir
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Criar conexão com SQLite
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Criar instância do Drizzle
export const db = drizzle(sqlite, { schema });

// Função para executar migrações
export async function runMigrations() {
  try {
    console.log('🔄 Executando migrações do banco local...');
    migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Migrações executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    throw error;
  }
}

// Função para inicializar o banco com dados de exemplo
export async function seedDatabase() {
  try {
    console.log('🌱 Inserindo dados de exemplo...');
    
    // Verificar se já existem dados
    const existingCompanies = await db.select().from(schema.companies).limit(1);
    if (existingCompanies.length > 0) {
      console.log('📊 Banco já possui dados, pulando seed...');
      return;
    }

    // Inserir empresa de exemplo
    const [company] = await db.insert(schema.companies).values({
      name: 'Solara Nova Energia',
      cnpj: '12.345.678/0001-90',
      address: 'Rua das Energias, 123 - São Paulo, SP',
      num_employees: 10
    }).returning();

    // Inserir perfil de administrador
    const [adminProfile] = await db.insert(schema.profiles).values({
      id: 'admin-local-id',
      email: 'admin@solara.com.br',
      name: 'Administrador Local',
      access_type: 'super_admin',
      company_id: company.id
    }).returning();

    // Inserir assinatura ativa
    await db.insert(schema.subscriptions).values({
      company_id: company.id,
      status: 'ativa',
      monthly_value: 299.90,
      authorized_employees: 10,
      is_free: false
    });

    // Inserir templates de proposta de exemplo
    const [templateA4] = await db.insert(schema.proposalTemplates).values({
      name: 'Template Básico A4',
      format: 'A4',
      canvas_data: { width: 794, height: 1123, background: '#ffffff' },
      is_public: true,
      company_id: company.id,
      created_by: adminProfile.id
    }).returning();

    const [template169] = await db.insert(schema.proposalTemplates).values({
      name: 'Template Apresentação 16:9',
      format: '16:9',
      canvas_data: { width: 1920, height: 1080, background: '#f8fafc' },
      is_public: true,
      company_id: company.id,
      created_by: adminProfile.id
    }).returning();

    // Inserir elementos de exemplo para template A4
    await db.insert(schema.proposalElements).values([
      {
        template_id: templateA4.id,
        element_type: 'text',
        properties: {
          content: 'Título da Proposta',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center'
        },
        position: { x: 50, y: 50, width: 694, height: 60 },
        z_index: 1
      },
      {
        template_id: templateA4.id,
        element_type: 'text',
        properties: {
          content: 'Descrição do projeto e benefícios da energia solar',
          fontSize: 14,
          color: '#4b5563',
          textAlign: 'left'
        },
        position: { x: 50, y: 150, width: 694, height: 100 },
        z_index: 2
      },
      {
        template_id: templateA4.id,
        element_type: 'shape',
        properties: {
          type: 'rectangle',
          fill: '#0EA5E9',
          stroke: 'none',
          opacity: 0.1
        },
        position: { x: 50, y: 300, width: 694, height: 200 },
        z_index: 0
      }
    ]);

    // Inserir módulos de treinamento de exemplo
    const [trainingModule] = await db.insert(schema.trainingModules).values({
      title: 'Introdução à Energia Solar',
      description: 'Conceitos básicos sobre energia solar fotovoltaica',
      category: 'Fundamentos',
      difficulty_level: 'iniciante',
      estimated_duration: 60,
      order_index: 1
    }).returning();

    // Inserir conteúdo de treinamento
    await db.insert(schema.trainingContent).values([
      {
        module_id: trainingModule.id,
        content_type: 'video',
        title: 'O que é energia solar?',
        content_data: {
          video_url: 'https://example.com/video1.mp4',
          duration: 300,
          transcript: 'Transcrição do vídeo...'
        },
        order_index: 1
      },
      {
        module_id: trainingModule.id,
        content_type: 'text',
        title: 'Componentes de um sistema solar',
        content_data: {
          content: 'Texto explicativo sobre os componentes...',
          images: ['https://example.com/image1.jpg']
        },
        order_index: 2
      }
    ]);

    console.log('✅ Dados de exemplo inseridos com sucesso!');
    console.log(`📊 Empresa criada: ${company.name}`);
    console.log(`👤 Admin criado: ${adminProfile.email}`);
    console.log(`📄 Templates criados: ${templateA4.name}, ${template169.name}`);
    console.log(`🎓 Módulo de treinamento criado: ${trainingModule.title}`);
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados de exemplo:', error);
    throw error;
  }
}

// Função para verificar a saúde do banco
export async function checkDatabaseHealth() {
  try {
    const companies = await db.select().from(schema.companies).limit(1);
    const profiles = await db.select().from(schema.profiles).limit(1);
    const templates = await db.select().from(schema.proposalTemplates).limit(1);
    
    console.log('🏥 Status do banco local:');
    console.log(`  📊 Empresas: ${companies.length > 0 ? '✅' : '❌'}`);
    console.log(`  👤 Perfis: ${profiles.length > 0 ? '✅' : '❌'}`);
    console.log(`  📄 Templates: ${templates.length > 0 ? '✅' : '❌'}`);
    
    return {
      healthy: companies.length > 0 && profiles.length > 0,
      companies: companies.length,
      profiles: profiles.length,
      templates: templates.length
    };
  } catch (error) {
    console.error('❌ Erro ao verificar saúde do banco:', error);
    return { healthy: false, error: error.message };
  }
}

// Exportar esquema para uso em outros arquivos
export { schema };
export default db;