
import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

export const useJanusInitialization = () => {
  const [isJanusConnected, setIsJanusConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Check initial state on mount
  useEffect(() => {
    // Check if already connected
    if (janusService.isJanusConnected()) {
      console.log("Janus already connected on mount");
      setIsJanusConnected(true);
      
      if (janusService.isRegistered()) {
        console.log("SIP already registered on mount");
        setIsRegistered(true);
      }
    }
  }, []);

  const initializeJanus = useCallback(async (username?: string, password?: string, host?: string) => {
    try {
      setErrorMessage(null);
      console.log("Initializing Janus connection...");
      
      await janusService.initialize({
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
        }
      });
    } catch (error) {
      console.error("Janus initialization error:", error);
      setErrorMessage("Failed to connect to WebRTC server");
      setIsJanusConnected(false);
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
      await janusService.register(username, password, host);
      
      // Set a timeout to verify registration was successful
      setTimeout(() => {
        if (janusService.isRegistered()) {
          console.log("SIP registration confirmed successful");
          setIsRegistered(true);
          toast({
            title: "SIP Registration Successful",
            description: "You are now registered with the SIP server",
          });
        } else {
          console.warn("SIP registration check failed");
          setIsRegistered(false);
          setErrorMessage("Registration didn't complete properly. Please try again.");
        }
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Failed to register with SIP server");
      setIsRegistered(false);
      toast({
        title: "Registration Failed",
        description: "Failed to register with SIP server",
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
