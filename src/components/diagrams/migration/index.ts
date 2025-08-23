// ============================================================================
// Migration Module - Exports for diagram migration utilities
// ============================================================================

export { DiagramMigrationWrapper } from './DiagramMigrationWrapper';
export { default as DiagramMigrationWrapper } from './DiagramMigrationWrapper';

// Migration utilities and types
export type {
  DiagramMigrationWrapperProps,
  MigrationState
} from './DiagramMigrationWrapper';

// Re-export for convenience
export { DiagramMigrationWrapper as MigrationWrapper };