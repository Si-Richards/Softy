
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

export const useJanusSetup = () => {
  const [isJanusConnected, setIsJanusConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up Janus event handlers
    janusService.setOnIncomingCall((from) => {
      toast({
        title: "Incoming Call",
        description: `Call from ${from}`,
      });
    });

    janusService.setOnCallConnected(() => {
      toast({
        title: "Call Connected",
        description: "You are now connected",
      });
    });

    janusService.setOnCallEnded(() => {
      toast({
        title: "Call Ended",
        description: "The call has ended",
      });
    });

    janusService.setOnError((error) => {
      setErrorMessage(error);
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    });

    return () => {
      if (isJanusConnected) {
        janusService.disconnect();
      }
    };
  }, [toast, isJanusConnected]);

  const initializeJanus = async () => {
    try {
      await janusService.initialize({
        server: 'wss://devrtc.voicehost.io:443/janus',
        apiSecret: 'overlord',
        success: () => {
          setIsJanusConnected(true);
          toast({
            title: "WebRTC Ready",
            description: "Connected to Janus WebRTC server",
          });
          registerWithJanus();
        },
        error: (error) => {
          console.error("Janus initialization error:", error);
          setErrorMessage("Failed to connect to WebRTC server");
        }
      });
    } catch (error) {
      console.error("Janus initialization error:", error);
      setErrorMessage("Failed to connect to WebRTC server");
    }
  };

  const registerWithJanus = async () => {
    try {
      const username = "user_" + Math.floor(Math.random() * 10000);
      await janusService.register(username);
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Failed to register with WebRTC server");
    }
  };

  return {
    isJanusConnected,
    errorMessage,
    initializeJanus,
    janusService
  };
};
