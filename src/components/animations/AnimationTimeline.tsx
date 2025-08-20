import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useAnimationSystem } from './AnimationSystem';
import {
  AnimationTimeline as TimelineType,
  AnimationSequence,
  AnimationControlsState
} from '../../types/animations';

interface AnimationTimelineProps {
  timeline: TimelineType;
  onTimelineUpdate?: (timeline: TimelineType) => void;
  className?: string;
}

interface TimelinePlayerProps {
  timeline: TimelineType;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onSeek?: (time: number) => void;
}

const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  timeline,
  onPlay,
  onPause,
  onStop,
  onSeek
}) => {
  const [controlsState, setControlsState] = useState<AnimationControlsState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: timeline.totalDuration,
    progress: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateProgress = useCallback(() => {
    if (controlsState.isPlaying && !controlsState.isPaused) {
      setControlsState(prev => {
        const newTime = prev.currentTime + 0.1;
        const newProgress = Math.min(newTime / prev.duration, 1);
        
        if (newProgress >= 1) {
          // Timeline completed
          if (timeline.loop) {
            return {
              ...prev,
              currentTime: 0,
              progress: 0
            };
          } else {
            return {
              ...prev,
              isPlaying: false,
              currentTime: prev.duration,
              progress: 1
            };
          }
        }
        
        return {
          ...prev,
          currentTime: newTime,
          progress: newProgress
        };
      });
    }
  }, [controlsState.isPlaying, controlsState.isPaused, timeline.loop]);

  useEffect(() => {
    if (controlsState.isPlaying && !controlsState.isPaused) {
      intervalRef.current = setInterval(updateProgress, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [controlsState.isPlaying, controlsState.isPaused, updateProgress]);

  const handlePlay = () => {
    setControlsState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false
    }));
    onPlay?.();
  };

  const handlePause = () => {
    setControlsState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
    onPause?.();
  };

  const handleStop = () => {
    setControlsState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      progress: 0
    }));
    onStop?.();
  };

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * timeline.totalDuration;
    setControlsState(prev => ({
      ...prev,
      currentTime: newTime,
      progress: value[0] / 100
    }));
    onSeek?.(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[controlsState.progress * 100]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(controlsState.currentTime)}</span>
          <span>{formatTime(timeline.totalDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSeek([0])}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={controlsState.isPlaying ? handlePause : handlePlay}
        >
          {controlsState.isPlaying && !controlsState.isPaused ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
        >
          <Square className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSeek([100])}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const SequenceItem: React.FC<{
  sequence: AnimationSequence;
  isActive: boolean;
  progress: number;
}> = ({ sequence, isActive, progress }) => {
  return (
    <motion.div
      className={`p-3 rounded-lg border transition-colors ${
        isActive ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      animate={{
        scale: isActive ? 1.02 : 1,
        opacity: isActive ? 1 : 0.7
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{sequence.name}</h4>
        <span className="text-xs text-muted-foreground">
          {sequence.duration}s
        </span>
      </div>
      
      {isActive && (
        <div className="w-full bg-secondary rounded-full h-1">
          <motion.div
            className="bg-primary h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}
      
      <div className="mt-2 text-xs text-muted-foreground">
        {sequence.keyframes.length} keyframes
      </div>
    </motion.div>
  );
};

export const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  timeline,
  onTimelineUpdate,
  className
}) => {
  const { emitEvent } = useAnimationSystem();
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [sequenceProgress, setSequenceProgress] = useState(0);

  const handlePlay = useCallback(() => {
    emitEvent({
      type: 'start',
      elementId: timeline.id,
      timestamp: Date.now()
    });
  }, [timeline.id, emitEvent]);

  const handlePause = useCallback(() => {
    emitEvent({
      type: 'pause',
      elementId: timeline.id,
      timestamp: Date.now()
    });
  }, [timeline.id, emitEvent]);

  const handleStop = useCallback(() => {
    setCurrentSequenceIndex(0);
    setSequenceProgress(0);
    emitEvent({
      type: 'complete',
      elementId: timeline.id,
      timestamp: Date.now()
    });
  }, [timeline.id, emitEvent]);

  const handleSeek = useCallback((time: number) => {
    // Calculate which sequence should be active at this time
    let accumulatedTime = 0;
    let targetSequenceIndex = 0;
    let targetProgress = 0;

    for (let i = 0; i < timeline.sequences.length; i++) {
      const sequence = timeline.sequences[i];
      if (time <= accumulatedTime + sequence.duration) {
        targetSequenceIndex = i;
        targetProgress = (time - accumulatedTime) / sequence.duration;
        break;
      }
      accumulatedTime += sequence.duration;
    }

    setCurrentSequenceIndex(targetSequenceIndex);
    setSequenceProgress(Math.max(0, Math.min(1, targetProgress)));
  }, [timeline.sequences]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{timeline.name}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {timeline.sequences.length} sequences
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Timeline Player */}
        <TimelinePlayer
          timeline={timeline}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onSeek={handleSeek}
        />
        
        {/* Sequences List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Sequences</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {timeline.sequences.map((sequence, index) => (
              <SequenceItem
                key={sequence.id}
                sequence={sequence}
                isActive={index === currentSequenceIndex}
                progress={index === currentSequenceIndex ? sequenceProgress : 0}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimationTimeline;