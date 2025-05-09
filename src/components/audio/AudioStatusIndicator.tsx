
import React, { useEffect, useState } from 'react';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import audioService from '@/services/AudioService';
import janusService from '@/services/JanusService';

interface AudioStatusIndicatorProps {
  isCallActive: boolean;
  className?: string;
}

const AudioStatusIndicator: React.FC<AudioStatusIndicatorProps> = ({ 
  isCallActive,
  className = '' 
}) => {
  const { audioLevel, isAudioDetected, startVisualization, stopVisualization } = useAudioVisualization();
  const [hasAudioTracks, setHasAudioTracks] = useState(false);
  
  // Check if we have audio tracks when call becomes active
  useEffect(() => {
    if (isCallActive) {
      const remoteStream = janusService.getRemoteStream();
      const trackCount = remoteStream?.getAudioTracks().length ?? 0;
      setHasAudioTracks(trackCount > 0);
      
      if (trackCount > 0) {
        console.log("AudioStatusIndicator: Audio tracks found:", trackCount);
        audioService.attachStream(remoteStream!);
      } else {
        console.warn("AudioStatusIndicator: No audio tracks in remote stream");
      }
      
      startVisualization();
    } else {
      stopVisualization();
      setHasAudioTracks(false);
    }
    
    // Set up an interval to check for tracks in case they come in late
    const trackCheckInterval = setInterval(() => {
      if (isCallActive) {
        const remoteStream = janusService.getRemoteStream();
        const trackCount = remoteStream?.getAudioTracks().length ?? 0;
        setHasAudioTracks(trackCount > 0);
        
        if (trackCount > 0 && !hasAudioTracks) {
          console.log("AudioStatusIndicator: Audio tracks found after delay:", trackCount);
          audioService.attachStream(remoteStream!);
          startVisualization();
        }
      }
    }, 2000);
    
    return () => {
      stopVisualization();
      clearInterval(trackCheckInterval);
    };
  }, [isCallActive, startVisualization, stopVisualization, hasAudioTracks]);
  
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
    if (!hasAudioTracks) return <AlertCircle className="h-4 w-4 text-red-500" />;
    
    if (isAudioDetected) {
      return <Volume2 className="h-4 w-4 text-green-500" />;
    } else {
      return <VolumeX className="h-4 w-4 text-yellow-500" />;
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
        {!hasAudioTracks 
          ? "No audio tracks detected - call connection issue" 
          : isAudioDetected 
            ? "Audio is being detected" 
            : "No audio detected - check volume and audio device settings"}
      </TooltipContent>
    </Tooltip>
  );
};

export default AudioStatusIndicator;
