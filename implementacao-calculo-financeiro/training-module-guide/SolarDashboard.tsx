                      </CardTitle>
                      <CardDescription>
                        Importe kits e valores financeiros via Excel
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ExcelImporterV2 />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-6 w-6" />
                        Instituições Financeiras
                      </CardTitle>
                      <CardDescription>
                        Gerencie bancos e opções de financiamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FinancialInstitutionManager />
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Análise Financeira */}
              {!currentLead ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum lead selecionado</h3>
                    <p className="text-muted-foreground mb-4">
                      Selecione um lead na aba "Dados do Lead" para fazer a análise financeira
                    </p>
                    <Button onClick={() => setActiveTab("lead-data")}>
                      Ir para Dados do Lead
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-6 w-6" />
                        Análise Financeira
                      </CardTitle>
                      <CardDescription>
                        Análise completa de viabilidade e opções de financiamento
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Tabs defaultValue="analysis" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="analysis" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Análise de Viabilidade
                      </TabsTrigger>
                      <TabsTrigger value="financing" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Simulador de Financiamento
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="analysis">
                      <FinancialAnalysis currentLead={currentLead} />
                    </TabsContent>

                    <TabsContent value="financing">
                      <FinancialCalculator currentLead={currentLead} />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </TabsContent>

          {hasPermission('generate_proposals') && (
            <TabsContent value="proposals">
              <ProposalWorkspace currentLead={currentLead} />
            </TabsContent>
          )}

          {/* Aba "Gerenciamento" removida - funcionalidades realocadas:
             - PDF Import → Aba "Proposta"
             - Excel Import → Aba "Financeiro" 
             - Instituições → Aba "Financeiro"
             - Audit Logs, Backup, Performance, Reports → SettingsModal
          */}
        </Tabs>
      </div>
      
      {/* Demo Data Indicator */}
      <DemoDataIndicator />
      
      {/* Version Display */}
      <div className="fixed bottom-4 left-4 z-40">