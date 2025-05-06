
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

export const useJanusInitialization = () => {
  const [isJanusConnected, setIsJanusConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const initializeJanus = useCallback(async (username?: string, password?: string, host?: string) => {
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
  }, [toast]);

  const registerWithJanus = useCallback(async (username: string, password: string, host: string) => {
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
  }, [isJanusConnected, initializeJanus, toast]);

  const handleError = useCallback((error: string) => {
    setErrorMessage(error);
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  return {
    isJanusConnected,
    isRegistered,
    errorMessage,
    initializeJanus,
    registerWithJanus,
    handleError,
    setIsJanusConnected,
    setIsRegistered
  };
};
