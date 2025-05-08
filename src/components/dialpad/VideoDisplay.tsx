
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

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

  // Check for audio output device
  useEffect(() => {
    const checkAudioOutput = async () => {
      try {
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (savedAudioOutput && remoteVideoRef.current && 'setSinkId' in remoteVideoRef.current) {
          await (remoteVideoRef.current as any).setSinkId(savedAudioOutput);
          console.log("Audio output device set to:", savedAudioOutput);
        }
      } catch (error) {
        console.error("Error setting audio output device:", error);
      }
    };
    
    if (isCallActive) {
      checkAudioOutput();
    }
  }, [isCallActive, remoteVideoRef]);

  // If video is not enabled but call is active, create a hidden audio element
  useEffect(() => {
    if (isCallActive && !isVideoEnabled) {
      // Ensure we have an audio element for audio-only calls
      let audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
      if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = 'remoteAudio';
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
        console.log("Created audio element for audio-only call");
      }
    }
  }, [isCallActive, isVideoEnabled]);

  // Monitor audio playback status
  useEffect(() => {
    if (!isCallActive) {
      setIsAudioPaused(false);
      return;
    }

    // Find the audio element
    const checkAudioStatus = () => {
      const audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
      if (audioElement) {
        const isPaused = audioElement.paused;
        console.log("Audio element status:", {
          volume: audioElement.volume,
          muted: audioElement.muted,
          paused: isPaused
        });
        setIsAudioPaused(isPaused);
      }
    };

    // Check immediately
    checkAudioStatus();

    // Then check periodically
    const interval = setInterval(checkAudioStatus, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isCallActive]);

  // Play button handler
  const handlePlayAudio = () => {
    const audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
    if (audioElement) {
      console.log("Playing audio manually");
      audioElement.play()
        .then(() => {
          console.log("Audio playback started successfully");
          setIsAudioPaused(false);
        })
        .catch(error => {
          console.error("Error starting audio playback:", error);
        });
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
