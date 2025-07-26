/**
 * Tipos utilitários para substituir 'any' com alternativas mais seguras
 */

// Tipo para valores JSON seguros
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Tipo para objetos genéricos com chaves string
export type StringKeyObject<T = unknown> = Record<string, T>;

// Tipo para dados de formulário
export type FormData = Record<string, string | number | boolean | File | null>;

// Tipo para respostas de API genéricas
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Tipo para metadados genéricos
export type Metadata = Record<string, JsonValue>;

// Tipo para configurações genéricas
export type Config = Record<string, JsonValue>;

// Tipo para eventos genéricos
export interface GenericEvent<T = unknown> {
  type: string;
  payload?: T;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de auditoria
export interface AuditData {
  action: string;
  timestamp: Date;
  userId?: string;
  changes?: Record<string, { old: JsonValue; new: JsonValue }>;
  metadata?: Metadata;
}

// Tipo para erros estruturados
export interface StructuredError {
  code: string;
  message: string;
  details?: Metadata;
  stack?: string;
}

// Tipo para dados de paginação
export interface PaginationData<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Tipo para filtros genéricos
export type FilterValue = string | number | boolean | Date | null;
export type Filters = Record<string, FilterValue | FilterValue[]>;

// Tipo para ordenação
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Tipo para dados de tabela
export interface TableData<T = unknown> {
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    type?: 'string' | 'number' | 'date' | 'boolean';
  }>;
  rows: T[];
  pagination?: PaginationData<T>;
  sort?: SortConfig;
}

// Tipo para validação
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

// Tipo para dados de upload
export interface UploadData {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  metadata?: Metadata;
}

// Tipo para notificações
export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: Metadata;
}

// Tipo para dados de sessão
export interface SessionData {
  userId: string;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  metadata?: Metadata;
}

// Tipo para dados de cache
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: Date;
  ttl?: number;
  metadata?: Metadata;
}

// Tipo para dados de log
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  source?: string;
  metadata?: Metadata;
}

// Tipo para dados de métricas
export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Metadata;
}

// Tipo para dados de configuração de usuário
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: Record<string, boolean>;
  customSettings?: Metadata;
}

// Tipo para dados de integração
export interface IntegrationData {
  provider: string;
  config: Config;
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
  metadata?: Metadata;
}

// Tipo para dados de backup
export interface BackupData {
  id: string;
  timestamp: Date;
  size: number;
  tables: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  metadata?: Metadata;
}

// Tipo para dados de relatório
export interface ReportData<T = unknown> {
  id: string;
  name: string;
  type: string;
  data: T;
  generatedAt: Date;
  parameters?: Config;
  metadata?: Metadata;
}

// Tipo para dados de template
export interface TemplateData {
  id: string;
  name: string;
  type: string;
  content: JsonValue;
  variables?: Record<string, string>;
  metadata?: Metadata;
}

// Tipo para dados de workflow
export interface WorkflowData {
  id: string;
  name: string;
  steps: Array<{
    id: string;
    type: string;
    config: Config;
    dependencies?: string[];
  }>;
  status: 'draft' | 'active' | 'paused' | 'completed';
  metadata?: Metadata;
}

// Tipo para dados de dashboard
export interface DashboardData {
  id: string;
  name: string;
  widgets: Array<{
    id: string;
    type: string;
    position: { x: number; y: number; width: number; height: number };
    config: Config;
  }>;
  layout: string;
  metadata?: Metadata;
}

// Tipo para dados de análise
export interface AnalyticsData {
  event: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  properties?: Metadata;
  context?: Metadata;
}

