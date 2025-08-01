
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { audioStreamManager } from "@/services/janus/audioStreamManager";
import userInteractionService from "@/services/UserInteractionService";
import AudioStatusIndicator from "@/components/audio/AudioStatusIndicator";

interface AudioStatusProps {
  isCallActive: boolean;
}

const AudioStatus: React.FC<AudioStatusProps> = ({
  isCallActive
}) => {
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayAttempted = useRef(false);
  const [browserHasInteracted, setBrowserHasInteracted] = useState(
    userInteractionService.userHasInteracted()
  );

  // Initialize user interaction service when component mounts
  useEffect(() => {
    // Initialize the user interaction service
    userInteractionService.initialize();
    
    // Log if we already have user interaction
    console.log("AudioStatus: User has interacted:", userInteractionService.userHasInteracted());
    setBrowserHasInteracted(userInteractionService.userHasInteracted());
    
    // If no interaction yet, register for notification when it happens
    if (!userInteractionService.userHasInteracted()) {
      userInteractionService.onUserInteraction(() => {
        console.log("AudioStatus: User has now interacted with the page");
        setBrowserHasInteracted(true);
        
        // If we're in a call, try to play audio now that we have interaction
        if (isCallActive) {
          console.log("AudioStatus: In call with user interaction - attempting to play audio");
          audioStreamManager.forcePlay()
            .then(() => {
              console.log("Audio playback after interaction succeeded");
              setIsAudioPaused(false);
            })
            .catch(e => {
              console.warn("Play after interaction error:", e);
              setIsAudioPaused(true);
            });
        }
      });
    }
    
    // Listen for visibility change events
    const handleVisibilityChange = () => {
      if (!document.hidden && isCallActive && browserHasInteracted) {
        console.log("Document became visible during call - checking audio status");
        setTimeout(() => {
          const audioElement = audioStreamManager.getAudioElement();
          const isAudioCurrentlyPlaying = audioElement && !audioElement.paused && audioElement.srcObject;
          if (!isAudioCurrentlyPlaying) {
            console.log("Audio not playing after visibility change, attempting to resume");
            audioStreamManager.forcePlay()
              .then(() => setIsAudioPaused(false))
              .catch(e => {
                console.warn("Resume after visibility change failed:", e);
                setIsAudioPaused(true);
              });
          }
        }, 300);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCallActive, browserHasInteracted]);

  // Check for audio output device
  useEffect(() => {
    const checkAudioOutput = async () => {
      try {
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (savedAudioOutput) {
          // Set the audio stream manager's output device
          await audioStreamManager.setAudioOutput(savedAudioOutput);
        }
      } catch (error) {
        console.error("Error setting audio output device:", error);
      }
    };
    
    if (isCallActive) {
      checkAudioOutput();
    }
  }, [isCallActive]);

  // Auto-play audio when call becomes active
  useEffect(() => {
    if (isCallActive && !autoplayAttempted.current) {
      console.log("Call is active, attempting to auto-play audio");
      console.log("User has interacted with page:", userInteractionService.userHasInteracted());
      autoplayAttempted.current = true;
      
      // If we don't have user interaction yet, we'll need to prompt
      if (!userInteractionService.userHasInteracted()) {
        console.log("No user interaction yet, showing audio prompt");
        setIsAudioPaused(true);
        
        // User will need to interact via our UI
        setIsAudioPaused(true);
        
        return;
      }
      
      // Small delay to ensure everything is initialized
      setTimeout(async () => {
        try {
          await audioStreamManager.forcePlay();
          console.log("Auto-play: Audio started successfully");
          setIsAudioPaused(false);
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
      const audioElement = audioStreamManager.getAudioElement();
      const isPlaying = audioElement && !audioElement.paused && audioElement.srcObject;
      
      // If we have a stream but audio is paused, try to automatically resume
      if (!isPlaying) {
        console.log("Audio check: Audio is paused or not flowing");
        
        // Only try to auto-play if user has interacted
        if (userInteractionService.userHasInteracted()) {
          console.log("User has interacted, attempting to auto-play");
          
          audioStreamManager.forcePlay()
            .then(() => {
              console.log("Periodic check: Successfully resumed audio");
              setIsAudioPaused(false);
            })
            .catch(() => setIsAudioPaused(true));
        } else {
          // If no user interaction yet, show UI for interaction
          console.log("No user interaction yet, showing audio button");
          setIsAudioPaused(true);
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

  // Play button handler with multiple fallbacks - important for user interaction
  const handlePlayAudio = async () => {
    console.log("Enable Audio button clicked");
    
    // This click is our user interaction
    userInteractionService.forceInteractionState(true);
    setBrowserHasInteracted(true);
    
    try {
      // First, ensure the button click event is completed and browser knows user interacted
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Use AudioStreamManager for consistent playback
      await audioStreamManager.forcePlay();
      console.log("Audio playback started successfully");
      setIsAudioPaused(false);
      
    } catch (error) {
      console.error("Error starting audio playbook:", error);
      setIsAudioPaused(true);
      
      // Show audio controls as a fallback
      const audioElement = audioStreamManager.getAudioElement();
      if (audioElement) {
        audioElement.controls = true;
        audioElement.style.display = 'block';
        audioElement.style.position = 'fixed';
        audioElement.style.bottom = '10px';
        audioElement.style.right = '10px';
        audioElement.style.zIndex = '9999';
      }
    }
  };

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

  // Audio-only call status
  if (isCallActive) {
    return (
      <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
        <span className="text-sm text-gray-700">Audio Call Active</span>
        <AudioStatusIndicator isCallActive={isCallActive} />
      </div>
    );
  }

  return null;
};

export default AudioStatus;
