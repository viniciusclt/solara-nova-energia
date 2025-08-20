-- Dados de exemplo para o Módulo de Treinamentos
-- Execute após configurar as tabelas principais

-- Inserir módulos de exemplo
INSERT INTO training_modules (title, description, category, created_by, order_index) VALUES
('Fundamentos da Energia Solar', 'Introdução aos conceitos básicos de energia solar fotovoltaica', 'Básico', auth.uid(), 1),
('Dimensionamento de Sistemas', 'Como calcular e dimensionar sistemas fotovoltaicos', 'Intermediário', auth.uid(), 2),
('Instalação e Manutenção', 'Procedimentos de instalação e manutenção preventiva', 'Avançado', auth.uid(), 3);

-- Inserir vídeos de exemplo (substitua as URLs pelos seus vídeos reais)
INSERT INTO training_videos (module_id, title, description, video_url, duration_seconds, order_index) VALUES
((SELECT id FROM training_modules WHERE title = 'Fundamentos da Energia Solar'), 
 'O que é Energia Solar?', 'Conceitos básicos sobre energia solar fotovoltaica', 
 'https://example.com/video1.mp4', 600, 1),
((SELECT id FROM training_modules WHERE title = 'Fundamentos da Energia Solar'), 
 'Componentes do Sistema', 'Painéis, inversores, estruturas e cabeamento', 
 'https://example.com/video2.mp4', 900, 2),
((SELECT id FROM training_modules WHERE title = 'Dimensionamento de Sistemas'), 
 'Cálculo de Consumo', 'Como calcular o consumo energético do cliente', 
 'https://example.com/video3.mp4', 1200, 1);

-- Inserir playbooks de exemplo
INSERT INTO training_playbooks (module_id, title, description, file_url, file_type, order_index) VALUES
((SELECT id FROM training_modules WHERE title = 'Fundamentos da Energia Solar'), 
 'Manual de Fundamentos', 'Guia completo sobre energia solar', 
 'https://example.com/manual1.pdf', 'pdf', 1),
((SELECT id FROM training_modules WHERE title = 'Instalação e Manutenção'), 
 'Checklist de Instalação', 'Lista de verificação para instalações', 
 'https://example.com/checklist.pdf', 'pdf', 1);

-- Inserir diagramas de exemplo
INSERT INTO training_diagrams (module_id, title, description, diagram_type, diagram_data, order_index) VALUES
((SELECT id FROM training_modules WHERE title = 'Dimensionamento de Sistemas'), 
 'Fluxo de Dimensionamento', 'Processo completo de dimensionamento', 'flowchart',
 '{"nodes": [{"id": "1", "type": "input", "data": {"label": "Análise de Consumo"}, "position": {"x": 250, "y": 25}}, {"id": "2", "data": {"label": "Cálculo de Potência"}, "position": {"x": 100, "y": 125}}, {"id": "3", "data": {"label": "Seleção de Equipamentos"}, "position": {"x": 400, "y": 125}}, {"id": "4", "type": "output", "data": {"label": "Proposta Final"}, "position": {"x": 250, "y": 250}}], "edges": [{"id": "e1-2", "source": "1", "target": "2"}, {"id": "e1-3", "source": "1", "target": "3"}, {"id": "e2-4", "source": "2", "target": "4"}, {"id": "e3-4", "source": "3", "target": "4"}]}', 1);

-- Inserir avaliações de exemplo
INSERT INTO training_assessments (module_id, title, description, questions, passing_score, time_limit_minutes, order_index) VALUES
((SELECT id FROM training_modules WHERE title = 'Fundamentos da Energia Solar'), 
 'Avaliação de Fundamentos', 'Teste seus conhecimentos sobre energia solar',
 '[
   {
     "id": 1,
     "question": "O que significa a sigla kWp?",
     "type": "multiple_choice",
     "options": ["Kilowatt pico", "Kilowatt por hora", "Kilowatt padrão", "Kilowatt permanente"],
     "correct_answer": 0,
     "points": 10
   },
   {
     "id": 2,
     "question": "Qual é a principal função do inversor?",
     "type": "multiple_choice",
     "options": ["Armazenar energia", "Converter CC em CA", "Proteger contra raios", "Medir consumo"],
     "correct_answer": 1,
     "points": 10
   },
   {
     "id": 3,
     "question": "A energia solar é uma fonte renovável?",
     "type": "true_false",
     "correct_answer": true,
     "points": 5
   }
 ]', 70, 30, 1);

-- Inserir progresso de exemplo (substitua pelo ID do usuário real)
-- INSERT INTO user_progress (user_id, module_id, video_id, progress_percentage, watch_time_seconds) VALUES
-- ('user-uuid-here', (SELECT id FROM training_modules WHERE title = 'Fundamentos da Energia Solar'), 
--  (SELECT id FROM training_videos WHERE title = 'O que é Energia Solar?'), 100, 600);

-- Inserir resultado de avaliação de exemplo
-- INSERT INTO assessment_results (user_id, assessment_id, score, total_questions, answers, time_taken_minutes) VALUES
-- ('user-uuid-here', (SELECT id FROM training_assessments WHERE title = 'Avaliação de Fundamentos'),
--  25, 3, '[{"question_id": 1, "answer": 0}, {"question_id": 2, "answer": 1}, {"question_id": 3, "answer": true}]', 15);

