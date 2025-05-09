
import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';

interface AudioStatusIndicatorProps {
  isCallActive: boolean;
}

const AudioStatusIndicator: React.FC<AudioStatusIndicatorProps> = ({ isCallActive }) => {
  const [levelBars, setLevelBars] = useState<number[]>([0, 0, 0, 0, 0]);
  const { audioLevel, isAudioDetected, startVisualization, stopVisualization } = useAudioVisualization();

  // Start/stop visualization based on call state
  useEffect(() => {
    if (isCallActive) {
      startVisualization();
    } else {
      stopVisualization();
    }
    
    return () => {
      stopVisualization();
    };
  }, [isCallActive, startVisualization, stopVisualization]);

  // Update level bars based on audio level
  useEffect(() => {
    if (isCallActive) {
      // Convert audio level (0-1) to bar heights (0-5)
      const totalBars = 5;
      const newLevelBars = [];
      
      for (let i = 0; i < totalBars; i++) {
        // Calculate threshold for this bar (e.g., for 5 bars: 0, 0.2, 0.4, 0.6, 0.8)
        const threshold = i / totalBars;
        
        // Set bar value to 1 if audio level exceeds threshold, 0 otherwise
        newLevelBars.push(audioLevel > threshold ? 1 : 0);
      }
      
      setLevelBars(newLevelBars);
    }
  }, [audioLevel, isCallActive]);

  // Don't render anything if call is not active
  if (!isCallActive) return null;

  return (
    <div className="flex items-center gap-1">
      {isAudioDetected ? (
        <>
          <Volume2 className="h-4 w-4 text-green-500" />
          <div className="flex items-end gap-0.5 h-4">
            {levelBars.map((level, idx) => (
              <div 
                key={idx} 
                className={`w-1 ${level ? 'bg-green-500' : 'bg-gray-300'}`}
                style={{ 
                  height: `${(idx + 1) * 20}%`,
                  transition: 'background-color 100ms ease-in-out'
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <VolumeX className="h-4 w-4 text-gray-500" />
      )}
    </div>
  );
};

export default AudioStatusIndicator;
