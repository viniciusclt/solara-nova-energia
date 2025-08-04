# MÓDULO DE TREINAMENTOS - ARQUITETURA E IMPLEMENTAÇÃO

## 📋 RESUMO EXECUTIVO

**metadata:**
- version: "1.0"
- created: "2024-12-12"
- module_type: "Sistema de Treinamentos Corporativos"
- tech_stack: "React 18 + TypeScript + Vite + Supabase + FFmpeg + React Flow + Tailwind CSS"
- maintainer: "Equipe Solara Nova Energia"
- implementation_status: "30% - Estrutura base criada"

**module_context:**
O **Módulo de Treinamentos** é uma extensão completa do sistema Solara Nova Energia, projetado para oferecer uma plataforma robusta de educação corporativa. O módulo inclui hospedagem própria de vídeos com segurança avançada, editor de conteúdo tipo Notion, criação de fluxogramas e mind maps, sistema de avaliações com certificação automática, gamificação completa e treinamentos específicos por cargo/função.

**key_features:**
- video_hosting: "Hospedagem própria de vídeos com watermark e controle de domínio"
- content_editor: "Editor tipo Notion para PDFs e conteúdo rich text"
- diagram_editor: "Editor integrado para fluxogramas e mind maps (estilo Whimsical/MindMeister)"
- assessment_system: "Avaliações múltipla escolha e dissertativas com certificação automática"
- gamification: "Sistema de pontos, badges, ranking e notificações"
- role_based_training: "Treinamentos específicos por cargo/função"
- progress_tracking: "Acompanhamento detalhado de progresso e analytics"
- version_control: "Versionamento de conteúdo e histórico de alterações"

## 🏗️ ARQUITETURA TÉCNICA

### Stack Tecnológico Adicional
- **Video Processing**: FFmpeg.js, HLS.js para streaming
- **Content Editor**: TipTap (editor rich text), React PDF Viewer
- **Diagram Editor**: React Flow, Excalidraw components
- **File Upload**: React Dropzone, Multer para backend
- **Gamification**: Custom hooks e componentes
- **Notifications**: React Query + WebSockets (Supabase Realtime)
- **Charts**: Recharts para analytics de progresso
- **Video Security**: Custom watermark overlay, domain validation

### Estrutura de Diretórios do Módulo
```
src/
├── features/
│   └── training/                    # Módulo de treinamentos
│       ├── components/              # Componentes React
│       │   ├── video/              # Componentes de vídeo
│       │   │   ├── VideoPlayer.tsx      # Player customizado
│       │   │   ├── VideoUploader.tsx    # Upload de vídeos
│       │   │   ├── VideoSecurity.tsx    # Watermark e segurança
│       │   │   └── VideoProgress.tsx    # Controle de progresso
│       │   ├── content/            # Editor de conteúdo
│       │   │   ├── ContentEditor.tsx    # Editor tipo Notion
│       │   │   ├── PDFViewer.tsx       # Visualizador de PDF
│       │   │   ├── PlaybookEditor.tsx   # Editor de playbooks
│       │   │   └── VersionControl.tsx   # Controle de versões
│       │   ├── diagrams/           # Editor de diagramas
│       │   │   ├── FlowchartEditor.tsx  # Editor de fluxogramas
│       │   │   ├── MindMapEditor.tsx    # Editor de mind maps
│       │   │   ├── ProcessDiagram.tsx   # Diagramas de processo
│       │   │   └── DiagramLibrary.tsx   # Biblioteca de elementos
│       │   ├── assessments/        # Sistema de avaliações
│       │   │   ├── AssessmentForm.tsx   # Formulário de avaliação
│       │   │   ├── QuestionEditor.tsx   # Editor de questões
│       │   │   ├── CertificateGen.tsx   # Geração de certificados
│       │   │   └── ResultsAnalytics.tsx # Analytics de resultados
│       │   ├── gamification/       # Sistema de gamificação
│       │   │   ├── PointsSystem.tsx     # Sistema de pontos
│       │   │   ├── BadgeManager.tsx     # Gestão de badges
│       │   │   ├── Leaderboard.tsx      # Ranking de usuários
│       │   │   └── Achievements.tsx     # Conquistas
│       │   ├── progress/           # Acompanhamento de progresso
│       │   │   ├── ProgressTracker.tsx  # Rastreamento geral
│       │   │   ├── StudyAnalytics.tsx   # Analytics de estudo
│       │   │   ├── CompletionRate.tsx   # Taxa de conclusão
│       │   │   └── TimeTracking.tsx     # Controle de tempo
│       │   └── management/         # Gestão de treinamentos
│       │       ├── TrainingManager.tsx  # Gerenciador principal
│       │       ├── RoleBasedAccess.tsx  # Acesso por cargo
│       │       ├── ContentLibrary.tsx   # Biblioteca de conteúdo
│       │       └── NotificationCenter.tsx # Central de notificações
│       ├── hooks/                  # Hooks customizados
│       │   ├── useVideoSecurity.ts     # Hook de segurança de vídeo
│       │   ├── useContentEditor.ts     # Hook do editor de conteúdo
│       │   ├── useDiagramEditor.ts     # Hook do editor de diagramas
│       │   ├── useGamification.ts      # Hook de gamificação
│       │   ├── useProgressTracking.ts  # Hook de progresso
│       │   └── useTrainingAccess.ts    # Hook de acesso por cargo
│       ├── services/               # Serviços e lógica de negócio
│       │   ├── videoService.ts         # Serviço de vídeos
│       │   ├── contentService.ts       # Serviço de conteúdo
│       │   ├── assessmentService.ts    # Serviço de avaliações
│       │   ├── gamificationService.ts  # Serviço de gamificação
│       │   ├── progressService.ts      # Serviço de progresso
│       │   └── notificationService.ts  # Serviço de notificações
│       ├── types/                  # Tipos TypeScript
│       │   ├── video.ts               # Tipos de vídeo
│       │   ├── content.ts             # Tipos de conteúdo
│       │   ├── assessment.ts          # Tipos de avaliação
│       │   ├── gamification.ts        # Tipos de gamificação
│       │   └── training.ts            # Tipos gerais
│       └── utils/                  # Utilitários
│           ├── videoUtils.ts          # Utilitários de vídeo
│           ├── contentUtils.ts        # Utilitários de conteúdo
│           ├── securityUtils.ts       # Utilitários de segurança
│           └── progressUtils.ts       # Utilitários de progresso
```

