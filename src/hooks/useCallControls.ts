
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
          
          // More frequent and detailed audio monitoring
          const interval = setInterval(() => {
            const remoteStream = janusService.getRemoteStream();
            if (remoteStream) {
              console.log("Remote stream audio monitoring:");
              console.log("- Audio tracks count:", remoteStream.getAudioTracks().length);
              
              remoteStream.getAudioTracks().forEach((track, idx) => {
                console.log(`- Audio track ${idx}:`, {
                  enabled: track.enabled,
                  muted: track.muted,
                  readyState: track.readyState,
                  id: track.id
                });
                
                // Ensure tracks are enabled (emergency fix)
                if (!track.enabled) {
                  console.log("Re-enabling disabled audio track");
                  track.enabled = true;
                }
              });
              
              // Check if audio output is actually working
              console.log("- Stream active:", remoteStream.active);
            } else {
              console.warn("No remote stream available for audio monitoring");
            }
          }, 3000); // Check every 3 seconds
          
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
