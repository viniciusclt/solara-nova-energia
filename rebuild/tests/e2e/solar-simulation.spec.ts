import { test, expect } from '@playwright/test';

// Seletores e textos principais para robustez
const selectors = {
  pageTitle: 'text=Simulação Técnica',
  basicBtn: 'button:has-text("Básico")',
  preciseBtn: 'button:has-text("Preciso")',
  pvsolBtn: 'button:has-text("Importar PV*Sol")',
  simularBtn: 'button:has-text("Simular")',
  simulandoText: 'text=Simulando...',
  pvsolPanelText: 'text=Importe seu arquivo do PV*Sol',
  pvsolCloseBtn: 'button[aria-label="Fechar importação PV*Sol"]',
  resumoSimulacao: 'text=Resumo da Simulação',
};

const navigateToSolar = async ({ page }: any) => {
  await page.goto('/solar');
  // Ir direto para o passo "Simulação"
  await page.getByRole('button', { name: 'Simulação' }).click();
  await expect(page.locator(selectors.pageTitle)).toBeVisible();

  // Selecionar a aba "Resultados" dentro da seção de Simulação (TabsTrigger é um botão simples)
  const resultadosTabBtn = page.locator('button:has-text("Resultados")').first();
  await expect(resultadosTabBtn).toBeVisible({ timeout: 5000 });
  await resultadosTabBtn.click();

  // Aguardar bloco de Parâmetros renderizar
  await expect(page.getByText('Parâmetros de Simulação')).toBeVisible({ timeout: 10000 });
};

// Happy path básico/preciso/pvsol
 test.describe('Simulação - níveis e execução', () => {
  test('Alterna níveis e executa simulação básica', async ({ page }) => {
    await navigateToSolar({ page });

    // Garantir que botão Básico está visível e clicar
    await page.getByRole('button', { name: 'Básico' }).click();
    // Em nível básico, o painel PV*Sol deve estar oculto
    await expect(page.locator(selectors.pvsolPanelText)).toHaveCount(0);

    // Aguardar input de consumo visível e preencher
    let consumoInput = page.getByLabel('Consumo mensal (kWh)');
    try {
      await expect(consumoInput).toBeVisible({ timeout: 5000 });
    } catch {
      await expect(page.locator('#consumo')).toBeVisible({ timeout: 5000 });
      consumoInput = page.locator('#consumo');
    }
    await consumoInput.click();
    await consumoInput.fill('500');

    // Executar simulação
    await page.getByRole('button', { name: 'Simular' }).click();

    // Validar que o resumo apareceu
    await expect(page.locator(selectors.resumoSimulacao)).toBeVisible({ timeout: 30000 });
  });

  test('Alterna para Preciso e PV*Sol e valida UI', async ({ page }) => {
    await navigateToSolar({ page });

    // Preciso deve fechar painel PV*Sol
    await page.getByRole('button', { name: 'Preciso' }).click();
    await expect(page.locator(selectors.pvsolPanelText)).toHaveCount(0);

    // PV*Sol abre painel e mostra instruções
    await page.getByRole('button', { name: 'Importar PV*Sol' }).click();
    await expect(page.locator(selectors.pvsolPanelText)).toBeVisible();

    // Fechar importação
    await page.locator(selectors.pvsolCloseBtn).click();
    await expect(page.locator(selectors.pvsolPanelText)).toHaveCount(0);
  });
});

test.describe('Propostas - salvar', () => {
  test('Salva proposta após simulação e seleção de lead', async ({ page, request }) => {
    // 1) Criar contato via API para seleção no autocomplete
    const uniq = Date.now();
    const contactName = `E2E Lead ${uniq}`;
    const res = await request.post('/api/contacts', {
      data: {
        name: contactName,
        email: `e2e-${uniq}@test.com`,
        phone: '11999990000',
        consumoMedio: 500,
      },
    });
    expect(res.ok()).toBeTruthy();

    // 2) Navegar até /solar e ir para Simulação
    await navigateToSolar({ page });

    // 3) Preencher consumo e rodar simulação (modo Básico)
    await page.getByRole('button', { name: 'Básico' }).click();
    let consumoInput = page.getByLabel('Consumo mensal (kWh)');
    try {
      await expect(consumoInput).toBeVisible({ timeout: 5000 });
    } catch {
      await expect(page.locator('#consumo')).toBeVisible({ timeout: 5000 });
      consumoInput = page.locator('#consumo');
    }
    await consumoInput.click();
    await consumoInput.fill('500');
    await page.getByRole('button', { name: 'Simular' }).click();
    await expect(page.getByText('Resumo da Simulação')).toBeVisible({ timeout: 30000 });

    // 4) Selecionar o lead pelo autocomplete (busca inline)
    // Ir para a etapa "Lead" para garantir visibilidade do campo de busca
    await page.getByRole('button', { name: 'Lead' }).click();
    const leadSearch = page.locator('#leadSearch');
    await expect(leadSearch).toBeVisible({ timeout: 5000 });
    await leadSearch.fill(contactName);
    // Aguardar e selecionar a opção correspondente
    const leadOption = page.getByRole('button', { name: new RegExp(contactName) }).first();
    await expect(leadOption).toBeVisible({ timeout: 10000 });
    await leadOption.click();

    // Confirmar que o lead foi vinculado (UI exibe badge/texto)
    await expect(page.getByText('Lead vinculado')).toBeVisible({ timeout: 5000 });
    // 5) Ir para "Propostas" e salvar proposta
    await page.getByRole('button', { name: 'Propostas' }).click();
    // Link para abrir ficha do lead deve estar visível na seção de Propostas
    await expect(page.getByRole('link', { name: 'Abrir ficha do lead' })).toBeVisible({ timeout: 5000 });
    const saveBtn = page.getByRole('button', { name: 'Salvar Proposta' });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await expect(saveBtn).toBeEnabled();

    const [saveResponse] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/proposals') && resp.request().method() === 'POST'),
      saveBtn.click(),
    ]);
    expect(saveResponse.ok()).toBeTruthy();

    // 6) Validar feedback de sucesso em tela
    await expect(page.locator('text=Proposta salva com sucesso!')).toBeVisible({ timeout: 20000 });
  });
});