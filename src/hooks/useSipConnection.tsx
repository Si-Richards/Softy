
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

export type SipConnectionStatus = "idle" | "connecting" | "connected" | "failed";

export interface UseSipConnectionResult {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  sipHost: string;
  setSipHost: (value: string) => void;
  isLoading: boolean;
  registrationStatus: SipConnectionStatus;
  errorMessage: string | null;
  progressValue: number;
  handleSave: () => Promise<void>;
  handleForgetCredentials: () => void;
}

export function useSipConnection(): UseSipConnectionResult {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sipHost, setSipHost] = useState("hpbx.voicehost.co.uk:5060");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<SipConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  
  const { toast } = useToast();
  
  // Function to simulate connection progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading && registrationStatus === "connecting") {
      interval = setInterval(() => {
        setProgressValue(prev => {
          const newValue = prev + 5;
          if (newValue >= 95) {
            clearInterval(interval);
            return 95; // Cap at 95% until actual success/failure
          }
          return newValue;
        });
      }, 300);
    } else {
      // Reset progress when not loading
      setProgressValue(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, registrationStatus]);

  // Function to save credentials and connect
  const handleSave = async () => {
    // Form validation
    if (!username || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRegistrationStatus("connecting");
    setErrorMessage(null);
    setProgressValue(0);

    try {
      // Initialize Janus if not already connected
      if (!janusService.isJanusConnected()) {
        console.log("Initializing Janus connection...");
        await janusService.initialize({
          server: 'wss://devrtc.voicehost.io:443/janus',
          apiSecret: 'overlord',
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ],
          success: () => {
            console.log("Janus initialized successfully");
            setProgressValue(40);
          },
          error: (error) => {
            console.error("Janus initialization error:", error);
            throw new Error(`Connection error: ${error}`);
          }
        });
      }

      // Set up event handlers
      janusService.setOnRegistrationSuccess(() => {
        console.log("SIP Registration successful");
        setRegistrationStatus("connected");
        setIsLoading(false);
        setProgressValue(100);
        
        // Save credentials to localStorage
        try {
          localStorage.setItem('sipCredentials', JSON.stringify({ 
            username, 
            password, 
            sipHost
          }));
        } catch (error) {
          console.error("Error saving credentials:", error);
        }
        
        toast({
          title: "Registration Successful",
          description: "SIP credentials saved and connected",
        });
      });
      
      janusService.setOnRegistrationFailed((error) => {
        console.error("SIP registration failed:", error);
        setRegistrationStatus("failed");
        setIsLoading(false);
        setErrorMessage(error);
        setProgressValue(0);
        toast({
          title: "Registration Failed",
          description: error,
          variant: "destructive",
        });
      });
      
      janusService.setOnError((error) => {
        console.error("SIP error:", error);
        setRegistrationStatus("failed");
        setIsLoading(false);
        setErrorMessage(error);
        setProgressValue(0);
        toast({
          title: "SIP Error",
          description: error,
          variant: "destructive",
        });
      });
      
      // Set progress to indicate we're about to register
      setProgressValue(60);
      
      // Register with SIP server
      await janusService.register(username, password, sipHost);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      setRegistrationStatus("failed");
      setIsLoading(false);
      setErrorMessage(error.message || String(error));
      setProgressValue(0);
      toast({
        title: "Registration Error",
        description: error.message || String(error),
        variant: "destructive",
      });
    }
  };

  // Function to forget credentials
  const handleForgetCredentials = () => {
    try {
      localStorage.removeItem('sipCredentials');
    } catch (error) {
      console.error("Error removing stored credentials:", error);
    }

    setUsername("");
    setPassword("");
    setSipHost("hpbx.voicehost.co.uk:5060");
    setRegistrationStatus("idle");
    setErrorMessage(null);
    setProgressValue(0);
    
    // Disconnect from Janus
    if (janusService.isJanusConnected()) {
      janusService.disconnect();
    }
    
    toast({
      title: "Credentials Removed",
      description: "Your SIP credentials have been forgotten",
    });
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    sipHost,
    setSipHost,
    isLoading,
    registrationStatus,
    errorMessage,
    progressValue,
    handleSave,
    handleForgetCredentials
  };
}
