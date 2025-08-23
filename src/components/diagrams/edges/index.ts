// ============================================================================
// Edge Types Registry
// ============================================================================

import React from 'react';
import { EdgeTypes } from 'reactflow';

// ============================================================================
// EDGE COMPONENTS (Dynamic Imports)
// ============================================================================

// Auto-routed edge with pathfinding capabilities
const AutoRoutedEdge = React.lazy(() => import('./AutoRoutedEdge'));

// Smart edge with intelligent routing
const SmartEdge = React.lazy(() => import('./SmartEdge'));

// Animated edge with visual effects
const AnimatedEdge = React.lazy(() => import('./AnimatedEdge'));

// Custom Bézier edge with adjustable curves
const CustomBezierEdge = React.lazy(() => import('./CustomBezierEdge'));

// ============================================================================
// DIRECT EXPORTS
// ============================================================================

export { default as AutoRoutedEdge } from './AutoRoutedEdge';
export { default as SmartEdge } from './SmartEdge';
export { default as AnimatedEdge } from './AnimatedEdge';
export { default as CustomBezierEdge } from './CustomBezierEdge';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export * from './types';

// ============================================================================
// EDGE TYPES REGISTRY
// ============================================================================

export const edgeTypes: EdgeTypes = {
  'auto-routed': AutoRoutedEdge,
  'smart': SmartEdge,
  'animated': AnimatedEdge,
  'custom-bezier': CustomBezierEdge,
};

export default edgeTypes;