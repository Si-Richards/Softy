import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

export const useJanusSetup = () => {
  const [isJanusConnected, setIsJanusConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
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

    // Check if Janus is already initialized
    if (janusService.isRegistered()) {
      setIsJanusConnected(true);
      setIsRegistered(true);
    }

    return () => {
      // Don't disconnect on unmount - we want to keep the connection active for the entire app session
      // We'll handle disconnection separately when the user logs out or the app closes
    };
  }, [toast]);

  const initializeJanus = async (username?: string, password?: string, host?: string) => {
    try {
      setErrorMessage(null);
      
      await janusService.initialize({
        server: 'wss://devrtc.voicehost.io:443/janus',
        apiSecret: 'overlord',
        success: () => {
          setIsJanusConnected(true);
          toast({
            title: "WebRTC Ready",
            description: "Connected to Janus WebRTC server",
          });
          
          // If credentials are provided, attempt to register
          if (username && password && host) {
            registerWithJanus(username, password, host);
          }
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

  const registerWithJanus = async (username: string, password: string, host: string) => {
    try {
      if (!isJanusConnected) {
        await initializeJanus(username, password, host);
        return;
      }
      
      await janusService.register(username, password, host);
      setIsRegistered(true);
      toast({
        title: "SIP Registration Successful",
        description: "You are now registered with the SIP server",
      });
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Failed to register with SIP server");
      toast({
        title: "Registration Failed",
        description: "Failed to register with SIP server",
        variant: "destructive",
      });
    }
  };

  return {
    isJanusConnected,
    isRegistered,
    errorMessage,
    initializeJanus,
    registerWithJanus,
    janusService
  };
};
