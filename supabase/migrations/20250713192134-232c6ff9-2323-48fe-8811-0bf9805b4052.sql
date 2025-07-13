-- Criar a empresa Cactos - Soluções em Energia
INSERT INTO public.companies (name, cnpj, address, num_employees) 
VALUES ('Cactos - Soluções em Energia', '00.000.000/0001-00', 'Endereço a ser definido', 5);

-- Obter o ID da empresa recém-criada e associar ao usuário atual
UPDATE public.profiles 
SET company_id = (
  SELECT id FROM public.companies WHERE name = 'Cactos - Soluções em Energia' LIMIT 1
)
WHERE id = 'ebe5b927-67cc-4aab-b3d1-c87da528e8df';

-- Criar uma assinatura ativa para a empresa
INSERT INTO public.subscriptions (company_id, status, authorized_employees, is_free, start_date)
VALUES (
  (SELECT id FROM public.companies WHERE name = 'Cactos - Soluções em Energia' LIMIT 1),
  'ativa',
  10,
  true,
  now()
);