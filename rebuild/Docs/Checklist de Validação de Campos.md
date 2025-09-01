# Checklist de Validação de Campos (Item 1)

Objetivo: servir de guia de implementação para máscaras, obrigatoriedades e faixas por etapa.

## Contato
- Nome: obrigatório, 3–120 chars
- Email: obrigatório, formato
- Telefone: obrigatório, E.164/BR
- CPF: opcional, DV válido
- Endereço: CEP (00000-000), UF (2 letras, uppercase), cidade
- Histórico mensal: 6–24 entradas, meses únicos, ordenado, kWh > 0

## Oportunidade
- Vínculo: contact_id obrigatório
- Concessionária: distribuidora, UF, classe, tipo_ligacao, numero_instalacao obrigatórios; numero_cliente opcional
- Simulação: limites — perdas (0–30%), simultaneidade (0–1), aumento (-50% a +300%), anos (1–30), taxas (ver faixas no PRD)
- Série mensal: 12 valores >= 0 quando fornecida

## Proposta (referência)
- Geração de PDF sem erro; link rastreável quando implementado

## Regras Gerais
- Normalizar strings (trim/case), validar números (>= 0) e percentuais (0–1 ou 0–100%).
- Bloquear avanço sem campos obrigatórios da etapa.
- Mensagens de erro amigáveis e acessíveis (aria-live="polite").