
import { useState, useEffect, useRef, useCallback } from 'react';
import audioService from '@/services/AudioService';

export const useAudioVisualization = () => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAudioDetected, setIsAudioDetected] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<number>(0);
  
  const startVisualization = useCallback(() => {
    if (animationRef.current) return;
    
    const updateVisualization = () => {
      // Get current audio level from the service
      const level = audioService.getAudioLevel();
      setAudioLevel(level);
      
      // Set audio detection flag if level is above threshold
      if (level > 0.01) {
        setIsAudioDetected(true);
        lastDetectionRef.current = Date.now();
      } else if (Date.now() - lastDetectionRef.current > 1000) {
        // Reset audio detection flag if no audio for 1 second
        setIsAudioDetected(false);
      }
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(updateVisualization);
    };
    
    // Initialize audio context before starting visualization
    // Make sure audioService has audio context initialized
    audioService.getAudioElement();
    
    animationRef.current = requestAnimationFrame(updateVisualization);
  }, []);
  
  const stopVisualization = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setAudioLevel(0);
    setIsAudioDetected(false);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return {
    audioLevel,
    isAudioDetected,
    startVisualization,
    stopVisualization
  };
};
