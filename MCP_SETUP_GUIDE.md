# Guia de Configuração MCP para Supabase Self-Hosted

## Visão Geral

Este guia ajuda você a configurar o Model Context Protocol (MCP) para conectar suas ferramentas de IA ao seu Supabase self-hosted, permitindo que elas interajam diretamente com seus dados reais de leads.

## Configurações Criadas

### 1. VS Code (Copilot) - `.vscode/mcp.json`

Configuração para usar com GitHub Copilot no VS Code:
- Usa o servidor MCP do PostgreSQL
- Solicita a string de conexão de forma segura
- Executa todas as queries como read-only

### 2. Claude Code - `.mcp.json`

Configuração para Claude Code no diretório raiz com **duas opções**:

**Opção 1 (Recomendada): `supabase-selfhosted-rest`**
- Usa o servidor MCP oficial do Supabase
- Conecta via REST API (mais estável)
- Configuração read-only por padrão
- Usa sua URL self-hosted personalizada

**Opção 2 (Fallback): `supabase-postgres-fallback`**
- Conecta diretamente ao PostgreSQL
- Para casos onde a REST API não funciona
- Requer conectividade direta com o banco

## Como Configurar

### Passo 1: Obter String de Conexão

Para seu Supabase self-hosted, a string de conexão será:
```
postgresql://postgres:SUA_SENHA@supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br:5432/postgres
```

**Substitua `SUA_SENHA` pela senha real do PostgreSQL.**

### Passo 2: Configurar VS Code

1. Abra o VS Code no projeto
2. Certifique-se de que o GitHub Copilot está instalado
3. Abra o Copilot Chat
4. Mude para modo "Agent"
5. Você verá um ícone de ferramenta - clique para confirmar que as ferramentas MCP estão disponíveis
6. Quando solicitado, insira a string de conexão PostgreSQL

### Passo 3: Configurar Claude Code

**Opção A (Recomendada): Usar REST API**
1. O arquivo `.mcp.json` já está configurado com `supabase-selfhosted-rest`
2. Esta opção usa a REST API do Supabase (mais estável)
3. Reinicie o Claude Code para aplicar a configuração

**Opção B (Fallback): Usar PostgreSQL direto**
1. Se a Opção A não funcionar, o Claude Code tentará `supabase-postgres-fallback`
2. Esta opção conecta diretamente ao PostgreSQL
3. Pode requerer configurações adicionais de rede/firewall

### Passo 4: Testar a Conexão

Após configurar, teste com comandos como:
- "Mostre-me todas as tabelas do banco de dados"
- "Quantos leads temos na tabela leads?"
- "Qual é a estrutura da tabela leads?"

## Segurança

### Recomendações Importantes:

1. **Modo Read-Only**: O servidor PostgreSQL MCP executa todas as queries como read-only por padrão
2. **Não use em produção**: Configure apenas para desenvolvimento/teste
3. **Proteja credenciais**: Nunca commite senhas no repositório
4. **Ambiente isolado**: Use dados de desenvolvimento, não produção

## Troubleshooting

### Erro de Conexão
- Verifique se o Supabase está rodando
- Confirme a porta (geralmente 5432)
- Teste a conectividade de rede

### Erro de Autenticação
- Verifique a senha do PostgreSQL
- Confirme o usuário (geralmente 'postgres')

### MCP não aparece
- Reinicie a ferramenta de IA
- Verifique se o arquivo de configuração está no local correto
- Confirme a sintaxe JSON

## Comandos Úteis

Após configurar o MCP, você pode usar comandos em linguagem natural:

```
# Explorar estrutura
"Mostre todas as tabelas disponíveis"
"Descreva a estrutura da tabela leads"

# Consultar dados
"Quantos leads temos?"
"Mostre os últimos 10 leads cadastrados"
"Quais concessionárias aparecem mais nos leads?"

# Análise
"Qual é o consumo médio dos leads?"
"Mostre a distribuição de leads por estado"
```

## Próximos Passos

1. Configure a string de conexão correta
2. Teste a conectividade
3. Explore seus dados reais de leads
4. Use para debugging e análise de dados

---

**Nota**: Esta configuração permite trabalhar com dados reais, facilitando o desenvolvimento e debugging da aplicação.