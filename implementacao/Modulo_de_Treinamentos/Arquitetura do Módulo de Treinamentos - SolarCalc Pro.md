# Arquitetura do Módulo de Treinamentos - SolarCalc Pro

## Visão Geral

O módulo de treinamentos será integrado à plataforma SolarCalc Pro existente, utilizando React para o frontend e Supabase para o backend. O módulo incluirá funcionalidades para upload de vídeos, criação de playbooks, fluxogramas, mind maps, avaliações e acompanhamento de progresso.

## Tecnologias Escolhidas

### Frontend
- **React** (já existente no projeto)
- **React Flow** - Para criação de fluxogramas e mind maps
- **Tailwind CSS** (já existente)
- **Shadcn/UI** (já existente)
- **React PDF** - Para visualização de playbooks em PDF
- **jsPDF** - Para geração de certificados

### Backend
- **Supabase** (já existente)
  - PostgreSQL Database
  - Storage para vídeos e arquivos
  - Authentication (já configurado)
  - Real-time subscriptions

### Serviços Externos (Opcionais)
- **Transloadit** ou **Frostbyte** - Para transcodificação de vídeo (implementação futura)

## Estrutura do Banco de Dados (Supabase)

### Tabelas Principais

#### 1. training_modules
```sql
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0
);
```

#### 2. training_videos
```sql
CREATE TABLE training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);
```

#### 3. training_playbooks
```sql
CREATE TABLE training_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- 'pdf', 'presentation'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);
```

#### 4. training_diagrams
```sql
CREATE TABLE training_diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  diagram_type VARCHAR(50), -- 'flowchart', 'mindmap'
  diagram_data JSONB NOT NULL, -- Dados do React Flow
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);
```

#### 5. training_assessments
```sql
CREATE TABLE training_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL, -- Array de questões
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);
```

#### 6. user_progress
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  module_id UUID REFERENCES training_modules(id),
  video_id UUID REFERENCES training_videos(id),
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  watch_time_seconds INTEGER DEFAULT 0,
  UNIQUE(user_id, video_id)
);
```

#### 7. assessment_results
```sql
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assessment_id UUID REFERENCES training_assessments(id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken_minutes INTEGER,
  passed BOOLEAN GENERATED ALWAYS AS (score >= (SELECT passing_score FROM training_assessments WHERE id = assessment_id)) STORED
);
```

#### 8. certificates
```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  module_id UUID REFERENCES training_modules(id),
  certificate_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_number VARCHAR(100) UNIQUE,
  UNIQUE(user_id, module_id)
);
```

## Estrutura de Pastas do Frontend

```
src/
├── components/
│   ├── training/
│   │   ├── VideoPlayer.tsx
│   │   ├── PlaybookViewer.tsx
│   │   ├── DiagramEditor.tsx
│   │   ├── AssessmentForm.tsx
│   │   ├── ProgressTracker.tsx
│   │   └── CertificateGenerator.tsx
│   └── ui/ (já existente)
├── pages/
│   ├── training/
│   │   ├── TrainingDashboard.tsx
│   │   ├── ModuleDetail.tsx
│   │   ├── VideoLesson.tsx
│   │   ├── Assessment.tsx
│   │   └── Progress.tsx
├── hooks/
│   ├── useTrainingProgress.ts
│   ├── useVideoPlayer.ts
│   └── useAssessment.ts
├── services/
│   ├── trainingService.ts
│   ├── videoService.ts
│   └── assessmentService.ts
└── types/
    └── training.ts
```

## Fluxo de Usuário

### 1. Dashboard de Treinamentos
- Lista de módulos disponíveis
- Progresso geral do usuário
- Certificados obtidos

### 2. Módulo de Treinamento
- Lista de vídeos, playbooks, diagramas
- Progresso do módulo
- Avaliação final

### 3. Reprodução de Vídeo
- Player customizado com controles
- Marcação automática de progresso
- Notas e marcadores

### 4. Avaliação
- Questionário interativo
- Feedback imediato
- Geração de certificado (se aprovado)

## Funcionalidades Detalhadas

### Upload de Vídeos
- Upload direto para Supabase Storage
- Geração automática de thumbnails
- Metadados (duração, tamanho)
- Suporte a múltiplos formatos

### Playbooks
- Upload de PDFs e apresentações
- Visualização inline
- Download controlado

### Diagramas
- Editor baseado em React Flow
- Salvamento em formato JSON
- Exportação para imagem

### Avaliações
- Múltiplos tipos de questão
- Sistema de pontuação
- Relatórios de desempenho

### Progresso
- Tracking em tempo real
- Relatórios detalhados
- Gamificação (badges, pontos)

## Segurança e Permissões

### Row Level Security (RLS)
- Usuários só acessam seus próprios dados de progresso
- Administradores podem gerenciar conteúdo
- Controle de acesso por perfil

### Storage Policies
- Vídeos e arquivos protegidos
- URLs assinadas para acesso temporário
- Controle de upload por perfil

## Próximos Passos

1. Implementar as tabelas no Supabase
2. Configurar as políticas de segurança
3. Desenvolver os componentes React
4. Integrar com a estrutura existente
5. Testes e refinamentos

