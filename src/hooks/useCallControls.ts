
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";
import { useCallHistory } from "./useCallHistory";
import { AudioCallOptions } from "@/services/janus/sip/types";
import { AudioOutputHandler } from '@/services/janus/utils/audioOutputHandler';

export const useCallControls = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioTestInterval, setAudioTestInterval] = useState<NodeJS.Timeout | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { addCallToHistory } = useCallHistory();

  useEffect(() => {
    return () => {
      if (audioTestInterval) {
        clearInterval(audioTestInterval);
      }
    };
  }, [audioTestInterval]);

  useEffect(() => {
    if (isCallActive) {
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
            
            if (!track.enabled) {
              console.log("Re-enabling disabled audio track");
              track.enabled = true;
            }
          });
          
          // Apply audio output device if supported
          const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
          if (savedAudioOutput) {
            AudioOutputHandler.setupRemoteAudio(remoteStream, savedAudioOutput);
          }
        }
      }, 3000);
      
      setAudioTestInterval(interval);
    }
    
    return () => {
      if (audioTestInterval) {
        clearInterval(audioTestInterval);
        setAudioTestInterval(null);
      }
    };
  }, [isCallActive]);

  const getAudioOptions = (): AudioCallOptions => {
    // Get stored audio settings
    let audioSettings: any = {};
    try {
      const storedSettings = localStorage.getItem('audioSettings');
      if (storedSettings) {
        audioSettings = JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error("Error parsing audio settings:", error);
    }
    
    // Get selected devices
    const audioInput = localStorage.getItem('selectedAudioInput');
    const audioOutput = localStorage.getItem('selectedAudioOutput');
    
    return {
      audioInput,
      audioOutput,
      echoCancellation: audioSettings.echoSuppression,
      noiseSuppression: audioSettings.noiseCancellation,
      autoGainControl: audioSettings.autoGainControl
    };
  };

  const handleCall = async (number: string, isJanusConnected: boolean) => {
    if (isCallActive) {
      try {
        if (isJanusConnected) {
          await janusService.hangup();
        }
        
        // Log the call to history when ended
        if (callStartTime) {
          const now = new Date();
          const durationMs = now.getTime() - callStartTime.getTime();
          const minutes = Math.floor(durationMs / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          addCallToHistory({
            number,
            name: number, // In a real app, this would be looked up from contacts
            time: callStartTime,
            duration: durationStr,
            type: "outgoing",
            status: "completed"
          });
        }
        
        setIsCallActive(false);
        setCallStartTime(null);
        
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
          // Fix: Make sure number is properly formatted for SIP URI
          let formattedNumber = number;
          
          // If number doesn't include sip: prefix or domain, format it
          if (!formattedNumber.includes('@') && !formattedNumber.startsWith('sip:')) {
            // Get the current SIP domain from the credentials
            let sipDomain = '';
            try {
              const credentials = JSON.parse(localStorage.getItem('sipCredentials') || '{}');
              if (credentials.sipHost) {
                sipDomain = credentials.sipHost.split(':')[0]; // Remove port if present
              }
            } catch (e) {
              console.error("Error parsing stored credentials:", e);
            }
            
            // If we have a domain, use it, otherwise use a default
            if (sipDomain) {
              formattedNumber = `${formattedNumber}@${sipDomain}`;
            }
          }
          
          console.log("Calling formatted number:", formattedNumber);
          
          // Get audio options with selected audio devices
          const audioOptions = getAudioOptions();
          console.log("Using audio options:", audioOptions);
          
          // Show toast notification that call is connecting
          toast({
            title: "Calling...",
            description: `Dialing ${number}`,
            duration: 3000,
          });
          
          await janusService.call(formattedNumber, audioOptions);
          setIsCallActive(true);
          setCallStartTime(new Date());
          
          // Show connected toast
          toast({
            title: "Connected",
            description: `Call connected to ${number}`,
            duration: 3000,
          });
          
          // Ensure audio output is set correctly
          const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
          setTimeout(() => {
            const remoteStream = janusService.getRemoteStream();
            if (remoteStream && savedAudioOutput) {
              AudioOutputHandler.setupRemoteAudio(remoteStream, savedAudioOutput);
            }
          }, 1000); // Short delay to ensure stream is available
          
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
                
                if (!track.enabled) {
                  console.log("Re-enabling disabled audio track");
                  track.enabled = true;
                }
              });
              
              // Apply audio output device if supported
              const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
              if (savedAudioOutput) {
                let audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
                if (audioElement && 'setSinkId' in HTMLAudioElement.prototype) {
                  (audioElement as any).setSinkId(savedAudioOutput)
                    .catch((e: any) => console.warn("Couldn't set audio output:", e));
                }
              }
            }
          }, 3000);
          
          setAudioTestInterval(interval);
        } catch (error) {
          console.error("Error making call:", error);
          toast({
            title: "Call Failed",
            description: "Failed to establish WebRTC call",
            variant: "destructive",
          });
          
          // Log failed call to history
          addCallToHistory({
            number,
            name: number,
            time: new Date(),
            duration: "-",
            type: "outgoing",
            status: "missed"
          });
        }
      } else {
        setIsCallActive(true);
        setCallStartTime(new Date());
        
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

  return {
    isCallActive,
    muted,
    handleCall,
    toggleMute,
  };
};