// Tipo para dados de feature flag
export interface FeatureFlagData {
  key: string;
  enabled: boolean;
  conditions?: Array<{
    property: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
    value: JsonValue;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de A/B test
export interface ABTestData {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number;
    config: Config;
  }>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  metadata?: Metadata;
}

// Tipo para dados de webhook
export interface WebhookData {
  id: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  status: 'active' | 'inactive';
  metadata?: Metadata;
}

// Tipo para dados de API key
export interface ApiKeyData {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsed?: Date;
  metadata?: Metadata;
}

// Tipo para dados de rate limiting
export interface RateLimitData {
  key: string;
  limit: number;
  window: number;
  current: number;
  resetAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de health check
export interface HealthCheckData {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime?: number;
  details?: Metadata;
}

// Tipo para dados de deployment
export interface DeploymentData {
  id: string;
  version: string;
  environment: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  startedAt: Date;
  completedAt?: Date;
  metadata?: Metadata;
}

// Tipo para dados de monitoramento
export interface MonitoringData {
  metric: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  threshold?: {
    warning: number;
    critical: number;
  };
  metadata?: Metadata;
}

// Tipo para dados de alertas
export interface AlertData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Metadata;
}

// Tipo para dados de compliance
export interface ComplianceData {
  standard: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence?: string[];
  lastChecked: Date;
  metadata?: Metadata;
}

// Tipo para dados de security scan
export interface SecurityScanData {
  id: string;
  type: 'vulnerability' | 'dependency' | 'code' | 'infrastructure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive';
  detectedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de performance
export interface PerformanceData {
  metric: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: {
    url?: string;
    userAgent?: string;
    userId?: string;
  };
  metadata?: Metadata;
}

// Tipo para dados de error tracking
export interface ErrorTrackingData {
  id: string;
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'info';
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  context?: Metadata;
  fingerprint?: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  metadata?: Metadata;
}

// Tipo para dados de user feedback
export interface UserFeedbackData {
  id: string;
  userId?: string;
  type: 'bug' | 'feature_request' | 'improvement' | 'other';
  title: string;
  description: string;
  rating?: number;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  submittedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de changelog
export interface ChangelogData {
  version: string;
  releaseDate: Date;
  changes: Array<{
    type: 'feature' | 'improvement' | 'bugfix' | 'breaking';
    description: string;
    impact?: 'low' | 'medium' | 'high';
  }>;
  metadata?: Metadata;
}

// Tipo para dados de documentation
export interface DocumentationData {
  id: string;
  title: string;
  content: string;
  type: 'guide' | 'reference' | 'tutorial' | 'faq';
  tags: string[];
  lastUpdated: Date;
  author?: string;
  metadata?: Metadata;
}

// Tipo para dados de onboarding
export interface OnboardingData {
  userId: string;
  step: string;
  completed: boolean;
  completedAt?: Date;
  data?: Metadata;
  metadata?: Metadata;
}

// Tipo para dados de gamification
export interface GamificationData {
  userId: string;
  points: number;
  level: number;
  badges: string[];
  achievements: Array<{
    id: string;
    unlockedAt: Date;
    metadata?: Metadata;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de recommendation
export interface RecommendationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  data: Metadata;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de personalization
export interface PersonalizationData {
  userId: string;
  preferences: UserPreferences;
  behavior: Metadata;
  segments: string[];
  lastUpdated: Date;
  metadata?: Metadata;
}

// Tipo para dados de experimentation
export interface ExperimentationData {
  experimentId: string;
  userId: string;
  variant: string;
  startedAt: Date;
  events: Array<{
    type: string;
    timestamp: Date;
    data?: Metadata;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de content management
export interface ContentData {
  id: string;
  type: string;
  title: string;
  content: JsonValue;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  author: string;
  tags: string[];
  metadata?: Metadata;
}

// Tipo para dados de localization
export interface LocalizationData {
  key: string;
  locale: string;
  value: string;
  context?: string;
  lastUpdated: Date;
  metadata?: Metadata;
}

// Tipo para dados de search
export interface SearchData {
  query: string;
  results: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    score: number;
    metadata?: Metadata;
  }>;
  total: number;
  took: number;
  metadata?: Metadata;
}

// Tipo para dados de import/export
export interface ImportExportData {
  id: string;
  type: 'import' | 'export';
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsTotal: number;
  errors?: string[];
  metadata?: Metadata;
}

// Tipo para dados de migration
export interface MigrationData {
  id: string;
  name: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  startedAt: Date;
  completedAt?: Date;
  steps: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de queue
export interface QueueData {
  id: string;
  type: string;
  payload: JsonValue;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
  metadata?: Metadata;
}

// Tipo para dados de scheduler
export interface SchedulerData {
  id: string;
  name: string;
  schedule: string; // cron expression
  task: string;
  payload?: JsonValue;
  status: 'active' | 'inactive' | 'paused';
  lastRun?: Date;
  nextRun?: Date;
  metadata?: Metadata;
}

// Tipo para dados de circuit breaker
export interface CircuitBreakerData {
  name: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  successCount: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  threshold: number;
  timeout: number;
  metadata?: Metadata;
}

// Tipo para dados de feature toggle
export interface FeatureToggleData {
  key: string;
  enabled: boolean;
  strategy?: {
    name: string;
    parameters?: Metadata;
  };
  variants?: Array<{
    name: string;
    weight: number;
    payload?: JsonValue;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de service discovery
export interface ServiceDiscoveryData {
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: string;
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastSeen: Date;
  metadata?: Metadata;
}

// Tipo para dados de load balancing
export interface LoadBalancingData {
  target: string;
  weight: number;
  health: 'healthy' | 'unhealthy' | 'draining';
  connections: number;
  responseTime: number;
  lastCheck: Date;
  metadata?: Metadata;
}

// Tipo para dados de caching
export interface CachingData {
  key: string;
  value: JsonValue;
  ttl: number;
  hits: number;
  misses: number;
  lastAccessed: Date;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de compression
export interface CompressionData {
  algorithm: string;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  time: number;
  metadata?: Metadata;
}

// Tipo para dados de encryption
export interface EncryptionData {
  algorithm: string;
  keyId: string;
  encryptedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de signing
export interface SigningData {
  algorithm: string;
  keyId: string;
  signature: string;
  signedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de hashing
export interface HashingData {
  algorithm: string;
  hash: string;
  salt?: string;
  iterations?: number;
  metadata?: Metadata;
}

// Tipo para dados de tokenization
export interface TokenizationData {
  token: string;
  type: string;
  expiresAt?: Date;
  scope?: string[];
  metadata?: Metadata;
}

// Tipo para dados de authorization
export interface AuthorizationData {
  userId: string;
  resource: string;
  action: string;
  granted: boolean;
  reason?: string;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de audit trail
export interface AuditTrailData {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  before?: JsonValue;
  after?: JsonValue;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  metadata?: Metadata;
}

// Tipo para dados de data lineage
export interface DataLineageData {
  id: string;
  source: string;
  target: string;
  transformation?: string;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de data quality
export interface DataQualityData {
  dataset: string;
  metric: string;
  value: number;
  threshold?: number;
  status: 'pass' | 'fail' | 'warning';
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de data catalog
export interface DataCatalogData {
  id: string;
  name: string;
  type: 'table' | 'view' | 'file' | 'api';
  schema?: JsonValue;
  description?: string;
  tags: string[];
  owner: string;
  lastUpdated: Date;
  metadata?: Metadata;
}

// Tipo para dados de data governance
export interface DataGovernanceData {
  resource: string;
  policy: string;
  status: 'compliant' | 'non_compliant' | 'unknown';
  lastChecked: Date;
  violations?: string[];
  metadata?: Metadata;
}

// Tipo para dados de data privacy
export interface DataPrivacyData {
  userId: string;
  dataType: string;
  purpose: string;
  consent: boolean;
  consentDate?: Date;
  retention?: number;
  metadata?: Metadata;
}

// Tipo para dados de data retention
export interface DataRetentionData {
  resource: string;
  policy: string;
  retentionPeriod: number;
  lastCleaned?: Date;
  nextCleanup?: Date;
  metadata?: Metadata;
}

// Tipo para dados de data archival
export interface DataArchivalData {
  id: string;
  source: string;
  destination: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  size: number;
  metadata?: Metadata;
}

// Tipo para dados de data backup
export interface DataBackupData {
  id: string;
  source: string;
  destination: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  size: number;
  metadata?: Metadata;
}

// Tipo para dados de data recovery
export interface DataRecoveryData {
  id: string;
  backupId: string;
  target: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsRecovered: number;
  metadata?: Metadata;
}

// Tipo para dados de data synchronization
export interface DataSynchronizationData {
  id: string;
  source: string;
  target: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsSynced: number;
  conflicts?: Array<{
    record: string;
    reason: string;
    resolution?: string;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de data transformation
export interface DataTransformationData {
  id: string;
  source: string;
  target: string;
  transformation: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  errors?: string[];
  metadata?: Metadata;
}

// Tipo para dados de data validation
export interface DataValidationData {
  id: string;
  dataset: string;
  rules: Array<{
    name: string;
    type: string;
    parameters?: Metadata;
  }>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  violations: Array<{
    rule: string;
    record: string;
    message: string;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de data profiling
export interface DataProfilingData {
  dataset: string;
  column: string;
  type: string;
  nullCount: number;
  uniqueCount: number;
  minValue?: JsonValue;
  maxValue?: JsonValue;
  avgValue?: number;
  distribution?: Record<string, number>;
  patterns?: string[];
  metadata?: Metadata;
}

// Tipo para dados de data sampling
export interface DataSamplingData {
  id: string;
  source: string;
  method: 'random' | 'systematic' | 'stratified';
  sampleSize: number;
  totalSize: number;
  ratio: number;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de data masking
export interface DataMaskingData {
  id: string;
  source: string;
  target: string;
  rules: Array<{
    column: string;
    method: string;
    parameters?: Metadata;
  }>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  metadata?: Metadata;
}

// Tipo para dados de data anonymization
export interface DataAnonymizationData {
  id: string;
  source: string;
  target: string;
  technique: 'k_anonymity' | 'l_diversity' | 't_closeness' | 'differential_privacy';
  parameters: Metadata;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  privacyMetrics?: Metadata;
  metadata?: Metadata;
}

// Tipo para dados de data pseudonymization
export interface DataPseudonymizationData {
  id: string;
  source: string;
  target: string;
  keyId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  metadata?: Metadata;
}

// Tipo para dados de data classification
export interface DataClassificationData {
  resource: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  classifiedAt: Date;
  classifiedBy: string;
  metadata?: Metadata;
}

// Tipo para dados de data discovery
export interface DataDiscoveryData {
  id: string;
  source: string;
  discoveredAt: Date;
  type: string;
  schema?: JsonValue;
  sampleData?: JsonValue[];
  statistics?: Metadata;
  metadata?: Metadata;
}

// Tipo para dados de data mapping
export interface DataMappingData {
  id: string;
  source: string;
  target: string;
  mappings: Array<{
    sourceField: string;
    targetField: string;
    transformation?: string;
    validation?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de data integration
export interface DataIntegrationData {
  id: string;
  sources: string[];
  target: string;
  strategy: 'merge' | 'union' | 'join' | 'aggregate';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsIntegrated: number;
  conflicts?: Array<{
    source: string;
    field: string;
    reason: string;
    resolution?: string;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de data pipeline
export interface DataPipelineData {
  id: string;
  name: string;
  stages: Array<{
    id: string;
    type: string;
    config: Config;
    dependencies?: string[];
  }>;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  schedule?: string;
  lastRun?: Date;
  nextRun?: Date;
  metadata?: Metadata;
}

// Tipo para dados de data flow
export interface DataFlowData {
  id: string;
  source: string;
  target: string;
  volume: number;
  latency: number;
  throughput: number;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de data lake
export interface DataLakeData {
  id: string;
  path: string;
  format: string;
  size: number;
  partitions?: string[];
  schema?: JsonValue;
  createdAt: Date;
  lastAccessed?: Date;
  metadata?: Metadata;
}

// Tipo para dados de data warehouse
export interface DataWarehouseData {
  id: string;
  table: string;
  schema: string;
  partitions?: string[];
  indexes?: string[];
  statistics?: Metadata;
  lastUpdated: Date;
  metadata?: Metadata;
}

// Tipo para dados de data mart
export interface DataMartData {
  id: string;
  name: string;
  subject: string;
  tables: string[];
  views: string[];
  refreshSchedule?: string;
  lastRefresh?: Date;
  metadata?: Metadata;
}

// Tipo para dados de OLAP cube
export interface OLAPCubeData {
  id: string;
  name: string;
  dimensions: Array<{
    name: string;
    hierarchy?: string[];
    attributes?: string[];
  }>;
  measures: Array<{
    name: string;
    aggregation: string;
    format?: string;
  }>;
  lastProcessed?: Date;
  metadata?: Metadata;
}

// Tipo para dados de data visualization
export interface DataVisualizationData {
  id: string;
  type: 'chart' | 'table' | 'map' | 'dashboard';
  config: Config;
  data: JsonValue;
  filters?: Filters;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de business intelligence
export interface BusinessIntelligenceData {
  id: string;
  type: 'report' | 'dashboard' | 'kpi' | 'scorecard';
  name: string;
  description?: string;
  config: Config;
  schedule?: string;
  lastGenerated?: Date;
  metadata?: Metadata;
}

// Tipo para dados de machine learning
export interface MachineLearningData {
  id: string;
  type: 'training' | 'prediction' | 'evaluation';
  model: string;
  version: string;
  dataset?: string;
  parameters?: Config;
  metrics?: Metadata;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  metadata?: Metadata;
}

// Tipo para dados de artificial intelligence
export interface ArtificialIntelligenceData {
  id: string;
  type: 'nlp' | 'computer_vision' | 'speech' | 'recommendation';
  input: JsonValue;
  output?: JsonValue;
  confidence?: number;
  processingTime?: number;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de deep learning
export interface DeepLearningData {
  id: string;
  architecture: string;
  layers: Array<{
    type: string;
    parameters: Config;
  }>;
  weights?: string;
  training?: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    loss: number;
    accuracy: number;
  };
  metadata?: Metadata;
}

// Tipo para dados de natural language processing
export interface NLPData {
  id: string;
  task: 'tokenization' | 'pos_tagging' | 'ner' | 'sentiment' | 'translation' | 'summarization';
  input: string;
  output?: JsonValue;
  language?: string;
  confidence?: number;
  processingTime?: number;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de computer vision
export interface ComputerVisionData {
  id: string;
  task: 'classification' | 'detection' | 'segmentation' | 'recognition' | 'tracking';
  input: string; // image/video path or URL
  output?: JsonValue;
  confidence?: number;
  processingTime?: number;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de speech processing
export interface SpeechProcessingData {
  id: string;
  task: 'recognition' | 'synthesis' | 'translation' | 'enhancement';
  input: string; // audio path or URL
  output?: JsonValue;
  language?: string;
  confidence?: number;
  processingTime?: number;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de recommendation system
export interface RecommendationSystemData {
  id: string;
  userId: string;
  itemId?: string;
  type: 'collaborative' | 'content_based' | 'hybrid';
  recommendations: Array<{
    itemId: string;
    score: number;
    reason?: string;
  }>;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de knowledge graph
export interface KnowledgeGraphData {
  id: string;
  entities: Array<{
    id: string;
    type: string;
    properties: Metadata;
  }>;
  relationships: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    properties?: Metadata;
  }>;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de semantic search
export interface SemanticSearchData {
  id: string;
  query: string;
  results: Array<{
    id: string;
    content: string;
    score: number;
    embedding?: number[];
  }>;
  model: string;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de vector database
export interface VectorDatabaseData {
  id: string;
  vector: number[];
  content?: string;
  tags?: string[];
  similarity?: number;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de embedding
export interface EmbeddingData {
  id: string;
  content: string;
  vector: number[];
  model: string;
  dimensions: number;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de clustering
export interface ClusteringData {
  id: string;
  algorithm: string;
  parameters: Config;
  clusters: Array<{
    id: string;
    centroid: number[];
    members: string[];
    size: number;
  }>;
  metrics?: Metadata;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de classification
export interface ClassificationData {
  id: string;
  algorithm: string;
  features: number[];
  prediction: string;
  confidence: number;
  probabilities?: Record<string, number>;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de regression
export interface RegressionData {
  id: string;
  algorithm: string;
  features: number[];
  prediction: number;
  confidence?: number;
  residual?: number;
  timestamp: Date;
  metadata?: Metadata;
}

// Tipo para dados de time series
export interface TimeSeriesData {
  id: string;
  timestamp: Date;
  value: number;
  forecast?: number;
  confidence?: {
    lower: number;
    upper: number;
  };
  anomaly?: boolean;
  metadata?: Metadata;
}

// Tipo para dados de anomaly detection
export interface AnomalyDetectionData {
  id: string;
  timestamp: Date;
  value: number;
  expected?: number;
  score: number;
  threshold: number;
  isAnomaly: boolean;
  explanation?: string;
  metadata?: Metadata;
}

// Tipo para dados de forecasting
export interface ForecastingData {
  id: string;
  horizon: number;
  predictions: Array<{
    timestamp: Date;
    value: number;
    confidence?: {
      lower: number;
      upper: number;
    };
  }>;
  model: string;
  accuracy?: Metadata;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de optimization
export interface OptimizationData {
  id: string;
  objective: string;
  variables: Record<string, number>;
  constraints?: Array<{
    expression: string;
    type: 'equality' | 'inequality';
    value: number;
  }>;
  solution?: Record<string, number>;
  objectiveValue?: number;
  status: 'optimal' | 'infeasible' | 'unbounded' | 'error';
  iterations?: number;
  solvingTime?: number;
  metadata?: Metadata;
}

// Tipo para dados de simulation
export interface SimulationData {
  id: string;
  type: 'monte_carlo' | 'discrete_event' | 'agent_based' | 'system_dynamics';
  parameters: Config;
  runs: number;
  results: Array<{
    run: number;
    outputs: Record<string, number>;
    statistics?: Metadata;
  }>;
  summary?: Metadata;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de statistical analysis
export interface StatisticalAnalysisData {
  id: string;
  test: string;
  data: number[];
  hypothesis?: {
    null: string;
    alternative: string;
  };
  results: {
    statistic: number;
    pValue: number;
    criticalValue?: number;
    confidence?: number;
    reject?: boolean;
  };
  interpretation?: string;
  metadata?: Metadata;
}

// Tipo para dados de A/B testing
export interface ABTestingData {
  id: string;
  name: string;
  hypothesis: string;
  variants: Array<{
    id: string;
    name: string;
    traffic: number;
    conversions: number;
    conversionRate: number;
  }>;
  metrics: Array<{
    name: string;
    type: 'primary' | 'secondary';
    values: Record<string, number>;
  }>;
  significance?: {
    level: number;
    achieved: boolean;
    pValue: number;
  };
  status: 'draft' | 'running' | 'completed' | 'stopped';
  startedAt?: Date;
  endedAt?: Date;
  metadata?: Metadata;
}

// Tipo para dados de multivariate testing
export interface MultivariateTestingData {
  id: string;
  name: string;
  factors: Array<{
    name: string;
    levels: string[];
  }>;
  combinations: Array<{
    id: string;
    factors: Record<string, string>;
    traffic: number;
    conversions: number;
    conversionRate: number;
  }>;
  interactions?: Array<{
    factors: string[];
    effect: number;
    significance: number;
  }>;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  startedAt?: Date;
  endedAt?: Date;
  metadata?: Metadata;
}

// Tipo para dados de cohort analysis
export interface CohortAnalysisData {
  id: string;
  cohortBy: string;
  metric: string;
  periods: string[];
  cohorts: Array<{
    name: string;
    size: number;
    values: Record<string, number>;
  }>;
  retention?: Record<string, Record<string, number>>;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de funnel analysis
export interface FunnelAnalysisData {
  id: string;
  name: string;
  steps: Array<{
    name: string;
    users: number;
    conversionRate?: number;
    dropoffRate?: number;
  }>;
  segments?: Array<{
    name: string;
    steps: Array<{
      name: string;
      users: number;
      conversionRate?: number;
    }>;
  }>;
  period: {
    start: Date;
    end: Date;
  };
  metadata?: Metadata;
}

// Tipo para dados de customer journey
export interface CustomerJourneyData {
  id: string;
  customerId: string;
  touchpoints: Array<{
    timestamp: Date;
    channel: string;
    action: string;
    content?: string;
    outcome?: string;
    value?: number;
  }>;
  segments: string[];
  stage: string;
  score?: number;
  metadata?: Metadata;
}

// Tipo para dados de customer lifetime value
export interface CustomerLifetimeValueData {
  customerId: string;
  clv: number;
  predictedClv?: number;
  segments: string[];
  acquisitionCost: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  lifespan: number;
  churnProbability?: number;
  calculatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de churn prediction
export interface ChurnPredictionData {
  customerId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: Array<{
    name: string;
    impact: number;
    value: JsonValue;
  }>;
  recommendations?: string[];
  predictedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de customer segmentation
export interface CustomerSegmentationData {
  id: string;
  algorithm: string;
  features: string[];
  segments: Array<{
    id: string;
    name: string;
    size: number;
    characteristics: Metadata;
    customers: string[];
  }>;
  metrics?: Metadata;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de market basket analysis
export interface MarketBasketAnalysisData {
  id: string;
  rules: Array<{
    antecedent: string[];
    consequent: string[];
    support: number;
    confidence: number;
    lift: number;
    conviction?: number;
  }>;
  minSupport: number;
  minConfidence: number;
  transactions: number;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de price optimization
export interface PriceOptimizationData {
  productId: string;
  currentPrice: number;
  optimalPrice: number;
  priceElasticity: number;
  demandForecast: number;
  revenueImpact: number;
  competitorPrices?: number[];
  constraints?: {
    minPrice: number;
    maxPrice: number;
    margin: number;
  };
  calculatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de inventory optimization
export interface InventoryOptimizationData {
  productId: string;
  currentStock: number;
  optimalStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTime: number;
  demandForecast: number;
  stockoutRisk: number;
  carryingCost: number;
  orderingCost: number;
  calculatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de supply chain optimization
export interface SupplyChainOptimizationData {
  id: string;
  network: {
    suppliers: Array<{
      id: string;
      capacity: number;
      cost: number;
      leadTime: number;
    }>;
    warehouses: Array<{
      id: string;
      capacity: number;
      cost: number;
    }>;
    customers: Array<{
      id: string;
      demand: number;
      priority: number;
    }>;
  };
  solution?: {
    flows: Array<{
      from: string;
      to: string;
      quantity: number;
      cost: number;
    }>;
    totalCost: number;
    serviceLevel: number;
  };
  constraints?: Metadata;
  calculatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de demand forecasting
export interface DemandForecastingData {
  productId: string;
  location?: string;
  horizon: number;
  forecast: Array<{
    period: Date;
    demand: number;
    confidence?: {
      lower: number;
      upper: number;
    };
  }>;
  model: string;
  accuracy?: {
    mae: number;
    mape: number;
    rmse: number;
  };
  factors?: Array<{
    name: string;
    impact: number;
  }>;
  createdAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de capacity planning
export interface CapacityPlanningData {
  id: string;
  resource: string;
  currentCapacity: number;
  demandForecast: Array<{
    period: Date;
    demand: number;
  }>;
  recommendations: Array<{
    period: Date;
    action: 'increase' | 'decrease' | 'maintain';
    amount: number;
    cost: number;
    utilization: number;
  }>;
  constraints?: Metadata;
  calculatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de resource allocation
export interface ResourceAllocationData {
  id: string;
  resources: Array<{
    id: string;
    type: string;
    capacity: number;
    cost: number;
    availability: Array<{
      start: Date;
      end: Date;
    }>;
  }>;
  tasks: Array<{
    id: string;
    duration: number;
    requirements: Record<string, number>;
    priority: number;
    deadline?: Date;
  }>;
  allocation?: Array<{
    taskId: string;
    resourceId: string;
    start: Date;
    end: Date;
    utilization: number;
  }>;
  objectives?: {
    minimizeCost: boolean;
    maximizeUtilization: boolean;
    meetDeadlines: boolean;
  };
  calculatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de project scheduling
export interface ProjectSchedulingData {
  id: string;
  name: string;
  tasks: Array<{
    id: string;
    name: string;
    duration: number;
    dependencies: string[];
    resources: string[];
    earliestStart?: Date;
    latestStart?: Date;
    slack?: number;
    critical?: boolean;
  }>;
  schedule?: Array<{
    taskId: string;
    start: Date;
    end: Date;
    resources: Array<{
      id: string;
      allocation: number;
    }>;
  }>;
  criticalPath?: string[];
  projectDuration?: number;
  calculatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de risk assessment
export interface RiskAssessmentData {
  id: string;
  type: 'operational' | 'financial' | 'strategic' | 'compliance' | 'technical';
  description: string;
  probability: number;
  impact: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: Array<{
    action: string;
    cost: number;
    effectiveness: number;
    timeline: number;
  }>;
  owner: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'transferred';
  lastReviewed: Date;
  metadata?: Metadata;
}

// Tipo para dados de compliance monitoring
export interface ComplianceMonitoringData {
  id: string;
  regulation: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'unknown';
  evidence?: string[];
  gaps?: string[];
  remediation?: Array<{
    action: string;
    deadline: Date;
    responsible: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  lastAssessed: Date;
  nextAssessment?: Date;
  metadata?: Metadata;
}

// Tipo para dados de audit trail
export interface AuditTrailEntryData {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Array<{
    field: string;
    oldValue: JsonValue;
    newValue: JsonValue;
  }>;
  ip: string;
  userAgent: string;
  sessionId: string;
  outcome: 'success' | 'failure';
  reason?: string;
  metadata?: Metadata;
}

// Tipo para dados de access control
export interface AccessControlData {
  userId: string;
  resource: string;
  action: string;
  permission: 'allow' | 'deny';
  reason: string;
  timestamp: Date;
  context?: {
    ip: string;
    userAgent: string;
    location?: string;
    riskScore?: number;
  };
  metadata?: Metadata;
}

// Tipo para dados de identity management
export interface IdentityManagementData {
  userId: string;
  identityProvider: string;
  attributes: Record<string, JsonValue>;
  roles: string[];
  groups: string[];
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended' | 'locked';
  lastLogin?: Date;
  passwordChanged?: Date;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de single sign-on
export interface SingleSignOnData {
  sessionId: string;
  userId: string;
  provider: string;
  applications: Array<{
    id: string;
    name: string;
    accessedAt: Date;
    status: 'active' | 'expired';
  }>;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  metadata?: Metadata;
}

// Tipo para dados de multi-factor authentication
export interface MultifactorAuthenticationData {
  userId: string;
  method: 'sms' | 'email' | 'totp' | 'push' | 'biometric';
  status: 'pending' | 'verified' | 'failed' | 'expired';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  verifiedAt?: Date;
  expiresAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de password policy
export interface PasswordPolicyData {
  id: string;
  name: string;
  rules: {
    minLength: number;
    maxLength?: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    prohibitCommon: boolean;
    prohibitPersonal: boolean;
    maxAge?: number;
    historySize?: number;
  };
  applicableTo: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Metadata;
}

// Tipo para dados de session management
export interface SessionManagementData {
  sessionId: string;
  userId: string;
  status: 'active' | 'expired' | 'terminated';
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ip: string;
  userAgent: string;
  location?: string;
  activities: Array<{
    timestamp: Date;
    action: string;
    resource?: string;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de device management
export interface DeviceManagementData {
  deviceId: string;
  userId: string;
  type: 'mobile' | 'desktop' | 'tablet' | 'iot';
  platform: string;
  version: string;
  status: 'trusted' | 'untrusted' | 'blocked';
  registeredAt: Date;
  lastSeen: Date;
  location?: string;
  compliance?: {
    encrypted: boolean;
    screenLock: boolean;
    upToDate: boolean;
    jailbroken: boolean;
  };
  metadata?: Metadata;
}

// Tipo para dados de certificate management
export interface CertificateManagementData {
  id: string;
  type: 'ssl' | 'code_signing' | 'client' | 'ca';
  subject: string;
  issuer: string;
  serialNumber: string;
  algorithm: string;
  keySize: number;
  issuedAt: Date;
  expiresAt: Date;
  status: 'valid' | 'expired' | 'revoked' | 'pending';
  usage: string[];
  renewalDate?: Date;
  metadata?: Metadata;
}

// Tipo para dados de key management
export interface KeyManagementData {
  keyId: string;
  type: 'symmetric' | 'asymmetric';
  algorithm: string;
  keySize: number;
  usage: string[];
  status: 'active' | 'inactive' | 'compromised' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  rotationSchedule?: string;
  lastRotated?: Date;
  accessLog: Array<{
    timestamp: Date;
    operation: string;
    userId: string;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de secret management
export interface SecretManagementData {
  id: string;
  name: string;
  type: 'password' | 'api_key' | 'certificate' | 'token';
  value: string; // encrypted
  version: number;
  status: 'active' | 'inactive' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  rotationSchedule?: string;
  lastRotated?: Date;
  accessLog: Array<{
    timestamp: Date;
    operation: string;
    userId: string;
  }>;
  metadata?: Metadata;
}

// Tipo para dados de vulnerability management
export interface VulnerabilityManagementData {
  id: string;
  cve?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvss?: number;
  affectedSystems: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive' | 'accepted';
  discoveredAt: Date;
  reportedBy: string;
  assignedTo?: string;
  dueDate?: Date;
  remediation?: {
    steps: string[];
    effort: 'low' | 'medium' | 'high';
    cost?: number;
  };
  metadata?: Metadata;
}

// Tipo para dados de threat intelligence
export interface ThreatIntelligenceData {
  id: string;
  type: 'ioc' | 'ttp' | 'campaign' | 'actor';
  indicator?: {
    type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
    value: string;
  };
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  tags: string[];
  firstSeen: Date;
  lastSeen: Date;
  active: boolean;
  metadata?: Metadata;
}

// Tipo para dados de incident response
export interface IncidentResponseData {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'operational' | 'compliance' | 'privacy';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  reportedAt: Date;
  reportedBy: string;
  assignedTo: string;
  timeline: Array<{
    timestamp: Date;
    action: string;
    description: string;
    userId: string;
  }>;
  impact?: {
    systems: string[];
    users: number;
    dataLoss: boolean;
    downtime: number;
  };
  resolution?: {
    summary: string;
    rootCause: string;
    actions: string[];
    preventiveMeasures: string[];
  };
  metadata?: Metadata;
}

// Tipo para dados de forensic analysis
export interface ForensicAnalysisData {
  id: string;
  incidentId: string;
  type: 'disk' | 'memory' | 'network' | 'mobile' | 'cloud';
  evidence: Array<{
    id: string;
    type: string;
    source: string;
    hash: string;
    size: number;
    collectedAt: Date;
    collectedBy: string;
    chainOfCustody: Array<{
      timestamp: Date;
      action: string;
      userId: string;
    }>;
  }>;
  findings: Array<{
    type: string;
    description: string;
    significance: 'low' | 'medium' | 'high';
    evidence: string[];
  }>;
  timeline?: Array<{
    timestamp: Date;
    event: string;
    source: string;
  }>;
  report?: string;
  status: 'in_progress' | 'completed' | 'on_hold';
  metadata?: Metadata;
}

// Tipo para dados de penetration testing
export interface PenetrationTestingData {
  id: string;
  name: string;
  type: 'black_box' | 'white_box' | 'gray_box';
  scope: {
    targets: string[];
    exclusions?: string[];
  };
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  findings: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    recommendation: string;
  }>;
  metadata?: Metadata;
}