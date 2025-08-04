/**
 * Script de Build para Produção
 * Remove logs de desenvolvimento e otimiza o código para produção
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configurações
const config = {
  // Padrões de console.log para remover
  consolePatterns: [
    /console\.log\([^)]*\);?/g,
    /console\.debug\([^)]*\);?/g,
    /console\.info\([^)]*\);?/g,
    /console\.warn\([^)]*\);?/g,
    // Manter console.error para logs críticos
  ],
  
  // Padrões de comentários de desenvolvimento
  devCommentPatterns: [
    /\/\/ TODO:.*$/gm,
    /\/\* TODO:.*?\*\//gs,
    /\/\/ FIXME:.*$/gm,
    /\/\* FIXME:.*?\*\//gs,
    /\/\/ DEBUG:.*$/gm,
    /\/\* DEBUG:.*?\*\//gs,
  ],
  
  // Arquivos para processar
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  
  // Diretórios para ignorar
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', '.next']
};

class ProductionBuilder {
  constructor() {
    this.processedFiles = 0;
    this.removedLogs = 0;
    this.removedComments = 0;
  }

  /**
   * Executa o processo completo de build
   */
  async build() {
    console.log('🚀 Iniciando build para produção...');
    
    try {
      // 1. Validar ambiente
      this.validateEnvironment();
      
      // 2. Limpar diretório de build anterior
      this.cleanBuildDirectory();
      
      // 3. Processar arquivos fonte
      await this.processSourceFiles();
      
      // 4. Executar build do Vite
      this.runViteBuild();
      
      // 5. Validar build final
      this.validateBuild();
      
      // 6. Gerar relatório
      this.generateReport();
      
      console.log('✅ Build para produção concluído com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro durante o build:', error.message);
      process.exit(1);
    }
  }

  /**
   * Valida se o ambiente está configurado para produção
   */
  validateEnvironment() {
    console.log('🔍 Validando ambiente...');
    
    // Verificar se variáveis de ambiente estão configuradas
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Variáveis de ambiente obrigatórias não configuradas: ${missingVars.join(', ')}`);
    }
    
    // Verificar se não estamos usando valores de exemplo
    if (process.env.VITE_SUPABASE_URL?.includes('your-project')) {
      throw new Error('URL do Supabase ainda está com valor de exemplo');
    }
    
    console.log('✅ Ambiente validado');
  }

  /**
   * Limpa diretório de build anterior
   */
  cleanBuildDirectory() {
    console.log('🧹 Limpando diretório de build...');
    
    const distPath = path.join(projectRoot, 'dist');
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }
    
    console.log('✅ Diretório limpo');
  }

  /**
   * Processa arquivos fonte removendo logs e comentários de desenvolvimento
   */
  async processSourceFiles() {
    console.log('🔧 Processando arquivos fonte...');
    
    const srcPath = path.join(projectRoot, 'src');
    await this.processDirectory(srcPath);
    
    console.log(`✅ ${this.processedFiles} arquivos processados`);
  }

  /**
   * Processa um diretório recursivamente
   */
  async processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !config.ignoreDirs.includes(item)) {
        await this.processDirectory(itemPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (config.fileExtensions.includes(ext)) {
          await this.processFile(itemPath);
        }
      }
    }
  }

  /**
   * Processa um arquivo individual
   */
  async processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remover console.logs
    for (const pattern of config.consolePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, '');
        this.removedLogs += matches.length;
        modified = true;
      }
    }
    
    // Remover comentários de desenvolvimento
    for (const pattern of config.devCommentPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, '');
        this.removedComments += matches.length;
        modified = true;
      }
    }
    
    // Salvar arquivo se foi modificado
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    
    this.processedFiles++;
  }

  /**
   * Executa o build do Vite
   */
  runViteBuild() {
    console.log('📦 Executando build do Vite...');
    
    try {
      execSync('npm run build', {
        cwd: projectRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });
      
      console.log('✅ Build do Vite concluído');
    } catch (error) {
      throw new Error(`Falha no build do Vite: ${error.message}`);
    }
  }

  /**
   * Valida o build final
   */
  validateBuild() {
    console.log('🔍 Validando build final...');
    
    const distPath = path.join(projectRoot, 'dist');
    
    if (!fs.existsSync(distPath)) {
      throw new Error('Diretório dist não foi criado');
    }
    
    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('Arquivo index.html não foi gerado');
    }
    
    // Verificar se não há console.logs no build final
    const jsFiles = this.findJSFiles(distPath);
    for (const jsFile of jsFiles) {
      const content = fs.readFileSync(jsFile, 'utf8');
      if (content.includes('console.log') || content.includes('console.debug')) {
        console.warn(`⚠️ Logs encontrados no arquivo: ${jsFile}`);
      }
    }
    
    console.log('✅ Build validado');
  }

  /**
   * Encontra arquivos JS no diretório de build
   */
  findJSFiles(dir) {
    const jsFiles = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        jsFiles.push(...this.findJSFiles(itemPath));
      } else if (item.endsWith('.js')) {
        jsFiles.push(itemPath);
      }
    }
    
    return jsFiles;
  }

  /**
   * Gera relatório do build
   */
  generateReport() {
    console.log('\n📊 Relatório do Build:');
    console.log(`   📁 Arquivos processados: ${this.processedFiles}`);
    console.log(`   🗑️ Logs removidos: ${this.removedLogs}`);
    console.log(`   💬 Comentários removidos: ${this.removedComments}`);
    
    const distPath = path.join(projectRoot, 'dist');
    const distSize = this.getDirectorySize(distPath);
    console.log(`   📦 Tamanho do build: ${this.formatBytes(distSize)}`);
    
    // Salvar relatório em arquivo
    const report = {
      timestamp: new Date().toISOString(),
      processedFiles: this.processedFiles,
      removedLogs: this.removedLogs,
      removedComments: this.removedComments,
      buildSize: distSize,
      environment: 'production'
    };
    
    fs.writeFileSync(
      path.join(projectRoot, 'build-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  /**
   * Calcula o tamanho de um diretório
   */
  getDirectorySize(dirPath) {
    let size = 0;
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        size += this.getDirectorySize(itemPath);
      } else {
        size += stat.size;
      }
    }
    
    return size;
  }

  /**
   * Formata bytes em formato legível
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new ProductionBuilder();
  builder.build().catch(console.error);
}

export default ProductionBuilder;