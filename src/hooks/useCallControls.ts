
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

export const useCallControls = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [audioTestInterval, setAudioTestInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Clean up audio test interval on unmount
  useEffect(() => {
    return () => {
      if (audioTestInterval) {
        clearInterval(audioTestInterval);
      }
    };
  }, [audioTestInterval]);

  const handleCall = async (number: string, isJanusConnected: boolean) => {
    if (isCallActive) {
      try {
        if (isJanusConnected) {
          await janusService.hangup();
        }
        setIsCallActive(false);
        setIsVideoEnabled(false);
        
        // Clear any audio test interval
        if (audioTestInterval) {
          clearInterval(audioTestInterval);
          setAudioTestInterval(null);
        }
      } catch (error) {
        console.error("Error hanging up:", error);
      }
    } else if (number) {
      if (isJanusConnected) {
        try {
          await janusService.call(number);
          setIsCallActive(true);
          
          // Set up audio level testing
          const interval = setInterval(() => {
            const remoteStream = janusService.getRemoteStream();
            if (remoteStream) {
              console.log("Remote stream audio tracks:", remoteStream.getAudioTracks().length);
              remoteStream.getAudioTracks().forEach(track => {
                console.log("Remote audio track enabled:", track.enabled, "readyState:", track.readyState);
              });
            }
          }, 5000);
          setAudioTestInterval(interval);
        } catch (error) {
          console.error("Error making call:", error);
          toast({
            title: "Call Failed",
            description: "Failed to establish WebRTC call",
            variant: "destructive",
          });
        }
      } else {
        setIsCallActive(true);
        toast({
          title: "Simulated Call",
          description: "WebRTC server not connected. This is a simulated call.",
        });
      }
    }
  };

  const toggleMute = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);
    
    if (janusService.getLocalStream()) {
      janusService.getLocalStream()?.getAudioTracks().forEach(track => {
        console.log("Setting audio track enabled:", !newMutedState);
        track.enabled = !newMutedState;
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (janusService.getLocalStream()) {
      janusService.getLocalStream()?.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
  };

  const startVideoCall = (number: string) => {
    if (number) {
      setIsCallActive(true);
      setIsVideoEnabled(true);
    }
  };

  return {
    isCallActive,
    muted,
    isVideoEnabled,
    handleCall,
    toggleMute,
    toggleVideo,
    startVideoCall,
  };
};
