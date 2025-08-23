// =====================================================
// SCRIPT DE TESTE DO BANCO DE DADOS LOCAL
// Testa as operações CRUD no SQLite local
// =====================================================

import { db, runMigrations, seedDatabase, checkDatabaseHealth } from '../src/db/index';
import { companies, profiles, proposalTemplates, proposalElements } from '../src/db/schema';
import { eq, gt } from 'drizzle-orm';

async function testLocalDatabase() {
  console.log('🧪 Iniciando testes do banco de dados local...');
  
  try {
    // 1. Executar migrações
    console.log('\n📋 Executando migrações...');
    await runMigrations();
    console.log('✅ Migrações executadas com sucesso');
    
    // 2. Popular com dados de exemplo
    console.log('\n🌱 Populando banco com dados de exemplo...');
    await seedDatabase();
    console.log('✅ Dados de exemplo inseridos com sucesso');
    
    // 3. Verificar saúde do banco
    console.log('\n🏥 Verificando saúde do banco...');
    const health = await checkDatabaseHealth();
    console.log('✅ Verificação de saúde concluída:', health);
    
    // 4. Testar operações CRUD
    console.log('\n🔧 Testando operações CRUD...');
    
    // Testar SELECT
    console.log('\n📖 Testando SELECT...');
    const allCompanies = await db.select().from(companies);
    console.log(`✅ Encontradas ${allCompanies.length} empresas`);
    
    const allProfiles = await db.select().from(profiles);
    console.log(`✅ Encontrados ${allProfiles.length} perfis`);
    
    const allTemplates = await db.select().from(proposalTemplates);
    console.log(`✅ Encontrados ${allTemplates.length} templates de proposta`);
    
    const allElements = await db.select().from(proposalElements);
    console.log(`✅ Encontrados ${allElements.length} elementos de proposta`);
    
    // Testar INSERT
    console.log('\n➕ Testando INSERT...');
    const newCompany = await db.insert(companies).values({
      id: 'test-company-' + Date.now(),
      name: 'Empresa Teste',
      cnpj: '12345678000199',
      address: 'Rua Teste, 123',
      num_employees: 5
    }).returning();
    console.log('✅ Nova empresa inserida:', newCompany[0]?.name);
    
    // Testar UPDATE
    console.log('\n✏️ Testando UPDATE...');
    if (newCompany[0]) {
      const updatedCompany = await db
        .update(companies)
        .set({ 
          name: 'Empresa Teste Atualizada',
          num_employees: 10
        })
        .where(eq(companies.id, newCompany[0].id))
        .returning();
      console.log('✅ Empresa atualizada:', updatedCompany[0]?.name);
    }
    
    // Testar DELETE
    console.log('\n🗑️ Testando DELETE...');
    if (newCompany[0]) {
      await db.delete(companies).where(eq(companies.id, newCompany[0].id));
      console.log('✅ Empresa removida com sucesso');
    }
    
    // 5. Testar consultas complexas
    console.log('\n🔍 Testando consultas complexas...');
    
    // Buscar empresas com mais de 1 funcionário
    const bigCompanies = await db
      .select()
      .from(companies)
      .where(gt(companies.num_employees, 1));
    console.log(`✅ Encontradas ${bigCompanies.length} empresas com mais de 1 funcionário`);
    
    // Buscar perfis com empresa
    const profilesWithCompany = await db
      .select({
        profileId: profiles.id,
        profileName: profiles.name,
        companyName: companies.name
      })
      .from(profiles)
      .leftJoin(companies, eq(profiles.company_id, companies.id));
    console.log(`✅ Encontrados ${profilesWithCompany.length} perfis com empresa`);
    
    console.log('\n🎉 Todos os testes passaram com sucesso!');
    console.log('\n📊 Resumo dos dados:');
    console.log(`   - Empresas: ${allCompanies.length}`);
    console.log(`   - Perfis: ${allProfiles.length}`);
    console.log(`   - Templates: ${allTemplates.length}`);
    console.log(`   - Elementos: ${allElements.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

// Executar testes
testLocalDatabase()
  .then(() => {
    console.log('\n✅ Script de teste concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no script de teste:', error);
    process.exit(1);
  });

export { testLocalDatabase };