export type AnimationType = 
  | 'fadeIn'
  | 'fadeOut'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideInUp'
  | 'slideInDown'
  | 'slideOutLeft'
  | 'slideOutRight'
  | 'slideOutUp'
  | 'slideOutDown'
  | 'scaleIn'
  | 'scaleOut'
  | 'rotateIn'
  | 'rotateOut'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'flip'
  | 'zoom'
  | 'elastic';

export type EasingType = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'circIn'
  | 'circOut'
  | 'circInOut'
  | 'backIn'
  | 'backOut'
  | 'backInOut'
  | 'anticipate'
  | 'bounceIn'
  | 'bounceOut'
  | 'bounceInOut';

export interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay?: number;
  easing?: EasingType;
  repeat?: number | 'infinite';
  repeatType?: 'loop' | 'reverse' | 'mirror';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface AnimationKeyframe {
  time: number; // 0-1
  properties: Record<string, unknown>;
  easing?: EasingType;
}

export interface AnimationSequence {
  id: string;
  name: string;
  keyframes: AnimationKeyframe[];
  duration: number;
  loop?: boolean;
}

export interface AnimationTimeline {
  id: string;
  name: string;
  sequences: AnimationSequence[];
  totalDuration: number;
  autoPlay?: boolean;
  loop?: boolean;
}

export interface AnimatedElementProps {
  id: string;
  animation?: AnimationConfig;
  timeline?: AnimationTimeline;
  trigger?: 'onMount' | 'onHover' | 'onClick' | 'onScroll' | 'manual';
  threshold?: number; // for scroll trigger
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export interface AnimationControlsState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  progress: number;
}

export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  category: 'entrance' | 'exit' | 'emphasis' | 'transition';
  config: AnimationConfig;
  preview?: string; // URL or base64 for preview gif/video
}

export interface AnimationLibrary {
  presets: AnimationPreset[];
  custom: AnimationConfig[];
  timelines: AnimationTimeline[];
}

export interface AnimationEvent {
  type: 'start' | 'complete' | 'pause' | 'resume' | 'update';
  elementId: string;
  animationId?: string;
  progress?: number;
  timestamp: number;
}

export type AnimationEventHandler = (event: AnimationEvent) => void;

export interface AnimationSystemConfig {
  globalDuration?: number;
  globalEasing?: EasingType;
  reducedMotion?: boolean;
  debugMode?: boolean;
  onAnimationEvent?: AnimationEventHandler;
}