// Centralized design tokens (Tailwind utility presets)
// Keep tokens as className strings for consistency with existing codebase.

// Surfaces
export const cardBase = "rounded-xl border border-neutral-200 bg-background p-6 shadow-sm dark:border-neutral-800";

// Inputs
export const inputBase = "rounded-md border border-neutral-300 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-700 dark:focus-visible:ring-blue-400 disabled:opacity-50";

// Spacing scale aliases (not yet widely used, but available for gradual adoption)
export const spacing = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
} as const;

// Shadows
export const shadows = {
  soft: "shadow-sm",
  medium: "shadow-md",
  solar: "shadow-[var(--shadow-solar)]",
} as const;

// Color semantic helpers (utility presets)
export const semantic = {
  infoBadge: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800",
  successBadge: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800",
  warningBadge: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800",
  dangerBadge: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800",
} as const;