## 📊 MODELO DE DADOS

### Novas Tabelas Supabase

#### training_modules
```sql
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(50), -- beginner, intermediate, advanced
  estimated_duration INTEGER, -- em minutos
  required_roles TEXT[], -- array de cargos que devem fazer
  optional_roles TEXT[], -- array de cargos opcionais
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  tags TEXT[]
);
```

#### training_content
```sql
CREATE TABLE training_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- video, pdf, playbook, diagram, assessment
  title VARCHAR(255) NOT NULL,
  content_order INTEGER NOT NULL,
  content_data JSONB, -- dados específicos do tipo de conteúdo
  file_url TEXT, -- URL do arquivo (vídeo, PDF, etc.)
  file_size BIGINT, -- tamanho em bytes
  duration INTEGER, -- duração em segundos (para vídeos)
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);
```

#### training_videos
```sql
CREATE TABLE training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
  original_filename VARCHAR(255),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER, -- em segundos
  resolution VARCHAR(20), -- 720p, 1080p, etc.
  format VARCHAR(10), -- mp4, webm, etc.
  thumbnail_url TEXT,
  watermark_settings JSONB, -- configurações de watermark
  security_settings JSONB, -- configurações de segurança
  processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  hls_playlist_url TEXT, -- URL do playlist HLS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### training_assessments
```sql
CREATE TABLE training_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70, -- porcentagem mínima para aprovação
  time_limit INTEGER, -- em minutos, NULL = sem limite
  max_attempts INTEGER DEFAULT 3,
  randomize_questions BOOLEAN DEFAULT false,
  show_results_immediately BOOLEAN DEFAULT true,
  certificate_template_id UUID, -- referência para template de certificado
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### assessment_questions
```sql
CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES training_assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- multiple_choice, true_false, essay
  options JSONB, -- opções para múltipla escolha
  correct_answer JSONB, -- resposta correta
  points INTEGER DEFAULT 1,
  explanation TEXT, -- explicação da resposta
  question_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_training_progress
```sql
CREATE TABLE user_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed
  progress_percentage INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- em segundos
  last_position INTEGER DEFAULT 0, -- posição no vídeo/conteúdo
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);
```

#### assessment_attempts
```sql
CREATE TABLE assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES training_assessments(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  answers JSONB NOT NULL, -- respostas do usuário
  score INTEGER, -- pontuação obtida
  percentage REAL, -- porcentagem de acerto
  passed BOOLEAN,
  time_taken INTEGER, -- tempo gasto em segundos
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, assessment_id, attempt_number)
);
```

#### training_certificates
```sql
CREATE TABLE training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = não expira
  certificate_url TEXT, -- URL do PDF do certificado
  verification_code VARCHAR(50) UNIQUE,
  is_valid BOOLEAN DEFAULT true
);
```

#### gamification_points
```sql
CREATE TABLE gamification_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL, -- video_completed, assessment_passed, module_completed
  points INTEGER NOT NULL,
  reference_id UUID, -- ID do conteúdo/módulo relacionado
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### gamification_badges
```sql
CREATE TABLE gamification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB NOT NULL, -- critérios para ganhar o badge
  points_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_badges
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES gamification_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

#### training_notifications
```sql
CREATE TABLE training_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- reminder, achievement, deadline
  title VARCHAR(255) NOT NULL,
  message TEXT,
  reference_id UUID, -- ID do módulo/conteúdo relacionado
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 COMPONENTES PRINCIPAIS

