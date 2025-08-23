import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Configurações de retry
    retries: {
      runMode: 2,
      openMode: 0,
    },
    
    // Padrões de arquivos de teste
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Configurações de downloads
    downloadsFolder: 'cypress/downloads',
    
    // Configurações de fixtures
    fixturesFolder: 'cypress/fixtures',
    
    // Configurações de screenshots
    screenshotsFolder: 'cypress/screenshots',
    
    // Configurações de vídeos
    videosFolder: 'cypress/videos',
    
    // Configurações de suporte
    supportFile: 'cypress/support/e2e.ts',
    
    setupNodeEvents(on, config) {
      // Implementar listeners de eventos do Node.js aqui
      
      // Plugin para cobertura de código
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Task para limpar downloads
        clearDownloads() {
          const fs = require('fs');
          const path = require('path');
          const downloadsPath = path.join(__dirname, 'cypress/downloads');
          
          if (fs.existsSync(downloadsPath)) {
            fs.readdirSync(downloadsPath).forEach((file) => {
              fs.unlinkSync(path.join(downloadsPath, file));
            });
          }
          
          return null;
        },
        
        // Task para verificar arquivo
        fileExists(filename) {
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(__dirname, 'cypress/downloads', filename);
          
          return fs.existsSync(filePath);
        },
      });
      
      // Configurações específicas por ambiente
      if (config.env.coverage) {
        // Configurar cobertura de código
        require('@cypress/code-coverage/task')(on, config);
      }
      
      return config;
    },
    
    // Variáveis de ambiente
    env: {
      coverage: false,
      apiUrl: 'http://localhost:3001/api',
      wsUrl: 'ws://localhost:3001',
    },
    
    // Configurações experimentais
    experimentalStudio: true,
    experimentalSessionAndOrigin: true,
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    
    // Padrões de arquivos de teste de componente
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    
    // Configurações de suporte para componentes
    supportFile: 'cypress/support/component.ts',
    
    // Configurações de viewport para componentes
    viewportWidth: 1000,
    viewportHeight: 660,
  },
});