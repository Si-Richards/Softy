
import React, { useEffect } from 'react';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AudioStatusIndicatorProps {
  isCallActive: boolean;
  className?: string;
}

const AudioStatusIndicator: React.FC<AudioStatusIndicatorProps> = ({ 
  isCallActive,
  className = '' 
}) => {
  const { audioLevel, isAudioDetected, startVisualization, stopVisualization } = useAudioVisualization();
  
  useEffect(() => {
    if (isCallActive) {
      startVisualization();
    } else {
      stopVisualization();
    }
    return () => stopVisualization();
  }, [isCallActive, startVisualization, stopVisualization]);
  
  if (!isCallActive) return null;
  
  // Create bars for visualization
  const bars = [];
  const barCount = 5;
  const barThreshold = 1.0 / barCount;
  
  for (let i = 0; i < barCount; i++) {
    const isActive = audioLevel >= barThreshold * i;
    bars.push(
      <div 
        key={i}
        className={`w-1 mx-px h-${i+2} rounded-sm ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
        style={{ 
          height: `${(i+1) * 3}px`,
          backgroundColor: isActive ? '#10b981' : '#e5e7eb'
        }}
      />
    );
  }
  
  // Show appropriate icon based on audio status
  const getIcon = () => {
    if (!isCallActive) return <VolumeX className="h-4 w-4 text-gray-400" />;
    
    if (isAudioDetected) {
      return <Volume2 className="h-4 w-4 text-green-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center space-x-1 ${className}`}>
          {getIcon()}
          <div className="flex items-end">
            {bars}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {isAudioDetected 
          ? "Audio is being detected" 
          : "No audio detected - check volume and audio device settings"}
      </TooltipContent>
    </Tooltip>
  );
};

export default AudioStatusIndicator;