### Sistema de Vídeos
- **VideoPlayer**: Player customizado com controles avançados, watermark dinâmico
- **VideoUploader**: Upload com processamento FFmpeg, geração de thumbnails
- **VideoSecurity**: Watermark overlay, validação de domínio, prevenção de download
- **VideoProgress**: Salvamento automático de posição, analytics de visualização

### Editor de Conteúdo
- **ContentEditor**: Editor rich text tipo Notion com blocos modulares
- **PDFViewer**: Visualizador de PDF integrado com anotações
- **PlaybookEditor**: Editor específico para playbooks com templates
- **VersionControl**: Sistema de versionamento com diff visual

### Editor de Diagramas
- **FlowchartEditor**: Editor de fluxogramas com React Flow
- **MindMapEditor**: Editor de mind maps com layout automático
- **ProcessDiagram**: Diagramas de processo específicos
- **DiagramLibrary**: Biblioteca de elementos e templates

### Sistema de Avaliações
- **AssessmentForm**: Formulário de avaliação com timer
- **QuestionEditor**: Editor de questões com múltiplos tipos
- **CertificateGenerator**: Geração automática de certificados PDF
- **ResultsAnalytics**: Analytics detalhados de resultados

### Gamificação
- **PointsSystem**: Sistema de pontos com regras configuráveis
- **BadgeManager**: Gestão de badges e conquistas
- **Leaderboard**: Ranking de usuários com filtros
- **Achievements**: Sistema de conquistas e marcos

### Gestão e Administração
- **TrainingManager**: Interface administrativa principal
- **RoleBasedAccess**: Controle de acesso por cargo/função
- **ContentLibrary**: Biblioteca organizada de conteúdo
- **NotificationCenter**: Central de notificações e lembretes

## 🚀 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Infraestrutura Base (Semanas 1-2) - 40%
- [x] Estrutura de componentes básicos (VideoPlayer, ModuleDetail, etc.)
- [x] Tipos TypeScript fundamentais
- [x] Serviços base (trainingService)
- [x] Integração com navegação principal
- [ ] Criação das tabelas no Supabase
- [ ] Configuração de storage para vídeos
- [ ] Setup de processamento de vídeo (FFmpeg)

### Fase 2: Sistema de Vídeos (Semanas 3-4) - 60%
- [ ] Upload e processamento de vídeos
- [ ] Player com watermark e segurança
- [ ] Sistema de streaming HLS
- [ ] Controle de progresso e analytics
- [ ] Thumbnails automáticos

### Fase 3: Editor de Conteúdo (Semanas 5-6) - 75%
- [ ] Editor rich text tipo Notion
- [ ] Upload e visualização de PDFs
- [ ] Sistema de versionamento
- [ ] Templates de playbooks
- [ ] Integração com diagramas

### Fase 4: Sistema de Avaliações (Semanas 7-8) - 85%
- [ ] Editor de questões avançado
- [ ] Formulário de avaliação com timer
- [ ] Geração automática de certificados
- [ ] Analytics de resultados
- [ ] Sistema de tentativas

### Fase 5: Gamificação (Semanas 9-10) - 95%
- [ ] Sistema de pontos e badges
- [ ] Ranking de usuários
- [ ] Notificações automáticas
- [ ] Conquistas e marcos
- [ ] Dashboard de progresso

