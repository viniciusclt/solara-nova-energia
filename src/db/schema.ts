import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ========================================
// TABELAS PRINCIPAIS
// ========================================

// Companies table
export const companies = sqliteTable('companies', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(),
  cnpj: text('cnpj').notNull().unique(),
  address: text('address'),
  num_employees: integer('num_employees').default(1),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// Profiles table
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  access_type: text('access_type', { enum: ['vendedor', 'engenheiro', 'admin', 'super_admin'] }).notNull().default('vendedor'),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  two_factor_secret: text('two_factor_secret'),
  last_login: text('last_login'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// Subscriptions table
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  company_id: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['ativa', 'expirada', 'gratuita', 'cancelada'] }).notNull().default('ativa'),
  monthly_value: real('monthly_value'),
  start_date: text('start_date').default(sql`(datetime('now'))`),
  end_date: text('end_date'),
  authorized_employees: integer('authorized_employees').notNull().default(1),
  stripe_subscription_id: text('stripe_subscription_id'),
  is_free: integer('is_free', { mode: 'boolean' }).default(false),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// ========================================
// TABELAS DE PROPOSTAS
// ========================================

// Proposal templates table
export const proposalTemplates = sqliteTable('proposal_templates', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(),
  format: text('format', { enum: ['A4', '16:9'] }).notNull(),
  canvas_data: text('canvas_data', { mode: 'json' }).notNull().default('{}'),
  thumbnail_url: text('thumbnail_url'),
  is_public: integer('is_public', { mode: 'boolean' }).default(false),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  created_by: text('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// Proposal elements table
export const proposalElements = sqliteTable('proposal_elements', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  template_id: text('template_id').notNull().references(() => proposalTemplates.id, { onDelete: 'cascade' }),
  element_type: text('element_type', { enum: ['text', 'image', 'chart', 'table', 'shape'] }).notNull(),
  properties: text('properties', { mode: 'json' }).notNull().default('{}'),
  position: text('position', { mode: 'json' }).notNull().default('{"x": 0, "y": 0, "width": 100, "height": 100}'),
  z_index: integer('z_index').default(0),
  created_at: text('created_at').default(sql`(datetime('now'))`)
});

// ========================================
// TABELAS DE TREINAMENTO
// ========================================

// Training modules table
export const trainingModules = sqliteTable('training_modules', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  difficulty_level: text('difficulty_level', { enum: ['iniciante', 'intermediario', 'avancado'] }).notNull().default('iniciante'),
  estimated_duration: integer('estimated_duration'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  order_index: integer('order_index').default(0),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// Training content table
export const trainingContent = sqliteTable('training_content', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  module_id: text('module_id').notNull().references(() => trainingModules.id, { onDelete: 'cascade' }),
  content_type: text('content_type', { enum: ['video', 'text', 'quiz', 'document'] }).notNull(),
  title: text('title').notNull(),
  content_data: text('content_data', { mode: 'json' }).notNull().default('{}'),
  order_index: integer('order_index').default(0),
  is_required: integer('is_required', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// User training progress table
export const userTrainingProgress = sqliteTable('user_training_progress', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  module_id: text('module_id').notNull().references(() => trainingModules.id, { onDelete: 'cascade' }),
  content_id: text('content_id').references(() => trainingContent.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['not_started', 'in_progress', 'completed'] }).notNull().default('not_started'),
  progress_percentage: integer('progress_percentage').default(0),
  completed_at: text('completed_at'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// Training assessments table
export const trainingAssessments = sqliteTable('training_assessments', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  module_id: text('module_id').notNull().references(() => trainingModules.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  questions: text('questions', { mode: 'json' }).notNull().default('[]'),
  passing_score: integer('passing_score').default(70),
  time_limit: integer('time_limit'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// ========================================
// TABELAS DE DIAGRAMAS
// ========================================

// Diagrams table
export const diagrams = sqliteTable('diagrams', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', { enum: ['flowchart', 'mindmap', 'bpmn', 'organogram', 'network', 'custom'] }).notNull().default('flowchart'),
  content: text('content', { mode: 'json' }).notNull().default('{}'),
  thumbnail: text('thumbnail'),
  is_public: integer('is_public', { mode: 'boolean' }).default(false),
  is_template: integer('is_template', { mode: 'boolean' }).default(false),
  version: integer('version').default(1),
  owner_id: text('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// Diagram revisions table
export const diagramRevisions = sqliteTable('diagram_revisions', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  diagram_id: text('diagram_id').notNull().references(() => diagrams.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: text('content', { mode: 'json' }).notNull(),
  thumbnail: text('thumbnail'),
  changes_summary: text('changes_summary'),
  created_by: text('created_by').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  created_at: text('created_at').default(sql`(datetime('now'))`)
});

// Diagram collaborators table
export const diagramCollaborators = sqliteTable('diagram_collaborators', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  diagram_id: text('diagram_id').notNull().references(() => diagrams.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  permission: text('permission', { enum: ['owner', 'editor', 'viewer', 'commenter'] }).notNull().default('viewer'),
  invited_by: text('invited_by').references(() => profiles.id, { onDelete: 'set null' }),
  invited_at: text('invited_at').default(sql`(datetime('now'))`),
  accepted_at: text('accepted_at'),
  created_at: text('created_at').default(sql`(datetime('now'))`)
});

// ========================================
// TABELAS DE AUDITORIA E NOTIFICAÇÕES
// ========================================

// Audit logs table
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  user_id: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  details: text('details', { mode: 'json' }),
  ip_address: text('ip_address'),
  created_at: text('created_at').default(sql`(datetime('now'))`)
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  user_id: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['info', 'success', 'warning', 'error'] }).notNull().default('info'),
  is_read: integer('is_read', { mode: 'boolean' }).default(false),
  action_url: text('action_url'),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
  expires_at: text('expires_at'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`)
});

// ========================================
// TIPOS PARA TYPESCRIPT
// ========================================

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type ProposalTemplate = typeof proposalTemplates.$inferSelect;
export type NewProposalTemplate = typeof proposalTemplates.$inferInsert;

export type ProposalElement = typeof proposalElements.$inferSelect;
export type NewProposalElement = typeof proposalElements.$inferInsert;

export type TrainingModule = typeof trainingModules.$inferSelect;
export type NewTrainingModule = typeof trainingModules.$inferInsert;

export type TrainingContent = typeof trainingContent.$inferSelect;
export type NewTrainingContent = typeof trainingContent.$inferInsert;

export type UserTrainingProgress = typeof userTrainingProgress.$inferSelect;
export type NewUserTrainingProgress = typeof userTrainingProgress.$inferInsert;

export type TrainingAssessment = typeof trainingAssessments.$inferSelect;
export type NewTrainingAssessment = typeof trainingAssessments.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type Diagram = typeof diagrams.$inferSelect;
export type NewDiagram = typeof diagrams.$inferInsert;

export type DiagramRevision = typeof diagramRevisions.$inferSelect;
export type NewDiagramRevision = typeof diagramRevisions.$inferInsert;

export type DiagramCollaborator = typeof diagramCollaborators.$inferSelect;
export type NewDiagramCollaborator = typeof diagramCollaborators.$inferInsert;