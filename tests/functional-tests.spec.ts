import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8081';
const TEST_USER = {
  email: 'test@solarcalcpro.com',
  password: 'TestPassword123!'
};

const TEST_LEAD = {
  name: 'Empresa Teste Solar LTDA',
  cnpj: '11.222.333/0001-81',
  email: 'contato@empresateste.com.br',
  phone: '(11) 99999-9999',
  cep: '01310-100',
  consumo: '500'
};

test.describe('SolarCalc Pro - Functional Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('Authentication Tests', () => {
    
    test('should display login page', async ({ page }) => {
      await expect(page).toHaveTitle(/SolarCalc Pro/);
      await expect(page.locator('text=Login')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.fill('input[type="email"]', 'invalid@email.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Credenciais inválidas')).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
      // Mock successful login or use test credentials
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });

  test.describe('Lead Management Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should create new lead', async ({ page }) => {
      // Click on "Novo Lead" button
      await page.click('text=Novo Lead');
      
      // Fill lead form
      await page.fill('input[name="name"]', TEST_LEAD.name);
      await page.fill('input[name="cnpj"]', TEST_LEAD.cnpj);
      await page.fill('input[name="email"]', TEST_LEAD.email);
      await page.fill('input[name="phone"]', TEST_LEAD.phone);
      await page.fill('input[name="cep"]', TEST_LEAD.cep);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Verify success message
      await expect(page.locator('text=Lead criado com sucesso')).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('text=Novo Lead');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Nome é obrigatório')).toBeVisible();
    });

    test('should validate CNPJ format', async ({ page }) => {
      await page.click('text=Novo Lead');
      
      await page.fill('input[name="cnpj"]', '123.456.789-00');
      await page.blur('input[name="cnpj"]');
      
      await expect(page.locator('text=CNPJ inválido')).toBeVisible();
    });

    test('should search and filter leads', async ({ page }) => {
      // Use search functionality
      await page.fill('input[placeholder*="Buscar"]', TEST_LEAD.name);
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Verify filtered results
      await expect(page.locator(`text=${TEST_LEAD.name}`)).toBeVisible();
    });
  });

  test.describe('Consumption Calculator Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should calculate consumption from monthly value', async ({ page }) => {
      // Navigate to calculator
      await page.click('text=Calculadora');
      
      // Enter consumption value
      await page.fill('input[name="consumo"]', TEST_LEAD.consumo);
      
      // Click calculate
      await page.click('button:has-text("Calcular")');
      
      // Verify results are displayed
      await expect(page.locator('text=Potência Recomendada')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=kWp')).toBeVisible();
    });

    test('should validate consumption input', async ({ page }) => {
      await page.click('text=Calculadora');
      
      // Enter invalid value
      await page.fill('input[name="consumo"]', '-100');
      await page.blur('input[name="consumo"]');
      
      await expect(page.locator('text=Valor deve ser positivo')).toBeVisible();
    });
  });

  test.describe('Technical Simulation Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should select modules and inverters', async ({ page }) => {
      await page.click('text=Simulação');
      
      // Select a module
      await page.click('text=Selecionar Módulo');
      await page.click('.module-card:first-child');
      
      // Select an inverter
      await page.click('text=Selecionar Inversor');
      await page.click('.inverter-card:first-child');
      
      // Verify selections
      await expect(page.locator('text=Módulo selecionado')).toBeVisible();
      await expect(page.locator('text=Inversor selecionado')).toBeVisible();
    });

    test('should calculate system power', async ({ page }) => {
      await page.click('text=Simulação');
      
      // Enter system parameters
      await page.fill('input[name="potencia"]', '5.0');
      
      // Verify calculations
      await expect(page.locator('text=Geração Estimada')).toBeVisible();
    });
  });

  test.describe('Financial Analysis Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should calculate ROI and payback', async ({ page }) => {
      await page.click('text=Financeiro');
      
      // Enter financial parameters
      await page.fill('input[name="investimento"]', '25000');
      await page.fill('input[name="economia"]', '300');
      
      // Verify calculations
      await expect(page.locator('text=ROI')).toBeVisible();
      await expect(page.locator('text=Payback')).toBeVisible();
      await expect(page.locator('text=anos')).toBeVisible();
    });

    test('should display financial projections', async ({ page }) => {
      await page.click('text=Financeiro');
      
      // Verify charts and projections are displayed
      await expect(page.locator('.recharts-wrapper')).toBeVisible();
      await expect(page.locator('text=Projeção')).toBeVisible();
    });
  });

  test.describe('Proposal Generation Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should select proposal template', async ({ page }) => {
      await page.click('text=Proposta');
      
      // Select a template
      await page.click('.template-card:first-child');
      
      // Verify template selection
      await expect(page.locator('text=Template selecionado')).toBeVisible();
    });

    test('should customize template', async ({ page }) => {
      await page.click('text=Proposta');
      
      // Click customize button
      await page.click('button:has-text("Personalizar")');
      
      // Verify customization dialog
      await expect(page.locator('text=Personalizar Template')).toBeVisible();
      
      // Change company name
      await page.fill('input[name="companyName"]', 'Minha Empresa Solar');
      
      // Save customization
      await page.click('button:has-text("Salvar")');
      
      await expect(page.locator('text=Customização salva')).toBeVisible();
    });

    test('should generate PDF proposal', async ({ page }) => {
      await page.click('text=Proposta');
      
      // Select template and generate PDF
      await page.click('.template-card:first-child');
      
      // Start download listener
      const downloadPromise = page.waitForEvent('download');
      
      await page.click('button:has-text("Gerar PDF")');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });

  test.describe('Data Import Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should validate Excel file format', async ({ page }) => {
      await page.click('text=Importar');
      
      // Try to upload invalid file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'invalid.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('invalid content')
      });
      
      await expect(page.locator('text=Formato de arquivo inválido')).toBeVisible();
    });
  });

  test.describe('Version Display Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should display version information', async ({ page }) => {
      // Verify version display component is visible
      await expect(page.locator('[data-testid="version-display"]')).toBeVisible();
      
      // Verify version format
      await expect(page.locator('text=/v\\d+\\.\\d+\\.\\d+/')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should generate PDF within acceptable time', async ({ page }) => {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
      
      await page.click('text=Proposta');
      await page.click('.template-card:first-child');
      
      const startTime = Date.now();
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Gerar PDF")');
      await downloadPromise;
      
      const generateTime = Date.now() - startTime;
      
      // Should generate within 10 seconds
      expect(generateTime).toBeLessThan(10000);
    });
  });

  test.describe('Responsive Design Tests', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
      
      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
      
      // Verify tablet layout
      await expect(page.locator('.dashboard-grid')).toBeVisible();
    });
  });
});

// Utility functions for tests
test.describe('Utility Functions', () => {
  
  test('should validate email format', async ({ page }) => {
    await page.goto(`${BASE_URL}/test-utils`);
    
    // Test valid email
    const validResult = await page.evaluate(() => {
      // @ts-expect-error - Testing utility function
      return window.validateEmail('test@example.com');
    });
    expect(validResult).toBe(true);
    
    // Test invalid email
    const invalidResult = await page.evaluate(() => {
      // @ts-expect-error - Testing utility function
      return window.validateEmail('invalid-email');
    });
    expect(invalidResult).toBe(false);
  });

  test('should validate CNPJ format', async ({ page }) => {
    await page.goto(`${BASE_URL}/test-utils`);
    
    // Test valid CNPJ
    const validResult = await page.evaluate(() => {
      // @ts-expect-error - Testing utility function
      return window.validateCNPJ('11.222.333/0001-81');
    });
    expect(validResult).toBe(true);
    
    // Test invalid CNPJ
    const invalidResult = await page.evaluate(() => {
      // @ts-expect-error - Testing utility function
      return window.validateCNPJ('123.456.789/0001-00');
    });
    expect(invalidResult).toBe(false);
  });
});