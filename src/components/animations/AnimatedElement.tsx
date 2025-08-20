import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useAnimation, useInView, Variants } from 'framer-motion';
import { useAnimationSystem } from './AnimationSystem';
import { 
  AnimatedElementProps, 
  AnimationType, 
  AnimationConfig,
  AnimationEvent
} from '../../types/animations';

const getAnimationVariants = (type: AnimationType, config: AnimationConfig): Variants => {
  const { duration, delay = 0, easing = 'easeOut', repeat, repeatType } = config;
  
  const transition = {
    duration,
    delay,
    ease: easing,
    repeat: repeat === 'infinite' ? Infinity : repeat,
    repeatType
  };

  switch (type) {
    case 'fadeIn':
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition }
      };
    
    case 'fadeOut':
      return {
        visible: { opacity: 1 },
        hidden: { opacity: 0, transition }
      };
    
    case 'slideInLeft':
      return {
        hidden: { x: -100, opacity: 0 },
        visible: { x: 0, opacity: 1, transition }
      };
    
    case 'slideInRight':
      return {
        hidden: { x: 100, opacity: 0 },
        visible: { x: 0, opacity: 1, transition }
      };
    
    case 'slideInUp':
      return {
        hidden: { y: 100, opacity: 0 },
        visible: { y: 0, opacity: 1, transition }
      };
    
    case 'slideInDown':
      return {
        hidden: { y: -100, opacity: 0 },
        visible: { y: 0, opacity: 1, transition }
      };
    
    case 'slideOutLeft':
      return {
        visible: { x: 0, opacity: 1 },
        hidden: { x: -100, opacity: 0, transition }
      };
    
    case 'slideOutRight':
      return {
        visible: { x: 0, opacity: 1 },
        hidden: { x: 100, opacity: 0, transition }
      };
    
    case 'slideOutUp':
      return {
        visible: { y: 0, opacity: 1 },
        hidden: { y: -100, opacity: 0, transition }
      };
    
    case 'slideOutDown':
      return {
        visible: { y: 0, opacity: 1 },
        hidden: { y: 100, opacity: 0, transition }
      };
    
    case 'scaleIn':
      return {
        hidden: { scale: 0, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition }
      };
    
    case 'scaleOut':
      return {
        visible: { scale: 1, opacity: 1 },
        hidden: { scale: 0, opacity: 0, transition }
      };
    
    case 'rotateIn':
      return {
        hidden: { rotate: -180, opacity: 0 },
        visible: { rotate: 0, opacity: 1, transition }
      };
    
    case 'rotateOut':
      return {
        visible: { rotate: 0, opacity: 1 },
        hidden: { rotate: 180, opacity: 0, transition }
      };
    
    case 'bounce':
      return {
        hidden: { y: 0 },
        visible: {
          y: [0, -30, 0],
          transition: {
            ...transition,
            times: [0, 0.5, 1]
          }
        }
      };
    
    case 'pulse':
      return {
        hidden: { scale: 1 },
        visible: {
          scale: [1, 1.05, 1],
          transition: {
            ...transition,
            times: [0, 0.5, 1]
          }
        }
      };
    
    case 'shake':
      return {
        hidden: { x: 0 },
        visible: {
          x: [0, -10, 10, -10, 10, 0],
          transition: {
            ...transition,
            times: [0, 0.2, 0.4, 0.6, 0.8, 1]
          }
        }
      };
    
    case 'flip':
      return {
        hidden: { rotateY: 0 },
        visible: {
          rotateY: 360,
          transition
        }
      };
    
    case 'zoom':
      return {
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
          scale: [0.8, 1.1, 1],
          opacity: 1,
          transition: {
            ...transition,
            times: [0, 0.6, 1]
          }
        }
      };
    
    case 'elastic':
      return {
        hidden: { scale: 0 },
        visible: {
          scale: [0, 1.2, 0.9, 1.1, 1],
          transition: {
            ...transition,
            times: [0, 0.4, 0.6, 0.8, 1]
          }
        }
      };
    
    default:
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition }
      };
  }
};

export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  id,
  animation,
  timeline,
  trigger = 'onMount',
  threshold = 0.1,
  className,
  style,
  children
}) => {
  const { config, emitEvent } = useAnimationSystem();
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { threshold });
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const emitAnimationEvent = useCallback((type: AnimationEvent['type'], progress?: number) => {
    emitEvent({
      type,
      elementId: id,
      animationId: animation?.type,
      progress,
      timestamp: Date.now()
    });
  }, [id, animation?.type, emitEvent]);

  const playAnimation = useCallback(async () => {
    if (!animation || config.reducedMotion) return;
    
    try {
      emitAnimationEvent('start');
      await controls.start('visible');
      emitAnimationEvent('complete', 1);
      setHasAnimated(true);
    } catch (error) {
      console.error('Animation error:', error);
    }
  }, [animation, config.reducedMotion, controls, emitAnimationEvent]);

  const resetAnimation = useCallback(() => {
    if (!animation) return;
    controls.set('hidden');
    setHasAnimated(false);
  }, [animation, controls]);

  // Handle different triggers
  useEffect(() => {
    switch (trigger) {
      case 'onMount':
        if (animation && !hasAnimated) {
          playAnimation();
        }
        break;
      
      case 'onScroll':
        if (isInView && animation && !hasAnimated) {
          playAnimation();
        }
        break;
    }
  }, [trigger, animation, isInView, hasAnimated, playAnimation]);

  // Handle timeline animations
  useEffect(() => {
    if (timeline && timeline.autoPlay) {
      // TODO: Implement timeline playback
      console.log('Timeline animation not yet implemented');
    }
  }, [timeline]);

  const handleClick = () => {
    if (trigger === 'onClick' && animation) {
      resetAnimation();
      setTimeout(playAnimation, 50);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'onHover' && animation) {
      playAnimation();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'onHover' && animation) {
      resetAnimation();
    }
  };

  if (config.reducedMotion) {
    return (
      <div 
        ref={ref}
        className={className}
        style={style}
        onClick={handleClick}
      >
        {children}
      </div>
    );
  }

  const variants = animation ? getAnimationVariants(animation.type, animation) : undefined;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      animate={controls}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onAnimationStart={() => emitAnimationEvent('start')}
      onAnimationComplete={() => emitAnimationEvent('complete', 1)}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedElement;