
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
  const autoplayAttempted = useRef(false);

  // Check for audio output device
  useEffect(() => {
    const checkAudioOutput = async () => {
      try {
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (savedAudioOutput && remoteVideoRef.current && 'setSinkId' in remoteVideoRef.current) {
          await (remoteVideoRef.current as any).setSinkId(savedAudioOutput);
          console.log("Video element audio output device set to:", savedAudioOutput);
          
          // Also set the audio service's output device
          await audioService.setAudioOutput(savedAudioOutput);
        }
      } catch (error) {
        console.error("Error setting video element audio output device:", error);
      }
    };
    
    if (isCallActive) {
      checkAudioOutput();
    }
  }, [isCallActive, remoteVideoRef]);

  // Auto-play audio when call becomes active
  useEffect(() => {
    if (isCallActive && !autoplayAttempted.current) {
      console.log("Call is active, attempting to auto-play audio");
      autoplayAttempted.current = true;
      
      // Small delay to ensure everything is initialized
      setTimeout(async () => {
        try {
          // First try direct audio service method
          const success = await audioService.forcePlayAudio();
          
          if (success) {
            console.log("Auto-play: Audio started successfully via audioService");
            setIsAudioPaused(false);
          } else {
            // If the audio service method failed, try the AudioOutputHandler
            console.log("Auto-play: Audio service method failed, trying AudioOutputHandler");
            const handlerSuccess = await AudioOutputHandler.checkAndPlayRemoteAudio();
            
            if (handlerSuccess) {
              console.log("Auto-play: Audio started successfully via AudioOutputHandler");
              setIsAudioPaused(false);
            } else {
              // Last resort - we'll show the button UI
              console.log("Auto-play: All automatic methods failed, showing button UI");
              setIsAudioPaused(true);
            }
          }
        } catch (error) {
          console.error("Auto-play: Error starting audio playback:", error);
          setIsAudioPaused(true);
        }
      }, 500);
    } else if (!isCallActive) {
      // Reset the autoplay flag when call ends
      autoplayAttempted.current = false;
      setIsAudioPaused(false);
    }
  }, [isCallActive]);

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

    // Start checking the audio status periodically
    const checkAudioStatus = () => {
      const isPlaying = audioService.isAudioPlaying();
      
      // If we have a stream but audio is paused, try to automatically resume
      if (!isPlaying) {
        console.log("Audio check: Audio is paused or not flowing");
        
        // If auto-play already attempted but failed, show UI
        if (autoplayAttempted.current) {
          console.log("Audio still not playing after auto-play attempt, will show UI");
          setIsAudioPaused(true);
        } else {
          // Try to auto-play if not attempted yet
          autoplayAttempted.current = true;
          audioService.forcePlayAudio()
            .then(success => {
              if (success) {
                console.log("Periodic check: Successfully resumed audio");
                setIsAudioPaused(false);
              } else {
                setIsAudioPaused(true);
              }
            })
            .catch(() => setIsAudioPaused(true));
        }
      } else {
        // Audio is playing, hide the UI
        setIsAudioPaused(false);
      }
    };

    // Initial check
    checkAudioStatus();
    
    // Set up periodic monitoring
    statusCheckRef.current = setInterval(checkAudioStatus, 3000);
    
    return () => {
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
        statusCheckRef.current = null;
      }
    };
  }, [isCallActive]);

  // Play button handler with multiple fallbacks
  const handlePlayAudio = async () => {
    console.log("Enable Audio button clicked");
    
    try {
      // First, ensure the button click event is completed and browser knows user interacted
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Try three different methods to start audio playback
      
      // Method 1: Audio Service
      console.log("Trying method 1: Audio Service");
      const success = await audioService.forcePlayAudio();
      
      if (success) {
        console.log("Audio playback started successfully via audioService");
        setIsAudioPaused(false);
        return;
      }
      
      // Method 2: AudioOutputHandler
      console.log("Method 1 failed, trying method 2: AudioOutputHandler");
      const handlerSuccess = await AudioOutputHandler.checkAndPlayRemoteAudio();
      
      if (handlerSuccess) {
        console.log("Audio playback started successfully via AudioOutputHandler");
        setIsAudioPaused(false);
        return;
      }
      
      // Method 3: Direct video element manipulation if we have a video call
      if (isVideoEnabled && remoteVideoRef.current) {
        console.log("Method 2 failed, trying method 3: Direct video element play");
        try {
          await remoteVideoRef.current.play();
          console.log("Audio playback started via video element");
          setIsAudioPaused(false);
          return;
        } catch (e) {
          console.warn("Video element play failed:", e);
        }
      }
      
      // Last resort - show audio controls
      console.log("All methods failed, showing audio controls");
      audioService.showAudioControls();
      
    } catch (error) {
      console.error("Error starting audio playback:", error);
      // Show audio controls as a fallback
      audioService.showAudioControls();
    }
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
