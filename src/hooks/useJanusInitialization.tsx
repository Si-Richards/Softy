
import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import improvedJanusService from "@/services/ImprovedJanusService";

export const useJanusInitialization = () => {
  const [isJanusConnected, setIsJanusConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Check initial state on mount
  useEffect(() => {
    // Check if already connected
    if (improvedJanusService.isJanusConnected()) {
      console.log("Janus already connected on mount");
      setIsJanusConnected(true);
      
      if (improvedJanusService.isRegistered()) {
        console.log("SIP already registered on mount");
        setIsRegistered(true);
      }
    }
  }, []);

  const initializeJanus = useCallback(async (username?: string, password?: string, host?: string) => {
    try {
      setErrorMessage(null);
      console.log("Initializing Janus connection...");
      
      await improvedJanusService.initialize({
        server: 'wss://devrtc.voicehost.io:443/janus',
        apiSecret: 'overlord',
        success: () => {
          console.log("Janus initialized successfully");
          setIsJanusConnected(true);
          toast({
            title: "WebRTC Ready",
            description: "Connected to Janus WebRTC server",
          });
          
          // If credentials are provided, attempt to register
          if (username && password && host) {
            console.log("Credentials provided, attempting registration...");
            registerWithJanus(username, password, host);
          }
        },
        error: (error) => {
          console.error("Janus initialization error:", error);
          setErrorMessage("Failed to connect to WebRTC server");
          setIsJanusConnected(false);
          toast({
            title: "Connection Failed",
            description: "Could not connect to WebRTC server. Please check your network connection.",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Janus initialization error:", error);
      setErrorMessage("Failed to connect to WebRTC server");
      setIsJanusConnected(false);
      toast({
        title: "Connection Error",
        description: `WebRTC connection failed: ${error}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const registerWithJanus = useCallback(async (username: string, password: string, host: string) => {
    try {
      if (!isJanusConnected) {
        console.log("Janus not connected, initializing before registration");
        await initializeJanus(username, password, host);
        return;
      }
      
      console.log(`Attempting SIP registration for ${username}@${host}`);
      
      // Log registration attempt with detailed parameters
      console.log(`Registration parameters: username=${username}, host=${host}`);
      
      await improvedJanusService.register(username, password, host);
      
      // Registration status will be updated by event handlers
      // No need for timeout since we have proper event handling now
      console.log("SIP registration request sent, waiting for server response...");
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Failed to register with SIP server");
      setIsRegistered(false);
      toast({
        title: "Registration Failed",
        description: "Failed to register with SIP server. Please check your credentials.",
        variant: "destructive",
      });
    }
  }, [isJanusConnected, initializeJanus, toast]);

  const handleError = useCallback((error: string) => {
    console.error("Error from Janus:", error);
    setErrorMessage(error);
    
    if (error.includes("SIP registration") || error.includes("Registration")) {
      setIsRegistered(false);
    }
    
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
