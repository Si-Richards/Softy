
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { AudioOutputHandler } from "@/services/janus/utils/audioOutputHandler";
import audioService from "@/services/AudioService";

interface VideoDisplayProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isVideoEnabled: boolean;
  isCallActive: boolean;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  localVideoRef,
  remoteVideoRef,
  isVideoEnabled,
  isCallActive,
}) => {
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Check for audio output device
  useEffect(() => {
    const checkAudioOutput = async () => {
      try {
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (savedAudioOutput && remoteVideoRef.current && 'setSinkId' in remoteVideoRef.current) {
          await (remoteVideoRef.current as any).setSinkId(savedAudioOutput);
          console.log("Video element audio output device set to:", savedAudioOutput);
        }
      } catch (error) {
        console.error("Error setting video element audio output device:", error);
      }
    };
    
    if (isCallActive) {
      checkAudioOutput();
    }
  }, [isCallActive, remoteVideoRef]);

  // Setup periodic audio status check
  useEffect(() => {
    if (!isCallActive) {
      setIsAudioPaused(false);
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
        statusCheckRef.current = null;
      }
      return;
    }

    // Start checking the audio status immediately
    const checkAudioStatus = () => {
      const isPlaying = audioService.isAudioPlaying();
      setIsAudioPaused(!isPlaying);
      
      // If we have a stream but audio is paused, try to automatically resume
      if (!isPlaying) {
        const remoteStream = remoteVideoRef.current?.srcObject as MediaStream;
        if (remoteStream?.getAudioTracks().length > 0) {
          audioService.forcePlayAudio().catch(err => {
            console.warn("Auto-resume failed, user interaction needed:", err);
          });
        }
      }
    };

    // Initial check
    checkAudioStatus();
    
    // Set up periodic monitoring
    statusCheckRef.current = setInterval(checkAudioStatus, 2000);
    
    return () => {
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
        statusCheckRef.current = null;
      }
    };
  }, [isCallActive, remoteVideoRef]);

  // Play button handler
  const handlePlayAudio = () => {
    audioService.forcePlayAudio()
      .then(success => {
        if (success) {
          setIsAudioPaused(false);
          console.log("Audio playback started successfully");
        }
      })
      .catch(error => {
        console.error("Error starting audio playback:", error);
        // Show audio controls as a fallback
        audioService.showAudioControls();
      });
  };

  // Only show video container if video is enabled
  if (!isVideoEnabled && !isAudioPaused) return null;

  // Show audio playback notification if audio is paused
  if (isCallActive && isAudioPaused) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <p className="mb-3 text-sm">Audio playback is paused. Click the button below to enable audio.</p>
        <Button 
          onClick={handlePlayAudio}
          className="bg-softphone-accent hover:bg-softphone-accent/90 text-white"
        >
          <Play className="mr-1 h-4 w-4" /> Enable Audio
        </Button>
      </div>
    );
  }

  // Regular video display
  if (isVideoEnabled) {
    return (
      <div className={`relative mb-6 ${isCallActive ? "block" : "hidden"}`}>
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          ></video>
        </div>
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          ></video>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoDisplay;