### Fase 6: Finalização e Testes (Semanas 11-12) - 100%
- [ ] Testes de integração
- [ ] Otimização de performance
- [ ] Documentação completa
- [ ] Treinamento de usuários
- [ ] Deploy em produção

## 📈 MÉTRICAS E ANALYTICS

### Métricas de Engajamento
- Taxa de conclusão de módulos
- Tempo médio de estudo
- Frequência de acesso
- Taxa de aprovação em avaliações
- Pontuação média em assessments

### Métricas de Conteúdo
- Vídeos mais assistidos
- Conteúdos com maior taxa de abandono
- Questões com maior taxa de erro
- Feedback de qualidade

### Métricas de Gamificação
- Distribuição de pontos
- Badges mais conquistados
- Ranking de usuários ativos
- Progressão por cargo/função

## 🔒 SEGURANÇA E COMPLIANCE

### Segurança de Vídeos
- Watermark dinâmico com dados do usuário
- Validação de domínio de acesso
- Streaming seguro (HLS com tokens)
- Prevenção de download direto
- Logs de acesso detalhados

### Proteção de Dados
- Criptografia de dados sensíveis
- Backup automático de progresso
- Auditoria de acessos
- Compliance com LGPD
- Controle de retenção de dados

### Controle de Acesso
- Autenticação por cargo/função
- Permissões granulares
- Sessões seguras
- Rate limiting
- Monitoramento de atividades suspeitas

## 📱 RESPONSIVIDADE E UX

### Design Responsivo
- Interface adaptável para mobile/tablet
- Player de vídeo otimizado para touch
- Editor de conteúdo mobile-friendly
- Navegação simplificada em telas pequenas

### Experiência do Usuário
- Onboarding interativo
- Feedback visual constante
- Salvamento automático de progresso
- Modo offline para conteúdo baixado
- Notificações push inteligentes

## 🔧 CONFIGURAÇÕES TÉCNICAS

### Processamento de Vídeo
```javascript
// Configuração FFmpeg para processamento
const videoProcessingConfig = {
  formats: ['mp4', 'webm'],
  resolutions: ['720p', '1080p'],
  bitrates: ['1000k', '2000k', '4000k'],
  hlsSegmentDuration: 10,
  watermarkPosition: 'bottom-right',
  thumbnailInterval: 30
};
```

### Configuração de Storage
```sql
-- Bucket para vídeos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('training-videos', 'training-videos', false);

-- Bucket para certificados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', false);

-- Bucket para conteúdo geral
INSERT INTO storage.buckets (id, name, public) 
VALUES ('training-content', 'training-content', false);
```

### Políticas de Segurança RLS
```sql
-- Política para acesso a vídeos
CREATE POLICY "Users can view videos from their company" ON training_videos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM training_content tc
    JOIN training_modules tm ON tc.module_id = tm.id
    WHERE tc.id = training_videos.content_id
    AND tm.company_id = auth.jwt() ->> 'company_id'
  )
);
```

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend/Database
- [ ] Criar todas as tabelas no Supabase
- [ ] Configurar buckets de storage
- [ ] Implementar políticas RLS
- [ ] Setup de Edge Functions para processamento
- [ ] Configurar webhooks de notificação

### Frontend/Components
- [x] Estrutura base de componentes
- [ ] Sistema de upload de vídeos
- [ ] Player de vídeo com segurança
- [ ] Editor de conteúdo rich text
- [ ] Editor de diagramas
- [ ] Sistema de avaliações
- [ ] Gamificação completa
- [ ] Dashboard administrativo

### Integração
- [x] Navegação principal
- [ ] Autenticação e permissões
- [ ] Notificações em tempo real
- [ ] Analytics e relatórios
- [ ] API de integração externa

### Testes e Deploy
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Testes de segurança
- [ ] Deploy em produção

---

**Status Atual: 30% Implementado**
- ✅ Estrutura base de componentes
- ✅ Tipos TypeScript fundamentais
- ✅ Integração com navegação
- ⏳ Banco de dados e storage
- ⏳ Sistema de vídeos
- ⏳ Editor de conteúdo
- ⏳ Avaliações e certificação
- ⏳ Gamificação
- ⏳ Testes e otimização

**Próximos Passos:**
1. Criar estrutura de banco de dados no Supabase
2. Implementar sistema de upload e processamento de vídeos
3. Desenvolver player de vídeo com segurança
4. Criar editor de conteúdo tipo Notion
5. Implementar sistema de avaliações